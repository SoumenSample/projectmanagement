import { NextResponse } from "next/server"
import Quotation from "@/lib/models/Quotation"
import User from "@/lib/models/User"
import { connectToDatabase } from "@/lib/mongodb"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"

function makeSafeFilename(value) {
  return String(value || "quotation")
    .trim()
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "") || "quotation"
}

async function connectDB() {
  try {
    await connectToDatabase()
  } catch (err) {
    console.error("DB ERROR:", err)
    throw err
  }
}

export async function GET(req, { params }) {
  try {
    await connectDB()

    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: quotationId } = params
    const quotation = await Quotation.findById(quotationId)

    if (!quotation) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 })
    }

    const isAdmin = user.role === "admin"
    const isRecipient = String(quotation.recipientUserId || "") === String(user._id)

    if (!isAdmin && !isRecipient) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (!quotation.fileUrl) {
      return NextResponse.json({ error: "Quotation file not available" }, { status: 404 })
    }

    const sourceResponse = await fetch(quotation.fileUrl)
    if (!sourceResponse.ok) {
      return NextResponse.json({ error: "Failed to fetch quotation file" }, { status: 502 })
    }

    const fileBuffer = await sourceResponse.arrayBuffer()
    const filename = `${makeSafeFilename(quotation.title || "quotation")}.pdf`

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(fileBuffer.byteLength),
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (err) {
    console.error("🔥 GET DOWNLOAD ERROR:", err)
    return NextResponse.json({ error: err.message || "Failed to download quotation" }, { status: 500 })
  }
}

export async function PUT(req, { params }) {
  try {
    await connectDB()
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await User.findOne({ email: session.user.email })
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { id: quotationId } = params

    const formData = await req.formData()
    const title = formData.get("title")
    const description = formData.get("description")
    const recipientUserId = formData.get("recipientUserId")
    const fileUrl = formData.get("fileUrl")

    if (!title || String(title).trim() === "") {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    if (!recipientUserId) {
      return NextResponse.json({ error: "Client selection is required" }, { status: 400 })
    }

    const existingQuotation = await Quotation.findById(quotationId)
    if (!existingQuotation) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 })
    }

    // Verify client exists
    const client = await User.findById(recipientUserId)
    if (!client) {
      return NextResponse.json({ error: "Selected client not found" }, { status: 404 })
    }

    // Use new fileUrl from Cloudinary, or keep existing one if no new file
    const updatedFileUrl = fileUrl || existingQuotation.fileUrl

    const updatedQuotation = await Quotation.findByIdAndUpdate(
      quotationId,
      { title, description, fileUrl: updatedFileUrl, recipientUserId },
      { new: true }
    )

    // Manually populate recipientUserId to avoid schema caching issues
    let quotationData = updatedQuotation.toObject()
    if (quotationData.recipientUserId) {
      const client = await User.findById(quotationData.recipientUserId).select("name email")
      quotationData.recipientUserId = client
    }

    return NextResponse.json({ success: true, data: quotationData })

  } catch (err) {
    console.error("🔥 PUT ERROR:", err)
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectDB()
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await User.findOne({ email: session.user.email })
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { id: quotationId } = params

    const quotation = await Quotation.findByIdAndDelete(quotationId)
    if (!quotation) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Quotation deleted" })

  } catch (err) {
    console.error("🔥 DELETE ERROR:", err)
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )
  }
}
