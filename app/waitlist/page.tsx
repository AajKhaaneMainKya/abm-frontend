"use client";

import { useState } from "react";
import { joinWaitlist } from "@/lib/api";

const TEAL = "#14b8a6";
const DARK_BG = "#0a0a14";

type SignupType = "hiring_manager" | "candidate";

function Logo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <div
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "10px",
          background: "linear-gradient(135deg, #14b8a6, #6366f1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontWeight: "800",
          fontSize: "20px",
        }}
      >
        S
      </div>
      <span style={{ color: "white", fontSize: "24px", fontWeight: "700" }}>Sahayak</span>
    </div>
  );
}

function Hero() {
  return (
    <section
      id="hero"
      style={{
        position: "relative",
        minHeight: "100vh",
        width: "100%",
        background: DARK_BG,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 20px",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      {/* Subtle grid pattern */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), " +
            "linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          maskImage: "radial-gradient(ellipse 60% 50% at 50% 40%, black 40%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse 60% 50% at 50% 40%, black 40%, transparent 80%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", marginBottom: "40px" }}>
        <Logo />
      </div>

      <h1
        style={{
          position: "relative",
          color: "#fff",
          fontSize: "clamp(28px, 5vw, 48px)",
          fontWeight: "800",
          textAlign: "center",
          lineHeight: 1.2,
          maxWidth: "780px",
          margin: "0 0 12px 0",
        }}
      >
        Hiring in Indian startups runs on
        <br />
        who you know.
      </h1>

      <p
        style={{
          position: "relative",
          color: TEAL,
          fontSize: "clamp(16px, 2.5vw, 22px)",
          fontWeight: "700",
          textAlign: "center",
          margin: "0 0 28px 0",
        }}
      >
        We&apos;re changing that.
      </p>

      <div style={{ position: "relative", maxWidth: "620px", textAlign: "center" }}>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "15px", lineHeight: 1.7, margin: "0 0 16px 0" }}>
          The first person who got you your job probably knew someone. The second too. At some
          point — if you&apos;re good enough — that stops working. And if you&apos;re a founder
          trying to hire someone great, you&apos;re stuck asking the same 10 people for referrals.
        </p>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "15px", lineHeight: 1.7, margin: 0 }}>
          Sahayak matches builders to founders based on what they&apos;ve actually built. Not
          their title. Not their college. Not who they know.
        </p>
      </div>

      <a
        href="#how-it-works"
        style={{
          position: "relative",
          marginTop: "48px",
          color: "rgba(255,255,255,0.4)",
          fontSize: "13px",
          textDecoration: "none",
        }}
      >
        ↓ See how it works
      </a>
    </section>
  );
}

function HowItWorks() {
  return (
    <section
      id="how-it-works"
      style={{
        background: "#fff",
        padding: "80px 20px",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "48px",
          maxWidth: "980px",
          width: "100%",
        }}
      >
        {/* For founders */}
        <div style={{ flex: "1 1 380px" }}>
          <div style={{ fontSize: "32px", marginBottom: "12px" }}>🔍</div>
          <div style={{ fontSize: "12px", fontWeight: "700", color: TEAL, letterSpacing: "0.05em", marginBottom: "4px" }}>
            FOR FOUNDERS
          </div>
          <h3 style={{ fontSize: "22px", fontWeight: "700", color: "#111827", margin: "0 0 16px 0" }}>
            Post what you actually need
          </h3>
          <p style={{ color: "#4b5563", fontSize: "14px", lineHeight: 1.7, margin: "0 0 16px 0" }}>
            Not a job description. A structured brief. What stage are you at. What problem needs
            solving. What kind of person survives your environment.
          </p>
          <p style={{ color: "#4b5563", fontSize: "14px", lineHeight: 1.7, margin: "0 0 16px 0" }}>
            Sahayak traverses every candidate&apos;s context graph — what they&apos;ve shipped,
            what they&apos;ve owned, what they&apos;ve fixed — and returns matched candidates with
            explained scores.
          </p>
          <p style={{ color: "#111827", fontSize: "14px", fontWeight: "600", lineHeight: 1.9, margin: 0 }}>
            Not keyword matching.
            <br />
            Not a resume pile.
            <br />
            Actual reasoning.
          </p>
        </div>

        {/* For builders */}
        <div style={{ flex: "1 1 380px" }}>
          <div style={{ fontSize: "32px", marginBottom: "12px" }}>💼</div>
          <div style={{ fontSize: "12px", fontWeight: "700", color: TEAL, letterSpacing: "0.05em", marginBottom: "4px" }}>
            FOR BUILDERS
          </div>
          <h3 style={{ fontSize: "22px", fontWeight: "700", color: "#111827", margin: "0 0 16px 0" }}>
            Show what you&apos;ve built
          </h3>
          <p style={{ color: "#4b5563", fontSize: "14px", lineHeight: 1.7, margin: "0 0 16px 0" }}>
            Not your resume. Your context graph. Upload your work once. Sahayak builds a knowledge
            graph of your actual experience.
          </p>
          <p style={{ color: "#4b5563", fontSize: "14px", lineHeight: 1.7, margin: "0 0 16px 0" }}>
            Gets matched to founders looking for exactly what you know how to do. No applications.
            No cover letters. The right founder finds you.
          </p>
          <p style={{ color: "#111827", fontSize: "14px", fontWeight: "600", lineHeight: 1.9, margin: 0 }}>
            Free forever.
            <br />
            Invite only.
          </p>
        </div>
      </div>
    </section>
  );
}

