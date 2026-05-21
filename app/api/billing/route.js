import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth-options";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/lib/models/User";
import Billing from "@/lib/models/Billing";
import { computeBillingTotals, parseAmount } from "@/lib/billing";
import notificationService from "@/lib/notifications/notification-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const billingLineSchema = z.object({
  item: z.string().min(1),
  period: z.string().default(""),
  unitPriceLabel: z.string().default(""),
  amount: z.union([z.string(), z.number()]).transform(parseAmount),
});

const billingAdjustmentSchema = z.object({
  label: z.string().default(""),
  description: z.string().default(""),
  amount: z.union([z.string(), z.number()]).transform(parseAmount),
});

function normalizeBillingType(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized;
}

const createBillingSchema = z.object({
  sourceType: z.enum(["template", "uploaded"]).default("template"),
  type: z.preprocess((value) => normalizeBillingType(value), z.enum(["bill", "invoice"])),
  referenceNumber: z.string().min(1),
  documentTitle: z.string().min(1),
  documentSubtitle: z.string().default(""),
  recipientUserId: z.string().min(1),
  recipientName: z.string().min(1),
  recipientCompany: z.string().default(""),
  recipientAddress: z.string().default(""),
  recipientEmail: z.string().default(""),
  issuerName: z.string().min(1),
  issuerEmail: z.string().default(""),
  issuerAddress: z.string().default(""),
  issueDate: z.string().min(1),
  dueDate: z.string().min(1),
  isPaid: z.boolean().default(false),
  strikeDueDate: z.boolean().default(false),
  lineItems: z.array(billingLineSchema).min(1),
  adjustmentRows: z.array(billingAdjustmentSchema).default([]),
  advanceRow: billingAdjustmentSchema.default({ label: "ADVANCE", description: "", amount: 0 }),
  notes: z.array(z.string()).default([]),
  paymentHeading: z.string().default(""),
  paymentDetails: z
    .object({
      upiId: z.string().default(""),
      bankName: z.string().default(""),
      accountName: z.string().default(""),
      upiNumber: z.string().default(""),
    })
    .default({}),
  footerMessage: z.string().default(""),
  supportPhone: z.string().default(""),
  supportEmail: z.string().default(""),
  website: z.string().default(""),
  supportAddress: z.string().default(""),
  fileUrl: z.string().default(""),
  fileName: z.string().default(""),
  fileMimeType: z.string().default(""),
});

const createUploadedBillingSchema = z.object({
  sourceType: z.literal("uploaded"),
  type: z.preprocess((value) => normalizeBillingType(value), z.enum(["bill", "invoice"])),
  referenceNumber: z.string().min(1),
  recipientUserId: z.string().min(1),
  issueDate: z.string().optional(),
  dueDate: z.string().optional(),
  documentTitle: z.string().optional(),
  documentSubtitle: z.string().default(""),
  isPaid: z.boolean().default(false),
  strikeDueDate: z.boolean().default(false),
  fileUrl: z.string().min(1),
  fileName: z.string().default(""),
  fileMimeType: z.string().default(""),
});

function sanitizeBillingBody(body = {}) {
  const rawLineItems = Array.isArray(body.lineItems) ? body.lineItems : [];
  const lineItems = rawLineItems
    .map((row) => ({
      item: String(row?.item ?? "").trim(),
      period: String(row?.period ?? "").trim(),
      unitPriceLabel: String(row?.unitPriceLabel ?? "").trim(),
      amount: parseAmount(row?.amount ?? 0),
    }))
    .filter((row) => row.item || row.period || row.unitPriceLabel || row.amount !== 0)
    .map((row) => ({
      ...row,
      item: row.item || "Item",
    }));

  const rawAdjustmentRows = Array.isArray(body.adjustmentRows) ? body.adjustmentRows : [];
  const adjustmentRows = rawAdjustmentRows
    .map((row) => ({
      label: String(row?.label ?? "").trim(),
      description: String(row?.description ?? "").trim(),
      amount: parseAmount(row?.amount ?? 0),
    }))
    .filter((row) => row.label || row.description || row.amount !== 0);

  return {
    ...body,
    sourceType: body.sourceType === "uploaded" ? "uploaded" : "template",
    type: normalizeBillingType(body.type),
    isPaid: Boolean(body.isPaid),
    strikeDueDate: Boolean(body.strikeDueDate),
    lineItems,
    adjustmentRows,
  };
}

async function loadBilling(query) {
  return Billing.find(query)
    .sort({ createdAt: -1, updatedAt: -1 })
    .populate("recipientUser", "name email role")
    .populate("createdBy", "name email role");
}

function isForbiddenRole(role) {
  return !["admin", "client"].includes(role);
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isForbiddenRole(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectToDatabase();

  let bills;
  if (session.user.role === "admin") {
    bills = await loadBilling({});
  } else {
    // For clients, look up their actual MongoDB user ID
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }
    bills = await loadBilling({ recipientUser: user._id });
  }

  return Response.json({ bills });
}

