"use client";
import React from "react";

const SectionLayout = ({ title, items, renderItem }) => {
  return (
    <section className="w-full mb-10 z-10">
      <h2 className="text-3xl font-semibold text-center mb-10">{title}</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {items.map((item, index) => renderItem(item, index))}
      </div>
    </section>
  );
};

export default SectionLayout;
