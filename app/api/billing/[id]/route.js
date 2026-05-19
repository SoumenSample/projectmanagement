import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth-options";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/lib/models/User";
import Billing from "@/lib/models/Billing";
import { computeBillingTotals } from "@/lib/billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function loadBillingById(id) {
  return Billing.findById(id)
    .populate("recipientUser", "name email role")
    .populate("createdBy", "name email role");
}

function isVisibleToSession(billing, session) {
  if (!billing || !session?.user) return false;

  if (session.user.role === "admin") return true;

  return billing.recipientUser?._id?.toString?.() === session.user.id || billing.recipientUser?.toString?.() === session.user.id;
}

function isEditableRole(role) {
  return role === "admin";
}

export async function GET(_request, { params }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isEditableRole(session.user.role) && session.user.role !== "client") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectToDatabase();

  const billing = await loadBillingById(params.id);

  if (!billing || !isVisibleToSession(billing, session)) {
    return Response.json({ error: "Bill not found" }, { status: 404 });
  }

  return Response.json({ bill: billing });
}

export async function PUT(request, { params }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isEditableRole(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectToDatabase();

  const billing = await Billing.findById(params.id);

  if (!billing) {
    return Response.json({ error: "Bill not found" }, { status: 404 });
  }

  const body = await request.json();
  const lineItems = Array.isArray(body.lineItems) ? body.lineItems : billing.lineItems;
  const adjustmentRows = Array.isArray(body.adjustmentRows) ? body.adjustmentRows : billing.adjustmentRows;
  const advanceRow = body.advanceRow || billing.advanceRow;

  if (body.recipientUserId) {
    const recipient = await User.findById(body.recipientUserId);

    if (recipient && recipient.role === "client") {
      billing.recipientUser = recipient._id;
    }
  }

  const totals = computeBillingTotals({
    lineItems,
    adjustmentRows,
    advanceAmount: advanceRow?.amount ?? 0,
  });

  if (["bill", "invoice"].includes(body.type)) {
    billing.type = body.type;
  }
  if (["template", "uploaded"].includes(body.sourceType)) {
    billing.sourceType = body.sourceType;
  }
  billing.referenceNumber = body.referenceNumber ?? billing.referenceNumber;
  billing.documentTitle = body.documentTitle ?? billing.documentTitle;
  billing.documentSubtitle = body.documentSubtitle ?? billing.documentSubtitle;
  billing.recipientName = body.recipientName ?? billing.recipientName;
  billing.recipientCompany = body.recipientCompany ?? billing.recipientCompany;
  billing.recipientAddress = body.recipientAddress ?? billing.recipientAddress;
  billing.recipientEmail = body.recipientEmail ?? billing.recipientEmail;
  billing.issuerName = body.issuerName ?? billing.issuerName;
  billing.issuerEmail = body.issuerEmail ?? billing.issuerEmail;
  billing.issuerAddress = body.issuerAddress ?? billing.issuerAddress;
  billing.issueDate = body.issueDate ? new Date(body.issueDate) : billing.issueDate;
  billing.dueDate = body.dueDate ? new Date(body.dueDate) : billing.dueDate;
  if (typeof body.isPaid === "boolean") {
    billing.isPaid = body.isPaid;
  }
  if (typeof body.strikeDueDate === "boolean") {
    billing.strikeDueDate = body.strikeDueDate;
  }
  billing.lineItems = lineItems;
  billing.adjustmentRows = adjustmentRows;
  billing.advanceRow = advanceRow;
  billing.subtotal = totals.subtotal;
  billing.adjustmentTotal = totals.adjustmentTotal;
  billing.total = totals.total;
  billing.advanceAmount = totals.advance;
  billing.dueAmount = totals.dueAmount;
  billing.notes = Array.isArray(body.notes) ? body.notes : billing.notes;
  billing.paymentHeading = body.paymentHeading ?? billing.paymentHeading;
  billing.paymentDetails = body.paymentDetails ?? billing.paymentDetails;
  billing.footerMessage = body.footerMessage ?? billing.footerMessage;
  billing.supportPhone = body.supportPhone ?? billing.supportPhone;
  billing.supportEmail = body.supportEmail ?? billing.supportEmail;
  billing.website = body.website ?? billing.website;
  billing.supportAddress = body.supportAddress ?? billing.supportAddress;
  billing.fileUrl = body.fileUrl ?? billing.fileUrl;
  billing.fileName = body.fileName ?? billing.fileName;
  billing.fileMimeType = body.fileMimeType ?? billing.fileMimeType;

  await billing.save();

  const updated = await loadBillingById(billing._id);

  return Response.json({ bill: updated });
}

export async function DELETE(_request, { params }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isEditableRole(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectToDatabase();

  const billing = await Billing.findById(params.id);

  if (!billing) {
    return Response.json({ error: "Bill not found" }, { status: 404 });
  }

  await Billing.findByIdAndDelete(params.id);

  return Response.json({ success: true });
}