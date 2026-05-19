// "use client";

// import { useEffect, useState } from "react";
// import { Home, User, Search, Sun, Moon } from "lucide-react";
// import { useTheme } from "next-themes";
// import Link from "next/link";

// const SiteNav = () => {
//   const { theme, resolvedTheme, setTheme } = useTheme();
//   const [mounted, setMounted] = useState(false);

//   useEffect(() => {
//     setMounted(true);
//   }, []);

//   // SVG geometry constants — keep JS layout in sync with the rail path
//   const RAIL_TOP = 40;        // y of the straight top rail
//   const RAIL_BOTTOM = 63.5;     // y of the dipped notch bottom
//   const NOTCH_LEFT = 535;       // x where the left curve starts dipping
//   const NOTCH_RIGHT = 1375;     // x where the right curve ends
//   const NOTCH_INNER_LEFT = 590; // x where bottom flat begins
//   const NOTCH_INNER_RIGHT = 1305; // x where bottom flat ends
//   const VB_WIDTH = 1920;
//   const VB_HEIGHT = 73;
//   const GAP = 6; // spacing between the two parallel rail lines

//   // Build the inner (offset) path that mirrors the outer rail, shifted down by GAP
//   const innerTop = RAIL_TOP + GAP;
//   const innerBottom = RAIL_BOTTOM + GAP;
//   const navCenterY = ((RAIL_TOP + innerBottom) / 2 / (VB_HEIGHT + GAP)) * 80;

//   return (
//     <header className="fixed top-0 inset-x-0 z-50 h-20 pointer-events-none">
//       <svg
//         aria-hidden="true"
//         className="absolute inset-0 hidden h-full w-full text-border md:block"
//         viewBox={`0 0 ${VB_WIDTH} ${VB_HEIGHT + GAP}`}
//         preserveAspectRatio="none"
//       >
//         <defs>
//           {/* Trail gradients in user space — cyan anchored at the notch end, fading to white at the edges */}
//           <linearGradient id="nav-trail-left" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={NOTCH_INNER_LEFT} y2="0">
//             <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
//             <stop offset="60%" stopColor="#ffffff" stopOpacity="0.95" />
//             <stop offset="100%" stopColor="#06b6d4" stopOpacity="1" />
//           </linearGradient>
//           <linearGradient id="nav-trail-right" gradientUnits="userSpaceOnUse" x1={NOTCH_INNER_RIGHT} y1="0" x2={VB_WIDTH} y2="0">
//             <stop offset="0%" stopColor="#06b6d4" stopOpacity="1" />
//             <stop offset="40%" stopColor="#ffffff" stopOpacity="0.95" />
//             <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
//           </linearGradient>
//         </defs>

//         {/* Top horizontal divider */}
//         <path d={`M0 .5H${VB_WIDTH}`} fill="none" stroke="currentColor" strokeOpacity="0.6" />

//         {/* Outer rail with center notch */}
//         <path
//           d={`M0 ${RAIL_TOP}H${NOTCH_LEFT}C${NOTCH_LEFT + 38} ${RAIL_TOP} ${NOTCH_LEFT + 32} ${RAIL_BOTTOM} ${NOTCH_INNER_LEFT} ${RAIL_BOTTOM}H${NOTCH_INNER_RIGHT}C${NOTCH_INNER_RIGHT + 50} ${RAIL_BOTTOM} ${NOTCH_RIGHT - 38} ${RAIL_TOP} ${NOTCH_RIGHT} ${RAIL_TOP}H${VB_WIDTH}`}
//           fill="none"
//           stroke="currentColor"
//           strokeOpacity="0.55"
//         />

//         {/* Inner rail (parallel, slightly offset) */}
//         <path
//           d={`M0 ${innerTop}H${NOTCH_LEFT - GAP}C${NOTCH_LEFT + 32} ${innerTop} ${NOTCH_LEFT + 26} ${innerBottom} ${NOTCH_INNER_LEFT} ${innerBottom}H${NOTCH_INNER_RIGHT}C${NOTCH_INNER_RIGHT + 56} ${innerBottom} ${NOTCH_RIGHT - 32} ${innerTop} ${NOTCH_RIGHT + GAP} ${innerTop}H${VB_WIDTH}`}
//           fill="none"
//           stroke="currentColor"
//           strokeOpacity="0.35"
//         />

//         {/* === Cyan trains emanating from both sides of the notch === */}
//         {/* Path direction: starts at the notch and runs outward, so the dash animates away from the notch. */}
//         {(() => {
//           const DASH = 420;       // length of the visible trail
//           const GAP_DASH = 2400;  // long gap so only one head is visible per cycle
//           const CYCLE = DASH + GAP_DASH;
//           const DUR = "3.2s";

