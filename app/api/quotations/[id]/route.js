// import { NextResponse } from "next/server"
// import Quotation from "@/lib/models/Quotation"
// import User from "@/lib/models/User"
// import { connectToDatabase } from "@/lib/mongodb"
// import { getServerSession } from "next-auth"
// import { authOptions } from "@/lib/auth-options"
// import { v2 as cloudinary } from "cloudinary"

// cloudinary.config({
//   cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
//   secure: true,
// })

// function parseJsonField(value, fallback) {
//   if (value === null || value === undefined || value === "") {
//     return fallback
//   }

//   if (Array.isArray(value) || typeof value === "object") {
//     return value
//   }

//   try {
//     return JSON.parse(String(value))
//   } catch {
//     return fallback
//   }
// }

// function makeSafeFilename(value) {
//   return String(value || "quotation")
//     .trim()
//     .replace(/[^a-zA-Z0-9-_]+/g, "-")
//     .replace(/^-+|-+$/g, "") || "quotation"
// }

// function getCloudinaryDownloadUrl(fileUrl) {
//   if (!fileUrl || !fileUrl.includes("cloudinary.com")) {
//     return fileUrl
//   }

//   if (!fileUrl.includes("/raw/upload/")) {
//     return fileUrl
//   }

//   const [, rawPath] = fileUrl.split("/raw/upload/")
//   if (!rawPath) {
//     return fileUrl
//   }

//   const withoutVersion = rawPath.replace(/^v\d+\//, "")
//   const publicId = decodeURIComponent(withoutVersion)

//   return cloudinary.url(publicId, {
//     resource_type: "raw",
//     type: "upload",
//     sign_url: true,
//     secure: true,
//   })
// }

// async function connectDB() {
//   try {
//     await connectToDatabase()
//   } catch (err) {
//     console.error("DB ERROR:", err)
//     throw err
//   }
// }

// export async function GET(req, { params }) {
//   try {
//     await connectDB()

//     const session = await getServerSession(authOptions)
//     if (!session?.user?.email) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
//     }

//     const user = await User.findOne({ email: session.user.email })
//     if (!user) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
//     }

//     const { id: quotationId } = params
//     const quotation = await Quotation.findById(quotationId)

//     if (!quotation) {
//       return NextResponse.json({ error: "Quotation not found" }, { status: 404 })
//     }

//     const isAdmin = user.role === "admin"
//     const isRecipient = String(quotation.recipientUserId || "") === String(user._id)

//     if (!isAdmin && !isRecipient) {
//       return NextResponse.json({ error: "Forbidden" }, { status: 403 })
//     }

//     if (!quotation.fileUrl) {
//       return NextResponse.json({ error: "Quotation file not available" }, { status: 404 })
//     }

//     const downloadUrl = getCloudinaryDownloadUrl(quotation.fileUrl)
//     return NextResponse.redirect(downloadUrl, 302)
//   } catch (err) {
//     console.error("🔥 GET DOWNLOAD ERROR:", err)
//     return NextResponse.json({ error: err.message || "Failed to download quotation" }, { status: 500 })
//   }
// }

// export async function PUT(req, { params }) {
//   try {
//     await connectDB()
//     const session = await getServerSession(authOptions)
    
//     if (!session?.user?.email) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
//     }

//     const user = await User.findOne({ email: session.user.email })
//     if (!user || user.role !== "admin") {
//       return NextResponse.json({ error: "Admin access required" }, { status: 403 })
//     }

//     const { id: quotationId } = params

//     const formData = await req.formData()
//     const title = formData.get("title")
//     const description = formData.get("description")
//     const recipientUserId = formData.get("recipientUserId")
//     const fileUrl = formData.get("fileUrl")
//     const date = formData.get("date")
//     const organizationName = formData.get("organizationName")
//     const organizationDetails = formData.get("organizationDetails")
//     const projectDuration = formData.get("projectDuration")
//     const requiredDetails = formData.get("requiredDetails")
//     const projectAssetsTechStack = formData.get("projectAssetsTechStack")
//     const termsAndConditions = formData.get("termsAndConditions")
//     const contractDetails = formData.get("contractDetails")
//     const thankYouNote = formData.get("thankYouNote")
//     const subtotal = formData.get("subtotal")
//     const discount = formData.get("discount")
//     const total = formData.get("total")
//     const businessName = formData.get("businessName")
//     const businessLogoUrl = formData.get("businessLogoUrl")
//     const businessEmail = formData.get("businessEmail")
//     const businessPhone = formData.get("businessPhone")
//     const businessWebsite = formData.get("businessWebsite")
//     const businessAddress = formData.get("businessAddress")
//     const businessGstin = formData.get("businessGstin")
//     const whyChooseUs = parseJsonField(formData.get("whyChooseUs"), [])
//     const costBreakdown = parseJsonField(formData.get("costBreakdown"), [])
//     const addOns = parseJsonField(formData.get("addOns"), [])

