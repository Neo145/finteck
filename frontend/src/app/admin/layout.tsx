"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

const adminNav = [
  { label: "Dashboard", icon: "📊", href: "/admin" },
  { label: "Users", icon: "👥", href: "/admin/users" },
  { label: "Transactions", icon: "🔄", href: "/admin/transactions" },
  { label: "Withdrawals", icon: "💸", href: "/admin/withdrawals" },
  { label: "KYC Approvals", icon: "🛡️", href: "/admin/kyc" },
  { label: "Bill Payments", icon: "🧾", href: "/admin/bills" },
  { label: "Recharges", icon: "📱", href: "/admin/recharges" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (user?.role !== "admin") {
      router.push("/dashboard");
    }
  }, [isAuthenticated, user]);

  const handleLogout = () => {
    useAuthStore.getState().logout();
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0a0a0f", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      {/* Sidebar */}
      <aside style={{ width: "220px", background: "#0f0f1a", borderRight: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", flexShrink: 0 }}>

        {/* Logo */}
        <div style={{ padding: "24px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <p style={{ color: "#fff", fontSize: "16px", fontWeight: 700, margin: 0 }}>
            Fintech<span style={{ color: "#6366f1" }}>Pay</span>
          </p>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px", margin: "4px 0 0" }}>Admin Panel</p>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "16px 12px" }}>
          {adminNav.map((item) => (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: "10px",
                padding: "9px 10px", borderRadius: "8px", fontSize: "13px",
                border: "none", cursor: "pointer", marginBottom: "2px",
                background: pathname === item.href ? "rgba(99,102,241,0.15)" : "transparent",
                color: pathname === item.href ? "#818cf8" : "rgba(255,255,255,0.5)",
                textAlign: "left"
              }}
            >
              <span style={{ fontSize: "15px" }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: "12px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ padding: "8px", marginBottom: "8px" }}>
            <p style={{ color: "#fff", fontSize: "12px", fontWeight: 500, margin: 0 }}>{user?.full_name}</p>
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px", margin: "2px 0 0" }}>Administrator</p>
          </div>
          <button onClick={handleLogout} style={{
            width: "100%", padding: "9px",
            background: "rgba(239,68,68,0.1)", color: "#f87171",
            border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px",
            fontSize: "13px", fontWeight: 500, cursor: "pointer"
          }}>
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, overflowY: "auto" }}>
        {children}
      </main>
    </div>
  );
}