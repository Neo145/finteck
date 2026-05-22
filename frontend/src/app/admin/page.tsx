"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res = await api.get("/admin/stats");
      setStats(res.data);
    } catch {
      console.error("Failed to load stats");
    } finally {
      setLoading(false);
    }
  };

  const fmt = (amount: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
      <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "14px" }}>Loading...</p>
    </div>
  );

  return (
    <div style={{ padding: "28px 32px" }}>

      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ color: "#fff", fontSize: "22px", fontWeight: 700, margin: 0 }}>Admin Dashboard</h1>
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "13px", marginTop: "4px" }}>
          Platform overview and statistics
        </p>
      </div>

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "28px" }}>
        {[
          { label: "Total Users", value: stats?.total_users || 0, icon: "👥", color: "#6366f1", bg: "rgba(99,102,241,0.1)", border: "rgba(99,102,241,0.2)" },
          { label: "Total Transactions", value: stats?.total_transactions || 0, icon: "🔄", color: "#10b981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.2)" },
          { label: "Total Volume", value: fmt(stats?.total_volume || 0), icon: "💰", color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.2)" },
          { label: "Pending KYC", value: stats?.pending_kyc || 0, icon: "🛡️", color: "#ec4899", bg: "rgba(236,72,153,0.1)", border: "rgba(236,72,153,0.2)" },
        ].map((stat) => (
          <div key={stat.label} style={{ background: stat.bg, border: `1px solid ${stat.border}`, borderRadius: "16px", padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <span style={{ fontSize: "24px" }}>{stat.icon}</span>
            </div>
            <p style={{ color: "#fff", fontSize: "24px", fontWeight: 700, margin: "0 0 4px", letterSpacing: "-0.5px" }}>{stat.value}</p>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", margin: 0 }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Second Row Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "28px" }}>
        {[
          { label: "Pending Withdrawals", value: stats?.pending_withdrawals || 0, icon: "💸", color: "#f87171", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.15)", href: "/admin/withdrawals" },
          { label: "Total Wallets", value: stats?.total_wallets || 0, icon: "👛", color: "#60a5fa", bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.15)", href: "/admin/users" },
          { label: "Active Users", value: stats?.active_users || 0, icon: "✅", color: "#34d399", bg: "rgba(52,211,153,0.08)", border: "rgba(52,211,153,0.15)", href: "/admin/users" },
        ].map((stat) => (
          <div key={stat.label} onClick={() => router.push(stat.href)} style={{ background: stat.bg, border: `1px solid ${stat.border}`, borderRadius: "16px", padding: "20px", cursor: "pointer" }}>
            <span style={{ fontSize: "24px" }}>{stat.icon}</span>
            <p style={{ color: "#fff", fontSize: "24px", fontWeight: 700, margin: "10px 0 4px" }}>{stat.value}</p>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", margin: 0 }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ background: "#13131f", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "18px", padding: "20px" }}>
        <p style={{ color: "#fff", fontSize: "14px", fontWeight: 600, marginBottom: "16px" }}>Quick Actions</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
          {[
            { label: "Manage Users", icon: "👥", href: "/admin/users" },
            { label: "Withdrawals", icon: "💸", href: "/admin/withdrawals" },
            { label: "KYC Review", icon: "🛡️", href: "/admin/kyc" },
            { label: "Transactions", icon: "🔄", href: "/admin/transactions" },
          ].map((action) => (
            <button key={action.label} onClick={() => router.push(action.href)} style={{
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "12px", padding: "16px 12px",
              display: "flex", flexDirection: "column", alignItems: "center", gap: "8px",
              cursor: "pointer"
            }}>
              <span style={{ fontSize: "24px" }}>{action.icon}</span>
              <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", fontWeight: 500 }}>{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}