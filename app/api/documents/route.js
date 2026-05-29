import { randomUUID } from "crypto"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth-options"
import { connectToDatabase } from "@/lib/mongodb"
import WordDocument from "@/lib/models/WordDocument"
import User from "@/lib/models/User"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const documentAccessRoles = new Set(["admin", "client", "employee", "vendor"])

function buildDocumentVisibilityQuery(session) {
  if (session.user.role === "admin") {
    return {}
  }

  return {
    $or: [
      { createdBy: session.user.id },
      { sharedWith: session.user.id },
      { assignedTo: session.user.id },
    ],
  }
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

export async function GET() {
  const access = await requireDocumentAccess()
  if (access.error) {
    return access.error
  }

  await connectToDatabase()
  const documents = await WordDocument.find(buildDocumentVisibilityQuery(access.session))
    .sort({ updatedAt: -1, createdAt: -1 })
    .lean()

  return Response.json({ documents })
}

export async function POST(request) {
  const access = await requireDocumentAccess()
  if (access.error) {
    return access.error
  }

  const body = await request.json()
  const title = String(body?.title || "").trim()
  const summary = String(body?.summary || "").trim()
  const content = String(body?.content || "").trim()
  const isShared = body?.isShared !== false
  const sharedWith = Array.isArray(body?.sharedWith)
    ? body.sharedWith.filter(Boolean)
    : []
  // Normalize assignedTo to an array (support single id or array)
  let assignedTo = []
  if (Array.isArray(body?.assignedTo)) assignedTo = body.assignedTo.filter(Boolean)
  else if (body?.assignedTo) assignedTo = [body.assignedTo]

  if (!title) {
    return Response.json({ error: "Title is required" }, { status: 400 })
  }

  await connectToDatabase()

  // validate assignedTo if provided
  if (assignedTo.length > 0) {
    for (const assigneeId of assignedTo) {
      const user = await User.findById(assigneeId).lean()
      if (!user) return Response.json({ error: "Assignee not found" }, { status: 400 })
      if (!canAssignTo(access.session.user.role, user.role)) {
        return Response.json({ error: "Forbidden to assign to this user" }, { status: 403 })
      }
    }
  }

  const document = await WordDocument.create({
    title,
    summary,
    content,
    shareToken: randomUUID(),
    isShared,
    sharedWith,
    assignedTo,
    createdBy: access.session.user.id,
    updatedBy: access.session.user.id,
  })

  return Response.json({ document }, { status: 201 })
}
