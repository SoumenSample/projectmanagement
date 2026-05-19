"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import DottedMap from "dotted-map";

import { useTheme } from "next-themes";

interface MapProps {
  dots?: Array<{
    start: { lat: number; lng: number; label?: string };
    end: { lat: number; lng: number; label?: string };
  }>;
  lineColor?: string;
  className?: string;
}

export default function WorldMap({
  dots = [],
  lineColor = "#22d3ee",
  className = "",
}: MapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const map = new DottedMap({ height: 100, grid: "diagonal" });

  const { theme } = useTheme();

  const svgMap = map.getSVG({
    radius: 0.22,
    color: theme === "dark" ? "#22d3ee" : "#22d3ee",
    shape: "circle",
    // backgroundColor: theme === "dark" ? "black" : "white",
    backgroundColor: "transparent",
  });

const highlightPoints = [
  // 🇮🇳 India
  // { lat: 90.6139, lng: 500.2090 },
  { lat: 28.6139, lng: 77.2090 }, // Delhi
  // { lat: 19.0760, lng: 72.8777 }, // Mumbai
  // { lat: 12.9716, lng: 77.5946 }, // Bangalore

  // 🇺🇸 USA
  // { lat: 37.7749, lng: -122.4194 }, // San Francisco
  { lat: 40.7128, lng: -74.0060 },  // New York
  { lat: 34.0522, lng: -118.2437 }, // Los Angeles

  // 🇬🇧 UK
  { lat: 51.5074, lng: -0.1278 }, // London

  // 🇨🇦 Canada
  { lat: 43.6532, lng: -79.3832 }, // Toronto

  // 🇩🇪 Germany
  { lat: 52.5200, lng: 13.4050 }, // Berlin

  // 🇫🇷 France
  { lat: 48.8566, lng: 2.3522 }, // Paris

  // 🇦🇪 UAE
  { lat: 25.2048, lng: 55.2708 }, // Dubai

  // 🇸🇬 Singapore
  { lat: 1.3521, lng: 103.8198 },

  // 🇦🇺 Australia
  { lat: -33.8688, lng: 151.2093 }, // Sydney

  // 🇯🇵 Japan
  { lat: 35.6762, lng: 139.6503 }, // Tokyo

  // 🇧🇷 Brazil
  { lat: -23.5505, lng: -46.6333 }, // São Paulo

  // 🇿🇦 South Africa
  // { lat: -26.2041, lng: 28.0473 }, // Johannesburg

  // 🇷🇺 Russia
  { lat: 55.7558, lng: 37.6173 }, // Moscow

  // 🇰🇷 South Korea
  { lat: 37.5665, lng: 126.9780 }, // Seoul
];
  const projectPoint = (lat: number, lng: number) => {
    const x = (lng + 180) * (800 / 360);
    const y = (90 - lat) * (400 / 180);
    return { x, y };
  };

  const createCurvedPath = (
    start: { x: number; y: number },
    end: { x: number; y: number }
  ) => {
    const midX = (start.x + end.x) / 2;
    const midY = Math.min(start.y, end.y) - 50;
    return `M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`;
  };

  return (
    <div className={`relative h-full min-h-80 w-full overflow-hidden bg-transparent font-sans ${className}`}>
      <Image
        src={`data:image/svg+xml;utf8,${encodeURIComponent(svgMap)}`}
        className="absolute inset-0 h-full w-full object-cover mask-[linear-gradient(to_bottom,transparent,white_10%,white_90%,transparent)] pointer-events-none select-none"
        alt="world map"
        height="495"
        width="1056"
        unoptimized
        draggable={false}
      />
      <svg
        ref={svgRef}
        viewBox="0 0 800 400"
        className="absolute inset-0 h-full w-full pointer-events-none select-none"
      >
        {highlightPoints.map((point, i) => {
  const p = projectPoint(point.lat, point.lng);

  return (
    <g key={`highlight-${i}`}>
      {/* 🔶 Main big dot */}
      <circle
        cx={p.x}
        cy={p.y}
        r="5"
        fill="#f97316" // orange-500
      />

      {/* 🔥 Glow animation */}
      <circle
        cx={p.x}
        cy={p.y}
        r="5"
        fill="#f97316"
        opacity="0.6"
      >
        <animate
          attributeName="r"
          from="5"
          to="14"
          dur="1.8s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          from="0.6"
          to="0"
          dur="1.8s"
          repeatCount="indefinite"
        />
      </circle>
    </g>
  );
})}

        <defs>
          <linearGradient id="path-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="5%" stopColor={lineColor} stopOpacity="1" />
            <stop offset="95%" stopColor={lineColor} stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>

        {dots.map((dot, i) => (
          <g key={`points-group-${i}`}>
            <g key={`start-${i}`}>
              <circle
                cx={projectPoint(dot.start.lat, dot.start.lng).x}
                cy={projectPoint(dot.start.lat, dot.start.lng).y}
                r="2"
                fill={lineColor}
              />
              <circle
                cx={projectPoint(dot.start.lat, dot.start.lng).x}
                cy={projectPoint(dot.start.lat, dot.start.lng).y}
                r="2"
                fill={lineColor}
                opacity="0.5"
              >
                <animate
                  attributeName="r"
                  from="2"
                  to="8"
                  dur="1.5s"
                  begin="0s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  from="0.5"
                  to="0"
                  dur="1.5s"
                  begin="0s"
                  repeatCount="indefinite"
                />
              </circle>
            </g>
            <g key={`end-${i}`}>
              <circle
                cx={projectPoint(dot.end.lat, dot.end.lng).x}
                cy={projectPoint(dot.end.lat, dot.end.lng).y}
                r="2"
                fill={lineColor}
              />
              <circle
                cx={projectPoint(dot.end.lat, dot.end.lng).x}
                cy={projectPoint(dot.end.lat, dot.end.lng).y}
                r="2"
                fill={lineColor}
                opacity="0.5"
              >
                <animate
                  attributeName="r"
                  from="2"
                  to="8"
                  dur="1.5s"
                  begin="0s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  from="0.5"
                  to="0"
                  dur="1.5s"
                  begin="0s"
                  repeatCount="indefinite"
                />
              </circle>
            </g>
          </g>
        ))}
      </svg>
    </div>
  );
}
