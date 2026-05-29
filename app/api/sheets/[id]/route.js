import { getServerSession } from "next-auth"
import { isValidObjectId } from "mongoose"

import { authOptions } from "@/lib/auth-options"
import { connectToDatabase } from "@/lib/mongodb"
import SpreadsheetDocument from "@/lib/models/SpreadsheetDocument"
import { createEmptySpreadsheetGrid } from "@/lib/spreadsheet-utils"
import User from "@/lib/models/User"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const sheetAccessRoles = new Set(["admin", "client", "employee", "vendor"])

function canAccessSheet(sheet, session) {
  if (!sheet || !session?.user) {
    return false
  }

  if (session.user.role === "admin") {
    return true
  }

  const userId = String(session.user.id)
  const createdBy = sheet.createdBy ? String(sheet.createdBy) : ""
  const sharedWith = Array.isArray(sheet.sharedWith)
    ? sheet.sharedWith.map((value) => String(value))
    : []
  const assignedArr = Array.isArray(sheet.assignedTo)
    ? sheet.assignedTo.map((v) => String(v))
    : sheet.assignedTo
      ? [String(sheet.assignedTo)]
      : []

  return createdBy === userId || sheet.isShared === true || sharedWith.includes(userId) || assignedArr.includes(userId)
}

function canAssignTo(sessionUserRole, assigneeRole) {
  if (sessionUserRole === "admin") return true
  if (sessionUserRole === "employee") return new Set(["employee", "admin"]).has(assigneeRole)
  if (sessionUserRole === "vendor") return new Set(["vendor", "employee", "admin"]).has(assigneeRole)
  if (sessionUserRole === "client") return assigneeRole === "admin"
  return false
}

async function requireSheetAccess() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return { error: Response.json({ error: "Unauthorized" }, { status: 401 }) }
  }

  if (!sheetAccessRoles.has(session.user.role)) {
    return { error: Response.json({ error: "Forbidden" }, { status: 403 }) }
  }

  return { session }
}

export async function PUT(request, { params }) {
  const access = await requireSheetAccess()
  if (access.error) {
    return access.error
  }
  const awaitedParams = await params
  if (!isValidObjectId(awaitedParams.id)) {
    return Response.json({ error: "Sheet not found" }, { status: 404 })
  }

  const body = await request.json()
  const title = String(body?.title || "").trim()

  if (!title) {
    return Response.json({ error: "Title is required" }, { status: 400 })
  }

  await connectToDatabase()

  const sheet = await SpreadsheetDocument.findById(awaitedParams.id)

  if (!sheet) {
    return Response.json({ error: "Sheet not found" }, { status: 404 })
  }

  if (!canAccessSheet(sheet, access.session)) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  sheet.title = title
  sheet.summary = String(body?.summary || "").trim()
  sheet.cells = Array.isArray(body?.cells) && body.cells.length > 0 ? body.cells : createEmptySpreadsheetGrid()
  sheet.isShared = body?.isShared !== false
  sheet.sharedWith = Array.isArray(body?.sharedWith) ? body.sharedWith.filter(Boolean) : sheet.sharedWith
  if (body?.assignedTo !== undefined) {
    let assignedTo = []
    if (Array.isArray(body.assignedTo)) assignedTo = body.assignedTo.filter(Boolean)
    else if (body.assignedTo) assignedTo = [body.assignedTo]

    for (const assigneeId of assignedTo) {
      const user = await User.findById(assigneeId).lean()
      if (!user) return Response.json({ error: "Assignee not found" }, { status: 400 })
      if (!canAssignTo(access.session.user.role, user.role)) {
        return Response.json({ error: "Forbidden to assign to this user" }, { status: 403 })
      }
    }
    sheet.assignedTo = assignedTo
  }
  sheet.updatedBy = access.session.user.id

  await sheet.save()

  return Response.json({ sheet })
}

export async function DELETE(_request, { params }) {
  const access = await requireSheetAccess()
  if (access.error) {
    return access.error
  }

  const awaitedParams = await params
  if (!isValidObjectId(awaitedParams.id)) {
    return Response.json({ error: "Sheet not found" }, { status: 404 })
  }

  await connectToDatabase()
  const result = await SpreadsheetDocument.findByIdAndDelete(awaitedParams.id)

  if (!result) {
    return Response.json({ error: "Sheet not found" }, { status: 404 })
  }

  return Response.json({ success: true })
}
