"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await api.get("/admin/users");
      setUsers(res.data);
    } catch {
      console.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const filtered = users.filter((u) =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.phone?.includes(search)
  );

  const fmt = (amount: string) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(parseFloat(amount || "0"));

  const statusColor = (status: string) => {
    if (status === "active") return "#34d399";
    if (status === "suspended") return "#f87171";
    return "#fbbf24";
  };

  const kycColor = (status: string) => {
    if (status === "approved") return "#34d399";
    if (status === "rejected") return "#f87171";
    if (status === "pending") return "#fbbf24";
    return "rgba(255,255,255,0.3)";
  };

  return (
    <div style={{ padding: "28px 32px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h1 style={{ color: "#fff", fontSize: "22px", fontWeight: 700, margin: 0 }}>Users</h1>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "13px", marginTop: "4px" }}>
            {users.length} total users
          </p>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or phone..."
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "10px", padding: "10px 16px",
            color: "#fff", fontSize: "13px", outline: "none",
            width: "260px"
          }}
        />
      </div>

      {/* Table */}
      <div style={{ background: "#13131f", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "18px", overflow: "hidden" }}>
        {/* Table Header */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr 1fr", gap: "16px", padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
          {["Name", "Phone", "Balance", "KYC", "Status", "Joined"].map((h) => (
            <p key={h} style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", margin: 0, fontWeight: 600 }}>{h}</p>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: "48px", textAlign: "center" }}>
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px" }}>Loading users...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center" }}>
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px" }}>No users found</p>
          </div>
        ) : (
          filtered.map((user) => (
            <div key={user.id} style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr 1fr", gap: "16px", padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.03)", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "12px", fontWeight: 700, flexShrink: 0 }}>
                  {user.full_name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p style={{ color: "#fff", fontSize: "13px", fontWeight: 500, margin: 0 }}>{user.full_name}</p>
                  <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px", margin: 0 }}>{user.role}</p>
                </div>
              </div>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px", margin: 0 }}>{user.phone}</p>
              <p style={{ color: "#34d399", fontSize: "13px", fontWeight: 600, margin: 0 }}>
                {fmt(user.wallet_balance || "0")}
              </p>
              <span style={{ color: kycColor(user.kyc_status), fontSize: "11px", fontWeight: 500, textTransform: "capitalize" }}>
                {user.kyc_status || "none"}
              </span>
              <span style={{ color: statusColor(user.status), fontSize: "11px", fontWeight: 500, textTransform: "capitalize" }}>
                {user.status}
              </span>
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px", margin: 0 }}>
                {new Date(user.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}