import { NextResponse } from "next/server"
import mongoose from "mongoose"
import User from "../../../lib/models/User"

async function connectDB() {
  if (mongoose.connection.readyState === 1) return
  await mongoose.connect(process.env.MONGODB_URI)
}

// ✅ GET CLIENTS OR EMPLOYEES
export async function GET(req) {
  try {
    await connectDB()

    const { searchParams } = new URL(req.url)
    const role = searchParams.get("role") // "client" or "employee"

    if (!role || !["client", "employee"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role parameter" },
        { status: 400 }
      )
    }

    const users = await User.find({ 
      role: role,
      isActive: true 
    }).select("name email").sort({ name: 1 })

    const recipients = users.map(user => ({
      id: user._id,
      name: user.name,
      email: user.email,
    }))

    return NextResponse.json({ recipients })

  } catch (error) {
    console.error("GET RECIPIENTS ERROR:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
