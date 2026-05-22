"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function AdminKYCPage() {
  const [kycList, setKycList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [updating, setUpdating] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    loadKYC();
  }, [filter]);

  const loadKYC = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/kyc?status=${filter}`);
      setKycList(res.data);
    } catch {
      console.error("Failed to load KYC");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id: string, status: string) => {
    setUpdating(id);
    setMsg(null);
    try {
      await api.put(`/admin/kyc/${id}`, { status });
      setMsg({ text: `KYC ${status} successfully`, type: "success" });
      await loadKYC();
    } catch (e: any) {
      setMsg({ text: e.response?.data?.detail || "Failed to update KYC", type: "error" });
    } finally {
      setUpdating(null);
    }
  };

  const statusColor = (status: string) => {
    if (status === "approved") return "#34d399";
    if (status === "rejected") return "#f87171";
    return "#fbbf24";
  };

  return (
    <div style={{ padding: "28px 32px" }}>

      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ color: "#fff", fontSize: "22px", fontWeight: 700, margin: 0 }}>KYC Approvals</h1>
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "13px", marginTop: "4px" }}>
          Review and approve user KYC submissions
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
        {["pending", "approved", "rejected"].map((s) => (
          <button key={s} onClick={() => setFilter(s)} style={{
            padding: "8px 16px", borderRadius: "8px", fontSize: "12px", fontWeight: 500,
            background: filter === s ? "#6366f1" : "rgba(255,255,255,0.05)",
            color: filter === s ? "#fff" : "rgba(255,255,255,0.4)",
            border: "none", cursor: "pointer", textTransform: "capitalize"
          }}>{s}</button>
        ))}
      </div>

      {/* KYC Cards */}
      {loading ? (
        <div style={{ padding: "48px", textAlign: "center" }}>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px" }}>Loading...</p>
        </div>
      ) : kycList.length === 0 ? (
        <div style={{ background: "#13131f", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "18px", padding: "48px", textAlign: "center" }}>
          <p style={{ fontSize: "28px", marginBottom: "8px" }}>🛡️</p>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px" }}>No {filter} KYC requests</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {kycList.map((kyc) => (
            <div key={kyc.id} style={{ background: "#13131f", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", padding: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "14px", fontWeight: 700 }}>
                    {kyc.user_id?.toString().charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ color: "#fff", fontSize: "14px", fontWeight: 600, margin: 0 }}>User ID: {kyc.user_id?.toString().slice(0, 16)}...</p>
                    <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px", margin: "2px 0 0" }}>
                      Submitted: {new Date(kyc.created_at).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                </div>
                <span style={{ color: statusColor(kyc.status), fontSize: "12px", fontWeight: 600, textTransform: "capitalize", background: `${statusColor(kyc.status)}15`, padding: "4px 12px", borderRadius: "20px" }}>
                  {kyc.status}
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "16px" }}>
                {[
                  { label: "Document Type", value: kyc.document_type },
                  { label: "Document Number", value: kyc.document_number },
                  { label: "Full Name", value: kyc.full_name },
                ].map((field) => (
                  <div key={field.label} style={{ background: "rgba(255,255,255,0.03)", borderRadius: "8px", padding: "10px 12px" }}>
                    <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 4px" }}>{field.label}</p>
                    <p style={{ color: "#fff", fontSize: "13px", fontWeight: 500, margin: 0, textTransform: "capitalize" }}>{field.value}</p>
                  </div>
                ))}
              </div>

              {kyc.status === "pending" && (
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    onClick={() => handleUpdate(kyc.id, "approved")}
                    disabled={updating === kyc.id}
                    style={{ flex: 1, padding: "10px", background: "rgba(52,211,153,0.15)", color: "#34d399", border: "1px solid rgba(52,211,153,0.3)", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
                  >
                    ✅ Approve KYC
                  </button>
                  <button
                    onClick={() => handleUpdate(kyc.id, "rejected")}
                    disabled={updating === kyc.id}
                    style={{ flex: 1, padding: "10px", background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
                  >
                    ❌ Reject KYC
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}