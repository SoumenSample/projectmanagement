import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth-options";
import { connectToDatabase } from "@/lib/mongodb";
import Client from "@/lib/models/Client";
import User from "@/lib/models/User";
import Lead from "@/lib/models/Lead";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizePhone(value) {
  if (typeof value !== "string") {
    return value;
  }

  return value.trim().replace(/[()\s-]/g, "");
}

const createClientSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  phone: z.preprocess(
    normalizePhone,
    z.string().regex(/^\+?[0-9]{10,15}$/, "Phone number must contain 10 to 15 digits and may start with +")
  ),
  age: z.coerce.number().int().min(1).max(120).optional(),
  region: z.string().trim().max(120).optional().default(""),
  services: z.array(z.string().trim().min(1)).min(1),
  requirement: z.string().trim().max(3000).optional().default(""),
  budget: z.string().trim().max(120).optional().default(""),
  source: z.string().trim().max(120).optional().default("manual-admin"),
  validFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  validTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(["active", "inactive"]).optional().default("active"),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "admin") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const clients = await Client.find({})
      .sort({ createdAt: -1 })
      .populate("createdBy", "name email role")
      .populate("convertedFromLead", "name email")
      .populate("convertedBy", "name email")
      .lean();

    // Include client-role users created from User Management that don't have a Client profile yet.
    const clientUsersWithoutProfile = await User.find(
      {
        role: "client",
        $or: [{ clientProfile: null }, { clientProfile: { $exists: false } }],
      },
      {
        name: 1,
        email: 1,
        phone: 1,
        source: 1,
        age: 1,
        region: 1,
        isActive: 1,
        createdAt: 1,
      }
    )
      .sort({ createdAt: -1 })
      .lean();

    const existingClientEmails = new Set(
      clients.map((client) => String(client.email || "").toLowerCase()).filter(Boolean)
    );

    const mappedUserClients = clientUsersWithoutProfile
      .filter((user) => !existingClientEmails.has(String(user.email || "").toLowerCase()))
      .map((user) => ({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        age: typeof user.age === "number" ? user.age : null,
        region: user.region || "",
        services: [],
        budget: "",
        requirement: "",
        validFrom: null,
        validTo: null,
        convertedFromLead: null,
        convertedFromLeadDate: null,
        convertedBy: null,
        source: user.source || "manual-admin",
        status: user.isActive ? "active" : "inactive",
        createdBy: null,
        linkedUser: user._id,
        createdAt: user.createdAt,
      }));

    const mergedClients = [...clients, ...mappedUserClients].sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );

    return Response.json({ clients: mergedClients }, { status: 200 });
  } catch (error) {
    console.error("GET clients error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "admin") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = createClientSchema.parse(body);

    await connectToDatabase();

    // Check if email already exists as client
    const existingClient = await Client.findOne({ email: validated.email });
    if (existingClient) {
      return Response.json({ error: "Client with this email already exists" }, { status: 400 });
    }

    const client = await Client.create({
      ...validated,
      age: typeof validated.age === "number" ? validated.age : null,
      region: validated.region || "",
      phone: normalizePhone(validated.phone),
      validFrom: new Date(validated.validFrom),
      validTo: new Date(validated.validTo),
      source: validated.source || "manual-admin",
      status: validated.status || "active",
      createdBy: session.user.id,
    });

    return Response.json(
      { client, message: "Client created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST client error:", error);

    if (error instanceof z.ZodError) {
      return Response.json({ error: error.errors[0].message }, { status: 400 });
    }

    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "admin") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { clientId, linkedUserId, ...updateData } = body;

    if (!clientId) {
      return Response.json({ error: "Client ID is required" }, { status: 400 });
    }

    await connectToDatabase();

    let client = await Client.findById(clientId);

    const parsedStatus = String(updateData.status || "active").toLowerCase() === "inactive" ? "inactive" : "active";

    if (!client) {
      const user = await User.findById(linkedUserId || clientId);
      if (!user || user.role !== "client") {
        return Response.json({ error: "Client not found" }, { status: 404 });
      }

      const now = new Date();
      const nextMonth = new Date(now);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      const validFrom = updateData.validFrom ? new Date(updateData.validFrom) : now;
      const validTo = updateData.validTo ? new Date(updateData.validTo) : nextMonth;

      const nextAge =
        updateData.age === "" || updateData.age === null || updateData.age === undefined
          ? null
          : Number.isFinite(Number(updateData.age))
          ? Number(updateData.age)
          : null;

      client = await Client.create({
        name: String(updateData.name || user.name || "").trim(),
        email: String(updateData.email || user.email || "").trim().toLowerCase(),
        phone: normalizePhone(String(updateData.phone || user.phone || "0000000000")),
        age: nextAge,
        region: String(updateData.region || user.region || "").trim(),
        services: Array.isArray(updateData.services) ? updateData.services : [],
        budget: String(updateData.budget || "").trim(),
        requirement: String(updateData.requirement || "").trim(),
        validFrom: Number.isNaN(validFrom.getTime()) ? now : validFrom,
        validTo: Number.isNaN(validTo.getTime()) ? nextMonth : validTo,
        finalBudget: String(updateData.finalBudget || "0").trim(),
        projectName: String(updateData.projectName || "").trim(),
        projectDescription: String(updateData.projectDescription || "").trim(),
        source: String(updateData.source || user.source || "manual-admin").trim() || "manual-admin",
        status: parsedStatus,
        linkedUser: user._id,
        createdBy: session.user.id,
      });

      await User.findByIdAndUpdate(user._id, {
        clientProfile: client._id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        age: client.age,
        region: client.region,
        source: client.source,
        isActive: parsedStatus === "active",
      });

      return Response.json(
        { client, message: "Client profile created and updated successfully" },
        { status: 200 }
      );
    }

    // Update allowed fields
    const allowedFields = [
      "name",
      "email",
      "phone",
      "age",
      "region",
      "services",
      "budget",
      "requirement",
      "validFrom",
      "validTo",
      "finalBudget",
      "projectName",
      "projectDescription",
      "source",
      "status",
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (field in updateData) {
        if (field === "validFrom" || field === "validTo") {
          if (updateData[field]) {
            const parsedDate = new Date(updateData[field]);
            if (!Number.isNaN(parsedDate.getTime())) {
              updates[field] = parsedDate;
            }
          }
        } else if (field === "age") {
          if (updateData.age === "" || updateData.age === null || updateData.age === undefined) {
            updates.age = null;
          } else if (Number.isFinite(Number(updateData.age))) {
            updates.age = Number(updateData.age);
          }
        } else if (field === "phone") {
          if (typeof updateData.phone === "string") {
            updates.phone = normalizePhone(updateData.phone);
          }
        } else {
          updates[field] = updateData[field];
        }
      }
    }

    const updated = await Client.findByIdAndUpdate(clientId, updates, { new: true });

    if (updated?.linkedUser) {
      await User.findByIdAndUpdate(updated.linkedUser, {
        ...(typeof updated.name === "string" ? { name: updated.name } : {}),
        ...(typeof updated.email === "string" ? { email: updated.email.toLowerCase() } : {}),
        ...(typeof updated.phone === "string" ? { phone: updated.phone } : {}),
        age: updated.age ?? null,
        region: updated.region || "",
        source: updated.source || "manual-admin",
        isActive: updated.status === "active",
      });
    }

    return Response.json(
      { client: updated, message: "Client updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("PATCH client error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
