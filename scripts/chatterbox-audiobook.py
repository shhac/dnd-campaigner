#!/usr/bin/env python3
"""
Audiobook generation pipeline using Chatterbox TTS with voice cloning.

Usage:
    python scripts/chatterbox-audiobook.py segment <campaign> --chapter N
    python scripts/chatterbox-audiobook.py segment <campaign> --chapters N-M
    python scripts/chatterbox-audiobook.py generate <campaign> --chapter N [--resume]
    python scripts/chatterbox-audiobook.py generate <campaign> --chapters N-M [--resume]
    python scripts/chatterbox-audiobook.py assemble <campaign> --chapter N [--format mp3] [--quality high]
    python scripts/chatterbox-audiobook.py assemble <campaign> --chapters N-M [--clean]

Segment: Parse chapter markdown, detect voice boundaries, create segment files
Generate: Load Chatterbox Turbo, generate WAV files for each segment
Assemble: Apply fades, concatenate segments, encode to MP3 with metadata

Options:
    --chapter N       Process a single chapter
    --chapters N-M    Process a range of chapters (e.g., 1-5)
    --clean           Remove intermediate WAV files after assembly (assemble only)
"""

import argparse
import hashlib
import re
import shutil
import subprocess
import sys
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import yaml

# Add repo root to path for imports
REPO_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(REPO_ROOT))

# ============================================================================
# Constants and Configuration
# ============================================================================

VOICES_DIR = REPO_ROOT / '.chatterbox-voices'

# Segment type profiles: baseline TTS parameters
SEGMENT_TYPE_PROFILES = {
    'narration': {'exaggeration': 0.35, 'cfg_weight': 0.5},
    'dialogue': {'exaggeration': 0.6, 'cfg_weight': 0.55},
    'internal_thought': {'exaggeration': 0.25, 'cfg_weight': 0.4},
    'dialogue_whispered': {'exaggeration': 0.3, 'cfg_weight': 0.35},
    'dialogue_shouted': {'exaggeration': 0.75, 'cfg_weight': 0.65},
    'scene_break': {},  # No TTS settings
}

# Speech verb modifiers: adjustments to base dialogue profile
SPEECH_VERB_MODIFIERS = {
    'whispered': {'exaggeration_delta': -0.3, 'cfg_weight_delta': -0.2, 'result_type': 'dialogue_whispered'},
    'murmured': {'exaggeration_delta': -0.3, 'cfg_weight_delta': -0.2, 'result_type': 'dialogue_whispered'},
    'shouted': {'exaggeration_delta': 0.15, 'cfg_weight_delta': 0.1, 'result_type': 'dialogue_shouted'},
    'yelled': {'exaggeration_delta': 0.15, 'cfg_weight_delta': 0.1, 'result_type': 'dialogue_shouted'},
    'screamed': {'exaggeration_delta': 0.15, 'cfg_weight_delta': 0.1, 'result_type': 'dialogue_shouted'},
    'muttered': {'exaggeration_delta': -0.15, 'cfg_weight_delta': -0.1, 'result_type': None},
    'grumbled': {'exaggeration_delta': -0.15, 'cfg_weight_delta': -0.1, 'result_type': None},
    'exclaimed': {'exaggeration_delta': 0.1, 'cfg_weight_delta': 0.05, 'result_type': None},
    'drawled': {'exaggeration_delta': -0.1, 'cfg_weight_delta': -0.15, 'result_type': None},
    'droned': {'exaggeration_delta': -0.1, 'cfg_weight_delta': -0.15, 'result_type': None},
    'hissed': {'exaggeration_delta': 0.05, 'cfg_weight_delta': -0.1, 'result_type': None},
}

# Segment length constraints (words)
MIN_SEGMENT_WORDS = {
    'dialogue': 8,
    'narration': 30,
    'internal_thought': 10,
}
MAX_SEGMENT_WORDS = 150

# Minimum words for valid segment (excluding punctuation)
MIN_VALID_SEGMENT_WORDS = 2

# Pause timing (seconds)
PAUSE_RULES = {
    ('narration', 'dialogue'): (0.3, 0.5),
    ('dialogue', 'narration'): (0.3, 0.5),
    ('dialogue', 'dialogue_different'): (0.5, 0.7),
    ('dialogue', 'dialogue_same'): (0.1, 0.2),
    ('any', 'internal_thought'): (0.2, 0.3),
}
SCENE_BREAK_PAUSE = 1.5

# Paralinguistic tag patterns (for Turbo model)
PARALINGUISTIC_PATTERNS = {
    r'\blaughed\b|\blaughing\b': '[laugh]',
    r'\bchuckled\b|\bchuckling\b': '[chuckle]',
    r'\bcoughed\b|\bcoughing\b': '[cough]',
    r'\bsighed\b|\bsighing\b': '[sigh]',
}

# Words that look like names (capitalized) but are not speaker names
# These should not be extracted as dialogue attribution subjects
NON_NAME_WORDS = {
    # Personal pronouns (critical - these appear capitalized at sentence start)
    'he', 'she', 'they', 'it', 'him', 'her', 'them', 'his', 'hers', 'its',
    'i', 'me', 'my', 'mine', 'we', 'us', 'our', 'ours', 'you', 'your', 'yours',
    # Demonstratives and interrogatives
    'there', 'that', 'what', 'when', 'where', 'this', 'these', 'those',
    'here', 'then', 'thus', 'such', 'which', 'while', 'though', 'through',
    # Prepositions and positional
    'after', 'before', 'above', 'below', 'between', 'beyond', 'until',
    # Adverbs of degree and frequency
    'still', 'just', 'only', 'even', 'also', 'both', 'each', 'every',
    'never', 'always', 'often', 'sometimes', 'usually', 'once', 'twice',
    # Quantifiers and pronouns
    'some', 'many', 'much', 'more', 'most', 'other', 'another', 'either',
    'neither', 'nothing', 'something', 'everything', 'anything', 'someone',
    'everyone', 'anyone', 'nobody', 'everybody', 'anybody', 'somewhere',
    'everywhere', 'anywhere', 'nowhere', 'somehow', 'perhaps', 'maybe',
    # Time words
    'now', 'today', 'tomorrow', 'yesterday', 'soon', 'later',
    # Comparison words
    'rather', 'better', 'worse', 'less', 'fewer',
    # Modal verbs
    'would', 'could', 'should', 'might', 'must',
    # Common adverbs
    'suddenly', 'finally', 'really', 'quite', 'very', 'too',
    # Narrative transitions
    'meanwhile', 'however', 'therefore', 'otherwise', 'nonetheless',
}


# ============================================================================
# Data Classes
# ============================================================================

@dataclass
class Chunk:
    """A piece of text with voice and type information."""
    text: str
    voice: str
    segment_type: str
    speaker: Optional[str] = None
    speech_verb: Optional[str] = None


@dataclass
class Segment:
    """A segment ready for TTS generation."""
    number: int
    segment_type: str
    text: str = ''
    voice: str = ''
    speaker: Optional[str] = None
    speech_verb: Optional[str] = None
    pause_before_sec: float = 0.0
    exaggeration: float = 0.5
    cfg_weight: float = 0.5
    paralinguistic_tags: list = field(default_factory=list)

    @property
    def word_count(self) -> int:
        return len(self.text.split())

    @property
    def char_count(self) -> int:
        return len(self.text)

    @property
    def estimated_duration_sec(self) -> float:
        return self.word_count * 0.25  # ~0.25 sec per word


# NOTE: AudioPromptCache removed - Chatterbox API expects audio_prompt_path (string)
# not audio_prompt (tensor). The model handles file loading internally.


# ============================================================================
# Utility Functions
# ============================================================================

def get_campaign_dir(campaign: str) -> Path:
    """Get the campaign directory path."""
    return REPO_ROOT / 'campaigns' / campaign


def get_novel_dir(campaign: str) -> Path:
    """Get the novel directory path."""
    return get_campaign_dir(campaign) / 'novel'


def get_chatterbox_dir(campaign: str) -> Path:
    """Get the chatterbox intermediate files directory."""
    return get_novel_dir(campaign) / 'chatterbox'


def get_chapter_dir(campaign: str, chapter: int) -> Path:
    """Get the chapter-specific directory for segments."""
    return get_chatterbox_dir(campaign) / f'chapter-{chapter}'


def get_audiobook_state_path(campaign: str) -> Path:
    """Get the path to the global audiobook-state.yaml file."""
    return get_chatterbox_dir(campaign) / 'audiobook-state.yaml'


def get_audiobook_state(campaign: str) -> dict:
    """Read the global audiobook-state.yaml file.

    Returns the current state or an empty structure if the file doesn't exist.
    """
    state_path = get_audiobook_state_path(campaign)
    if state_path.exists():
        return yaml.safe_load(state_path.read_text()) or {}
    return {
        'campaign': campaign,
        'started': None,
        'last_updated': None,
        'chapters': {}
    }


