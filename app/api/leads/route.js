import nodemailer from "nodemailer";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth-options";
import { connectToDatabase } from "@/lib/mongodb";
import Lead from "@/lib/models/Lead";
import User from "@/lib/models/User";
import notificationService from "@/lib/notifications/notification-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizePhone(value) {
  if (typeof value !== "string") {
    return value;
  }

  return value.trim().replace(/[()\s-]/g, "");
}

const createLeadSchema = z.object({
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
  source: z.string().trim().max(120).optional().default("manual-admin"),
  status: z.enum(["active", "inactive"]).optional().default("active"),
  nextFollowUpDate: z.string().datetime().optional().nullable(),
});

async function sendLeadEmailToAdmin(leadData) {
  const { EMAIL_HOST, EMAIL_USER, EMAIL_PASS, EMAIL_PORT, CONTACT_EMAIL_TO } = process.env;

  if (!EMAIL_HOST || !EMAIL_USER || !EMAIL_PASS) {
    console.warn("Lead email skipped: missing email environment variables");
    return;
  }

  const recipient = CONTACT_EMAIL_TO || EMAIL_USER;
  const transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: Number(EMAIL_PORT) || 465,
    secure: true,
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
  });

  const servicesHtml = leadData.services.map((item) => `<li>${item}</li>`).join("");
  const servicesText = leadData.services.join(", ");

  await transporter.sendMail({
    from: `"CyberSpace Leads" <${EMAIL_USER}>`,
    to: recipient,
    ...(leadData.email ? { replyTo: leadData.email } : {}),
    subject: `New Lead: ${leadData.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 620px; color:#222;">
        <h2 style="margin-bottom: 8px; color: #0ebac7;">New Lead Submission</h2>
        <p style="margin-top: 0; color: #666;">Source: ${leadData.source}</p>
        <hr style="border: 1px solid #eee; margin: 16px 0;" />
        <p><strong>Name:</strong> ${leadData.name}</p>
        <p><strong>Email:</strong> ${leadData.email || "N/A"}</p>
        <p><strong>Phone:</strong> ${leadData.phone}</p>
        <p><strong>Budget:</strong> ${leadData.budget || "N/A"}</p>
        <p><strong>Services:</strong></p>
        <ul>${servicesHtml}</ul>
        <p><strong>Requirement:</strong></p>
        <blockquote style="margin: 0; padding: 10px 12px; border-left: 4px solid #0ebac7; background: #f8f8f8;">
          ${leadData.requirement ? leadData.requirement.replace(/\n/g, "<br>") : "N/A"}
        </blockquote>
      </div>
    `,
    text: `
New Lead Submission

Source: ${leadData.source}
Name: ${leadData.name}
Email: ${leadData.email || "N/A"}
Phone: ${leadData.phone}
Budget: ${leadData.budget || "N/A"}
Services: ${servicesText}
Requirement: ${leadData.requirement || "N/A"}
    `.trim(),
  });
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "admin") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const leads = await Lead.find({})
      .sort({ createdAt: -1 })
      .populate("createdBy", "name email role")
      .lean();

    return Response.json({ leads }, { status: 200 });
  } catch (error) {
    console.error("GET leads error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const parsed = createLeadSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json({ error: "Invalid lead payload" }, { status: 400 });
    }

    const isAdmin = session?.user?.role === "admin";

    if (parsed.data.source === "manual-admin" && !isAdmin) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const leadPayload = {
      name: parsed.data.name,
      email: parsed.data.email ? parsed.data.email.toLowerCase() : "",
      phone: normalizePhone(parsed.data.phone),
      services: parsed.data.services,
      requirement: parsed.data.requirement,
      budget: parsed.data.budget,
      source: parsed.data.source,
      status: parsed.data.status,
      createdBy: isAdmin ? session.user.id : null,
      nextFollowUpDate: parsed.data.nextFollowUpDate ? new Date(parsed.data.nextFollowUpDate) : null,
    };

    const createdLead = await Lead.create(leadPayload);

    const adminIds = (await User.find({ role: "admin" }).select("_id")).map((user) => user._id?.toString?.() || user._id).filter(Boolean);

    if (adminIds.length) {
      await notificationService.createAndEmitNotification({
        userIds: adminIds,
        type: "lead",
        title: "New lead received",
        message: `${leadPayload.name} submitted a lead for ${leadPayload.services.join(", ")}`,
        text: `${leadPayload.name} submitted a lead for ${leadPayload.services.join(", ")}`,
        source: "lead",
        payload: { leadId: createdLead._id.toString() },
      });
    }

    try {
      await sendLeadEmailToAdmin(leadPayload);
    } catch (mailError) {
      console.error("Lead email error:", mailError);
    }

    return Response.json({ lead: createdLead }, { status: 201 });
  } catch (error) {
    console.error("POST leads error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
