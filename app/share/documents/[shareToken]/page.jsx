import { notFound } from "next/navigation"

import { connectToDatabase } from "@/lib/mongodb"
import WordDocument from "@/lib/models/WordDocument"
import DocumentStudio from "@/components/documents/DocumentStudio"
import { parseDocumentContent } from "@/lib/document-utils"

export const dynamic = "force-dynamic"

function InlineSegments({ segments }) {
  return segments.map((segment, index) => (
    <span
      key={index}
      style={{
        fontWeight: segment.bold ? 700 : undefined,
        fontStyle: segment.italic ? "italic" : undefined,
      }}
    >
      {segment.text}
    </span>
  ))
}

export default async function SharedDocumentPage({ params }) {
  await connectToDatabase()

  const document = await WordDocument.findOne({
    shareToken: params.shareToken,
    isShared: true,
  }).lean()

  if (!document) {
    notFound()
  }

  // Serialize document data to pass to client component
  const docData = JSON.parse(JSON.stringify(document))

  return (
    <DocumentStudio initialDoc={docData} readOnly={true} />
  )
}