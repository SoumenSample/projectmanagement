import { getServerSession } from "next-auth"
import { isValidObjectId } from "mongoose"

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

export async function PUT(request, { params }) {
  const access = await requireAdmin()
  if (access.error) {
    return access.error
  }

  if (!isValidObjectId(params.id)) {
    return Response.json({ error: "Sheet not found" }, { status: 404 })
  }

  const body = await request.json()
  const title = String(body?.title || "").trim()

  if (!title) {
    return Response.json({ error: "Title is required" }, { status: 400 })
  }

  await connectToDatabase()

  const sheet = await SpreadsheetDocument.findById(params.id)

  if (!sheet) {
    return Response.json({ error: "Sheet not found" }, { status: 404 })
  }

  sheet.title = title
  sheet.summary = String(body?.summary || "").trim()
  sheet.cells = Array.isArray(body?.cells) && body.cells.length > 0 ? body.cells : createEmptySpreadsheetGrid()
  sheet.isShared = body?.isShared !== false
  sheet.updatedBy = access.session.user.id

  await sheet.save()

  return Response.json({ sheet })
}

export async function DELETE(_request, { params }) {
  const access = await requireAdmin()
  if (access.error) {
    return access.error
  }

  if (!isValidObjectId(params.id)) {
    return Response.json({ error: "Sheet not found" }, { status: 404 })
  }

  await connectToDatabase()
  const result = await SpreadsheetDocument.findByIdAndDelete(params.id)

  if (!result) {
    return Response.json({ error: "Sheet not found" }, { status: 404 })
  }

  return Response.json({ success: true })
}
