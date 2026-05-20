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
    const reqClone = req.clone();

    let buffer;
    let sourceName = "document";
    let sourceType = "";

    if (contentType.includes("multipart/form-data")) {
      try {
        const data = await req.formData();
        const file = data.get("file");

        if (!file || typeof file.arrayBuffer !== "function") {
          return Response.json({ error: "No file received" }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        buffer = Buffer.from(bytes);
        sourceName = String(file.name || "document");
        sourceType = String(file.type || "");
      } catch {
        // Some environments intermittently fail multipart parsing.
        // Fall back to raw body parsing using the cloned request stream.
        const raw = await reqClone.arrayBuffer();
        if (!raw || raw.byteLength === 0) {
          return Response.json({ error: "No file received" }, { status: 400 });
        }

        buffer = Buffer.from(raw);
        sourceName = decodeURIComponent(String(req.headers.get("x-file-name") || "document.pdf"));
        sourceType = String(req.headers.get("x-file-type") || "application/pdf").toLowerCase();
      }
    } else {
      const raw = await req.arrayBuffer();
      if (!raw || raw.byteLength === 0) {
        return Response.json({ error: "No file received" }, { status: 400 });
      }

      buffer = Buffer.from(raw);
      sourceName = decodeURIComponent(String(req.headers.get("x-file-name") || "document.pdf"));
      sourceType = contentType.split(";")[0].trim();
    }

    const sanitizedName = String(sourceName || "document")
      .trim()
      .replace(/[^a-zA-Z0-9._-]+/g, "-");
    const baseName = sanitizedName.replace(/\.[^.]+$/, "");
    const isPdf = String(sourceType || "").toLowerCase() === "application/pdf" || sanitizedName.toLowerCase().endsWith(".pdf");

    if (isPdf) {
      const header = buffer.subarray(0, 5).toString("utf8");
      if (header !== "%PDF-") {
        return Response.json({ error: "Invalid PDF payload received" }, { status: 400 });
      }
    }

    const resourceType = isPdf ? "raw" : "image";
    const publicId = isPdf
      ? `uploads/${Date.now()}_${baseName || "document"}.pdf`
      : `uploads/${Date.now()}_${baseName || "document"}`;

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: resourceType,
          public_id: publicId,
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
    return Response.json({ error: error?.message || "Upload failed" }, { status: 500 });
  }
}