
import { NextResponse } from "next/server"
import mongoose from "mongoose"
import Quotation from "../../../lib/models/Quotation"
import User from "@/lib/models/User"
import { connectToDatabase } from "@/lib/mongodb"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import notificationService from "@/lib/notifications/notification-service"

function parseJsonField(value, fallback) {
  if (value === null || value === undefined || value === "") {
    return fallback
  }

  if (Array.isArray(value) || typeof value === "object") {
    return value
  }

  try {
    return JSON.parse(String(value))
  } catch {
    return fallback
  }
}

async function connectDB() {
  try {
    await connectToDatabase()
  } catch (err) {
    console.error("DB ERROR:", err)
    throw err
  }
}

export async function GET(req) {
  try {
    await connectDB()
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Admins see all quotations, clients see only assigned to them
    const query = user.role === "admin" ? {} : { recipientUserId: user._id }
    let quotations = await Quotation.find(query).sort({ createdAt: -1 })
    
    // Manually populate recipientUserId to avoid schema caching issues
    quotations = await Promise.all(
      quotations.map(async (q) => {
        const qObj = q.toObject()
        if (q.recipientUserId) {
          const client = await User.findById(q.recipientUserId).select("name email")
          qObj.recipientUserId = client
        }
        return qObj
      })
    )

    return NextResponse.json({ quotations })

  } catch (error) {
    console.error("🔥 GET ERROR:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(req) {
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

    const formData = await req.formData()
    const title = formData.get("title")
    const description = formData.get("description")
    const recipientUserId = formData.get("recipientUserId")
    const fileUrl = formData.get("fileUrl")
    const date = formData.get("date")
    const organizationName = formData.get("organizationName")
    const organizationDetails = formData.get("organizationDetails")
    const projectDuration = formData.get("projectDuration")
    const requiredDetails = formData.get("requiredDetails")
    const projectAssetsTechStack = formData.get("projectAssetsTechStack")
    const termsAndConditions = formData.get("termsAndConditions")
    const contractDetails = formData.get("contractDetails")
    const thankYouNote = formData.get("thankYouNote")
    const subtotal = formData.get("subtotal")
    const discount = formData.get("discount")
    const total = formData.get("total")
    const businessName = formData.get("businessName")
    const businessLogoUrl = formData.get("businessLogoUrl")
    const businessEmail = formData.get("businessEmail")
    const businessPhone = formData.get("businessPhone")
    const businessWebsite = formData.get("businessWebsite")
    const businessAddress = formData.get("businessAddress")
    const businessGstin = formData.get("businessGstin")
    const whyChooseUs = parseJsonField(formData.get("whyChooseUs"), [])
    const costBreakdown = parseJsonField(formData.get("costBreakdown"), [])
    const addOns = parseJsonField(formData.get("addOns"), [])

    if (!title || String(title).trim() === "") {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    if (!recipientUserId) {
      return NextResponse.json({ error: "Client selection is required" }, { status: 400 })
    }

    // Verify client exists
    const client = await User.findById(recipientUserId)
    if (!client) {
      return NextResponse.json({ error: "Selected client not found" }, { status: 404 })
    }

    const newQuotation = await Quotation.create({
      title,
      description,
      fileUrl: fileUrl || "",
      date: date || "",
      organizationName: organizationName || "",
      organizationDetails: organizationDetails || "",
      projectDuration: projectDuration || "",
      requiredDetails: requiredDetails || "",
      projectAssetsTechStack: projectAssetsTechStack || "",
      termsAndConditions: termsAndConditions || "",
      contractDetails: contractDetails || "",
      thankYouNote: thankYouNote || "",
      subtotal: subtotal || "",
      discount: discount || "",
      total: total || "",
      businessName: businessName || "",
      businessLogoUrl: businessLogoUrl || "",
      businessEmail: businessEmail || "",
      businessPhone: businessPhone || "",
      businessWebsite: businessWebsite || "",
      businessAddress: businessAddress || "",
      businessGstin: businessGstin || "",
      whyChooseUs,
      costBreakdown,
      addOns,
      recipientUserId,
    })

    // Notify the assigned client
    await notificationService.createAndEmitNotification({
      userIds: [recipientUserId.toString()],
      type: "quotation",
      title: "New Quotation",
      message: `You have been sent a new quotation: "${title || 'Untitled'}"`,
      text: `You have been sent a new quotation: "${title || 'Untitled'}"`,
      source: "quotation",
    })

    // Manually populate recipientUserId to avoid schema caching issues
    let quotationData = newQuotation.toObject()
    if (quotationData.recipientUserId) {
      const client = await User.findById(quotationData.recipientUserId).select("name email")
      quotationData.recipientUserId = client
    }

    return NextResponse.json({ success: true, data: quotationData })

  } catch (err) {
    console.error("🔥 POST ERROR:", err)
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )
  }
}