//     if (!title || String(title).trim() === "") {
//       return NextResponse.json({ error: "Title is required" }, { status: 400 })
//     }

//     if (!recipientUserId) {
//       return NextResponse.json({ error: "Client selection is required" }, { status: 400 })
//     }

//     const existingQuotation = await Quotation.findById(quotationId)
//     if (!existingQuotation) {
//       return NextResponse.json({ error: "Quotation not found" }, { status: 404 })
//     }

//     // Verify client exists
//     const client = await User.findById(recipientUserId)
//     if (!client) {
//       return NextResponse.json({ error: "Selected client not found" }, { status: 404 })
//     }

//     // Use new fileUrl from Cloudinary, or keep existing one if no new file
//     const updatedFileUrl = fileUrl || existingQuotation.fileUrl

//     const updatedQuotation = await Quotation.findByIdAndUpdate(
//       quotationId,
//       {
//         title,
//         description,
//         fileUrl: updatedFileUrl,
//         date: date || "",
//         organizationName: organizationName || "",
//         organizationDetails: organizationDetails || "",
//         projectDuration: projectDuration || "",
//         requiredDetails: requiredDetails || "",
//         projectAssetsTechStack: projectAssetsTechStack || "",
//         termsAndConditions: termsAndConditions || "",
//         contractDetails: contractDetails || "",
//         thankYouNote: thankYouNote || "",
//         subtotal: subtotal || "",
//         discount: discount || "",
//         total: total || "",
//         businessName: businessName || "",
//         businessLogoUrl: businessLogoUrl || "",
//         businessEmail: businessEmail || "",
//         businessPhone: businessPhone || "",
//         businessWebsite: businessWebsite || "",
//         businessAddress: businessAddress || "",
//         businessGstin: businessGstin || "",
//         whyChooseUs,
//         costBreakdown,
//         addOns,
//         recipientUserId,
//       },
//       { new: true }
//     )

//     // Manually populate recipientUserId to avoid schema caching issues
//     let quotationData = updatedQuotation.toObject()
//     if (quotationData.recipientUserId) {
//       const client = await User.findById(quotationData.recipientUserId).select("name email")
//       quotationData.recipientUserId = client
//     }

//     return NextResponse.json({ success: true, data: quotationData })

//   } catch (err) {
//     console.error("🔥 PUT ERROR:", err)
//     return NextResponse.json(
//       { error: err.message },
//       { status: 500 }
//     )
//   }
// }

// export async function DELETE(req, { params }) {
//   try {
//     await connectDB()
//     const session = await getServerSession(authOptions)
    
//     if (!session?.user?.email) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
//     }

//     const user = await User.findOne({ email: session.user.email })
//     if (!user || user.role !== "admin") {
//       return NextResponse.json({ error: "Admin access required" }, { status: 403 })
//     }

//     const { id: quotationId } = params

//     const quotation = await Quotation.findByIdAndDelete(quotationId)
//     if (!quotation) {
//       return NextResponse.json({ error: "Quotation not found" }, { status: 404 })
//     }

//     return NextResponse.json({ success: true, message: "Quotation deleted" })

//   } catch (err) {
//     console.error("🔥 DELETE ERROR:", err)
//     return NextResponse.json(
//       { error: err.message },
//       { status: 500 }
//     )
//   }
// }



// import { NextResponse } from "next/server"
// import Quotation from "@/lib/models/Quotation"
// import User from "@/lib/models/User"
// import { connectToDatabase } from "@/lib/mongodb"
// import { getServerSession } from "next-auth"
// import { authOptions } from "@/lib/auth-options"
// import { v2 as cloudinary } from "cloudinary"

// cloudinary.config({
//   cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
//   secure: true,
// })

// function parseJsonField(value, fallback) {
//   if (value === null || value === undefined || value === "") {
//     return fallback
//   }