//           const CENTER_X = (NOTCH_INNER_LEFT + NOTCH_INNER_RIGHT) / 2;
//           // Midline between outer rail (y=RAIL_TOP/RAIL_BOTTOM) and inner rail (y=innerTop/innerBottom)
//           const MID_TOP = (RAIL_TOP + innerTop) / 2;
//           const MID_BOTTOM = (RAIL_BOTTOM + innerBottom) / 2;
//           const MID_NOTCH_LEFT = NOTCH_LEFT - GAP / 2;
//           const MID_NOTCH_RIGHT = NOTCH_RIGHT + GAP / 2;

//           // Single trail per side, running along the midline between the two rails
//           const leftMid = `M${CENTER_X} ${MID_BOTTOM}H${NOTCH_INNER_LEFT}C${NOTCH_LEFT + 29} ${MID_BOTTOM} ${NOTCH_LEFT + 35} ${MID_TOP} ${MID_NOTCH_LEFT} ${MID_TOP}H0`;
//           const rightMid = `M${CENTER_X} ${MID_BOTTOM}H${NOTCH_INNER_RIGHT}C${NOTCH_INNER_RIGHT + 53} ${MID_BOTTOM} ${NOTCH_RIGHT - 35} ${MID_TOP} ${MID_NOTCH_RIGHT} ${MID_TOP}H${VB_WIDTH}`;

//           const trail = (d: string, gradId: string, key: string) => (
//             <path
//               key={key}
//               d={d}
//               fill="none"
//               stroke={`url(#${gradId})`}
//               strokeWidth={2}
//               strokeLinecap="round"
//               strokeDasharray={`${DASH} ${GAP_DASH}`}
//             >
//               <animate
//                 attributeName="stroke-dashoffset"
//                 from="0"
//                 to={`-${CYCLE}`}
//                 dur={DUR}
//                 repeatCount="indefinite"
//               />
//             </path>
//           );

//           return (
//             <>
//               {trail(leftMid, "nav-trail-left", "lm")}
//               {trail(rightMid, "nav-trail-right", "rm")}
//             </>
//           );
//         })()}
//       </svg>

//       {/* Center the nav inside the full double-line notch channel. */}
//       <div className="absolute inset-0 flex justify-center">
//         <div
//           className="site-nav-center pointer-events-auto absolute left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center"
//         >
          
//         </div>
//       </div>
//       <style jsx>{`
//         .site-nav-center {
//           top: ${navCenterY}px;
//         }
//       `}</style>
//     </header>
//   );
// };

// export default SiteNav;


// "use client";

// import { useEffect, useState } from "react";

// const SiteNav = () => {
//   // SVG geometry constants
//   const VB_WIDTH = 1920;
//   const VB_HEIGHT = 80; // total viewBox height

//   // Rail lines
//   const RAIL_TOP = 40;
//   const RAIL_BOTTOM = 64;
//   const GAP = 6; // gap between the two parallel rail lines

//   // Notch is ALWAYS centered — defined as fractions of VB_WIDTH
//   const NOTCH_HALF_OUTER = 430;   // half-width of the outer notch mouth
//   const NOTCH_HALF_INNER = 360;   // half-width of the flat bottom
//   const CX = VB_WIDTH / 2;        // center x = 960

//   const NOTCH_LEFT        = CX - NOTCH_HALF_OUTER;   // 530
//   const NOTCH_RIGHT       = CX + NOTCH_HALF_OUTER;   // 1390
//   const NOTCH_INNER_LEFT  = CX - NOTCH_HALF_INNER;   // 600
//   const NOTCH_INNER_RIGHT = CX + NOTCH_HALF_INNER;   // 1320

//   const innerTop    = RAIL_TOP + GAP;
//   const innerBottom = RAIL_BOTTOM + GAP;

//   // Midline between the two rails (used for the animated trail)
//   const MID_TOP    = (RAIL_TOP + innerTop) / 2;
//   const MID_BOTTOM = (RAIL_BOTTOM + innerBottom) / 2;
//   const MID_NOTCH_LEFT  = NOTCH_LEFT  - GAP / 2;
//   const MID_NOTCH_RIGHT = NOTCH_RIGHT + GAP / 2;

