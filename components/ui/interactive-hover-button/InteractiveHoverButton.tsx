// "use client"

// import React, { useRef } from "react"
// import { cn } from "@/lib/utils"

// interface Props {
//   text?: string
//   className?: string
// }

// export default function InteractiveHoverButton({
//   text = "Button",
//   className
// }: Props) {
//   const buttonRef = useRef<HTMLButtonElement>(null)

//   return (
//     <button
//       ref={buttonRef}
//       className={cn(
//         "group bg-background relative w-auto cursor-pointer overflow-hidden rounded-full border p-2 px-6 text-center font-semibold",
//         className
//       )}
//     >
//       <div className="flex items-center gap-2">
//         <div className="bg-primary size-2 scale-100 rounded-lg transition-all duration-300 group-hover:scale-[100.8]" />
//         <span className="inline-block whitespace-nowrap transition-all duration-300 group-hover:translate-x-12 group-hover:opacity-0">
//           {text}
//         </span>
//       </div>

//       <div className="text-primary-foreground absolute top-0 z-10 flex size-full translate-x-12 items-center justify-center gap-2 opacity-0 transition-all duration-300 group-hover:-translate-x-5 group-hover:opacity-100">
//         <span className="whitespace-nowrap">{text}</span>
//         <svg
//           xmlns="http://www.w3.org/2000/svg"
//           width="24"
//           height="24"
//           viewBox="0 0 24 24"
//           fill="none"
//           stroke="currentColor"
//           strokeWidth="2"
//           strokeLinecap="round"
//           strokeLinejoin="round"
//           className="lucide lucide-arrow-right"
//         >
//           <path d="M5 12h14" />
//           <path d="m12 5 7 7-7 7" />
//         </svg>
//       </div>
//     </button>
//   )
// }


"use client"

import React, { useRef } from "react"
import { cn } from "@/lib/utils"

interface Props {
  text?: string
  className?: string
}

export default function InteractiveHoverButton({
  text = "Button",
  className
}: Props) {
  const buttonRef = useRef<HTMLButtonElement>(null)

  return (
    <button
      ref={buttonRef}
      className={cn(
        "group relative overflow-hidden border border-white  bg-black px-6 py-3 font-semibold text-white transition-all duration-300",
        "hover:bg-white hover:text-black",
        className="rounded-[10px]"
      )}
    >
      {/* Default text */}
      <span className="block transition-all duration-300 group-hover:opacity-0 group-hover:translate-x-4">
        Contact
      </span>

      {/* Hover text */}
      <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:-translate-x-0">
        Contact
      </span>
    </button>
  )
}