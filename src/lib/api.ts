const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function api(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Something went wrong" }));
    throw new Error(err.detail || "Request failed");
  }
  return res.json();
}

// ── Auth ───────────────────────────────────────────────────────
export const spRegister = (data: object) =>
  api("/api/sp/auth/register", { method: "POST", body: JSON.stringify(data) });

export const spLogin = (email: string, password: string) =>
  api("/api/sp/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });

// ── Dashboard ──────────────────────────────────────────────────
export const getDashboard = (studentId: string) =>
  api(`/api/sp/dashboard/${studentId}`);

// ── Results ────────────────────────────────────────────────────
export const getMyResults = (studentId: string) =>
  api(`/api/sp/results/my/${studentId}`);

// ── Assignments ────────────────────────────────────────────────
export const getMyAssignments = (studentId: string) =>
  api(`/api/sp/assignments/student/${studentId}`);

export const submitAssignment = async (
  assignmentId: string,
  studentId: string,
  file: File
) => {
  const formData = new FormData();
  formData.append("student_id", studentId);
  formData.append("file", file);

  const res = await fetch(`${BASE}/api/sp/assignments/${assignmentId}/submit`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Upload failed" }));
    throw new Error(err.detail || "Upload failed");
  }
  return res.json();
};

// ── Notifications ──────────────────────────────────────────────
export const getMyNotifications = (studentId: string) =>
  api(`/api/sp/notifications/my/${studentId}`);

export const markNotifRead = (notifId: string) =>
  api(`/api/sp/notifications/${notifId}/read`, { method: "PATCH" });

export const markAllNotifRead = (studentId: string) =>
  api(`/api/sp/notifications/my/${studentId}/read-all`, { method: "PATCH" });

// ── AI ─────────────────────────────────────────────────────────
export const aiChat = (studentId: string, message: string, history: any[]) =>
  api("/api/sp/ai/chat", {
    method: "POST",
    body: JSON.stringify({ student_id: studentId, message, history }),
  });

export const aiCheckAssignment = (studentId: string, assignmentId: string, text: string) =>
  api("/api/sp/ai/check-assignment", {
    method: "POST",
    body: JSON.stringify({ student_id: studentId, assignment_id: assignmentId, submission_text: text }),
  });