def update_audiobook_state(campaign: str, chapter_num: int, status: str, details: dict = None):
    """Update the global audiobook-state.yaml file.

    Args:
        campaign: Campaign name
        chapter_num: Chapter number being processed
        status: Status of the chapter (pending, segmenting, segmented, generating,
                generated, assembling, complete, failed)
        details: Optional dict with additional details (error message, duration, etc.)
    """
    state_path = get_audiobook_state_path(campaign)

    # Ensure parent directory exists
    state_path.parent.mkdir(parents=True, exist_ok=True)

    if state_path.exists():
        state = yaml.safe_load(state_path.read_text()) or {}
    else:
        state = {
            'campaign': campaign,
            'started': datetime.now(timezone.utc).isoformat(),
            'chapters': {}
        }

    # Ensure chapters dict exists
    if 'chapters' not in state:
        state['chapters'] = {}

    state['last_updated'] = datetime.now(timezone.utc).isoformat()

    # Build chapter state
    chapter_state = {
        'status': status,
        'updated': datetime.now(timezone.utc).isoformat(),
    }
    if details:
        chapter_state.update(details)

    state['chapters'][chapter_num] = chapter_state

    atomic_write_yaml(state_path, state)


def parse_chapter_range(chapter_arg: Optional[int], chapters_arg: Optional[str]) -> list[int]:
    """Parse --chapter N or --chapters N-M into list of chapter numbers."""
    if chapter_arg is not None:
        return [chapter_arg]
    if chapters_arg:
        if '-' in chapters_arg:
            start, end = chapters_arg.split('-')
            return list(range(int(start), int(end) + 1))
        return [int(chapters_arg)]
    return []


def compute_file_hash(path: Path) -> str:
    """Compute SHA256 hash of a file."""
    if not path.exists():
        return ''
    return f"sha256:{hashlib.sha256(path.read_bytes()).hexdigest()[:16]}"


def atomic_write_yaml(path: Path, data: dict):
    """Write YAML file atomically to prevent corruption."""
    temp_path = path.with_suffix('.yaml.tmp')
    temp_path.write_text(yaml.dump(data, default_flow_style=False, sort_keys=False, allow_unicode=True))
    temp_path.rename(path)


def atomic_write_text(path: Path, content: str):
    """Write text file atomically using temp file + rename."""
    temp_path = path.with_suffix(path.suffix + '.tmp')
    temp_path.write_text(content)
    temp_path.rename(path)


def parse_frontmatter(content: str) -> dict:
    """Extract YAML frontmatter from markdown."""
    if not content.startswith('---'):
        return {}

    parts = content.split('---', 2)
    if len(parts) < 3:
        return {}

    frontmatter = {}
    for line in parts[1].strip().split('\n'):
        if ':' in line:
            key, value = line.split(':', 1)
            value = value.strip().strip('"').strip("'")
            frontmatter[key.strip()] = value

    return frontmatter


def load_voices_yaml(campaign: str) -> dict:
    """Load the voices.yaml file for a campaign."""
    voices_path = get_novel_dir(campaign) / 'voices.yaml'
    if voices_path.exists():
        return yaml.safe_load(voices_path.read_text()) or {}
    return {}


def resolve_voice_alias(voice: str, voices_yaml: dict) -> tuple[str, dict]:
    """Resolve a voice name to its canonical name and character info.

    Supports aliases defined in character entries:
        characters:
          seraphine-duskhollow:
            aliases: [seraphine, sera]
            chatterbox:
              voice: narrator-female

    Returns (canonical_name, char_info) or (voice, {}) if not found.
    """
    # Try direct match at root level first
    if voice in voices_yaml:
        char_info = voices_yaml[voice]
        if isinstance(char_info, dict):
            return voice, char_info

    # Try direct match in characters wrapper
    characters = voices_yaml.get('characters', {})
    if voice in characters:
        char_info = characters[voice]
        if isinstance(char_info, dict):
            return voice, char_info

    # Search for alias matches at root level
    for char_name, char_info in voices_yaml.items():
        if char_name in ('narrator', 'characters', 'npcs'):
            continue
        if isinstance(char_info, dict):
            aliases = char_info.get('aliases', [])
            if voice in aliases:
                return char_name, char_info

    # Search for alias matches in characters wrapper
    for char_name, char_info in characters.items():
        if isinstance(char_info, dict):
            aliases = char_info.get('aliases', [])
            if voice in aliases:
                return char_name, char_info

    # Search for alias matches in npcs wrapper
    npcs = voices_yaml.get('npcs', {})
    for npc_name, npc_info in npcs.items():
        if isinstance(npc_info, dict):
            aliases = npc_info.get('aliases', [])
            if voice in aliases or voice == npc_name:
                return npc_name, npc_info

    return voice, {}


def is_voice_recognized(voice: str, voices_yaml: dict) -> tuple[bool, str]:
    """Check if a voice is recognized in voices.yaml.

    Returns (is_recognized, canonical_name_or_voice).
    """
    # Skip special cases
    if voice in ('narration', 'narrator-male', 'narrator-female'):
        return True, voice

    canonical_name, char_info = resolve_voice_alias(voice, voices_yaml)
    if char_info:
        return True, canonical_name
    return False, voice


def get_voice_sample_path(voice: str, voices_yaml: dict) -> Path:
    """Get the path to a voice sample file.

    Supports the namespaced voices.yaml format (character at root level):
        corwin-voss:
          chatterbox:
            voice: narrator-male
            gender: male

    Also supports legacy format with 'characters' wrapper for backwards compatibility:
        characters:
          corwin-voss:
            chatterbox:
              voice: narrator-male

    Also supports aliases:
        characters:
          seraphine-duskhollow:
            aliases: [seraphine, sera]
            chatterbox:
              voice: narrator-female
    """
    # Resolve any aliases first
    canonical_name, char_info = resolve_voice_alias(voice, voices_yaml)

    # If we found character info, use it
    if char_info:
        chatterbox_info = char_info.get('chatterbox', {})
        if chatterbox_info:
            voice_name = chatterbox_info.get('voice', canonical_name)
            sample_path = VOICES_DIR / f'{voice_name}.wav'
            if sample_path.exists():
                return sample_path

    # Check for character-specific sample
    char_sample = VOICES_DIR / f'{voice}.wav'
    if char_sample.exists():
        return char_sample

    # Fall back to narrator based on gender detection
    if voice.startswith('narrator-'):
        narrator_sample = VOICES_DIR / f'{voice}.wav'
        if narrator_sample.exists():
            return narrator_sample

    # Default to male narrator
    default_sample = VOICES_DIR / 'narrator-male.wav'
    if default_sample.exists():
        return default_sample

    return None


def get_narrator_voice(pov: str, voices_yaml: dict) -> str:
    """Get the narrator voice for a POV character.

    Supports the namespaced voices.yaml format (character at root level):
        narrator:
          chatterbox:
            voice: narrator-male
        corwin-voss:
          chatterbox:
            voice: narrator-male
            gender: male

    Also supports legacy format with 'characters' wrapper and aliases.
    """
    # Check for explicit narrator voice in voices.yaml
    narrator_config = voices_yaml.get('narrator', {})
    if isinstance(narrator_config, dict):
        chatterbox_narrator = narrator_config.get('chatterbox', {})
        if chatterbox_narrator.get('voice'):
            return chatterbox_narrator['voice']

    # Use alias resolution to find character info
    canonical_name, char_info = resolve_voice_alias(pov, voices_yaml)
    if char_info:
        chatterbox_info = char_info.get('chatterbox', {})
        if chatterbox_info.get('gender'):
            gender = chatterbox_info['gender'].lower()
            return f'narrator-{gender}'

    # Default to male narrator
    return 'narrator-male'


def get_internal_thought_voice(pov: str, voices_yaml: dict) -> str:
    """Get the internal thought voice for a POV character based on their gender.

    Uses the internal_thoughts section of voices.yaml keyed by gender.
    Falls back to narrator voice if internal_thoughts not configured.
    """
    # First determine the POV character's gender
    canonical_name, char_info = resolve_voice_alias(pov, voices_yaml)
    gender = 'male'  # default
    if char_info:
        chatterbox_info = char_info.get('chatterbox', {})
        if chatterbox_info.get('gender'):
            gender = chatterbox_info['gender'].lower()

    # Look up internal thought voice by gender
    internal_thoughts = voices_yaml.get('internal_thoughts', {})
    if gender in internal_thoughts:
        thought_config = internal_thoughts[gender]
        if isinstance(thought_config, dict):
            chatterbox_config = thought_config.get('chatterbox', {})
            if chatterbox_config.get('voice'):
                return chatterbox_config['voice']

    # Fall back to narrator voice
    return get_narrator_voice(pov, voices_yaml)


# ============================================================================
# Segmentation Logic
# ============================================================================

