const INDIAN_NUMBER_FORMATTER = new Intl.NumberFormat("en-IN");

function parseAmount(value) {
  if (value === null || value === undefined || value === "") return 0;

  const numeric = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
}

function formatAmount(value, { freeText = "Free" } = {}) {
  const numeric = parseAmount(value);

  if (!numeric) {
    return freeText;
  }

  return `${INDIAN_NUMBER_FORMATTER.format(numeric)}/-`;
}

function formatDateInput(value) {
  if (!value) return "";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 10);
}

function computeBillingTotals({ lineItems = [], adjustmentRows = [], advanceAmount = 0 }) {
  const subtotal = lineItems.reduce((sum, item) => sum + parseAmount(item?.amount), 0);
  const adjustmentTotal = adjustmentRows.reduce((sum, row) => sum + parseAmount(row?.amount), 0);
  const total = subtotal + adjustmentTotal;
  const advance = parseAmount(advanceAmount);
  const dueAmount = total - advance;

  return {
    subtotal,
    adjustmentTotal,
    total,
    advance,
    dueAmount,
  };
}

function createBaseDraft() {
  return {
    recipientUserId: "",
    recipientName: "",
    recipientCompany: "",
    recipientAddress: "",
    recipientEmail: "",
    issuerName: "",
    issuerEmail: "",
    issuerAddress: "",
    referenceNumber: "",
    issueDate: formatDateInput(new Date()),
    dueDate: formatDateInput(new Date()),
    isPaid: false,
    strikeDueDate: false,
    documentTitle: "INVOICE",
    documentSubtitle: "",
    lineItems: [
      { item: "", period: "", unitPriceLabel: "", amount: 0 },
    ],
    adjustmentRows: [
      { label: "ADD-ON", description: "", amount: 0 },
    ],
    advanceRow: {
      label: "ADVANCE",
      description: "",
      amount: 0,
    },
    notes: [],
    paymentHeading: "",
    paymentDetails: {
      upiId: "",
      bankName: "",
      accountName: "",
      upiNumber: "",
    },
    footerMessage: "",
    supportPhone: "",
    supportEmail: "",
    website: "",
    supportAddress: "",
  };
}

const BILLING_TEMPLATE_PRESETS = {
  invoice: {
    documentTitle: "INVOICE",
    documentSubtitle: "",
    referenceNumber: "",
    issueDate: "",
    dueDate: "",
    isPaid: false,
    strikeDueDate: false,
    lineItems: [
      { item: "", period: "", unitPriceLabel: "", amount: 0 },
    ],
    adjustmentRows: [
      { label: "ADD-ON", description: "", amount: 0 },
      { label: "DISCOUNT", description: "", amount: 0 },
    ],
    advanceRow: {
      label: "ADVANCE",
      description: "",
      amount: 0,
    },
    notes: [],
    paymentHeading: "",
    paymentDetails: {
      upiId: "",
      bankName: "",
      accountName: "",
      upiNumber: "",
    },
    footerMessage: "",
    supportPhone: "",
    supportEmail: "",
    website: "",
    supportAddress: "",
  },
  bill: {
    documentTitle: "BILL",
    documentSubtitle: "",
    referenceNumber: "",
    issueDate: "",
    dueDate: "",
    isPaid: true,
    strikeDueDate: true,
    lineItems: [
      { item: "", period: "", unitPriceLabel: "", amount: 0 },
      
    ],
    adjustmentRows: [
      { label: "ADD-ON", description: "-", amount: 0 },
      { label: "OFFER", description: " DISCOUNT", amount: 0 },
    ],
    advanceRow: {
      label: "ADVANCE",
      description: "",
      amount: 0,
    },
    notes: [],
    paymentHeading: "",
    paymentDetails: {
      upiId: "",
      bankName: "",
      accountName: "",
      upiNumber: "",
    },
    footerMessage: "",
    supportPhone: "",
    supportEmail: "",
    website: "",
    supportAddress: "",
  },
};

function createBillingDraft(type = "invoice") {
  const preset = BILLING_TEMPLATE_PRESETS[type] || BILLING_TEMPLATE_PRESETS.invoice;
  const base = createBaseDraft();
  const presetLineItems = Array.isArray(preset.lineItems) ? preset.lineItems : base.lineItems;
  const presetAdjustmentRows = Array.isArray(preset.adjustmentRows) ? preset.adjustmentRows : base.adjustmentRows;
  const presetAdvanceRow = preset.advanceRow ? preset.advanceRow : base.advanceRow;

  return {
    ...base,
    ...preset,
    lineItems: presetLineItems.map((item) => ({ ...item })),
    adjustmentRows: presetAdjustmentRows.map((item) => ({ ...item })),
    advanceRow: { ...presetAdvanceRow },
    paymentDetails: { ...base.paymentDetails, ...preset.paymentDetails },
  };
}

export {
  BILLING_TEMPLATE_PRESETS,
  computeBillingTotals,
  createBillingDraft,
  formatAmount,
  formatDateInput,
  parseAmount,
};