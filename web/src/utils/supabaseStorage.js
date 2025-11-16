import { supabase, isSupabaseConfigured } from './supabase';

/**
 * Upload audio file to Supabase Storage
 * @param {Blob} audioBlob - The audio file to upload
 * @param {string} callId - Unique call identifier for filename
 * @returns {Promise<{url: string|null, error: string|null}>}
 */
export const uploadAudioToSupabase = async (audioBlob, callId) => {
  try {
    if (!isSupabaseConfigured()) {
      return {
        url: null,
        error: 'Supabase not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY in .env'
      };
    }

    const filename = `${callId}_${Date.now()}.wav`;
    const filePath = `recordings/${filename}`;

    console.log(`📤 Uploading audio to Supabase Storage: ${filePath}`);
    console.log(`📊 Audio size: ${(audioBlob.size / 1024 / 1024).toFixed(2)}MB`);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('call-recordings')
      .upload(filePath, audioBlob, {
        contentType: 'audio/wav',
        upsert: false, // Don't overwrite if exists
      });

    if (error) {
      console.error('❌ Supabase Storage upload error:', error);
      return { url: null, error: error.message };
    }

    console.log('✅ Upload successful:', data.path);

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('call-recordings')
      .getPublicUrl(filePath);

    console.log('🔗 Public URL:', publicUrl);

    return { url: publicUrl, error: null };
  } catch (error) {
    console.error('❌ Error uploading audio:', error);
    return { url: null, error: error.message };
  }
};
