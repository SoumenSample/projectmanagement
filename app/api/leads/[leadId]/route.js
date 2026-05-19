import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth-options";
import { connectToDatabase } from "@/lib/mongodb";
import Lead from "@/lib/models/Lead";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizePhone(value) {
  if (typeof value !== "string") {
    return value;
  }

  return value.trim().replace(/[()\s-]/g, "");
}

const updateLeadSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z
    .string()
    .trim()
    .optional()
    .default("")
    .refine((value) => value === "" || z.string().email().safeParse(value).success, {
      message: "Invalid email address",
    }),
  phone: z.preprocess(
    normalizePhone,
    z.string().regex(/^\+?[0-9]{10,15}$/, "Phone number must contain 10 to 15 digits and may start with +")
  ),
  services: z.array(z.string().trim().min(1)).min(1),
  requirement: z.string().trim().max(3000).optional().default(""),
  budget: z.string().trim().max(120).optional().default(""),
  status: z.enum(["active", "inactive"]).optional(),
  nextFollowUpDate: z.string().datetime().optional().nullable(),
});

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "admin") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { leadId } = params;
    const body = await request.json();
    const validated = updateLeadSchema.safeParse(body);

    if (!validated.success) {
      return Response.json({ error: "Invalid lead payload" }, { status: 400 });
    }

    await connectToDatabase();

    const updated = await Lead.findByIdAndUpdate(
      leadId,
      {
        name: validated.data.name,
        email: validated.data.email ? validated.data.email.toLowerCase() : "",
        phone: normalizePhone(validated.data.phone),
        services: validated.data.services,
        requirement: validated.data.requirement,
        budget: validated.data.budget,
        ...(validated.data.status ? { status: validated.data.status } : {}),
        ...(validated.data.nextFollowUpDate ? { nextFollowUpDate: new Date(validated.data.nextFollowUpDate) } : {}),
      },
      { new: true }
    );

    if (!updated) {
      return Response.json({ error: "Lead not found" }, { status: 404 });
    }

    return Response.json({ lead: updated }, { status: 200 });
  } catch (error) {
    console.error("PATCH lead error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "admin") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { leadId } = params;

    await connectToDatabase();

    const lead = await Lead.findById(leadId);

    if (!lead) {
      return Response.json({ error: "Lead not found" }, { status: 404 });
    }

    if (lead.convertedToClient) {
      return Response.json({ error: "Converted leads cannot be deleted" }, { status: 400 });
    }

    await Lead.findByIdAndDelete(leadId);

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("DELETE lead error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