//   if (Array.isArray(value) || typeof value === "object") {
//     return value
//   }

//   try {
//     return JSON.parse(String(value))
//   } catch {
//     return fallback
//   }
// }

// async function connectDB() {
//   try {
//     await connectToDatabase()
//   } catch (err) {
//     console.error("DB ERROR:", err)
//     throw err
//   }
// }

// export async function GET(req, { params }) {
//   try {
//     await connectDB()

//     const session = await getServerSession(authOptions)
//     if (!session?.user?.email) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
//     }

//     const user = await User.findOne({ email: session.user.email })
//     if (!user) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
//     }

//     const { id: quotationId } = params
//     const quotation = await Quotation.findById(quotationId)

//     if (!quotation) {
//       return NextResponse.json({ error: "Quotation not found" }, { status: 404 })
//     }

//     const isAdmin = user.role === "admin"
//     const isRecipient = String(quotation.recipientUserId || "") === String(user._id)

//     if (!isAdmin && !isRecipient) {
//       return NextResponse.json({ error: "Forbidden" }, { status: 403 })
//     }

//     if (!quotation.fileUrl) {
//       return NextResponse.json({ error: "Quotation file not available" }, { status: 404 })
//     }

//     // The PDF was uploaded with access_mode: "public" so the secure_url
//     // is directly accessible — just redirect to it. No signing needed.
//     return NextResponse.redirect(quotation.fileUrl, 302)
//   } catch (err) {
//     console.error("🔥 GET DOWNLOAD ERROR:", err)
//     return NextResponse.json({ error: err.message || "Failed to download quotation" }, { status: 500 })
//   }
// }

// export async function PUT(req, { params }) {
//   try {
//     await connectDB()
//     const session = await getServerSession(authOptions)
    
//     if (!session?.user?.email) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
//     }

//     const user = await User.findOne({ email: session.user.email })
//     if (!user || user.role !== "admin") {
//       return NextResponse.json({ error: "Admin access required" }, { status: 403 })
//     }

//     const { id: quotationId } = params

//     const formData = await req.formData()
//     const title = formData.get("title")
//     const description = formData.get("description")
//     const recipientUserId = formData.get("recipientUserId")
//     const fileUrl = formData.get("fileUrl")
//     const date = formData.get("date")
//     const organizationName = formData.get("organizationName")
//     const organizationDetails = formData.get("organizationDetails")
//     const projectDuration = formData.get("projectDuration")
//     const requiredDetails = formData.get("requiredDetails")
//     const projectAssetsTechStack = formData.get("projectAssetsTechStack")
//     const termsAndConditions = formData.get("termsAndConditions")
//     const contractDetails = formData.get("contractDetails")
//     const thankYouNote = formData.get("thankYouNote")
//     const subtotal = formData.get("subtotal")
//     const discount = formData.get("discount")
//     const total = formData.get("total")
//     const businessName = formData.get("businessName")
//     const businessLogoUrl = formData.get("businessLogoUrl")
//     const businessEmail = formData.get("businessEmail")
//     const businessPhone = formData.get("businessPhone")
//     const businessWebsite = formData.get("businessWebsite")
//     const businessAddress = formData.get("businessAddress")
//     const businessGstin = formData.get("businessGstin")
//     const whyChooseUs = parseJsonField(formData.get("whyChooseUs"), [])
//     const costBreakdown = parseJsonField(formData.get("costBreakdown"), [])
//     const addOns = parseJsonField(formData.get("addOns"), [])

//     if (!title || String(title).trim() === "") {
//       return NextResponse.json({ error: "Title is required" }, { status: 400 })
//     }

//     if (!recipientUserId) {
//       return NextResponse.json({ error: "Client selection is required" }, { status: 400 })
//     }

//     const existingQuotation = await Quotation.findById(quotationId)
//     if (!existingQuotation) {
//       return NextResponse.json({ error: "Quotation not found" }, { status: 404 })
//     }

//     // Verify client exists
//     const client = await User.findById(recipientUserId)
//     if (!client) {
//       return NextResponse.json({ error: "Selected client not found" }, { status: 404 })
//     }

//     // Use new fileUrl if provided, otherwise keep the existing one
//     const updatedFileUrl = (fileUrl && String(fileUrl).trim()) ? fileUrl : existingQuotation.fileUrl

