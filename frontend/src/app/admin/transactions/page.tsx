"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadTransactions();
  }, [page]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/transactions?page=${page}&limit=20`);
      setTransactions(res.data.transactions || res.data);
      setTotal(res.data.total || res.data.length);
    } catch {
      console.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  const filtered = transactions.filter((tx) =>
    tx.category?.toLowerCase().includes(search.toLowerCase()) ||
    tx.reference_id?.toLowerCase().includes(search.toLowerCase())
  );

  const fmt = (amount: string) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(parseFloat(amount || "0"));

  const typeColor = (type: string) => type === "credit" ? "#34d399" : "#f87171";

  const statusColor = (status: string) => {
    if (status === "completed") return "#34d399";
    if (status === "failed") return "#f87171";
    return "#fbbf24";
  };

  return (
    <div style={{ padding: "28px 32px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h1 style={{ color: "#fff", fontSize: "22px", fontWeight: 700, margin: 0 }}>Transactions</h1>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "13px", marginTop: "4px" }}>
            All platform transactions
          </p>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by category or reference..."
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "10px 16px", color: "#fff", fontSize: "13px", outline: "none", width: "280px" }}
        />
      </div>

      {/* Table */}
      <div style={{ background: "#13131f", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "18px", overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr 1.5fr", gap: "16px", padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
          {["Category", "Type", "Amount", "Fee", "Status", "Date"].map((h) => (
            <p key={h} style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", margin: 0, fontWeight: 600 }}>{h}</p>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: "48px", textAlign: "center" }}>
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px" }}>Loading transactions...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center" }}>
            <p style={{ fontSize: "28px", marginBottom: "8px" }}>🔄</p>
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px" }}>No transactions found</p>
          </div>
        ) : (
          filtered.map((tx) => (
            <div key={tx.id} style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr 1.5fr", gap: "16px", padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.03)", alignItems: "center" }}>
              <p style={{ color: "#fff", fontSize: "13px", fontWeight: 500, margin: 0, textTransform: "capitalize" }}>
                {tx.category?.replace(/_/g, " ")}
              </p>
              <span style={{ color: typeColor(tx.transaction_type), fontSize: "12px", fontWeight: 600, textTransform: "capitalize" }}>
                {tx.transaction_type === "credit" ? "⬇️ Credit" : "⬆️ Debit"}
              </span>
              <p style={{ color: typeColor(tx.transaction_type), fontSize: "13px", fontWeight: 700, margin: 0 }}>
                {tx.transaction_type === "credit" ? "+" : "-"}{fmt(tx.net_amount)}
              </p>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", margin: 0 }}>
                {fmt(tx.fee_amount || "0")}
              </p>
              <span style={{ color: statusColor(tx.transaction_status), fontSize: "11px", fontWeight: 500, textTransform: "capitalize" }}>
                {tx.transaction_status}
              </span>
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px", margin: 0 }}>
                {new Date(tx.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "16px" }}>
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px" }}>
          Showing {filtered.length} transactions
        </p>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} style={{ padding: "8px 16px", background: "rgba(255,255,255,0.05)", color: page === 1 ? "rgba(255,255,255,0.2)" : "#fff", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px", cursor: page === 1 ? "not-allowed" : "pointer" }}>
            ← Prev
          </button>
          <span style={{ padding: "8px 16px", color: "#fff", fontSize: "12px", background: "#6366f1", borderRadius: "8px" }}>
            Page {page}
          </span>
          <button onClick={() => setPage(page + 1)} style={{ padding: "8px 16px", background: "rgba(255,255,255,0.05)", color: "#fff", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px", cursor: "pointer" }}>
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}