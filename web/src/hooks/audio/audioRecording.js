// Audio recording and WAV file creation utilities
import { uploadAudioToSupabase } from '@/utils/supabaseStorage';

// Convert accumulated audio chunks to WAV blob - FIXED VERSION
export const createWavBlob = (audioChunks) => {
  if (!audioChunks || audioChunks.length === 0) {
    console.log("🔇 No audio chunks to process");
    return null;
  }
  console.log(`🔍 Processing ${audioChunks.length} audio chunks...`);

  // 🔥 Remove duplicates by ID first
  const uniqueChunks = [];
  const seenIds = new Set();

  for (const chunk of audioChunks) {
    if (chunk.id && seenIds.has(chunk.id)) {
      console.log(`⏭️ Skipping duplicate chunk: ${chunk.id}`);
      continue;
    }
    if (chunk.id) seenIds.add(chunk.id);
    uniqueChunks.push(chunk);
  }

  console.log(
    `📊 Unique chunks: ${uniqueChunks.length} / ${audioChunks.length}`,
  );

  const validChunks = [];
  let invalidChunks = 0;
  for (let i = 0; i < uniqueChunks.length; i++) {
    const chunk = uniqueChunks[i];
    if (!chunk || !chunk.data || chunk.data.length <= 0) {
      invalidChunks++;
      continue;
    }
    const length = chunk.data.length;
    if (
      typeof length !== "number" ||
      !isFinite(length) ||
      isNaN(length) ||
      length <= 0 ||
      length > 1000000
    ) {
      console.log(`❌ Invalid chunk ${i}: bad length=${length}`);
      invalidChunks++;
      continue;
    }
    try {
      const testValue = chunk.data[0];
      if (!isFinite(testValue)) {
        console.log(`❌ Invalid chunk ${i}: contains non-finite values`);
        invalidChunks++;
        continue;
      }
    } catch (e) {
      console.log(`❌ Invalid chunk ${i}: cannot access data`);
      invalidChunks++;
      continue;
    }
    validChunks.push(chunk);
  }
  console.log(
    `✅ Validation: ${validChunks.length} valid, ${invalidChunks} invalid`,
  );
  if (validChunks.length === 0) {
    console.error("❌ No valid audio chunks!");
    return null;
  }
  // 🔥 FIX: Use 24kHz to avoid pitch shift (AI is 24k, caller is 8k)
  // Downsampling to 16k was causing higher pitch
  const targetSampleRate = 24000;
  const resampledChunks = [];
  for (let i = 0; i < validChunks.length; i++) {
    const chunk = validChunks[i];
    const chunkRate = chunk.sampleRate || 24000; // Default if missing

    let resampledData;

    if (chunkRate === targetSampleRate) {
      // No resampling needed
      resampledData = chunk.data;
    } else {
      // Resample to target rate
      const ratio = targetSampleRate / chunkRate;
      const newLength = Math.floor(chunk.data.length * ratio);
      resampledData = new Float32Array(newLength);

      for (let j = 0; j < newLength; j++) {
        const srcPos = j / ratio;
        const srcIndex = Math.floor(srcPos);
        const frac = srcPos - srcIndex;

        const s1 = chunk.data[srcIndex] || 0;
        const s2 =
          chunk.data[Math.min(chunk.data.length - 1, srcIndex + 1)] || 0;

        // Linear interpolation
        resampledData[j] = s1 + (s2 - s1) * frac;
      }
    }

    resampledChunks.push({ data: resampledData, speaker: chunk.speaker });
  }

  // 🔥 SIMPLIFIED CROSSFADE: Only blend consecutive same-speaker chunks
  // Calculate total length first (simple concatenation)
  let totalLength = 0;
  for (let i = 0; i < resampledChunks.length; i++) {
    totalLength += resampledChunks[i].data.length;
  }

  console.log(`📏 Total length before crossfade: ${totalLength} samples at ${targetSampleRate}Hz`);

  if (!isFinite(totalLength) || totalLength <= 0 || totalLength > 100000000) {
    console.error(`❌ Invalid total length: ${totalLength}`);
    return null;
  }

  // Create combined array (oversized to be safe)
  let combinedAudio = new Float32Array(totalLength);
  console.log(`✅ Float32Array created: ${totalLength} samples`);

  // Blend chunks with simple logic
  let writePos = 0;
  for (let i = 0; i < resampledChunks.length; i++) {
    const chunk = resampledChunks[i];
    const data = chunk.data;
    const isAI = chunk.speaker === 'ai' || chunk.speaker === 'AI' || chunk.speaker === 'assistant';

    // Check if next chunk is same speaker
    const nextChunk = i < resampledChunks.length - 1 ? resampledChunks[i + 1] : null;
    const nextIsAI = nextChunk ? (nextChunk.speaker === 'ai' || nextChunk.speaker === 'AI' || nextChunk.speaker === 'assistant') : false;
    const sameSpeakerNext = nextChunk && isAI === nextIsAI;

    if (sameSpeakerNext) {
      // Same speaker next - apply fade-out to end of this chunk
      const fadeDuration = isAI ? 0.01 : 0.002; // 10ms for AI, 2ms for caller
      const fadeSamples = Math.floor(targetSampleRate * fadeDuration);
      const fadeStart = Math.max(0, data.length - fadeSamples);

      // Copy chunk with fade-out at end
      for (let j = 0; j < data.length; j++) {
        if (j >= fadeStart) {
          const fadeGain = (data.length - j) / fadeSamples;
          combinedAudio[writePos + j] = data[j] * fadeGain;
        } else {
          combinedAudio[writePos + j] = data[j];
        }
      }

      console.log(`🎚️ Recording: ${isAI ? 'AI' : 'Caller'} chunk ${i} - fade-out applied (same speaker next)`);
    } else {
      // Just copy - no fade
      combinedAudio.set(data, writePos);
      console.log(`📍 Recording: ${isAI ? 'AI' : 'Caller'} chunk ${i} - no fade (${!nextChunk ? 'last chunk' : 'speaker changes'})`);
    }

    // Check if previous chunk was same speaker (for fade-in)
    const prevChunk = i > 0 ? resampledChunks[i - 1] : null;
    const prevIsAI = prevChunk ? (prevChunk.speaker === 'ai' || prevChunk.speaker === 'AI' || prevChunk.speaker === 'assistant') : false;
    const sameSpeakerPrev = prevChunk && isAI === prevIsAI;

    if (sameSpeakerPrev) {
      // Previous was same speaker - apply fade-in to start of this chunk
      const fadeDuration = isAI ? 0.01 : 0.002;
      const fadeSamples = Math.floor(targetSampleRate * fadeDuration);
      const fadeEnd = Math.min(fadeSamples, data.length);

      // Blend with fade-in (mix with what's already there from previous fade-out)
      for (let j = 0; j < fadeEnd; j++) {
        const fadeGain = j / fadeSamples;
        combinedAudio[writePos + j] = combinedAudio[writePos + j] * (1 - fadeGain) + data[j] * fadeGain;
      }

      console.log(`🎚️ Recording: ${isAI ? 'AI' : 'Caller'} chunk ${i} - fade-in applied (same speaker prev)`);
    }

    writePos += data.length;
  }

  // Trim to actual used length
  combinedAudio = combinedAudio.subarray(0, writePos);
  // Convert to 16-bit PCM
  const int16Data = new Int16Array(combinedAudio.length);
  for (let i = 0; i < combinedAudio.length; i++) {
    const s = Math.max(-1, Math.min(1, combinedAudio[i]));
    int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  // Create WAV file
  const numChannels = 1;
  const bitsPerSample = 16;
  const wavBuffer = new ArrayBuffer(44 + int16Data.length * 2);
  const view = new DataView(wavBuffer);
  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  // WAV header
  writeString(0, "RIFF");
  view.setUint32(4, 36 + int16Data.length * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, targetSampleRate, true);
  view.setUint32(
    28,
    (targetSampleRate * numChannels * bitsPerSample) / 8,
    true,
  );
  view.setUint16(32, (numChannels * bitsPerSample) / 8, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, "data");
  view.setUint32(40, int16Data.length * 2, true);
  const dataView = new Int16Array(wavBuffer, 44);
  dataView.set(int16Data);
  const durationSeconds = (int16Data.length / targetSampleRate).toFixed(1);
  const fileSizeMB = (wavBuffer.byteLength / 1024 / 1024).toFixed(2);
  console.log(
    `✅ WAV created: ${durationSeconds}s, ${fileSizeMB}MB at ${targetSampleRate}Hz`,
  );
  return new Blob([wavBuffer], { type: "audio/wav" });
};

// Upload audio using Supabase Storage
export const uploadCallAudioToSupabase = async (callId, audioChunksRef) => {
  try {
    console.log("🎵 ===== UPLOAD AUDIO TO SUPABASE DEBUG =====");
    console.log("🎵 Call ID:", callId);
    console.log("🎵 audioChunksRef exists:", !!audioChunksRef);
    console.log("🎵 audioChunksRef.current exists:", !!audioChunksRef?.current);

    if (!audioChunksRef || !audioChunksRef.current) {
      console.error("❌ UPLOAD FAILED: No audio chunks ref");
      return null;
    }

    console.log("🎵 Audio chunks count:", audioChunksRef.current.length);

    if (audioChunksRef.current.length === 0) {
      console.error("❌ UPLOAD FAILED: No audio chunks to upload");
      return null;
    }

    console.log(
      `🔍 Processing ${audioChunksRef.current.length} audio chunks...`,
    );
    const wavBlob = createWavBlob(audioChunksRef.current);

    console.log("🎵 WAV blob created:", !!wavBlob);
    if (wavBlob) {
      console.log("🎵 WAV blob size:", (wavBlob.size / 1024 / 1024).toFixed(2), "MB");
    }

    if (!wavBlob) {
      console.error("❌ UPLOAD FAILED: Failed to create WAV blob");
      return null;
    }

    console.log(
      `🎵 Uploading ${(wavBlob.size / 1024 / 1024).toFixed(1)}MB audio file to Supabase...`,
    );

    // Upload to Supabase Storage
    const uploadResult = await uploadAudioToSupabase(wavBlob, callId);
    console.log("🎵 Upload result:", uploadResult);

    if (uploadResult.error) {
      console.error("❌ UPLOAD FAILED: Supabase upload error:", uploadResult.error);
      return null;
    }

    if (!uploadResult.url) {
      console.error("❌ UPLOAD FAILED: Upload succeeded but no URL returned");
      console.error("❌ Upload result object:", JSON.stringify(uploadResult));
      return null;
    }

    console.log("✅ Audio uploaded successfully to Supabase!");
    console.log("✅ Final URL:", uploadResult.url);
    console.log("🎵 ===== UPLOAD COMPLETE =====");
    return uploadResult.url;
  } catch (error) {
    console.error("❌ UPLOAD FAILED: Exception thrown:", error.message);
    console.error("❌ Stack:", error.stack);
    return null;
  }
};

// DEPRECATED: Upload audio using frontend upload hook (CreateAnything)
// Kept for backward compatibility
export const uploadCallAudio = async (callId, audioChunksRef, uploadFn) => {
  try {
    console.log("🎵 Starting audio upload process...");

    if (!audioChunksRef || !audioChunksRef.current) {
      console.log("🔇 No audio chunks ref");
      return null;
    }

    if (audioChunksRef.current.length === 0) {
      console.log("🔇 No audio chunks to upload");
      return null;
    }

    if (!uploadFn) {
      console.error("❌ No upload function provided");
      return null;
    }

    console.log(
      `🔍 Processing ${audioChunksRef.current.length} audio chunks...`,
    );
    const wavBlob = createWavBlob(audioChunksRef.current);

    if (!wavBlob) {
      console.error("❌ Failed to create WAV blob");
      return null;
    }

    // Convert blob to file for useUpload hook
    const audioFile = new File([wavBlob], `call_${callId}_audio.wav`, {
      type: "audio/wav",
    });

    console.log(
      `🎵 Uploading ${(wavBlob.size / 1024 / 1024).toFixed(1)}MB audio file...`,
    );

    // Use frontend upload hook instead of backend API
    const uploadResult = await uploadFn({ file: audioFile });

    if (uploadResult?.error) {
      console.error("❌ Upload failed:", uploadResult.error);
      return null;
    }

    if (!uploadResult?.url) {
      console.error("❌ Upload succeeded but no URL returned");
      return null;
    }

    console.log("✅ Audio uploaded successfully:", uploadResult.url);
    return uploadResult.url;
  } catch (error) {
    console.error("❌ Audio upload failed:", error.message);
    console.error("Stack:", error.stack);
    return null;
  }
};
