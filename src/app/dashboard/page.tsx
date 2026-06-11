"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";
import Sidebar from "@/components/Sidebar";
import { getDashboard } from "@/lib/api";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

function ScoreBar({ score, max = 100 }: { score: number; max?: number }) {
  const pct = Math.round((score / max) * 100);
  const color = pct >= 80 ? "#00D4AA" : pct >= 60 ? "#6C63FF" : pct >= 40 ? "#F59E0B" : "#EF4444";
  return (
    <div className="flex items-center gap-3">
      <div style={{ background: "var(--bg3)" }} className="flex-1 h-1.5 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs font-mono font-semibold w-8 text-right" style={{ color }}>{pct}%</span>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: any; color: string }) {
  const colors: any = {
    purple: { text: "#6C63FF", border: "rgba(108,99,255,0.2)", bg: "rgba(108,99,255,0.08)" },
    teal:   { text: "#00D4AA", border: "rgba(0,212,170,0.2)",  bg: "rgba(0,212,170,0.08)" },
    yellow: { text: "#F59E0B", border: "rgba(245,158,11,0.2)", bg: "rgba(245,158,11,0.08)" },
    red:    { text: "#EF4444", border: "rgba(239,68,68,0.2)",  bg: "rgba(239,68,68,0.08)" },
  };
  const c = colors[color] || colors.purple;
  return (
    <div style={{ background: c.bg, borderColor: c.border }} className="border rounded-2xl p-5">
      <p style={{ color: "var(--muted)" }} className="text-xs mb-1">{label}</p>
      <p className="text-3xl font-bold" style={{ color: c.text }}>{value}</p>
    </div>
  );
}

function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }
    getDashboard(user.id).then(setData).catch(() => setData(null)).finally(() => setLoading(false));
  }, [user, authLoading]);

  if (loading || authLoading) return (
    <div style={{ background: "var(--bg)" }} className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#6C63FF] border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  return (
    <div style={{ background: "var(--bg)" }} className="flex min-h-screen">
      <Sidebar unreadCount={data?.unread_notifications || 0} />
      <main className="flex-1 p-6 overflow-auto">
        <div className="mb-8">
          <h1 style={{ color: "var(--text)" }} className="text-2xl font-bold">
            Welcome back, {user?.full_name?.split(" ")[0]} 👋
          </h1>
          <p style={{ color: "var(--muted)" }} className="text-sm mt-1">
            {data?.batch && <span className="text-[#00D4AA] mr-2">{data.batch}</span>}
            Performance overview
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Sessions" value={data?.total_sessions || 0} color="purple" />
          <StatCard label="Avg Score" value={`${data?.avg_score || 0}%`} color="teal" />
          <StatCard label="Best Score" value={`${data?.best_score || 0}%`} color="yellow" />
          <StatCard label="Unread Alerts" value={data?.unread_notifications || 0} color="red" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div style={{ background: "var(--bg2)", borderColor: "var(--border)" }} className="lg:col-span-2 border rounded-2xl p-6">
            <h2 style={{ color: "var(--text)" }} className="font-semibold mb-4">Score Trend</h2>
            {(data?.score_trend || []).length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data.score_trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="session" tick={{ fill: "var(--muted)", fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: "var(--muted)", fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "12px", color: "var(--text)" }} />
                  <Line type="monotone" dataKey="score" stroke="#6C63FF" strokeWidth={2.5} dot={{ fill: "#6C63FF", r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center" style={{ color: "var(--muted)" }}>
                <div className="text-center">
                  <div className="text-4xl mb-3">📊</div>
                  <p className="text-sm">No sessions yet</p>
                  <p className="text-xs mt-1">Admin results publish karega yahan</p>
                </div>
              </div>
            )}
          </div>

          <div style={{ background: "var(--bg2)", borderColor: "var(--border)" }} className="border rounded-2xl p-6">
            <h2 style={{ color: "var(--text)" }} className="font-semibold mb-4">Round Progress</h2>
            <div className="space-y-4">
              {(data?.score_trend || []).slice(0, 4).map((t: any, i: number) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: "var(--muted)" }} className="truncate">{t.session}</span>
                    <span style={{ color: "var(--text)" }} className="font-mono ml-2">{t.score}/100</span>
                  </div>
                  <ScoreBar score={t.score} />
                </div>
              ))}
              {!(data?.score_trend || []).length && <p style={{ color: "var(--muted)" }} className="text-sm">No rounds yet</p>}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button onClick={() => router.push("/sessions")}
            style={{ background: "var(--bg2)", borderColor: "var(--border)" }}
            className="border hover:border-[#6C63FF]/50 rounded-2xl p-5 text-left transition-all group">
            <div className="text-2xl mb-2">📋</div>
            <p style={{ color: "var(--text)" }} className="font-semibold group-hover:text-[#6C63FF] transition-colors">View All Sessions</p>
            <p style={{ color: "var(--muted)" }} className="text-sm mt-1">Detailed results, feedback, suggestions</p>
          </button>
          <button onClick={() => router.push("/notifications")}
            style={{ background: "var(--bg2)", borderColor: "var(--border)" }}
            className="border hover:border-[#00D4AA]/50 rounded-2xl p-5 text-left transition-all group relative">
            {(data?.unread_notifications || 0) > 0 && (
              <span className="absolute top-4 right-4 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                {data.unread_notifications} new
              </span>
            )}
            <div className="text-2xl mb-2">🔔</div>
            <p style={{ color: "var(--text)" }} className="font-semibold group-hover:text-[#00D4AA] transition-colors">Notifications</p>
            <p style={{ color: "var(--muted)" }} className="text-sm mt-1">Selection updates, round results, admin messages</p>
          </button>
        </div>
      </main>
    </div>
  );
}

export default function Page() {
  return <ThemeProvider><AuthProvider><Dashboard /></AuthProvider></ThemeProvider>;
}
