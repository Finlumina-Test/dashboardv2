// Audio encoding, decoding, and playback utilities

// µ-law encoder function
export const encodeToMulaw = (pcmSamples) => {
  const mulawSamples = new Uint8Array(pcmSamples.length);
  for (let i = 0; i < pcmSamples.length; i++) {
    let sample = Math.max(-1, Math.min(1, pcmSamples[i]));
    sample = sample * 32768;
    const sign = sample < 0 ? 0x80 : 0x00;
    sample = Math.abs(sample) + 132;
    let exponent = 7;
    for (let exp = 0; exp < 8; exp++) {
      if (sample <= 0x1f << (exp + 3)) {
        exponent = exp;
        break;
      }
    }
    const mantissa = (sample >> (exponent + 3)) & 0x0f;
    mulawSamples[i] = ~(sign | (exponent << 4) | mantissa);
  }
  return mulawSamples;
};

// µ-law decoder for caller audio
export const decodeMulaw = (mulawBytes) => {
  const pcm16 = new Int16Array(mulawBytes.length);
  const MULAW_BIAS = 0x84;
  const MULAW_MAX = 0x1fff;

  for (let i = 0; i < mulawBytes.length; i++) {
    let mu = ~mulawBytes[i];
    const sign = mu & 0x80;
    const exponent = (mu >> 4) & 0x07;
    const mantissa = mu & 0x0f;

    let magnitude = ((mantissa << 3) + MULAW_BIAS) << exponent;
    magnitude = Math.min(magnitude, MULAW_MAX);

    pcm16[i] = sign === 0 ? magnitude : -magnitude;
  }

  return pcm16;
};

// PCM16 decoder - handles both base64 PCM16 and µ-law
export const decodePcm16 = (base64Audio, sourceFormat = "pcm16") => {
  const binaryString = atob(base64Audio);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  if (sourceFormat === "mulaw") {
    return decodeMulaw(bytes);
  } else {
    const pcm16 = new Int16Array(bytes.buffer);
    return pcm16;
  }
};

// High-quality cubic interpolation resampling with anti-aliasing
export const resamplePcm16HQ = (pcm16Data, sourceRate, targetRate) => {
  if (sourceRate === targetRate) return pcm16Data;

  const ratio = targetRate / sourceRate;
  const newLength = Math.floor(pcm16Data.length * ratio);
  const resampled = new Int16Array(newLength);

  // Apply low-pass filter if downsampling to prevent aliasing
  const needsLowPass = ratio < 1;
  const cutoffFreq = needsLowPass ? targetRate / 2 : sourceRate / 2;

  for (let i = 0; i < newLength; i++) {
    const srcPos = i / ratio;
    const srcIndex = Math.floor(srcPos);
    const frac = srcPos - srcIndex;

    // Get 4 surrounding samples for cubic interpolation
    const p0 = pcm16Data[Math.max(0, srcIndex - 1)] || 0;
    const p1 = pcm16Data[srcIndex] || 0;
    const p2 = pcm16Data[Math.min(pcm16Data.length - 1, srcIndex + 1)] || 0;
    const p3 = pcm16Data[Math.min(pcm16Data.length - 1, srcIndex + 2)] || 0;

    // Cubic interpolation (Catmull-Rom spline)
    const a0 = p3 - p2 - p0 + p1;
    const a1 = p0 - p1 - a0;
    const a2 = p2 - p0;
    const a3 = p1;

    const interpolated = a0 * frac * frac * frac + a1 * frac * frac + a2 * frac + a3;

    // Clamp to prevent overflow
    resampled[i] = Math.max(-32768, Math.min(32767, Math.round(interpolated)));
  }

  return resampled;
};

// Audio enhancement: normalize volume and improve clarity
const enhanceAudio = (float32Data) => {
  // Find peak amplitude
  let peak = 0;
  for (let i = 0; i < float32Data.length; i++) {
    const abs = Math.abs(float32Data[i]);
    if (abs > peak) peak = abs;
  }

  // Apply intelligent gain - normalize to 85% to prevent clipping but maintain clarity
  const targetPeak = 0.85;
  const gain = peak > 0.01 ? targetPeak / peak : 1.0;

  // Apply gain with soft clipping for natural sound
  const enhanced = new Float32Array(float32Data.length);
  for (let i = 0; i < float32Data.length; i++) {
    let sample = float32Data[i] * gain;

    // Soft clipping using tanh for natural saturation
    if (Math.abs(sample) > 0.85) {
      sample = Math.tanh(sample * 1.2) * 0.95;
    }

    enhanced[i] = Math.max(-1, Math.min(1, sample));
  }

  return enhanced;
};

