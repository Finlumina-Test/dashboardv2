import { supabase, isSupabaseConfigured } from "@/utils/supabase";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const backend = searchParams.get("backend") || "";
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    console.log(
      `🔍 API /calls/list - Backend: ${backend}, Search: "${search}"`,
    );

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

    // Build query
    let query = supabase
      .from('calls')
      .select('*')
      .order('call_date', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by restaurant_id if provided
    if (backend) {
      query = query.eq('restaurant_id', backend);
    }

    // Filter by search term if provided
    if (search) {
      query = query.or(`customer_name.ilike.%${search}%,phone_number.ilike.%${search}%`);
    }

    // Execute query
    const { data: calls, error } = await query;

    if (error) {
      console.error("❌ Supabase error:", error);
      throw error;
    }

    console.log(`✅ Fetched ${calls?.length || 0} calls for backend: ${backend}`);

    // Debug: Log first call if exists
    if (calls && calls.length > 0) {
      console.log("📋 First call:", {
        id: calls[0].id,
        call_sid: calls[0].call_sid,
        customer_name: calls[0].customer_name,
        restaurant_id: calls[0].restaurant_id,
        has_transcript: !!calls[0].transcript,
        has_audio: !!calls[0].audio_url,
      });
    } else {
      console.log("⚠️ No calls found in database for restaurant:", backend);
    }

    return Response.json({ success: true, calls: calls || [] });
  } catch (error) {
    console.error("❌ Error fetching calls:", error);
    console.error("❌ Stack:", error.stack);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
