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

    const { call_sid, audio_url } = body;

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

    if (!data) {
      console.error(`❌ Call not found: ${call_sid}`);
      return Response.json(
        { success: false, error: "Call not found" },
        { status: 404 },
      );
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
