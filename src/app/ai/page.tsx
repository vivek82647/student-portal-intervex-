"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";
import Sidebar from "@/components/Sidebar";
import { aiChat } from "@/lib/api";

interface Message { role: "user" | "assistant"; content: string; }

const SUGGESTIONS = [
  "How can I improve my interview performance?",
  "Tips for technical interviews",
  "How to prepare for the next round?",
  "Explain time complexity in simple terms",
  "How to answer behavioral questions?",
];

function AIPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }
  }, [user, authLoading]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || loading || !user) return;
    setInput("");

    const newMessages: Message[] = [...messages, { role: "user", content: msg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await aiChat(user.id, msg, messages);
      setMessages([...newMessages, { role: "assistant", content: res.response }]);
    } catch (e: any) {
      setMessages([...newMessages, { role: "assistant", content: "Sorry, I couldn't process that. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return null;

  return (
    <div style={{ background: "var(--bg)" }} className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <div style={{ background: "var(--bg2)", borderColor: "var(--border)" }} className="border-b p-5 flex-shrink-0">
          <h1 style={{ color: "var(--text)" }} className="text-xl font-bold">🤖 AI Assistant</h1>
          <p style={{ color: "var(--muted)" }} className="text-sm mt-0.5">Ask anything — interview tips, assignment help, study guidance</p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-auto p-5 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">🤖</div>
              <p style={{ color: "var(--text)" }} className="font-semibold text-lg mb-2">How can I help you today?</p>
              <p style={{ color: "var(--muted)" }} className="text-sm mb-8">Ask about your performance, get study tips, or get help with assignments</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} onClick={() => sendMessage(s)}
                    style={{ background: "var(--bg2)", borderColor: "var(--border)", color: "var(--text)" }}
                    className="border rounded-xl px-4 py-2 text-sm hover:border-[#6C63FF] transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6C63FF] to-[#00D4AA] flex items-center justify-center text-white text-sm mr-3 flex-shrink-0 mt-1">
                  🤖
                </div>
              )}
              <div style={m.role === "user"
                ? { background: "linear-gradient(135deg, #6C63FF, #00D4AA)" }
                : { background: "var(--bg2)", borderColor: "var(--border)", color: "var(--text)" }}
                className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === "user" ? "text-white rounded-tr-none" : "border rounded-tl-none"
                }`}>
                {m.content}
              </div>
              {m.role === "user" && (
                <div style={{ background: "rgba(108,99,255,0.2)" }}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#6C63FF] text-sm ml-3 flex-shrink-0 mt-1 font-bold">
                  {user?.full_name?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6C63FF] to-[#00D4AA] flex items-center justify-center text-white text-sm mr-3 flex-shrink-0">
                🤖
              </div>
              <div style={{ background: "var(--bg2)", borderColor: "var(--border)" }}
                className="border rounded-2xl rounded-tl-none px-4 py-3">
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-2 h-2 rounded-full bg-[#6C63FF] animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ background: "var(--bg2)", borderColor: "var(--border)" }} className="border-t p-4 flex-shrink-0">
          <div className="flex gap-3">
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Ask anything..."
              style={{ background: "var(--bg3)", borderColor: "var(--border)", color: "var(--text)" }}
              className="flex-1 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#6C63FF] transition-colors" />
            <button onClick={() => sendMessage()} disabled={loading || !input.trim()}
              className="px-5 rounded-xl bg-gradient-to-r from-[#6C63FF] to-[#00D4AA] text-white font-semibold text-sm hover:opacity-90 disabled:opacity-40 transition-opacity">
              Send
            </button>
          </div>
          <p style={{ color: "var(--muted)" }} className="text-xs mt-2 text-center">
            Powered by Groq AI · Press Enter to send
          </p>
        </div>
      </main>
    </div>
  );
}

export default function Page() {
  return <ThemeProvider><AuthProvider><AIPage /></AuthProvider></ThemeProvider>;
}
