"use client";
import { useState } from "react";
import "./marketplace.css";

export default function InterestForm({ productId, productTitle, onClose }) {
  const [formData, setFormData] = useState({
    clientName: "",
    clientEmail: "",
    clientPhone: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

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
      const res = await fetch("/api/marketplace/interests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          ...formData,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit interest");
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          ✕
        </button>

        <h2>Express Your Interest</h2>
        <p className="product-title-info">Product: {productTitle}</p>

        {success ? (
          <div className="success-message">
            <p>✓ Thank you! Your interest has been submitted.</p>
            <p>We&apos;ll notify the creator about your interest!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="interest-form">
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label htmlFor="clientName">Full Name *</label>
              <input
                type="text"
                id="clientName"
                name="clientName"
                value={formData.clientName}
                onChange={handleChange}
                required
                placeholder="Enter your name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="clientEmail">Email Address *</label>
              <input
                type="email"
                id="clientEmail"
                name="clientEmail"
                value={formData.clientEmail}
                onChange={handleChange}
                required
                placeholder="Enter your email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="clientPhone">Phone Number *</label>
              <input
                type="tel"
                id="clientPhone"
                name="clientPhone"
                value={formData.clientPhone}
                onChange={handleChange}
                required
                placeholder="Enter your phone number"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-submit"
            >
              {loading ? "Submitting..." : "Submit Interest"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
