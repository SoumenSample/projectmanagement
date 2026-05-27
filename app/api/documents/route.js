import { randomUUID } from "crypto"
import { getServerSession } from "next-auth"

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

export async function GET() {
  const access = await requireAdmin()
  if (access.error) {
    return access.error
  }

  await connectToDatabase()
  const documents = await WordDocument.find({}).sort({ updatedAt: -1, createdAt: -1 }).lean()

  return Response.json({ documents })
}

export async function POST(request) {
  const access = await requireAdmin()
  if (access.error) {
    return access.error
  }

  const body = await request.json()
  const title = String(body?.title || "").trim()
  const summary = String(body?.summary || "").trim()
  const content = String(body?.content || "").trim()
  const isShared = body?.isShared !== false

  if (!title) {
    return Response.json({ error: "Title is required" }, { status: 400 })
  }

  await connectToDatabase()

  const document = await WordDocument.create({
    title,
    summary,
    content,
    shareToken: randomUUID(),
    isShared,
    createdBy: access.session.user.id,
    updatedBy: access.session.user.id,
  })

  return Response.json({ document }, { status: 201 })
}
