"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";
import Sidebar from "@/components/Sidebar";
import { getMyResults } from "@/lib/api";

const statusConf: any = {
  selected:   { color: "#00D4AA", bg: "rgba(0,212,170,0.1)",  border: "rgba(0,212,170,0.25)",  label: "✅ Selected",    },
  rejected:   { color: "#EF4444", bg: "rgba(239,68,68,0.1)",  border: "rgba(239,68,68,0.25)",  label: "❌ Not Selected" },
  next_round: { color: "#6C63FF", bg: "rgba(108,99,255,0.1)", border: "rgba(108,99,255,0.25)", label: "🚀 Next Round"  },
  pending:    { color: "#F59E0B", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.25)", label: "⏳ Pending"      },
};

function ScoreRing({ pct }: { pct: number }) {
  const color = pct >= 80 ? "#00D4AA" : pct >= 60 ? "#6C63FF" : pct >= 40 ? "#F59E0B" : "#EF4444";
  const r = 28, c = 2 * Math.PI * r, fill = (pct / 100) * c;
  return (
    <div className="relative w-16 h-16 flex-shrink-0">
      <svg className="w-16 h-16 -rotate-90" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={r} fill="none" stroke="var(--border)" strokeWidth="5" />
        <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={`${fill} ${c}`} strokeLinecap="round" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color }}>{pct}%</span>
    </div>
  );
}

