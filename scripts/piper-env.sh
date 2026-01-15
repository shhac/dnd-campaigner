#!/bin/bash
# piper-env.sh - Setup and activate Piper TTS environment
#
# Usage:
#   source scripts/piper-env.sh              # Activate (and install if needed)
#   scripts/piper-env.sh --check             # Check if installed
#   scripts/piper-env.sh --voices            # List installed voices
#   scripts/piper-env.sh --install-voices    # Install recommended voices
#
# After sourcing, these commands are available:
#   read-chapter <campaign> <chapter> [--voice <voice>]  # Read a chapter aloud
#   read-novel <campaign> [--voice <voice>]              # Read all chapters
#
# Requirements: bash or zsh, uv (for Python environment management)
# Note: This script works with bash and zsh. It will not work with sh, dash, or fish.

# =============================================================================
# Configuration
# =============================================================================

# Determine script path (works in both bash and zsh)
if [[ -n "${BASH_SOURCE[0]:-}" ]]; then
    _PIPER_SCRIPT="${BASH_SOURCE[0]}"
elif [[ -n "${ZSH_VERSION:-}" ]]; then
    # ZSH_VERSION is set - safe to use zsh-specific expansion
    eval '_PIPER_SCRIPT="${(%):-%x}"'
else
    echo "Error: Unable to determine script path. Use bash or zsh." >&2
    return 1 2>/dev/null || exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$_PIPER_SCRIPT")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
unset _PIPER_SCRIPT
VENV_DIR="$REPO_ROOT/.piper-venv"
VOICE_DIR="$REPO_ROOT/.piper-voices"

# Export for use in functions
export PIPER_VOICE_DIR="$VOICE_DIR"
export PIPER_REPO_ROOT="$REPO_ROOT"

# Default voices
DEFAULT_VOICE="en_US-ryan-high"
DEFAULT_MALE_VOICE="en_US-ryan-high"
DEFAULT_FEMALE_VOICE="en_US-amy-medium"

# Piper speech settings (exported for use in functions)
export PIPER_LENGTH_SCALE="1.1"        # Slightly slower (1.0 = default)
export PIPER_SENTENCE_SILENCE="0.4"   # 400ms pause between sentences

