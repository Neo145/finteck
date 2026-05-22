"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useWalletStore } from "@/store/walletStore";
import { useAuthStore } from "@/store/authStore";
import { useRazorpay } from "@/hooks/useRazorpay";
import { useCashfree } from "@/hooks/useCashfree";
import api from "@/lib/api";

const quickActions = [
  { label: "Bus Booking", icon: "🚌", bg: "rgba(99,102,241,0.1)", href: "/dashboard/bus" },
  { label: "Movies", icon: "🎬", bg: "rgba(236,72,153,0.1)", href: "/dashboard/movies" },
  { label: "Recharge", icon: "📱", bg: "rgba(16,185,129,0.1)", href: "/dashboard/recharge" },
  { label: "Bill Pay", icon: "🧾", bg: "rgba(245,158,11,0.1)", href: "/dashboard/bills" },
];

function DashboardContent() {
  const { wallet, transactions, total, fetchWallet, fetchTransactions, simulateAddMoney } = useWalletStore();
  const { user } = useAuthStore();
  const { initiatePayment: initiateRazorpay } = useRazorpay();
  const { initiatePayment: initiateCashfree } = useCashfree();
  const searchParams = useSearchParams();

  const [showAddMoney, setShowAddMoney] = useState(false);
  const [addAmount, setAddAmount] = useState("");
  const [adding, setAdding] = useState(false);
  const [payMode, setPayMode] = useState(0);
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    fetchWallet();
    fetchTransactions();
    setDateStr(new Date().toLocaleDateString("en-IN", {
      weekday: "long", day: "numeric", month: "long", year: "numeric"
    }));

    const order_id = searchParams.get("order_id");
    if (order_id && order_id.startsWith("CF")) {
      api.post(`/cashfree/verify?order_id=${order_id}`)
        .then(() => {
          fetchWallet();
          fetchTransactions();
          setMsg({ text: "Payment successful! Wallet credited.", type: "success" });
          window.history.replaceState({}, "", "/dashboard");
        })
        .catch(() => {
          setMsg({ text: "Payment verification failed. Contact support.", type: "error" });
        });
    }
  }, []);

  const handleAddMoney = async () => {
    const amount = parseFloat(addAmount);
    if (!amount || amount <= 0) return;
    setAdding(true);
    setMsg(null);
    try {
      const onSuccess = async () => {
        await fetchWallet();
        await fetchTransactions();
        setAddAmount("");
        setShowAddMoney(false);
        setMsg({ text: "Payment successful! Wallet credited.", type: "success" });
      };
      const onError = () => setMsg({ text: "Payment failed. Please try again.", type: "error" });

      if (payMode === 0) {
        await initiateRazorpay({ amount, onSuccess, onError });
      } else if (payMode === 1) {
        await initiateCashfree({ amount, onSuccess, onError });
      } else {
        await simulateAddMoney(amount);
        await fetchTransactions();
        setAddAmount("");
        setShowAddMoney(false);
        setMsg({ text: "Money added successfully!", type: "success" });
      }
    } finally {
      setAdding(false);
    }
  };

  const fmt = (amount: string) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(parseFloat(amount));

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div style={{ padding: "28px 32px", maxWidth: "900px", margin: "0 auto", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      {/* Top Bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h2 style={{ color: "#fff", fontSize: "20px", fontWeight: 600, margin: 0, letterSpacing: "-0.4px" }}>
            {greeting}, {user?.full_name?.split(" ")[0]} 👋
          </h2>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px", marginTop: "3px" }}>{dateStr}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ position: "relative" }}>
            <button style={{
              width: "38px", height: "38px", borderRadius: "10px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.5)", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px"
            }}>🔔</button>
            <span style={{
              position: "absolute", top: "8px", right: "8px",
              width: "7px", height: "7px", background: "#6366f1",
              borderRadius: "50%", border: "1.5px solid #0a0a0f"
            }}></span>
          </div>
          <div style={{
            width: "38px", height: "38px", borderRadius: "10px",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontSize: "14px", fontWeight: 700
          }}>
            {user?.full_name?.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      {/* KYC Banner */}
      {user?.kyc_status !== "approved" && (
        <div style={{
          display: "flex", alignItems: "center", gap: "14px",
          background: "rgba(245,158,11,0.08)",
          border: "1px solid rgba(245,158,11,0.2)",
          borderRadius: "14px", padding: "14px 18px", marginBottom: "20px"
        }}>
          <span style={{ fontSize: "22px" }}>🛡️</span>
          <div style={{ flex: 1 }}>
            <p style={{ color: "#fbbf24", fontSize: "13px", fontWeight: 600, margin: 0 }}>
              Complete your KYC verification
            </p>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", marginTop: "2px" }}>
              Unlock higher transaction limits and full platform access
            </p>
          </div>
          <button style={{
            padding: "7px 16px",
            background: "rgba(245,158,11,0.15)",
            color: "#fbbf24",
            border: "1px solid rgba(245,158,11,0.3)",
            borderRadius: "8px", fontSize: "12px",
            cursor: "pointer", fontWeight: 500, whiteSpace: "nowrap"
          }}>
            Verify Now →
          </button>
        </div>
      )}

      {/* Message */}
      {msg && (
        <div style={{
          borderRadius: "12px", padding: "13px 16px",
          marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px",
          background: msg.type === "success" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
          border: `1px solid ${msg.type === "success" ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
          color: msg.type === "success" ? "#34d399" : "#f87171",
          fontSize: "13px", fontWeight: 500
        }}>
          <span style={{ fontSize: "16px" }}>{msg.type === "success" ? "✅" : "❌"}</span>
          {msg.text}
        </div>
      )}

      {/* Wallet Card */}
      <div style={{
        background: "linear-gradient(135deg, #1e1b4b 0%, #2d2a6e 50%, #1e1b4b 100%)",
        borderRadius: "20px", padding: "28px",
        marginBottom: "20px",
        border: "1px solid rgba(99,102,241,0.25)",
        position: "relative", overflow: "hidden"
      }}>
        <div style={{ position: "absolute", top: "-60px", right: "-60px", width: "200px", height: "200px", background: "rgba(99,102,241,0.12)", borderRadius: "50%", pointerEvents: "none" }}></div>
        <div style={{ position: "absolute", bottom: "-80px", left: "20px", width: "160px", height: "160px", background: "rgba(139,92,246,0.08)", borderRadius: "50%", pointerEvents: "none" }}></div>
        <div style={{ position: "relative" }}>
          <p style={{ color: "rgba(165,180,252,0.6)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 500, margin: 0 }}>
            Total wallet balance
          </p>
          <p style={{ color: "#fff", fontSize: "40px", fontWeight: 700, margin: "10px 0 4px", letterSpacing: "-1px", lineHeight: 1 }}>
            {wallet ? fmt(wallet.balance) : "—"}
          </p>
          <p style={{ color: "rgba(165,180,252,0.4)", fontSize: "12px", marginBottom: "22px" }}>
            INR • Active • Updated just now
          </p>
          <div style={{ display: "flex", gap: "10px" }}>
            {[
              { label: "+ Add Money", primary: true, onClick: () => { setShowAddMoney(!showAddMoney); setMsg(null); } },
              { label: "↑ Send", primary: false, onClick: () => {} },
              { label: "⊞ QR Pay", primary: false, onClick: () => {} },
            ].map((btn) => (
              <button key={btn.label} onClick={btn.onClick} style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "9px 18px",
                background: btn.primary ? "#6366f1" : "rgba(255,255,255,0.1)",
                color: btn.primary ? "#fff" : "rgba(255,255,255,0.8)",
                border: btn.primary ? "none" : "1px solid rgba(255,255,255,0.12)",
                borderRadius: "10px", fontSize: "13px", fontWeight: 500,
                cursor: "pointer"
              }}>{btn.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Add Money Panel */}
      {showAddMoney && (
        <div style={{ background: "#13131f", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "18px", padding: "20px", marginBottom: "20px" }}>
          <p style={{ color: "#fff", fontSize: "14px", fontWeight: 600, marginBottom: "14px" }}>Add money to wallet</p>
          <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
            {["Razorpay", "Cashfree", "Simulate (Dev)"].map((label, i) => (
              <button key={label} onClick={() => setPayMode(i)} style={{
                padding: "7px 16px", borderRadius: "8px", fontSize: "12px", fontWeight: 500,
                background: payMode === i ? "#6366f1" : "rgba(255,255,255,0.05)",
                color: payMode === i ? "#fff" : "rgba(255,255,255,0.4)",
                border: "none", cursor: "pointer"
              }}>{label}</button>
            ))}
          </div>
          <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
            <input
              type="number"
              value={addAmount}
              onChange={(e) => setAddAmount(e.target.value)}
              placeholder="Enter amount"
              style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "12px 16px", color: "#fff", fontSize: "14px", outline: "none" }}
            />
            <button onClick={handleAddMoney} disabled={adding} style={{
              padding: "12px 24px",
              background: adding ? "rgba(99,102,241,0.5)" : "#6366f1",
              color: "#fff", border: "none", borderRadius: "12px",
              fontSize: "13px", fontWeight: 600, cursor: adding ? "not-allowed" : "pointer"
            }}>
              {adding ? "Processing..." : "Pay Now"}
            </button>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            {[100, 500, 1000, 2000].map((amt) => (
              <button key={amt} onClick={() => setAddAmount(amt.toString())} style={{
                padding: "6px 14px", background: "rgba(255,255,255,0.05)",
                color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: "8px", fontSize: "12px", cursor: "pointer"
              }}>₹{amt}</button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "20px" }}>
        {quickActions.map((action) => (
          <button key={action.label} style={{ background: "#13131f", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", padding: "18px 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", cursor: "pointer" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: action.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px" }}>{action.icon}</div>
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", fontWeight: 500 }}>{action.label}</span>
          </button>
        ))}
      </div>

      {/* Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "20px" }}>
        {[
          { icon: "💰", val: wallet ? fmt(wallet.balance) : "—", label: "Wallet balance", sub: "↑ Active", subColor: "#34d399", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.15)" },
          { icon: "🔄", val: String(total), label: "Total transactions", sub: "↑ All time", subColor: "#818cf8", bg: "rgba(99,102,241,0.08)", border: "rgba(99,102,241,0.15)" },
          { icon: "🛡️", val: user?.kyc_status || "—", label: "KYC status", sub: "Action needed", subColor: "#fbbf24", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.15)" },
        ].map((s) => (
          <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: "16px", padding: "18px" }}>
            <span style={{ fontSize: "24px" }}>{s.icon}</span>
            <p style={{ color: "#fff", fontSize: "20px", fontWeight: 700, margin: "10px 0 3px", letterSpacing: "-0.5px" }}>{s.val}</p>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px" }}>{s.label}</p>
            <p style={{ color: s.subColor, fontSize: "11px", marginTop: "6px" }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Transactions */}
      <div style={{ background: "#13131f", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "18px", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <p style={{ color: "#fff", fontSize: "14px", fontWeight: 600, margin: 0 }}>Recent transactions</p>
          <button style={{ color: "#6366f1", fontSize: "12px", background: "none", border: "none", cursor: "pointer" }}>View all →</button>
        </div>
        {transactions.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center" }}>
            <p style={{ fontSize: "32px", marginBottom: "8px" }}>🧾</p>
            <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "13px" }}>No transactions yet</p>
          </div>
        ) : (
          transactions.map((tx) => (
            <div key={tx.id} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
              <div style={{ width: "38px", height: "38px", borderRadius: "12px", background: tx.transaction_type === "credit" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", flexShrink: 0 }}>
                {tx.transaction_type === "credit" ? "⬇️" : "⬆️"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: "#fff", fontSize: "13px", fontWeight: 500, margin: 0, textTransform: "capitalize" }}>
                  {tx.category.replace(/_/g, " ")}
                </p>
                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px", marginTop: "2px" }}>{fmtDate(tx.created_at)}</p>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <p style={{ fontSize: "14px", fontWeight: 700, margin: 0, color: tx.transaction_type === "credit" ? "#34d399" : "#f87171" }}>
                  {tx.transaction_type === "credit" ? "+" : "-"}{fmt(tx.net_amount)}
                </p>
                <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "11px", marginTop: "2px", textTransform: "capitalize" }}>
                  {tx.transaction_status}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div style={{ color: "#fff", padding: "20px" }}>Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}