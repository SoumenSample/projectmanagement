// import { NextResponse } from "next/server"
// import mongoose from "mongoose"
// import Contract from "../../../lib/models/Contract"

// async function connectDB() {
//   if (mongoose.connection.readyState === 1) return
//   await mongoose.connect(process.env.MONGODB_URI)
// }

// // GET
// export async function GET() {
//   try {
//     await connectDB()
//     const data = await Contract.find().sort({ createdAt: -1 })
//     return NextResponse.json({ contracts: data })
//   } catch (err) {
//     return NextResponse.json({ error: err.message }, { status: 500 })
//   }
// }

// // POST
// export async function POST(req) {
//   try {
//     await connectDB()

//     const body = await req.json()

//     const newContract = await Contract.create({
//       description: body.description,
//       date: body.date,
//       signature: body.signature,
//       reference: body.reference,
//       clientEmail: body.clientEmail,
//     })
//     console.log(newContract);


//     return NextResponse.json({ data: newContract })
//   } catch (err) {
//     return NextResponse.json({ error: err.message }, { status: 500 })
//   }
// }



import { NextResponse } from "next/server"
import mongoose from "mongoose"
import Contract from "../../../lib/models/Contract"
import User from "@/lib/models/User"
import { emitToUsers } from "@/lib/socket/server"
import notificationService from "@/lib/notifications/notification-service"

async function connectDB() {
  if (mongoose.connection.readyState === 1) return
  await mongoose.connect(process.env.MONGODB_URI)
}

