"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";
import Sidebar from "@/components/Sidebar";
import { getMyNotifications, markNotifRead, markAllNotifRead } from "@/lib/api";

const typeConf: any = {
  success: { icon: "🎉", border: "rgba(0,212,170,0.2)",   bg: "rgba(0,212,170,0.05)"   },
  info:    { icon: "ℹ️",  border: "rgba(108,99,255,0.2)", bg: "rgba(108,99,255,0.05)"  },
  warning: { icon: "⚠️",  border: "rgba(245,158,11,0.2)", bg: "rgba(245,158,11,0.05)"  },
  error:   { icon: "❌",  border: "rgba(239,68,68,0.2)",   bg: "rgba(239,68,68,0.05)"  },
};

function timeAgo(d: string) {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function Notifications() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [notifs, setNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const unread = notifs.filter(n => !n.is_read).length;

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }
    getMyNotifications(user.id).then(setNotifs).catch(() => setNotifs([])).finally(() => setLoading(false));
  }, [user, authLoading]);

  const doMarkRead = async (id: string) => {
    await markNotifRead(id);
    setNotifs(n => n.map(x => x.id === id ? { ...x, is_read: true } : x));
  };
  const doMarkAll = async () => {
    await markAllNotifRead(user!.id);
    setNotifs(n => n.map(x => ({ ...x, is_read: true })));
  };

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
      <Sidebar unreadCount={unread} />
      <main className="flex-1 p-6 overflow-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 style={{ color: "var(--text)" }} className="text-2xl font-bold">Notifications</h1>
            <p className="text-sm mt-1">
              {unread > 0 ? <span className="text-red-400">{unread} unread</span> : <span style={{ color: "var(--muted)" }}>All caught up!</span>}
            </p>
          </div>
          {unread > 0 && (
            <button onClick={doMarkAll} className="text-sm text-[#6C63FF] border border-[#6C63FF]/30 px-4 py-2 rounded-xl hover:bg-[#6C63FF]/10">
              Mark all read
            </button>
          )}
        </div>
        {notifs.length === 0 ? (
          <div className="text-center py-20" style={{ color: "var(--muted)" }}>
            <div className="text-5xl mb-4">🔔</div>
            <p style={{ color: "var(--text)" }} className="font-medium">No notifications yet</p>
            <p className="text-sm mt-1">Your admin will send updates here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifs.map(n => {
              const conf = typeConf[n.type] || typeConf.info;
              return (
                <div key={n.id} style={{ borderColor: conf.border, background: conf.bg }}
                  className={`border rounded-2xl p-5 transition-opacity ${n.is_read ? "opacity-55" : ""}`}>
                  <div className="flex items-start gap-4">
                    <span className="text-2xl flex-shrink-0">{conf.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p style={{ color: "var(--text)" }} className="font-semibold">{n.title}</p>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {!n.is_read && <span className="w-2 h-2 rounded-full bg-red-500" />}
                          <span style={{ color: "var(--muted)" }} className="text-xs">{timeAgo(n.created_at)}</span>
                        </div>
                      </div>
                      <p style={{ color: "var(--text)" }} className="text-sm mt-1 opacity-70 leading-relaxed">{n.message}</p>
                      {!n.is_read && (
                        <button onClick={() => doMarkRead(n.id)} className="mt-2 text-xs text-[#6C63FF] hover:opacity-80">
                          Mark as read →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default function Page() {
  return <ThemeProvider><AuthProvider><Notifications /></AuthProvider></ThemeProvider>;
}
