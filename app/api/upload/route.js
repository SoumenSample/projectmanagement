import { v2 as cloudinary } from "cloudinary";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const contentType = String(req.headers.get("content-type") || "").toLowerCase();

    let buffer;
    let sourceName = "document";
    let sourceType = "";

    if (contentType.includes("multipart/form-data")) {
      const data = await req.formData();
      const file = data.get("file");

      if (!file || typeof file.arrayBuffer !== "function") {
        return Response.json({ error: "No file received" }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      buffer = Buffer.from(bytes);
      sourceName = String(file.name || "document");
      sourceType = String(file.type || "");
    } else {
      const raw = await req.arrayBuffer();
      if (!raw || raw.byteLength === 0) {
        return Response.json({ error: "No file received" }, { status: 400 });
      }

      buffer = Buffer.from(raw);
      sourceName = decodeURIComponent(String(req.headers.get("x-file-name") || "document.pdf"));
      sourceType = contentType.split(";")[0].trim() || "application/pdf";
    }

    const isPdf =
      String(sourceType).toLowerCase() === "application/pdf" ||
      sourceName.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      return Response.json({ error: "Only PDF files are accepted" }, { status: 400 });
    }

    // Validate it's actually a PDF by checking the magic bytes
    const header = buffer.subarray(0, 5).toString("ascii");
    if (header !== "%PDF-") {
      return Response.json({ error: "Invalid PDF file" }, { status: 400 });
    }

    const sanitizedName = sourceName
      .trim()
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/\.[^.]+$/, ""); // strip extension, Cloudinary adds it

    const publicId = `uploads/${Date.now()}_${sanitizedName || "document"}`;

    // KEY FIX: Use resource_type "image" for PDFs so Cloudinary serves application/pdf
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: "image",
          public_id: publicId,
          format: "pdf",
          pages: true,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(buffer);
    });

    return Response.json({
      url: result.secure_url,
      publicId: result.public_id,
      resourceType: result.resource_type,
      format: result.format,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return Response.json(
      { error: error?.message || "Upload failed" },
      { status: 500 }
    );
  }
}