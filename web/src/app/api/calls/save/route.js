import { supabase, isSupabaseConfigured } from "@/utils/supabase";

// Shared logic for saving calls
async function saveCall(request) {
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
      update_audio_only, // 🔥 NEW: Flag for audio-only updates
      retry_count, // 🔥 NEW: Track retry attempts
    } = body;

    if (!call_id) {
      console.error("❌ No call_id provided!");
      return Response.json(
        { success: false, error: "call_id is required" },
        { status: 400 },
      );
    }

    // 🔥 NEW: Handle audio-only updates (workaround for route not loading)
    if (update_audio_only) {
      const currentRetry = retry_count || 0;
      console.log(`🎵 Audio-only update for call ${call_id} (attempt ${currentRetry + 1}/6)`);

      if (!audio_url) {
        return Response.json(
          { success: false, error: "audio_url is required for audio updates" },
          { status: 400 },
        );
      }

      // First check if the call exists
      const { data: existingCall, error: checkError } = await supabase
        .from('calls')
        .select('id, call_sid, restaurant_id, customer_name')
        .eq('call_sid', call_id)
        .maybeSingle(); // Use maybeSingle instead of single to avoid error on 0 rows

      if (checkError) {
        console.error("❌ Error checking for call:", checkError);
        throw checkError;
      }

      if (!existingCall) {
        console.warn(`⚠️ Call ${call_id} not found in database yet (attempt ${currentRetry + 1}/6)`);
        console.warn(`⚠️ This is normal - frontend may still be saving the call`);

        // Tell backend to retry with exponential backoff
        if (currentRetry < 5) {
          const retryAfter = Math.pow(2, currentRetry) * 1000; // 1s, 2s, 4s, 8s, 16s
          console.log(`⏳ Suggesting retry after ${retryAfter}ms`);
          return Response.json(
            {
              success: false,
              error: "Call not found yet - still being saved by frontend",
              retry: true,
              retry_after: retryAfter,
              retry_count: currentRetry
            },
            { status: 404 },
          );
        } else {
          console.error(`❌ Call ${call_id} not found after 6 attempts - giving up`);
          return Response.json(
            {
              success: false,
              error: "Call not found after maximum retries",
              retry: false
            },
            { status: 404 },
          );
        }
      }

      // Call exists, update the audio URL
      const { data: updatedCall, error: updateError } = await supabase
        .from('calls')
        .update({
          audio_url: audio_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingCall.id)
        .select()
        .single();

      if (updateError) {
        console.error("❌ Error updating audio URL:", updateError);
        throw updateError;
      }

      console.log(`✅ Audio URL updated: ${audio_url}`);
      console.log(`📋 Call details: id=${updatedCall.id}, call_sid=${updatedCall.call_sid}, restaurant_id=${updatedCall.restaurant_id || 'NULL'}, customer_name=${updatedCall.customer_name || 'NULL'}`);
      return Response.json({ success: true, call: updatedCall, message: "Audio URL updated" });
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

    console.log(`🏪 Restaurant ID being used: ${restaurant_id}`);
    console.log(`📞 Call SID: ${call_id}`);

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
      console.log(`✅ Updated call: call_sid=${result?.call_sid}, restaurant_id=${result?.restaurant_id}, customer=${result?.customer_name || 'NULL'}`);
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
      console.log(`✅ Inserted call: call_sid=${result?.call_sid}, restaurant_id=${result?.restaurant_id}, customer=${result?.customer_name || 'NULL'}`);
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

// React Router v7 uses 'action' for form submissions
export async function action({ request }) {
  return saveCall(request);
}

// Also export POST for direct fetch calls (needed in production)
export async function POST(request) {
  return saveCall(request);
}