// ✅ GET CONTRACTS (FILTER BY EMAIL AND TYPE)
export async function GET(req) {
  try {
    await connectDB()

    const { searchParams } = new URL(req.url)
    const email = searchParams.get("email")
    const recipientType = searchParams.get("recipientType") // "client", "employee", "vendor", or null for all

    let filter = {}

    if (email) {
      // 👉 CLIENT/EMPLOYEE VIEW (filter by their email)
      if (recipientType === "employee") {
        filter.employeeEmail = email.toLowerCase()
      } else if (recipientType === "vendor") {
        filter.vendorEmail = email.toLowerCase()
      } else {
        filter.clientEmail = email.toLowerCase()
      }
    } else if (recipientType) {
      // 👉 ADMIN VIEW - filter by type
      // Handle both new contracts (with recipientType) and old ones (assume client)
      if (recipientType === "client") {
        filter.$or = [
          { recipientType: "client" },
          { recipientType: { $exists: false } }, // Old contracts without recipientType field
          { recipientType: null }
        ]
      } else if (recipientType === "employee") {
        filter.recipientType = "employee"
      } else if (recipientType === "vendor") {
        filter.recipientType = "vendor"
      }
    }
    // else: ADMIN VIEW - return all contracts

    const contracts = await Contract.find(filter).sort({ createdAt: -1 })

    // Attach recipient names for table rendering (client/employee views)
    const recipientEmails = Array.from(
      new Set(
        contracts
          .map((contract) =>
            String(
              contract.recipientType === "employee"
                ? contract.employeeEmail || ""
                : contract.recipientType === "vendor"
                  ? contract.vendorEmail || ""
                : contract.clientEmail || ""
            )
              .trim()
              .toLowerCase()
          )
          .filter(Boolean)
      )
    )

    const users = recipientEmails.length
      ? await User.find({ email: { $in: recipientEmails } }).select("name email").lean()
      : []

    const userNameByEmail = new Map(
      users.map((user) => [String(user.email || "").toLowerCase(), user.name || ""])
    )

    const contractsWithNames = contracts.map((contractDoc) => {
      const contract = contractDoc.toObject()
      const recipientEmail = String(
        contract.recipientType === "employee"
          ? contract.employeeEmail || ""
          : contract.recipientType === "vendor"
            ? contract.vendorEmail || ""
          : contract.clientEmail || ""
      )
        .trim()
        .toLowerCase()

      const recipientName = recipientEmail ? userNameByEmail.get(recipientEmail) || "" : ""

      if (contract.recipientType === "employee") {
        contract.employeeName = recipientName
      } else if (contract.recipientType === "vendor") {
        contract.vendorName = recipientName
      } else {
        contract.clientName = recipientName
      }

      return contract
    })

    return NextResponse.json({ contracts: contractsWithNames })

  } catch (error) {
    console.error("GET CONTRACT ERROR:", error)

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}


// ✅ POST (CREATE CONTRACT)
export async function POST(req) {
  try {
    await connectDB()

    const body = await req.json()

    // Validation
    if (!body.description || !body.reference) {
      return NextResponse.json(
        { error: "Description and reference are required" },
        { status: 400 }
      )
    }

    if (!body.recipientType || !["client", "employee", "vendor"].includes(body.recipientType)) {
      return NextResponse.json(
        { error: "Invalid recipient type" },
        { status: 400 }
      )
    }

    // Determine which email to use based on recipientType
    let contractData = {
      description: body.description,
      reference: body.reference,
      recipientType: body.recipientType,
    }

    // Optional validity dates
    if (body.validFrom) {
      const from = new Date(body.validFrom)
      if (isNaN(from.getTime())) {
        return NextResponse.json({ error: "Invalid validFrom date" }, { status: 400 })
      }
      contractData.validFrom = from
    }

    if (body.validTo) {
      const to = new Date(body.validTo)
      if (isNaN(to.getTime())) {
        return NextResponse.json({ error: "Invalid validTo date" }, { status: 400 })
      }
      contractData.validTo = to
    }

    // If both provided, ensure validTo is on/after validFrom
    if (contractData.validFrom && contractData.validTo) {
      if (contractData.validTo.getTime() < contractData.validFrom.getTime()) {
        return NextResponse.json({ error: "Contract ending date must be on or after starting date" }, { status: 400 })
      }
    }

    if (body.recipientType === "employee") {
      if (!body.employeeEmail) {
        return NextResponse.json(
          { error: "Employee email is required" },
          { status: 400 }
        )
      }
      contractData.employeeEmail = body.employeeEmail.toLowerCase().trim()
    } else if (body.recipientType === "vendor") {
      if (!body.vendorEmail) {
        return NextResponse.json(
          { error: "Vendor email is required" },
          { status: 400 }
        )
      }
      contractData.vendorEmail = body.vendorEmail.toLowerCase().trim()
    } else {
      if (!body.clientEmail) {
        return NextResponse.json(
          { error: "Client email is required" },
          { status: 400 }
        )
      }
      contractData.clientEmail = body.clientEmail.toLowerCase().trim()
    }

    if (body.adminSignature) {
      contractData.adminSignature = body.adminSignature
      contractData.adminSignedDate = body.adminSignedDate
        ? new Date(body.adminSignedDate)
        : new Date()
      contractData.status = "admin-signed"
    }

    if (body.signature) {
      contractData.signature = body.signature
      contractData.signedDate = body.signedDate ? new Date(body.signedDate) : new Date()
      contractData.status = contractData.adminSignature ? "completed" : "pending"
    }

    const newContract = await Contract.create(contractData)

    try {
      const adminIds = (await User.find({ role: "admin" }).select("_id"))
        .map((user) => user._id?.toString?.() || user._id)
        .filter(Boolean)

      const recipientEmail =
        body.recipientType === "employee"
          ? contractData.employeeEmail
          : body.recipientType === "vendor"
            ? contractData.vendorEmail
          : contractData.clientEmail

      const recipientUser = recipientEmail
        ? await User.findOne({ email: recipientEmail }).select("_id role email")
        : null

      const recipientId = recipientUser?._id?.toString?.() || recipientUser?._id

      if (recipientId) {
        await notificationService.createAndEmitNotification({
          userIds: [recipientId],
          type: "contract",
          title: "New Contract Issued",
          message: `A new contract has been issued for ${recipientEmail}.`,
          text: `A new contract has been issued for ${recipientEmail}.`,
          route:
            body.recipientType === "employee"
              ? "/dashboard/employee/contracts"
              : body.recipientType === "vendor"
                ? "/dashboard/vendor/contracts"
                : "/dashboard/client/contracts",
          source: "contract",
          payload: { contractId: newContract._id?.toString?.() || newContract._id },
        })
      }

      if (adminIds.length) {
        await notificationService.createAndEmitNotification({
          userIds: adminIds,
          type: "contract",
          title: "Contract created",
          message: `A new contract was created for ${recipientEmail}.`,
          text: `A new contract was created for ${recipientEmail}.`,
          route: "/dashboard/admin/contracts",
          source: "contract",
          payload: { contractId: newContract._id?.toString?.() || newContract._id },
        })
      }
    } catch (notifyError) {
      console.error("Notification emit error (contract):", notifyError?.message || notifyError)
    }

    return NextResponse.json({ contract: newContract })

  } catch (err) {
    console.error("POST ERROR:", err)
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )
  }
}