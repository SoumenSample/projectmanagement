import { getServerSession } from "next-auth"
import { isValidObjectId } from "mongoose"

import { authOptions } from "@/lib/auth-options"
import { connectToDatabase } from "@/lib/mongodb"
import WordDocument from "@/lib/models/WordDocument"
import User from "@/lib/models/User"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const documentAccessRoles = new Set(["admin", "client", "employee", "vendor"])

function canAccessDocument(document, session) {
  if (!document || !session?.user) {
    return false
  }

  if (session.user.role === "admin") {
    return true
  }

  const userId = String(session.user.id)
  const createdBy = document.createdBy ? String(document.createdBy) : ""
  const sharedWith = Array.isArray(document.sharedWith)
    ? document.sharedWith.map((value) => String(value))
    : []
  const assignedArr = Array.isArray(document.assignedTo)
    ? document.assignedTo.map((v) => String(v))
    : document.assignedTo
      ? [String(document.assignedTo)]
      : []

  return createdBy === userId || document.isShared === true || sharedWith.includes(userId) || assignedArr.includes(userId)
}

function canAssignTo(sessionUserRole, assigneeRole) {
  if (sessionUserRole === "admin") return true
  if (sessionUserRole === "employee") return new Set(["employee", "admin"]).has(assigneeRole)
  if (sessionUserRole === "vendor") return new Set(["vendor", "employee", "admin"]).has(assigneeRole)
  if (sessionUserRole === "client") return assigneeRole === "admin"
  return false
}

async function requireDocumentAccess() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return { error: Response.json({ error: "Unauthorized" }, { status: 401 }) }
  }

  if (!documentAccessRoles.has(session.user.role)) {
    return { error: Response.json({ error: "Forbidden" }, { status: 403 }) }
  }

  return { session }
}

export async function PUT(request, { params }) {
  const access = await requireDocumentAccess()
  if (access.error) {
    return access.error
  }

  // `params` in the App Router can be async — await before using
  const awaitedParams = await params
  if (!isValidObjectId(awaitedParams.id)) {
    return Response.json({ error: "Document not found" }, { status: 404 })
  }

  const body = await request.json()
  const title = String(body?.title || "").trim()

  if (!title) {
    return Response.json({ error: "Title is required" }, { status: 400 })
  }

  await connectToDatabase()

  const document = await WordDocument.findById(awaitedParams.id)

  if (!document) {
    return Response.json({ error: "Document not found" }, { status: 404 })
  }

  if (!canAccessDocument(document, access.session)) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  document.title = title
  document.summary = String(body?.summary || "").trim()
  document.content = String(body?.content || "").trim()
  document.isShared = body?.isShared !== false
  document.sharedWith = Array.isArray(body?.sharedWith) ? body.sharedWith.filter(Boolean) : document.sharedWith
  // handle assignment if provided
  if (body?.assignedTo !== undefined) {
    // normalize to array
    let assignedTo = []
    if (Array.isArray(body.assignedTo)) assignedTo = body.assignedTo.filter(Boolean)
    else if (body.assignedTo) assignedTo = [body.assignedTo]

    // validate each assignee
    for (const assigneeId of assignedTo) {
      const user = await User.findById(assigneeId).lean()
      if (!user) return Response.json({ error: "Assignee not found" }, { status: 400 })
      if (!canAssignTo(access.session.user.role, user.role)) {
        return Response.json({ error: "Forbidden to assign to this user" }, { status: 403 })
      }
    }

    document.assignedTo = assignedTo
  }
  document.updatedBy = access.session.user.id

  await document.save()

  return Response.json({ document })
}

export async function DELETE(_request, { params }) {
  const access = await requireDocumentAccess()
  if (access.error) {
    return access.error
  }

  const awaitedParams = await params
  if (!isValidObjectId(awaitedParams.id)) {
    return Response.json({ error: "Document not found" }, { status: 404 })
  }

  await connectToDatabase()
  const result = await WordDocument.findByIdAndDelete(awaitedParams.id)

  if (!result) {
    return Response.json({ error: "Document not found" }, { status: 404 })
  }

  return Response.json({ success: true })
}
