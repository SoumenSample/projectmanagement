"use client";
import { useState } from "react";
import Image from "next/image";
import { convertGoogleDriveLink, isGoogleDriveLink } from "@/lib/utils/driveImageUtils";
import "./dashboard-marketplace.css";

export default function UploadProductModal({ onClose, onSuccess }) {
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
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);

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

    // If it's the image URL field, auto-convert Google Drive links and show preview
    if (name === "imageUrl" && value.trim()) {
      const convertedUrl = isGoogleDriveLink(value) 
        ? convertGoogleDriveLink(value) 
        : value;
      setPreviewUrl(convertedUrl);
      setPreviewError(false); // Reset error when URL changes
    } else if (name === "imageUrl" && !value.trim()) {
      setPreviewUrl("");
      setPreviewError(false);
    }
  };

  const handleFileChange = (files) => {
    const file = files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file");
      return;
    }

    // Validate file size (max 1MB for safer storage)
    if (file.size > 1 * 1024 * 1024) {
      setError("Image file must be less than 1MB");
      return;
    }

    setError("");
    setUploadedFile(file);

    // Convert file to base64 for preview and submission
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64String = e.target.result;
      
      // Warn if base64 is very large (should be under 1.3MB due to encoding)
      if (base64String.length > 5 * 1024 * 1024) {
        setError("Image is too large to upload. Please use a smaller image.");
        setUploadedFile(null);
        setPreviewUrl("");
        return;
      }
      
      setPreviewUrl(base64String);
      setPreviewError(false);
      // Set the base64 as imageUrl
      setFormData((prev) => ({
        ...prev,
        imageUrl: base64String,
      }));
    };
    reader.onerror = () => {
      setError("Failed to read file");
    };
    reader.readAsDataURL(file);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileChange(files);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validate all required fields
      if (!formData.title.trim()) {
        setError("Product title is required");
        setLoading(false);
        return;
      }
      if (!formData.description.trim() || formData.description.length < 10) {
        setError("Description must be at least 10 characters");
        setLoading(false);
        return;
      }
      if (!formData.imageUrl.trim()) {
        setError("Portfolio image is required");
        setLoading(false);
        return;
      }
      if (!formData.demoLink.trim()) {
        setError("Live demo link is required");
        setLoading(false);
        return;
      }
      if (!formData.price || parseFloat(formData.price) < 0) {
        setError("Price must be 0 or greater");
        setLoading(false);
        return;
      }

      // Convert Google Drive link if needed
      const imageUrl = isGoogleDriveLink(formData.imageUrl)
        ? convertGoogleDriveLink(formData.imageUrl)
        : formData.imageUrl;

      const res = await fetch("/api/marketplace/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          imageUrl: imageUrl,
          price: parseFloat(formData.price),
        }),
      });

      let data;
      try {
        data = await res.json();
      } catch (parseErr) {
        console.error("Failed to parse response:", parseErr);
        throw new Error("Server error: Invalid response");
      }

      if (!res.ok) {
        const errorMsg = data?.error || data?.message || "Failed to upload product";
        throw new Error(errorMsg);
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err) {
      console.error("Submit error:", err);
      setError(err?.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-modal-overlay" onClick={onClose}>
      <div className="dashboard-modal-content dashboard-upload-modal" onClick={(e) => e.stopPropagation()}>
        <button className="dashboard-modal-close" onClick={onClose}>
          ✕
        </button>

        <h2>Upload Portfolio Product</h2>
        <p className="modal-subtitle">Share your website portfolio with potential clients</p>

        {success ? (
          <div className="success-message">
            <p>✓ Product uploaded successfully!</p>
            <p>Your product is now live in the marketplace.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="dashboard-upload-form">
            {error && <div className="error-message">{error}</div>}

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
                rows="3"
                placeholder="Describe your portfolio project..."
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Portfolio Image *</label>
                <div 
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    dragActive 
                      ? "border-cyan-400 bg-cyan-400/10" 
                      : "border-cyan-500/30 hover:border-cyan-400/50"
                  }`}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    id="imageFile"
                    name="imageFile"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e.target.files)}
                    style={{ display: "none" }}
                  />
                  <label htmlFor="imageFile" className="cursor-pointer">
                    {/* <div className="text-cyan-400 text-2xl mb-2">📁</div> */}
                    <p className="text-sm text-cyan-100 font-medium">
                      {uploadedFile ? `✓ ${uploadedFile.name}` : "Drag & drop image or click to upload"}
                    </p>
                    <p className="text-xs text-cyan-300/60 mt-1">Max 1MB • JPG, PNG, WebP</p>
                  </label>
                </div>
                {uploadedFile && (
                  <button
                    type="button"
                    onClick={() => {
                      setUploadedFile(null);
                      setPreviewUrl("");
                      setFormData((prev) => ({
                        ...prev,
                        imageUrl: "",
                      }));
                    }}
                    className="text-xs mt-2 px-2 py-1 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors"
                  >
                    ✕ Clear Upload
                  </button>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="imageUrl">OR Image URL</label>
                <input
                  type="url"
                  id="imageUrl"
                  name="imageUrl"
                  value={uploadedFile ? "" : formData.imageUrl}
                  onChange={handleChange}
                  disabled={!!uploadedFile}
                  placeholder="https://example.com/image.jpg or Google Drive link"
                />
                <p className="text-xs text-cyan-300/60 mt-1">Google Drive links auto-convert</p>
              </div>
            </div>

            {previewUrl && !previewError && (
              <div className="form-group">
                <label>Image Preview</label>
                <div className="image-preview-small mt-3">
                  <Image
                    src={previewUrl} 
                    alt="Preview" 
                    width={800}
                    height={500}
                    unoptimized
                    onError={() => setPreviewError(true)}
                    crossOrigin="anonymous"
                    style={{ maxWidth: "100%", maxHeight: "250px", objectFit: "contain" }}
                  />
                </div>
              </div>
            )}
            {previewError && previewUrl && (
              <div className="text-xs text-red-400 mt-2 p-2 bg-red-900/20 rounded">
                ⚠️ Preview failed to load. URL may not be accessible.
              </div>
            )}

            <div className="form-row">
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

              <div className="form-group">
                <label htmlFor="price">Price (₹) *</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  min="0"
                  step="1"
                  placeholder="10000"
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-submit btn-submit-large">
              {loading ? "Uploading..." : "Upload Product"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
