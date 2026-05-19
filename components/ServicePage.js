"use client";
import React from "react";
import GlassCard from "@/components/GlassCard";
import SectionLayout from "@/components/SectionLayout";
import Technologies from "@/components/Technology";
import Pattern from "@/components/Pattern";

const ServicePage = ({
  title,
  description,
  subServices,
  useCases,
  technologies,
}) => {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black z-10">
      {/* FULL-PAGE PATTERN (behind everything) */}
      <Pattern />

      {/* CONTENT – NO bg-black, pattern already provides it */}
      <div className="relative text-white px-6 pt-26 pb-15">
      <div className="max-w-7xl mx-auto">
        
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 50% 70%, rgba(14,186,199,0.45), transparent 25%)",
          }}
        />

        {/* Hero */}
        <section className="max-w-7xl mx-auto text-center mb-10 ">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 z-10">{title}</h1>
          <p className="text-lg text-gray-300 leading-relaxed">{description}</p>
        </section>

        {/* Sub-services */}
        <SectionLayout
          title="Service Offerings"
          items={subServices}
          renderItem={(service, i) => (
            <GlassCard
              key={i}
              title={service.title}
              description={service.description}
            />
          )}
        />

        {/* Technologies */}
        <Technologies technologies={technologies} />

        {/* Use-cases (optional) */}
        {useCases?.length > 0 && (
          <SectionLayout
            title="Use Cases"
            items={useCases}
            renderItem={(useCase, i) => (
              <GlassCard
                key={i}
                title={useCase.title}
                description={useCase.description}
              />
            )}
          />
        )}
      </div>
      </div>
    </div>
  );
};

export default ServicePage;