def is_valid_segment(text: str) -> bool:
    """Check if a segment has enough meaningful content to generate audio.

    Filters out:
    - Empty or whitespace-only segments
    - Punctuation-only segments (e.g., just "." or "?")
    - Segments with fewer than MIN_VALID_SEGMENT_WORDS actual words
    - Orphaned action phrases (e.g., ", meeting her eyes.")

    This prevents issues like:
    - Segments that are just "." after dialogue tag stripping
    - Orphaned fragments like ", meeting her eyes." becoming bad segments
    """
    if not text or not text.strip():
        return False

    stripped = text.strip()

    # Check for orphaned action phrases that start with comma or punctuation
    # These are narrative beats that got separated from dialogue
    # Pattern: starts with comma, has a gerund (-ing word)
    if re.match(r'^[,;]\s*(?:\w+\s+)*\w+ing\b', stripped, re.IGNORECASE):
        return False

    # Pattern: starts with comma and possessive action phrase
    # e.g., ", her voice soft." or ", his eyes narrowed."
    if re.match(r'^[,;]\s*(?:her|his|their|its)\s+(?:voice|eyes|face|hands?|tone|gaze)', stripped, re.IGNORECASE):
        return False

    # Remove punctuation and check remaining content
    # Keep alphanumeric characters and spaces only
    words_only = re.sub(r'[^\w\s]', '', stripped)
    words = words_only.split()

    # Must have at least MIN_VALID_SEGMENT_WORDS actual words
    return len(words) >= MIN_VALID_SEGMENT_WORDS


def is_scene_break(paragraph: str) -> bool:
    """Check if paragraph is a scene break marker."""
    stripped = paragraph.strip()
    return bool(re.match(r'^\*\s*\*\s*\*\s*$', stripped)) or stripped == '---'


def extract_speech_verb(text: str) -> Optional[str]:
    """Extract speech verb from dialogue attribution."""
    # Look for common speech verbs after closing quote
    verbs = list(SPEECH_VERB_MODIFIERS.keys()) + ['said', 'asked', 'replied', 'answered', 'stated', 'added']
    pattern = r'"[^"]*"\s*,?\s*(?:he|she|they|it|[A-Z][a-z]+)?\s*(' + '|'.join(verbs) + r')\b'
    match = re.search(pattern, text, re.IGNORECASE)
    if match:
        return match.group(1).lower()
    return None


def apply_speech_verb_modifier(segment_type: str, speech_verb: Optional[str],
                                base_exaggeration: float, base_cfg_weight: float) -> tuple[str, float, float]:
    """Apply speech verb modifiers to base TTS settings."""
    if not speech_verb or speech_verb not in SPEECH_VERB_MODIFIERS:
        return segment_type, base_exaggeration, base_cfg_weight

    modifier = SPEECH_VERB_MODIFIERS[speech_verb]
    new_type = modifier.get('result_type') or segment_type
    new_exaggeration = max(0.0, min(1.0, base_exaggeration + modifier.get('exaggeration_delta', 0)))
    new_cfg_weight = max(0.0, min(1.0, base_cfg_weight + modifier.get('cfg_weight_delta', 0)))

    return new_type, new_exaggeration, new_cfg_weight


def detect_paralinguistic_tags(text: str, context: str = '') -> list[str]:
    """Detect paralinguistic tags based on text context."""
    tags = []
    combined = f"{context} {text}".lower()
    for pattern, tag in PARALINGUISTIC_PATTERNS.items():
        if re.search(pattern, combined):
            tags.append(tag)
    return tags


def extract_speaker_from_context(text: str, last_named_speakers: dict) -> Optional[str]:
    """Extract a speaker name from narrative context.

    Looks for patterns like:
    - "Name's eyes narrowed" -> Name
    - "Name leaned forward" -> Name
    - "Name said" -> Name
    - References to track gender for pronoun resolution
    """
    # Pattern for names doing actions (Name + possessive or Name + verb)
    name_action_pattern = re.compile(
        r'\b([A-Z][a-z]+(?:[-\s][A-Z][a-z]+)?)'  # Name (possibly hyphenated or two words)
        r"(?:'s\s+\w+|\s+(?:said|asked|replied|leaned|turned|looked|smiled|frowned|nodded|shook|gestured|whispered|shouted|muttered|stepped|moved|reached|paused))"
    )

    match = name_action_pattern.search(text)
    if match:
        name = match.group(1).lower().replace(' ', '-')
        # Check if this is a non-name word (e.g., "There", "That", "What")
        if name in NON_NAME_WORDS:
            return None
        # Track gender based on surrounding pronouns
        if ' she ' in text.lower() or " her " in text.lower():
            last_named_speakers[name] = 'female'
        elif ' he ' in text.lower() or " his " in text.lower() or " him " in text.lower():
            last_named_speakers[name] = 'male'
        return name
    return None


def resolve_pronoun_to_speaker(pronoun: str, last_named_speakers: dict, recent_speakers: list) -> Optional[str]:
    """Resolve a pronoun to a speaker based on tracked gender."""
    pronoun = pronoun.lower()

    if pronoun in ('she', 'her'):
        # Find most recent female speaker
        for speaker in reversed(recent_speakers):
            if last_named_speakers.get(speaker) == 'female':
                return speaker
    elif pronoun in ('he', 'him', 'his'):
        # Find most recent male speaker
        for speaker in reversed(recent_speakers):
            if last_named_speakers.get(speaker) == 'male':
                return speaker

    return None


def strip_dialogue_tag(text: str) -> str:
    """Strip dialogue attribution tags from text for cleaner audiobook output.

    Removes patterns like:
    - ", she said" / ", he replied"
    - "she said," at start
    - Trailing attribution after dialogue
    - Trailing action phrases: ", meeting her eyes." / ", her voice soft."

    This prevents orphaned fragments like ", meeting her eyes." from becoming
    separate narration segments after dialogue is extracted.
    """
    # Common speech verbs for attribution
    speech_verbs = (
        r'said|asked|replied|whispered|shouted|muttered|exclaimed|murmured|'
        r'grumbled|drawled|droned|hissed|yelled|screamed|answered|stated|added'
    )

    # Remove trailing attribution: ", she said" or ", Name replied"
    text = re.sub(
        r',?\s*(?:she|he|they|it|[A-Z][a-z]+)\s+'
        r'(?:' + speech_verbs + r')'
        r'\.?\s*$',
        '',
        text,
        flags=re.IGNORECASE
    )

    # Remove trailing attribution with action phrase:
    # ", she said, meeting her eyes." or ", he replied, his voice soft."
    # Pattern: , [subject] [speech verb], [action phrase].
    text = re.sub(
        r',?\s*(?:she|he|they|it|[A-Z][a-z]+)\s+'
        r'(?:' + speech_verbs + r')'
        r',\s*[^"]+\.\s*$',
        '',
        text,
        flags=re.IGNORECASE
    )

    # Remove standalone trailing action phrases after dialogue extraction:
    # These are narrative beats that got orphaned, like ", meeting her eyes."
    # Pattern: starts with comma, has a gerund (-ing word), ends with period
    text = re.sub(
        r'^,\s*(?:her|his|their|its)?\s*\w+ing\s+[^"]*\.\s*$',
        '',
        text,
        flags=re.IGNORECASE
    )

    # Remove simple trailing action phrases: ", her voice soft." / ", eyes narrowed."
    text = re.sub(
        r',\s*(?:her|his|their|its)\s+(?:voice|eyes|face|hands?|tone|gaze)\s+\w+\.\s*$',
        '',
        text,
        flags=re.IGNORECASE
    )

    return text.strip()


