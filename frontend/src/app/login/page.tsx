"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export default function LoginPage() {
  const router = useRouter();
  const { sendOTP, verifyOTP } = useAuthStore();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [fullName, setFullName] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [devOtp, setDevOtp] = useState("");

  const handleSendOTP = async () => {
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError("Enter a valid 10-digit mobile number");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const otp = await sendOTP(phone);
      setDevOtp(otp);
      setStep("otp");
    } catch {
      setError("Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      setError("Enter the 6-digit OTP");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await verifyOTP(phone, otp, fullName);
      router.push("/dashboard");
    } catch {
      setError("Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0f",
      display: "flex",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    }}>
      {/* Left Panel */}
      <div style={{
        width: "50%",
        background: "#0d0d1a",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        flexDirection: "column",
        padding: "48px",
        justifyContent: "space-between"
      }}>
        {/* Logo */}
        <div style={{ fontSize: "22px", fontWeight: 600, color: "#fff", letterSpacing: "-0.5px" }}>
          Fintech<span style={{ color: "#6366f1" }}>Pay</span>
        </div>

        {/* Center Content */}
        <div>
          <div style={{ marginBottom: "48px" }}>
            <h2 style={{ fontSize: "32px", fontWeight: 600, color: "#fff", lineHeight: 1.2, marginBottom: "12px" }}>
              The smarter way<br />to manage money
            </h2>
            <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
              Send, receive, and manage your finances with one powerful platform.
            </p>
          </div>

          {/* Features */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {[
              { icon: "💼", title: "Smart Wallet", desc: "Manage your money with ease and security" },
              { icon: "🔒", title: "Bank-grade Security", desc: "Your funds are protected at every step" },
              { icon: "⚡", title: "Instant Payments", desc: "Send and receive money in seconds" },
              { icon: "🎫", title: "Book & Pay", desc: "Bus tickets, movies, recharges and more" },
            ].map((f) => (
              <div key={f.title} style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
                <div style={{
                  width: "42px", height: "42px",
                  background: "rgba(99,102,241,0.1)",
                  borderRadius: "12px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "20px", flexShrink: 0
                }}>
                  {f.icon}
                </div>
                <div>
                  <p style={{ fontSize: "14px", fontWeight: 500, color: "#fff", marginBottom: "3px" }}>{f.title}</p>
                  <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: "32px" }}>
          {[
            { val: "10K+", label: "Active users" },
            { val: "₹50Cr+", label: "Processed" },
            { val: "99.9%", label: "Uptime" },
          ].map((s) => (
            <div key={s.label}>
              <p style={{ fontSize: "20px", fontWeight: 600, color: "#fff" }}>{s.val}</p>
              <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", marginTop: "2px" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel */}
      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px"
      }}>
        <div style={{ width: "100%", maxWidth: "380px" }}>

          {step === "phone" ? (
            <>
              <div style={{ marginBottom: "32px" }}>
                <h1 style={{ fontSize: "28px", fontWeight: 600, color: "#fff", marginBottom: "8px", letterSpacing: "-0.5px" }}>
                  Welcome back
                </h1>
                <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.4)" }}>
                  Enter your mobile number to continue
                </p>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", display: "block", marginBottom: "8px" }}>
                  Mobile number
                </label>
                <div style={{
                  display: "flex", alignItems: "center",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "12px", overflow: "hidden"
                }}>
                  <span style={{
                    padding: "14px 16px",
                    color: "rgba(255,255,255,0.4)",
                    fontSize: "14px",
                    borderRight: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(255,255,255,0.03)"
                  }}>+91</span>
                  <input
                    type="tel"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    placeholder="9999999999"
                    style={{
                      flex: 1, background: "transparent",
                      border: "none", outline: "none",
                      color: "#fff", fontSize: "14px",
                      padding: "14px 16px"
                    }}
                  />
                </div>
              </div>

              {error && (
                <p style={{ color: "#f87171", fontSize: "12px", marginBottom: "12px" }}>
                  ⚠ {error}
                </p>
              )}

              <button
                onClick={handleSendOTP}
                disabled={loading}
                style={{
                  width: "100%", padding: "14px",
                  background: loading ? "rgba(99,102,241,0.5)" : "#6366f1",
                  color: "#fff", border: "none",
                  borderRadius: "12px", fontSize: "14px",
                  fontWeight: 500, cursor: loading ? "not-allowed" : "pointer",
                  marginBottom: "16px", transition: "background 0.2s"
                }}
              >
                {loading ? "Sending OTP..." : "Send OTP →"}
              </button>

              <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.2)", textAlign: "center" }}>
                By continuing, you agree to our Terms of Service and Privacy Policy
              </p>
            </>
          ) : (
            <>
              <div style={{ marginBottom: "32px" }}>
                <h1 style={{ fontSize: "28px", fontWeight: 600, color: "#fff", marginBottom: "8px", letterSpacing: "-0.5px" }}>
                  Verify OTP
                </h1>
                <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.4)" }}>
                  Sent to +91 {phone}
                </p>
              </div>

              {devOtp && (
                <div style={{
                  background: "rgba(99,102,241,0.1)",
                  border: "1px solid rgba(99,102,241,0.2)",
                  borderRadius: "10px", padding: "12px 16px",
                  marginBottom: "16px",
                  display: "flex", alignItems: "center", gap: "10px"
                }}>
                  <span style={{ fontSize: "16px" }}>🔑</span>
                  <p style={{ fontSize: "13px", color: "#a5b4fc" }}>
                    Dev OTP: <strong style={{ color: "#c7d2fe", letterSpacing: "2px" }}>{devOtp}</strong>
                  </p>
                </div>
              )}

              <div style={{ marginBottom: "16px" }}>
                <label style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", display: "block", marginBottom: "8px" }}>
                  Your name (first time only)
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  style={{
                    width: "100%", background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px", padding: "14px 16px",
                    color: "#fff", fontSize: "14px", outline: "none"
                  }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", display: "block", marginBottom: "8px" }}>
                  Enter 6-digit OTP
                </label>
                <input
                  type="tel"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="• • • • • •"
                  style={{
                    width: "100%", background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px", padding: "14px 16px",
                    color: "#fff", fontSize: "22px", outline: "none",
                    textAlign: "center", letterSpacing: "12px"
                  }}
                />
              </div>

              {error && (
                <p style={{ color: "#f87171", fontSize: "12px", marginBottom: "12px" }}>
                  ⚠ {error}
                </p>
              )}

              <button
                onClick={handleVerifyOTP}
                disabled={loading}
                style={{
                  width: "100%", padding: "14px",
                  background: loading ? "rgba(99,102,241,0.5)" : "#6366f1",
                  color: "#fff", border: "none",
                  borderRadius: "12px", fontSize: "14px",
                  fontWeight: 500, cursor: loading ? "not-allowed" : "pointer",
                  marginBottom: "12px", transition: "background 0.2s"
                }}
              >
                {loading ? "Verifying..." : "Verify & Login →"}
              </button>

              <button
                onClick={() => { setStep("phone"); setError(""); setOtp(""); }}
                style={{
                  width: "100%", padding: "10px",
                  background: "transparent", color: "rgba(255,255,255,0.3)",
                  border: "none", cursor: "pointer", fontSize: "13px"
                }}
              >
                ← Change number
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}