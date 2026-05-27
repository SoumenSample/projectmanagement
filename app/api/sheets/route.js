import { randomUUID } from "crypto"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth-options"
import { connectToDatabase } from "@/lib/mongodb"
import SpreadsheetDocument from "@/lib/models/SpreadsheetDocument"
import { createEmptySpreadsheetGrid } from "@/lib/spreadsheet-utils"

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
  const sheets = await SpreadsheetDocument.find({}).sort({ updatedAt: -1, createdAt: -1 }).lean()

  return Response.json({ sheets })
}

export async function POST(request) {
  const access = await requireAdmin()
  if (access.error) {
    return access.error
  }

  const body = await request.json()
  const title = String(body?.title || "").trim()
  const summary = String(body?.summary || "").trim()
  const isShared = body?.isShared !== false
  const cells = Array.isArray(body?.cells) && body.cells.length > 0 ? body.cells : createEmptySpreadsheetGrid()

  if (!title) {
    return Response.json({ error: "Title is required" }, { status: 400 })
  }

  await connectToDatabase()

  const sheet = await SpreadsheetDocument.create({
    title,
    summary,
    cells,
    shareToken: randomUUID(),
    isShared,
    createdBy: access.session.user.id,
    updatedBy: access.session.user.id,
  })

  return Response.json({ sheet }, { status: 201 })
}
