"use client";
import { useState, useEffect, useCallback } from "react";
import ProductCard from "./ProductCard";
import "./marketplace.css";

export default function MarketplaceProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "web-development", label: "Web Development" },
    { value: "app-development", label: "App Development" },
    { value: "ui-ux-design", label: "UI/UX Design" },
    { value: "graphic-design", label: "Graphic Design" },
    { value: "digital-marketing", label: "Digital Marketing" },
    { value: "software-development", label: "Software Development" },
    { value: "ai-intelligent-systems", label: "AI Intelligent Systems" },
    { value: "research-and-analytics", label: "Research & Analytics" },
  ];

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        category,
        page,
        limit: 12,
      }).toString();

      const res = await fetch(`/api/marketplace/products?${query}`);
      const data = await res.json();

      if (res.ok) {
        setProducts(data.products);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  }, [category, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <div className="marketplace-container">
      <div className="marketplace-header">
        <h1>Portfolio Marketplace</h1>
        <p>Explore amazing website portfolios and solutions</p>
      </div>

      <div className="marketplace-controls">
        <div className="category-filter">
          <label htmlFor="category">Filter by Category:</label>
          <select
            id="category"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="category-select"
          >
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="marketplace-loading">
          <div className="spinner"></div>
          <p>Loading products...</p>
        </div>
      ) : (
        <>
          <div className="products-grid">
            {products.length > 0 ? (
              products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))
            ) : (
              <div className="no-products">
                <p>No products found in this category</p>
              </div>
            )}
          </div>

          {pagination && pagination.pages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="pagination-btn"
              >
                Previous
              </button>
              <span className="pagination-info">
                Page {page} of {pagination.pages}
              </span>
              <button
                onClick={() => setPage(Math.min(pagination.pages, page + 1))}
                disabled={page === pagination.pages}
                className="pagination-btn"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