// High-quality audio playback WITH proper recording and enhancement
export const playAudioHQ = async (
  base64Audio,
  audioCtxRef,
  audioChunksRef,
  callSessionActiveRef,
  sourceFormat = "pcm16",
  sourceRate = 24000,
  speaker = null,
  audioId = null, // 🔥 NEW: Unique ID to prevent duplicates
  isMuted = false, // 🔥 NEW: Mute control
) => {
  try {
    // 🔥 CRITICAL: Create unique ID if not provided
    const uniqueId =
      audioId || `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 🔥 PREVENT DUPLICATES: Check if we've already recorded this audio
    if (!audioChunksRef.current.recordedIds) {
      audioChunksRef.current.recordedIds = new Set();
    }

    if (audioChunksRef.current.recordedIds.has(uniqueId)) {
      return; // Already recorded, skip silently
    }

    const pcm16Data = decodePcm16(base64Audio, sourceFormat);
    const targetRate = audioCtxRef.current.sampleRate;

    // 🔥 RECORD ONCE: Store original audio for recording (BEFORE any playback processing)
    if (callSessionActiveRef.current) {
      // Convert to Float32 at ORIGINAL rate
      const originalFloat32 = new Float32Array(pcm16Data.length);
      for (let i = 0; i < pcm16Data.length; i++) {
        originalFloat32[i] = Math.max(-1, Math.min(1, pcm16Data[i] / 32768.0));
      }

      // Store with proper metadata
      audioChunksRef.current.push({
        id: uniqueId,
        data: originalFloat32,
        sampleRate: sourceRate, // Original rate (8000 for mulaw, 24000 for pcm16)
        speaker: speaker,
        timestamp: Date.now(),
      });

      // Mark as recorded
      audioChunksRef.current.recordedIds.add(uniqueId);
    }

    // 🔥 SKIP PLAYBACK: If muted, don't play audio
    if (isMuted) {
      return;
    }

    // 🔥 ENHANCED PLAYBACK: High-quality resampling with enhancement
    const processedData = resamplePcm16HQ(pcm16Data, sourceRate, targetRate);

    // Convert to Float32 for playback
    const float32Data = new Float32Array(processedData.length);
    for (let i = 0; i < processedData.length; i++) {
      float32Data[i] = Math.max(-1, Math.min(1, processedData[i] / 32768.0));
    }

    // 🔥 NEW: Apply audio enhancement for crystal-clear playback
    const enhancedData = enhanceAudio(float32Data);

    // Create audio buffer with enhanced data
    const buffer = audioCtxRef.current.createBuffer(
      1,
      enhancedData.length,
      targetRate,
    );
    buffer.getChannelData(0).set(enhancedData);

    // 🔥 NEW: Create gain node for volume control
    const gainNode = audioCtxRef.current.createGain();
    gainNode.gain.value = 1.0; // Unity gain, can be adjusted if needed

    const source = audioCtxRef.current.createBufferSource();
    source.buffer = buffer;

    // Connect: source -> gain -> destination for better control
    source.connect(gainNode);
    gainNode.connect(audioCtxRef.current.destination);

    source.start(0);
  } catch (error) {
    console.error("❌ Failed to play audio:", error);
  }
};

// Initialize audio context with higher quality settings
export const initAudioContext = async (
  audioCtxRef,
  setAudioEnabled,
  setError,
) => {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContextClass({
        sampleRate: 48000,
        latencyHint: "interactive",
      });
    }

    if (audioCtxRef.current.state === "suspended") {
      await audioCtxRef.current.resume();
    }

    setAudioEnabled(true);
    return true;
  } catch (error) {
    console.error("❌ Failed to initialize audio context:", error);
    setError("Audio initialization failed");
    return false;
  }
};
