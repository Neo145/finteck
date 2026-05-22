"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any>(null);
  const [adminNote, setAdminNote] = useState("");
  const [txnRef, setTxnRef] = useState("");
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    loadWithdrawals();
  }, [filter]);

  const loadWithdrawals = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/withdrawals/admin/all?status=${filter}`);
      setWithdrawals(res.data);
    } catch {
      console.error("Failed to load withdrawals");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id: string, status: string) => {
    setUpdating(id);
    setMsg(null);
    try {
      await api.put(`/withdrawals/admin/${id}`, {
        status,
        admin_note: adminNote || `Marked as ${status}`,
        transaction_ref: txnRef || null,
      });
      setMsg({ text: `Withdrawal ${status} successfully`, type: "success" });
      setSelectedWithdrawal(null);
      setAdminNote("");
      setTxnRef("");
      await loadWithdrawals();
    } catch (e: any) {
      setMsg({ text: e.response?.data?.detail || "Failed to update", type: "error" });
    } finally {
      setUpdating(null);
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
    <div style={{ padding: "28px 32px" }}>

      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ color: "#fff", fontSize: "22px", fontWeight: 700, margin: 0 }}>Withdrawals</h1>
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "13px", marginTop: "4px" }}>
          Manage user withdrawal requests
        </p>
      </div>

      {/* Message */}
      {msg && (
        <div style={{ background: msg.type === "success" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", border: `1px solid ${msg.type === "success" ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`, borderRadius: "12px", padding: "12px 16px", marginBottom: "16px", color: msg.type === "success" ? "#34d399" : "#f87171", fontSize: "13px" }}>
          {msg.type === "success" ? "✅" : "❌"} {msg.text}
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        {["pending", "processing", "completed", "rejected"].map((s) => (
          <button key={s} onClick={() => setFilter(s)} style={{
            padding: "8px 16px", borderRadius: "8px", fontSize: "12px", fontWeight: 500,
            background: filter === s ? "#6366f1" : "rgba(255,255,255,0.05)",
            color: filter === s ? "#fff" : "rgba(255,255,255,0.4)",
            border: "none", cursor: "pointer", textTransform: "capitalize"
          }}>{s}</button>
        ))}
      </div>

      {/* Action Panel */}
      {selectedWithdrawal && (
        <div style={{ background: "#13131f", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "16px", padding: "20px", marginBottom: "20px" }}>
          <p style={{ color: "#fff", fontSize: "14px", fontWeight: 600, marginBottom: "16px" }}>
            Process Withdrawal — {fmt(selectedWithdrawal.amount)} via {selectedWithdrawal.method.toUpperCase()}
          </p>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", marginBottom: "12px" }}>
            {selectedWithdrawal.method === "upi" ? `UPI: ${selectedWithdrawal.upi_id}` : `Bank: ${selectedWithdrawal.bank_account_number} | IFSC: ${selectedWithdrawal.bank_ifsc}`}
          </p>
          <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
            <input
              type="text"
              value={txnRef}
              onChange={(e) => setTxnRef(e.target.value)}
              placeholder="Transaction Reference (UTR/Ref No)"
              style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "10px 14px", color: "#fff", fontSize: "13px", outline: "none" }}
            />
            <input
              type="text"
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Admin note (optional)"
              style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "10px 14px", color: "#fff", fontSize: "13px", outline: "none" }}
            />
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={() => handleUpdate(selectedWithdrawal.id, "completed")} disabled={!!updating} style={{ flex: 1, padding: "10px", background: "rgba(52,211,153,0.15)", color: "#34d399", border: "1px solid rgba(52,211,153,0.3)", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
              ✅ Mark Completed
            </button>
            <button onClick={() => handleUpdate(selectedWithdrawal.id, "processing")} disabled={!!updating} style={{ flex: 1, padding: "10px", background: "rgba(96,165,250,0.15)", color: "#60a5fa", border: "1px solid rgba(96,165,250,0.3)", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
              🔄 Mark Processing
            </button>
            <button onClick={() => handleUpdate(selectedWithdrawal.id, "rejected")} disabled={!!updating} style={{ flex: 1, padding: "10px", background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
              ❌ Reject
            </button>
            <button onClick={() => setSelectedWithdrawal(null)} style={{ padding: "10px 16px", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)", border: "none", borderRadius: "8px", fontSize: "13px", cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ background: "#13131f", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "18px", overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr 1fr", gap: "16px", padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
          {["User ID", "Amount", "Method", "Details", "Status", "Action"].map((h) => (
            <p key={h} style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", margin: 0, fontWeight: 600 }}>{h}</p>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: "48px", textAlign: "center" }}>
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px" }}>Loading...</p>
          </div>
        ) : withdrawals.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center" }}>
            <p style={{ fontSize: "28px", marginBottom: "8px" }}>💸</p>
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px" }}>No {filter} withdrawals</p>
          </div>
        ) : (
          withdrawals.map((w) => (
            <div key={w.id} style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr 1fr", gap: "16px", padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.03)", alignItems: "center" }}>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", margin: 0, fontFamily: "monospace" }}>{w.user_id.slice(0, 12)}...</p>
              <p style={{ color: "#f87171", fontSize: "13px", fontWeight: 700, margin: 0 }}>-{fmt(w.amount)}</p>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px", margin: 0, textTransform: "uppercase" }}>{w.method}</p>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", margin: 0 }}>
                {w.method === "upi" ? w.upi_id : `${w.bank_account_number?.slice(0, 8)}...`}
              </p>
              <span style={{ color: statusColor(w.status), fontSize: "11px", fontWeight: 500, textTransform: "capitalize" }}>{w.status}</span>
              {w.status === "pending" || w.status === "processing" ? (
                <button onClick={() => setSelectedWithdrawal(w)} style={{ padding: "6px 12px", background: "rgba(99,102,241,0.15)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "6px", fontSize: "11px", cursor: "pointer", fontWeight: 500 }}>
                  Process
                </button>
              ) : (
                <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "11px", margin: 0 }}>
                  {w.transaction_ref || "—"}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}