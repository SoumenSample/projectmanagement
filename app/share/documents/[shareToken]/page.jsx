import { notFound } from "next/navigation"

import { connectToDatabase } from "@/lib/mongodb"
import WordDocument from "@/lib/models/WordDocument"
import { parseDocumentContent } from "@/lib/document-utils"

export const dynamic = "force-dynamic"

function InlineSegments({ segments }) {
  return segments.map((segment, index) => (
    <span key={index} className={`${segment.bold ? "font-semibold" : ""} ${segment.italic ? "italic" : ""}`}>
      {segment.text}
    </span>
  ))
}

export default async function SharedDocumentPage({ params }) {
  await connectToDatabase()

  const document = await WordDocument.findOne({ shareToken: params.shareToken, isShared: true }).lean()

  if (!document) {
    notFound()
  }

  const blocks = parseDocumentContent(document.content || "")
  const downloadUrl = `/api/documents/share/${document.shareToken}/download`

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-[2rem] border border-white/60 bg-white/85 p-6 shadow-[0_20px_80px_rgba(15,23,42,0.12)] backdrop-blur dark:border-white/10 dark:bg-slate-950/75 sm:p-10">
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 dark:border-white/10 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Shared document</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{document.title}</h1>
              {document.summary ? <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">{document.summary}</p> : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href={downloadUrl}
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
              >
                Download .docx
              </a>
            </div>
          </div>

          <article className="mt-8 space-y-4 font-serif text-[16px] leading-8 text-slate-800 dark:text-slate-100">
            {blocks.map((block, index) => {
              if (block.type === "blank") {
                return <div key={index} className="h-2" />
              }

              if (block.type === "heading1") {
                return (
                  <h2 key={index} className="text-2xl font-bold leading-8 tracking-tight text-slate-950 dark:text-white">
                    <InlineSegments segments={block.segments} />
                  </h2>
                )
              }

              if (block.type === "heading2") {
                return (
                  <h3 key={index} className="text-xl font-semibold leading-7 text-slate-900 dark:text-slate-50">
                    <InlineSegments segments={block.segments} />
                  </h3>
                )
              }

              if (block.type === "heading3") {
                return (
                  <h4 key={index} className="text-lg font-semibold leading-7 text-slate-900 dark:text-slate-50">
                    <InlineSegments segments={block.segments} />
                  </h4>
                )
              }

              if (block.type === "bullet") {
                return (
                  <div key={index} className="flex gap-3 pl-1">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400 dark:bg-slate-500" />
                    <p className="m-0">
                      <InlineSegments segments={block.segments} />
                    </p>
                  </div>
                )
              }

              return (
                <p key={index} className="m-0 whitespace-pre-wrap">
                  <InlineSegments segments={block.segments} />
                </p>
              )
            })}
          </article>
        </div>
      </div>
    </main>
  )
}
