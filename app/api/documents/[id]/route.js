import { getServerSession } from "next-auth"
import { isValidObjectId } from "mongoose"

import { authOptions } from "@/lib/auth-options"
import { connectToDatabase } from "@/lib/mongodb"
import WordDocument from "@/lib/models/WordDocument"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

async function requireAdmin() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return { error: Response.json({ error: "Unauthorized" }, { status: 401 }) }
  }

  if (session.user.role !== "admin") {
    return { error: Response.json({ error: "Forbidden" }, { status: 403 }) }
  }

  return { session }
}

export async function PUT(request, { params }) {
  const access = await requireAdmin()
  if (access.error) {
    return access.error
  }

  if (!isValidObjectId(params.id)) {
    return Response.json({ error: "Document not found" }, { status: 404 })
  }

  const body = await request.json()
  const title = String(body?.title || "").trim()

  if (!title) {
    return Response.json({ error: "Title is required" }, { status: 400 })
  }

  await connectToDatabase()

  const document = await WordDocument.findById(params.id)

  if (!document) {
    return Response.json({ error: "Document not found" }, { status: 404 })
  }

  document.title = title
  document.summary = String(body?.summary || "").trim()
  document.content = String(body?.content || "").trim()
  document.isShared = body?.isShared !== false
  document.updatedBy = access.session.user.id

  await document.save()

  return Response.json({ document })
}

export async function DELETE(_request, { params }) {
  const access = await requireAdmin()
  if (access.error) {
    return access.error
  }

  if (!isValidObjectId(params.id)) {
    return Response.json({ error: "Document not found" }, { status: 404 })
  }

  await connectToDatabase()
  const result = await WordDocument.findByIdAndDelete(params.id)

  if (!result) {
    return Response.json({ error: "Document not found" }, { status: 404 })
  }

  return Response.json({ success: true })
}
