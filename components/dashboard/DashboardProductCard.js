"use client";
import { useState } from "react";
import Image from "next/image";
import DashboardInterestForm from "./DashboardInterestForm";
import "./dashboard-marketplace.css";

export default function DashboardProductCard({ product }) {
  const [showInterestForm, setShowInterestForm] = useState(false);
  const displayPrice = Number(product.price) === 0 ? "Free" : `₹${product.price}`;

  return (
    <>
      <div className="bg-transparent p-4 border-2 rounded shadow border-gray-500 text-black dark:text-white ">
        <div className="p-3 bg-black/10 rounded-md relative">
          <Image
            src={product.imageUrl}
            alt={product.title}
            width={600}
            height={360}
            unoptimized
            className="product-image max-h-[140px] object-cover rounded-md"
          />
          <div className="product-category-badge">{product.category.replace("-", " ")}</div>
        </div>

        <div className="">
          <h3 className=" text-black bg-transparent border-gray-500 dark:text-white dark:bg-transparent text-xl font-bold">{product.title}</h3>
          <p className="text-l text-gray-700 dark:text-gray-300">{product.description}</p>

          {/* <div className="product-stats">
            <span className="stat">
              <span className="stat-icon">👁️</span> {product.views}
            </span>
            <span className="stat">
              <span className="stat-icon">❤️</span> {product.interests}
            </span>
          </div> */}

          <div className="flex justify-between">
            <span className="text-black dark:text-white">{displayPrice}</span>
            <span className=" text-black dark:text-white ">by {product.createdByName}</span>
          </div>

          <div className="product-actions">
            <a
              href={product.demoLink}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-black text-white dark:bg-white dark:text-black rounded flex items-center justify-center py-3"
            >
              View Demo
            </a>
            <button
              onClick={() => setShowInterestForm(true)}
              className="bg-black text-white dark:bg-white dark:text-black rounded flex items-center justify-center py-3"
            >
              I&apos;m Interested
            </button>
          </div>
        </div>
      </div>

      {showInterestForm && (
        <DashboardInterestForm
          productId={product._id}
          productTitle={product.title}
          onClose={() => setShowInterestForm(false)}
        />
      )}
    </>
  );
}
