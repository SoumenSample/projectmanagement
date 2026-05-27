import { NextResponse } from "next/server"
import mongoose from "mongoose"
import Contract from "../../../../lib/models/Contract"

// ✅ DB CONNECT
async function connectDB() {
  if (mongoose.connection.readyState === 1) return
  await mongoose.connect(process.env.MONGODB_URI)
}

//
// =========================
// ✅ GET SINGLE CONTRACT
// =========================
//
export async function GET(req, { params }) {
  try {
    await connectDB()

    const contract = await Contract.findById(params.id)

    if (!contract) {
      return NextResponse.json(
        { error: "Contract not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ contract })

  } catch (err) {
    console.error("GET CONTRACT ERROR:", err)

    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )
  }
}

//
// =========================
// ✅ UPDATE CONTRACT
// =========================
//
export async function PUT(req, { params }) {
  try {
    await connectDB()

    const body = await req.json()

    // ✅ Fetch existing contract to compare changes
    const existingContract = await Contract.findById(params.id)
    if (!existingContract) {
      return NextResponse.json(
        { error: "Contract not found" },
        { status: 404 }
      )
    }

    const updateData = {}

    // ✅ Only add fields to updateData if they are actually provided
    if (body.description !== undefined && body.description !== null) updateData.description = body.description
    if (body.reference !== undefined && body.reference !== null) updateData.reference = body.reference
    
    // ✅ Handle both admin and client signatures
    if (body.adminSignature !== undefined && body.adminSignature !== null) updateData.adminSignature = body.adminSignature
    if (body.adminSignedDate !== undefined && body.adminSignedDate !== null) updateData.adminSignedDate = body.adminSignedDate
    if (body.signature !== undefined && body.signature !== null) updateData.signature = body.signature
    if (body.clientSignedDate !== undefined && body.clientSignedDate !== null) updateData.signedDate = body.clientSignedDate
    
    // ✅ Handle both client and employee emails
    if (body.clientEmail !== undefined && body.clientEmail !== null) updateData.clientEmail = body.clientEmail
    if (body.employeeEmail !== undefined && body.employeeEmail !== null) updateData.employeeEmail = body.employeeEmail
    if (body.vendorEmail !== undefined && body.vendorEmail !== null) updateData.vendorEmail = body.vendorEmail
    if (body.recipientType !== undefined && body.recipientType !== null) updateData.recipientType = body.recipientType
    
    // ✅ Handle date -> signedDate conversion (form sends 'date', DB uses 'signedDate')
    if (body.signedDate !== undefined && body.signedDate !== null) updateData.signedDate = body.signedDate
    if (body.date !== undefined && body.date !== null) updateData.signedDate = body.date

    // Handle validity dates
    if (body.validFrom !== undefined && body.validFrom !== null) updateData.validFrom = body.validFrom
    if (body.validTo !== undefined && body.validTo !== null) updateData.validTo = body.validTo

    // If both provided, validate ordering
    if (updateData.validFrom && updateData.validTo) {
      const from = new Date(updateData.validFrom)
      const to = new Date(updateData.validTo)
      if (!isNaN(from.getTime()) && !isNaN(to.getTime()) && to.getTime() < from.getTime()) {
        return NextResponse.json({ error: "Contract ending date must be on or after starting date" }, { status: 400 })
      }
    }

    // ✅ Check if ANY contract detail field is being changed
    const descriptionChanged = body.description !== undefined && body.description !== existingContract.description
    const clientEmailChanged = body.clientEmail !== undefined && body.clientEmail !== existingContract.clientEmail
    const employeeEmailChanged = body.employeeEmail !== undefined && body.employeeEmail !== existingContract.employeeEmail
    const referenceChanged = body.reference !== undefined && body.reference !== existingContract.reference
    
    const isAnyDetailChanged = descriptionChanged || clientEmailChanged || employeeEmailChanged || referenceChanged

    // ✅ If ANY contract detail is being updated and NOT signing both, clear signatures and reset to pending
    if (isAnyDetailChanged && !body.adminSignature && !body.signature) {
      updateData.adminSignature = null
      updateData.adminSignedDate = null
      updateData.signature = null
      updateData.signedDate = null
      updateData.status = "pending"
    }
    const hasAdminSignature = Object.prototype.hasOwnProperty.call(updateData, "adminSignature")
      ? updateData.adminSignature
      : existingContract.adminSignature
    const hasClientSignature = Object.prototype.hasOwnProperty.call(updateData, "signature")
      ? updateData.signature
      : existingContract.signature

    // ✅ Auto-update status based on final signature state
    if (hasAdminSignature && hasClientSignature) {
      updateData.status = "completed"
    } else if (hasAdminSignature) {
      updateData.status = "admin-signed"
    } else {
      updateData.status = "pending"
    }

    const updated = await Contract.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true }
    )

    return NextResponse.json({ contract: updated })

  } catch (err) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )
  }
}

//
// =========================
// 🗑️ DELETE CONTRACT (optional)
// =========================
//
export async function DELETE(req, { params }) {
  try {
    await connectDB()

    await Contract.findByIdAndDelete(params.id)

    return NextResponse.json({ message: "Deleted successfully" })

  } catch (err) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )
  }
}