//   // Paths
//   const outerRailPath = `M0 ${RAIL_TOP}H${NOTCH_LEFT}` +
//     `C${NOTCH_LEFT + 38} ${RAIL_TOP} ${NOTCH_LEFT + 32} ${RAIL_BOTTOM} ${NOTCH_INNER_LEFT} ${RAIL_BOTTOM}` +
//     `H${NOTCH_INNER_RIGHT}` +
//     `C${NOTCH_INNER_RIGHT + 50} ${RAIL_BOTTOM} ${NOTCH_RIGHT - 38} ${RAIL_TOP} ${NOTCH_RIGHT} ${RAIL_TOP}` +
//     `H${VB_WIDTH}`;

//   const innerRailPath = `M0 ${innerTop}H${NOTCH_LEFT - GAP}` +
//     `C${NOTCH_LEFT + 32} ${innerTop} ${NOTCH_LEFT + 26} ${innerBottom} ${NOTCH_INNER_LEFT} ${innerBottom}` +
//     `H${NOTCH_INNER_RIGHT}` +
//     `C${NOTCH_INNER_RIGHT + 56} ${innerBottom} ${NOTCH_RIGHT - 32} ${innerTop} ${NOTCH_RIGHT + GAP} ${innerTop}` +
//     `H${VB_WIDTH}`;

//   const leftTrailPath  = `M${CX} ${MID_BOTTOM}H${NOTCH_INNER_LEFT}C${NOTCH_LEFT + 29} ${MID_BOTTOM} ${NOTCH_LEFT + 35} ${MID_TOP} ${MID_NOTCH_LEFT} ${MID_TOP}H0`;
//   const rightTrailPath = `M${CX} ${MID_BOTTOM}H${NOTCH_INNER_RIGHT}C${NOTCH_INNER_RIGHT + 53} ${MID_BOTTOM} ${NOTCH_RIGHT - 35} ${MID_TOP} ${MID_NOTCH_RIGHT} ${MID_TOP}H${VB_WIDTH}`;

//   const DASH      = 420;
//   const GAP_DASH  = 2400;
//   const CYCLE     = DASH + GAP_DASH;
//   const DUR       = "3.2s";

//   return (
//     <header className="fixed top-0 inset-x-0 z-50 pointer-events-none" style={{ height: `${VB_HEIGHT + GAP}px` }}>
//       {/* SVG rail — stretches full width, pixel-perfect height */}
//       <svg
//         aria-hidden="true"
//         className="absolute inset-0 hidden w-full md:block text-border"
//         style={{ height: `${VB_HEIGHT + GAP}px` }}
//         viewBox={`0 0 ${VB_WIDTH} ${VB_HEIGHT + GAP}`}
//         preserveAspectRatio="none"
//       >
//         <defs>
//           <linearGradient id="nav-trail-left" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={NOTCH_INNER_LEFT} y2="0">
//             <stop offset="0%"   stopColor="#ffffff" stopOpacity="0" />
//             <stop offset="60%"  stopColor="#ffffff" stopOpacity="0.95" />
//             <stop offset="100%" stopColor="#06b6d4" stopOpacity="1" />
//           </linearGradient>
//           <linearGradient id="nav-trail-right" gradientUnits="userSpaceOnUse" x1={NOTCH_INNER_RIGHT} y1="0" x2={VB_WIDTH} y2="0">
//             <stop offset="0%"   stopColor="#06b6d4" stopOpacity="1" />
//             <stop offset="40%"  stopColor="#ffffff" stopOpacity="0.95" />
//             <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
//           </linearGradient>
//         </defs>

//         {/* Top horizontal divider */}
//         <path d={`M0 .5H${VB_WIDTH}`} fill="none" stroke="currentColor" strokeOpacity="0.6" />

//         {/* Outer rail */}
//         <path d={outerRailPath} fill="none" stroke="currentColor" strokeOpacity="0.55" />

//         {/* Inner rail */}
//         <path d={innerRailPath} fill="none" stroke="currentColor" strokeOpacity="0.35" />

//         {/* Animated cyan trails */}
//         {[
//           { d: leftTrailPath,  grad: "nav-trail-left",  key: "lm" },
//           { d: rightTrailPath, grad: "nav-trail-right", key: "rm" },
//         ].map(({ d, grad, key }) => (
//           <path
//             key={key}
//             d={d}
//             fill="none"
//             stroke={`url(#${grad})`}
//             strokeWidth={2}
//             strokeLinecap="round"
//             strokeDasharray={`${DASH} ${GAP_DASH}`}
//           >
//             <animate
//               attributeName="stroke-dashoffset"
//               from="0"
//               to={`-${CYCLE}`}
//               dur={DUR}
//               repeatCount="indefinite"
//             />
//           </path>
//         ))}
//       </svg>

