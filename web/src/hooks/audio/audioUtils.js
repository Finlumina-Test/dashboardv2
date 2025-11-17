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

// 🔥 GLOBAL: Separate Set to track played audio IDs (ONLY for playback, NOT recording)
const playedAudioIds = new Set();
const MAX_PLAYED_IDS = 1000; // Prevent memory leak - keep last 1000 IDs

// 🔥 GLOBAL: Audio queue system to prevent stuttering
const audioQueue = new Map(); // Map of speaker -> queue data

// Get or create queue for a speaker
const getAudioQueue = (speaker) => {
  if (!audioQueue.has(speaker)) {
    audioQueue.set(speaker, {
      nextStartTime: 0,
      scheduledSources: [],
    });
  }
  return audioQueue.get(speaker);
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

    const pcm16Data = decodePcm16(base64Audio, sourceFormat);

    // 🔥 CRITICAL FIX: Check if audioCtxRef exists before accessing sampleRate
    // If not, we can still record but must skip playback
    let audioCtxExists = audioCtxRef && audioCtxRef.current;

    // 🔥 AUTO-INITIALIZE: Try to initialize audio context if it doesn't exist yet
    // This allows audio to work without user having to click "Audio ON" button
    if (!audioCtxExists && typeof window !== 'undefined') {
      try {
        console.log("🔊 Auto-initializing audio context on first chunk...");
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass && audioCtxRef) {
          audioCtxRef.current = new AudioContextClass({
            sampleRate: 48000,
            latencyHint: "interactive",
          });
          audioCtxExists = true;
          console.log(`✅ Audio context auto-created (state: ${audioCtxRef.current.state})`);
        }
      } catch (e) {
        console.warn("⚠️ Could not auto-initialize audio context:", e.message);
      }
    }

    const targetRate = audioCtxExists ? audioCtxRef.current.sampleRate : 48000; // Fallback rate for recording

    // 🔥 DEBUG: Log ORIGINAL decoded audio before ANY processing
    const originalFloat32 = new Float32Array(pcm16Data.length);
    for (let i = 0; i < pcm16Data.length; i++) {
      originalFloat32[i] = Math.max(-1, Math.min(1, pcm16Data[i] / 32768.0));
    }
    const originalPeak = Math.max(...originalFloat32.map(Math.abs));
    console.log(`📥 AUDIO CHUNK: Speaker=${speaker}, Format=${sourceFormat}, Peak=${originalPeak.toFixed(4)}, Samples=${pcm16Data.length}, ID=${uniqueId}`);

    // 🔥 ALWAYS RECORD: Store ALL audio chunks for recording (even duplicates)
    // Recording needs complete audio, only playback should deduplicate
    if (callSessionActiveRef.current) {
      audioChunksRef.current.push({
        id: uniqueId,
        data: originalFloat32,
        sampleRate: sourceRate, // Original rate (8000 for mulaw, 24000 for pcm16)
        speaker: speaker,
        timestamp: Date.now(),
      });
      console.log(`💾 RECORDED chunk #${audioChunksRef.current.length}: ${uniqueId}`);
    }

    // 🔥 SKIP PLAYBACK if audio context not initialized
    if (!audioCtxExists) {
      console.log(`⏭️ Audio context not initialized - recorded but not playing: ${uniqueId}`);
      return;
    }

    // 🔥 DEDUPLICATE PLAYBACK ONLY: Check if we've already played this audio
    if (playedAudioIds.has(uniqueId)) {
      console.log(`⏭️ SKIPPING DUPLICATE PLAYBACK (already recorded): ${uniqueId}`);
      return; // Already played, skip playback but we already recorded it above
    }

    // Add to played set (with size limit to prevent memory leak)
    playedAudioIds.add(uniqueId);
    if (playedAudioIds.size > MAX_PLAYED_IDS) {
      // Remove oldest entries (convert to array, slice, convert back to Set)
      const idsArray = Array.from(playedAudioIds);
      playedAudioIds.clear();
      idsArray.slice(-MAX_PLAYED_IDS).forEach(id => playedAudioIds.add(id));
    }

    // 🔥 SKIP PLAYBACK: If muted, don't play audio
    if (isMuted) {
      console.log(`🔇 MUTED - not playing: ${uniqueId}`);
      return;
    }

    // 🔥 QUEUED PLAYBACK: Schedule audio to play sequentially without gaps or overlaps
    const peak = Math.max(...originalFloat32.map(Math.abs));
    console.log(`🎧 QUEUEING AUDIO: Speaker=${speaker}, Peak=${peak.toFixed(4)}, Rate=${sourceRate}Hz, Samples=${originalFloat32.length}`);

    // Get audio queue for this speaker
    const queue = getAudioQueue(speaker);
    const currentTime = audioCtxRef.current.currentTime;

    // 🔥 SMOOTH PLAYBACK: Add buffer to prevent choppy audio from network delays
    // - Add small lookahead buffer (0.05s) to smooth out jitter
    // - Only catch up if queue falls far behind (> 0.5s) to prevent unbounded latency
    const LOOKAHEAD_BUFFER = 0.05; // 50ms buffer for smooth playback
    const MAX_LATENCY = 0.5; // Maximum allowed latency before catching up

    let startTime;
    if (queue.nextStartTime === 0) {
      // First chunk - start with small buffer
      startTime = currentTime + LOOKAHEAD_BUFFER;
    } else if (queue.nextStartTime < currentTime - MAX_LATENCY) {
      // Queue fell too far behind - catch up but maintain small buffer
      startTime = currentTime + LOOKAHEAD_BUFFER;
      console.log(`⚠️ Queue behind by ${(currentTime - queue.nextStartTime).toFixed(3)}s, catching up`);
    } else {
      // Normal case - schedule at next available time (maintains smooth continuous playback)
      startTime = queue.nextStartTime;
    }

    // 🔥 SMOOTH TRANSITIONS: Apply crossfade to eliminate clicks/pops between chunks
    // Add 10ms fade-in and fade-out to smooth transitions
    const FADE_SAMPLES = Math.floor(sourceRate * 0.01); // 10ms fade
    const smoothedAudio = new Float32Array(originalFloat32);

    // Apply fade-in at the beginning (except for very first chunk)
    if (queue.nextStartTime > 0) {
      const fadeInSamples = Math.min(FADE_SAMPLES, smoothedAudio.length);
      for (let i = 0; i < fadeInSamples; i++) {
        const fadeGain = i / fadeInSamples; // Linear fade 0 -> 1
        smoothedAudio[i] *= fadeGain;
      }
    }

    // Apply fade-out at the end
    const fadeOutSamples = Math.min(FADE_SAMPLES, smoothedAudio.length);
    const fadeOutStart = smoothedAudio.length - fadeOutSamples;
    for (let i = fadeOutStart; i < smoothedAudio.length; i++) {
      const fadeGain = (smoothedAudio.length - i) / fadeOutSamples; // Linear fade 1 -> 0
      smoothedAudio[i] *= fadeGain;
    }

    // Create audio buffer at SOURCE sample rate - Web Audio API will handle resampling
    const buffer = audioCtxRef.current.createBuffer(
      1,
      smoothedAudio.length,
      sourceRate, // Use source rate - backend sends correct quality now!
    );
    buffer.getChannelData(0).set(smoothedAudio);

    // Calculate duration
    const duration = buffer.duration;

    // Clean up old scheduled sources that have finished playing
    queue.scheduledSources = queue.scheduledSources.filter(src => {
      if (src.endTime < currentTime) {
        // This source has finished, don't keep it
        return false;
      }
      return true;
    });

    // Create and schedule source
    const source = audioCtxRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtxRef.current.destination);
    source.start(startTime);

    // Track this source
    const endTime = startTime + duration;
    queue.scheduledSources.push({ source, startTime, endTime });

    // Update next start time for this speaker's queue
    queue.nextStartTime = endTime;

    console.log(`✅ SCHEDULED: Start=${startTime.toFixed(3)}s, Duration=${duration.toFixed(3)}s, End=${endTime.toFixed(3)}s, QueueDepth=${queue.scheduledSources.length}`);

    // Clean up source reference when it ends
    source.onended = () => {
      queue.scheduledSources = queue.scheduledSources.filter(src => src.source !== source);
    };

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
    console.log("🔊 audioCtxRef:", audioCtxRef);
    console.log("🔊 audioCtxRef.current:", audioCtxRef?.current);

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) {
      console.error("❌ Web Audio API not supported in this browser");
      setError("Web Audio API not supported in this browser");
      return false;
    }

    if (!audioCtxRef.current) {
      console.log("🔊 Creating new audio context...");
      audioCtxRef.current = new AudioContextClass({
        sampleRate: 48000,
        latencyHint: "interactive",
      });
      console.log(`🔊 Audio context created (sample rate: ${audioCtxRef.current.sampleRate}Hz, state: ${audioCtxRef.current.state})`);
    } else {
      console.log(`🔊 Audio context already exists (state: ${audioCtxRef.current.state})`);
    }

    if (audioCtxRef.current.state === "suspended") {
      console.log("🔊 Resuming suspended audio context...");
      await audioCtxRef.current.resume();
      console.log(`🔊 Audio context resumed (state: ${audioCtxRef.current.state})`);
    }

    // 🔥 FORCE RESUME: Try to resume even if state shows "running" (helps with some browsers)
    if (audioCtxRef.current.state === "running") {
      console.log("✅ Audio context already running");
    } else {
      console.log(`🔊 Attempting to start audio context (current state: ${audioCtxRef.current.state})...`);
      try {
        await audioCtxRef.current.resume();
        console.log(`🔊 Resume attempted, new state: ${audioCtxRef.current.state}`);
      } catch (resumeError) {
        console.warn("⚠️ Failed to resume audio context:", resumeError);
      }
    }

    if (audioCtxRef.current.state !== "running") {
      console.warn(`⚠️ Audio context state is "${audioCtxRef.current.state}" (expected "running")`);
      console.log("⚠️ This may be due to browser autoplay policy - user interaction required");
      console.log("⚠️ Audio context will remain in suspended state until user interacts with page");
    }

    console.log(`✅ Audio context ready! State: ${audioCtxRef.current.state}`);
    setAudioEnabled(true);

    // Play a short beep to confirm audio is working
    try {
      playTestBeep(audioCtxRef);
      console.log("🔔 Test beep played successfully");
    } catch (beepError) {
      console.warn("⚠️ Failed to play test beep:", beepError);
    }

    return true;
  } catch (error) {
    console.error("❌ Failed to initialize audio context:", error);
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    setError(`Audio initialization failed: ${error.message}`);
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