def split_multi_speaker_paragraph(paragraph: str) -> list[str]:
    """Split a paragraph that contains multiple speakers into separate chunks.

    Detects patterns like:
    - "You up for it?" "Always." (two speakers, no attribution)
    - "First quote," she said. "Second quote," he replied. (two attributed quotes)

    This prevents issues like merging "You up for it? Always." into one segment
    when they're from different speakers.

    Returns a list of paragraph chunks to be processed separately.
    """
    # Speech verbs for detection
    speech_verbs = (
        r'said|asked|replied|whispered|shouted|muttered|exclaimed|murmured|'
        r'grumbled|drawled|droned|hissed|yelled|screamed|answered|stated|added'
    )

    # Find all quoted sections with their attributions
    # Pattern captures: "text" [, subject verb]
    quote_pattern = re.compile(
        r'"([^"]+)"'  # Quoted text
        r'(?:\s*,?\s*'  # Optional comma and space
        r'([A-Z][a-z]+(?:[-\s][A-Z][a-z]+)?|[Hh]e|[Ss]he|[Tt]hey|[Ii]t)\s+'  # Subject
        r'(' + speech_verbs + r')'  # Verb
        r')?'
    )

    quotes = list(quote_pattern.finditer(paragraph))

    # If fewer than 2 quotes, no multi-speaker issue
    if len(quotes) < 2:
        return [paragraph]

    # Check for adjacent quotes from different speakers
    # Look for patterns where quotes are close together and have different attributions
    chunks = []
    last_end = 0

    for i, match in enumerate(quotes):
        # Check if this quote and the next one appear to be from different speakers
        if i < len(quotes) - 1:
            next_match = quotes[i + 1]
            # Get attributions
            this_subject = match.group(2).lower() if match.group(2) else None
            next_subject = next_match.group(2).lower() if next_match.group(2) else None

            # Check for back-to-back quotes (very little text between them)
            text_between = paragraph[match.end():next_match.start()].strip()

            # If quotes are adjacent (< 3 chars between, like just punctuation/space)
            # and they have different explicit attributions, split them
            if len(text_between) < 3 and this_subject and next_subject:
                if this_subject != next_subject:
                    # Different speakers - split here
                    chunk_text = paragraph[last_end:match.end()].strip()
                    if chunk_text:
                        chunks.append(chunk_text)
                    last_end = next_match.start()

            # Also detect: "Quote" "Quote" pattern (adjacent quotes with no attribution)
            # These are often rapid exchanges between two characters
            elif len(text_between) == 0 or text_between in ('.', ',', '!', '?'):
                # Back-to-back quotes without text between - likely different speakers
                chunk_text = paragraph[last_end:match.end()].strip()
                if chunk_text:
                    chunks.append(chunk_text)
                last_end = next_match.start()

    # Add remaining text
    remaining = paragraph[last_end:].strip()
    if remaining:
        chunks.append(remaining)

    # If we only got one chunk, return original
    if len(chunks) <= 1:
        return [paragraph]

    return chunks


def detect_voice_boundaries(paragraph: str, pov: str, last_speakers: list[str],
                           speaker_genders: dict = None) -> list[Chunk]:
    """Detect voice boundaries within a paragraph.

    Improved speaker detection:
    - Extracts names from narrative context before dialogue
    - Resolves pronouns (he/she) to recent named speakers
    - Tracks speaker gender for pronoun resolution
    - Strips dialogue tags for cleaner audiobook output
    - Handles multi-speaker paragraphs by splitting them first
    """
    if speaker_genders is None:
        speaker_genders = {}

    chunks = []
    position = 0

    # Speech verbs for detection
    speech_verbs = (
        'said|asked|replied|whispered|shouted|muttered|exclaimed|murmured|'
        'grumbled|drawled|droned|hissed|yelled|screamed|answered|stated|added'
    )

    # Pattern for dialogue with optional attribution after
    # Captures: "dialogue text" [, subject verb]
    dialogue_with_attr_pattern = re.compile(
        r'"([^"]+)"'  # Quoted text
        r'(?:'  # Optional attribution group
        r'\s*,?\s*'  # Optional comma and space
        r'([A-Z][a-z]+(?:[-\s][A-Z][a-z]+)?|[Hh]e|[Ss]he|[Tt]hey|[Ii]t)\s+'  # Subject (name or pronoun)
        r'(' + speech_verbs + r')'  # Verb
        r')?'
    )

    # Pattern for attribution before dialogue: She said, "text"
    attr_before_pattern = re.compile(
        r'([A-Z][a-z]+(?:[-\s][A-Z][a-z]+)?|[Hh]e|[Ss]he|[Tt]hey)\s+'
        r'(' + speech_verbs + r')\s*,?\s*'
        r'"([^"]+)"'
    )

    # Pattern for internal thoughts (italics)
    thought_pattern = re.compile(r'\*([^*]+)\*')

    # Find all matches and sort by position
    all_matches = []

    # Check for attribution-before patterns first
    for match in attr_before_pattern.finditer(paragraph):
        all_matches.append(('dialogue_attr_before', match))

    for match in dialogue_with_attr_pattern.finditer(paragraph):
        # Skip if this overlaps with an attr_before match
        overlaps = False
        for mt, m in all_matches:
            if mt == 'dialogue_attr_before':
                if not (match.end() <= m.start() or match.start() >= m.end()):
                    overlaps = True
                    break
        if not overlaps:
            all_matches.append(('dialogue', match))

    for match in thought_pattern.finditer(paragraph):
        all_matches.append(('thought', match))

    all_matches.sort(key=lambda x: x[1].start())

    for match_type, match in all_matches:
        # Narration before this match
        if match.start() > position:
            narration_text = paragraph[position:match.start()].strip()
            if narration_text:
                # Check narration for speaker context
                context_speaker = extract_speaker_from_context(narration_text, speaker_genders)
                if context_speaker and context_speaker not in last_speakers:
                    last_speakers.append(context_speaker)

                if narration_text:
                    chunks.append(Chunk(
                        text=narration_text,
                        voice='narration',
                        segment_type='narration'
                    ))

        if match_type == 'dialogue':
            dialogue_text = match.group(1)
            subject = match.group(2) if len(match.groups()) > 1 and match.group(2) else None
            verb = match.group(3) if len(match.groups()) > 2 and match.group(3) else None

            # Determine speaker
            speaker = None

            if subject:
                subject_lower = subject.lower()
                # Check if this is a non-name word (e.g., "There", "That", "What")
                if subject_lower in NON_NAME_WORDS:
                    # Not a valid speaker name, treat as if no attribution
                    subject = None
                elif subject_lower in ('he', 'she', 'they', 'it', 'him', 'her'):
                    # Try to resolve pronoun
                    speaker = resolve_pronoun_to_speaker(subject_lower, speaker_genders, last_speakers)
                else:
                    # Use the name directly
                    speaker = subject_lower.replace(' ', '-')
                    # Track gender from context
                    if subject_lower in ('he', 'him', 'his'):
                        speaker_genders[speaker] = 'male'
                    elif subject_lower in ('she', 'her'):
                        speaker_genders[speaker] = 'female'

            if not speaker:
                # Look at preceding narration for context
                preceding_text = paragraph[:match.start()]
                context_speaker = extract_speaker_from_context(preceding_text, speaker_genders)
                if context_speaker:
                    speaker = context_speaker
                elif last_speakers:
                    # Alternate between last speakers
                    if len(last_speakers) >= 2:
                        speaker = last_speakers[-2] if last_speakers[-1] == pov else last_speakers[-1]
                    else:
                        speaker = last_speakers[-1]
                else:
                    speaker = pov

            chunks.append(Chunk(
                text=strip_dialogue_tag(dialogue_text),
                voice=speaker,
                segment_type='dialogue',
                speaker=speaker,
                speech_verb=verb
            ))

            # Update speaker tracking
            if speaker and speaker not in last_speakers[-3:]:
                last_speakers.append(speaker)
                if len(last_speakers) > 5:
                    last_speakers.pop(0)

        elif match_type == 'dialogue_attr_before':
            # Attribution before dialogue: She said, "text"
            subject = match.group(1)
            verb = match.group(2)
            dialogue_text = match.group(3)

            subject_lower = subject.lower()
            # Check if this is a non-name word (e.g., "There", "That", "What")
            if subject_lower in NON_NAME_WORDS:
                # Not a valid speaker name, fall back to context
                speaker = last_speakers[-1] if last_speakers else pov
            elif subject_lower in ('he', 'she', 'they', 'it'):
                speaker = resolve_pronoun_to_speaker(subject_lower, speaker_genders, last_speakers)
                if not speaker:
                    speaker = last_speakers[-1] if last_speakers else pov
            else:
                speaker = subject_lower.replace(' ', '-')

            chunks.append(Chunk(
                text=strip_dialogue_tag(dialogue_text),
                voice=speaker,
                segment_type='dialogue',
                speaker=speaker,
                speech_verb=verb
            ))

            if speaker and speaker not in last_speakers[-3:]:
                last_speakers.append(speaker)
                if len(last_speakers) > 5:
                    last_speakers.pop(0)

        elif match_type == 'thought':
            thought_text = match.group(1)
            chunks.append(Chunk(
                text=thought_text,
                voice=pov,
                segment_type='internal_thought',
                speaker=pov
            ))

        position = match.end()

    # Remaining narration after all matches
    if position < len(paragraph):
        remaining = paragraph[position:].strip()
        if remaining:
            chunks.append(Chunk(
                text=remaining,
                voice='narration',
                segment_type='narration'
            ))

    return chunks


def should_merge_segments(seg1: Segment, seg2: Segment) -> bool:
    """Determine if two segments should be merged."""
    # Don't merge scene breaks
    if seg1.segment_type == 'scene_break' or seg2.segment_type == 'scene_break':
        return False

    # Don't merge different voices
    if seg1.voice != seg2.voice:
        return False

    # Check if first segment is below minimum
    min_words = MIN_SEGMENT_WORDS.get(seg1.segment_type, MIN_SEGMENT_WORDS['narration'])
    if seg1.word_count >= min_words:
        return False

    # Check if combined would exceed maximum
    if seg1.word_count + seg2.word_count > MAX_SEGMENT_WORDS:
        return False

    return True