//       {/*
//         Nav content sits inside the notch.
//         We use CSS to pin it to the vertical midpoint of the double-rail channel:
//           - The notch bottom (innerBottom) in SVG user units = RAIL_BOTTOM + GAP = 70
//           - The notch top (RAIL_TOP) = 40
//           - Midpoint = (40 + 70) / 2 = 55 px  (1:1 because height is fixed, not scaled)
//         We use `top` as a fixed pixel value matching the SVG midpoint.
//       */}
//       <nav
//         aria-label="Main navigation"
//         className="pointer-events-auto absolute left-1/2 -translate-x-1/2 flex items-center gap-6"
//         style={{ top: `${(RAIL_TOP + innerBottom) / 2}px`, transform: "translate(-50%, -50%)" }}
//       >
//         {/* ↓ Drop your nav links / logo / buttons here */}
//       </nav>
//     </header>
//   );
// };

// export default SiteNav;






// // "use client";

// // const SiteNav = () => {
// //   const VB_WIDTH = 1920;
// //   const VB_HEIGHT = 80;

// //   const RAIL_TOP = 40;
// //   const RAIL_BOTTOM = 64;
// //   const GAP = 6;

// //   const NOTCH_HALF_OUTER = 430;
// //   const NOTCH_HALF_INNER = 360;
// //   const CX = VB_WIDTH / 2; // 960

// //   const NOTCH_LEFT        = CX - NOTCH_HALF_OUTER; // 530
// //   const NOTCH_RIGHT       = CX + NOTCH_HALF_OUTER; // 1390
// //   const NOTCH_INNER_LEFT  = CX - NOTCH_HALF_INNER; // 600
// //   const NOTCH_INNER_RIGHT = CX + NOTCH_HALF_INNER; // 1320

// //   const innerTop    = RAIL_TOP + GAP;    // 46
// //   const innerBottom = RAIL_BOTTOM + GAP; // 70

// //   const MID_TOP    = (RAIL_TOP + innerTop) / 2;
// //   const MID_BOTTOM = (RAIL_BOTTOM + innerBottom) / 2;
// //   const MID_NOTCH_LEFT  = NOTCH_LEFT  - GAP / 2;
// //   const MID_NOTCH_RIGHT = NOTCH_RIGHT + GAP / 2;

// //   const outerRailPath =
// //     `M0 ${RAIL_TOP}H${NOTCH_LEFT}` +
// //     `C${NOTCH_LEFT+38} ${RAIL_TOP} ${NOTCH_LEFT+32} ${RAIL_BOTTOM} ${NOTCH_INNER_LEFT} ${RAIL_BOTTOM}` +
// //     `H${NOTCH_INNER_RIGHT}` +
// //     `C${NOTCH_INNER_RIGHT+50} ${RAIL_BOTTOM} ${NOTCH_RIGHT-38} ${RAIL_TOP} ${NOTCH_RIGHT} ${RAIL_TOP}` +
// //     `H${VB_WIDTH}`;

// //   const innerRailPath =
// //     `M0 ${innerTop}H${NOTCH_LEFT-GAP}` +
// //     `C${NOTCH_LEFT+32} ${innerTop} ${NOTCH_LEFT+26} ${innerBottom} ${NOTCH_INNER_LEFT} ${innerBottom}` +
// //     `H${NOTCH_INNER_RIGHT}` +
// //     `C${NOTCH_INNER_RIGHT+56} ${innerBottom} ${NOTCH_RIGHT-32} ${innerTop} ${NOTCH_RIGHT+GAP} ${innerTop}` +
// //     `H${VB_WIDTH}`;

// //   // ✅ THE FIX: Closed filled path tracing BETWEEN the two rails.
// //   // Follows outer rail DOWN into notch → across bottom → back UP along inner rail.
// //   // No rectangular box, no bleeding edges — matches the curves exactly.
// //   const notchFillPath =
// //     `M${NOTCH_LEFT} ${RAIL_TOP}` +
// //     `C${NOTCH_LEFT+38} ${RAIL_TOP} ${NOTCH_LEFT+32} ${RAIL_BOTTOM} ${NOTCH_INNER_LEFT} ${RAIL_BOTTOM}` +
// //     `H${NOTCH_INNER_RIGHT}` +
// //     `C${NOTCH_INNER_RIGHT+50} ${RAIL_BOTTOM} ${NOTCH_RIGHT-38} ${RAIL_TOP} ${NOTCH_RIGHT} ${RAIL_TOP}` +
// //     `H${NOTCH_RIGHT+GAP}` +
// //     `C${NOTCH_RIGHT-32} ${innerTop} ${NOTCH_INNER_RIGHT+56} ${innerBottom} ${NOTCH_INNER_RIGHT} ${innerBottom}` +
// //     `H${NOTCH_INNER_LEFT}` +
// //     `C${NOTCH_LEFT+26} ${innerBottom} ${NOTCH_LEFT+32} ${innerTop} ${NOTCH_LEFT-GAP} ${innerTop}` +
// //     `H${NOTCH_LEFT} Z`;

