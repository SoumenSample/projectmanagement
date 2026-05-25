import { NextResponse } from "next/server"
import mongoose from "mongoose"
import Payment from "../../../lib/models/Payment"
import Project from "../../../lib/models/Project"
import User from "@/lib/models/User"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import notificationService from "@/lib/notifications/notification-service"

async function connectDB() {
  if (mongoose.connection.readyState === 1) return
  await mongoose.connect(process.env.MONGODB_URI)
}

// GET (admin + client filter)
export async function GET(req) {
  await connectDB()

  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const email = searchParams.get("email")

  // For non-admins, only allow viewing their own payments
  const query = session.user.role === "admin" && email
    ? { clientEmail: email }
    : { clientEmail: session.user.email }

  const payments = await Payment.find(query)
    .sort({ createdAt: -1 })
    .populate({
      path: "project",
      select: "title client",
      populate: {
        path: "client",
        select: "name email role finalBudget",
      },
    })

  return NextResponse.json({ payments })
}

function parseProjectBudget(project) {
  const projectBudget = project?.client?.finalBudget ?? project?.finalBudget ?? ""
  const parsedBudget = Number(projectBudget)
  return Number.isFinite(parsedBudget) ? parsedBudget : 0
}

// POST (create)
export async function POST(req) {
  await connectDB()

  const body = await req.json()
  let project = null

  if (body.project) {
    project = await Project.findById(body.project).populate("client", "name email role finalBudget")

    if (!project) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 })
    }
  }

  const amount = Number(body.amount) || 0
  const totalFee = project ? parseProjectBudget(project) : Number(body.totalFee) || 0
  const clientEmail = project?.client?.email
    ? String(project.client.email).trim().toLowerCase()
    : String(body.clientEmail || "").trim().toLowerCase()

  if (amount > totalFee) {
    return NextResponse.json(
      { error: "Amount paid cannot be greater than total fee." },
      { status: 400 }
    )
  }

  const payment = await Payment.create({
    ...body,
    project: project?._id || body.project || null,
    clientEmail,
    amount,
    totalFee,
  })

  // Emit notifications to employees and the client (if user exists)
  try {
    const employeeUsers = await User.find({ role: "employee" }).select("_id");
    const employeeIds = employeeUsers.map((u) => u._id?.toString?.()).filter(Boolean);

    if (employeeIds.length) {
      await notificationService.createAndEmitNotification({
        userIds: employeeIds,
        type: "payment",
        title: "New payment update",
        message: `Payment recorded: ${payment.title || payment.amount}`,
        text: `Payment recorded: ${payment.title || payment.amount}`,
        route: "/dashboard/employee",
        source: "payment",
        payload: { paymentId: payment._id?.toString?.() || payment._id },
      })
    }

    // try to find a user by clientEmail to notify the client
    if (payment.clientEmail) {
      const client = await User.findOne({ email: String(payment.clientEmail || "").trim().toLowerCase() }).select("_id");
      const clientId = client?._id?.toString?.();
      if (clientId) {
        await notificationService.createAndEmitNotification({
          userIds: [clientId],
          type: "payment",
          title: "Payment recorded",
          message: `We recorded your payment of ${payment.amount}.`,
          text: `We recorded your payment of ${payment.amount}.`,
          route: "/dashboard/client/payment",
          source: "payment",
          payload: { paymentId: payment._id?.toString?.() || payment._id },
        })
      }
    }
  } catch (err) {
    console.error("Notification emit error (payment):", err?.message || err)
  }

  return NextResponse.json({ payment })
}