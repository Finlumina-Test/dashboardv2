# Backend Audio Format Conversion Code

## Problem
After changing OpenAI to use pcm16:
- ✅ Dashboard audio is **perfect** (pcm16 24kHz)
- ❌ Twilio hears "khar khar" noise (receiving pcm16 when it needs mulaw)
- ❌ OpenAI doesn't respond to caller (receiving mulaw when it needs pcm16)

## Solution
Update the conversion methods in `services/audio_service.py` to actually convert between formats.

---

## Code to Add to `services/audio_service.py`

Add these conversion functions to your `AudioFormatConverter` class:

```python
import audioop
import base64

class AudioFormatConverter:
    """Handles audio format conversion between Twilio (mulaw 8kHz) and OpenAI (pcm16 24kHz)"""

    @staticmethod
    def twilio_to_openai(mulaw_payload_b64: str) -> str:
        """
        Convert Twilio's mulaw 8kHz audio to OpenAI's pcm16 24kHz format

        Args:
            mulaw_payload_b64: Base64-encoded mulaw audio from Twilio

        Returns:
            Base64-encoded pcm16 audio for OpenAI at 24kHz
        """
        try:
            # Decode base64 to get raw mulaw bytes
            mulaw_bytes = base64.b64decode(mulaw_payload_b64)

            # Convert mulaw to linear PCM (16-bit)
            pcm_8khz = audioop.ulaw2lin(mulaw_bytes, 2)  # 2 = 16-bit samples

            # Resample from 8kHz to 24kHz (3x upsampling)
            pcm_24khz = audioop.ratecv(
                pcm_8khz,      # Input audio data
                2,             # Sample width (16-bit = 2 bytes)
                1,             # Number of channels (mono)
                8000,          # Input sample rate
                24000,         # Output sample rate
                None           # No state (for single-shot conversion)
            )[0]  # ratecv returns (data, state) tuple

            # Encode to base64 for OpenAI
            pcm16_b64 = base64.b64encode(pcm_24khz).decode('utf-8')

            return pcm16_b64

        except Exception as e:
            print(f"❌ Error converting Twilio→OpenAI audio: {e}")
            # Return original on error (fallback)
            return mulaw_payload_b64

    @staticmethod
    def openai_to_twilio(pcm16_payload_b64: str) -> str:
        """
        Convert OpenAI's pcm16 24kHz audio to Twilio's mulaw 8kHz format

        Args:
            pcm16_payload_b64: Base64-encoded pcm16 audio from OpenAI

        Returns:
            Base64-encoded mulaw audio for Twilio at 8kHz
        """
        try:
            # Decode base64 to get raw pcm16 bytes
            pcm_24khz = base64.b64decode(pcm16_payload_b64)

            # Resample from 24kHz to 8kHz (1/3 downsampling)
            pcm_8khz = audioop.ratecv(
                pcm_24khz,     # Input audio data
                2,             # Sample width (16-bit = 2 bytes)
                1,             # Number of channels (mono)
                24000,         # Input sample rate
                8000,          # Output sample rate
                None           # No state
            )[0]

            # Convert linear PCM to mulaw
            mulaw_bytes = audioop.lin2ulaw(pcm_8khz, 2)  # 2 = 16-bit samples

            # Encode to base64 for Twilio
            mulaw_b64 = base64.b64encode(mulaw_bytes).decode('utf-8')

            return mulaw_b64

        except Exception as e:
            print(f"❌ Error converting OpenAI→Twilio audio: {e}")
            # Return original on error (fallback)
            return pcm16_payload_b64
```

---

## How These Methods Work

### `twilio_to_openai()` (Caller Audio)
1. **Decode base64** → raw mulaw bytes
2. **Convert mulaw → pcm16** using `audioop.ulaw2lin()`
3. **Resample 8kHz → 24kHz** using `audioop.ratecv()` (3x upsampling)
4. **Encode to base64** → send to OpenAI

### `openai_to_twilio()` (AI Audio)
1. **Decode base64** → raw pcm16 bytes
2. **Resample 24kHz → 8kHz** using `audioop.ratecv()` (1/3 downsampling)
3. **Convert pcm16 → mulaw** using `audioop.lin2ulaw()`
4. **Encode to base64** → send to Twilio

---

## Testing

After updating the code:

1. **Call your number**: +1 727 513-2412
2. **Expected results**:
   - ✅ Twilio should sound clear (no more "khar khar")
   - ✅ OpenAI should respond to your voice
   - ✅ Dashboard AI audio still perfect (pcm16 24kHz)
   - ✅ Dashboard caller audio works (mulaw 8kHz upsampled to 48kHz)

---

## Notes

- **`audioop` module** is part of Python's standard library (no extra packages needed)
- **Error handling**: Falls back to original audio if conversion fails
- **Performance**: These conversions are fast and don't add significant latency
- **Quality**:
  - Twilio: mulaw 8kHz (phone quality - expected)
  - OpenAI: pcm16 24kHz (high quality - 3x better!)
  - Dashboard: receives best quality from each source

Let me know if you need help integrating this code!