# Colors for output (disabled if not a terminal)
if [[ -t 1 ]]; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[0;33m'
    BLUE='\033[0;34m'
    NC='\033[0m'
else
    RED='' GREEN='' YELLOW='' BLUE='' NC=''
fi

# Recommended voices for novel reading
# Format: "name|locale|voice|quality|gender|description"
RECOMMENDED_VOICES=(
    "ryan-high|en_US|ryan|high|male|Natural male voice - great for audiobooks (114MB)"
    "amy-medium|en_US|amy|medium|female|Professional female voice - clear narration (63MB)"
)

# Additional voices users might want
OPTIONAL_VOICES=(
    "lessac-high|en_US|lessac|high|female|Clear voice, good for narration (114MB)"
    "john|en_US|john|medium|male|Warm male voice from LibriVox"
    "kristin|en_US|kristin|medium|female|Natural female voice from LibriVox"
    "alba|en_GB|alba|medium|female|Scottish accent"
    "northern_english_male|en_GB|northern_english_male|medium|male|Northern English accent"
)

# =============================================================================
# Utility Functions
# =============================================================================

# Log an error message
log_error() {
    echo -e "${RED}Error: $1${NC}" >&2
}

# Log a warning message
log_warn() {
    echo -e "${YELLOW}$1${NC}" >&2
}

# Log an info message
log_info() {
    echo -e "${BLUE}$1${NC}"
}

# Log a success message
log_success() {
    echo -e "${GREEN}$1${NC}"
}

# Validate campaign name (alphanumeric, hyphens, underscores only)
validate_campaign_name() {
    local name="$1"
    if [[ ! "$name" =~ ^[a-zA-Z0-9_-]+$ ]]; then
        log_error "Invalid campaign name: '$name'. Use only letters, numbers, hyphens, and underscores."
        return 1
    fi
    return 0
}

# Validate chapter number (positive integer)
validate_chapter_number() {
    local num="$1"
    if [[ ! "$num" =~ ^[0-9]+$ ]] || [[ "$num" -lt 1 ]]; then
        log_error "Invalid chapter number: '$num'. Must be a positive integer."
        return 1
    fi
    return 0
}

# Count installed voice files
count_voices() {
    find "$VOICE_DIR" -maxdepth 1 -name "*.onnx" -type f 2>/dev/null | wc -l | tr -d ' '
}

# Check if a voice is fully installed (both .onnx and .onnx.json)
voice_is_installed() {
    local voice_file="$1"
    local onnx_path="$VOICE_DIR/$voice_file.onnx"
    local json_path="$VOICE_DIR/$voice_file.onnx.json"
    [[ -f "$onnx_path" ]] && [[ -f "$json_path" ]]
}

# Find an audio player for the current system
find_audio_player() {
    for player in afplay aplay paplay ffplay mpv; do
        if command -v "$player" &>/dev/null; then
            echo "$player"
            return 0
        fi
    done
    return 1
}

# Play a WAV file with the appropriate player
play_wav_file() {
    local wav_file="$1"
    local player

    player=$(find_audio_player) || {
        log_error "No audio player found. Install afplay (macOS), aplay (Linux), or mpv."
        return 1
    }

    case "$player" in
        afplay) afplay -q 1 "$wav_file" ;;
        aplay)  aplay -q "$wav_file" ;;
        paplay) paplay "$wav_file" ;;
        ffplay) ffplay -nodisp -autoexit -loglevel quiet "$wav_file" ;;
        mpv)    mpv --no-video --really-quiet "$wav_file" ;;
    esac
}

# Parse a simple YAML value (handles quotes and inline comments)
parse_yaml_value() {
    local file="$1"
    local key="$2"
    grep -m1 "^${key}:" "$file" 2>/dev/null | \
        sed "s/^${key}:[[:space:]]*//" | \
        sed 's/[[:space:]]*#.*//' | \
        tr -d '"'"'"
}