function Mission() {
  return (
    <section
      style={{
        background: DARK_BG,
        padding: "100px 20px",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div style={{ maxWidth: "720px", textAlign: "center" }}>
        <p style={{ color: "#fff", fontSize: "clamp(18px, 3vw, 26px)", fontWeight: "600", lineHeight: 1.5, margin: "0 0 28px 0" }}>
          We believe the best builders in India are invisible to the best founders. Not because
          they aren&apos;t good enough. Because the system was built for people who already know
          people.
        </p>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "16px", lineHeight: 1.8, margin: "0 0 32px 0" }}>
          Sahayak is for the builder in Pune who shipped something real but doesn&apos;t have a
          Delhi VC on speed dial.
          <br />
          <br />
          For the founder in Bangalore who needs someone who has done it before — not someone who
          says they have.
        </p>
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "13px", margin: 0 }}>
          Built by a builder, for builders.
        </p>
      </div>
    </section>
  );
}

function ToggleCard({
  icon,
  title,
  desc,
  selected,
  onClick,
}: {
  icon: string;
  title: string;
  desc: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: "1 1 180px",
        padding: "20px 16px",
        borderRadius: "12px",
        border: `2px solid ${selected ? TEAL : "#e5e7eb"}`,
        background: selected ? "rgba(20,184,166,0.08)" : "#fff",
        cursor: "pointer",
        textAlign: "left",
        transition: "all 0.15s",
      }}
    >
      <div style={{ fontSize: "24px", marginBottom: "8px" }}>{icon}</div>
      <div style={{ fontSize: "14px", fontWeight: "700", color: "#111827", marginBottom: "4px" }}>{title}</div>
      <div style={{ fontSize: "12px", color: "#6b7280", lineHeight: 1.5 }}>{desc}</div>
    </button>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#111827", marginBottom: "6px" }}>
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "8px",
  border: "1px solid #e5e7eb",
  fontSize: "14px",
  color: "#111827",
  boxSizing: "border-box",
  marginBottom: "16px",
  fontFamily: "inherit",
};