def split_segment_at_sentences(segment: Segment) -> list[Segment]:
    """Split a segment at sentence boundaries if it exceeds max length."""
    if segment.word_count <= MAX_SEGMENT_WORDS:
        return [segment]

    # Split on sentence boundaries
    sentences = re.split(r'(?<=[.!?])\s+', segment.text)
    segments = []
    current_text = []
    current_count = 0

    for sentence in sentences:
        sentence_words = len(sentence.split())
        if current_count + sentence_words > MAX_SEGMENT_WORDS and current_text:
            new_seg = Segment(
                number=0,  # Will be renumbered later
                segment_type=segment.segment_type,
                text=' '.join(current_text),
                voice=segment.voice,
                speaker=segment.speaker,
                speech_verb=segment.speech_verb,
                exaggeration=segment.exaggeration,
                cfg_weight=segment.cfg_weight,
            )
            segments.append(new_seg)
            current_text = [sentence]
            current_count = sentence_words
        else:
            current_text.append(sentence)
            current_count += sentence_words

    if current_text:
        new_seg = Segment(
            number=0,
            segment_type=segment.segment_type,
            text=' '.join(current_text),
            voice=segment.voice,
            speaker=segment.speaker,
            speech_verb=segment.speech_verb,
            exaggeration=segment.exaggeration,
            cfg_weight=segment.cfg_weight,
        )
        segments.append(new_seg)

    return segments


def calculate_pause_before(prev_segment: Optional[Segment], current_segment: Segment) -> float:
    """Calculate pause duration before a segment based on context."""
    if current_segment.segment_type == 'scene_break':
        return SCENE_BREAK_PAUSE

    if prev_segment is None:
        return 0.0

    prev_type = prev_segment.segment_type
    curr_type = current_segment.segment_type

    # Internal thought transitions
    if curr_type == 'internal_thought':
        return sum(PAUSE_RULES.get(('any', 'internal_thought'), (0.25, 0.25))) / 2

    # Dialogue transitions
    if 'dialogue' in prev_type and 'dialogue' in curr_type:
        if prev_segment.voice == current_segment.voice:
            return sum(PAUSE_RULES.get(('dialogue', 'dialogue_same'), (0.15, 0.15))) / 2
        else:
            return sum(PAUSE_RULES.get(('dialogue', 'dialogue_different'), (0.6, 0.6))) / 2

    # Narration <-> Dialogue transitions
    if prev_type == 'narration' and 'dialogue' in curr_type:
        return sum(PAUSE_RULES.get(('narration', 'dialogue'), (0.4, 0.4))) / 2

    if 'dialogue' in prev_type and curr_type == 'narration':
        return sum(PAUSE_RULES.get(('dialogue', 'narration'), (0.4, 0.4))) / 2

    return 0.0


def segment_chapter(chapter_text: str, pov: str, voices_yaml: dict) -> list[Segment]:
    """Parse chapter text and create segments with voice boundaries."""
    segments = []
    last_speakers = []
    narrator_voice = get_narrator_voice(pov, voices_yaml)
    internal_thought_voice = get_internal_thought_voice(pov, voices_yaml)

    # Remove frontmatter
    if chapter_text.startswith('---'):
        parts = chapter_text.split('---', 2)
        if len(parts) >= 3:
            chapter_text = parts[2]

    # Split into paragraphs
    paragraphs = [p.strip() for p in chapter_text.split('\n\n') if p.strip()]

    # Remove headers
    paragraphs = [p for p in paragraphs if not p.startswith('#')]

    for paragraph in paragraphs:
        # Handle scene breaks
        if is_scene_break(paragraph):
            segments.append(Segment(
                number=0,
                segment_type='scene_break',
                pause_before_sec=SCENE_BREAK_PAUSE
            ))
            continue

        # Split multi-speaker paragraphs before processing
        # This handles cases like "You up for it?" "Always." from different speakers
        para_chunks = split_multi_speaker_paragraph(paragraph)

        for para_chunk in para_chunks:
            # Detect voice boundaries within paragraph chunk
            chunks = detect_voice_boundaries(para_chunk, pov, last_speakers)

            for chunk in chunks:
                # Skip invalid segments (punctuation-only, too short, etc.)
                if not is_valid_segment(chunk.text):
                    continue

                # Get base profile
                profile = SEGMENT_TYPE_PROFILES.get(chunk.segment_type, SEGMENT_TYPE_PROFILES['narration'])
                base_exag = profile.get('exaggeration', 0.5)
                base_cfg = profile.get('cfg_weight', 0.5)

                # Apply speech verb modifiers
                final_type, final_exag, final_cfg = apply_speech_verb_modifier(
                    chunk.segment_type, chunk.speech_verb, base_exag, base_cfg
                )

                # Determine voice
                if chunk.segment_type == 'internal_thought':
                    voice = internal_thought_voice
                elif chunk.voice == 'narration':
                    voice = narrator_voice
                else:
                    voice = chunk.voice

                # Detect paralinguistic tags
                tags = detect_paralinguistic_tags(chunk.text)

                segment = Segment(
                    number=0,
                    segment_type=final_type,
                    text=chunk.text,
                    voice=voice,
                    speaker=chunk.speaker,
                    speech_verb=chunk.speech_verb,
                    exaggeration=final_exag,
                    cfg_weight=final_cfg,
                    paralinguistic_tags=tags
                )
                segments.append(segment)

    # Merge short segments
    merged = []
    i = 0
    while i < len(segments):
        current = segments[i]
        if current.segment_type == 'scene_break':
            merged.append(current)
            i += 1
            continue

        # Try to merge with next segment if current is too short
        while i + 1 < len(segments) and should_merge_segments(current, segments[i + 1]):
            next_seg = segments[i + 1]
            current = Segment(
                number=0,
                segment_type=current.segment_type,
                text=f"{current.text} {next_seg.text}",
                voice=current.voice,
                speaker=current.speaker,
                speech_verb=current.speech_verb,
                exaggeration=current.exaggeration,
                cfg_weight=current.cfg_weight,
                paralinguistic_tags=current.paralinguistic_tags + next_seg.paralinguistic_tags
            )
            i += 1

        merged.append(current)
        i += 1

    # Split long segments
    final_segments = []
    for seg in merged:
        if seg.segment_type == 'scene_break':
            final_segments.append(seg)
        else:
            final_segments.extend(split_segment_at_sentences(seg))

    # Number segments and calculate pauses
    prev_segment = None
    for i, segment in enumerate(final_segments):
        segment.number = i + 1
        segment.pause_before_sec = calculate_pause_before(prev_segment, segment)
        prev_segment = segment

    return final_segments


def write_segment_files(segments: list[Segment], chapter_dir: Path, voices_yaml: dict) -> dict:
    """Write segment files to disk and return manifest data."""
    chapter_dir.mkdir(parents=True, exist_ok=True)

    segments_detail = []
    voices_used = set()
    unrecognized_voices = {}  # voice -> list of segment numbers

    for segment in segments:
        seg_num = segment.number
        yaml_path = chapter_dir / f'segment-{seg_num:03d}.yaml'

        if segment.segment_type == 'scene_break':
            # Scene breaks only have YAML, no text file
            seg_data = {
                'segment': seg_num,
                'type': 'scene_break',
                'pause_sec': segment.pause_before_sec,
            }
            atomic_write_yaml(yaml_path, seg_data)
            segments_detail.append({
                'segment': seg_num,
                'status': 'skipped',
                'duration_sec': segment.pause_before_sec,
                'retries': 0,
            })
        else:
            # Check if voice is recognized
            is_recognized, canonical_name = is_voice_recognized(segment.voice, voices_yaml)
            if not is_recognized and segment.segment_type == 'dialogue':
                if segment.voice not in unrecognized_voices:
                    unrecognized_voices[segment.voice] = []
                unrecognized_voices[segment.voice].append(seg_num)

            # Get audio prompt path
            audio_prompt_path = get_voice_sample_path(segment.voice, voices_yaml)
            if audio_prompt_path:
                audio_prompt_str = str(audio_prompt_path)
            else:
                audio_prompt_str = str(VOICES_DIR / 'narrator-male.wav')

            voices_used.add(segment.voice)

            seg_data = {
                'segment': seg_num,
                'type': segment.segment_type,
                'voice': segment.voice,
                'speaker': segment.speaker,
                'speech_verb': segment.speech_verb,
                'settings': {
                    'audio_prompt': audio_prompt_str,
                    'exaggeration': round(segment.exaggeration, 2),
                    'cfg_weight': round(segment.cfg_weight, 2),
                },
                'pause_before_sec': round(segment.pause_before_sec, 2),
                'paralinguistics': {
                    'enabled': True,
                    'tags': segment.paralinguistic_tags,
                },
                'word_count': segment.word_count,
                'char_count': segment.char_count,
                'estimated_duration_sec': round(segment.estimated_duration_sec, 1),
            }
            atomic_write_yaml(yaml_path, seg_data)

            # Write text file
            txt_path = chapter_dir / f'segment-{seg_num:03d}.txt'
            atomic_write_text(txt_path, segment.text)

            segments_detail.append({
                'segment': seg_num,
                'status': 'pending',
                'duration_sec': None,
                'retries': 0,
            })

    # Warn about unrecognized voices (they'll fallback to narrator)
    if unrecognized_voices:
        print(f"\n⚠️  WARNING: {len(unrecognized_voices)} unrecognized voice(s) detected:")
        for voice, seg_nums in sorted(unrecognized_voices.items()):
            print(f"   - '{voice}' in segments: {seg_nums[:5]}{'...' if len(seg_nums) > 5 else ''}")
        print("   These will use fallback narrator voice. Add aliases to voices.yaml to fix.\n")

    return {
        'total': len(segments),
        'segments_detail': segments_detail,
        'voices_used': list(voices_used),
        'unrecognized_voices': unrecognized_voices,
    }


