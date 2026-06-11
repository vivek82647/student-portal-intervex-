"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { spLogin } from "@/lib/api";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ThemeProvider, useTheme } from "@/lib/theme";

function LoginPage() {
  const { setUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    if (!form.email || !form.password) { setError("Email and password are required"); return; }
    setLoading(true);
    try {
      const res = await spLogin(form.email, form.password);
      setUser({ ...res.user, access_token: res.access_token });
      router.push("/dashboard");
    } catch (e: any) {
      setError(e.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: "var(--bg)" }} className="min-h-screen flex items-center justify-center p-4">
      <button onClick={toggleTheme}
        style={{ background: "var(--bg2)", border: "1px solid var(--border)", color: "var(--muted)" }}
        className="fixed top-4 right-4 px-3 py-2 rounded-xl text-sm hover:opacity-80">
        {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
      </button>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6C63FF] to-[#00D4AA] flex items-center justify-center text-white font-bold text-lg">IX</div>
            <span style={{ color: "var(--text)" }} className="text-2xl font-bold">Intervex</span>
          </div>
          <p style={{ color: "var(--muted)" }} className="text-sm">Student Performance Portal</p>
        </div>

        <div style={{ background: "var(--bg2)", borderColor: "var(--border)" }} className="border rounded-2xl p-8">
          <h2 style={{ color: "var(--text)" }} className="font-semibold text-lg mb-6">Sign In</h2>
          <div className="space-y-4">
            <div>
              <label style={{ color: "var(--muted)" }} className="text-xs mb-1.5 block">Email</label>
              <input type="email" placeholder="your@email.com" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                style={{ background: "var(--bg3)", borderColor: "var(--border)", color: "var(--text)" }}
                className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#6C63FF]" />
            </div>
            <div>
              <label style={{ color: "var(--muted)" }} className="text-xs mb-1.5 block">Password</label>
              <input type="password" placeholder="••••••••" value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                style={{ background: "var(--bg3)", borderColor: "var(--border)", color: "var(--text)" }}
                className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#6C63FF]" />
            </div>
            {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">{error}</div>}
            <button onClick={handleLogin} disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#6C63FF] to-[#00D4AA] text-white font-semibold text-sm hover:opacity-90 disabled:opacity-50">
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </div>
          <div style={{ borderColor: "var(--border)" }} className="border-t mt-6 pt-5 text-center space-y-2">
            <p style={{ color: "var(--muted)" }} className="text-xs">New here? Create an account</p>
            <button onClick={() => router.push("/register")}
              style={{ borderColor: "var(--border)", color: "var(--text)" }}
              className="w-full py-2.5 rounded-xl border text-sm font-medium hover:border-[#6C63FF]">
              Register with Secret Code
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return <ThemeProvider><AuthProvider><LoginPage /></AuthProvider></ThemeProvider>;
}