// //   const leftTrailPath  = `M${CX} ${MID_BOTTOM}H${NOTCH_INNER_LEFT}C${NOTCH_LEFT+29} ${MID_BOTTOM} ${NOTCH_LEFT+35} ${MID_TOP} ${MID_NOTCH_LEFT} ${MID_TOP}H0`;
// //   const rightTrailPath = `M${CX} ${MID_BOTTOM}H${NOTCH_INNER_RIGHT}C${NOTCH_INNER_RIGHT+53} ${MID_BOTTOM} ${NOTCH_RIGHT-35} ${MID_TOP} ${MID_NOTCH_RIGHT} ${MID_TOP}H${VB_WIDTH}`;

// //   const DASH = 420, GAP_DASH = 2400, CYCLE = DASH + GAP_DASH, DUR = "3.2s";
// //   const navCenterY = (RAIL_TOP + innerBottom) / 2; // 55px

// //   return (
// //     <header className="fixed top-0 inset-x-0 z-50 pointer-events-none"
// //       style={{ height: `${VB_HEIGHT + GAP}px` }}>
// //       <svg aria-hidden="true"
// //         className="absolute inset-0 hidden w-full md:block"
// //         style={{ height: `${VB_HEIGHT + GAP}px` }}
// //         viewBox={`0 0 ${VB_WIDTH} ${VB_HEIGHT + GAP}`}
// //         preserveAspectRatio="none">
// //         <defs>
// //           <linearGradient id="nav-trail-left" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={NOTCH_INNER_LEFT} y2="0">
// //             <stop offset="0%"   stopColor="#ffffff" stopOpacity="0" />
// //             <stop offset="60%"  stopColor="#ffffff" stopOpacity="0.95" />
// //             <stop offset="100%" stopColor="#06b6d4" stopOpacity="1" />
// //           </linearGradient>
// //           <linearGradient id="nav-trail-right" gradientUnits="userSpaceOnUse" x1={NOTCH_INNER_RIGHT} y1="0" x2={VB_WIDTH} y2="0">
// //             <stop offset="0%"   stopColor="#06b6d4" stopOpacity="1" />
// //             <stop offset="40%"  stopColor="#ffffff" stopOpacity="0.95" />
// //             <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
// //           </linearGradient>
// //         </defs>

// //         <path d={`M0 .5H${VB_WIDTH}`} fill="none" stroke="currentColor" strokeOpacity="0.6" />

// //         {/* ✅ Curved notch background — no rectangular overflow */}
// //         <path d={notchFillPath} fill="#000000" fillOpacity="0.92" stroke="none" />

// //         <path d={outerRailPath} fill="none" stroke="#22d3ee" strokeOpacity="0.55" />
// //         <path d={innerRailPath} fill="none" stroke="#22d3ee" strokeOpacity="0.35" />

// //         {[
// //           { d: leftTrailPath,  grad: "nav-trail-left",  key: "lm" },
// //           { d: rightTrailPath, grad: "nav-trail-right", key: "rm" },
// //         ].map(({ d, grad, key }) => (
// //           <path key={key} d={d} fill="none" stroke={`url(#${grad})`}
// //             strokeWidth={2} strokeLinecap="round"
// //             strokeDasharray={`${DASH} ${GAP_DASH}`}>
// //             <animate attributeName="stroke-dashoffset"
// //               from="0" to={`-${CYCLE}`} dur={DUR} repeatCount="indefinite"/>
// //           </path>
// //         ))}
// //       </svg>

// //       <nav aria-label="Main navigation"
// //         className="pointer-events-auto absolute left-1/2 flex items-center gap-6"
// //         style={{ top: `${navCenterY}px`, transform: "translate(-50%, -50%)" }}>
// //         {/* Your nav links go here */}
// //       </nav>
// //     </header>
// //   );
// // };

// // export default SiteNav;





// // "use client";

// // import { useEffect, useRef, useState } from "react";

// // interface SiteNavProps {
// //   notchLeft?: number;
// //   notchRight?: number;
// //   viewportWidth?: number;
// // }

// // const SiteNav = ({ notchLeft, notchRight, viewportWidth }: SiteNavProps) => {
// //   const VB_HEIGHT = 80;
// //   const RAIL_TOP = 40;
// //   const RAIL_BOTTOM = 64;
// //   const GAP = 6;

