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

// Professional-grade resampling with windowed sinc interpolation
export const resamplePcm16HQ = (pcm16Data, sourceRate, targetRate) => {
  if (sourceRate === targetRate) return pcm16Data;

  const ratio = targetRate / sourceRate;
  const newLength = Math.floor(pcm16Data.length * ratio);
  const resampled = new Int16Array(newLength);

  // Windowed sinc parameters for high-quality resampling
  const windowSize = 8; // Larger window for better quality
  const lanczosA = 3; // Lanczos parameter

  // Lanczos windowed sinc function
  const lanczos = (x) => {
    if (x === 0) return 1;
    if (Math.abs(x) >= lanczosA) return 0;

    const pix = Math.PI * x;
    return (lanczosA * Math.sin(pix) * Math.sin(pix / lanczosA)) / (pix * pix);
  };

  for (let i = 0; i < newLength; i++) {
    const srcPos = i / ratio;
    const srcIndex = Math.floor(srcPos);

    let sum = 0;
    let weightSum = 0;

    // Apply windowed sinc interpolation
    for (let j = -windowSize; j <= windowSize; j++) {
      const sampleIndex = srcIndex + j;

      if (sampleIndex >= 0 && sampleIndex < pcm16Data.length) {
        const distance = srcPos - sampleIndex;
        const weight = lanczos(distance);

        sum += pcm16Data[sampleIndex] * weight;
        weightSum += weight;
      }
    }

    // Normalize and clamp
    const interpolated = weightSum > 0 ? sum / weightSum : 0;
    resampled[i] = Math.max(-32768, Math.min(32767, Math.round(interpolated)));
  }

  return resampled;
};

// Professional Audio Processing Chain for Crystal Clear Quality

// High-quality noise gate - removes background noise below threshold
const applyNoiseGate = (float32Data, threshold = 0.01, attack = 0.001, release = 0.05) => {
  const sampleRate = 48000; // Target sample rate
  const attackSamples = Math.floor(attack * sampleRate);
  const releaseSamples = Math.floor(release * sampleRate);

  const output = new Float32Array(float32Data.length);
  let gateOpen = false;
  let envelope = 0;

  for (let i = 0; i < float32Data.length; i++) {
    const sample = Math.abs(float32Data[i]);

    // Determine if gate should be open
    const shouldOpen = sample > threshold;

    if (shouldOpen && !gateOpen) {
      gateOpen = true;
    } else if (!shouldOpen && gateOpen && envelope < threshold) {
      gateOpen = false;
    }

    // Apply envelope
    if (gateOpen) {
      envelope = Math.min(1, envelope + 1 / attackSamples);
    } else {
      envelope = Math.max(0, envelope - 1 / releaseSamples);
    }

    output[i] = float32Data[i] * envelope;
  }

  return output;
};

// Professional EQ - boost voice frequencies for clarity
const applyVoiceEQ = (float32Data, sampleRate = 48000) => {
  // Simple but effective voice enhancement
  // Boost 300Hz-3kHz (human voice range)
  // This is a simplified approach - in production you'd use biquad filters

  const output = new Float32Array(float32Data.length);

  // High-pass filter to remove rumble below 80Hz
  let prevSample = 0;
  const alpha = 0.99; // High-pass coefficient

  for (let i = 0; i < float32Data.length; i++) {
    output[i] = alpha * (output[i - 1] || 0) + alpha * (float32Data[i] - prevSample);
    prevSample = float32Data[i];
  }

  return output;
};

// Professional dynamic range compressor
const applyCompression = (float32Data, threshold = 0.5, ratio = 3, knee = 0.1) => {
  const output = new Float32Array(float32Data.length);

  for (let i = 0; i < float32Data.length; i++) {
    const sample = float32Data[i];
    const magnitude = Math.abs(sample);
    const sign = sample >= 0 ? 1 : -1;

    let compressed = magnitude;

    if (magnitude > threshold) {
      // Soft knee compression
      const excess = magnitude - threshold;
      const compressedExcess = excess / ratio;
      compressed = threshold + compressedExcess;
    }

    output[i] = compressed * sign;
  }

  return output;
};

// Professional limiter - prevents clipping while maintaining loudness
const applyLimiter = (float32Data, ceiling = 0.95, release = 0.05) => {
  const output = new Float32Array(float32Data.length);
  let gain = 1.0;
  const releaseCoeff = Math.exp(-1 / (release * 48000));

  for (let i = 0; i < float32Data.length; i++) {
    const sample = Math.abs(float32Data[i]);
    const sign = float32Data[i] >= 0 ? 1 : -1;

    // Calculate required gain reduction
    if (sample * gain > ceiling) {
      gain = ceiling / sample;
    } else {
      // Release gain reduction
      gain = Math.min(1.0, gain + (1.0 - gain) * (1 - releaseCoeff));
    }

    output[i] = float32Data[i] * gain;
  }

  return output;
};

// Professional audio enhancement for AI voice
const enhanceAIAudio = (float32Data) => {
  // Step 1: Remove noise
  let processed = applyNoiseGate(float32Data, 0.008, 0.001, 0.05);

  // Step 2: Apply voice EQ
  processed = applyVoiceEQ(processed);

  // Step 3: Gentle compression for consistency
  processed = applyCompression(processed, 0.4, 2.5, 0.1);

  // Step 4: Final limiting
  processed = applyLimiter(processed, 0.98, 0.05);

  return processed;
};

