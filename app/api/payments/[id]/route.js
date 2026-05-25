import { NextResponse } from "next/server"
import mongoose from "mongoose"
import Payment from "../../../../lib/models/Payment"
import Project from "../../../../lib/models/Project"

async function connectDB() {
  if (mongoose.connection.readyState === 1) return
  await mongoose.connect(process.env.MONGODB_URI)
}

// UPDATE
export async function PUT(req, { params }) {
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
  const totalFee = project ? Number(project?.client?.finalBudget ?? project?.finalBudget ?? 0) || 0 : Number(body.totalFee) || 0
  const clientEmail = project?.client?.email
    ? String(project.client.email).trim().toLowerCase()
    : String(body.clientEmail || "").trim().toLowerCase()

  if (amount > totalFee) {
    return NextResponse.json(
      { error: "Amount paid cannot be greater than total fee." },
      { status: 400 }
    )
  }

  const updated = await Payment.findByIdAndUpdate(
    params.id,
    {
      ...body,
      project: project?._id || body.project || null,
      clientEmail,
      amount,
      totalFee,
    },
    { new: true }
  )

  return NextResponse.json({ payment: updated })
}

// DELETE
export async function DELETE(req, { params }) {
  await connectDB()

  try {
    const deleted = await Payment.findByIdAndDelete(params.id)

    if (!deleted) {
      return NextResponse.json({ error: "Payment not found." }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: err?.message || "Unable to delete payment." }, { status: 500 })
  }
}