def validate_segmentation(chapter_dir: Path, voices_yaml: dict) -> list[str]:
    """Validate segments before generation. Returns list of errors."""
    errors = []
    segments = sorted(chapter_dir.glob('segment-*.yaml'))

    if not segments:
        errors.append("No segment files found")
        return errors

    # Check contiguous numbering
    expected = set(range(1, len(segments) + 1))
    actual = {int(s.stem.split('-')[1]) for s in segments}
    if expected != actual:
        missing = expected - actual
        errors.append(f"Non-contiguous segment numbering: missing {missing}")

    # Check all voices exist
    total_words = 0
    for seg_yaml in segments:
        config = yaml.safe_load(seg_yaml.read_text())

        if config.get('type') == 'scene_break':
            continue

        voice = config.get('voice')
        audio_prompt = config.get('settings', {}).get('audio_prompt')

        if audio_prompt and not Path(audio_prompt).exists():
            errors.append(f"Segment {seg_yaml.stem}: audio prompt not found: {audio_prompt}")

        # Count words from text file
        txt_path = seg_yaml.with_suffix('.txt')
        if txt_path.exists():
            total_words += len(txt_path.read_text().split())
        else:
            errors.append(f"Segment {seg_yaml.stem}: missing .txt file")

    if total_words < 100:
        errors.append(f"Suspiciously low word count: {total_words}")

    return errors


# ============================================================================
# Generation Logic
# ============================================================================

def generate_segment(seg_yaml: Path, output_wav: Path, model) -> dict:
    """Generate a single audio segment using pre-loaded Turbo model."""
    import torchaudio

    config = yaml.safe_load(seg_yaml.read_text())

    # Skip scene breaks
    if config.get('type') == 'scene_break':
        return {
            'status': 'skipped',
            'duration_sec': config.get('pause_sec', SCENE_BREAK_PAUSE),
        }

    # Load text
    txt_path = seg_yaml.with_suffix('.txt')
    if not txt_path.exists():
        return {
            'status': 'failed',
            'error': 'Missing .txt file',
        }

    text = txt_path.read_text().strip()
    if not text:
        return {
            'status': 'failed',
            'error': 'Empty text',
        }

    # Get settings
    settings = config.get('settings', {})
    audio_prompt_path = settings.get('audio_prompt')
    exaggeration = settings.get('exaggeration', 0.5)
    cfg_weight = settings.get('cfg_weight', 0.5)

    # Add paralinguistic tags to text
    tags = config.get('paralinguistics', {}).get('tags', [])
    if tags:
        text = ' '.join(tags) + ' ' + text

    try:
        # Debug: Show voice assignment before generation
        voice_name = config.get('voice', 'unknown')
        speaker = config.get('speaker', 'narrator')
        seg_num = config.get('segment', '?')
        prompt_file = Path(audio_prompt_path).name if audio_prompt_path else 'none'
        print(f"  Segment {seg_num}: {speaker or 'narrator'} -> {prompt_file}")

        # Generate audio - Chatterbox API handles file loading internally
        wav = model.generate(
            text,
            audio_prompt_path=audio_prompt_path,
            exaggeration=exaggeration,
            cfg_weight=cfg_weight,
        )

        # Save WAV
        torchaudio.save(str(output_wav), wav, model.sr)

        # Get duration
        info = torchaudio.info(str(output_wav))
        duration = info.num_frames / info.sample_rate

        return {
            'status': 'complete',
            'duration_sec': round(duration, 2),
        }

    except Exception as e:
        return {
            'status': 'failed',
            'error': str(e),
        }


def validate_generation(chapter_dir: Path) -> list[str]:
    """Validate generated audio before assembly. Returns list of errors."""
    import torchaudio

    errors = []
    manifest_path = chapter_dir / 'manifest.yaml'

    if not manifest_path.exists():
        errors.append("manifest.yaml not found")
        return errors

    manifest = yaml.safe_load(manifest_path.read_text())

    for seg in manifest.get('segments_detail', []):
        seg_num = seg['segment']
        seg_yaml_path = chapter_dir / f'segment-{seg_num:03d}.yaml'

        if not seg_yaml_path.exists():
            errors.append(f"Segment {seg_num}: YAML file missing")
            continue

        seg_config = yaml.safe_load(seg_yaml_path.read_text())

        # Skip scene breaks - they have no WAV file
        if seg_config.get('type') == 'scene_break':
            continue

        wav_path = chapter_dir / f'segment-{seg_num:03d}.wav'

        if seg['status'] == 'complete' and not wav_path.exists():
            errors.append(f"Segment {seg_num}: marked complete but WAV missing")
            continue

        if wav_path.exists():
            try:
                info = torchaudio.info(str(wav_path))
                duration = info.num_frames / info.sample_rate

                if duration < 0.5:
                    errors.append(f"Segment {seg_num}: suspiciously short ({duration:.1f}s)")
                elif duration > 60:
                    errors.append(f"Segment {seg_num}: suspiciously long ({duration:.1f}s)")

            except Exception as e:
                errors.append(f"Segment {seg_num}: invalid audio file - {e}")

    return errors


# ============================================================================
# Assembly Logic
# ============================================================================

def ensure_silence_file(chatterbox_dir: Path, duration: float = 1.5) -> Path:
    """Ensure a silence file exists for scene breaks."""
    silence_path = chatterbox_dir / f'silence_{duration}s.wav'
    if not silence_path.exists():
        subprocess.run([
            'ffmpeg', '-y',
            '-f', 'lavfi',
            '-i', f'anullsrc=channel_layout=mono:sample_rate=44100',
            '-t', str(duration),
            str(silence_path)
        ], check=True, capture_output=True)
    return silence_path


def apply_segment_fades(segment_wav: Path, output_dir: Path, fade_ms: int = 15) -> Path:
    """Apply fade-in and fade-out to a segment for smooth concatenation."""
    faded_path = output_dir / segment_wav.name
    fade_sec = fade_ms / 1000

    # Get duration for fade-out positioning
    probe = subprocess.run(
        ['ffprobe', '-v', 'quiet', '-show_entries', 'format=duration',
         '-of', 'csv=p=0', str(segment_wav)],
        capture_output=True, text=True
    )
    duration = float(probe.stdout.strip())
    fade_out_start = max(0, duration - fade_sec)

    subprocess.run([
        'ffmpeg', '-y', '-i', str(segment_wav),
        '-af', f'afade=t=in:st=0:d={fade_sec},afade=t=out:st={fade_out_start}:d={fade_sec}',
        '-c:a', 'pcm_s16le',
        str(faded_path)
    ], check=True, capture_output=True)

    return faded_path


def validate_pre_assembly(chapter_dir: Path) -> list[str]:
    """Final validation before MP3 assembly. Returns list of errors."""
    errors = []
    manifest_path = chapter_dir / 'manifest.yaml'

    if not manifest_path.exists():
        errors.append("manifest.yaml not found")
        return errors

    manifest = yaml.safe_load(manifest_path.read_text())

    # Check all segments present
    incomplete = [
        s['segment'] for s in manifest.get('segments_detail', [])
        if s['status'] not in ('complete', 'skipped')
    ]
    if incomplete:
        errors.append(f"Incomplete segments: {incomplete}")

    # Check total duration
    total_duration = sum(
        s.get('duration_sec', 0) for s in manifest.get('segments_detail', [])
        if s.get('duration_sec')
    )
    if total_duration < 30:
        errors.append(f"Total duration too short: {total_duration:.1f}s")
    elif total_duration > 5400:  # 90 minutes
        errors.append(f"Total duration unusually long: {total_duration / 60:.1f}min")

    return errors


