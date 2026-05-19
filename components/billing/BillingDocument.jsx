import { cn } from "@/lib/utils";
import { computeBillingTotals, formatAmount } from "@/lib/billing";
import cwlogo from "@/public/image.png";

function HexAccent({ className, toneClass = "border-cyan-500/70 bg-cyan-400/90" }) {
  return (
    <div
      aria-hidden="true"
      className={cn("absolute h-20 w-20 border-[3px]", toneClass, className)}
      style={{ clipPath: "polygon(25% 6%, 75% 6%, 100% 50%, 75% 94%, 25% 94%, 0 50%)" }}
    />
  );
}

function InfoBlock({ title, lines = [] }) {
  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-wide text-black">{title}</p>
      <div className="mt-1 space-y-0.5 text-[15px] leading-tight text-black">
        {lines.filter(Boolean).map((line, index) => (
          <p key={`${title}-${index}`} className={index === 0 ? "text-[17px] font-bold" : ""}>
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}

function getDaySuffix(day) {
  if (day >= 11 && day <= 13) return "th";

  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

function InvoiceDetailRow({ label, value }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-3 text-sm text-black sm:grid-cols-[130px_1fr]">
      <div className="font-medium uppercase tracking-wide">{label}</div>
      <div className="text-right sm:text-left">{value}</div>
    </div>
  );
}

function InvoiceSectionTitle({ children }) {
  return <p className="text-sm font-bold uppercase tracking-[0.18em] text-black">{children}</p>;
}

function InvoiceSummaryRow({ label, centerText, amount, strong = false, highlight = false }) {
  return (
    <div
      className={cn(
        "grid grid-cols-[1fr_2fr_auto] items-center border-b border-black px-3 py-2 text-sm",
        strong && "font-bold",
        highlight ? "bg-black text-white" : "bg-white text-black"
      )}
    >
      <div className="uppercase tracking-tight">{label}</div>
      <div className="text-center">{centerText || ""}</div>
      <div className="text-right">{amount}</div>
    </div>
  );
}

function InvoiceDocumentLayout({ bill, lineItems, adjustmentRows, advanceRow, totals, recipientLines, issuerLines, className }) {
  const companyName = bill.issuerName || "";
  const companyAddress = bill.supportAddress || bill.issuerAddress || "";
  const companyEmail = bill.supportEmail || bill.issuerEmail || "";
  const companyWebsite = bill.website || "";
  const dueLabel = bill.dueLabelText || "";

  return (
    <div className="bg-white p-8 text-black">
      <div className="space-y-5">
        {/* HEADER */}
        <div className="border-b border-black pb-4">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-4xl font-bold uppercase">{bill.documentTitle}</h1>
              <p className="text-lg mt-1">{bill.documentSubtitle}</p>
            </div>
            <div className="text-right">
              {bill.issuerName && <p className="font-bold text-lg">{bill.issuerName}</p>}
              {companyAddress && <p className="text-sm">{companyAddress}</p>}
              {companyEmail && <p className="text-sm">{companyEmail}</p>}
              {companyWebsite && <p className="text-sm">{companyWebsite}</p>}
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-sm mt-4">
            <div>
              <p className="font-bold">Invoice #:</p>
              <p>{bill.referenceNumber}</p>
            </div>
            <div>
              <p className="font-bold">Issue Date:</p>
              <p>{formatDate(bill.issueDate)}</p>
            </div>
            <div className="text-right">
              <p className="font-bold">Due Date:</p>
              <p>{formatDate(bill.dueDate)}</p>
            </div>
          </div>
        </div>

        {/* BILL TO & BILL BY */}
        <div className="grid grid-cols-2 gap-8 text-sm mb-6">
          <div>
            <p className="font-bold uppercase mb-2">Bill To:</p>
            <div className="space-y-1">
              {recipientLines.map((line, i) => line ? <p key={i}>{line}</p> : null)}
            </div>
          </div>
          <div>
            <p className="font-bold uppercase mb-2">Bill By:</p>
            <div className="space-y-1">
              {issuerLines.map((line, i) => line ? <p key={i}>{line}</p> : null)}
            </div>
          </div>
        </div>

        {/* ITEMS TABLE */}
        <table className="w-full border-collapse border border-black text-sm">
          <thead>
            <tr className="bg-black text-white">
              <th className="border border-black p-2 text-left">No</th>
              <th className="border border-black p-2 text-left">Item</th>
              <th className="border border-black p-2 text-left">Period</th>
              <th className="border border-black p-2 text-right">Unit Price</th>
              <th className="border border-black p-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item, index) => {
              const isFree = item.amount === 0 || item.amount == null;
              return (
                <tr key={index} className="border-b border-black">
                  <td className="border border-black p-2">{index + 1}</td>
                  <td className="border border-black p-2 font-medium">{item.item || "-"}</td>
                  <td className="border border-black p-2">{item.period || "-"}</td>
                  <td className="border border-black p-2 text-right">{isFree ? "Free" : item.unitPriceLabel || formatAmount(item.amount)}</td>
                  <td className="border border-black p-2 text-right">{isFree ? "-" : formatAmount(item.amount)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* SUMMARY */}
        <div className="space-y-0 border border-black">
          <div className="grid grid-cols-3 border-b border-black p-2 text-sm font-bold">
            <div>Subtotal</div>
            <div></div>
            <div className="text-right">{formatAmount(totals.subtotal)}</div>
          </div>

          {adjustmentRows.map((row, index) => (
            <div key={index} className="grid grid-cols-3 border-b border-black p-2 text-sm">
              <div>{row.label}</div>
              <div className="text-center">{row.description}</div>
              <div className="text-right">{formatAmount(row.amount)}</div>
            </div>
          ))}

          <div className="grid grid-cols-3 border-b border-black bg-black text-white p-2 text-sm font-bold">
            <div>Total</div>
            <div></div>
            <div className="text-right">{formatAmount(totals.total)}</div>
          </div>

          <div className="grid grid-cols-3 border-b border-black p-2 text-sm">
            <div>{advanceRow.label}</div>
            <div className="text-center">{advanceRow.description}</div>
            <div className="text-right">{formatAmount(totals.advance)}</div>
          </div>

          <div className="grid grid-cols-3 border-b border-black p-2 text-sm font-bold">
            <div>Due</div>
            <div className="text-center">{dueLabel}</div>
            <div className="text-right">{formatAmount(totals.dueAmount)}</div>
          </div>
        </div>

        {/* TERMS */}
        <div>
          <p className="font-bold uppercase text-sm mb-2">Terms and Conditions:</p>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            {bill.notes?.filter(Boolean).map((note, index) => (
              <li key={index}>{note}</li>
            ))}
          </ul>
        </div>

        {/* PAYMENT DETAILS */}
        <div className="grid grid-cols-2 gap-8 text-sm border-t border-black pt-4">
          <div>
            <p className="font-bold uppercase mb-2">Payment Details:</p>
            <div className="space-y-1">
              {bill.paymentDetails?.upiId && <p>UPI: {bill.paymentDetails.upiId}</p>}
              {bill.paymentDetails?.bankName && <p>Bank: {bill.paymentDetails.bankName}</p>}
              {bill.paymentDetails?.accountName && <p>Account Name: {bill.paymentDetails.accountName}</p>}
              {bill.paymentDetails?.upiNumber && <p>UPI No: {bill.paymentDetails.upiNumber}</p>}
            </div>
          </div>
          <div className="text-right">
            {bill.footerMessage && <p className="font-bold uppercase">{bill.footerMessage}</p>}
            <div className="mt-2 space-y-1 text-xs">
              {bill.supportPhone && <p>Ph: {bill.supportPhone}</p>}
              {bill.supportEmail && <p>Email: {bill.supportEmail}</p>}
              {bill.website && <p>Web: {bill.website}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, centerText, amount, strong = false, highlight = false }) {
  return (
    <div
      className={cn(
        "grid grid-cols-[1fr_2fr_auto] items-center border-b border-slate-300 px-3 py-2 text-sm",
        strong && "font-bold",
        highlight ? "bg-cyan-700 text-white" : "text-slate-900"
      )}
    >
      <div className="uppercase tracking-tight">{label}</div>
      <div className={cn("text-center", highlight ? "text-white" : "text-slate-800")}>{centerText || ""}</div>
      <div className="text-right">{amount}</div>
    </div>
  );
}

function FooterContact({ icon, text }) {
  return (
    <div className="flex items-center justify-end gap-2 text-sm text-slate-700">
      <span className="underline underline-offset-2">{text}</span>
      <span className="grid h-7 w-7 place-items-center rounded-full bg-cyan-600 text-xs text-white">{icon}</span>
    </div>
  );
}

function PaidStamp() {
  return (
    <div className="flex items-center justify-center py-2">
      <svg viewBox="0 0 200 160" className="w-52" aria-label="Paid stamp">
        <circle cx="100" cy="80" r="72" fill="none" stroke="#e53935" strokeWidth="3" strokeDasharray="4 3" />

        {[0, 72, 144, 216, 288].map((deg) => (
          <text
            key={deg}
            x="100"
            y="18"
            textAnchor="middle"
            fontSize="14"
            fill="#e53935"
            transform={`rotate(${deg} 100 80)`}
          >
            *
          </text>
        ))}

        {Array.from({ length: 24 }).map((_, i) => {
          const angle = (i * 360) / 24;
          const rad = (angle * Math.PI) / 180;
          const x1 = 100 + 56 * Math.cos(rad);
          const y1 = 80 + 56 * Math.sin(rad);
          const x2 = 100 + 65 * Math.cos(rad);
          const y2 = 80 + 65 * Math.sin(rad);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#e53935" strokeWidth="2" />;
        })}

        <text
          x="100"
          y="93"
          textAnchor="middle"
          fontSize="44"
          fontWeight="900"
          fill="#e53935"
          fontFamily="serif"
          letterSpacing="2"
        >
          PAID
        </text>

        {Array.from({ length: 6 }).map((_, i) => (
          <line
            key={i}
            x1={60 + i * 8}
            y1="55"
            x2={50 + i * 8}
            y2="105"
            stroke="#e53935"
            strokeWidth="1.5"
            opacity="0.35"
          />
        ))}
      </svg>
    </div>
  );
}

function SignatureBlock() {
  return (
    <div className="flex items-center justify-center pb-2">
      <svg viewBox="0 0 200 60" className="h-12 w-44" aria-label="Signature">
        <path
          d="M10,40 C20,10 30,50 50,30 C60,20 65,45 80,35 C95,25 100,45 120,30 C135,18 145,40 190,28"
          fill="none"
          stroke="#1e293b"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export function BillingDocument({ bill, className }) {
  if (!bill) return null;

  const lineItems = bill.lineItems || [];
  const adjustmentRows = bill.adjustmentRows || [];
  const advanceRow = bill.advanceRow || { label: "ADVANCE", description: "", amount: 0 };
  const isPaid = typeof bill.isPaid === "boolean" ? bill.isPaid : bill.type === "bill";

  const totals =
    bill.subtotal || bill.total || bill.dueAmount
      ? {
          subtotal: bill.subtotal ?? 0,
          adjustmentTotal: bill.adjustmentTotal ?? 0,
          total: bill.total ?? 0,
          advance: bill.advanceAmount ?? 0,
          dueAmount: bill.dueAmount ?? 0,
        }
      : computeBillingTotals({
          lineItems,
          adjustmentRows,
          advanceAmount: advanceRow.amount,
        });

  const recipientLines = [bill.recipientName, bill.recipientCompany, bill.recipientAddress].filter(Boolean);
  const issuerLines = [bill.issuerName, bill.issuerEmail ?? bill.website, bill.issuerAddress].filter(Boolean);
  const strikeDueDate = typeof bill.strikeDueDate === "boolean" ? bill.strikeDueDate : isPaid;

  if (bill.type === "invoice") {
    return (
      <InvoiceDocumentLayout
        bill={bill}
        lineItems={lineItems}
        adjustmentRows={adjustmentRows}
        advanceRow={advanceRow}
        totals={totals}
        recipientLines={recipientLines}
        issuerLines={issuerLines}
        className={className}
      />
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[28px] bg-white px-4 py-4 text-slate-900 shadow-[0_30px_120px_rgba(2,6,23,0.22)] sm:px-6 sm:py-6",
        className
      )}
    >
      <HexAccent className="-left-7 -top-6 h-24 w-24 rotate-45 border-slate-900/70 bg-slate-900/90" />
      <HexAccent className="left-13.5 -top-4.5 h-20 w-20 rotate-45 border-slate-300 bg-slate-300/80" />
      <HexAccent className="-right-5.5 -top-4.5 h-24 w-24 rotate-45 border-cyan-600/80 bg-cyan-500/90" />
      <HexAccent className="right-13.5 top-11 h-16 w-16 rotate-45 border-cyan-300 bg-cyan-100" />
      <HexAccent className="-left-6 bottom-21 h-24 w-24 rotate-45 border-cyan-600/90 bg-cyan-500/95" />
      <HexAccent className="right-6.5 -bottom-5.5 h-24 w-24 rotate-45 border-cyan-600/90 bg-cyan-400/90" />

      <div className="relative z-10 space-y-5">
        <div className="flex flex-col items-start justify-between gap-4 pt-6 sm:flex-row sm:items-start">
          <div className="space-y-1">
            <h1 className="text-5xl font-black uppercase tracking-[-0.06em] text-slate-900 sm:text-6xl">{bill.documentTitle}</h1>
            <p className="mt-1 text-xl text-slate-700">{bill.documentSubtitle}</p>
          </div>

          <div className="flex flex-col items-end gap-3">
            <div className="space-y-1 text-right text-sm text-slate-700">
              <p>
                <span className="font-semibold text-slate-900">Invoice Number:</span> {bill.referenceNumber}
              </p>
              <p>
                <span className="font-semibold text-slate-900">Invoice Date:</span> {formatDate(bill.issueDate)}
              </p>
              <p>
                <span className={cn("font-semibold text-slate-900", strikeDueDate && "line-through")}>Due Date:</span>{" "}
                <span className={strikeDueDate ? "line-through text-slate-500" : ""}>{formatDate(bill.dueDate)}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <InfoBlock title="Bill To :" lines={recipientLines} />
          <InfoBlock title="Bill By :" lines={issuerLines} />
        </div>

        <div className="overflow-hidden rounded-none border border-slate-200">
          <div className="grid grid-cols-[0.55fr_1.5fr_0.8fr_1fr_1fr] bg-cyan-700 px-3 py-3 text-[14px] font-bold uppercase tracking-wide text-white">
            <div>No</div>
            <div>Item</div>
            <div>Period</div>
            <div>Unit Price</div>
            <div className="text-right">Total</div>
          </div>

          <div className="divide-y divide-cyan-100 bg-cyan-100/90">
            {lineItems.map((item, index) => {
              const isFree = item.amount === 0 || item.amount == null;
              return (
                <div
                  key={`${item.item || "item"}-${index}`}
                  className="grid grid-cols-[0.55fr_1.5fr_0.8fr_1fr_1fr] items-center px-3 py-3 text-[15px] text-slate-800"
                >
                  <div>{index + 1}</div>
                  <div className="pr-2 font-medium">{item.item || "-"}</div>
                  <div>{item.period || "-"}</div>
                  <div>{isFree ? "Free" : item.unitPriceLabel || formatAmount(item.amount)}</div>
                  <div className="text-right">{isFree ? item.freeTotalLabel ?? "-" : formatAmount(item.amount, { freeText: "Free" })}</div>
                </div>
              );
            })}
          </div>

          <SummaryRow label="Subtotal" amount={formatAmount(totals.subtotal, { freeText: "0/-" })} strong />

          {adjustmentRows.map((row, index) => {
            const amount = Number(row.amount || 0);
            return (
              <SummaryRow
                key={`${row.label || "adjustment"}-${index}`}
                label={row.label || "Adjustment"}
                centerText={row.description || "-"}
                amount={formatAmount(amount, { freeText: "-" })}
              />
            );
          })}

          <SummaryRow label="Total" amount={formatAmount(totals.total, { freeText: "0/-" })} strong highlight />
          <SummaryRow
            label={advanceRow.label || "Advance"}
            centerText={advanceRow.description || ""}
            amount={formatAmount(totals.advance, { freeText: "-" })}
          />
          <SummaryRow
            label="Due"
            centerText={bill.dueLabelText || ""}
            amount={formatAmount(totals.dueAmount, { freeText: "-" })}
            strong
          />
        </div>

        {isPaid ? (
          <div className="grid items-center gap-4 lg:grid-cols-2">
            <div className="flex flex-col items-center">
              <PaidStamp />
              <SignatureBlock />
              <p className="text-center text-lg font-semibold italic tracking-wide text-slate-800">{bill.issuerName}</p>
            </div>

            <div className="flex flex-col items-end gap-1.5">
              <p className="mb-1 text-base font-bold uppercase text-slate-900">{bill.footerMessage || ""}</p>
              {bill.supportPhone ? <FooterContact icon="" text={bill.supportPhone} /> : null}
              {bill.supportEmail ? <FooterContact icon="" text={bill.supportEmail} /> : null}
              {bill.website ? <FooterContact icon="" text={bill.website} /> : null}
              {bill.supportAddress ? <FooterContact icon="" text={bill.supportAddress} /> : null}
            </div>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-sm font-bold uppercase tracking-[0.15em] text-slate-800 underline underline-offset-4">Terms and Conditions</p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-[13px] text-slate-700">
                {bill.notes?.filter(Boolean).map((note, index) => (
                  <li key={`${note}-${index}`}>{note}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-3 rounded-lg p-1">
              <div>
                {bill.paymentHeading && <p className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">{bill.paymentHeading}</p>}
                <div className="mt-2 space-y-1 text-sm text-slate-700">
                  <p>{bill.paymentDetails?.upiId || ""}</p>
                  <p>{bill.paymentDetails?.bankName || ""}</p>
                  <p>{bill.paymentDetails?.accountName || ""}</p>
                  <p>{bill.paymentDetails?.upiNumber || ""}</p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1.5">
                <p className="mb-1 text-base font-bold uppercase text-slate-900">{bill.footerMessage || ""}</p>
                {bill.supportPhone ? <FooterContact icon="" text={bill.supportPhone} /> : null}
                {bill.supportEmail ? <FooterContact icon="" text={bill.supportEmail} /> : null}
                {bill.website ? <FooterContact icon="" text={bill.website} /> : null}
                {bill.supportAddress ? <FooterContact icon="" text={bill.supportAddress} /> : null}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  const day = date.getDate();
  const suffix = getDaySuffix(day);

  return `${date.toLocaleDateString("en-US", {
    month: "long",
  })} ${day}${suffix}, ${date.getFullYear()}`;
}