# Parse a nested YAML value (e.g., get "voice" from under "corwin-voss:")
# Usage: parse_nested_yaml "file" "parent_key" "child_key"
parse_nested_yaml() {
    local file="$1"
    local parent="$2"
    local child="$3"

    # Find the parent block and extract the child value
    awk -v parent="$parent" -v child="$child" '
        $0 ~ "^" parent ":" { in_block = 1; next }
        in_block && /^[^ ]/ { in_block = 0 }
        in_block && $0 ~ "^  " child ":" {
            sub(/^  [^:]+:[[:space:]]*/, "")
            sub(/[[:space:]]*#.*/, "")
            gsub(/["'"'"']/, "")
            print
            exit
        }
    ' "$file" 2>/dev/null
}

# Check if running interactively (stdin is a terminal)
is_interactive() {
    [[ -t 0 ]]
}

# Prompt user for input (returns default if not interactive)
# Usage: prompt_user "prompt text" "default_value"
prompt_user() {
    local prompt="$1"
    local default="${2:-}"

    if is_interactive; then
        echo -n "$prompt" >&2
        read -r REPLY
        echo "${REPLY:-$default}"
    else
        echo "$default"
    fi
}

# =============================================================================
# Core Functions
# =============================================================================

check_uv() {
    if ! command -v uv &>/dev/null; then
        log_error "uv not found. Install with: curl -LsSf https://astral.sh/uv/install.sh | sh"
        return 1
    fi
}

setup_venv() {
    log_warn "Creating Piper virtual environment..."

    if ! uv venv "$VENV_DIR"; then
        log_error "Failed to create virtual environment"
        return 1
    fi

    if ! source "$VENV_DIR/bin/activate"; then
        log_error "Failed to activate virtual environment"
        return 1
    fi

    log_warn "Installing piper-tts..."

    if ! uv pip install piper-tts; then
        log_error "Failed to install piper-tts"
        return 1
    fi

    # Verify piper is actually available
    if ! command -v piper &>/dev/null; then
        log_error "piper command not found after installation"
        return 1
    fi

    log_success "Piper TTS installed successfully!"
}

download_voice() {
    local name="$1"
    local locale="$2"
    local voice="$3"
    local quality="$4"

    if ! mkdir -p "$VOICE_DIR"; then
        log_error "Failed to create voice directory: $VOICE_DIR"
        return 1
    fi

    local voice_file="${locale}-${voice}-${quality}"
    local onnx_path="$VOICE_DIR/$voice_file.onnx"
    local json_path="$VOICE_DIR/$voice_file.onnx.json"

    # Check if both files exist
    if [[ -f "$onnx_path" ]] && [[ -f "$json_path" ]]; then
        log_success "Voice '$name' already installed."
        return 0
    fi

    # Clean up any partial downloads
    rm -f "$onnx_path" "$json_path" 2>/dev/null

    log_warn "Downloading voice: $name ($voice_file)..."

    local base_url="https://huggingface.co/rhasspy/piper-voices/resolve/main/en/${locale}/${voice}/${quality}"

    # Download ONNX model
    if ! curl -fL --progress-bar -o "$onnx_path" "${base_url}/${voice_file}.onnx"; then
        log_error "Failed to download ONNX model for: $name"
        rm -f "$onnx_path" "$json_path" 2>/dev/null
        return 1
    fi

    # Download JSON metadata
    if ! curl -fL --progress-bar -o "$json_path" "${base_url}/${voice_file}.onnx.json"; then
        log_error "Failed to download JSON metadata for: $name"
        rm -f "$onnx_path" "$json_path" 2>/dev/null
        return 1
    fi

    log_success "Downloaded: $name"
}

install_recommended_voices() {
    log_info "Installing recommended voices for novel reading..."
    echo ""

    local failed=0
    for voice_spec in "${RECOMMENDED_VOICES[@]}"; do
        IFS='|' read -r name locale voice quality gender desc <<< "$voice_spec"
        echo -e "${BLUE}$name${NC} ($gender): $desc"
        if ! download_voice "$name" "$locale" "$voice" "$quality"; then
            ((failed++))
        fi
        echo ""
    done

    if [[ $failed -eq 0 ]]; then
        log_success "Recommended voices installed!"
    else
        log_warn "Some voices failed to install ($failed failures)"
    fi

    echo ""
    echo -e "Voice files location: ${BLUE}$VOICE_DIR${NC}"
}

install_voices_interactive() {
    log_info "=== Piper Voice Installer ==="
    echo ""

    # Check recommended voices
    log_warn "Recommended voices for novel reading:"
    local missing_recommended=()
    for voice_spec in "${RECOMMENDED_VOICES[@]}"; do
        IFS='|' read -r name locale voice quality gender desc <<< "$voice_spec"
        local voice_file="${locale}-${voice}-${quality}"
        if voice_is_installed "$voice_file"; then
            echo -e "  ${GREEN}[installed]${NC} $name ($gender) - $desc"
        else
            echo -e "  ${RED}[missing]${NC}   $name ($gender) - $desc"
            missing_recommended+=("$voice_spec")
        fi
    done
    echo ""

    if [[ ${#missing_recommended[@]} -gt 0 ]]; then
        local response
        response=$(prompt_user "Install missing recommended voices? [Y/n] " "y")
        if [[ -z "$response" || "$response" =~ ^[Yy] ]]; then
            for voice_spec in "${missing_recommended[@]}"; do
                IFS='|' read -r name locale voice quality gender desc <<< "$voice_spec"
                download_voice "$name" "$locale" "$voice" "$quality"
            done
        fi
        echo ""
    fi

    # Offer optional voices
    log_warn "Optional additional voices:"
    for i in "${!OPTIONAL_VOICES[@]}"; do
        IFS='|' read -r name locale voice quality gender desc <<< "${OPTIONAL_VOICES[$i]}"
        local voice_file="${locale}-${voice}-${quality}"
        if voice_is_installed "$voice_file"; then
            echo -e "  $((i+1)). ${GREEN}[installed]${NC} $name ($gender) - $desc"
        else
            echo -e "  $((i+1)). ${BLUE}[available]${NC} $name ($gender) - $desc"
        fi
    done
    echo ""
    local selection
    selection=$(prompt_user "Enter numbers to install (e.g., '1 3'), 'all', or press Enter to skip: " "")

    if [[ "$selection" == "all" ]]; then
        for voice_spec in "${OPTIONAL_VOICES[@]}"; do
            IFS='|' read -r name locale voice quality gender desc <<< "$voice_spec"
            download_voice "$name" "$locale" "$voice" "$quality"
        done
    elif [[ -n "$selection" ]]; then
        # shellcheck disable=SC2086 # Intentional word splitting for user selection
        for num in $selection; do
            # Validate that input is numeric
            if [[ ! "$num" =~ ^[0-9]+$ ]]; then
                log_warn "Skipping invalid selection: $num"
                continue
            fi
            local idx=$((num - 1))
            if [[ $idx -ge 0 && $idx -lt ${#OPTIONAL_VOICES[@]} ]]; then
                IFS='|' read -r name locale voice quality gender desc <<< "${OPTIONAL_VOICES[$idx]}"
                download_voice "$name" "$locale" "$voice" "$quality"
            else
                log_warn "Skipping out-of-range selection: $num"
            fi
        done
    fi

    echo ""
    list_voices
}

list_voices() {
    log_info "=== Installed Voices ==="

    if [[ ! -d "$VOICE_DIR" ]]; then
        log_warn "  No voices installed yet."
        echo -e "  Run: ${BLUE}source scripts/piper-env.sh${NC} then install voices"
        return
    fi

    local count=0
    local voice_name
    while IFS= read -r -d '' onnx_file; do
        voice_name=$(basename "$onnx_file" .onnx)
        echo -e "  ${GREEN}*${NC} $voice_name"
        ((count++))
    done < <(find "$VOICE_DIR" -maxdepth 1 -name "*.onnx" -type f -print0 2>/dev/null)

    if [[ $count -eq 0 ]]; then
        log_warn "  No voices installed yet."
        echo -e "  Run: ${BLUE}scripts/piper-env.sh --install-voices${NC}"
    else
        echo ""
        echo -e "Voice directory: ${BLUE}$VOICE_DIR${NC}"
    fi
}

# =============================================================================
# Reader Functions (defined when sourced)
# =============================================================================

define_reader_functions() {
    # read-chapter: Read a single chapter aloud
    # Usage: read-chapter <campaign> <chapter> [--voice <voice>] [--save <output.wav>]
    read-chapter() {
        local campaign=""
        local chapter=""
        local voice=""
        local output=""

        # Parse arguments
        while [[ $# -gt 0 ]]; do
            case "$1" in
                --voice|-v)
                    if [[ -z "${2:-}" || "$2" == --* ]]; then
                        log_error "--voice requires a voice name"
                        return 1
                    fi
                    voice="$2"
                    shift 2
                    ;;
                --save|-s)
                    if [[ -z "${2:-}" || "$2" == --* ]]; then
                        log_error "--save requires a filename"
                        return 1
                    fi
                    output="$2"
                    shift 2
                    ;;
                --help|-h)
                    cat <<'EOF'
Usage: read-chapter <campaign> <chapter> [options]

Arguments:
  campaign    Campaign name (e.g., the-rot-beneath)
  chapter     Chapter number (e.g., 1, 2, 3)

Options:
  --voice, -v <voice>   Voice to use (default: auto-detect from POV)
  --save, -s <file>     Save to WAV file instead of playing
  --help, -h            Show this help

Voice Detection Order:
  1. Check campaigns/{campaign}/novel/voices.yaml for explicit mapping
  2. Check character sheet for gender/pronouns
  3. Fall back to default voice (lessac)

Examples:
  read-chapter the-rot-beneath 1
  read-chapter the-rot-beneath 2 --voice amy
  read-chapter the-rot-beneath 1 --save chapter1.wav
EOF
                    return 0
                    ;;
                *)
                    if [[ -z "$campaign" ]]; then
                        campaign="$1"
                    elif [[ -z "$chapter" ]]; then
                        chapter="$1"
                    fi
                    shift
                    ;;
            esac
        done

        # Validate arguments
        if [[ -z "$campaign" || -z "$chapter" ]]; then
            log_error "Missing arguments"
            echo "Usage: read-chapter <campaign> <chapter> [--voice <voice>]"
            return 1
        fi

        validate_campaign_name "$campaign" || return 1
        validate_chapter_number "$chapter" || return 1

        # Find chapter file
        local chapter_num
        chapter_num=$(printf "%02d" "$chapter")
        local chapter_file="$PIPER_REPO_ROOT/campaigns/$campaign/novel/chapter-${chapter_num}.md"

        if [[ ! -f "$chapter_file" ]]; then
            log_error "Chapter file not found: $chapter_file"
            return 1
        fi

        # Per-voice settings (will be populated from voices.yaml or defaults)
        local voice_length_scale=""
        local voice_sentence_silence=""

        # Auto-detect voice from POV if not specified
        if [[ -z "$voice" ]]; then
            local pov
            pov=$(parse_yaml_value "$chapter_file" "pov")

            if [[ -n "$pov" ]]; then
                # 1. Check for campaign voice mapping file
                local voice_map="$PIPER_REPO_ROOT/campaigns/$campaign/novel/voices.yaml"
                if [[ -f "$voice_map" ]]; then
                    # Try nested format first (new format with per-voice settings)
                    local mapped
                    mapped=$(parse_nested_yaml "$voice_map" "$pov" "voice")
                    if [[ -n "$mapped" ]]; then
                        voice="$mapped"
                        # Also read per-voice settings
                        voice_length_scale=$(parse_nested_yaml "$voice_map" "$pov" "length_scale")
                        voice_sentence_silence=$(parse_nested_yaml "$voice_map" "$pov" "sentence_silence")
                        log_info "POV: $pov -> Voice: $voice (from voices.yaml)"
                    else
                        # Fall back to simple format (backwards compatibility)
                        mapped=$(parse_yaml_value "$voice_map" "$pov")
                        if [[ -n "$mapped" ]]; then
                            voice="$mapped"
                            log_info "POV: $pov -> Voice: $voice (from voices.yaml)"
                        fi
                    fi
                fi

                # 2. If no mapping, try to detect gender from character sheet
                if [[ -z "$voice" ]]; then
                    local char_sheet="$PIPER_REPO_ROOT/campaigns/$campaign/party/${pov}.md"
                    if [[ -f "$char_sheet" ]]; then
                        # Look for gender or pronouns (anchored to start of line, ignore comments)
                        if grep -qiE "^(gender:[^#]*female|pronouns:[^#]*she)" "$char_sheet" 2>/dev/null; then
                            voice="$DEFAULT_FEMALE_VOICE"
                            log_info "POV: $pov -> Voice: $voice (detected female)"
                        elif grep -qiE "^(gender:[^#]*male|pronouns:[^#]*he)" "$char_sheet" 2>/dev/null; then
                            voice="$DEFAULT_MALE_VOICE"
                            log_info "POV: $pov -> Voice: $voice (detected male)"
                        fi
                    fi
                fi

                # 3. Fall back to default
                if [[ -z "$voice" ]]; then
                    voice="$DEFAULT_VOICE"
                    log_info "POV: $pov -> Voice: $voice (default)"
                fi
            else
                voice="$DEFAULT_VOICE"
                log_info "No POV found, using default voice: $voice"
            fi
        fi

        # Resolve voice file path
        local voice_path=""

        # Try exact match first
        if [[ -f "$PIPER_VOICE_DIR/${voice}.onnx" ]]; then
            voice_path="$PIPER_VOICE_DIR/${voice}.onnx"
        else
            # Try common prefixes/suffixes
            for quality in medium high low; do
                for locale in en_US en_GB; do
                    local try_path="$PIPER_VOICE_DIR/${locale}-${voice}-${quality}.onnx"
                    if [[ -f "$try_path" ]]; then
                        voice_path="$try_path"
                        break 2
                    fi
                done
            done
        fi

        if [[ -z "$voice_path" || ! -f "$voice_path" ]]; then
            log_error "Voice not found: $voice"
            echo "Available voices:"
            find "$PIPER_VOICE_DIR" -maxdepth 1 -name "*.onnx" -type f -exec basename {} .onnx \; 2>/dev/null
            return 1
        fi

        # Get chapter title for display
        local title
        title=$(parse_yaml_value "$chapter_file" "title")
        log_success "Reading Chapter $chapter: $title"
        echo ""

        # Strip YAML frontmatter and read content
        # Frontmatter is between first --- and second ---
        local content
        content=$(awk '/^---$/{if(++n==2){found=1;next}}found' "$chapter_file")

        if [[ -z "$content" ]]; then
            log_error "No content found in chapter file"
            return 1
        fi

        # Use per-voice settings if available, otherwise fall back to global defaults
        local length_scale="${voice_length_scale:-${PIPER_LENGTH_SCALE:-1.0}}"
        local sentence_silence="${voice_sentence_silence:-${PIPER_SENTENCE_SILENCE:-0.2}}"

        if [[ -n "$output" ]]; then
            # Save to file
            echo -n "Generating audio..."
            if echo "$content" | piper --model "$voice_path" --length-scale "$length_scale" --sentence-silence "$sentence_silence" --output_file "$output" 2>/dev/null; then
                echo ""
                log_success "Saved to: $output"
            else
                echo ""
                log_error "Failed to generate audio"
                return 1
            fi
        else
            # Prefer streaming to avoid large temp files
            if command -v ffplay &>/dev/null; then
                # Stream directly to ffplay (no temp file needed)
                echo "Generating and playing audio..."
                if ! echo "$content" | piper --model "$voice_path" --length-scale "$length_scale" --sentence-silence "$sentence_silence" --output-raw 2>/dev/null | ffplay -i pipe: -f s16le -ar 22050 -nodisp -autoexit -loglevel quiet 2>/dev/null; then
                    log_error "Failed to generate/play audio"
                    return 1
                fi
            else
                # Fall back to temp file method
                local tmpbase tmpfile
                tmpbase=$(mktemp) || {
                    log_error "Failed to create temporary file"
                    return 1
                }
                tmpfile="${tmpbase}.wav"
                rm -f "$tmpbase"  # Remove the empty file mktemp created

                echo -n "Generating audio..."
                if ! echo "$content" | piper --model "$voice_path" --length-scale "$length_scale" --sentence-silence "$sentence_silence" --output_file "$tmpfile" 2>/dev/null; then
                    echo ""
                    log_error "Failed to generate audio"
                    rm -f "$tmpfile" 2>/dev/null
                    return 1
                fi
                echo " playing..."

                play_wav_file "$tmpfile"
                local play_result=$?

                # Clean up temp file
                rm -f "$tmpfile" 2>/dev/null

                if [[ $play_result -ne 0 ]]; then
                    log_error "Failed to play audio"
                    return 1
                fi
            fi
        fi
    }

    # read-novel: Read all chapters in sequence
    # Usage: read-novel <campaign> [--voice <voice>] [--from <N>]
    read-novel() {
        local campaign=""
        local voice=""
        local from_chapter=1

        # Parse arguments
        while [[ $# -gt 0 ]]; do
            case "$1" in
                --voice|-v)
                    if [[ -z "${2:-}" || "$2" == --* ]]; then
                        log_error "--voice requires a voice name"
                        return 1
                    fi
                    voice="$2"
                    shift 2
                    ;;
                --from|-f)
                    if [[ -z "${2:-}" || "$2" == --* ]]; then
                        log_error "--from requires a chapter number"
                        return 1
                    fi
                    from_chapter="$2"
                    shift 2
                    ;;
                --help|-h)
                    cat <<'EOF'
Usage: read-novel <campaign> [options]

Arguments:
  campaign    Campaign name (e.g., the-rot-beneath)

Options:
  --voice, -v <voice>   Voice to use for all chapters (default: auto per POV)
  --from, -f <N>        Start from chapter N (default: 1)
  --help, -h            Show this help

Examples:
  read-novel the-rot-beneath
  read-novel the-rot-beneath --from 3
  read-novel the-rot-beneath --voice lessac
EOF
                    return 0
                    ;;
                *)
                    campaign="$1"
                    shift
                    ;;
            esac
        done

        if [[ -z "$campaign" ]]; then
            log_error "Missing campaign name"
            echo "Usage: read-novel <campaign> [--voice <voice>]"
            return 1
        fi

        validate_campaign_name "$campaign" || return 1
        validate_chapter_number "$from_chapter" || return 1

        local novel_dir="$PIPER_REPO_ROOT/campaigns/$campaign/novel"
        if [[ ! -d "$novel_dir" ]]; then
            log_error "Novel directory not found: $novel_dir"
            return 1
        fi

        log_info "=== Reading: $campaign ==="
        echo ""

        # Find and read all chapters
        local found_chapters=0
        for chapter_file in "$novel_dir"/chapter-*.md; do
            # Skip drafts
            [[ "$chapter_file" == *-draft.md ]] && continue
            [[ ! -f "$chapter_file" ]] && continue

            # Extract chapter number
            local file_base
            file_base=$(basename "$chapter_file" .md)
            local chapter_num=${file_base#chapter-}
            # Remove leading zeros safely
            chapter_num=$(echo "$chapter_num" | sed 's/^0*//')
            [[ -z "$chapter_num" ]] && chapter_num=0

            # Skip if before from_chapter
            [[ $chapter_num -lt $from_chapter ]] && continue

            ((found_chapters++))
            log_warn "--- Chapter $chapter_num ---"

            if [[ -n "$voice" ]]; then
                read-chapter "$campaign" "$chapter_num" --voice "$voice"
            else
                read-chapter "$campaign" "$chapter_num"
            fi

            echo ""
            if is_interactive; then
                log_info "Press Enter for next chapter, or Ctrl+C to stop..."
                read -r
            fi
        done

        if [[ $found_chapters -eq 0 ]]; then
            log_error "No chapters found in $novel_dir"
            return 1
        fi

        log_success "=== Finished ==="
    }

    # Export functions for subshells (bash only)
    export -f read-chapter 2>/dev/null || true
    export -f read-novel 2>/dev/null || true
}

# Show available commands after setup
show_available_commands() {
    echo ""
    log_success "=== Piper TTS Ready ==="
    echo ""
    echo -e "${BLUE}Available commands:${NC}"
    echo ""
    echo -e "  ${GREEN}read-chapter${NC} <campaign> <chapter> [options]"
    echo "      Read a single chapter aloud"
    echo "      Options: --voice <voice>, --save <file.wav>"
    echo ""
    echo -e "  ${GREEN}read-novel${NC} <campaign> [options]"
    echo "      Read all chapters in sequence"
    echo "      Options: --voice <voice>, --from <N>"
    echo ""
    echo -e "${BLUE}Quick start:${NC}"
    echo "  read-chapter the-rot-beneath 1"
    echo "  read-novel the-rot-beneath --from 3"
    echo ""
}

# =============================================================================
# Environment Activation
# =============================================================================

activate_env() {
    if [[ -d "$VENV_DIR" ]]; then
        if ! source "$VENV_DIR/bin/activate"; then
            log_error "Failed to activate virtual environment"
            return 1
        fi

        # Define reader functions
        define_reader_functions

        # Check if any voices installed
        local voice_count
        voice_count=$(count_voices)

        if [[ "$voice_count" -eq 0 ]]; then
            log_warn "No voices installed yet."
            local response
            response=$(prompt_user "Install recommended voices now? [Y/n] " "y")
            if [[ -z "$response" || "$response" =~ ^[Yy] ]]; then
                install_recommended_voices
            else
                echo -e "Run ${BLUE}source scripts/piper-env.sh${NC} to install voices later."
            fi
        fi
    else
        log_warn "Piper environment not found. Setting up..."
        check_uv || return 1
        setup_venv || return 1
        define_reader_functions
        echo ""
        local response
        response=$(prompt_user "Install recommended voices now? [Y/n] " "y")
        if [[ -z "$response" || "$response" =~ ^[Yy] ]]; then
            install_recommended_voices
        fi
    fi

    # Show available commands at the end
    show_available_commands
}

show_help() {
    cat <<'EOF'
piper-env.sh - Setup and manage Piper TTS environment

Usage:
  source scripts/piper-env.sh      Activate environment (install if needed)
  scripts/piper-env.sh --check     Check if Piper is installed
  scripts/piper-env.sh --voices    List installed voices
  scripts/piper-env.sh --install-voices  Interactive voice installer
  scripts/piper-env.sh --help      Show this help

After sourcing, these commands are available:
  read-chapter <campaign> <chapter> [--voice <voice>]
  read-novel <campaign> [--voice <voice>] [--from <N>]

Examples:
  read-chapter the-rot-beneath 1              # Read chapter 1
  read-chapter the-rot-beneath 2 --voice amy  # Use specific voice
  read-novel the-rot-beneath                  # Read all chapters
  read-novel the-rot-beneath --from 3         # Start from chapter 3

Voice Configuration:
  Create campaigns/{campaign}/novel/voices.yaml to map characters to voices:
    corwin-voss:
      voice: en_US-ryan-high
      length_scale: 1.1
      sentence_silence: 0.4

Requirements:
  - bash or zsh (not sh, dash, or fish)
  - uv (Python environment manager)
  - Audio: ffplay recommended (streams, no temp files), or afplay/aplay/mpv
EOF
}

# =============================================================================
# Main Entry Point
# =============================================================================

case "${1:-}" in
    --check)
        if [[ -d "$VENV_DIR" ]] && [[ $(count_voices) -gt 0 ]]; then
            log_success "Piper is installed and ready."
            list_voices
            exit 0
        else
            log_error "Piper is not fully set up."
            [[ ! -d "$VENV_DIR" ]] && echo "  - Virtual environment missing"
            [[ $(count_voices) -eq 0 ]] && echo "  - No voices installed"
            exit 1
        fi
        ;;
    --voices)
        list_voices
        exit 0
        ;;
    --install-voices)
        install_voices_interactive
        exit 0
        ;;
    --help|-h)
        show_help
        exit 0
        ;;
    "")
        # No args - activate
        activate_env
        ;;
    *)
        log_error "Unknown option: $1"
        show_help
        exit 2
        ;;
esac
