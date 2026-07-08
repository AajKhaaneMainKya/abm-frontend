"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/lib/api";

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: string;
  // reason: 'trial_expired' | 'brief_limit' |
  //         'unlock_limit' | 'client_limit'
}

interface UpgradeRequestForm {
  name: string;
  email: string;
  company: string;
  use_case: string;
}

export default function PaywallModal({ isOpen, onClose, reason }: PaywallModalProps) {
  const { user } = useUser();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<UpgradeRequestForm>({
    name: "",
    email: "",
    company: "",
    use_case: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.fullName || "",
        email: user.primaryEmailAddress?.emailAddress || "",
      }));
    }
  }, [user]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await api.post("/api/upgrade-request", formData);
      setSubmitted(true);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const getMessage = () => {
    switch (reason) {
      case "trial_expired":
        return "Your 30-day free trial has ended.";
      case "brief_limit":
        return "Upgrade to post more hiring briefs.";
      case "unlock_limit":
        return "You've used all 3 trial profile unlocks.";
      case "client_limit":
        return "Upgrade to run multiple campaigns.";
      default:
        return "Upgrade to continue using Sahayak.";
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          padding: "40px",
          maxWidth: "460px",
          width: "100%",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>🚀</div>
          <h2
            style={{
              fontSize: "22px",
              fontWeight: "700",
              color: "#111827",
              marginBottom: "8px",
            }}
          >
            Upgrade to Pro
          </h2>
          <p style={{ color: "#6b7280", fontSize: "14px" }}>{getMessage()}</p>
        </div>

        {/* Pricing */}
        <div
          style={{
            background: "#f0fdfa",
            border: "2px solid #0f766e",
            borderRadius: "12px",
            padding: "20px",
            marginBottom: "20px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "13px",
              color: "#0f766e",
              fontWeight: "600",
              marginBottom: "4px",
            }}
          >
            PRO PLAN
          </div>
          <div
            style={{
              fontSize: "32px",
              fontWeight: "800",
              color: "#111827",
              marginBottom: "4px",
            }}
          >
            ₹15,000
            <span
              style={{
                fontSize: "14px",
                fontWeight: "400",
                color: "#6b7280",
              }}
            >
              /month
            </span>
          </div>
          <div style={{ fontSize: "13px", color: "#6b7280" }}>+ 8% of first year CTC on successful hire</div>
        </div>

        {/* Features */}
        {[
          "Unlimited hiring briefs",
          "Unlimited profile unlocks",
          "Unlimited ABM campaigns",
          "Priority candidate matching",
          "Full outreach automation",
          "Telegram approval flow",
        ].map((f) => (
          <div
            key={f}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "8px",
              fontSize: "13px",
              color: "#374151",
            }}
          >
            <span style={{ color: "#0f766e", fontWeight: "700" }}>✓</span>
            {f}
          </div>
        ))}

        {/* CTA */}
        <div style={{ marginTop: "24px" }}>
          {!showForm && !submitted && (
            <>
              <button
                onClick={() => setShowForm(true)}
                className="btn btn-primary"
                style={{ width: "100%", padding: "14px", fontSize: "15px", marginBottom: "10px" }}
              >
                Request Pro Access →
              </button>
              <button
                onClick={onClose}
                style={{
                  width: "100%",
                  padding: "10px",
                  background: "transparent",
                  color: "#6b7280",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Maybe later
              </button>
            </>
          )}

          {showForm && !submitted && (
            <div>
              <input
                className="input"
                style={{ marginBottom: "10px" }}
                placeholder="Your name"
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
              />
              <input
                className="input"
                style={{ marginBottom: "10px" }}
                placeholder="Work email"
                value={formData.email}
                onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
              />
              <input
                className="input"
                style={{ marginBottom: "10px" }}
                placeholder="Company name"
                value={formData.company}
                onChange={(e) => setFormData((p) => ({ ...p, company: e.target.value }))}
              />
              <textarea
                className="input"
                style={{ marginBottom: "10px", resize: "vertical" }}
                placeholder="What are you trying to do? e.g. hiring a growth PM for our Series A startup"
                value={formData.use_case}
                rows={2}
                onChange={(e) => setFormData((p) => ({ ...p, use_case: e.target.value }))}
              />
              <button
                onClick={handleSubmit}
                disabled={submitting || !formData.email || !formData.company}
                className="btn btn-primary"
                style={{ width: "100%", padding: "14px", fontSize: "15px", marginBottom: "10px" }}
              >
                {submitting ? "Sending..." : "Send request →"}
              </button>
              <button
                onClick={onClose}
                style={{
                  width: "100%",
                  padding: "10px",
                  background: "transparent",
                  color: "#6b7280",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          )}

          {submitted && (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>✓</div>
              <p style={{ fontWeight: "600", color: "#111827" }}>Request received.</p>
              <p style={{ color: "#6b7280", fontSize: "13px" }}>
                We will reach out within 24 hours with payment details and your GST invoice.
              </p>
              <button
                onClick={onClose}
                style={{
                  width: "100%",
                  padding: "10px",
                  marginTop: "12px",
                  background: "transparent",
                  color: "#6b7280",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          )}
        </div>

        <p
          style={{
            textAlign: "center",
            marginTop: "16px",
            fontSize: "12px",
            color: "#9ca3af",
          }}
        >
          No automatic charges. We will contact you directly.
        </p>
      </div>
    </div>
  );
}
