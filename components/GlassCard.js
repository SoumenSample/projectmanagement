"use client";
import React from "react";

const GlassCard = ({ title, description }) => {
  return (
    <div className="relative rounded-2xl p-6 bg-black/60 backdrop-blur-xl border border-white/10 overflow-hidden shadow-lg group transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,150,255,0.5)] z-10">
      {/* Top-left cyan-400 glow */}
      <div
        className="absolute top-0 left-0 w-40 h-40 -translate-x-20 -translate-y-20 blur-2xl opacity-40"
        style={{ background: "radial-gradient(circle, #06b6d4 0%, transparent 100%)" }}
      />
      {/* Bottom-right indigo-400 glow */}
      <div
        className="absolute bottom-0 right-0 w-40 h-40 translate-x-20 translate-y-20 blur-2xl opacity-40"
        style={{ background: "radial-gradient(circle, #6366f1 0%, transparent 100%)" }}
      />
      {/* Hover glow */}
      {/* <div
        className="absolute -inset-20 blur-[180px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background:
            "radial-gradient(circle at center, rgba(0,150,255,0.7) 0%, rgba(255,255,255,0.4) 40%, transparent 70%)",
        }}
      /> */}
      
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
};

export default GlassCard;
