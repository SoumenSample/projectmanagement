"use client";
import { useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import "./upload.css";

export default function UploadProduct() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "web-development",
    imageUrl: "",
    demoLink: "",
    price: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (status === "loading") {
    return <div className="loading">Loading...</div>;
  }

  if (!session || !["admin", "employee"].includes(session.user.role)) {
    return (
      <div className="unauthorized">
        <h2>Access Denied</h2>
        <p>Only admin and employees can upload marketplace products.</p>
      </div>
    );
  }

  const categories = [
    { value: "web-development", label: "Web Development" },
    { value: "app-development", label: "App Development" },
    { value: "ui-ux-design", label: "UI/UX Design" },
    { value: "graphic-design", label: "Graphic Design" },
    { value: "digital-marketing", label: "Digital Marketing" },
    { value: "software-development", label: "Software Development" },
    { value: "ai-intelligent-systems", label: "AI Intelligent Systems" },
    { value: "research-and-analytics", label: "Research & Analytics" },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/marketplace/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to upload product");
      }

      setSuccess(true);
      setFormData({
        title: "",
        description: "",
        category: "web-development",
        imageUrl: "",
        demoLink: "",
        price: "",
      });

      setTimeout(() => {
        router.push("/marketplace");
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-container">
      <div className="upload-wrapper">
        <h1>Upload Your Portfolio Product</h1>
        <p className="subtitle">
          Share your website portfolio with potential clients
        </p>

        {success && (
          <div className="success-alert">
            <p>✓ Product uploaded successfully! Redirecting...</p>
          </div>
        )}

        {error && <div className="error-alert">{error}</div>}

        <form onSubmit={handleSubmit} className="upload-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="title">Product Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="e.g., Modern E-Commerce Platform"
              />
            </div>

            <div className="form-group">
              <label htmlFor="category">Category *</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows="5"
              placeholder="Describe your portfolio project... Include technologies used, features, and results"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="imageUrl">Portfolio Image URL *</label>
              <input
                type="url"
                id="imageUrl"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
                required
                placeholder="https://example.com/image.jpg"
              />
              {formData.imageUrl && (
                <div className="image-preview">
                  <Image
                    src={formData.imageUrl}
                    alt="Preview"
                    width={800}
                    height={500}
                    unoptimized
                  />
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="demoLink">Live Demo Link *</label>
              <input
                type="url"
                id="demoLink"
                name="demoLink"
                value={formData.demoLink}
                onChange={handleChange}
                required
                placeholder="https://your-portfolio.com"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="price">Price ($) *</label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? "Uploading..." : "Upload Product"}
          </button>
        </form>
      </div>
    </div>
  );
}
