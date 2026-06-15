"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const GEMINI_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

interface Assignment {
  id: string;
  title: string;
  description: string;
  instructions?: string;
  due_date?: string;
  max_marks: number;
  allowed_file_types: string[];
  submitted: boolean;
}

interface AIResult {
  feedback: string;
  loading: boolean;
  error?: string;
}

export default function AssignmentsPage() {
  const [studentId, setStudentId] = useState<string>("");
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Per-assignment UI state
  const [openPanel, setOpenPanel] = useState<string | null>(null);
  const [isResubmitting, setIsResubmitting] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<Record<string, string>>({});
  const [aiResults, setAiResults] = useState<Record<string, AIResult>>({});

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // ── Load student ID from localStorage ──────────────────────
  useEffect(() => {
    const stored = localStorage.getItem("student_id") || localStorage.getItem("user_id") || "";
    setStudentId(stored);
  }, []);

  // ── Fetch assignments ───────────────────────────────────────
  useEffect(() => {
    if (!studentId) return;
    const fetchAssignments = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API}/api/sp/assignments/student/${studentId}`);
        if (!res.ok) throw new Error("Failed to load assignments");
        const data = await res.json();
        setAssignments(data);
      } catch (e: any) {
        setError(e.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };
    fetchAssignments();
  }, [studentId]);

  // ── Gemini AI Check ─────────────────────────────────────────
  const checkWithAI = async (assignment: Assignment, file: File) => {
    if (!GEMINI_KEY) {
      setAiResults((prev) => ({
        ...prev,
        [assignment.id]: {
          feedback: "",
          loading: false,
          error: "Gemini API key not configured. Add NEXT_PUBLIC_GEMINI_API_KEY to .env.local",
        },
      }));
      return;
    }

    setAiResults((prev) => ({
      ...prev,
      [assignment.id]: { feedback: "", loading: true },
    }));

    try {
      // Read file as base64
      const fileData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]); // strip data:...;base64,
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const ext = file.name.rsplit?.(".", 1)?.[1]?.toLowerCase() || file.name.split(".").pop()?.toLowerCase() || "";
      const mimeMap: Record<string, string> = {
        pdf: "application/pdf",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        doc: "application/msword",
        docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      };
      const mimeType = mimeMap[ext] || "application/octet-stream";

      const prompt = `You are a strict but fair assignment evaluator.

Assignment Title: ${assignment.title}
Description: ${assignment.description}
Instructions: ${assignment.instructions || "Follow standard guidelines"}
Maximum Marks: ${assignment.max_marks}

A student has submitted their assignment file. Read and evaluate the content carefully.

Provide your evaluation in this exact format:

📊 ESTIMATED SCORE: [X / ${assignment.max_marks}]

✅ WHAT'S GOOD:
• [Point 1]
• [Point 2]
• [Point 3]

❌ NEEDS IMPROVEMENT:
• [Point 1]
• [Point 2]

💡 SUGGESTIONS:
• [Actionable tip 1]
• [Actionable tip 2]

🎓 OVERALL GRADE: [A/B/C/D] — [One line justification]

Be specific to the actual content in the file.`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { inline_data: { mime_type: mimeType, data: fileData } },
                  { text: prompt },
                ],
              },
            ],
            generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
          }),
        }
      );

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData?.error?.message || "Gemini API error");
      }

      const data = await res.json();
      const feedback = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No feedback received.";

      setAiResults((prev) => ({
        ...prev,
        [assignment.id]: { feedback, loading: false },
      }));
    } catch (e: any) {
      setAiResults((prev) => ({
        ...prev,
        [assignment.id]: {
          feedback: "",
          loading: false,
          error: e.message || "AI check failed",
        },
      }));
    }
  };

  // ── Submit / Resubmit ───────────────────────────────────────
  const handleSubmit = async (assignmentId: string) => {
    const file = selectedFiles[assignmentId];
    if (!file) return;

    setSubmitting(assignmentId);
    setSubmitError((prev) => ({ ...prev, [assignmentId]: "" }));

    try {
      const formData = new FormData();
      formData.append("student_id", studentId);
      formData.append("file", file);

      const res = await fetch(`${API}/api/sp/assignments/${assignmentId}/submit`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Submission failed");
      }

      const data = await res.json();
      const wasResubmit = isResubmitting === assignmentId;

      setAssignments((prev) =>
        prev.map((a) => (a.id === assignmentId ? { ...a, submitted: true } : a))
      );
      setSubmitSuccess((prev) => ({
        ...prev,
        [assignmentId]: wasResubmit
          ? "Assignment resubmitted successfully! ✅"
          : "Assignment submitted successfully! ✅",
      }));
      setOpenPanel(null);
      setIsResubmitting(null);
      setSelectedFiles((prev) => {
        const next = { ...prev };
        delete next[assignmentId];
        return next;
      });
    } catch (e: any) {
      setSubmitError((prev) => ({
        ...prev,
        [assignmentId]: e.message || "Submission failed",
      }));
    } finally {
      setSubmitting(null);
    }
  };

  // ── Helpers ─────────────────────────────────────────────────
  const openSubmitPanel = (id: string) => {
    setOpenPanel(id);
    setIsResubmitting(null);
    setSelectedFiles((prev) => ({ ...prev, [id]: undefined as any }));
    setSubmitError((prev) => ({ ...prev, [id]: "" }));
    setAiResults((prev) => ({ ...prev, [id]: undefined as any }));
  };

  const openResubmitPanel = (id: string) => {
    setOpenPanel(id);
    setIsResubmitting(id);
    setSelectedFiles((prev) => ({ ...prev, [id]: undefined as any }));
    setSubmitError((prev) => ({ ...prev, [id]: "" }));
    setAiResults((prev) => ({ ...prev, [id]: undefined as any }));
    setSubmitSuccess((prev) => ({ ...prev, [id]: "" }));
  };

  const cancelPanel = (id: string) => {
    setOpenPanel(null);
    setIsResubmitting(null);
    setSelectedFiles((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setAiResults((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const formatDate = (d?: string) => {
    if (!d) return "No due date";
    return new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const isPastDue = (d?: string) => {
    if (!d) return false;
    return new Date(d) < new Date();
  };

  // ── Render ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f1117]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading assignments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f1117]">
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center max-w-md">
          <p className="text-red-400 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1117] px-4 py-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white tracking-tight">Assignments</h1>
          <p className="text-gray-400 text-sm mt-1">
            {assignments.length} assignment{assignments.length !== 1 ? "s" : ""} assigned
          </p>
        </div>

        {/* Assignment Cards */}
        {assignments.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-lg font-medium text-gray-400">No assignments yet</p>
            <p className="text-sm mt-1">Check back later — your instructor will post assignments here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map((a) => (
              <div
                key={a.id}
                className="bg-[#1a1d27] border border-white/[0.07] rounded-2xl overflow-hidden"
              >
                {/* Card Header */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h2 className="text-white font-semibold text-base truncate">{a.title}</h2>
                        {a.submitted && (
                          <span className="shrink-0 text-xs bg-green-500/15 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full">
                            ✓ Submitted
                          </span>
                        )}
                        {!a.submitted && isPastDue(a.due_date) && (
                          <span className="shrink-0 text-xs bg-red-500/15 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full">
                            Overdue
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm line-clamp-2">{a.description}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-indigo-400 font-bold text-lg leading-none">{a.max_marks}</p>
                      <p className="text-gray-500 text-xs">marks</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                    <span
                      className={
                        isPastDue(a.due_date) && !a.submitted ? "text-red-400" : "text-gray-500"
                      }
                    >
                      📅 Due: {formatDate(a.due_date)}
                    </span>
                    <span>📎 {a.allowed_file_types.join(", ").toUpperCase()}</span>
                  </div>

                  {/* Success Message */}
                  {submitSuccess[a.id] && (
                    <div className="mt-3 text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
                      {submitSuccess[a.id]}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-4">
                    {!a.submitted && openPanel !== a.id && (
                      <button
                        onClick={() => openSubmitPanel(a.id)}
                        className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                        Submit Assignment
                      </button>
                    )}
                    {a.submitted && openPanel !== a.id && (
                      <button
                        onClick={() => openResubmitPanel(a.id)}
                        className="text-sm bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30 px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                        🔄 Change Submission
                      </button>
                    )}
                  </div>
                </div>

                {/* Expandable Submit Panel */}
                <AnimatePresence>
                  {openPanel === a.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-white/[0.07] p-5 space-y-4">
                        {/* Resubmit Warning */}
                        {isResubmitting === a.id && (
                          <div className="bg-orange-500/10 border border-orange-500/25 rounded-lg px-4 py-3 text-sm text-orange-300">
                            ⚠️ You are replacing your previously submitted file. The new file will overwrite the old one.
                          </div>
                        )}

                        {/* Instructions */}
                        {a.instructions && (
                          <div className="bg-white/[0.03] rounded-lg px-4 py-3 text-sm text-gray-300">
                            <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Instructions</p>
                            {a.instructions}
                          </div>
                        )}

                        {/* File Upload */}
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">
                            Select file{" "}
                            <span className="text-gray-600 text-xs">
                              ({a.allowed_file_types.join(", ").toUpperCase()})
                            </span>
                          </label>
                          <div
                            onClick={() => fileInputRefs.current[a.id]?.click()}
                            className={`cursor-pointer border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                              selectedFiles[a.id]
                                ? "border-indigo-500/50 bg-indigo-500/5"
                                : "border-white/10 hover:border-white/20 bg-white/[0.02]"
                            }`}
                          >
                            {selectedFiles[a.id] ? (
                              <div>
                                <p className="text-2xl mb-1">📄</p>
                                <p className="text-sm text-indigo-300 font-medium">
                                  {selectedFiles[a.id].name}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {(selectedFiles[a.id].size / 1024).toFixed(1)} KB — click to change
                                </p>
                              </div>
                            ) : (
                              <div>
                                <p className="text-2xl mb-1">📁</p>
                                <p className="text-sm text-gray-400">Click to choose a file</p>
                                <p className="text-xs text-gray-600 mt-1">
                                  Max 10MB — {a.allowed_file_types.join(", ").toUpperCase()}
                                </p>
                              </div>
                            )}
                          </div>
                          <input
                            ref={(el) => (fileInputRefs.current[a.id] = el)}
                            type="file"
                            className="hidden"
                            accept={a.allowed_file_types.map((t) => `.${t}`).join(",")}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setSelectedFiles((prev) => ({ ...prev, [a.id]: file }));
                                // Clear previous AI result when new file selected
                                setAiResults((prev) => {
                                  const next = { ...prev };
                                  delete next[a.id];
                                  return next;
                                });
                              }
                            }}
                          />
                        </div>

                        {/* AI Check Button + Result */}
                        {selectedFiles[a.id] && (
                          <div className="space-y-3">
                            {!aiResults[a.id] && (
                              <button
                                onClick={() => checkWithAI(a, selectedFiles[a.id])}
                                className="w-full text-sm bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 px-4 py-2.5 rounded-lg font-medium transition-colors"
                              >
                                🤖 Check with AI before submitting
                              </button>
                            )}

                            {/* AI Loading */}
                            {aiResults[a.id]?.loading && (
                              <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-5 text-center">
                                <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                                <p className="text-purple-300 text-sm">Gemini is reading your file...</p>
                              </div>
                            )}

                            {/* AI Error */}
                            {aiResults[a.id]?.error && (
                              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                                <p className="text-red-400 text-sm">❌ {aiResults[a.id].error}</p>
                              </div>
                            )}

                            {/* AI Feedback */}
                            {aiResults[a.id]?.feedback && (
                              <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-5">
                                <div className="flex items-center justify-between mb-3">
                                  <p className="text-purple-300 text-xs font-semibold uppercase tracking-wider">
                                    AI Feedback
                                  </p>
                                  <button
                                    onClick={() => checkWithAI(a, selectedFiles[a.id])}
                                    className="text-xs text-purple-400 hover:text-purple-300 underline"
                                  >
                                    Re-check
                                  </button>
                                </div>
                                <pre className="text-gray-300 text-sm whitespace-pre-wrap font-sans leading-relaxed">
                                  {aiResults[a.id].feedback}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Submit Error */}
                        {submitError[a.id] && (
                          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400">
                            {submitError[a.id]}
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-1">
                          <button
                            onClick={() => handleSubmit(a.id)}
                            disabled={!selectedFiles[a.id] || submitting === a.id}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                          >
                            {submitting === a.id ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                {isResubmitting === a.id ? "Resubmitting..." : "Submitting..."}
                              </>
                            ) : isResubmitting === a.id ? (
                              "Resubmit"
                            ) : (
                              "Submit"
                            )}
                          </button>
                          <button
                            onClick={() => cancelPanel(a.id)}
                            className="text-sm text-gray-400 hover:text-white px-4 py-2.5 rounded-lg border border-white/10 hover:border-white/20 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
