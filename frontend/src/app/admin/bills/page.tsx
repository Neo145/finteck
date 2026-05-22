"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function AdminBillsPage() {
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBills();
  }, []);

  const loadBills = async () => {
    try {
      const res = await api.get("/admin/bill-payments");
      setBills(res.data);
    } catch {
      console.error("Failed to load bills");
    } finally {
      setLoading(false);
    }
  };

  const fmt = (amount: string) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(parseFloat(amount || "0"));

  const statusColor = (status: string) => {
    if (status === "success") return "#34d399";
    if (status === "failed") return "#f87171";
    return "#fbbf24";
  };

  const categoryIcon = (cat: string) => {
    const icons: any = { electricity: "⚡", water: "💧", gas: "🔥", dth: "📺", broadband: "🌐", mobile_postpaid: "📱", insurance: "🛡️", loan_emi: "🏦" };
    return icons[cat] || "🧾";
  };

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ color: "#fff", fontSize: "22px", fontWeight: 700, margin: 0 }}>Bill Payments</h1>
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "13px", marginTop: "4px" }}>All BBPS bill payment transactions</p>
      </div>

      <div style={{ background: "#13131f", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "18px", overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr 1.5fr 1fr 1fr 1.5fr", gap: "16px", padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
          {["Category", "Biller", "Consumer No.", "Amount", "Status", "Date"].map((h) => (
            <p key={h} style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", margin: 0, fontWeight: 600 }}>{h}</p>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: "48px", textAlign: "center" }}>
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px" }}>Loading...</p>
          </div>
        ) : bills.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center" }}>
            <p style={{ fontSize: "28px", marginBottom: "8px" }}>🧾</p>
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px" }}>No bill payments yet</p>
          </div>
        ) : (
          bills.map((bill) => (
            <div key={bill.id} style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr 1.5fr 1fr 1fr 1.5fr", gap: "16px", padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.03)", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "16px" }}>{categoryIcon(bill.category)}</span>
                <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px", textTransform: "capitalize" }}>{bill.category?.replace(/_/g, " ")}</span>
              </div>
              <p style={{ color: "#fff", fontSize: "12px", fontWeight: 500, margin: 0 }}>{bill.biller_name}</p>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", margin: 0, fontFamily: "monospace" }}>{bill.consumer_number}</p>
              <p style={{ color: "#f87171", fontSize: "13px", fontWeight: 700, margin: 0 }}>-{fmt(bill.amount)}</p>
              <span style={{ color: statusColor(bill.status), fontSize: "11px", fontWeight: 500, textTransform: "capitalize" }}>{bill.status}</span>
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px", margin: 0 }}>
                {new Date(bill.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}