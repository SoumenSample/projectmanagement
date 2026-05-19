"use client";
import { useState } from "react";
import "./dashboard-marketplace.css";

export default function DashboardInterestForm({ productId, productTitle, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

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
    <div className="dashboard-modal-overlay" onClick={onClose}>
      <div className="dashboard-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="dashboard-modal-close" onClick={onClose}>
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
          <form onSubmit={handleSubmit} className="dashboard-interest-form">
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <p className="text-sm text-cyan-100/80">
                Your registered client details will be sent automatically.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-submit"
            >
              {loading ? "Submitting..." : "Send Interest"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