def assemble_chapter(chapter_dir: Path, output_mp3: Path, chapter_num: int,
                     title: str, campaign: str, quality: str = 'high'):
    """Concatenate segments and encode to MP3 with normalization and metadata."""
    manifest = yaml.safe_load((chapter_dir / 'manifest.yaml').read_text())

    # Ensure silence file exists
    silence_path = ensure_silence_file(chapter_dir.parent)

    # Create temp directory for faded segments
    faded_dir = chapter_dir / 'faded_temp'
    faded_dir.mkdir(exist_ok=True)

    # Collect WAV files in order
    wav_files = []
    total_segments = manifest['segments']['total']

    print(f"Preparing {total_segments} segments...")

    for i in range(1, total_segments + 1):
        seg_yaml = chapter_dir / f'segment-{i:03d}.yaml'
        wav_path = chapter_dir / f'segment-{i:03d}.wav'

        if seg_yaml.exists():
            config = yaml.safe_load(seg_yaml.read_text())
            if config.get('type') == 'scene_break':
                wav_files.append(silence_path)
                continue

        if wav_path.exists():
            faded_path = apply_segment_fades(wav_path, faded_dir)
            wav_files.append(faded_path)
        else:
            print(f"  Warning: segment {i} WAV missing, using silence")
            wav_files.append(silence_path)

    # Create concat file
    concat_file = chapter_dir / 'concat.txt'
    with open(concat_file, 'w') as f:
        for wav in wav_files:
            escaped_path = str(wav).replace("'", "'\\''")
            f.write(f"file '{escaped_path}'\n")

    # Quality settings
    quality_map = {
        'high': '2',    # ~190 kbps VBR
        'medium': '4',  # ~165 kbps VBR
        'low': '6',     # ~130 kbps VBR
    }
    quality_value = quality_map.get(quality, '4')

    # Pretty title for campaign
    pretty_campaign = campaign.replace('-', ' ').title()

    print(f"Encoding to MP3...")

    # Encode to MP3
    result = subprocess.run([
        'ffmpeg', '-y',
        '-f', 'concat', '-safe', '0',
        '-i', str(concat_file),
        '-af', 'aresample=44100,loudnorm=I=-16:TP=-1.5:LRA=11,highpass=f=80',
        '-c:a', 'libmp3lame',
        '-q:a', quality_value,
        '-id3v2_version', '3',
        '-metadata', f'title=Chapter {chapter_num}: {title}',
        '-metadata', f'album={pretty_campaign}',
        '-metadata', f'track={chapter_num}',
        '-metadata', 'genre=Audiobook',
        str(output_mp3)
    ], capture_output=True, text=True)

    if result.returncode != 0:
        raise RuntimeError(f"FFmpeg failed: {result.stderr}")

    # Clean up temp faded files
    shutil.rmtree(faded_dir)

    # Get output file info
    probe = subprocess.run(
        ['ffprobe', '-v', 'quiet', '-show_entries', 'format=duration,size',
         '-of', 'csv=p=0', str(output_mp3)],
        capture_output=True, text=True
    )
    duration_str, size_str = probe.stdout.strip().split(',')
    duration = float(duration_str)
    size_mb = int(size_str) / (1024 * 1024)

    return {
        'duration_sec': round(duration, 2),
        'file_size_mb': round(size_mb, 2),
    }


# ============================================================================
# CLI Commands
# ============================================================================

def segment_single_chapter(campaign: str, chapter: int, voices_yaml: dict) -> bool:
    """Segment a single chapter. Returns True on success."""
    print(f"\n{'='*60}")
    print(f"Segmenting chapter {chapter} of '{campaign}'...")

    # Update global state
    update_audiobook_state(campaign, chapter, 'segmenting')

    # Paths
    novel_dir = get_novel_dir(campaign)
    chapter_path = novel_dir / f'chapter-{chapter:02d}.md'
    chapter_dir = get_chapter_dir(campaign, chapter)

    if not chapter_path.exists():
        print(f"Error: Chapter file not found: {chapter_path}")
        update_audiobook_state(campaign, chapter, 'failed', {'error': f'Chapter file not found: {chapter_path}'})
        return False

    # Read chapter
    content = chapter_path.read_text()
    frontmatter = parse_frontmatter(content)
    pov = frontmatter.get('pov', '')
    title = frontmatter.get('title', f'Chapter {chapter}')

    print(f"POV: {pov}, Title: {title}")

    # Segment the chapter
    segments = segment_chapter(content, pov, voices_yaml)
    print(f"Created {len(segments)} segments")

    # Write segment files
    segment_info = write_segment_files(segments, chapter_dir, voices_yaml)

    # Create manifest
    manifest = {
        'chapter': chapter,
        'title': title,
        'pov': pov,
        'source_file': f'chapter-{chapter:02d}.md',
        'source_hash': compute_file_hash(chapter_path),
        'segments': {
            'total': segment_info['total'],
            'generated': 0,
            'failed': 0,
        },
        'segments_detail': segment_info['segments_detail'],
        'voices_used': segment_info['voices_used'],
        'timing': {
            'started': datetime.now(timezone.utc).isoformat(),
            'completed': None,
        },
        'status': 'pending',
    }
    atomic_write_yaml(chapter_dir / 'manifest.yaml', manifest)

    # Validate
    errors = validate_segmentation(chapter_dir, voices_yaml)
    if errors:
        print(f"\nValidation warnings:")
        for err in errors:
            print(f"  - {err}")

    print(f"\nSegmentation complete:")
    print(f"  Total segments: {segment_info['total']}")
    print(f"  Voices: {', '.join(segment_info['voices_used'])}")
    print(f"  Output: {chapter_dir}")

    # Update global state
    update_audiobook_state(campaign, chapter, 'segmented', {
        'segments': segment_info['total'],
        'voices': segment_info['voices_used'],
    })
    return True


def cmd_segment(args):
    """Segment command: parse chapter markdown and create segment files."""
    campaign = args.campaign
    chapters = parse_chapter_range(args.chapter, args.chapters)

    if not chapters:
        print("Error: Must specify --chapter N or --chapters N-M")
        sys.exit(1)

    # Load voices.yaml once
    voices_yaml = load_voices_yaml(campaign)
    print(f"Loaded {len(voices_yaml)} voice mappings")

    for chapter in chapters:
        if not segment_single_chapter(campaign, chapter, voices_yaml):
            sys.exit(1)

    if len(chapters) > 1:
        print(f"\n{'='*60}")
        print(f"All {len(chapters)} chapters segmented successfully.")


def generate_single_chapter(campaign: str, chapter: int, resume: bool, model, voices_yaml: dict) -> bool:
    """Generate audio for a single chapter. Returns True on success."""
    print(f"\n{'='*60}")
    print(f"Generating audio for chapter {chapter} of '{campaign}'...")

    # Update global state
    update_audiobook_state(campaign, chapter, 'generating')

    # Paths
    chapter_dir = get_chapter_dir(campaign, chapter)
    manifest_path = chapter_dir / 'manifest.yaml'

    if not manifest_path.exists():
        print(f"Error: Manifest not found for chapter {chapter}. Run 'segment' command first.")
        update_audiobook_state(campaign, chapter, 'failed', {'error': 'Manifest not found. Run segment first.'})
        return False

    manifest = yaml.safe_load(manifest_path.read_text())

    # Validate before generation
    errors = validate_segmentation(chapter_dir, voices_yaml)
    if errors:
        print(f"Segmentation validation failed:")
        for err in errors:
            print(f"  - {err}")
        update_audiobook_state(campaign, chapter, 'failed', {'error': 'Segmentation validation failed', 'details': errors})
        return False

    # Update manifest status
    manifest['status'] = 'in_progress'
    manifest['timing']['started'] = datetime.now(timezone.utc).isoformat()
    atomic_write_yaml(manifest_path, manifest)

    # Generate segments
    segments_detail = manifest['segments_detail']
    total = manifest['segments']['total']
    generated = 0
    failed = 0

    for seg_info in segments_detail:
        seg_num = seg_info['segment']
        seg_yaml = chapter_dir / f'segment-{seg_num:03d}.yaml'
        output_wav = chapter_dir / f'segment-{seg_num:03d}.wav'

        # Skip if already complete and resuming
        if resume and seg_info['status'] == 'complete' and output_wav.exists():
            generated += 1
            print(f"  Segment {seg_num}/{total}: skipped (already complete)")
            continue

        if seg_info['status'] == 'skipped':
            print(f"  Segment {seg_num}/{total}: scene break")
            continue

        print(f"  Segment {seg_num}/{total}: generating...", end='', flush=True)

        result = generate_segment(seg_yaml, output_wav, model)
        seg_info['status'] = result['status']
        seg_info['duration_sec'] = result.get('duration_sec')

        if result['status'] == 'complete':
            generated += 1
            print(f" done ({result['duration_sec']:.1f}s)")
        elif result['status'] == 'skipped':
            print(f" skipped")
        else:
            failed += 1
            seg_info['retries'] = seg_info.get('retries', 0) + 1
            seg_info['error'] = result.get('error', 'Unknown error')
            print(f" FAILED: {result.get('error', 'Unknown')}")

        # Save progress
        manifest['segments']['generated'] = generated
        manifest['segments']['failed'] = failed
        atomic_write_yaml(manifest_path, manifest)

    # Update manifest
    manifest['status'] = 'complete' if failed == 0 else 'failed'
    manifest['timing']['completed'] = datetime.now(timezone.utc).isoformat()

    # Calculate total duration
    total_duration = sum(
        s.get('duration_sec', 0) for s in segments_detail
        if s.get('duration_sec')
    )
    manifest['timing']['total_duration_sec'] = round(total_duration, 2)

    atomic_write_yaml(manifest_path, manifest)

    # Validate after generation
    errors = validate_generation(chapter_dir)
    if errors:
        print(f"\nGeneration validation warnings:")
        for err in errors:
            print(f"  - {err}")

    print(f"\nGeneration complete:")
    print(f"  Generated: {generated}/{total}")
    print(f"  Failed: {failed}")
    print(f"  Total duration: {total_duration:.1f}s ({total_duration/60:.1f}min)")

    # Update global state
    if failed == 0:
        update_audiobook_state(campaign, chapter, 'generated', {
            'generated': generated,
            'total_segments': total,
            'duration_sec': round(total_duration, 2),
        })
    else:
        update_audiobook_state(campaign, chapter, 'failed', {
            'error': f'{failed} segments failed',
            'generated': generated,
            'failed': failed,
        })

    return failed == 0


