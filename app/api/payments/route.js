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
  try {
    await connectDB()

    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const email = searchParams.get("email")
    const employeeParam = searchParams.get("employee")
    const vendorParam = searchParams.get("vendor")

    // Build query depending on role and query params
    let query = {}

    if (session.user.role === "admin") {
      if (email) query.clientEmail = email
      if (employeeParam) query.employee = employeeParam
      if (vendorParam) query.vendor = vendorParam
    } else if (session.user.role === "client") {
      query.clientEmail = session.user.email
    } else if (session.user.role === "employee") {
        // employees see payments targeted to them OR payments for projects
        // where they are assigned (assignedEmployees)
        const assignedProjects = await Project.find({ assignedEmployees: session.user.id }).select("_id")
        const assignedProjectIds = assignedProjects.map((p) => p._id)

        query = {
          $or: [
            { employee: session.user.id },
            { project: { $in: assignedProjectIds } },
          ],
        }
    }

    // vendors should see payments for projects where they are the assignedVendor
    else if (session.user.role === "vendor") {
      const vendorProjects = await Project.find({ assignedVendor: session.user.id }).select("_id")
      const vendorProjectIds = vendorProjects.map((p) => p._id)

      query = {
        $or: [
          { vendor: session.user.id },
          { project: { $in: vendorProjectIds } },
        ],
      }
    }

    const payments = await Payment.find(query)
      .sort({ createdAt: -1 })
      .populate({
        path: "project",
        select: "title client projectCost",
        populate: {
          path: "client",
          select: "name email role",
        },
      })
      .populate({
        path: "employee",
        select: "name email role",
      })

    const paymentsWithLiveTotalFee = payments.map((payment) => {
      const paymentObject = payment.toObject ? payment.toObject() : payment
      const liveProjectCost = paymentObject?.project?.projectCost

      if (paymentObject?.project && liveProjectCost !== undefined && liveProjectCost !== null) {
        const parsedProjectCost = Number(liveProjectCost)
        return {
          ...paymentObject,
          totalFee: Number.isFinite(parsedProjectCost) ? parsedProjectCost : 0,
        }
      }

      return paymentObject
    })

    return NextResponse.json({ payments: paymentsWithLiveTotalFee })
  } catch (err) {
    console.error('GET /api/payments error:', err?.message || err)
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 })
  }
}

function parseProjectBudget(project) {
  const projectBudget = project?.projectCost ?? ""
  const parsedBudget = Number(projectBudget)
  return Number.isFinite(parsedBudget) ? parsedBudget : 0
}

// POST (create)
export async function POST(req) {
  try {
    await connectDB()

    const body = await req.json()
    let project = null

    if (body.project) {
      project = await Project.findById(body.project).populate("client", "name email role")

      if (!project) {
        return NextResponse.json({ error: "Project not found." }, { status: 404 })
      }
    }

    const amount = Number(body.amount) || 0
    // If this payment targets an employee or vendor (salary/payment), default totalFee to amount
    const isRecipientUser = Boolean(body.employee || body.vendor)
    const totalFee = project
      ? parseProjectBudget(project)
      : isRecipientUser
        ? amount
        : Number(body.totalFee) || 0

    const clientEmail = project?.client?.email
      ? String(project.client.email).trim().toLowerCase()
      : isRecipientUser
        ? ""
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
      employee: body.employee || null,
      vendor: body.vendor || null,
      clientEmail,
      amount,
      totalFee,
    })

    // Emit notifications to employees and the client (if user exists)
    try {
      // Notify either specific employee/vendor (if provided)
      if (payment.employee) {
        const employeeUser = await User.findById(payment.employee).select("_id");
        const employeeId = employeeUser?._id?.toString?.();
        if (employeeId) {
          await notificationService.createAndEmitNotification({
            userIds: [employeeId],
            type: "payment",
            title: "Payment recorded",
            message: `Payment recorded: ${payment.title || payment.amount}`,
            text: `Payment recorded: ${payment.title || payment.amount}`,
            route: "/dashboard/employee/payment",
            source: "payment",
            payload: { paymentId: payment._id?.toString?.() || payment._id },
          })
        }
      } else if (payment.vendor) {
        const vendorUser = await User.findById(payment.vendor).select("_id");
        const vendorId = vendorUser?._id?.toString?.();
        if (vendorId) {
          await notificationService.createAndEmitNotification({
            userIds: [vendorId],
            type: "payment",
            title: "Payment recorded",
            message: `Payment recorded: ${payment.title || payment.amount}`,
            text: `Payment recorded: ${payment.title || payment.amount}`,
            route: "/dashboard/vendor/payment",
            source: "payment",
            payload: { paymentId: payment._id?.toString?.() || payment._id },
          })
        }
      } else {
        const employeeUsers = await User.find({ role: "employee" }).select("_id");
        const employeeIds = employeeUsers.map((u) => u._id?.toString?.()).filter(Boolean);
        if (employeeIds.length) {
          await notificationService.createAndEmitNotification({
            userIds: employeeIds,
            type: "payment",
            title: "New payment update",
            message: `Payment recorded: ${payment.title || payment.amount}`,
            text: `Payment recorded: ${payment.title || payment.amount}`,
            route: "/dashboard/employee/payment",
            source: "payment",
            payload: { paymentId: payment._id?.toString?.() || payment._id },
          })
        }
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
  } catch (err) {
    console.error('POST /api/payments error:', err?.message || err)
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 })
  }
}