import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { connectToDatabase } from "@/lib/mongodb"
import User from "@/lib/models/User"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 })

    await connectToDatabase()

    const users = await User.find({}, { passwordHash: 0 }).sort({ name: 1 }).lean()
    const mapped = users.map(u => ({ _id: u._id?.toString?.() || String(u._id), name: u.name, email: u.email, role: u.role }))
    return Response.json({ users: mapped })
  } catch (err) {
    console.error("GET /api/users/simple error:", err)
    return Response.json({ error: "Server error" }, { status: 500 })
  }
}
