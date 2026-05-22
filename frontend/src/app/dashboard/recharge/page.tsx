"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWalletStore } from "@/store/walletStore";
import api from "@/lib/api";

export default function RechargePage() {
  const router = useRouter();
  const { wallet, fetchWallet } = useWalletStore();

  const [step, setStep] = useState<"operator" | "number" | "plans" | "success">("operator");
  const [operators, setOperators] = useState<any[]>([]);
  const [selectedOperator, setSelectedOperator] = useState<any>(null);
  const [mobileNumber, setMobileNumber] = useState("");
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [receipt, setReceipt] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchWallet();
    loadOperators();
  }, []);

  const loadOperators = async () => {
    try {
      const res = await api.get("/recharge/operators");
      setOperators(res.data);
    } catch {
      setError("Failed to load operators");
    }
  };

  const handleOperatorSelect = (op: any) => {
    setSelectedOperator(op);
    setStep("number");
    setError("");
  };

  const handleFetchPlans = async () => {
    if (!mobileNumber || mobileNumber.length !== 10) {
      setError("Enter valid 10 digit mobile number");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/recharge/plans?operator=${selectedOperator.id}&recharge_type=prepaid`);
      setPlans(res.data);
      setStep("plans");
    } catch {
      setError("Failed to load plans");
    } finally {
      setLoading(false);
    }
  };

  const handleRecharge = async (plan: any) => {
    setSelectedPlan(plan);
    setPaying(true);
    setError("");
    try {
      const res = await api.post("/recharge/do-recharge", {
        mobile_number: mobileNumber,
        operator: selectedOperator.id,
        recharge_type: "prepaid",
        amount: plan.amount,
        plan_description: plan.description,
      });
      setReceipt(res.data);
      await fetchWallet();
      setStep("success");
    } catch (e: any) {
      setError(e.response?.data?.detail || "Recharge failed");
    } finally {
      setPaying(false);
    }
  };

  const resetAll = () => {
    setStep("operator");
    setSelectedOperator(null);
    setMobileNumber("");
    setPlans([]);
    setSelectedPlan(null);
    setReceipt(null);
    setError("");
  };

  const fmt = (amount: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);

  return (
    <div style={{ padding: "28px 32px", maxWidth: "700px", margin: "0 auto", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
        <button onClick={() => step === "operator" ? router.push("/dashboard") : resetAll()} style={{
          background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
          color: "#fff", borderRadius: "8px", padding: "8px 12px", cursor: "pointer", fontSize: "14px"
        }}>← Back</button>
        <h2 style={{ color: "#fff", fontSize: "20px", fontWeight: 600, margin: 0 }}>Mobile Recharge</h2>
        {wallet && (
          <div style={{ marginLeft: "auto", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "8px", padding: "6px 12px" }}>
            <p style={{ color: "#818cf8", fontSize: "12px", margin: 0, fontWeight: 500 }}>
              Balance: {fmt(parseFloat(wallet.balance))}
            </p>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "12px", padding: "12px 16px", marginBottom: "16px", color: "#f87171", fontSize: "13px" }}>
          ❌ {error}
        </div>
      )}

      {/* Step 1 — Operator */}
      {step === "operator" && (
        <div>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", marginBottom: "16px" }}>Select your mobile operator</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
            {operators.map((op) => (
              <button key={op.id} onClick={() => handleOperatorSelect(op)} style={{
                background: "#13131f",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "16px", padding: "24px 20px",
                display: "flex", alignItems: "center", gap: "16px",
                cursor: "pointer"
              }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: op.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px" }}>
                  {op.logo}
                </div>
                <span style={{ color: "#fff", fontSize: "16px", fontWeight: 600 }}>{op.name}</span>
                <span style={{ marginLeft: "auto", color: "rgba(255,255,255,0.3)", fontSize: "18px" }}>→</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2 — Mobile Number */}
      {step === "number" && (
        <div>
          <div style={{ background: "#13131f", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "18px", padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
              <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: selectedOperator?.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>
                {selectedOperator?.logo}
              </div>
              <p style={{ color: "#fff", fontSize: "16px", fontWeight: 600, margin: 0 }}>{selectedOperator?.name} Prepaid</p>
            </div>
            <label style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", display: "block", marginBottom: "8px" }}>Mobile Number</label>
            <div style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", marginBottom: "16px", overflow: "hidden" }}>
              <span style={{ padding: "14px 14px", color: "rgba(255,255,255,0.4)", fontSize: "14px", borderRight: "1px solid rgba(255,255,255,0.1)" }}>+91</span>
              <input
                type="tel"
                maxLength={10}
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ""))}
                placeholder="Enter 10 digit number"
                style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: "14px", padding: "14px 16px" }}
              />
            </div>
            <button onClick={handleFetchPlans} disabled={loading} style={{
              width: "100%", padding: "14px",
              background: loading ? "rgba(99,102,241,0.5)" : "#6366f1",
              color: "#fff", border: "none", borderRadius: "12px",
              fontSize: "14px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer"
            }}>
              {loading ? "Loading Plans..." : "Browse Plans →"}
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — Plans */}
      {step === "plans" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: selectedOperator?.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
              {selectedOperator?.logo}
            </div>
            <div>
              <p style={{ color: "#fff", fontSize: "14px", fontWeight: 600, margin: 0 }}>{selectedOperator?.name} Prepaid Plans</p>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", margin: 0 }}>+91 {mobileNumber}</p>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {plans.map((plan) => (
              <div key={plan.id} style={{
                background: "#13131f",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "14px", padding: "16px 20px",
                display: "flex", alignItems: "center", gap: "16px"
              }}>
                <div style={{ flex: 1 }}>
                  <p style={{ color: "#fff", fontSize: "13px", fontWeight: 500, margin: "0 0 4px" }}>{plan.description}</p>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", margin: 0 }}>Validity: {plan.validity}</p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ color: "#fff", fontSize: "16px", fontWeight: 700, margin: "0 0 6px" }}>{fmt(plan.amount)}</p>
                  <button
                    onClick={() => handleRecharge(plan)}
                    disabled={paying}
                    style={{
                      padding: "6px 16px",
                      background: paying && selectedPlan?.id === plan.id ? "rgba(99,102,241,0.5)" : "#6366f1",
                      color: "#fff", border: "none", borderRadius: "8px",
                      fontSize: "12px", fontWeight: 600, cursor: paying ? "not-allowed" : "pointer"
                    }}
                  >
                    {paying && selectedPlan?.id === plan.id ? "Processing..." : "Recharge"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 4 — Success */}
      {step === "success" && receipt && (
        <div style={{ textAlign: "center" }}>
          <div style={{ background: "#13131f", border: "1px solid rgba(52,211,153,0.2)", borderRadius: "20px", padding: "40px 24px" }}>
            <div style={{ width: "64px", height: "64px", background: "rgba(52,211,153,0.1)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px", margin: "0 auto 16px" }}>✅</div>
            <h3 style={{ color: "#34d399", fontSize: "20px", fontWeight: 700, margin: "0 0 8px" }}>Recharge Successful!</h3>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", margin: "0 0 24px" }}>Your mobile has been recharged</p>
            {[
              { label: "Mobile Number", value: `+91 ${receipt.mobile_number}` },
              { label: "Operator", value: receipt.operator.toUpperCase() },
              { label: "Amount", value: fmt(parseFloat(receipt.amount)) },
              { label: "Plan", value: receipt.plan_description },
              { label: "Reference ID", value: receipt.reference_id },
              { label: "Status", value: receipt.status.toUpperCase() },
            ].map((row) => (
              <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>{row.label}</span>
                <span style={{ color: "#fff", fontSize: "12px", fontWeight: 500 }}>{row.value}</span>
              </div>
            ))}
            <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
              <button onClick={resetAll} style={{ flex: 1, padding: "12px", background: "rgba(255,255,255,0.05)", color: "#fff", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", fontSize: "13px", cursor: "pointer" }}>
                Recharge Again
              </button>
              <button onClick={() => router.push("/dashboard")} style={{ flex: 1, padding: "12px", background: "#6366f1", color: "#fff", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}