"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";

const Technologies = ({ technologies = [] }) => {
  const items = Array.isArray(technologies)
    ? technologies.map((tech) => ({ name: tech.name, icon: tech.icon }))
    : [];

  const traces = [
    { d: "M100 70 H200 V210 H326" },
    { d: "M80 150 H180 V230 H326" },
    { d: "M60 230 H150 V250 H326" },
    { d: "M100 320 H200 V270 H326" },
    { d: "M700 60 H560 V210 H474" },
    { d: "M740 130 H580 V230 H474" },
    { d: "M720 220 H590 V250 H474" },
    { d: "M680 310 H570 V270 H474" },
    { d: "M364 70 V187" },
    { d: "M436 70 V187" },
    { d: "M364 410 V293" },
    { d: "M436 410 V293" },
  ].slice(0, items.length);

  const positions = [
    { x: 100, y: 70 },
    { x: 80, y: 150 },
    { x: 60, y: 230 },
    { x: 100, y: 320 },
    { x: 700, y: 60 },
    { x: 740, y: 130 },
    { x: 720, y: 220 },
    { x: 680, y: 310 },
    { x: 364, y: 70 },
    { x: 436, y: 70 },
    { x: 364, y: 410 },
    { x: 436, y: 410 },
  ].slice(0, items.length);

  const pathRefs = useRef(Array(traces.length).fill(null));
  const glowRefs = useRef(
    Array.from({ length: traces.length }, () => Array(18).fill(null))
  );
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setStarted(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const ts = Array(traces.length).fill(0);
    const speed = 0.02;
    const tail = 0.008;
    const spacing = 0.005;

    const animate = () => {
      if (!started) {
        requestAnimationFrame(animate);
        return;
      }

      for (let c = 0; c < traces.length; c++) {
        ts[c] += speed;
        if (ts[c] > 1.2) ts[c] = 0;

        const path = pathRefs.current[c];
        if (!path) continue;

        const len = path.getTotalLength();

        for (let i = 0; i < 18; i++) {
          let t1 = ts[c] - i * spacing;
          t1 = Math.max(0, Math.min(1, t1));

          let t2 = t1 - tail;
          t2 = Math.max(0, Math.min(1, t2));

          const p1 = path.getPointAtLength(t1 * len);
          const p2 = path.getPointAtLength(t2 * len);

          const newD = `M${p2.x} ${p2.y} L${p1.x} ${p1.y}`;
          glowRefs.current[c][i].setAttribute("d", newD);

          const visible = t1 > 0;
          glowRefs.current[c][i].style.visibility = visible ? "visible" : "hidden";
        }
      }

      requestAnimationFrame(animate);
    };

    animate();
  });

  return (
    <div className="flex flex-col items-center justify-center  z-0 mb-10 lg:mb-0 lg:pt-10 pt-0">
      <h2 className="text-3xl md:text-4xl font-bold text-white mb-12 tracking-wide text-center z-10">
        <span className="text-cyan-400">Technologies</span> We Use
      </h2>

      {/* LG and above: circuit */}
      <div className="hidden lg:block w-full max-w-[800px] relative z-10">
        <svg viewBox="0 0 800 560" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <defs>
            <linearGradient id="chipGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2d2d2d" />
              <stop offset="100%" stopColor="#0f0f0f" />
            </linearGradient>
            <linearGradient id="pinGradient" x1="1" y1="0" x2="0" y2="0">
              <stop offset="0%" stopColor="#bbbbbb" />
              <stop offset="50%" stopColor="#888888" />
              <stop offset="100%" stopColor="#555555" />
            </linearGradient>
          </defs>

          <style>
            {`.trace-bg { stroke: #333; stroke-width: 1.8; fill: none; }`}
          </style>

          <g id="traces">
            {traces.map((trace, idx) => (
              <g key={idx}>
                <path ref={(r) => (pathRefs.current[idx] = r)} d={trace.d} className="trace-bg" />
                {Array.from({ length: 18 }).map((_, sidx) => (
                  <path
                    key={sidx}
                    ref={(r) => (glowRefs.current[idx][sidx] = r)}
                    d=""
                    style={{
                      stroke: "#22d3ee",
                      strokeWidth: 1.8,
                      filter: "drop-shadow(0 0 6px #22d3ee)",
                      fill: "none",
                      mixBlendMode: "lighten",
                      visibility: "hidden",
                    }}
                  />
                ))}
              </g>
            ))}
          </g>

          <rect
            x="330"
            y="190"
            width="140"
            height="100"
            rx="20"
            ry="20"
            fill="url(#chipGradient)"
            stroke="#222"
            strokeWidth="3"
            className="drop-shadow-[0_0_6px_rgba(0,0,0,0.8)]"
          />

          {[205, 225, 245, 265].map((y, i) => (
            <rect key={`left-${i}`} x="322" y={y} width="8" height="10" rx="2" fill="url(#pinGradient)" />
          ))}
          {[205, 225, 245, 265].map((y, i) => (
            <rect key={`right-${i}`} x="470" y={y} width="8" height="10" rx="2" fill="url(#pinGradient)" />
          ))}
          {[360, 432].map((x, i) => (
            <rect key={`top-${i}`} x={x} y="182" width="8" height="10" rx="2" fill="url(#pinGradient)" />
          ))}
          {[360, 432].map((x, i) => (
            <rect key={`bottom-${i}`} x={x} y="290" width="8" height="10" rx="2" fill="url(#pinGradient)" />
          ))}
        </svg>

        {items.map((item, idx) => {
          const { x, y } = positions[idx];
          return (
            <div
              key={idx}
              className="absolute flex items-center justify-center z-10"
              style={{
                left: `${(x / 800) * 100}%`,
                top: `${(y / 560) * 100}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <div
                className="w-[65px] h-[60px] rounded-xl flex flex-col items-center justify-center px-1.5 py-1 backdrop-blur-xl transition-transform duration-300"
                style={{
                  background: "linear-gradient(180deg, rgba(31,31,31,0.9), rgba(17,17,17,0.8))",
                  boxShadow: "0 0 6px 0.5px rgba(34,211,238,0.8)",
                }}
              >
                {item.icon && <div className="text-cyan-400 mb-1">{item.icon}</div>}
                <span className="text-[8px] font-medium text-cyan-400 text-center">{item.name}</span>
              </div>
            </div>
          );
        })}

        <div
          className="absolute z-10"
          style={{
            left: `${(400 / 800) * 100}%`,
            top: `${(240 / 560) * 100}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <Image src="/logo2.png" alt="Logo" width={180} height={70} className="h-25 w-auto" priority />
        </div>
      </div>

      {/* SM & MD screens: swiper */}
      <div className="block lg:hidden w-full max-w-md z-10">
        {/* Left fade */}
        <div className="hidden lg:block pointer-events-none absolute top-0 left-0 h-full w-100 bg-gradient-to-r from-black to-transparent z-10"></div>

        {/* Right fade */}
        <div className="hidden lg:block pointer-events-none absolute top-0 right-0 h-full w-100 bg-gradient-to-l from-black to-transparent z-10"></div>

        <Swiper
          spaceBetween={16}
          slidesPerView={2}
          autoplay={{ delay: 1000 }}
          modules={[Autoplay]}
        >
          {items.map((item, idx) => (
            <SwiperSlide key={idx} className="flex justify-center">
              <div className="w-32 h-32 rounded-xl flex flex-col items-center justify-center px-2 py-2 backdrop-blur-xl bg-gradient-to-b from-gray-800 to-gray-900 shadow-lg">
                {item.icon && <div className="text-cyan-400 mb-1">{item.icon}</div>}
                <span className="text-xs font-medium text-cyan-400 text-center">{item.name}</span>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
};

export default Technologies;