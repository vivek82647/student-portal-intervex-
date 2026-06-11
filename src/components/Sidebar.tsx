"use client";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { useState } from "react";

const navLinks = [
  { href: "/dashboard",     icon: "⊞",  label: "Dashboard" },
  { href: "/sessions",      icon: "📋",  label: "Results" },
  { href: "/assignments",   icon: "📝",  label: "Assignments" },
  { href: "/notifications", icon: "🔔",  label: "Notifications" },
  { href: "/ai",            icon: "🤖",  label: "AI Assistant" },
];

interface Props {
  unreadCount?: number;
  pendingAssignments?: number;
}

export default function Sidebar({ unreadCount = 0, pendingAssignments = 0 }: Props) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      style={{ background: "var(--bg2)", borderColor: "var(--border)" }}
      className={`flex flex-col border-r min-h-screen transition-all duration-300 ${collapsed ? "w-16" : "w-60"}`}
    >
      {/* Logo */}
      <div style={{ borderColor: "var(--border)" }} className="flex items-center gap-3 p-4 border-b">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6C63FF] to-[#00D4AA] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          IX
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p style={{ color: "var(--text)" }} className="font-semibold text-sm">Intervex</p>
            <p style={{ color: "var(--muted)" }} className="text-xs">Student Portal</p>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} style={{ color: "var(--muted)" }} className="ml-auto text-sm hover:opacity-80">
          {collapsed ? "→" : "←"}
        </button>
      </div>

      {/* User */}
      {!collapsed && user && (
        <div style={{ borderColor: "var(--border)" }} className="p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#6C63FF]/30 to-[#00D4AA]/30 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
              {user.full_name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p style={{ color: "var(--text)" }} className="text-sm font-medium truncate">{user.full_name}</p>
              <p style={{ color: "var(--muted)" }} className="text-xs truncate">{user.batch || user.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          const notifBadge = link.label === "Notifications" && unreadCount > 0;
          const assignBadge = link.label === "Assignments" && pendingAssignments > 0;
          return (
            <button key={link.href} onClick={() => router.push(link.href)}
              style={isActive
                ? { background: "rgba(108,99,255,0.15)", color: "#6C63FF" }
                : { color: "var(--muted)" }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all hover:opacity-90 ${isActive ? "font-medium" : ""}`}>
              <span className="text-base flex-shrink-0">{link.icon}</span>
              {!collapsed && <span className="flex-1 text-left">{link.label}</span>}
              {!collapsed && notifBadge && (
                <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
              {!collapsed && assignBadge && (
                <span className="bg-yellow-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                  {pendingAssignments}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div style={{ borderColor: "var(--border)" }} className="p-3 border-t space-y-1">
        <button onClick={toggleTheme} style={{ color: "var(--muted)" }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm hover:opacity-80 transition-all">
          <span>{theme === "dark" ? "☀️" : "🌙"}</span>
          {!collapsed && <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>}
        </button>
        <button onClick={() => { logout(); router.push("/login"); }}
          style={{ color: "var(--muted)" }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm hover:text-red-400 transition-all">
          <span>🚪</span>
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