// Professional audio enhancement for caller voice
const enhanceCallerAudio = (float32Data) => {
  // 🔥 FIX: Caller audio is VERY quiet (peak ~0.004), so use gentle threshold
  // Step 1: VERY gentle noise gate for quiet phone audio (0.001 instead of 0.012!)
  let processed = applyNoiseGate(float32Data, 0.001, 0.002, 0.08);

  // Step 2: Voice EQ to enhance clarity
  processed = applyVoiceEQ(processed);

  // 🔥 FIX: Use AGGRESSIVE gain boost for quiet caller audio (8x instead of 1.8x!)
  // Step 3: Boost quiet caller audio significantly
  const boosted = new Float32Array(processed.length);
  for (let i = 0; i < processed.length; i++) {
    boosted[i] = processed[i] * 8.0;
  }

  // Step 4: Compression to even out levels after boosting
  processed = applyCompression(boosted, 0.35, 3.5, 0.1);

  // Step 5: Final limiting to prevent any clipping
  processed = applyLimiter(processed, 0.95, 0.05);

  return processed;
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

    // 🔥 DEBUG: Log ORIGINAL decoded audio before ANY processing
    const originalFloat32 = new Float32Array(pcm16Data.length);
    for (let i = 0; i < pcm16Data.length; i++) {
      originalFloat32[i] = Math.max(-1, Math.min(1, pcm16Data[i] / 32768.0));
    }
    const originalPeak = Math.max(...originalFloat32.map(Math.abs));
    console.log(`📥 ORIGINAL DECODED AUDIO: Speaker=${speaker}, Format=${sourceFormat}, Peak=${originalPeak.toFixed(4)}, Samples=${pcm16Data.length}`);

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

    // 🔥 DEBUGGING: Log audio details
    const peakBefore = Math.max(...float32Data.map(Math.abs));
    console.log(`🎧 ===== AUDIO DEBUG =====`);
    console.log(`   Speaker: ${speaker || 'UNKNOWN'}`);
    console.log(`   Format: ${sourceFormat}, Rate: ${sourceRate}Hz → ${targetRate}Hz`);
    console.log(`   Chunk size: ${float32Data.length} samples (${(float32Data.length / targetRate).toFixed(3)}s)`);
    console.log(`   Peak level BEFORE processing: ${peakBefore.toFixed(4)}`);

    // 🔥 SIMPLE VOLUME BOOST (no complex processing that degrades quality)
    const isAI = speaker === "AI" || speaker === "ai" || speaker === "assistant";

    let finalData = new Float32Array(float32Data.length);

    if (isAI) {
      // AI audio: No boost needed, already loud enough
      console.log(`   🎙️ AI audio - no boost`);
      for (let i = 0; i < float32Data.length; i++) {
        finalData[i] = float32Data[i];
      }
    } else {
      // Caller audio: AGGRESSIVE volume boost to match AI levels
      console.log(`   📞 Caller audio - applying 15x BOOST`);
      const CALLER_GAIN = 15.0; // Aggressive boost to match AI audio levels
      for (let i = 0; i < float32Data.length; i++) {
        // Apply gain and hard clip to prevent distortion
        finalData[i] = Math.max(-0.95, Math.min(0.95, float32Data[i] * CALLER_GAIN));
      }
    }

    const peakAfter = Math.max(...finalData.map(Math.abs));
    console.log(`   Peak level AFTER processing: ${peakAfter.toFixed(4)}`);
    console.log(`   Gain change: ${(peakAfter / peakBefore).toFixed(2)}x`);
    console.log(`========================`);


    // Create audio buffer with final data
    const buffer = audioCtxRef.current.createBuffer(
      1,
      finalData.length,
      targetRate,
    );
    buffer.getChannelData(0).set(finalData);

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
    console.log("🔊 Initializing audio context...");
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;

    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContextClass({
        sampleRate: 48000,
        latencyHint: "interactive",
      });
      console.log(`🔊 Audio context created (sample rate: ${audioCtxRef.current.sampleRate}Hz)`);
    }

    if (audioCtxRef.current.state === "suspended") {
      console.log("🔊 Resuming suspended audio context...");
      await audioCtxRef.current.resume();
    }

    console.log(`✅ Audio context ready! State: ${audioCtxRef.current.state}`);
    setAudioEnabled(true);

    // Play a short beep to confirm audio is working
    playTestBeep(audioCtxRef);

    return true;
  } catch (error) {
    console.error("❌ Failed to initialize audio context:", error);
    setError("Audio initialization failed - check browser permissions");
    return false;
  }
};

// Play a test beep to confirm audio is working
export const playTestBeep = (audioCtxRef) => {
  try {
    if (!audioCtxRef.current || audioCtxRef.current.state !== "running") {
      console.warn("⚠️ Cannot play test beep - audio context not running");
      return;
    }

    console.log("🔔 Playing test beep...");
    const oscillator = audioCtxRef.current.createOscillator();
    const gainNode = audioCtxRef.current.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtxRef.current.destination);

    oscillator.frequency.value = 800; // 800Hz beep
    gainNode.gain.value = 0.1; // Quiet beep

    oscillator.start(audioCtxRef.current.currentTime);
    oscillator.stop(audioCtxRef.current.currentTime + 0.1); // 100ms beep

    console.log("✅ Test beep played");
  } catch (error) {
    console.error("❌ Failed to play test beep:", error);
  }
};
