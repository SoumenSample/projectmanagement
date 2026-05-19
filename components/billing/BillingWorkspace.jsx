"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import { BillingDocument } from "./BillingDocument";
import { computeBillingTotals, createBillingDraft, formatDateInput } from "@/lib/billing";
import { Download, Image, X, Edit2, FileText } from "lucide-react";

function normalizeBillingType(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized === "bill" || normalized === "invoice" ? normalized : "invoice";
}


function hydrateFormFromRecord(record) {
  const normalizedType = normalizeBillingType(record.type);
  const defaultPaid = normalizedType === "bill";

  return {
    type: normalizedType,
    recipientUserId: record.recipientUser?._id || record.recipientUser || "",
    recipientName: record.recipientName || "",
    recipientCompany: record.recipientCompany || "",
    recipientAddress: record.recipientAddress || "",
    recipientEmail: record.recipientEmail || "",
    issuerName: record.issuerName || "",
    issuerEmail: record.issuerEmail || "",
    issuerAddress: record.issuerAddress || "",
    referenceNumber: record.referenceNumber || "",
    issueDate: formatDateInput(record.issueDate),
    dueDate: formatDateInput(record.dueDate),
    isPaid: typeof record.isPaid === "boolean" ? record.isPaid : defaultPaid,
    strikeDueDate: typeof record.strikeDueDate === "boolean" ? record.strikeDueDate : defaultPaid,
    documentTitle: record.documentTitle || "INVOICE",
    documentSubtitle: record.documentSubtitle || "",
    lineItems: (record.lineItems || []).map((item) => ({
      item: item.item || "",
      period: item.period || "",
      unitPriceLabel: item.unitPriceLabel || "",
      amount: Number(item.amount || 0),
    })),
    adjustmentRows: (record.adjustmentRows || []).map((item) => ({
      label: item.label || "",
      description: item.description || "",
      amount: Number(item.amount || 0),
    })),
    advanceRow: {
      label: record.advanceRow?.label || "ADVANCE",
      description: record.advanceRow?.description || "",
      amount: Number(record.advanceRow?.amount || 0),
    },
    notes: (record.notes && record.notes.length > 0) ? record.notes : [""],
    paymentHeading: record.paymentHeading || "",
    paymentDetails: {
      upiId: record.paymentDetails?.upiId || "",
      bankName: record.paymentDetails?.bankName || "",
      accountName: record.paymentDetails?.accountName || "",
      upiNumber: record.paymentDetails?.upiNumber || "",
    },
    footerMessage: record.footerMessage || "",
    supportPhone: record.supportPhone || "",
    supportEmail: record.supportEmail || "",
    website: record.website || "",
    supportAddress: record.supportAddress || "",
  };
}

function buildPayload(form) {
  return {
    ...form,
    type: normalizeBillingType(form.type),
    isPaid: Boolean(form.isPaid),
    strikeDueDate: Boolean(form.strikeDueDate),
    lineItems: form.lineItems.map((item) => ({
      ...item,
      amount: Number(item.amount || 0),
    })),
    adjustmentRows: form.adjustmentRows.map((item) => ({
      ...item,
      amount: Number(item.amount || 0),
    })),
    advanceRow: {
      ...form.advanceRow,
      amount: Number(form.advanceRow?.amount || 0),
    },
  };
}

function emptyLineItem() {
  return {
    item: "",
    period: "",
    unitPriceLabel: "",
    amount: 0,
  };
}

function emptyAdjustmentRow() {
  return {
    label: "ADD-ON",
    description: "",
    amount: 0,
  };
}

function createUploadDraft() {
  return {
    type: "invoice",
    recipientUserId: "",
    referenceNumber: "",
  };
}

function isImageMimeType(value) {
  return String(value || "").toLowerCase().startsWith("image/");
}

function isPdfMimeType(value) {
  return String(value || "").toLowerCase().includes("pdf");
}

function isUploadedRecord(record) {
  return Boolean(record?.fileUrl);
}

async function readJsonSafe(response) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

