// "use client";

// import { useEffect, useState } from "react";

// type Quotation = {
//   id: string;
//   name?: string;
//   email?: string;
//   message?: string;
//   amount?: number;
//   createdAt?: string;
// };

// export default function QuotationPage() {
//   const [data, setData] = useState<Quotation[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   useEffect(() => {
//     const fetchQuotation = async () => {
     
//     try {
//       const res = await fetch("/api/quotations")
//       const text = await res.text()
//       try {
//         const json = JSON.parse(text)
//         setData(json.quotations || [])
//       } catch {
//         console.error("Not JSON response:", text)
//       }
//     } catch (err) {
//       console.error(err)
//     }
  
//     };

//     fetchQuotation();
//   }, []);

// //   if (loading) return <p className="p-4">Loading...</p>;
//   if (error) return <p className="p-4 text-red-500">{error}</p>;

//   return (
//     <div className="p-6">
//       <h1 className="text-2xl font-bold mb-4">Quotation List</h1>

//       {data.length === 0 ? (
//         <p>No quotations found.</p>
//       ) : (
//         <div className="grid gap-4">
//             <table>
//           <tbody className="divide-y divide-gray-100 dark:divide-white/5 bg-white dark:bg-black">
//               {data.length === 0 ? (
//                 <tr>
//                   <td colSpan={4} className="px-5 py-12 text-center text-gray-400 dark:text-gray-600">
//                     <div className="flex flex-col items-center gap-2">
//                       <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-40">
//                         <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
//                         <polyline points="14 2 14 8 20 8"/>
//                         <line x1="9" y1="13" x2="15" y2="13"/>
//                         <line x1="9" y1="17" x2="12" y2="17"/>
//                       </svg>
//                       <span className="text-sm">No quotations yet</span>
//                     </div>
//                   </td>
//                 </tr>
//               ) : (
//                 data.map((q: any, index: number) => (
//                   <tr key={q._id} className="hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors">

//                     {/* Index */}
//                     <td className="px-5 py-4 whitespace-nowrap">
//                       <span className="text-xs font-bold px-2 py-0.5 rounded-md
//                         bg-gray-100 dark:bg-white/10
//                         text-gray-500 dark:text-gray-400">
//                         {index + 1}
//                       </span>
//                     </td>

//                     {/* Title */}
//                     <td className="px-5 py-4 font-semibold text-gray-900 dark:text-white whitespace-nowrap">
//                       {q.title || "—"}
//                     </td>

//                     {/* Description */}
//                     <td className="px-5 py-4 text-gray-500 dark:text-gray-400 max-w-sm truncate">
//                       {q.description || "—"}
//                     </td>

//                     {/* Document */}
//                     <td className="px-5 py-4 whitespace-nowrap">
//                       {q.fileUrl ? (
//                         <a
//                           href={q.fileUrl}
//                           target="_blank"
//                           rel="noopener noreferrer"
//                           className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors
//                             border border-gray-200 dark:border-white/10
//                             bg-white dark:bg-white/5
//                             text-gray-700 dark:text-gray-300
//                             hover:border-gray-400 dark:hover:border-white/30
//                             hover:text-gray-900 dark:hover:text-white"
//                         >
//                           <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
//                             <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
//                             <polyline points="15 3 21 3 21 9"/>
//                             <line x1="10" y1="14" x2="21" y2="3"/>
//                           </svg>
//                           View Doc
//                         </a>
//                       ) : (
//                         <span className="text-xs text-gray-300 dark:text-gray-700 italic">No file</span>
//                       )}
//                     </td>
//                   </tr>
//                 ))
//               )}
//             </tbody>
//             </table>
//         </div>
//       )}
//     </div>
//   );
// }



"use client";

import { useEffect, useState } from "react";

type Quotation = {
  _id: string;
  title?: string;
  description?: string;
  fileUrl?: string;
  recipientUserId?: { name: string; email: string };
  createdAt?: string;
};

export default function QuotationPage() {
  const [data, setData] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchQuotation = async () => {
      try {
        const res = await fetch("/api/quotations", { credentials: "include" });
        const text = await res.text();
        try {
          const json = JSON.parse(text);
          setData(json.quotations || []);
        } catch {
          console.error("Not JSON response:", text);
          setError("Failed to parse quotations");
        }
      } catch (err) {
        console.error("Error fetching quotations:", err);
        setError("Failed to load quotations");
      } finally {
        setLoading(false);
      }
    };

    fetchQuotation();
  }, []);

  return (
    <div className="p-6 space-y-6">

      {/* ── Header ── */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Quotations</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {data.length} quotation{data.length !== 1 ? "s" : ""} found
        </p>
      </div>

      {/* ── Error message ── */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* ── Loading state ── */}
      {loading ? (
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
          <p className="text-sm">Loading quotations...</p>
        </div>
      ) : data.length === 0 ? (
        <div className="rounded-xl border border-gray-200 dark:border-white/10 p-12 text-center">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-40 mx-auto mb-3">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="9" y1="13" x2="15" y2="13"/>
            <line x1="9" y1="17" x2="12" y2="17"/>
          </svg>
          <p className="text-sm text-gray-500 dark:text-gray-400">No quotations have been sent to you yet.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {data.map((q: Quotation, index: number) => (
            <div
              key={q._id}
              className="rounded-lg border border-gray-200 dark:border-white/10 p-4 hover:border-gray-300 dark:hover:border-white/20 transition-colors"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                      Quotation
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{q.title || "Untitled"}</h3>
                  {q.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{q.description}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {q.createdAt && (
                    <p>Sent on {new Date(q.createdAt).toLocaleDateString()}</p>
                  )}
                </div>

                {q.fileUrl && (
                  <a
                    href={`/api/quotations/${q._id}`}
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors
                      border border-gray-200 dark:border-white/10
                      bg-white dark:bg-white/5
                      text-gray-700 dark:text-gray-300
                      hover:border-gray-400 dark:hover:border-white/30
                      hover:text-gray-900 dark:hover:text-white"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                      <polyline points="15 3 21 3 21 9"/>
                      <line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                    Download PDF
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}