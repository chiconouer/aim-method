"use client";

import { useEffect, useRef, useState } from "react";
import { getSession } from "@/lib/auth";
import { useAIMAssistant } from "@/components/AIMAssistantContext";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED_QUESTIONS = [
  "Where do I find my course?",
  "How does the platform work?",
  "How do I unlock the next module?",
  "Where is the AI Model Store?",
];

const WELCOME_TEXT =
  "Hey 👋 I'm AIM Assistant. Ask me anything about the course — strategy, content, Instagram, Fanvue setup, whatever you need.";

export function AIMAssistant() {
  const { isOpen, isExpanded, setIsOpen, setIsExpanded, close } =
    useAIMAssistant();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const session = getSession();
    if (session) setEmail(session.email);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Slight delay so the popup is mounted before focusing
      const t = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [isOpen, isExpanded]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isLoading || !email) return;

    setError(null);
    const userMsg: ChatMessage = { role: "user", content: trimmed };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInputValue("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, messages: nextMessages }),
      });
      const data = await res.json();

      if (typeof data?.reply === "string") {
        setMessages([
          ...nextMessages,
          { role: "assistant", content: data.reply },
        ]);
      } else {
        throw new Error(data?.error ?? "Unexpected response");
      }
    } catch (err) {
      console.error("[AIMAssistant] send failed:", err);
      setError(
        "Couldn't reach the assistant. Check your connection and try again.",
      );
      // Roll back the user message? No — keep it visible so they can retry.
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    send(inputValue);
  }

  function handleClose() {
    close();
  }

  return (
    <>
      {/* Floating button — always visible */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Close AIM Assistant" : "Open AIM Assistant"}
        className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 text-white flex items-center justify-center shadow-[0_8px_30px_rgba(139,92,246,0.45)] hover:shadow-[0_10px_40px_rgba(139,92,246,0.7)] hover:-translate-y-0.5 transition-all"
      >
        {isOpen ? <CloseIcon /> : <ChatIcon />}
      </button>

      {/* Expanded backdrop */}
      {isOpen && isExpanded && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsExpanded(false)}
          aria-hidden="true"
        />
      )}

      {/* Chat popup */}
      {isOpen && (
        <div
          className={
            isExpanded
              ? "fixed inset-4 sm:inset-10 md:inset-16 z-50 flex flex-col glass-card rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
              : "fixed z-50 flex flex-col glass-card rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5)] bottom-24 right-5 left-5 top-20 sm:left-auto sm:top-auto sm:bottom-24 sm:right-6 sm:w-[380px] sm:h-[600px] sm:max-h-[calc(100vh-7rem)]"
          }
        >
          {/* Header */}
          <div className="flex items-center gap-3 p-4 border-b border-white/5 bg-[#0d0d0d]">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-extrabold text-base flex-shrink-0">
              AI
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm leading-tight">
                AIM Assistant
              </p>
              <p className="text-gray-500 text-xs">Your AI support</p>
            </div>
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              aria-label={isExpanded ? "Collapse" : "Expand"}
              className="hidden sm:flex w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 items-center justify-center text-gray-400 hover:text-white transition-colors"
            >
              {isExpanded ? <CollapseIcon /> : <ExpandIcon />}
            </button>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close"
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            >
              <CloseIcon />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 flex flex-col gap-3"
          >
            {messages.length === 0 ? (
              <>
                <div className="bg-white/3 border border-white/10 rounded-2xl rounded-tl-sm p-4 max-w-[85%] self-start">
                  <p className="text-gray-200 text-sm leading-relaxed">
                    {WELCOME_TEXT}
                  </p>
                </div>
                <div className="mt-2 flex flex-col gap-2">
                  <p className="text-gray-500 text-[10px] uppercase tracking-wider font-bold px-1">
                    Try asking
                  </p>
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => send(q)}
                      className="text-left bg-purple-500/8 hover:bg-purple-500/15 border border-purple-500/25 hover:border-purple-500/40 rounded-xl px-3 py-2.5 text-purple-200 text-xs transition-all"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                {messages.map((m, i) => (
                  <MessageBubble key={i} message={m} />
                ))}
                {isLoading && <TypingIndicator />}
              </>
            )}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-300 text-xs">
                {error}
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="p-3 border-t border-white/5 bg-[#0d0d0d] flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={
                email ? "Type your message…" : "Sign in to chat"
              }
              disabled={!email || isLoading}
              maxLength={500}
              className="flex-1 bg-white/5 border border-white/10 focus:border-purple-500/50 focus:outline-none rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-gray-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!email || isLoading || !inputValue.trim()}
              aria-label="Send"
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 text-white flex items-center justify-center flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5 transition-all"
            >
              <SendIcon />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div
      className={`max-w-[85%] rounded-2xl p-3 px-4 text-sm leading-relaxed whitespace-pre-wrap ${
        isUser
          ? "self-end bg-gradient-to-br from-purple-500 to-purple-700 text-white rounded-br-sm"
          : "self-start bg-white/5 border border-white/10 text-gray-200 rounded-tl-sm"
      }`}
    >
      {message.content}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="self-start bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-[typingBounce_1.2s_ease-in-out_infinite]" />
      <span
        className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-[typingBounce_1.2s_ease-in-out_infinite]"
        style={{ animationDelay: "0.15s" }}
      />
      <span
        className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-[typingBounce_1.2s_ease-in-out_infinite]"
        style={{ animationDelay: "0.3s" }}
      />
    </div>
  );
}

function ChatIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ExpandIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="15 3 21 3 21 9" />
      <polyline points="9 21 3 21 3 15" />
      <line x1="21" y1="3" x2="14" y2="10" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  );
}

function CollapseIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="4 14 10 14 10 20" />
      <polyline points="20 10 14 10 14 4" />
      <line x1="14" y1="10" x2="21" y2="3" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}
