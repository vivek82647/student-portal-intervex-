"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { spRegister } from "@/lib/api";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ThemeProvider, useTheme } from "@/lib/theme";

function RegisterPage() {
  const { setUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [form, setForm] = useState({
    full_name: "", email: "", password: "", confirm: "",
    secret_code: "", batch: "", college: "", phone: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError("");
    if (!form.full_name || !form.email || !form.password || !form.secret_code) {
      setError("Name, email, password and secret code are required"); return;
    }
    if (form.password !== form.confirm) { setError("Passwords do not match"); return; }
    if (form.password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setLoading(true);
    try {
      const res = await spRegister({
        full_name: form.full_name,
        email: form.email,
        password: form.password,
        secret_code: form.secret_code,
        batch: form.batch || null,
        college: form.college || null,
        phone: form.phone || null,
      });
      setUser({ ...res.user, access_token: res.access_token });
      router.push("/dashboard");
    } catch (e: any) {
      setError(e.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { key: "full_name",   label: "Full Name",           type: "text",     placeholder: "Your full name",      required: true },
    { key: "email",       label: "Email",               type: "email",    placeholder: "your@email.com",      required: true },
    { key: "secret_code", label: "Secret Code",         type: "text",     placeholder: "Code from your admin",required: true },
    { key: "batch",       label: "Batch (optional)",    type: "text",     placeholder: "e.g. Batch 2024",     required: false },
    { key: "college",     label: "College (optional)",  type: "text",     placeholder: "College / University", required: false },
    { key: "phone",       label: "Phone (optional)",    type: "tel",      placeholder: "+91 XXXXX XXXXX",     required: false },
    { key: "password",    label: "Password",            type: "password", placeholder: "Min 8 characters",    required: true },
    { key: "confirm",     label: "Confirm Password",    type: "password", placeholder: "Re-enter password",   required: true },
  ];

  return (
    <div style={{ background: "var(--bg)" }} className="min-h-screen flex items-center justify-center p-4">
      <button onClick={toggleTheme}
        style={{ background: "var(--bg2)", border: "1px solid var(--border)", color: "var(--muted)" }}
        className="fixed top-4 right-4 px-3 py-2 rounded-xl text-sm hover:opacity-80">
        {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
      </button>

      <div className="relative w-full max-w-md my-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6C63FF] to-[#00D4AA] flex items-center justify-center text-white font-bold text-lg">IX</div>
            <span style={{ color: "var(--text)" }} className="text-2xl font-bold">Intervex</span>
          </div>
          <p style={{ color: "var(--muted)" }} className="text-sm">Create your student account</p>
        </div>

        <div style={{ background: "var(--bg2)", borderColor: "var(--border)" }} className="border rounded-2xl p-8">
          <h2 style={{ color: "var(--text)" }} className="font-semibold text-lg mb-2">Create Account</h2>
          <p style={{ color: "var(--muted)" }} className="text-xs mb-6">
            You need a <span className="text-[#6C63FF] font-medium">secret code</span> from your admin to register
          </p>

          <div className="space-y-4">
            {fields.map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label style={{ color: "var(--muted)" }} className="text-xs mb-1.5 block">{label}</label>
                <input type={type} placeholder={placeholder}
                  value={(form as any)[key]}
                  onChange={e => setForm({ ...form, [key]: e.target.value })}
                  style={{ background: "var(--bg3)", borderColor: "var(--border)", color: "var(--text)" }}
                  className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors ${
                    key === "secret_code" ? "focus:border-[#00D4AA] font-mono tracking-wider" : "focus:border-[#6C63FF]"
                  }`} />
              </div>
            ))}

            {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">{error}</div>}

            <button onClick={handleRegister} disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#6C63FF] to-[#00D4AA] text-white font-semibold text-sm hover:opacity-90 disabled:opacity-50">
              {loading ? "Creating account..." : "Register"}
            </button>
          </div>

          <div style={{ borderColor: "var(--border)" }} className="border-t mt-6 pt-5 text-center">
            <p style={{ color: "var(--muted)" }} className="text-xs mb-2">Already have an account?</p>
            <button onClick={() => router.push("/login")}
              style={{ borderColor: "var(--border)", color: "var(--text)" }}
              className="w-full py-2.5 rounded-xl border text-sm font-medium hover:border-[#6C63FF]">
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return <ThemeProvider><AuthProvider><RegisterPage /></AuthProvider></ThemeProvider>;
}
