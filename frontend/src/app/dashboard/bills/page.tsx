"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWalletStore } from "@/store/walletStore";
import api from "@/lib/api";

const categories = [
  { id: "electricity", label: "Electricity", icon: "⚡", color: "rgba(251,191,36,0.1)" },
  { id: "water", label: "Water", icon: "💧", color: "rgba(59,130,246,0.1)" },
  { id: "gas", label: "Gas", icon: "🔥", color: "rgba(239,68,68,0.1)" },
  { id: "dth", label: "DTH", icon: "📺", color: "rgba(139,92,246,0.1)" },
  { id: "broadband", label: "Broadband", icon: "🌐", color: "rgba(16,185,129,0.1)" },
  { id: "mobile_postpaid", label: "Postpaid", icon: "📱", color: "rgba(99,102,241,0.1)" },
  { id: "insurance", label: "Insurance", icon: "🛡️", color: "rgba(245,158,11,0.1)" },
  { id: "loan_emi", label: "Loan EMI", icon: "🏦", color: "rgba(236,72,153,0.1)" },
];

export default function BillPayPage() {
  const router = useRouter();
  const { wallet, fetchWallet } = useWalletStore();

  const [step, setStep] = useState<"category" | "biller" | "consumer" | "bill" | "success">("category");
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [billers, setBillers] = useState<any[]>([]);
  const [selectedBiller, setSelectedBiller] = useState<any>(null);
  const [consumerNumber, setConsumerNumber] = useState("");
  const [billDetails, setBillDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [receipt, setReceipt] = useState<any>(null);
  const [error, setError] = useState("");

  const handleCategorySelect = async (cat: any) => {
    setSelectedCategory(cat);
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/bbps/billers?category=${cat.id}`);
      setBillers(res.data);
      setStep("biller");
    } catch {
      setError("Failed to load billers");
    } finally {
      setLoading(false);
    }
  };

  const handleBillerSelect = (biller: any) => {
    setSelectedBiller(biller);
    setStep("consumer");
  };

  const handleFetchBill = async () => {
    if (!consumerNumber) {
      setError("Please enter consumer number");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/bbps/fetch-bill", {
        biller_id: selectedBiller.id,
        consumer_number: consumerNumber,
        category: selectedCategory.id,
      });
      setBillDetails(res.data);
      setStep("bill");
    } catch {
      setError("Failed to fetch bill details");
    } finally {
      setLoading(false);
    }
  };

  const handlePayBill = async () => {
    setPaying(true);
    setError("");
    try {
      const res = await api.post("/bbps/pay", {
        biller_id: selectedBiller.id,
        biller_name: selectedBiller.name,
        consumer_number: consumerNumber,
        amount: billDetails.amount,
        category: selectedCategory.id,
      });
      setReceipt(res.data);
      await fetchWallet();
      setStep("success");
    } catch (e: any) {
      setError(e.response?.data?.detail || "Payment failed");
    } finally {
      setPaying(false);
    }
  };

  const fmt = (amount: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);

  const resetAll = () => {
    setStep("category");
    setSelectedCategory(null);
    setSelectedBiller(null);
    setConsumerNumber("");
    setBillDetails(null);
    setReceipt(null);
    setError("");
  };

  return (
    <div style={{ padding: "28px 32px", maxWidth: "700px", margin: "0 auto", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
        <button onClick={() => step === "category" ? router.push("/dashboard") : resetAll()} style={{
          background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
          color: "#fff", borderRadius: "8px", padding: "8px 12px", cursor: "pointer", fontSize: "14px"
        }}>← Back</button>
        <h2 style={{ color: "#fff", fontSize: "20px", fontWeight: 600, margin: 0 }}>
          {step === "category" ? "Bill Pay" : step === "biller" ? selectedCategory?.label : step === "consumer" ? selectedBiller?.name : step === "bill" ? "Bill Details" : "Payment Success"}
        </h2>
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "12px", padding: "12px 16px", marginBottom: "16px", color: "#f87171", fontSize: "13px" }}>
          ❌ {error}
        </div>
      )}

      {/* Step 1 — Category Selection */}
      {step === "category" && (
        <div>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", marginBottom: "16px" }}>Select bill category</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
            {categories.map((cat) => (
              <button key={cat.id} onClick={() => handleCategorySelect(cat)} style={{
                background: "#13131f", border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "16px", padding: "20px 12px",
                display: "flex", flexDirection: "column", alignItems: "center", gap: "10px",
                cursor: "pointer", transition: "all 0.2s"
              }}>
                <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: cat.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px" }}>
                  {cat.icon}
                </div>
                <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px", fontWeight: 500 }}>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2 — Biller Selection */}
      {step === "biller" && (
        <div>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", marginBottom: "16px" }}>Select your biller</p>
          {loading ? (
            <p style={{ color: "rgba(255,255,255,0.3)", textAlign: "center", padding: "40px" }}>Loading billers...</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {billers.map((biller) => (
                <button key={biller.id} onClick={() => handleBillerSelect(biller)} style={{
                  background: "#13131f", border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "12px", padding: "16px 20px",
                  display: "flex", alignItems: "center", gap: "14px",
                  cursor: "pointer", textAlign: "left"
                }}>
                  <span style={{ fontSize: "24px" }}>{biller.logo}</span>
                  <span style={{ color: "#fff", fontSize: "14px", fontWeight: 500 }}>{biller.name}</span>
                  <span style={{ marginLeft: "auto", color: "rgba(255,255,255,0.3)", fontSize: "18px" }}>→</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 3 — Consumer Number */}
      {step === "consumer" && (
        <div>
          <div style={{ background: "#13131f", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "18px", padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
              <span style={{ fontSize: "28px" }}>{selectedBiller?.logo}</span>
              <p style={{ color: "#fff", fontSize: "16px", fontWeight: 600, margin: 0 }}>{selectedBiller?.name}</p>
            </div>
            <label style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", display: "block", marginBottom: "8px" }}>
              Consumer / Account Number
            </label>
            <input
              type="text"
              value={consumerNumber}
              onChange={(e) => setConsumerNumber(e.target.value)}
              placeholder="Enter your consumer number"
              style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "14px 16px", color: "#fff", fontSize: "14px", outline: "none", marginBottom: "16px" }}
            />
            <button onClick={handleFetchBill} disabled={loading} style={{
              width: "100%", padding: "14px",
              background: loading ? "rgba(99,102,241,0.5)" : "#6366f1",
              color: "#fff", border: "none", borderRadius: "12px",
              fontSize: "14px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer"
            }}>
              {loading ? "Fetching Bill..." : "Fetch Bill Details"}
            </button>
          </div>
        </div>
      )}

      {/* Step 4 — Bill Details */}
      {step === "bill" && billDetails && (
        <div>
          <div style={{ background: "#13131f", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "18px", padding: "24px", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px", paddingBottom: "16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <span style={{ fontSize: "28px" }}>{selectedBiller?.logo}</span>
              <div>
                <p style={{ color: "#fff", fontSize: "15px", fontWeight: 600, margin: 0 }}>{billDetails.biller_name}</p>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", margin: 0 }}>Consumer: {billDetails.consumer_number}</p>
              </div>
            </div>
            {[
              { label: "Bill Amount", value: fmt(billDetails.amount), highlight: true },
              { label: "Due Date", value: billDetails.due_date },
              { label: "Bill Date", value: billDetails.bill_date },
              { label: "Status", value: billDetails.status.toUpperCase() },
            ].map((row) => (
              <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>{row.label}</span>
                <span style={{ color: row.highlight ? "#34d399" : "#fff", fontSize: "13px", fontWeight: row.highlight ? 700 : 500 }}>{row.value}</span>
              </div>
            ))}
            <div style={{ marginTop: "16px", padding: "12px", background: "rgba(99,102,241,0.08)", borderRadius: "10px", border: "1px solid rgba(99,102,241,0.15)" }}>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", margin: "0 0 2px" }}>Wallet Balance</p>
              <p style={{ color: "#fff", fontSize: "16px", fontWeight: 700, margin: 0 }}>
                {wallet ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(parseFloat(wallet.balance)) : "—"}
              </p>
            </div>
          </div>
          <button onClick={handlePayBill} disabled={paying} style={{
            width: "100%", padding: "16px",
            background: paying ? "rgba(99,102,241,0.5)" : "#6366f1",
            color: "#fff", border: "none", borderRadius: "14px",
            fontSize: "15px", fontWeight: 600, cursor: paying ? "not-allowed" : "pointer"
          }}>
            {paying ? "Processing Payment..." : `Pay ${fmt(billDetails.amount)}`}
          </button>
        </div>
      )}

      {/* Step 5 — Success */}
      {step === "success" && receipt && (
        <div style={{ textAlign: "center" }}>
          <div style={{ background: "#13131f", border: "1px solid rgba(52,211,153,0.2)", borderRadius: "20px", padding: "40px 24px" }}>
            <div style={{ width: "64px", height: "64px", background: "rgba(52,211,153,0.1)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px", margin: "0 auto 16px" }}>✅</div>
            <h3 style={{ color: "#34d399", fontSize: "20px", fontWeight: 700, margin: "0 0 8px" }}>Payment Successful!</h3>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", margin: "0 0 24px" }}>Your bill has been paid successfully</p>
            {[
              { label: "Biller", value: receipt.biller_name },
              { label: "Consumer No.", value: receipt.consumer_number },
              { label: "Amount Paid", value: fmt(parseFloat(receipt.amount)) },
              { label: "Reference ID", value: receipt.reference_id },
              { label: "Operator Ref", value: receipt.operator_ref },
              { label: "Status", value: receipt.status.toUpperCase() },
            ].map((row) => (
              <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>{row.label}</span>
                <span style={{ color: "#fff", fontSize: "12px", fontWeight: 500 }}>{row.value}</span>
              </div>
            ))}
            <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
              <button onClick={resetAll} style={{ flex: 1, padding: "12px", background: "rgba(255,255,255,0.05)", color: "#fff", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", fontSize: "13px", cursor: "pointer" }}>
                Pay Another Bill
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