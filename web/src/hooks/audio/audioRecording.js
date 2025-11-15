// Audio recording and WAV file creation utilities

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
  // 🔥 CRITICAL FIX: Resample ALL chunks to target rate FIRST
  const targetSampleRate = 16000;
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

    resampledChunks.push(resampledData);
  }
  // Calculate total length from resampled chunks
  let totalLength = 0;
  for (let i = 0; i < resampledChunks.length; i++) {
    totalLength += resampledChunks[i].length;
  }
  console.log(
    `📏 Total length after resampling: ${totalLength} samples at ${targetSampleRate}Hz`,
  );
  if (!isFinite(totalLength) || totalLength <= 0 || totalLength > 100000000) {
    console.error(`❌ Invalid total length: ${totalLength}`);
    return null;
  }
  // Create combined array
  let combinedAudio;
  try {
    combinedAudio = new Float32Array(totalLength);
    console.log(`✅ Float32Array created: ${totalLength} samples`);
  } catch (error) {
    console.error("❌ Failed to create combined audio array:", error.message);
    return null;
  }
  // Concatenate all resampled chunks
  let offset = 0;
  for (let i = 0; i < resampledChunks.length; i++) {
    const data = resampledChunks[i];

    if (offset + data.length > combinedAudio.length) {
      console.error(`❌ Not enough space for chunk ${i}`);
      break;
    }

    try {
      combinedAudio.set(data, offset);
      offset += data.length;
    } catch (error) {
      console.error(`❌ Error setting chunk ${i}:`, error.message);
      return null;
    }
  }
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

// Upload audio using frontend upload hook (handles large files)
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
