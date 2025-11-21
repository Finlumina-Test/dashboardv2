import { supabase, isSupabaseConfigured } from "@/utils/supabase";

// Shared logic for listing calls
async function listCalls(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const backend = searchParams.get("backend") || "";
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    console.log(
      `🔍 API /calls/list - Backend: ${backend}, Search: "${search}", Limit: ${limit}, Offset: ${offset}`,
    );
    console.log(`🔍 Will filter by restaurant_id: ${backend || 'NO FILTER'}`);

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

    console.log(`✅ Fetched ${calls?.length || 0} calls for restaurant_id: ${backend || 'ALL'}`);

    // Debug: Log all calls with their restaurant_ids
    if (calls && calls.length > 0) {
      console.log("📋 Calls found:");
      calls.slice(0, 5).forEach((call, idx) => {
        console.log(`  ${idx + 1}. call_sid=${call.call_sid}, restaurant_id=${call.restaurant_id || 'NULL'}, customer=${call.customer_name || 'NULL'}, audio=${call.audio_url ? 'YES' : 'NO'}`);
      });
      if (calls.length > 5) {
        console.log(`  ... and ${calls.length - 5} more calls`);
      }
    } else {
      console.log(`⚠️ No calls found in database for restaurant_id: ${backend || 'ALL'}`);
      console.log(`⚠️ This means either: 1) No calls saved yet, 2) restaurant_id mismatch, 3) All calls filtered out by search term`);
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

// React Router v7 uses 'loader' for route loaders
export async function loader({ request }) {
  return listCalls(request);
}

// Also export GET for direct fetch calls (needed in production)
export async function GET(request) {
  return listCalls(request);
}
