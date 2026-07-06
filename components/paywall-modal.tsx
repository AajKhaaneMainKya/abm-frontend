"use client";

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: string;
  // reason: 'trial_expired' | 'brief_limit' |
  //         'unlock_limit' | 'client_limit'
}

export default function PaywallModal({ isOpen, onClose, reason }: PaywallModalProps) {
  if (!isOpen) return null;

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
          <button
            onClick={() => {
              // Placeholder — Stripe comes in Phase 2
              window.open(
                "mailto:rahul@sahayakhq.co?subject=Sahayak Pro Upgrade&body=Hi, I would like to upgrade to Sahayak Pro.",
                "_blank",
              );
              onClose();
            }}
            style={{
              width: "100%",
              padding: "14px",
              background: "#0f766e",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontSize: "15px",
              fontWeight: "700",
              cursor: "pointer",
              marginBottom: "10px",
            }}
          >
            Contact us to upgrade →
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
