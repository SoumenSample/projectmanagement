//app/components/GridPattern.js
"use client";
import React, { useState, useEffect } from "react";

export default function CometGrid() {
  const [size, setSize] = useState({ width: 1920, height: 1080 });

  useEffect(() => {
    const updateSize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Grid dimensions
  const rowHeight = 60;
  const colWidth = 60;

  // Comet starting points (row -> cols)
  const rowToCols = {
    1: [2, 8, 14],
    2: [4, 10, 18],
    3: [6, 12],
    4: [16],
    5: [20],
  };

  const arcs = [];
  const totalRows = Math.floor(size.height / rowHeight);
  const totalCols = Math.floor(size.width / colWidth);
  const cometLaunchPoints = [];

  for (let row = 1; row <= totalRows; row++) {
    if (rowToCols[row]) {
      rowToCols[row].forEach((col) => {
        if (col <= totalCols) {
          const y = row * rowHeight;
          const x = col * colWidth;
          cometLaunchPoints.push({ col, x, y });
          // Decorative arcs
          arcs.push(
            `M${x} ${y - 20} Q${x} ${y} ${x + 20} ${y}`,
            `M${x} ${y - 20} Q${x} ${y} ${x - 20} ${y}`,
            `M${x - 20} ${y} Q${x} ${y} ${x} ${y + 20}`,
            `M${x + 20} ${y} Q${x} ${y} ${x} ${y + 20}`
          );
        }
      });
    }
  }

  return (
    <svg
      className="absolute inset-0 w-full h-full"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
    >
      <defs>
        {/* Background grid */}
        <pattern
          id="gridTile"
          width={colWidth}
          height={rowHeight}
          patternUnits="userSpaceOnUse"
        >
          <path
            d={`M0 0 H${colWidth} M0 0 V${rowHeight}`}
            fill="none"
            stroke="#4b5563"
            strokeWidth="1"
          />
        </pattern>

        {/* Gradient mask (top to bottom fade) */}
        <linearGradient id="fadeMask" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="white" stopOpacity="1" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <mask id="maskGradient">
          <rect width="100%" height="100%" fill="url(#fadeMask)" />
        </mask>

        {/* Glow filter for grid */}
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur1" />
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur2" />
          <feMerge>
            <feMergeNode in="blur1" />
            <feMergeNode in="blur2" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Comet glow */}
        <filter id="cometGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" />
        </filter>
      </defs>

      <g mask="url(#maskGradient)">
        {/* Grid background */}
        <rect width="100%" height="100%" fill="url(#gridTile)" />
        <path d={arcs.join(" ")} fill="none" stroke="#4b5563" />

        {/* Comets */}
        {cometLaunchPoints.map((pt, i) => (
          <g key={`${pt.col}-${pt.y}`}>
            {[...Array(10)].map((_, t) => (
              <circle
                key={t}
                cx={pt.x}
                cy={pt.y - t * 12} // space between tail segments
                r={6 - t * 0.5}    // gradually smaller circles
                fill="#7dd3fc"
                opacity={0.6 - t * 0.06} // gradually fading
                filter="url(#cometGlow)"
              >
                {/* Vertical movement */}
                <animate
                  attributeName="cy"
                  from={pt.y - t * 12}
                  to={size.height + 20 - t * 12}
                  dur="3s"
                  begin={`${i * 0.8}s`}
                  repeatCount="indefinite"
                />
                {/* Fade tail */}
                <animate
                  attributeName="opacity"
                  values={`${0.6 - t * 0.06};0`}
                  dur="3s"
                  begin={`${i * 0.8}s`}
                  repeatCount="indefinite"
                />
              </circle>
            ))}
          </g>
        ))}
      </g>
    </svg>
  );
}