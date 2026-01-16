#!/usr/bin/env python3
"""
Enhanced novel reader using Chatterbox TTS with voice cloning and paralinguistic tags.

Usage:
    python scripts/chatterbox-reader.py <campaign> <chapter> [options]

Options:
    --save <file.wav>    Save to file instead of playing
    --voice <male|female>  Override voice selection
    --play               Play after generating (with --save)
"""

import argparse
import re
import subprocess
import sys
import tempfile
from pathlib import Path

# Add repo root to path for imports
REPO_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(REPO_ROOT))


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


def get_character_gender(campaign: str, character: str) -> str:
    """Detect character gender from their sheet."""
    char_path = REPO_ROOT / 'campaigns' / campaign / 'party' / f'{character}.md'

    if not char_path.exists():
        return 'male'  # default

    content = char_path.read_text().lower()

    if 'gender: female' in content or 'pronouns: she' in content:
        return 'female'
    elif 'gender: male' in content or 'pronouns: he' in content:
        return 'male'

    return 'male'  # default


def get_voice_sample(campaign: str, gender: str) -> Path:
    """Get the voice sample path for the given gender."""
    samples_dir = REPO_ROOT / 'campaigns' / campaign / 'novel' / 'voice-samples'

    if gender == 'female':
        sample = samples_dir / 'narrator-female.wav'
    else:
        sample = samples_dir / 'narrator-male.wav'

    if sample.exists():
        return sample

    return None


def enhance_text_for_tts(text: str) -> str:
    """Add paralinguistic tags and clean up text for TTS."""
    # Remove markdown formatting
    text = re.sub(r'\*\*\*(.+?)\*\*\*', r'\1', text)  # bold italic
    text = re.sub(r'\*\*(.+?)\*\*', r'\1', text)  # bold
    text = re.sub(r'\*(.+?)\*', r'\1', text)  # italic (thoughts)
    text = re.sub(r'_(.+?)_', r'\1', text)  # underscore italic

    # Remove headers
    text = re.sub(r'^#+\s+.*$', '', text, flags=re.MULTILINE)

    # Remove scene breaks
    text = re.sub(r'^\s*\*\s*\*\s*\*\s*$', '', text, flags=re.MULTILINE)

    # Clean up extra whitespace
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = text.strip()

    return text


def read_chapter(campaign: str, chapter: int) -> tuple[str, dict]:
    """Read chapter content and frontmatter."""
    chapter_path = REPO_ROOT / 'campaigns' / campaign / 'novel' / f'chapter-{chapter:02d}.md'

    if not chapter_path.exists():
        raise FileNotFoundError(f"Chapter not found: {chapter_path}")

    content = chapter_path.read_text()
    frontmatter = parse_frontmatter(content)

    # Extract body (after frontmatter)
    if content.startswith('---'):
        parts = content.split('---', 2)
        if len(parts) >= 3:
            body = parts[2].strip()
        else:
            body = content
    else:
        body = content

    return body, frontmatter


def generate_speech(text: str, voice_sample: Path | None, output_path: Path):
    """Generate speech using Chatterbox Turbo."""
    from chatterbox.tts_turbo import ChatterboxTurboTTS
    import torchaudio

    print("Loading Chatterbox Turbo model...")
    model = ChatterboxTurboTTS.from_pretrained(device="mps")

    print(f"Generating speech ({len(text)} chars)...")

    if voice_sample and voice_sample.exists():
        print(f"Using voice sample: {voice_sample.name}")
        wav = model.generate(text, audio_prompt_path=str(voice_sample))
    else:
        print("Using default voice")
        wav = model.generate(text)

    torchaudio.save(str(output_path), wav, model.sr)
    print(f"Saved to: {output_path}")


def play_audio(path: Path):
    """Play audio file."""
    subprocess.run(['afplay', str(path)], check=True)


def main():
    parser = argparse.ArgumentParser(description='Enhanced novel reader with Chatterbox TTS')
    parser.add_argument('campaign', help='Campaign name')
    parser.add_argument('chapter', type=int, help='Chapter number')
    parser.add_argument('--save', '-s', help='Save to file instead of playing')
    parser.add_argument('--voice', '-v', choices=['male', 'female'], help='Override voice')
    parser.add_argument('--play', '-p', action='store_true', help='Play after saving')

    args = parser.parse_args()

    # Read chapter
    print(f"Reading chapter {args.chapter} from {args.campaign}...")
    body, frontmatter = read_chapter(args.campaign, args.chapter)

    # Determine voice
    pov = frontmatter.get('pov', '')
    if args.voice:
        gender = args.voice
    elif pov:
        gender = get_character_gender(args.campaign, pov)
        print(f"POV character: {pov} ({gender})")
    else:
        gender = 'male'

    # Get voice sample
    voice_sample = get_voice_sample(args.campaign, gender)

    # Enhance text
    text = enhance_text_for_tts(body)

    # Determine output path
    if args.save:
        output_path = Path(args.save)
    else:
        output_path = Path(tempfile.mktemp(suffix='.wav'))

    # Generate
    generate_speech(text, voice_sample, output_path)

    # Play
    if args.save and args.play:
        print("Playing...")
        play_audio(output_path)
    elif not args.save:
        print("Playing...")
        play_audio(output_path)
        output_path.unlink()  # Clean up temp file


if __name__ == '__main__':
    main()
