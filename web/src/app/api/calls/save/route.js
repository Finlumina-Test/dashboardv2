import sql from "@/app/api/utils/sql";

export async function POST(request) {
  try {
    console.log("🔵 API /calls/save hit");
    const body = await request.json();
    console.log("📥 Request body:", JSON.stringify(body, null, 2));

    const {
      call_id,
      customer_name,
      phone_number,
      delivery_address,
      order_items,
      special_instructions,
      payment_method,
      delivery_time,
      total_price,
      call_duration,
      transcript,
      audio_url,
      restaurant_id, // ✅ NEW
    } = body;

    if (!call_id) {
      console.error("❌ No call_id provided!");
      return Response.json(
        { success: false, error: "call_id is required" },
        { status: 400 },
      );
    }

    if (!restaurant_id) {
      console.error("❌ No restaurant_id provided!");
      return Response.json(
        { success: false, error: "restaurant_id is required" },
        { status: 400 },
      );
    }

    console.log(`🔍 Checking if call ${call_id} exists...`);

    // Check if call already exists
    const existing = await sql`
      SELECT id FROM call_history WHERE call_id = ${call_id}
    `;

    console.log(`📊 Existing records found: ${existing.length}`);

    // Prepare JSONB data - handle nulls properly
    const orderItemsJson = JSON.stringify(order_items || []);
    const transcriptJson = JSON.stringify(transcript || []);

    if (existing.length > 0) {
      console.log(`🔄 Updating existing call ${call_id}...`);

      // Update existing call
      const result = await sql`
        UPDATE call_history
        SET 
          customer_name = ${customer_name || null},
          phone_number = ${phone_number || null},
          delivery_address = ${delivery_address || null},
          order_items = ${orderItemsJson}::jsonb,
          special_instructions = ${special_instructions || null},
          payment_method = ${payment_method || null},
          delivery_time = ${delivery_time || null},
          total_price = ${total_price || null},
          call_duration = ${call_duration || 0},
          transcript = ${transcriptJson}::jsonb,
          audio_url = ${audio_url || null},
          restaurant_id = ${restaurant_id}
        WHERE call_id = ${call_id}
        RETURNING *
      `;

      console.log("✅ Update successful:", result[0]?.id);
      return Response.json({ success: true, call: result[0] });
    } else {
      console.log(`➕ Inserting new call ${call_id}...`);

      // Insert new call
      const result = await sql`
        INSERT INTO call_history (
          call_id,
          customer_name,
          phone_number,
          delivery_address,
          order_items,
          special_instructions,
          payment_method,
          delivery_time,
          total_price,
          call_duration,
          transcript,
          audio_url,
          restaurant_id
        ) VALUES (
          ${call_id},
          ${customer_name || null},
          ${phone_number || null},
          ${delivery_address || null},
          ${orderItemsJson}::jsonb,
          ${special_instructions || null},
          ${payment_method || null},
          ${delivery_time || null},
          ${total_price || null},
          ${call_duration || 0},
          ${transcriptJson}::jsonb,
          ${audio_url || null},
          ${restaurant_id}
        )
        RETURNING *
      `;

      console.log("✅ Insert successful:", result[0]?.id);
      return Response.json({ success: true, call: result[0] });
    }
  } catch (error) {
    console.error("❌ API Error saving call:", error);
    console.error("❌ Error stack:", error.stack);
    return Response.json(
      { success: false, error: error.message, stack: error.stack },
      { status: 500 },
    );
  }
}
