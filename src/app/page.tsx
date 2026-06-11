"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";

function Root() {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (loading) return;
    if (!user) router.push("/login");
    else router.push("/dashboard");
  }, [user, loading]);
  return (
    <div style={{ background: "var(--bg)" }} className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#6C63FF] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function Page() {
  return <ThemeProvider><AuthProvider><Root /></AuthProvider></ThemeProvider>;
}
