import { NextResponse } from "next/server"
import mongoose from "mongoose"
import Payment from "../../../lib/models/Payment"
import User from "@/lib/models/User"
import notificationService from "@/lib/notifications/notification-service"

async function connectDB() {
  if (mongoose.connection.readyState === 1) return
  await mongoose.connect(process.env.MONGODB_URI)
}

// GET (admin + client filter)
export async function GET(req) {
  await connectDB()

  const { searchParams } = new URL(req.url)
  const email = searchParams.get("email")

  const query = email ? { clientEmail: email } : {}

  const payments = await Payment.find(query).sort({ createdAt: -1 })

  return NextResponse.json({ payments })
}

// POST (create)
export async function POST(req) {
  await connectDB()

  const body = await req.json()

  const amount = Number(body.amount) || 0
  const totalFee = Number(body.totalFee) || 0

  if (amount > totalFee) {
    return NextResponse.json(
      { error: "Amount paid cannot be greater than total fee." },
      { status: 400 }
    )
  }

  const payment = await Payment.create({
    ...body,
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