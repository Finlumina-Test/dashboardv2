import { supabase, isSupabaseConfigured } from "@/utils/supabase";

// Update audio URL for a call (used by backend after uploading Twilio recording)
async function updateAudioUrl(request) {
  try {
    console.log("🎵 API /calls/update-audio hit");
    const body = await request.json();
    console.log("📥 Request body:", JSON.stringify(body, null, 2));

    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      console.error("❌ Supabase not configured!");
      return Response.json(
        {
          success: false,
          error: "Database not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY in .env"
        },
        { status: 500 },
      );
    }

    const { call_sid, audio_url, retry_count = 0 } = body;

    if (!call_sid) {
      console.error("❌ No call_sid provided!");
      return Response.json(
        { success: false, error: "call_sid is required" },
        { status: 400 },
      );
    }

    if (!audio_url) {
      console.error("❌ No audio_url provided!");
      return Response.json(
        { success: false, error: "audio_url is required" },
        { status: 400 },
      );
    }

    console.log(`🔍 Updating audio URL for call ${call_sid}...`);
    console.log(`🎵 Audio URL: ${audio_url}`);

    // Check if call exists first
    const { data: existingCall, error: checkError } = await supabase
      .from('calls')
      .select('id, audio_url')
      .eq('call_sid', call_sid)
      .maybeSingle();

    if (checkError) {
      console.error("❌ Error checking for call:", checkError);
      throw checkError;
    }

    if (!existingCall) {
      console.warn(`⚠️ Call not found yet: ${call_sid} (attempt ${retry_count + 1}/3)`);

      // If call doesn't exist yet, it might be a race condition
      // Frontend might still be saving it
      if (retry_count < 2) {
        console.log(`⏳ Will retry in 2 seconds...`);
        return Response.json({
          success: false,
          error: "Call not found yet, retry",
          retry: true,
          retry_after: 2000
        }, { status: 404 });
      }

      console.error(`❌ Call not found after ${retry_count + 1} attempts: ${call_sid}`);
      return Response.json(
        { success: false, error: "Call not found" },
        { status: 404 },
      );
    }

    // Check if audio URL is already set
    if (existingCall.audio_url) {
      console.log(`ℹ️ Audio URL already set for call ${call_sid}`);
      console.log(`   Current: ${existingCall.audio_url}`);
      console.log(`   New: ${audio_url}`);

      // If URLs are the same, this is a duplicate update
      if (existingCall.audio_url === audio_url) {
        return Response.json({
          success: true,
          call: existingCall,
          message: "Audio URL already set (duplicate update ignored)"
        });
      }
    }

    // Update the call with the audio URL
    const { data, error } = await supabase
      .from('calls')
      .update({
        audio_url: audio_url,
        updated_at: new Date().toISOString()
      })
      .eq('call_sid', call_sid)
      .select()
      .single();

    if (error) {
      console.error("❌ Error updating call:", error);
      throw error;
    }

    console.log(`✅ Audio URL updated for call ${call_sid}`);
    console.log(`🎵 New audio URL: ${audio_url}`);

    return Response.json({
      success: true,
      call: data,
      message: "Audio URL updated successfully"
    });
  } catch (error) {
    console.error("❌ API Error updating audio URL:", error);
    console.error("❌ Error stack:", error.stack);
    return Response.json(
      { success: false, error: error.message, stack: error.stack },
      { status: 500 },
    );
  }
}

// React Router v7 uses 'action' for POST requests
export async function action({ request }) {
  return updateAudioUrl(request);
}

// Also export POST for direct fetch calls (needed in production)
export async function POST(request) {
  return updateAudioUrl(request);
}
