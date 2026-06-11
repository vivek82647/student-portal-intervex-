"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";
import Sidebar from "@/components/Sidebar";
import { getMyAssignments, submitAssignment, aiCheckAssignment } from "@/lib/api";

function AssignmentCard({ a, studentId, onSubmitted }: { a: any; studentId: string; onSubmitted: () => void }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [aiText, setAiText] = useState("");
  const [aiResult, setAiResult] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const isOverdue = a.due_date && new Date(a.due_date) < new Date();

  const handleSubmit = async () => {
    if (!file) { setError("Please select a file"); return; }
    setError(""); setUploading(true);
    try {
      await submitAssignment(a.id, studentId, file);
      setSuccess("Assignment submitted successfully! ✅");
      setTimeout(() => { onSubmitted(); setOpen(false); }, 2000);
    } catch (e: any) {
      setError(e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleAiCheck = async () => {
    if (!aiText.trim()) { setError("Please paste your answer first"); return; }
    setError(""); setAiLoading(true);
    try {
      const res = await aiCheckAssignment(studentId, a.id, aiText);
      setAiResult(res.feedback);
    } catch (e: any) {
      setError(e.message || "AI check failed");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div style={{ background: "var(--bg2)", borderColor: a.submitted ? "rgba(0,212,170,0.3)" : "var(--border)" }}
      className="border rounded-2xl overflow-hidden transition-all">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 style={{ color: "var(--text)" }} className="font-semibold">{a.title}</h3>
              {a.submitted && (
                <span className="text-xs bg-[#00D4AA]/15 text-[#00D4AA] border border-[#00D4AA]/25 px-2 py-0.5 rounded-full">✅ Submitted</span>
              )}
              {isOverdue && !a.submitted && (
                <span className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full">⚠️ Overdue</span>
              )}
            </div>
            <p style={{ color: "var(--muted)" }} className="text-sm line-clamp-2">{a.description}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-[#6C63FF] font-bold text-sm">{a.max_marks} marks</p>
            {a.due_date && (
              <p style={{ color: "var(--muted)" }} className="text-xs mt-0.5">
                Due: {new Date(a.due_date).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {a.admin_name && (
          <p style={{ color: "var(--muted)" }} className="text-xs mb-3">By {a.admin_name}</p>
        )}

        {!a.submitted && (
          <button onClick={() => setOpen(!open)}
            className="text-sm text-[#6C63FF] border border-[#6C63FF]/30 px-4 py-2 rounded-xl hover:bg-[#6C63FF]/10 transition-colors">
            {open ? "Close" : "View & Submit"}
          </button>
        )}
      </div>

      {open && !a.submitted && (
        <div style={{ borderColor: "var(--border)" }} className="border-t p-5 space-y-5">
          {a.instructions && (
            <div>
              <p style={{ color: "var(--muted)" }} className="text-xs uppercase tracking-wider mb-2">Instructions</p>
              <p style={{ background: "var(--bg3)", color: "var(--text)" }} className="text-sm rounded-xl p-3 leading-relaxed">{a.instructions}</p>
            </div>
          )}

          {/* File Upload */}
          <div>
            <p style={{ color: "var(--muted)" }} className="text-xs uppercase tracking-wider mb-2">Submit File</p>
            <p style={{ color: "var(--muted)" }} className="text-xs mb-2">Allowed: {a.allowed_file_types?.join(", ")}</p>
            <input ref={fileRef} type="file"
              accept={a.allowed_file_types?.map((t: string) => `.${t}`).join(",")}
              onChange={e => setFile(e.target.files?.[0] || null)}
              className="hidden" />
            <div className="flex gap-2">
              <button onClick={() => fileRef.current?.click()}
                style={{ borderColor: "var(--border)", color: "var(--text)" }}
                className="flex-1 border rounded-xl py-3 text-sm hover:border-[#6C63FF] transition-colors">
                {file ? `📎 ${file.name}` : "Choose File (PDF / Word / Image)"}
              </button>
              {file && (
                <button onClick={handleSubmit} disabled={uploading}
                  className="px-5 rounded-xl bg-gradient-to-r from-[#6C63FF] to-[#00D4AA] text-white text-sm font-semibold disabled:opacity-50">
                  {uploading ? "Uploading..." : "Submit"}
                </button>
              )}
            </div>
          </div>

          {/* AI Check */}
          <div style={{ borderColor: "var(--border)" }} className="border-t pt-4">
            <p style={{ color: "var(--muted)" }} className="text-xs uppercase tracking-wider mb-2">🤖 AI Assignment Check</p>
            <p style={{ color: "var(--muted)" }} className="text-xs mb-2">Paste your answer text below to get AI feedback before submitting</p>
            <textarea value={aiText} onChange={e => setAiText(e.target.value)}
              rows={4} placeholder="Paste your answer here..."
              style={{ background: "var(--bg3)", borderColor: "var(--border)", color: "var(--text)" }}
              className="w-full border rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-[#6C63FF] mb-2" />
            <button onClick={handleAiCheck} disabled={aiLoading}
              className="text-sm bg-[#6C63FF]/15 text-[#6C63FF] border border-[#6C63FF]/30 px-4 py-2 rounded-xl hover:bg-[#6C63FF]/25 transition-colors disabled:opacity-50">
              {aiLoading ? "Checking..." : "🤖 Check with AI"}
            </button>
            {aiResult && (
              <div style={{ background: "var(--bg3)", borderColor: "var(--border)" }}
                className="mt-3 border rounded-xl p-4 text-sm whitespace-pre-wrap" style={{ color: "var(--text)" }}>
                {aiResult}
              </div>
            )}
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}
          {success && <p className="text-[#00D4AA] text-sm">{success}</p>}
        </div>
      )}
    </div>
  );
}

function Assignments() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    if (!user) return;
    getMyAssignments(user.id).then(setAssignments).catch(() => setAssignments([])).finally(() => setLoading(false));
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }
    load();
  }, [user, authLoading]);

  const pending = assignments.filter(a => !a.submitted).length;

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
      <Sidebar pendingAssignments={pending} />
      <main className="flex-1 p-6 overflow-auto">
        <div className="mb-8">
          <h1 style={{ color: "var(--text)" }} className="text-2xl font-bold">Assignments</h1>
          <p style={{ color: "var(--muted)" }} className="text-sm mt-1">
            {pending > 0
              ? <span className="text-yellow-400">{pending} pending</span>
              : "All caught up!"}
            {" · "}
            {assignments.length} total
          </p>
        </div>

        {assignments.length === 0 ? (
          <div className="text-center py-20" style={{ color: "var(--muted)" }}>
            <div className="text-5xl mb-4">📝</div>
            <p style={{ color: "var(--text)" }} className="font-medium">No assignments yet</p>
            <p className="text-sm mt-1">Your admin will post assignments here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map(a => (
              <AssignmentCard key={a.id} a={a} studentId={user!.id} onSubmitted={load} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function Page() {
  return <ThemeProvider><AuthProvider><Assignments /></AuthProvider></ThemeProvider>;
}