def cmd_generate(args):
    """Generate command: create WAV files for each segment."""
    import torch
    from chatterbox.tts_turbo import ChatterboxTurboTTS

    campaign = args.campaign
    chapters = parse_chapter_range(args.chapter, args.chapters)
    resume = args.resume

    if not chapters:
        print("Error: Must specify --chapter N or --chapters N-M")
        sys.exit(1)

    # Load model once for all chapters
    print("Loading Chatterbox Turbo model...")
    device = "mps" if torch.backends.mps.is_available() else "cuda" if torch.cuda.is_available() else "cpu"
    model = ChatterboxTurboTTS.from_pretrained(device=device)
    print(f"Model loaded on {device}")

    # Load voices.yaml once
    voices_yaml = load_voices_yaml(campaign)

    try:
        for chapter in chapters:
            if not generate_single_chapter(campaign, chapter, resume, model, voices_yaml):
                sys.exit(1)

        if len(chapters) > 1:
            print(f"\n{'='*60}")
            print(f"All {len(chapters)} chapters generated successfully.")
    finally:
        # Clean up
        del model
        if device == 'mps':
            torch.mps.empty_cache()
        elif device == 'cuda':
            torch.cuda.empty_cache()


def assemble_single_chapter(campaign: str, chapter: int, output_format: str,
                             quality: str, clean: bool) -> bool:
    """Assemble a single chapter. Returns True on success."""
    print(f"\n{'='*60}")
    print(f"Assembling chapter {chapter} of '{campaign}'...")

    # Update global state
    update_audiobook_state(campaign, chapter, 'assembling')

    # Paths
    chapter_dir = get_chapter_dir(campaign, chapter)
    novel_dir = get_novel_dir(campaign)
    manifest_path = chapter_dir / 'manifest.yaml'

    if not manifest_path.exists():
        print(f"Error: Manifest not found for chapter {chapter}. Run 'segment' and 'generate' commands first.")
        update_audiobook_state(campaign, chapter, 'failed', {'error': 'Manifest not found. Run segment and generate first.'})
        return False

    manifest = yaml.safe_load(manifest_path.read_text())

    # Validate before assembly
    errors = validate_pre_assembly(chapter_dir)
    if errors:
        print(f"Pre-assembly validation failed:")
        for err in errors:
            print(f"  - {err}")
        if any('Incomplete segments' in e for e in errors):
            update_audiobook_state(campaign, chapter, 'failed', {'error': 'Incomplete segments', 'details': errors})
            return False

    # Output path
    output_ext = 'mp3' if output_format == 'mp3' else output_format
    output_path = novel_dir / f'chapter-{chapter:02d}.{output_ext}'

    # Assemble
    title = manifest.get('title', f'Chapter {chapter}')
    result = assemble_chapter(chapter_dir, output_path, chapter, title, campaign, quality)

    print(f"\nAssembly complete:")
    print(f"  Output: {output_path}")
    print(f"  Duration: {result['duration_sec']:.1f}s ({result['duration_sec']/60:.1f}min)")
    print(f"  Size: {result['file_size_mb']:.1f}MB")

    # Clean up intermediate files if requested
    if clean:
        print(f"  Cleaning intermediate files...")
        # Remove segment WAV files (keep txt and yaml for potential re-generation)
        wav_count = 0
        for wav_file in chapter_dir.glob('segment-*.wav'):
            wav_file.unlink()
            wav_count += 1
        # Remove faded directory if it exists
        faded_dir = chapter_dir / 'faded'
        if faded_dir.exists():
            shutil.rmtree(faded_dir)
        # Remove concat.txt
        concat_file = chapter_dir / 'concat.txt'
        if concat_file.exists():
            concat_file.unlink()
        print(f"  Removed {wav_count} WAV files")

    # Update global state
    update_audiobook_state(campaign, chapter, 'complete', {
        'duration_sec': result['duration_sec'],
        'file_size_mb': result['file_size_mb'],
        'output': str(output_path),
    })

    return True


def cmd_assemble(args):
    """Assemble command: concatenate segments and encode to MP3."""
    campaign = args.campaign
    chapters = parse_chapter_range(args.chapter, args.chapters)
    output_format = args.format
    quality = args.quality
    clean = args.clean

    if not chapters:
        print("Error: Must specify --chapter N or --chapters N-M")
        sys.exit(1)

    for chapter in chapters:
        if not assemble_single_chapter(campaign, chapter, output_format, quality, clean):
            sys.exit(1)

    if len(chapters) > 1:
        print(f"\n{'='*60}")
        print(f"All {len(chapters)} chapters assembled successfully.")


# ============================================================================
# Main Entry Point
# ============================================================================

def main():
    parser = argparse.ArgumentParser(
        description='Audiobook generation pipeline using Chatterbox TTS',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    python scripts/chatterbox-audiobook.py segment the-rot-beneath --chapter 1
    python scripts/chatterbox-audiobook.py segment the-rot-beneath --chapters 1-5
    python scripts/chatterbox-audiobook.py generate the-rot-beneath --chapter 1 --resume
    python scripts/chatterbox-audiobook.py generate the-rot-beneath --chapters 1-5 --resume
    python scripts/chatterbox-audiobook.py assemble the-rot-beneath --chapter 1 --quality high
    python scripts/chatterbox-audiobook.py assemble the-rot-beneath --chapters 1-5 --clean
        """
    )

    subparsers = parser.add_subparsers(dest='command', required=True)

    # Segment command
    segment_parser = subparsers.add_parser('segment', help='Parse chapter and create segment files')
    segment_parser.add_argument('campaign', help='Campaign name')
    segment_parser.add_argument('--chapter', '-c', type=int, help='Chapter number')
    segment_parser.add_argument('--chapters', type=str, help='Chapter range (e.g., 1-5)')

    # Generate command
    generate_parser = subparsers.add_parser('generate', help='Generate WAV files for segments')
    generate_parser.add_argument('campaign', help='Campaign name')
    generate_parser.add_argument('--chapter', '-c', type=int, help='Chapter number')
    generate_parser.add_argument('--chapters', type=str, help='Chapter range (e.g., 1-5)')
    generate_parser.add_argument('--resume', '-r', action='store_true', help='Resume from checkpoint')

    # Assemble command
    assemble_parser = subparsers.add_parser('assemble', help='Concatenate segments and encode to MP3')
    assemble_parser.add_argument('campaign', help='Campaign name')
    assemble_parser.add_argument('--chapter', '-c', type=int, help='Chapter number')
    assemble_parser.add_argument('--chapters', type=str, help='Chapter range (e.g., 1-5)')
    assemble_parser.add_argument('--format', '-f', choices=['mp3', 'wav', 'm4a'], default='mp3',
                                 help='Output format (default: mp3)')
    assemble_parser.add_argument('--quality', '-q', choices=['high', 'medium', 'low'], default='high',
                                 help='Output quality (default: high)')
    assemble_parser.add_argument('--clean', action='store_true',
                                 help='Remove intermediate WAV files after assembly')

    args = parser.parse_args()

    if args.command == 'segment':
        cmd_segment(args)
    elif args.command == 'generate':
        cmd_generate(args)
    elif args.command == 'assemble':
        cmd_assemble(args)


if __name__ == '__main__':
    main()