// //   // Use passed props or fall back to centered defaults
// //   const VB_WIDTH = viewportWidth ?? 1920;
// //   const CX = VB_WIDTH / 2;

// //   // If notchLeft/notchRight are passed (in real px), use them directly in viewBox space
// //   // Otherwise fall back to symmetric defaults
// //   const NOTCH_LEFT  = notchLeft  ?? CX - 430;
// //   const NOTCH_RIGHT = notchRight ?? CX + 430;

// //   // Inner notch edges (slightly tighter than outer)
// //   const INSET = 70;
// //   const NOTCH_INNER_LEFT  = NOTCH_LEFT  + INSET;
// //   const NOTCH_INNER_RIGHT = NOTCH_RIGHT - INSET;

// //   const innerTop    = RAIL_TOP    + GAP; // 46
// //   const innerBottom = RAIL_BOTTOM + GAP; // 70

// //   const MID_TOP          = (RAIL_TOP    + innerTop)    / 2;
// //   const MID_BOTTOM       = (RAIL_BOTTOM + innerBottom) / 2;
// //   const MID_NOTCH_LEFT   = NOTCH_LEFT  - GAP / 2;
// //   const MID_NOTCH_RIGHT  = NOTCH_RIGHT + GAP / 2;

// //   const outerRailPath =
// //     `M0 ${RAIL_TOP}H${NOTCH_LEFT}` +
// //     `C${NOTCH_LEFT + 38} ${RAIL_TOP} ${NOTCH_LEFT + 32} ${RAIL_BOTTOM} ${NOTCH_INNER_LEFT} ${RAIL_BOTTOM}` +
// //     `H${NOTCH_INNER_RIGHT}` +
// //     `C${NOTCH_INNER_RIGHT + 50} ${RAIL_BOTTOM} ${NOTCH_RIGHT - 38} ${RAIL_TOP} ${NOTCH_RIGHT} ${RAIL_TOP}` +
// //     `H${VB_WIDTH}`;

// //   const innerRailPath =
// //     `M0 ${innerTop}H${NOTCH_LEFT - GAP}` +
// //     `C${NOTCH_LEFT + 32} ${innerTop} ${NOTCH_LEFT + 26} ${innerBottom} ${NOTCH_INNER_LEFT} ${innerBottom}` +
// //     `H${NOTCH_INNER_RIGHT}` +
// //     `C${NOTCH_INNER_RIGHT + 56} ${innerBottom} ${NOTCH_RIGHT - 32} ${innerTop} ${NOTCH_RIGHT + GAP} ${innerTop}` +
// //     `H${VB_WIDTH}`;

// //   const notchFillPath =
// //     `M${NOTCH_LEFT} ${RAIL_TOP}` +
// //     `C${NOTCH_LEFT + 38} ${RAIL_TOP} ${NOTCH_LEFT + 32} ${RAIL_BOTTOM} ${NOTCH_INNER_LEFT} ${RAIL_BOTTOM}` +
// //     `H${NOTCH_INNER_RIGHT}` +
// //     `C${NOTCH_INNER_RIGHT + 50} ${RAIL_BOTTOM} ${NOTCH_RIGHT - 38} ${RAIL_TOP} ${NOTCH_RIGHT} ${RAIL_TOP}` +
// //     `H${NOTCH_RIGHT + GAP}` +
// //     `C${NOTCH_RIGHT - 32} ${innerTop} ${NOTCH_INNER_RIGHT + 56} ${innerBottom} ${NOTCH_INNER_RIGHT} ${innerBottom}` +
// //     `H${NOTCH_INNER_LEFT}` +
// //     `C${NOTCH_LEFT + 26} ${innerBottom} ${NOTCH_LEFT + 32} ${innerTop} ${NOTCH_LEFT - GAP} ${innerTop}` +
// //     `H${NOTCH_LEFT} Z`;

// //   const leftTrailPath  = `M${CX} ${MID_BOTTOM}H${NOTCH_INNER_LEFT}C${NOTCH_LEFT + 29} ${MID_BOTTOM} ${NOTCH_LEFT + 35} ${MID_TOP} ${MID_NOTCH_LEFT} ${MID_TOP}H0`;
// //   const rightTrailPath = `M${CX} ${MID_BOTTOM}H${NOTCH_INNER_RIGHT}C${NOTCH_INNER_RIGHT + 53} ${MID_BOTTOM} ${NOTCH_RIGHT - 35} ${MID_TOP} ${MID_NOTCH_RIGHT} ${MID_TOP}H${VB_WIDTH}`;

// //   const DASH = 420, GAP_DASH = 2400, CYCLE = DASH + GAP_DASH, DUR = "3.2s";