function ResultModal({ r, onClose }: { r: any; onClose: () => void }) {
  const sc = statusConf[r.status] || statusConf.pending;
  const [tab, setTab] = useState<"overview" | "questions">("overview");

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div style={{ background: "var(--bg2)", borderColor: "var(--border)" }}
        className="border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div style={{ borderColor: "var(--border)" }} className="p-6 border-b flex justify-between items-start">
          <div>
            <h2 style={{ color: "var(--text)" }} className="font-bold text-lg">{r.session_title}</h2>
            <p style={{ color: "var(--muted)" }} className="text-sm mt-0.5">
              {r.session_date} · {r.round_name}
              {r.admin_name && <span> · By {r.admin_name}</span>}
            </p>
          </div>
          <button onClick={onClose} style={{ color: "var(--muted)" }} className="text-2xl leading-none hover:opacity-70">×</button>
        </div>

        {/* Tabs */}
        <div style={{ borderColor: "var(--border)" }} className="flex border-b px-6">
          {["overview", "questions"].map(t => (
            <button key={t} onClick={() => setTab(t as any)}
              style={tab === t ? { borderColor: "#6C63FF", color: "#6C63FF" } : { borderColor: "transparent", color: "var(--muted)" }}
              className="py-3 px-4 text-sm font-medium border-b-2 capitalize transition-colors">
              {t === "questions" ? "Questions Breakdown" : "Overview"}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-5">
          {tab === "overview" ? (
            <>
              {/* Score + Status */}
              <div className="flex items-center gap-5">
                <ScoreRing pct={Math.round(r.percentage)} />
                <div className="space-y-1.5">
                  <p style={{ color: "var(--text)" }} className="font-bold text-xl">{r.score} / {r.max_score}</p>
                  <span style={{ background: sc.bg, color: sc.color, borderColor: sc.border }}
                    className="text-xs px-3 py-1 rounded-full border font-medium">{sc.label}</span>
                  {r.rank && <p style={{ color: "var(--muted)" }} className="text-xs">Rank #{r.rank}</p>}
                </div>
              </div>

              {/* Next Round */}
              {r.next_round_eligible && r.next_round_link && (
                <div className="bg-[#6C63FF]/10 border border-[#6C63FF]/25 rounded-xl p-4">
                  <p className="text-[#6C63FF] font-semibold text-sm mb-2">🚀 You are eligible for the next round!</p>
                  <a href={r.next_round_link} target="_blank" rel="noopener noreferrer"
                    className="inline-block bg-[#6C63FF] text-white text-xs px-4 py-2 rounded-lg hover:opacity-90">
                    Join Next Round →
                  </a>
                </div>
              )}

              {r.feedback && (
                <div>
                  <p style={{ color: "var(--muted)" }} className="text-xs uppercase tracking-wider mb-2">Feedback</p>
                  <p style={{ background: "var(--bg3)", color: "var(--text)" }} className="text-sm leading-relaxed rounded-xl p-4">{r.feedback}</p>
                </div>
              )}
              {r.strengths?.length > 0 && (
                <div>
                  <p style={{ color: "var(--muted)" }} className="text-xs uppercase tracking-wider mb-2">💪 Strengths</p>
                  <ul className="space-y-1">
                    {r.strengths.map((x: string, i: number) => (
                      <li key={i} style={{ color: "var(--text)" }} className="flex gap-2 text-sm">
                        <span className="text-[#00D4AA]">✓</span>{x}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {r.suggestions?.length > 0 && (
                <div>
                  <p style={{ color: "var(--muted)" }} className="text-xs uppercase tracking-wider mb-2">💡 Suggestions</p>
                  <ul className="space-y-2">
                    {r.suggestions.map((x: string, i: number) => (
                      <li key={i} style={{ color: "var(--text)" }}
                        className="flex gap-2 bg-[#6C63FF]/10 border border-[#6C63FF]/20 rounded-xl p-3 text-sm">
                        <span className="text-[#6C63FF] font-bold">{i + 1}.</span>{x}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            /* Questions Breakdown */
            <div className="space-y-3">
              {(r.questions_data || []).length === 0 ? (
                <div className="text-center py-10" style={{ color: "var(--muted)" }}>
                  <p>No question breakdown available for this result</p>
                </div>
              ) : (
                r.questions_data.map((q: any, i: number) => (
                  <div key={i} style={{
                    background: q.is_correct ? "rgba(0,212,170,0.06)" : "rgba(239,68,68,0.06)",
                    borderColor: q.is_correct ? "rgba(0,212,170,0.2)" : "rgba(239,68,68,0.2)"
                  }} className="border rounded-xl p-4">
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <p style={{ color: "var(--text)" }} className="text-sm font-medium flex-1">
                        <span style={{ color: "var(--muted)" }} className="mr-2">Q{i + 1}.</span>
                        {q.question}
                      </p>
                      <span className={`text-xs font-bold flex-shrink-0 ${q.is_correct ? "text-[#00D4AA]" : "text-red-400"}`}>
                        {q.is_correct ? `+${q.marks_awarded}` : "0"} / {q.max_marks}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span style={{ color: "var(--muted)" }}>Your answer: </span>
                        <span style={{ color: q.is_correct ? "#00D4AA" : "#EF4444" }}>{q.student_answer || "—"}</span>
                      </div>
                      {!q.is_correct && (
                        <div>
                          <span style={{ color: "var(--muted)" }}>Correct: </span>
                          <span className="text-[#00D4AA]">{q.correct_answer || "—"}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Sessions() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }
    getMyResults(user.id).then(setResults).catch(() => setResults([])).finally(() => setLoading(false));
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
      <Sidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="mb-8">
          <h1 style={{ color: "var(--text)" }} className="text-2xl font-bold">My Results</h1>
          <p style={{ color: "var(--muted)" }} className="text-sm mt-1">All your session results and performance</p>
        </div>
        {results.length === 0 ? (
          <div className="text-center py-20" style={{ color: "var(--muted)" }}>
            <div className="text-5xl mb-4">📋</div>
            <p style={{ color: "var(--text)" }} className="font-medium">No results yet</p>
            <p className="text-sm mt-1">Your admin will publish results here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {results.map((r) => {
              const sc = statusConf[r.status] || statusConf.pending;
              return (
                <button key={r.id} onClick={() => setSelected(r)}
                  style={{ background: "var(--bg2)", borderColor: "var(--border)" }}
                  className="w-full border hover:border-[#6C63FF]/40 rounded-2xl p-5 flex items-center gap-5 transition-all text-left group">
                  <ScoreRing pct={Math.round(r.percentage)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p style={{ color: "var(--text)" }} className="font-semibold group-hover:text-[#6C63FF] transition-colors">{r.session_title}</p>
                      <span style={{ background: sc.bg, color: sc.color, borderColor: sc.border }}
                        className="text-xs px-2 py-0.5 rounded-full border">{sc.label}</span>
                    </div>
                    <p style={{ color: "var(--muted)" }} className="text-sm">
                      {r.session_date} · {r.round_name}
                      {r.admin_name && <span> · {r.admin_name}</span>}
                    </p>
                    {r.next_round_eligible && (
                      <p className="text-[#6C63FF] text-xs mt-1">🚀 Eligible for next round</p>
                    )}
                  </div>
                  <span style={{ color: "var(--muted)" }} className="group-hover:opacity-80">→</span>
                </button>
              );
            })}
          </div>
        )}
      </main>
      {selected && <ResultModal r={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

export default function Page() {
  return <ThemeProvider><AuthProvider><Sessions /></AuthProvider></ThemeProvider>;
}