export async function POST(request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const sanitized = sanitizeBillingBody(body);
  const parsed =
    sanitized.sourceType === "uploaded"
      ? createUploadedBillingSchema.safeParse(sanitized)
      : createBillingSchema.safeParse(sanitized);

  if (!parsed.success) {
    const firstIssue = parsed.error.issues?.[0];
    const errorMessage = firstIssue
      ? `${firstIssue.path.join(".") || "payload"}: ${firstIssue.message}`
      : "Invalid billing payload";

    return Response.json({ error: errorMessage }, { status: 400 });
  }

  await connectToDatabase();

  const recipient = await User.findById(parsed.data.recipientUserId);

  if (!recipient || recipient.role !== "client") {
    return Response.json({ error: "Recipient client not found" }, { status: 404 });
  }

  const totals = computeBillingTotals({
    lineItems: parsed.data.lineItems || [],
    adjustmentRows: parsed.data.adjustmentRows || [],
    advanceAmount: parsed.data.advanceRow?.amount || 0,
  });

  const isUploaded = parsed.data.sourceType === "uploaded";
  const issueDate = parsed.data.issueDate ? new Date(parsed.data.issueDate) : new Date();
  const dueDate = parsed.data.dueDate ? new Date(parsed.data.dueDate) : issueDate;
  const documentTitle = isUploaded
    ? parsed.data.documentTitle || parsed.data.type.toUpperCase()
    : parsed.data.documentTitle;

  const billing = await Billing.create({
    sourceType: parsed.data.sourceType || "template",
    type: parsed.data.type,
    referenceNumber: parsed.data.referenceNumber,
    documentTitle,
    documentSubtitle: parsed.data.documentSubtitle,
    recipientUser: recipient._id,
    recipientName: parsed.data.recipientName || recipient.name || "Client",
    recipientCompany: parsed.data.recipientCompany || "",
    recipientAddress: parsed.data.recipientAddress || "",
    recipientEmail: parsed.data.recipientEmail || recipient.email || "",
    issuerName: parsed.data.issuerName || session.user.name || "Admin",
    issuerEmail: parsed.data.issuerEmail || session.user.email || "",
    issuerAddress: parsed.data.issuerAddress || "",
    issueDate,
    dueDate,
    isPaid: parsed.data.isPaid,
    strikeDueDate: parsed.data.strikeDueDate,
    lineItems: parsed.data.lineItems || [],
    adjustmentRows: parsed.data.adjustmentRows || [],
    advanceRow: parsed.data.advanceRow || { label: "ADVANCE", description: "", amount: 0 },
    subtotal: totals.subtotal,
    adjustmentTotal: totals.adjustmentTotal,
    total: totals.total,
    advanceAmount: totals.advance,
    dueAmount: totals.dueAmount,
    notes: parsed.data.notes || [],
    paymentHeading: parsed.data.paymentHeading || "",
    paymentDetails: parsed.data.paymentDetails || {},
    footerMessage: parsed.data.footerMessage || "",
    supportPhone: parsed.data.supportPhone || "",
    supportEmail: parsed.data.supportEmail || "",
    website: parsed.data.website || "",
    supportAddress: parsed.data.supportAddress || "",
    fileUrl: parsed.data.fileUrl || "",
    fileName: parsed.data.fileName || "",
    fileMimeType: parsed.data.fileMimeType || "",
    createdBy: session.user.id,
  });

  const createdBill = await Billing.findById(billing._id)
    .populate("recipientUser", "name email role")
    .populate("createdBy", "name email role");

  // Notify recipient user and admins about new billing/invoice
  try {
    const recipientId = createdBill.recipientUser?._id?.toString?.();

    if (recipientId) {
      await notificationService.createAndEmitNotification({
        userIds: [recipientId],
        type: "billing",
        title: `New ${createdBill.documentTitle || "billing document"}`,
        message: `${createdBill.documentTitle || "A billing document"} has been issued.`,
        text: `${createdBill.documentTitle || "A billing document"} has been issued.`,
        source: "billing",
        payload: { billId: createdBill._id?.toString?.() || createdBill._id },
      });
    }

    const adminIds = (await User.find({ role: "admin" }).select("_id")).map((user) => user._id?.toString?.() || user._id).filter(Boolean);
    if (adminIds.length) {
      await notificationService.createAndEmitNotification({
        userIds: adminIds,
        type: "billing",
        title: "Billing created",
        message: `${createdBill.documentTitle || "A billing document"} was created for ${createdBill.recipientName || "a client"}.`,
        text: `${createdBill.documentTitle || "A billing document"} was created for ${createdBill.recipientName || "a client"}.`,
        source: "billing",
        payload: { billId: createdBill._id?.toString?.() || createdBill._id },
      });
    }
  } catch (err) {
    // non-fatal: notification failure should not block billing creation
    console.error("Notification emit error (billing):", err?.message || err);
  }

  return Response.json({ bill: createdBill }, { status: 201 });
}