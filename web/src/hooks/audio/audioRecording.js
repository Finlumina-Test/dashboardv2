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

  // 🔥 DEBUG: Log sample rate distribution
  const sampleRateStats = {};
  validChunks.forEach(chunk => {
    const speaker = chunk.speaker || 'unknown';
    const rate = chunk.sampleRate || 'missing';
    const key = `${speaker}-${rate}Hz`;
    sampleRateStats[key] = (sampleRateStats[key] || 0) + 1;
  });
  console.log('📊 Sample Rate Distribution:', sampleRateStats);

  // 🔥 FIX: Use 16kHz for better quality balance (professional phone standard)
  // - Downsamples AI from 24k to 16k (smoother, removes artifacts)
  // - Upsamples caller from 8k to 16k (2x instead of 3x, more natural)
  const targetSampleRate = 16000;
  const resampledChunks = [];
  for (let i = 0; i < validChunks.length; i++) {
    const chunk = validChunks[i];
    const chunkRate = chunk.sampleRate || 16000; // Default if missing

    let resampledData;

    if (chunkRate === targetSampleRate) {
      // No resampling needed
      resampledData = chunk.data;
      console.log(`  ✓ Chunk ${i}: ${chunk.speaker} ${chunkRate}Hz → ${targetSampleRate}Hz (NO RESAMPLE)`);
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
      console.log(`  ↗ Chunk ${i}: ${chunk.speaker} ${chunkRate}Hz → ${targetSampleRate}Hz (${ratio.toFixed(2)}x resample, ${chunk.data.length} → ${newLength} samples)`);
    }

    resampledChunks.push({ data: resampledData, speaker: chunk.speaker });
  }

  // 🔥 SIMPLIFIED CROSSFADE: Only blend consecutive same-speaker chunks
  // Calculate total length WITH overlaps subtracted
  let totalLength = 0;
  for (let i = 0; i < resampledChunks.length; i++) {
    const chunk = resampledChunks[i];
    const isAI = chunk.speaker === 'ai' || chunk.speaker === 'AI' || chunk.speaker === 'assistant';

    totalLength += chunk.data.length;

    // Subtract overlap if next chunk exists
    const nextChunk = i < resampledChunks.length - 1 ? resampledChunks[i + 1] : null;
    if (nextChunk) {
      // 🔥 FIX: Use smaller crossfade that fits in chunk sizes
      // Caller chunks are ~320 samples (20ms), AI chunks are ~4000 samples (250ms)
      const fadeDuration = isAI ? 0.07 : 0.01; // 70ms for AI, 10ms for caller
      const fadeSamples = Math.floor(targetSampleRate * fadeDuration);

      // 🔥 CRITICAL: Only subtract overlap if next chunk is long enough
      const actualOverlap = Math.min(fadeSamples, nextChunk.data.length);
      totalLength -= actualOverlap;
    }
  }

  console.log(`📏 Total length with overlaps: ${totalLength} samples at ${targetSampleRate}Hz`);

  if (!isFinite(totalLength) || totalLength <= 0 || totalLength > 100000000) {
    console.error(`❌ Invalid total length: ${totalLength}`);
    return null;
  }

  // Create combined array
  let combinedAudio = new Float32Array(totalLength);
  console.log(`✅ Float32Array created: ${totalLength} samples`);

  // Blend chunks with TRUE overlap
  let writePos = 0;
  for (let i = 0; i < resampledChunks.length; i++) {
    const chunk = resampledChunks[i];
    const data = chunk.data;
    const isAI = chunk.speaker === 'ai' || chunk.speaker === 'AI' || chunk.speaker === 'assistant';

    // Check if previous chunk exists for crossfade
    const prevChunk = i > 0 ? resampledChunks[i - 1] : null;
    const prevIsAI = prevChunk ? (prevChunk.speaker === 'ai' || prevChunk.speaker === 'AI' || prevChunk.speaker === 'assistant') : false;

    // 🔥 FIX: ALWAYS crossfade (even between different speakers) to eliminate ALL gaps
    const shouldCrossfade = prevChunk !== null;

    if (shouldCrossfade) {
      // Crossfade with previous chunk (same or different speaker)
      // 🔥 Use adaptive crossfade based on speaker
      const isAI = chunk.speaker === 'ai' || chunk.speaker === 'AI' || chunk.speaker === 'assistant';
      const fadeDuration = isAI ? 0.07 : 0.01; // 70ms for AI, 10ms for caller
      const fadeSamples = Math.floor(targetSampleRate * fadeDuration);
      const overlapLength = Math.min(fadeSamples, data.length);

      // Blend the overlapping region (writePos already positioned for overlap)
      for (let j = 0; j < overlapLength; j++) {
        const fadeOut = 1.0 - (j / overlapLength); // Previous chunk fades out
        const fadeIn = j / overlapLength; // Current chunk fades in
        combinedAudio[writePos + j] = combinedAudio[writePos + j] * fadeOut + data[j] * fadeIn;
      }

      // Copy the rest of current chunk (after overlap)
      if (data.length > overlapLength) {
        combinedAudio.set(data.subarray(overlapLength), writePos + overlapLength);
      }

      console.log(`🎚️ Recording: ${isAI ? 'AI' : 'Caller'} chunk ${i} at writePos=${writePos}, chunkLen=${data.length}, overlap=${overlapLength}, prevSpeaker=${prevIsAI ? 'AI' : 'Caller'}`);

      // Advance writePos by full chunk length (we wrote overlapLength + (data.length - overlapLength) = data.length)
      writePos += data.length;
    } else {
      // First chunk - just copy
      combinedAudio.set(data, writePos);
      console.log(`📍 Recording: ${isAI ? 'AI' : 'Caller'} chunk ${i} at writePos=${writePos}, chunkLen=${data.length} (FIRST CHUNK)`);

      // Advance writePos by full chunk length
      writePos += data.length;
    }

    // 🔥 CRITICAL: Back up for next chunk's overlap
    const nextChunk = i < resampledChunks.length - 1 ? resampledChunks[i + 1] : null;
    if (nextChunk) {
      const nextIsAI = nextChunk.speaker === 'ai' || nextChunk.speaker === 'AI' || nextChunk.speaker === 'assistant';
      const fadeDuration = nextIsAI ? 0.07 : 0.01; // 70ms for AI, 10ms for caller
      const fadeSamples = Math.floor(targetSampleRate * fadeDuration);
      const actualBackup = Math.min(fadeSamples, nextChunk.data.length);
      console.log(`  ↩️ Backing up ${actualBackup} samples for next chunk overlap`);
      writePos -= actualBackup;
    }
  }

  console.log(`✅ Final writePos: ${writePos}, Expected totalLength: ${totalLength}`);
  // Trim to actual used length
  combinedAudio = combinedAudio.subarray(0, Math.min(writePos, totalLength));
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
