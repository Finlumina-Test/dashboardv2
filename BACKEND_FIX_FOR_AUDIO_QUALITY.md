# Backend Fix for Crystal Clear Audio Quality

## Problem
Your backend is currently configured to use **mulaw 8kHz** (phone quality) for both Twilio AND dashboards. This is why live monitoring sounds bad - it's receiving low-quality audio.

## Root Cause
In `services/openai_service.py`, the OpenAI session is configured as:

```python
"audio": {
    "input": {"format": {"type": "audio/pcmu"}},  # mulaw 8kHz
    "output": {"format": {"type": "audio/pcmu"}}  # mulaw 8kHz
}
```

**Both Twilio and dashboards receive the SAME mulaw 8kHz audio.**

## The Solution

### Step 1: Change OpenAI Configuration to Use High Quality Audio

In `services/openai_service.py`, change the audio format to **pcm16**:

```python
"audio": {
    "input": {"format": {"type": "audio/pcm16"}},   # 16-bit PCM at 24kHz
    "output": {"format": {"type": "audio/pcm16"}}   # 16-bit PCM at 24kHz
}
```

This will make OpenAI send **16-bit PCM at 24kHz** instead of mulaw 8kHz.

### Step 2: Send High Quality Audio to Dashboards

When broadcasting audio to dashboards via WebSocket, send:

```python
{
    "audio": base64_audio,
    "format": "pcm16",      # Tell frontend it's pcm16
    "sampleRate": 24000,    # Tell frontend it's 24kHz
    "speaker": "AI"         # or "Caller"
}
```

### Step 3: Handle Twilio Separately

Twilio uses mulaw for phone calls. You have two options:

**Option A: Send PCM16 to Twilio (Twilio supports it)**
- Twilio accepts both mulaw and pcm16
- Just send the pcm16 audio from OpenAI directly to Twilio

**Option B: Convert PCM16 to Mulaw for Twilio**
- If Twilio needs mulaw, convert pcm16→mulaw only for Twilio
- Keep the original pcm16 for dashboards

```python
# Pseudocode
ai_audio_pcm16 = get_from_openai()  # High quality pcm16 24kHz

# Send high quality to dashboards
broadcast_to_dashboards(ai_audio_pcm16, format="pcm16", sampleRate=24000)

# Convert to mulaw ONLY for Twilio (if needed)
ai_audio_mulaw = convert_pcm16_to_mulaw(ai_audio_pcm16)
send_to_twilio(ai_audio_mulaw)
```

## Caller Audio

Caller audio comes from Twilio as **mulaw 8kHz** (can't be changed - it's a phone line).

When sending to dashboards, still send it as mulaw 8kHz:

```python
{
    "audio": base64_caller_audio,
    "format": "mulaw",      # Caller is mulaw from phone
    "sampleRate": 8000,     # Caller is 8kHz
    "speaker": "Caller"
}
```

The frontend will handle upsampling caller audio from 8kHz to 48kHz.

## Expected Result

After these changes:
- **AI audio**: pcm16 24kHz (3x better quality than before!)
- **Caller audio**: mulaw 8kHz (no change - phone quality is the limit)

Live monitoring will sound **significantly better**, especially for AI voice.

## Frontend is Already Ready

The frontend code in `web/src/hooks/useMultiCallWebSocket.js` already detects and handles both formats:

```javascript
const format = data.format || data.encoding || "mulaw";
const sampleRate =
  data.sampleRate ||
  data.sample_rate ||
  (format === "pcm16" ? 24000 : 8000);
```

No frontend changes needed - just fix the backend!

---

## Files to Modify in Backend

1. **services/openai_service.py**: Change audio format from "audio/pcmu" to "audio/pcm16"
2. **services/websocket_manager.py** (or similar): Include format/sampleRate in WebSocket messages to dashboards

Let me know if you need help with the specific Python code!
