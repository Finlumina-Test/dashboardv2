import { upload } from "@/app/api/utils/upload";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    console.log("📎 Uploading file:", file.name, "Size:", file.size);

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload using the upload utility
    const result = await upload({ buffer });

    console.log("✅ Upload successful:", result.url);

    return Response.json({
      url: result.url,
      mimeType: result.mimeType,
      size: file.size,
      name: file.name,
    });
  } catch (error) {
    console.error("❌ Upload failed:", error);
    return Response.json(
      { error: "Upload failed", details: error.message },
      { status: 500 },
    );
  }
}