function WaitlistForm() {
  const [signupType, setSignupType] = useState<SignupType | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [roleHiring, setRoleHiring] = useState("");
  const [whatBuilt, setWhatBuilt] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [result, setResult] = useState<{ position?: number } | null>(null);

  const canSubmit =
    !!signupType &&
    name.trim().length > 0 &&
    email.trim().includes("@") &&
    (signupType === "hiring_manager" ? company.trim().length > 0 : true);

  const handleSubmit = async () => {
    if (!canSubmit || submitting || !signupType) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await joinWaitlist({
        email: email.trim(),
        name: name.trim(),
        type: signupType,
        company: signupType === "hiring_manager" ? company.trim() : undefined,
        role: signupType === "hiring_manager" ? roleHiring.trim() || undefined : undefined,
        linkedin_url: linkedinUrl.trim() || undefined,
        what_built: signupType === "candidate" ? whatBuilt.trim() || undefined : undefined,
      });
      if (res?.joined) {
        setResult({ position: res.position });
      } else {
        setSubmitError("Something went wrong. Please try again.");
      }
    } catch {
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "40px", marginBottom: "12px" }}>🎉</div>
        <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#111827", margin: "0 0 12px 0" }}>
          You&apos;re on the list.
        </h3>
        {signupType === "hiring_manager" ? (
          <p style={{ color: "#4b5563", fontSize: "14px", lineHeight: 1.7, margin: "0 0 16px 0" }}>
            We&apos;ll reach out personally when we&apos;re ready for your first brief. Founding
            hiring managers get 30 days free and locked pricing forever.
          </p>
        ) : (
          <p style={{ color: "#4b5563", fontSize: "14px", lineHeight: 1.7, margin: "0 0 16px 0" }}>
            We review every builder personally. If approved, you&apos;ll be among the first
            matched to founders on Sahayak. Free forever.
          </p>
        )}
        {typeof result.position === "number" && (
          <div style={{ fontSize: "13px", fontWeight: "600", color: TEAL }}>
            You&apos;re #{result.position} in line
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#111827", textAlign: "center", margin: "0 0 8px 0" }}>
        Join the waitlist
      </h2>
      <p style={{ fontSize: "13px", color: "#6b7280", textAlign: "center", lineHeight: 1.6, margin: "0 0 28px 0" }}>
        We&apos;re opening access in batches. First 20 hiring managers and first 50 builders get
        founding access.
      </p>

      <div style={{ fontSize: "12px", fontWeight: "600", color: "#6b7280", marginBottom: "10px" }}>
        Who are you?
      </div>
      <div style={{ display: "flex", gap: "10px", marginBottom: "24px" }}>
        <ToggleCard
          icon="🔍"
          title="I'm hiring"
          desc="Founder looking for the right person"
          selected={signupType === "hiring_manager"}
          onClick={() => setSignupType("hiring_manager")}
        />
        <ToggleCard
          icon="💼"
          title="I'm building"
          desc="Builder looking for the right problem"
          selected={signupType === "candidate"}
          onClick={() => setSignupType("candidate")}
        />
      </div>

      {signupType && (
        <div>
          <FieldLabel>Name *</FieldLabel>
          <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />

          {signupType === "hiring_manager" ? (
            <>
              <FieldLabel>Work email *</FieldLabel>
              <input
                style={inputStyle}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@yourcompany.com"
              />

              <FieldLabel>Company name *</FieldLabel>
              <input
                style={inputStyle}
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Acme Inc"
              />

              <FieldLabel>What role are you hiring for?</FieldLabel>
              <input
                style={inputStyle}
                value={roleHiring}
                onChange={(e) => setRoleHiring(e.target.value)}
                placeholder="Founding engineer, Head of Growth…"
              />

              <FieldLabel>LinkedIn (optional)</FieldLabel>
              <input
                style={inputStyle}
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="linkedin.com/in/…"
              />
            </>
          ) : (
            <>
              <FieldLabel>Email *</FieldLabel>
              <input
                style={inputStyle}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />

              <FieldLabel>What have you built?</FieldLabel>
              <textarea
                style={{ ...inputStyle, resize: "vertical" }}
                rows={3}
                value={whatBuilt}
                onChange={(e) => setWhatBuilt(e.target.value)}
                placeholder="A product, system, team, or program. Be specific."
              />

              <FieldLabel>LinkedIn or GitHub (optional)</FieldLabel>
              <input
                style={inputStyle}
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="linkedin.com/in/… or github.com/…"
              />
            </>
          )}

          {submitError && (
            <p style={{ color: "#dc2626", fontSize: "13px", margin: "0 0 12px 0" }}>{submitError}</p>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            style={{
              width: "100%",
              padding: "14px",
              background: TEAL,
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "700",
              cursor: canSubmit && !submitting ? "pointer" : "not-allowed",
              opacity: canSubmit && !submitting ? 1 : 0.6,
            }}
          >
            {submitting ? "Joining…" : "Join waitlist →"}
          </button>
        </div>
      )}
    </div>
  );
}

function WaitlistSection() {
  return (
    <section
      id="join"
      style={{
        background: "#fff",
        padding: "80px 20px",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div style={{ width: "100%", maxWidth: "480px" }}>
        <WaitlistForm />
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer
      style={{
        background: DARK_BG,
        padding: "32px 20px",
        textAlign: "center",
      }}
    >
      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", margin: "0 0 4px 0" }}>
        Sahayak · sahayakhq.co
      </p>
      <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px", margin: 0 }}>
        Built in India for Indian startups
      </p>
    </footer>
  );
}

export default function WaitlistPage() {
  return (
    <div style={{ width: "100%" }}>
      <Hero />
      <HowItWorks />
      <Mission />
      <WaitlistSection />
      <Footer />
      <style>{`html { scroll-behavior: smooth; }`}</style>
    </div>
  );
}
