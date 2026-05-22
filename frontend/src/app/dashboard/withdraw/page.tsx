"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWalletStore } from "@/store/walletStore";
import { useWithdrawalStore } from "@/store/withdrawalStore";

export default function WithdrawPage() {
  const router = useRouter();
  const { wallet, fetchWallet } = useWalletStore();
  const { withdrawals, fetchWithdrawals, requestWithdrawal } = useWithdrawalStore();

  const [method, setMethod] = useState<"upi" | "bank_transfer">("upi");
  const [amount, setAmount] = useState("");
  const [upiId, setUpiId] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [accountName, setAccountName] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    fetchWallet();
    fetchWithdrawals();
  }, []);

  const handleSubmit = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt < 10) {
      setMsg({ text: "Minimum withdrawal amount is ₹10", type: "error" });
      return;
    }
    if (wallet && amt > parseFloat(wallet.balance)) {
      setMsg({ text: "Insufficient wallet balance", type: "error" });
      return;
    }
    if (method === "upi" && !upiId) {
      setMsg({ text: "Please enter UPI ID", type: "error" });
      return;
    }
    if (method === "bank_transfer" && (!accountNumber || !ifsc || !accountName)) {
      setMsg({ text: "Please fill all bank details", type: "error" });
      return;
    }

    setLoading(true);
    setMsg(null);
    try {
      await requestWithdrawal({
        amount: amt,
        method,
        upi_id: method === "upi" ? upiId : null,
        bank_account_number: method === "bank_transfer" ? accountNumber : null,
        bank_ifsc: method === "bank_transfer" ? ifsc : null,
        bank_account_name: method === "bank_transfer" ? accountName : null,
      });
      await fetchWallet();
      await fetchWithdrawals();
      setAmount("");
      setUpiId("");
      setAccountNumber("");
      setIfsc("");
      setAccountName("");
      setMsg({ text: "Withdrawal request submitted! We will process within 24 hours.", type: "success" });
    } catch (e: any) {
      setMsg({ text: e.response?.data?.detail || "Failed to submit withdrawal", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const fmt = (amount: string) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(parseFloat(amount));

  const statusColor = (status: string) => {
    if (status === "completed") return "#34d399";
    if (status === "rejected") return "#f87171";
    if (status === "processing") return "#60a5fa";
    return "#fbbf24";
  };

  return (
    <div style={{ padding: "28px 32px", maxWidth: "700px", margin: "0 auto", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
        <button onClick={() => router.push("/dashboard")} style={{
          background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
          color: "#fff", borderRadius: "8px", padding: "8px 12px", cursor: "pointer", fontSize: "14px"
        }}>← Back</button>
        <h2 style={{ color: "#fff", fontSize: "20px", fontWeight: 600, margin: 0 }}>Withdraw Money</h2>
      </div>

      {/* Balance Card */}
      <div style={{
        background: "linear-gradient(135deg, #1e1b4b, #2d2a6e)",
        borderRadius: "16px", padding: "20px", marginBottom: "20px",
        border: "1px solid rgba(99,102,241,0.25)"
      }}>
        <p style={{ color: "rgba(165,180,252,0.6)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", margin: 0 }}>Available Balance</p>
        <p style={{ color: "#fff", fontSize: "32px", fontWeight: 700, margin: "8px 0 0", letterSpacing: "-1px" }}>
          {wallet ? fmt(wallet.balance) : "—"}
        </p>
      </div>

      {/* Message */}
      {msg && (
        <div style={{
          borderRadius: "12px", padding: "13px 16px", marginBottom: "20px",
          display: "flex", alignItems: "center", gap: "10px",
          background: msg.type === "success" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
          border: `1px solid ${msg.type === "success" ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
          color: msg.type === "success" ? "#34d399" : "#f87171",
          fontSize: "13px", fontWeight: 500
        }}>
          {msg.type === "success" ? "✅" : "❌"} {msg.text}
        </div>
      )}

      {/* Withdrawal Form */}
      <div style={{ background: "#13131f", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "18px", padding: "24px", marginBottom: "20px" }}>
        <p style={{ color: "#fff", fontSize: "15px", fontWeight: 600, marginBottom: "20px" }}>New Withdrawal Request</p>

        {/* Amount */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", display: "block", marginBottom: "8px" }}>Amount (Min ₹10)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "12px 16px", color: "#fff", fontSize: "14px", outline: "none" }}
          />
          <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
            {[100, 500, 1000, 5000].map((amt) => (
              <button key={amt} onClick={() => setAmount(amt.toString())} style={{
                padding: "5px 12px", background: "rgba(255,255,255,0.05)",
                color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: "8px", fontSize: "12px", cursor: "pointer"
              }}>₹{amt}</button>
            ))}
          </div>
        </div>

        {/* Method */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", display: "block", marginBottom: "8px" }}>Withdrawal Method</label>
          <div style={{ display: "flex", gap: "8px" }}>
            {[
              { value: "upi", label: "📱 UPI" },
              { value: "bank_transfer", label: "🏦 Bank Transfer" }
            ].map((m) => (
              <button key={m.value} onClick={() => setMethod(m.value as any)} style={{
                padding: "8px 20px", borderRadius: "8px", fontSize: "13px", fontWeight: 500,
                background: method === m.value ? "#6366f1" : "rgba(255,255,255,0.05)",
                color: method === m.value ? "#fff" : "rgba(255,255,255,0.4)",
                border: "none", cursor: "pointer"
              }}>{m.label}</button>
            ))}
          </div>
        </div>

        {/* UPI Fields */}
        {method === "upi" && (
          <div style={{ marginBottom: "16px" }}>
            <label style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", display: "block", marginBottom: "8px" }}>UPI ID</label>
            <input
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="yourname@upi"
              style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "12px 16px", color: "#fff", fontSize: "14px", outline: "none" }}
            />
          </div>
        )}

        {/* Bank Fields */}
        {method === "bank_transfer" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
            <div>
              <label style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", display: "block", marginBottom: "8px" }}>Account Holder Name</label>
              <input type="text" value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="Full name as per bank" style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "12px 16px", color: "#fff", fontSize: "14px", outline: "none" }} />
            </div>
            <div>
              <label style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", display: "block", marginBottom: "8px" }}>Account Number</label>
              <input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="Enter account number" style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "12px 16px", color: "#fff", fontSize: "14px", outline: "none" }} />
            </div>
            <div>
              <label style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", display: "block", marginBottom: "8px" }}>IFSC Code</label>
              <input type="text" value={ifsc} onChange={(e) => setIfsc(e.target.value.toUpperCase())} placeholder="SBIN0001234" style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "12px 16px", color: "#fff", fontSize: "14px", outline: "none" }} />
            </div>
          </div>
        )}

        <button onClick={handleSubmit} disabled={loading} style={{
          width: "100%", padding: "14px",
          background: loading ? "rgba(99,102,241,0.5)" : "#6366f1",
          color: "#fff", border: "none", borderRadius: "12px",
          fontSize: "14px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer"
        }}>
          {loading ? "Submitting..." : "Submit Withdrawal Request"}
        </button>

        <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "11px", textAlign: "center", marginTop: "12px" }}>
          Withdrawals are processed within 24 hours. Amount will be deducted immediately.
        </p>
      </div>

      {/* Withdrawal History */}
      <div style={{ background: "#13131f", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "18px", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <p style={{ color: "#fff", fontSize: "14px", fontWeight: 600, margin: 0 }}>Withdrawal History</p>
        </div>
        {withdrawals.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center" }}>
            <p style={{ fontSize: "28px", marginBottom: "8px" }}>💸</p>
            <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "13px" }}>No withdrawal requests yet</p>
          </div>
        ) : (
          withdrawals.map((w) => (
            <div key={w.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
              <div>
                <p style={{ color: "#fff", fontSize: "13px", fontWeight: 500, margin: 0 }}>
                  {w.method === "upi" ? `📱 UPI: ${w.upi_id}` : `🏦 Bank: ${w.bank_account_number}`}
                </p>
                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px", marginTop: "2px" }}>
                  {new Date(w.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>
                {w.admin_note && (
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", marginTop: "2px" }}>
                    Note: {w.admin_note}
                  </p>
                )}
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ color: "#f87171", fontSize: "14px", fontWeight: 700, margin: 0 }}>
                  -{fmt(w.amount)}
                </p>
                <p style={{ color: statusColor(w.status), fontSize: "11px", marginTop: "2px", textTransform: "capitalize" }}>
                  {w.status}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}