//     const updatedQuotation = await Quotation.findByIdAndUpdate(
//       quotationId,
//       {
//         title,
//         description,
//         fileUrl: updatedFileUrl,
//         date: date || "",
//         organizationName: organizationName || "",
//         organizationDetails: organizationDetails || "",
//         projectDuration: projectDuration || "",
//         requiredDetails: requiredDetails || "",
//         projectAssetsTechStack: projectAssetsTechStack || "",
//         termsAndConditions: termsAndConditions || "",
//         contractDetails: contractDetails || "",
//         thankYouNote: thankYouNote || "",
//         subtotal: subtotal || "",
//         discount: discount || "",
//         total: total || "",
//         businessName: businessName || "",
//         businessLogoUrl: businessLogoUrl || "",
//         businessEmail: businessEmail || "",
//         businessPhone: businessPhone || "",
//         businessWebsite: businessWebsite || "",
//         businessAddress: businessAddress || "",
//         businessGstin: businessGstin || "",
//         whyChooseUs,
//         costBreakdown,
//         addOns,
//         recipientUserId,
//       },
//       { new: true }
//     )

//     // Manually populate recipientUserId to avoid schema caching issues
//     let quotationData = updatedQuotation.toObject()
//     if (quotationData.recipientUserId) {
//       const populatedClient = await User.findById(quotationData.recipientUserId).select("name email")
//       quotationData.recipientUserId = populatedClient
//     }

//     return NextResponse.json({ success: true, data: quotationData })

//   } catch (err) {
//     console.error("🔥 PUT ERROR:", err)
//     return NextResponse.json(
//       { error: err.message },
//       { status: 500 }
//     )
//   }
// }

// export async function DELETE(req, { params }) {
//   try {
//     await connectDB()
//     const session = await getServerSession(authOptions)
    
//     if (!session?.user?.email) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
//     }

//     const user = await User.findOne({ email: session.user.email })
//     if (!user || user.role !== "admin") {
//       return NextResponse.json({ error: "Admin access required" }, { status: 403 })
//     }

//     const { id: quotationId } = params

//     const quotation = await Quotation.findByIdAndDelete(quotationId)
//     if (!quotation) {
//       return NextResponse.json({ error: "Quotation not found" }, { status: 404 })
//     }

//     return NextResponse.json({ success: true, message: "Quotation deleted" })

//   } catch (err) {
//     console.error("🔥 DELETE ERROR:", err)
//     return NextResponse.json(
//       { error: err.message },
//       { status: 500 }
//     )
//   }
// }


import { NextResponse } from "next/server"
import Quotation from "@/lib/models/Quotation"
import User from "@/lib/models/User"
import { connectToDatabase } from "@/lib/mongodb"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

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

    // Proxy the PDF bytes through our server instead of redirecting.
    // This fixes two problems:
    // 1. Old "raw" resource_type Cloudinary uploads serve as octet-stream —
    //    by proxying we force the correct Content-Type: application/pdf.
    // 2. We control the Content-Disposition filename shown to the user.
    const cloudinaryRes = await fetch(quotation.fileUrl)
    if (!cloudinaryRes.ok) {
      return NextResponse.json({ error: "Failed to fetch PDF from storage" }, { status: 502 })
    }

    const pdfBuffer = await cloudinaryRes.arrayBuffer()
    const safeTitle = (quotation.title || "quotation")
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "quotation"

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeTitle}.pdf"`,
        "Content-Length": String(pdfBuffer.byteLength),
        "Cache-Control": "private, no-store",
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

    const existingQuotation = await Quotation.findById(quotationId)
    if (!existingQuotation) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 })
    }

    // Verify client exists
    const client = await User.findById(recipientUserId)
    if (!client) {
      return NextResponse.json({ error: "Selected client not found" }, { status: 404 })
    }

    // Use new fileUrl if provided, otherwise keep the existing one
    const updatedFileUrl = (fileUrl && String(fileUrl).trim()) ? fileUrl : existingQuotation.fileUrl

    const updatedQuotation = await Quotation.findByIdAndUpdate(
      quotationId,
      {
        title,
        description,
        fileUrl: updatedFileUrl,
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
      },
      { new: true }
    )

    // Manually populate recipientUserId to avoid schema caching issues
    let quotationData = updatedQuotation.toObject()
    if (quotationData.recipientUserId) {
      const populatedClient = await User.findById(quotationData.recipientUserId).select("name email")
      quotationData.recipientUserId = populatedClient
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