export default function BillingWorkspace({ mode = "client" }) {
  const canManage = mode === "admin";
  const defaultTemplate = canManage ? "invoice" : "bill";

  const [bills, setBills] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportingImage, setExportingImage] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState(() => createBillingDraft(defaultTemplate));
  const [uploadForm, setUploadForm] = useState(() => createUploadDraft());
  const [uploadFile, setUploadFile] = useState(null);
  const printableRef = useRef(null);

  // Default to template mode for admin so they see the form editor first
  const [adminMode, setAdminMode] = useState(canManage ? "template" : "upload");
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const selectedBill = useMemo(() => bills.find((bill) => bill._id === selectedId) || null, [bills, selectedId]);
  const livePreview = useMemo(() => {
    const recipient = clients.find((client) => client._id === form.recipientUserId);
    const totals = computeBillingTotals({
      lineItems: form.lineItems,
      adjustmentRows: form.adjustmentRows,
      advanceAmount: form.advanceRow?.amount,
    });

    return {
      ...form,
      type: form.type || (canManage ? "invoice" : "bill"),
      recipientName: form.recipientName || recipient?.name || "",
      recipientEmail: form.recipientEmail || recipient?.email || "",
      subtotal: totals.subtotal,
      adjustmentTotal: totals.adjustmentTotal,
      total: totals.total,
      advanceAmount: totals.advance,
      dueAmount: totals.dueAmount,
    };
  }, [clients, form, canManage]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!canManage || !form.recipientUserId) return;

    const client = clients.find((item) => item._id === form.recipientUserId);
    if (!client) return;

    setForm((current) => ({
      ...current,
      recipientName: current.recipientName || client.name || "",
      recipientEmail: current.recipientEmail || client.email || "",
    }));
  }, [canManage, clients, form.recipientUserId]);

  useEffect(() => {
    if (!canManage || !uploadForm.recipientUserId) return;

    const client = clients.find((item) => item._id === uploadForm.recipientUserId);
    if (!client) return;

    setUploadForm((current) => ({
      ...current,
      recipientUserId: client._id,
    }));
  }, [canManage, clients, uploadForm.recipientUserId]);

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [billingResponse, clientsResponse] = await Promise.all([
        fetch("/api/billing", { cache: "no-store", credentials: "include" }),
        canManage ? fetch("/api/users/list", { cache: "no-store", credentials: "include" }) : Promise.resolve(null),
      ]);

      const billingData = await billingResponse.json();
      if (!billingResponse.ok) {
        throw new Error(billingData.error || "Failed to load bills");
      }

      setBills(billingData.bills || []);
      setSelectedId((billingData.bills || [])[0]?._id || "");

      if (clientsResponse) {
        const clientsData = await clientsResponse.json();
        if (!clientsResponse.ok) {
          throw new Error(clientsData.error || "Failed to load clients");
        }

        setClients((clientsData.users || []).filter((user) => user.role === "client"));
      }

      if (canManage) {
        setForm((current) => ({
          ...createBillingDraft(defaultTemplate),
          recipientUserId: current.recipientUserId,
          recipientName: current.recipientName,
          recipientCompany: current.recipientCompany,
          recipientAddress: current.recipientAddress,
          recipientEmail: current.recipientEmail,
          issuerName: current.issuerName || createBillingDraft(defaultTemplate).issuerName,
          issuerEmail: current.issuerEmail || createBillingDraft(defaultTemplate).issuerEmail,
          issuerAddress: current.issuerAddress || createBillingDraft(defaultTemplate).issuerAddress,
        }));
      }
    } catch (err) {
      setError(err.message || "Failed to load billing workspace");
    } finally {
      setLoading(false);
    }
  }

  function resetTemplate(nextType) {
    const nextDraft = createBillingDraft(nextType);

    setEditingId("");
    setForm((current) => ({
      ...nextDraft,
      recipientUserId: current.recipientUserId,
      recipientName: current.recipientName,
      recipientCompany: current.recipientCompany,
      recipientAddress: current.recipientAddress,
      recipientEmail: current.recipientEmail,
      issuerName: current.issuerName || nextDraft.issuerName,
      issuerEmail: current.issuerEmail || nextDraft.issuerEmail,
      issuerAddress: current.issuerAddress || nextDraft.issuerAddress,
    }));
  }

  function updateField(path, value) {
    setForm((current) => {
      const next = structuredClone(current);
      const keys = path.split(".");
      let cursor = next;

      for (let index = 0; index < keys.length - 1; index += 1) {
        cursor = cursor[keys[index]];
      }

      cursor[keys[keys.length - 1]] = value;
      return next;
    });
  }

  function updateLineItem(index, field, value) {
    setForm((current) => {
      const lineItems = [...current.lineItems];
      lineItems[index] = { ...lineItems[index], [field]: value };
      return { ...current, lineItems };
    });
  }

  function addLineItem() {
    setForm((current) => ({
      ...current,
      lineItems: [...current.lineItems, emptyLineItem()],
    }));
  }

  function removeLineItem(index) {
    setForm((current) => {
      if (current.lineItems.length <= 1) return current;
      return {
        ...current,
        lineItems: current.lineItems.filter((_, itemIndex) => itemIndex !== index),
      };
    });
  }

  function updateAdjustmentRow(index, field, value) {
    setForm((current) => {
      const adjustmentRows = [...current.adjustmentRows];
      adjustmentRows[index] = { ...adjustmentRows[index], [field]: value };
      return { ...current, adjustmentRows };
    });
  }

  function addAdjustmentRow() {
    setForm((current) => ({
      ...current,
      adjustmentRows: [...current.adjustmentRows, emptyAdjustmentRow()],
    }));
  }

  function removeAdjustmentRow(index) {
    setForm((current) => {
      if (current.adjustmentRows.length <= 1) return current;
      return {
        ...current,
        adjustmentRows: current.adjustmentRows.filter((_, rowIndex) => rowIndex !== index),
      };
    });
  }

  function updateNotes(index, value) {
    setForm((current) => {
      const notes = [...current.notes];
      notes[index] = value;
      return { ...current, notes };
    });
  }

  function addNote() {
    setForm((current) => ({
      ...current,
      notes: [...current.notes, ""],
    }));
  }

  function removeNote(index) {
    setForm((current) => ({
      ...current,
      notes: current.notes.filter((_, i) => i !== index),
    }));
  }

  function handleRecipientChange(clientId) {
    const client = clients.find((item) => item._id === clientId);

    setForm((current) => ({
      ...current,
      recipientUserId: clientId,
      recipientName: client?.name || current.recipientName,
      recipientEmail: client?.email || current.recipientEmail,
    }));
  }

  function updateUploadField(key, value) {
    setUploadForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleUploadAssignSubmit(event) {
    event.preventDefault();

    if (!uploadFile) {
      setError("Choose a file before assigning.");
      return;
    }

    if (!uploadForm.recipientUserId) {
      setError("Select a client before assigning.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const fileData = new FormData();
      fileData.append("file", uploadFile);

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: fileData,
        credentials: "include",
      });

      const uploadResult = await readJsonSafe(uploadResponse);
      if (!uploadResponse.ok) {
        throw new Error(uploadResult.error || "Failed to upload file");
      }

      const client = clients.find((item) => item._id === uploadForm.recipientUserId);

      const payload = {
        sourceType: "uploaded",
        type: normalizeBillingType(uploadForm.type),
        referenceNumber: uploadForm.referenceNumber,
        recipientUserId: uploadForm.recipientUserId,
        documentTitle: uploadFile.name?.replace(/\.[^.]+$/, "") || "Uploaded Document",
        fileUrl: uploadResult.url,
        fileName: uploadFile.name,
        fileMimeType: uploadFile.type,
        recipientName: client?.name || "",
        recipientEmail: client?.email || "",
      };

      const response = await fetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      const data = await readJsonSafe(response);
      if (!response.ok) {
        throw new Error(data.error || "Failed to assign uploaded file");
      }

      const savedBill = data.bill;
      setBills((current) => [savedBill, ...current.filter((bill) => bill._id !== savedBill._id)]);
      setSelectedId(savedBill._id);
      setUploadFile(null);
      setUploadForm((current) => ({
        ...createUploadDraft(),
        type: current.type,
      }));
      setNotice("Uploaded file assigned successfully.");
    } catch (err) {
      setError(err.message || "Failed to assign uploaded file");
    } finally {
      setSaving(false);
    }
  }

  function loadBillIntoForm(bill) {
    if (isUploadedRecord(bill)) {
      setNotice("This is an uploaded file record. Use preview/download instead of template editor.");
      setSelectedId(bill._id);
      return;
    }

    setEditingId(bill._id);
    setForm(hydrateFormFromRecord(bill));
    setSelectedId(bill._id);
    setNotice(`Loaded ${bill.referenceNumber} into the editor.`);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const payload = buildPayload(form);

      if (!payload.recipientUserId) {
        throw new Error("Select a client before saving the document.");
      }

      const response = await fetch(editingId ? `/api/billing/${editingId}` : "/api/billing", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save bill");
      }

      const savedBill = data.bill;
      setBills((current) => [savedBill, ...current.filter((bill) => bill._id !== savedBill._id)]);
      setSelectedId(savedBill._id);
      setEditingId("");
      setNotice(editingId ? "Bill updated successfully." : "Bill created successfully.");

      if (!editingId) {
        setForm((current) => ({
          ...createBillingDraft(current.type || defaultTemplate),
          issuerName: current.issuerName,
          issuerEmail: current.issuerEmail,
          issuerAddress: current.issuerAddress,
          recipientUserId: current.recipientUserId,
          recipientName: current.recipientName,
          recipientCompany: current.recipientCompany,
          recipientAddress: current.recipientAddress,
          recipientEmail: current.recipientEmail,
        }));
      }
    } catch (err) {
      setError(err.message || "Failed to save bill");
    } finally {
      setSaving(false);
    }
  }

  async function deleteBill(billId) {
    const bill = bills.find((item) => item._id === billId);
    if (!bill) return;

    if (!window.confirm(`Delete ${bill.referenceNumber}?`)) {
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch(`/api/billing/${billId}`, { method: "DELETE", credentials: "include" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete bill");
      }

      setBills((current) => current.filter((item) => item._id !== billId));
      setSelectedId((current) => (current === billId ? "" : current));
      setNotice("Bill deleted successfully.");
    } catch (err) {
      setError(err.message || "Failed to delete bill");
    } finally {
      setSaving(false);
    }
  }

  async function downloadPreviewAsPdf() {
    const sourceNode = printableRef.current;

    if (!sourceNode) {
      setError("Nothing to export right now.");
      return;
    }

    setError("");
    setNotice("");
    setExporting(true);

    try {
      const imageData = await toPng(sourceNode, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#ffffff",
      });

      const sourceWidth = sourceNode.scrollWidth || sourceNode.clientWidth || 1024;
      const sourceHeight = sourceNode.scrollHeight || sourceNode.clientHeight || 1448;

      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const contentWidth = pageWidth - margin * 2;
      const contentHeight = (sourceHeight * contentWidth) / sourceWidth;
      const pageDrawableHeight = pageHeight - margin * 2;

      if (!Number.isFinite(contentHeight) || contentHeight <= 0) {
        throw new Error("Invalid document size for PDF export.");
      }

      let heightLeft = contentHeight;
      let yOffset = margin;

      pdf.addImage(imageData, "PNG", margin, yOffset, contentWidth, contentHeight, undefined, "FAST");
      heightLeft -= pageDrawableHeight;

      while (heightLeft > 0) {
        pdf.addPage();
        yOffset = margin - (contentHeight - heightLeft);
        pdf.addImage(imageData, "PNG", margin, yOffset, contentWidth, contentHeight, undefined, "FAST");
        heightLeft -= pageDrawableHeight;
      }

      const fileReference = (canManage ? templatePreview?.referenceNumber : selectedBill?.referenceNumber) || "billing-document";
      const safeFileReference = String(fileReference)
        .trim()
        .replace(/[^a-zA-Z0-9-_]+/g, "-")
        .replace(/^-+|-+$/g, "");

      const filename = `${safeFileReference || "billing-document"}.pdf`;
      const blob = pdf.output("blob");
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
      setNotice("PDF downloaded successfully.");
    } catch (err) {
      const fallbackReference = (canManage ? templatePreview?.referenceNumber : selectedBill?.referenceNumber) || "billing-document";
      const safeFallbackReference = String(fallbackReference)
        .trim()
        .replace(/[^a-zA-Z0-9-_]+/g, "-")
        .replace(/^-+|-+$/g, "");

      try {
        const pngData = await toPng(sourceNode, {
          pixelRatio: 2,
          cacheBust: true,
          backgroundColor: "#ffffff",
        });

        const anchor = document.createElement("a");
        anchor.href = pngData;
        anchor.download = `${safeFallbackReference || "billing-document"}.png`;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);

        setNotice("PDF failed, downloaded PNG instead.");
      } catch (fallbackError) {
        setError(fallbackError?.message || err?.message || "Failed to generate file. Please try again.");
      }
    } finally {
      setExporting(false);
    }
  }

  async function downloadPreviewAsImage() {
    const sourceNode = printableRef.current;

    if (!sourceNode) {
      setError("Nothing to export right now.");
      return;
    }

    setError("");
    setNotice("");
    setExportingImage(true);

    try {
      const imageData = await toPng(sourceNode, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#ffffff",
      });

      const fileReference = (canManage ? templatePreview?.referenceNumber : selectedBill?.referenceNumber) || "billing-document";
      const safeFileReference = String(fileReference)
        .trim()
        .replace(/[^a-zA-Z0-9-_]+/g, "-")
        .replace(/^-+|-+$/g, "");

      const anchor = document.createElement("a");
      anchor.href = imageData;
      anchor.download = `${safeFileReference || "billing-document"}.png`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);

      setNotice("PNG downloaded successfully.");
    } catch (err) {
      setError(err?.message || "Failed to generate image. Please try again.");
    } finally {
      setExportingImage(false);
    }
  }

  function downloadUploadedFile(record) {
    if (!record?.fileUrl) {
      setError("No uploaded file found for this record.");
      return;
    }

    const fallbackReference = record.referenceNumber || "billing-document";
    const safeFallbackReference = String(fallbackReference)
      .trim()
      .replace(/[^a-zA-Z0-9-_]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const extension = isPdfMimeType(record.fileMimeType)
      ? "pdf"
      : isImageMimeType(record.fileMimeType)
        ? "png"
        : "file";

    fetch(record.fileUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Unable to download the uploaded file.");
        }

        return response.blob();
      })
      .then((blob) => {
        const objectUrl = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = objectUrl;
        anchor.download = record.fileName || `${safeFallbackReference || "billing-document"}.${extension}`;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(objectUrl);
      })
      .catch(() => {
        window.open(record.fileUrl, "_blank", "noopener,noreferrer");
      });
  }

  function viewUploadedFile(record) {
    if (!record?.fileUrl) {
      setError("No uploaded file found for this record.");
      return;
    }

    window.open(record.fileUrl, "_blank", "noopener,noreferrer");
  }

  const templatePreview = livePreview;
  const previewBill = canManage && adminMode === "upload" ? selectedBill : { ...templatePreview, type: templatePreview.type || "invoice" };
  const isUploadedPreview = previewBill?.sourceType === "uploaded" && Boolean(previewBill?.fileUrl);
  const uploadedBills = useMemo(() => bills.filter((bill) => isUploadedRecord(bill)), [bills]);
  const templateBills = useMemo(() => bills.filter((bill) => !isUploadedRecord(bill)), [bills]);

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_400px]">
        {/* LEFT COLUMN: FORM */}
        <div className="space-y-4">
        {canManage ? (
          <Card>
            <CardHeader>
              <CardTitle>Billing Studio</CardTitle>
              <CardDescription>Create a bill/invoice template or upload an existing file and assign it to a client.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-5 flex flex-wrap gap-2">
                <Button type="button" variant={adminMode === "template" ? "default" : "outline"} onClick={() => setAdminMode("template")}>
                  Create Template
                </Button>
                {/* <Button type="button" variant={adminMode === "upload" ? "default" : "outline"} onClick={() => setAdminMode("upload")}>
                  Upload & Assign
                </Button> */}
              </div>

              {adminMode === "template" ? (
                <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-3 md:grid-cols-3">
                  <TemplatePicker value={form.type} onChange={resetTemplate} />
                  <Field label="Reference Number" className="bg-transparent">
                    <Input value={form.referenceNumber} onChange={(event) => updateField("referenceNumber", event.target.value)} required />
                  </Field>
                  <Field label="Recipient Client">
                    <select
                      value={form.recipientUserId}
                      onChange={(event) => handleRecipientChange(event.target.value)}
                      className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40"
                      required
                    >
                      <option value="" className="bg-background text-foreground dark:bg-background dark:text-foreground">
                        Select client
                      </option>
                      {clients.map((client) => (
                        <option key={client._id} value={client._id} className="bg-background text-foreground dark:bg-background dark:text-foreground">
                          {client.name} ({client.email})
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Document Title">
                    <Input value={form.documentTitle} onChange={(event) => updateField("documentTitle", event.target.value)} required />
                  </Field>
                  <Field label="Document Subtitle">
                    <Input value={form.documentSubtitle} onChange={(event) => updateField("documentSubtitle", event.target.value)} />
                  </Field>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Issue Date">
                    <Input type="date" value={form.issueDate} onChange={(event) => updateField("issueDate", event.target.value)} required />
                  </Field>
                  <Field label="Due Date">
                    <Input type="date" value={form.dueDate} onChange={(event) => updateField("dueDate", event.target.value)} required />
                  </Field>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <label className="flex items-center gap-2 text-sm text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={Boolean(form.isPaid)}
                      onChange={(event) => updateField("isPaid", event.target.checked)}
                    />
                    Mark as paid (show paid stamp and signature)
                  </label>
                  <label className="flex items-center gap-2 text-sm text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={Boolean(form.strikeDueDate)}
                      onChange={(event) => updateField("strikeDueDate", event.target.checked)}
                    />
                    Strike due date in header
                  </label>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Recipient Name">
                    <Input value={form.recipientName} onChange={(event) => updateField("recipientName", event.target.value)} required />
                  </Field>
                  <Field label="Recipient Email">
                    <Input value={form.recipientEmail} onChange={(event) => updateField("recipientEmail", event.target.value)} />
                  </Field>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Recipient Company">
                    <Input value={form.recipientCompany} onChange={(event) => updateField("recipientCompany", event.target.value)} />
                  </Field>
                  <Field label="Issuer Name">
                    <Input value={form.issuerName} onChange={(event) => updateField("issuerName", event.target.value)} required />
                  </Field>
                </div>

                <Field label="Recipient Address">
                  <textarea
                    value={form.recipientAddress}
                    onChange={(event) => updateField("recipientAddress", event.target.value)}
                    rows={3}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition focus:ring-2 focus:ring-ring/50 dark:border-white/15 dark:bg-background dark:text-foreground"
                  />
                </Field>

                <Field label="Issuer Details">
                  <textarea
                    value={form.issuerAddress}
                    onChange={(event) => updateField("issuerAddress", event.target.value)}
                    rows={3}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition focus:ring-2 focus:ring-ring/50 dark:border-white/15 dark:bg-background dark:text-foreground"
                  />
                </Field>

                <div className="flex items-center justify-between gap-3 font-semibold text-xl">
                  <label className="mb-2 p-2 text-xl font-semibold text-foreground">Line Items</label>
                  <Button type="button" variant="outline" onClick={addLineItem}>
                    Add Row
                  </Button>
                </div>
                <div className="space-y-3 rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3">
                  {form.lineItems.map((item, index) => (
                    <div key={`line-${index}`} className="grid gap-3 md:grid-cols-[1.6fr_0.9fr_0.9fr_0.7fr_auto]">
                      <Input placeholder={`Item ${index + 1}`} value={item.item} onChange={(event) => updateLineItem(index, "item", event.target.value)} />
                      <Input placeholder="Period" value={item.period} onChange={(event) => updateLineItem(index, "period", event.target.value)} />
                      <Input placeholder="Unit Price Label" value={item.unitPriceLabel} onChange={(event) => updateLineItem(index, "unitPriceLabel", event.target.value)} />
                      <Input type="number" min="0" step="1" placeholder="Amount" value={item.amount} onChange={(event) => updateLineItem(index, "amount", Number(event.target.value || 0))} />
                      <Button type="button" variant="destructive" onClick={() => removeLineItem(index)} disabled={form.lineItems.length <= 1}>
                        Remove
                      </Button>
                    </div>
                  ))}
                </div> 

                <div className="flex items-center justify-between gap-3">
                  <label className="mb-2 p-2 text-foreground">Adjustment Rows</label>
                  <Button type="button" variant="outline" onClick={addAdjustmentRow}>
                    Add Row
                  </Button>
                </div>
                <div className="space-y-3 rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3">
                  {form.adjustmentRows.map((row, index) => (
                    <div key={`adjustment-${index}`} className="grid gap-3 md:grid-cols-[0.8fr_1.5fr_0.7fr_auto]">
                      <Input placeholder="Label" value={row.label} onChange={(event) => updateAdjustmentRow(index, "label", event.target.value)} />
                      <Input placeholder="Description" value={row.description} onChange={(event) => updateAdjustmentRow(index, "description", event.target.value)} />
                      <Input type="number" step="1" placeholder="Amount" value={row.amount} onChange={(event) => updateAdjustmentRow(index, "amount", Number(event.target.value || 0))} />
                      <Button type="button" variant="destructive" onClick={() => removeAdjustmentRow(index)} disabled={form.adjustmentRows.length <= 1}>
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Advance Label">
                    <Input value={form.advanceRow.label} onChange={(event) => updateField("advanceRow.label", event.target.value)} />
                  </Field>
                  <Field label="Advance Amount">
                    <Input type="number" step="1" value={form.advanceRow.amount} onChange={(event) => updateField("advanceRow.amount", Number(event.target.value || 0))} />
                  </Field>
                </div>

                <Field label="Advance Description">
                  <Input value={form.advanceRow.description} onChange={(event) => updateField("advanceRow.description", event.target.value)} />
                </Field>

                <label className="mb-10 p-2 text-xl font-semibold text-foreground">Terms & Payment</label>
                <div className="space-y-3">
                  {form.notes.map((note, index) => (
                    <div key={index} className="flex gap-2">
                      <div className="flex-1">
                        <Field label={`Note ${index + 1}`}>
                          <textarea
                            value={note}
                            onChange={(event) => updateNotes(index, event.target.value)}
                            rows={3}
                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition focus:ring-2 focus:ring-ring/50 dark:border-white/15 dark:bg-background dark:text-foreground"
                          />
                        </Field>
                      </div>
                      {form.notes.length > 1 && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeNote(index)}
                          className="h-fit mt-8"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={addNote} className="w-full">
                    + Add Terms & Conditions
                  </Button>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Payment Heading">
                    <Input value={form.paymentHeading} onChange={(event) => updateField("paymentHeading", event.target.value)} />
                  </Field>
                  <Field label="Payment UPI ID">
                    <Input value={form.paymentDetails.upiId} onChange={(event) => updateField("paymentDetails.upiId", event.target.value)} />
                  </Field>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Bank Name">
                    <Input value={form.paymentDetails.bankName} onChange={(event) => updateField("paymentDetails.bankName", event.target.value)} />
                  </Field>
                  <Field label="Account Name">
                    <Input value={form.paymentDetails.accountName} onChange={(event) => updateField("paymentDetails.accountName", event.target.value)} />
                  </Field>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="UPI Number">
                    <Input value={form.paymentDetails.upiNumber} onChange={(event) => updateField("paymentDetails.upiNumber", event.target.value)} />
                  </Field>
                  <Field label="Footer Message">
                    <Input value={form.footerMessage} onChange={(event) => updateField("footerMessage", event.target.value)} />
                  </Field>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Support Phone">
                    <Input value={form.supportPhone} onChange={(event) => updateField("supportPhone", event.target.value)} />
                  </Field>
                  <Field label="Support Email">
                    <Input value={form.supportEmail} onChange={(event) => updateField("supportEmail", event.target.value)} />
                  </Field>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Website">
                    <Input value={form.website} onChange={(event) => updateField("website", event.target.value)} />
                  </Field>
                  <Field label="Support Address">
                    <Input value={form.supportAddress} onChange={(event) => updateField("supportAddress", event.target.value)} />
                  </Field>
                </div>

                {notice ? <p className="text-sm text-emerald-400">{notice}</p> : null}
                {error ? <p className="text-sm text-red-400">{error}</p> : null}

                <div className="flex flex-wrap gap-2">
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving..." : editingId ? "Update Document" : "Create Document"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => resetTemplate(form.type)}>
                    Reset Template
                  </Button>
                </div>
                </form>
              ) : null}
              {/* UPLOAD & ASSIGN SECTION - COMMENTED OUT FOR NOW */}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Billing Records</CardTitle>
              <CardDescription>Only documents issued to your account appear here.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading billing records...</p>
              ) : bills.length === 0 ? (
                <p className="text-sm text-muted-foreground">No bills or invoices have been issued to you yet.</p>
              ) : (
                <div className="space-y-3">
                  {bills.map((bill) => (
                    <div
                      key={bill._id}
                      className={`w-full rounded-lg border px-4 py-3 transition-colors ${
                        selectedId === bill._id
                          ? "border-border bg-muted/50 dark:border-white/20 dark:bg-white/5"
                          : "border-border/70 bg-background hover:border-border hover:bg-muted/40 dark:border-white/10 dark:hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <button type="button" onClick={() => setSelectedId(bill._id)} className="flex-1 text-left">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">{bill.type}</p>
                              <p className="text-lg font-bold text-foreground">{bill.referenceNumber}</p>
                            </div>
                            <p className="text-sm text-muted-foreground">{formatDateInput(bill.issueDate)}</p>
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground">{bill.documentTitle} - {bill.documentSubtitle}</p>
                        </button>

                        <div className="shrink-0 flex flex-wrap gap-2">
                          {isUploadedRecord(bill) ? (
                            <Button type="button" variant="outline" size="sm" onClick={() => downloadUploadedFile(bill)}>
                              <Download className="w-4 h-4 mr-1" />
                              Download
                            </Button>
                          ) : (
                            <>
                              {canManage && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => loadBillIntoForm(bill)}
                                >
                                  <Edit2 className="w-4 h-4 mr-1" />
                                  Edit
                                </Button>
                              )}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedId(bill._id);
                                  downloadPreviewAsPdf();
                                }}
                                disabled={exporting && selectedId === bill._id}
                              >
                                <Download className="w-4 h-4 mr-1" />
                                {exporting && selectedId === bill._id ? "..." : "PDF"}
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {notice ? <p className="mt-3 text-sm text-emerald-400">{notice}</p> : null}
              {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
            </CardContent>
          </Card>
        )}

        {canManage ? (
          <Card>
            {/* <CardHeader>
              <CardTitle className="text-foreground">Saved Documents</CardTitle>
              <CardDescription>Edit-ready records with the same template structure.</CardDescription>
            </CardHeader> */}
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading billing records...</p>
              ) : bills.length === 0 ? (
                <p className="text-sm text-muted-foreground">No bills or invoices have been created yet.</p>
              ) : (
                <div className="space-y-5">
                  {uploadedBills.length > 0 ? (
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Uploaded Documents</p>
                        {/* <p className="text-sm text-muted-foreground">Files uploaded through billing show here with download access.</p> */}
                      </div>
                      <div className="space-y-3">
                        {uploadedBills.map((bill) => (
                          <div key={bill._id} className={`cursor-pointer rounded-lg border p-3 ${selectedId === bill._id ? "border-border bg-muted/40 dark:border-white/20 dark:bg-white/5" : "border-border/70 bg-background hover:bg-muted/40 dark:border-white/10 dark:hover:bg-white/5"}`}>
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <button type="button" className="text-left" onClick={() => setSelectedId(bill._id)}>
                                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{bill.type} - uploaded</p>
                                <p className="text-lg font-semibold text-foreground">{bill.referenceNumber}</p>
                                <p className="text-sm text-muted-foreground">{bill.recipientName}</p>
                                <p className="mt-1 text-xs text-muted-foreground">{bill.fileName || bill.documentTitle || "Uploaded file"}</p>
                              </button>

                              <div className="flex flex-wrap gap-2">
                                {/* <Button type="button" variant="outline" onClick={() => setSelectedId(bill._id)}>
                                  View
                                </Button> */}
                                {/* <Button type="button" variant="outline" onClick={() => viewUploadedFile(bill)}>
                                  Open File
                                </Button> */}
                                <Button type="button" variant="outline" onClick={() => downloadUploadedFile(bill)}>
                                  Download
                                </Button>
                                <Button type="button" variant="destructive" onClick={() => deleteBill(bill._id)} disabled={saving}>
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {templateBills.length > 0 ? (
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Template Documents</p>
                        <p className="text-sm text-muted-foreground">Bills and invoices created from the editor.</p>
                      </div>
                      <div className="space-y-3">
                        {templateBills.map((bill) => (
                          <div key={bill._id} className={`cursor-pointer rounded-lg border p-3 ${selectedId === bill._id ? "border-border bg-muted/40 dark:border-white/20 dark:bg-white/5" : "border-border/70 bg-background hover:bg-muted/40 dark:border-white/10 dark:hover:bg-white/5"}`}>
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <button type="button" className="text-left" onClick={() => setSelectedId(bill._id)}>
                                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{bill.type} - template</p>
                                <p className="text-lg font-semibold text-foreground">{bill.referenceNumber}</p>
                                <p className="text-sm text-muted-foreground">{bill.recipientName}</p>
                              </button>

                              <div className="flex flex-wrap gap-2">
                                <Button type="button" variant="outline" onClick={() => loadBillIntoForm(bill)}>
                                  Load Into Form
                                </Button>
                                <Button type="button" variant="destructive" onClick={() => deleteBill(bill._id)} disabled={saving}>
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}
        </div>

        {/* RIGHT COLUMN: LIVE PREVIEW */}
        {canManage && adminMode === "template" && previewBill ? (
          <Card className="sticky top-4 h-fit cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setShowPreviewModal(true)}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Live Preview (Click to expand)
              </CardTitle>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); downloadPreviewAsPdf(); }} disabled={exporting}>
                  <Download className="w-4 h-4 mr-1" />
                  {exporting ? "Downloading..." : "PDF"}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); downloadPreviewAsImage(); }} disabled={exportingImage}>
                  <Image className="w-4 h-4 mr-1" />
                  {exportingImage ? "Exporting..." : "Image"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-hidden text-xs text-muted-foreground">
              <p>Click card to view full preview...</p>
            </CardContent>
          </Card>
        ) : null}
      </div>

      {/* PREVIEW MODAL */}
      {showPreviewModal && previewBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-lg shadow-xl flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-800">
              <h2 className="text-xl font-bold text-foreground dark:text-white">Invoice Preview</h2>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={downloadPreviewAsPdf} disabled={exporting}>
                  <Download className="w-4 h-4 mr-1" />
                  {exporting ? "..." : "PDF"}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={downloadPreviewAsImage} disabled={exportingImage}>
                  <Image className="w-4 h-4 mr-1" />
                  {exportingImage ? "..." : "Image"}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowPreviewModal(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="overflow-y-auto flex-1 bg-gray-50 dark:bg-slate-950 p-4">
              <div ref={printableRef} className="bg-white p-8 mx-auto" style={{ maxWidth: "900px" }}>
                <BillingDocument bill={previewBill} />
              </div>
            </div>
          </div>
        </div>
      )}

      {!canManage && selectedBill && !isUploadedRecord(selectedBill) ? (
        <div className="pointer-events-none fixed top-0 z-[-1]" style={{ left: -10000 }}>
          <div ref={printableRef} className="bg-white p-4" style={{ width: 1024 }}>
            <BillingDocument bill={selectedBill} />
          </div>
        </div>
      ) : null}

    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <Label className="text-foreground">{label}</Label>
      {children}
    </div>
  );
}

function SectionLabel({ children }) {
  return <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">{children}</p>;
}

function TemplatePicker({ value, onChange }) {
  return (
    <Field label="Template Type">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground shadow-sm outline-none transition focus:ring-2 focus:ring-ring/50 dark:border-white/15 dark:bg-background dark:text-foreground"
      >
        <option value="invoice" className="bg-background text-foreground">Invoice Template</option>
        <option value="bill" className="bg-background text-foreground">Bill Template</option>
      </select>
    </Field>
  );
}