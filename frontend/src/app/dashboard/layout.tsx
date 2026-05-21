"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { fetchProfile } = useAuthStore();

  useEffect(() => {
    fetchProfile().then(() => {
      const state = useAuthStore.getState();
      if (!state.isAuthenticated) {
        router.push("/login");
      }
    });
  }, []);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0a0a0f" }}>
      <Sidebar />
      <main style={{ flex: 1, overflow: "auto", marginLeft: "0" }}>
        {children}
      </main>
    </div>
  );
}