// //   return (
// //     <svg
// //       aria-hidden="true"
// //       className="absolute inset-0 hidden w-full md:block"
// //       style={{ height: `${VB_HEIGHT + GAP}px` }}
// //       viewBox={`0 0 ${VB_WIDTH} ${VB_HEIGHT + GAP}`}
// //       preserveAspectRatio="none"
// //     >
// //       <defs>
// //         <linearGradient id="nav-trail-left" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={NOTCH_INNER_LEFT} y2="0">
// //           <stop offset="0%"   stopColor="#ffffff" stopOpacity="0" />
// //           <stop offset="60%"  stopColor="#ffffff" stopOpacity="0.95" />
// //           <stop offset="100%" stopColor="#06b6d4" stopOpacity="1" />
// //         </linearGradient>
// //         <linearGradient id="nav-trail-right" gradientUnits="userSpaceOnUse" x1={NOTCH_INNER_RIGHT} y1="0" x2={VB_WIDTH} y2="0">
// //           <stop offset="0%"   stopColor="#06b6d4" stopOpacity="1" />
// //           <stop offset="40%"  stopColor="#ffffff" stopOpacity="0.95" />
// //           <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
// //         </linearGradient>
// //       </defs>

// //       <path d={`M0 .5H${VB_WIDTH}`} fill="none" stroke="currentColor" strokeOpacity="0.6" />

// //       <path d={notchFillPath} fill="#000000" fillOpacity="0.92" stroke="none" />

// //       <path d={outerRailPath} fill="none" stroke="#22d3ee" strokeOpacity="0.55" />
// //       <path d={innerRailPath} fill="none" stroke="#22d3ee" strokeOpacity="0.35" />

// //       {[
// //         { d: leftTrailPath,  grad: "nav-trail-left",  key: "lm" },
// //         { d: rightTrailPath, grad: "nav-trail-right", key: "rm" },
// //       ].map(({ d, grad, key }) => (
// //         <path key={key} d={d} fill="none" stroke={`url(#${grad})`}
// //           strokeWidth={2} strokeLinecap="round"
// //           strokeDasharray={`${DASH} ${GAP_DASH}`}>
// //           <animate attributeName="stroke-dashoffset"
// //             from="0" to={`-${CYCLE}`} dur={DUR} repeatCount="indefinite" />
// //         </path>
// //       ))}
// //     </svg>
// //   );
// // };

// // export default SiteNav;



"use client";

import { useEffect, useRef, useState } from "react";

interface SiteNavProps {
  notchLeft?: number;
  notchRight?: number;
  viewportWidth?: number;
}

