import sql from "@/app/api/utils/sql";

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

    let calls;

    // ✅ NOW FILTERING BY RESTAURANT_ID
    if (search && backend) {
      const searchPattern = `%${search}%`;
      calls = await sql`
        SELECT * FROM call_history
        WHERE 
          restaurant_id = ${backend}
          AND (customer_name ILIKE ${searchPattern}
          OR phone_number ILIKE ${searchPattern})
        ORDER BY call_date DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;
    } else if (backend) {
      calls = await sql`
        SELECT * FROM call_history
        WHERE restaurant_id = ${backend}
        ORDER BY call_date DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;
    } else if (search) {
      const searchPattern = `%${search}%`;
      calls = await sql`
        SELECT * FROM call_history
        WHERE 
          (customer_name ILIKE ${searchPattern}
          OR phone_number ILIKE ${searchPattern})
        ORDER BY call_date DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;
    } else {
      // No filter at all - return all calls
      calls = await sql`
        SELECT * FROM call_history
        ORDER BY call_date DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;
    }

    console.log(`✅ Fetched ${calls.length} calls for backend: ${backend}`);

    // Debug: Log first call if exists
    if (calls.length > 0) {
      console.log("📋 First call:", {
        id: calls[0].id,
        call_id: calls[0].call_id,
        customer_name: calls[0].customer_name,
        restaurant_id: calls[0].restaurant_id,
        has_transcript: !!calls[0].transcript,
        has_audio: !!calls[0].audio_url,
      });
    } else {
      console.log("⚠️ No calls found in database for restaurant:", backend);
    }

    return Response.json({ success: true, calls });
  } catch (error) {
    console.error("❌ Error fetching calls:", error);
    console.error("❌ Stack:", error.stack);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
