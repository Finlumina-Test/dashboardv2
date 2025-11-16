import { supabase, isSupabaseConfigured } from "@/utils/supabase";

// React Router v7 uses 'loader' for GET requests
export async function loader({ params }) {
  try {
    const { id } = params;

    if (!isSupabaseConfigured()) {
      return Response.json(
        { success: false, error: "Database not configured" },
        { status: 500 },
      );
    }

    const { data: call, error } = await supabase
      .from('calls')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error("❌ Supabase error:", error);
      throw error;
    }

    if (!call) {
      return Response.json(
        { success: false, error: "Call not found" },
        { status: 404 },
      );
    }

    return Response.json({ success: true, call });
  } catch (error) {
    console.error("❌ Error fetching call:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