const SiteNav = ({ notchLeft, notchRight, viewportWidth }: SiteNavProps) => {
  const VB_HEIGHT = 80;
  const RAIL_TOP = 40;
  const RAIL_BOTTOM = 64;
  const GAP = 6;

  // Use passed props or fall back to centered defaults
  const VB_WIDTH = (viewportWidth) ?? 1920;
  const CX = VB_WIDTH / 2;

  // If notchLeft/notchRight are passed (in real px), use them directly in viewBox space
  // Otherwise fall back to symmetric defaults
  const NOTCH_LEFT  = notchLeft  ?? CX - 430;
  const NOTCH_RIGHT = notchRight ?? CX + 430;

  // Inner notch edges (slightly tighter than outer)
  const INSET = 70;
  const NOTCH_INNER_LEFT  = NOTCH_LEFT  + INSET;
  const NOTCH_INNER_RIGHT = NOTCH_RIGHT - INSET;

  const innerTop    = RAIL_TOP    + GAP; // 46
  const innerBottom = RAIL_BOTTOM + GAP; // 70

  const MID_TOP          = (RAIL_TOP    + innerTop)    / 2;
  const MID_BOTTOM       = ((RAIL_BOTTOM + innerBottom) / 2);
  const MID_NOTCH_LEFT   = NOTCH_LEFT  - GAP / 2;
  const MID_NOTCH_RIGHT  = NOTCH_RIGHT + GAP / 2;

  const outerRailPath =
    `M0 ${RAIL_TOP}H${NOTCH_LEFT}` +
    `C${NOTCH_LEFT + 38} ${RAIL_TOP} ${NOTCH_LEFT + 32} ${RAIL_BOTTOM} ${NOTCH_INNER_LEFT} ${RAIL_BOTTOM}` +
    `H${NOTCH_INNER_RIGHT}` +
    `C${NOTCH_INNER_RIGHT + 50} ${RAIL_BOTTOM} ${NOTCH_RIGHT - 38} ${RAIL_TOP} ${NOTCH_RIGHT} ${RAIL_TOP}` +
    `H${VB_WIDTH}`;

  const innerRailPath =
    `M0 ${innerTop}H${NOTCH_LEFT - GAP}` +
    `C${NOTCH_LEFT + 32} ${innerTop} ${NOTCH_LEFT + 26} ${innerBottom} ${NOTCH_INNER_LEFT} ${innerBottom}` +
    `H${NOTCH_INNER_RIGHT}` +
    `C${NOTCH_INNER_RIGHT + 56} ${innerBottom} ${NOTCH_RIGHT - 32} ${innerTop} ${NOTCH_RIGHT + GAP} ${innerTop}` +
    `H${VB_WIDTH}`;

  const notchFillPath =
    `M${NOTCH_LEFT} ${RAIL_TOP}` +
    `C${NOTCH_LEFT + 38} ${RAIL_TOP} ${NOTCH_LEFT + 32} ${RAIL_BOTTOM} ${NOTCH_INNER_LEFT} ${RAIL_BOTTOM}` +
    `H${NOTCH_INNER_RIGHT}` +
    `C${NOTCH_INNER_RIGHT + 50} ${RAIL_BOTTOM} ${NOTCH_RIGHT - 38} ${RAIL_TOP} ${NOTCH_RIGHT} ${RAIL_TOP}` +
    `H${NOTCH_RIGHT + GAP}` +
    `C${NOTCH_RIGHT - 32} ${innerTop} ${NOTCH_INNER_RIGHT + 56} ${innerBottom} ${NOTCH_INNER_RIGHT} ${innerBottom}` +
    `H${NOTCH_INNER_LEFT}` +
    `C${NOTCH_LEFT + 26} ${innerBottom} ${NOTCH_LEFT + 32} ${innerTop} ${NOTCH_LEFT - GAP} ${innerTop}` +
    `H${NOTCH_LEFT} Z`;

  const leftTrailPath  = `M${CX} ${MID_BOTTOM}H${NOTCH_INNER_LEFT}C${NOTCH_LEFT + 29} ${MID_BOTTOM} ${NOTCH_LEFT + 35} ${MID_TOP} ${MID_NOTCH_LEFT} ${MID_TOP}H0`;
  const rightTrailPath = `M${CX} ${MID_BOTTOM}H${NOTCH_INNER_RIGHT}C${NOTCH_INNER_RIGHT + 53} ${MID_BOTTOM} ${NOTCH_RIGHT - 35} ${MID_TOP} ${MID_NOTCH_RIGHT} ${MID_TOP}H${VB_WIDTH}`;

  const DASH = 420, GAP_DASH = 2400, CYCLE = DASH + GAP_DASH, DUR = "3.2s";

  return (
    <svg
      aria-hidden="true"
      className="absolute inset-0 hidden w-full md:block"
      style={{ height: `${VB_HEIGHT+2 + GAP}px` }}
      viewBox={`0 0 ${VB_WIDTH} ${VB_HEIGHT + GAP}`}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="nav-trail-left" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={NOTCH_INNER_LEFT} y2="0">
          <stop offset="0%"   stopColor="#ffffff" stopOpacity="0" />
          <stop offset="60%"  stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="1" />
        </linearGradient>
        <linearGradient id="nav-trail-right" gradientUnits="userSpaceOnUse" x1={NOTCH_INNER_RIGHT} y1="0" x2={VB_WIDTH} y2="0">
          <stop offset="0%"   stopColor="#06b6d4" stopOpacity="1" />
          <stop offset="40%"  stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      <path d={`M0 .5H${VB_WIDTH}`} fill="none" stroke="currentColor" strokeOpacity="0.6" />

      <path d={notchFillPath} fill="none" fillOpacity="0.92" stroke="none" />

      <path d={outerRailPath} fill="none" stroke="#22d3ee" strokeOpacity="0.55" />
      <path d={innerRailPath} fill="none" stroke="#22d3ee" strokeOpacity="0.35" />

      {[
        { d: leftTrailPath,  grad: "nav-trail-left",  key: "lm" },
        { d: rightTrailPath, grad: "nav-trail-right", key: "rm" },
      ].map(({ d, grad, key }) => (
        <path key={key} d={d} fill="none" stroke={`url(#${grad})`}
          strokeWidth={2} strokeLinecap="round"
          strokeDasharray={`${DASH} ${GAP_DASH}`}>
          <animate attributeName="stroke-dashoffset"
            from="0" to={`-${CYCLE}`} dur={DUR} repeatCount="indefinite" />
        </path>
      ))}
    </svg>
  );
};

export default SiteNav;
