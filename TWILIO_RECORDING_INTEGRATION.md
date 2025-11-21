# Twilio Recording Integration Guide

## Overview
The frontend now expects Twilio recordings to be linked to calls. This guide explains how your backend should integrate.

## Current Issue
- ✅ Backend IS uploading recordings to Supabase Storage
- ❌ Backend is NOT linking the audio URL to the call record in database
- Result: Calls appear in history without audio button

## Solution: Backend Must Update Audio URL

After uploading a Twilio recording to Supabase Storage, your backend needs to **update the call record in the database** with the audio URL.

### Option 1: Use the Save Endpoint with Audio-Only Flag (Recommended - Works Now)

**TEMPORARY WORKAROUND:** Until you restart your dev server, use the `/api/calls/save` endpoint with `update_audio_only: true`:

```bash
POST /api/calls/save
Content-Type: application/json

{
  "call_sid": "CAxxxxx...",
  "audio_url": "https://your-supabase-project.supabase.co/storage/v1/object/public/your-bucket/recording.mp3",
  "update_audio_only": true
}
```

**Example using Python:**
```python
import httpx
import asyncio

async def update_call_audio(call_sid, audio_url):
    """Update call audio URL using save endpoint workaround"""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{Config.FRONTEND_URL}/api/calls/save",
            json={
                "call_sid": call_sid,
                "audio_url": audio_url,
                "update_audio_only": True  # This flag makes it audio-only
            },
            timeout=10.0
        )

        if response.status_code == 200:
            Log.info(f"✅ Audio URL updated: {call_sid}")
            return response.json()
        else:
            Log.error(f"❌ Failed to update audio URL: {response.status_code}")
            return None

# After uploading recording to Supabase Storage
audio_url = await upload_to_supabase(recording_file)
await update_call_audio("CAfe8025859eef913c5b3b02d443c48cf6", audio_url)
```

### Option 2: Use the Update Audio Endpoint (After Dev Server Restart)

After uploading to Supabase Storage, call this endpoint:

```bash
POST /api/calls/update-audio
Content-Type: application/json

{
  "call_sid": "CAxxxxx...",
  "audio_url": "https://your-supabase-project.supabase.co/storage/v1/object/public/your-bucket/recording.mp3"
}
```

**Example using Python (with retry handling):**
```python
import httpx
import asyncio

async def update_call_audio(call_sid, audio_url, retry_count=0):
    """Update call audio URL with retry handling for race conditions"""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{Config.FRONTEND_URL}/api/calls/update-audio",
            json={
                "call_sid": call_sid,
                "audio_url": audio_url,
                "retry_count": retry_count
            },
            timeout=10.0
        )

        data = response.json()

        # Handle retry for race condition (call not saved yet)
        if response.status_code == 404 and data.get("retry"):
            if retry_count < 2:
                retry_after = data.get("retry_after", 2000) / 1000  # ms to seconds
                Log.info(f"⏳ Call not found yet, retrying in {retry_after}s...")
                await asyncio.sleep(retry_after)
                return await update_call_audio(call_sid, audio_url, retry_count + 1)
            else:
                Log.error(f"❌ Call not found after 3 attempts: {call_sid}")
                return None

        if response.status_code == 200:
            Log.info(f"✅ Audio URL updated: {call_sid}")
            return data
        else:
            Log.error(f"❌ Failed to update audio URL: {response.status_code}")
            return None

# After uploading recording to Supabase Storage
audio_url = await upload_to_supabase(recording_file)
await update_call_audio("CAfe8025859eef913c5b3b02d443c48cf6", audio_url)
```

**Example using Node.js:**
```javascript
async function updateCallAudio(callSid, audioUrl) {
  const response = await fetch('https://your-frontend-url.com/api/calls/update-audio', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      call_sid: callSid,
      audio_url: audioUrl
    })
  });
  return response.json();
}

// After uploading recording to Supabase Storage
const audioUrl = await uploadToSupabase(recordingFile);
await updateCallAudio("CAfe8025859eef913c5b3b02d443c48cf6", audioUrl);
```

### Option 2: Update Database Directly

If your backend has direct Supabase access:

```sql
UPDATE calls
SET audio_url = 'https://...your-recording-url.mp3',
    updated_at = NOW()
WHERE call_sid = 'CAxxxxx...'
```

## Supabase Storage Best Practices

### Current Structure
Your recordings are going to the bucket root:
```
bucket/
  CA150e3d08589a7ebdd1b2f0d2547efceb_REf27a91089c97c8e7b711e676a99de044.mp3
```

### Recommended Structure
Use a folder structure for better organization:
```
bucket/
  call-recordings/
    demo/
      2024-01-15/
        CA150e3d08589a7ebdd1b2f0d2547efceb.mp3
    restaurant_a/
      2024-01-15/
        CA789abc123def456.mp3
```

**Benefits:**
- Easy to manage and clean up old recordings
- Better organization by restaurant and date
- Easier to implement retention policies

## Frontend Behavior

### What Frontend Does:
1. Saves call with `audio_url: null`
2. Polls `/api/calls/details/{id}` every 2 seconds (10 times)
3. Once audio URL is found, stops polling
4. Auto-refreshes history every 10 seconds to show new calls

### Timeline:
```
t=0s:   Frontend saves call (audio_url: null)
t=0-20s: Backend processes Twilio recording, uploads to Storage
t=0-20s: Frontend polls for audio URL
t=20s:  Backend updates audio URL via /api/calls/update-audio
t=20-30s: Frontend auto-refresh picks up the audio URL
t=30s+: Call appears in history WITH audio button
```

## Testing

1. Make a call
2. Check browser console for:
   ```
   ✅ CALL SAVED SUCCESSFULLY
   ⏳ No audio URL yet - backend will add Twilio recording. Polling...
   🔄 Polling for audio URL (attempt 1/10)...
   ✅ Audio URL found: https://...
   ```
3. Check call history - audio button should appear within 30 seconds

## Troubleshooting

### Calls appear but no audio button
- Backend uploaded recording but didn't update database
- Check if backend is calling `/api/calls/update-audio`
- Check Supabase Storage - is the file there?

### Calls disappear
- This should be FIXED now
- History no longer depends on WebSocket connection

### Audio won't play
- Check audio URL is publicly accessible
- Try opening URL directly in browser
- Check CORS settings on Supabase Storage

## File Naming Convention

Current format: `{CallSid}_{RecordingSid}.mp3`

Example:
```
CA150e3d08589a7ebdd1b2f0d2547efceb_REf27a91089c97c8e7b711e676a99de044.mp3
```

This is perfect! Keep using this format.

## Need Help?

Check frontend logs in browser console for polling status and debug info.
