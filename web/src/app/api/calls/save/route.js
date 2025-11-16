import { supabase, isSupabaseConfigured } from "@/utils/supabase";

export async function POST(request) {
  try {
    console.log("🔵 API /calls/save hit");
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
      restaurant_id,
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
    const { data: existing, error: checkError } = await supabase
      .from('calls')
      .select('id')
      .eq('call_sid', call_id)
      .maybeSingle();

    if (checkError) {
      console.error("❌ Error checking for existing call:", checkError);
      throw checkError;
    }

    console.log(`📊 Existing record:`, existing ? 'Found' : 'Not found');

    // Prepare data object
    const callData = {
      call_sid: call_id,
      restaurant_id,
      customer_name: customer_name || null,
      phone_number: phone_number || null,
      delivery_address: delivery_address || null,
      order_items: order_items || [],
      special_instructions: special_instructions || null,
      payment_method: payment_method || null,
      delivery_time: delivery_time || null,
      total_price: total_price || null,
      call_duration: call_duration || 0,
      transcript: transcript || [],
      audio_url: audio_url || null,
      updated_at: new Date().toISOString(),
    };

    let result;

    if (existing) {
      console.log(`🔄 Updating existing call ${call_id}...`);

      // Update existing call
      const { data, error } = await supabase
        .from('calls')
        .update(callData)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
      console.log("✅ Update successful:", result?.id);
    } else {
      console.log(`➕ Inserting new call ${call_id}...`);

      // Insert new call
      const { data, error } = await supabase
        .from('calls')
        .insert([callData])
        .select()
        .single();

      if (error) throw error;
      result = data;
      console.log("✅ Insert successful:", result?.id);
    }

    return Response.json({ success: true, call: result });
  } catch (error) {
    console.error("❌ API Error saving call:", error);
    console.error("❌ Error stack:", error.stack);
    return Response.json(
      { success: false, error: error.message, stack: error.stack },
      { status: 500 },
    );
  }
}
