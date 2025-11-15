import sql from "@/app/api/utils/sql";

export async function GET(request, { params }) {
  try {
    const { id } = params;

    const call = await sql`
      SELECT * FROM call_history
      WHERE id = ${id}
    `;

    if (call.length === 0) {
      return Response.json(
        { success: false, error: "Call not found" },
        { status: 404 },
      );
    }

    return Response.json({ success: true, call: call[0] });
  } catch (error) {
    console.error("Error fetching call:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
