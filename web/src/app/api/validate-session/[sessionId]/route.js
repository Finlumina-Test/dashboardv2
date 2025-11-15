import { getBaseUrl } from "@/utils/restaurantConfig";

export async function GET(request, { params }) {
  const { sessionId } = params;

  if (!sessionId) {
    return Response.json({ error: "Session ID is required" }, { status: 400 });
  }

  try {
    // Get the demo base URL
    const baseUrl = getBaseUrl("demo");
    if (!baseUrl) {
      return Response.json(
        { error: "Demo configuration not found" },
        { status: 500 },
      );
    }

    // Validate session with the demo backend
    const response = await fetch(
      `${baseUrl}/api/validate-session/${sessionId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const responseText = await response.text();

    if (!response.ok) {
      console.log(
        `Session validation failed: ${response.status} - ${responseText}`,
      );
      return Response.json(
        {
          valid: false,
          error:
            response.status === 404
              ? "Session not found or expired"
              : "Session validation failed",
        },
        { status: response.status },
      );
    }

    // Try to parse JSON response
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      // If it's not JSON, assume success if status is ok
      result = { valid: true };
    }

    return Response.json({
      valid: true,
      sessionId,
      ...result,
    });
  } catch (error) {
    console.error("Session validation error:", error);
    return Response.json(
      {
        valid: false,
        error: "Failed to validate session",
      },
      { status: 500 },
    );
  }
}
