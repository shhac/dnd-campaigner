# Voice Samples Reference

Chatterbox TTS uses voice samples for cloning. Samples are stored in `.chatterbox-voices/`.

## Available Samples

| File | Source | Use Case |
|------|--------|----------|
| `narrator-male.wav` | Custom | Male narration |
| `narrator-female.wav` | Custom | Female narration |
| `ryan-internal.wav` | Piper (Ryan) | Male internal thoughts |
| `amy-internal.wav` | Piper (Amy) | Female internal thoughts |
| `evan-sample.wav` | macOS (Evan Enhanced) | US male character voice |
| `ava-sample.wav` | macOS (Ava Premium) | US female character voice |
| `jamie-sample.wav` | macOS (Jamie Premium) | British character voice |
| `matilda-sample.wav` | macOS (Matilda Premium) | Australian female voice |
| `zoe-sample.wav` | macOS (Zoe Premium) | US female character voice |
| `isha-sample.wav` | macOS (Isha Premium) | Indian English female voice |

## Creating New Samples

### From Piper TTS
```bash
source .piper-venv/bin/activate && echo "Your sample text here - make it 10-30 seconds of natural speech." | piper --model .piper-voices/en_US-ryan-high.onnx -o output.wav
```

### From macOS Voices
```bash
say -v "Zoe (Premium)" -o output.aiff "Your sample text here - make it 10-30 seconds of natural speech." && ffmpeg -i output.aiff -ar 24000 -ac 1 output.wav
```

## Sample Guidelines

- **Duration**: 10-30 seconds of natural speech
- **Content**: Use varied sentences, not just one repeated phrase
- **Quality**: Clear audio, minimal background noise
- **Format**: WAV, 24kHz sample rate, mono channel

## Voice Selection Tips

- **Narration**: Use narrator-male/female for third-person prose
- **Internal thoughts**: Use ryan-internal/amy-internal for italicized character thoughts
- **Character dialogue**: Match voice to character personality and background
- **Consistency**: Once assigned, keep the same voice throughout the novel
