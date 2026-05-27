import { connectToDatabase } from "@/lib/mongodb"
import WordDocument from "@/lib/models/WordDocument"
import { createWordDocumentBuffer } from "@/lib/document-utils"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(_request, { params }) {
  await connectToDatabase()

  const document = await WordDocument.findOne({ shareToken: params.shareToken, isShared: true }).lean()

  if (!document) {
    return Response.json({ error: "Document not found" }, { status: 404 })
  }

  const buffer = await createWordDocumentBuffer(document)
  const fileName = `${String(document.title || "document").replace(/[^a-z0-9-_]+/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "document"}.docx`

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  })
}
