"use client";

import { useChat } from "@ai-sdk/react";
import { useState, useRef, useEffect, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, Trash2, Bot, User } from "lucide-react";
import { detectCrisis, stripCrisisTrigger } from "@/lib/safety";
import { CrisisModal } from "./CrisisModal";
import { Button } from "@/components/ui/button";

export function Chat() {
  const [showCrisisModal, setShowCrisisModal] = useState(false);
  const [input, setInput] = useState(""); // Kept original local state
  const bottomRef = useRef<HTMLDivElement>(null);

  // #region agent log (Kept as requested)
  const sendDebugLog = (
    hypothesisId: string,
    location: string,
    message: string,
    data: Record<string, unknown>
  ) => {
    fetch("http://127.0.0.1:7770/ingest/e230ba66-cdf4-4e15-9bdc-75e09543307b", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "f4c354",
      },
      body: JSON.stringify({
        sessionId: "f4c354",
        runId: "pre-fix",
        hypothesisId,
        location,
        message,
        data,
        timestamp: Date.now(),
      }),
    }).catch(() => {});
  };
  // #endregion

  const { messages, sendMessage, setMessages, status } = useChat({
    onFinish({ message }) {
      if (detectCrisis(getMessageText(message))) {
        setShowCrisisModal(true);
      }
    },
  });

  const isLoading = status === "submitted" || status === "streaming";

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Robust Message Text Extraction (FIXED)
  // This ensures streaming text actually shows up
  const getMessageText = (message: any): string => {
    if (!message) return "";
    
    // Check for standard content first
    if (typeof message.content === "string" && message.content.length > 0) {
      return message.content;
    }

    // Check for AI SDK "parts" format
    if (Array.isArray(message.parts)) {
      return message.parts
        .map((part: any) => {
          if (part.type === "text") return part.text;
          if (typeof part === "string") return part;
          return "";
        })
        .join("");
    }

    return "";
  };

  // Safe Crisis Content Stripping
  const safeContent = (message: any) => {
    const text = getMessageText(message);
    return stripCrisisTrigger(text);
  };

  const submitCurrentInput = async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    
    setInput(""); // Clear immediately for UX
    try {
      await sendMessage({ text });
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    submitCurrentInput();
  };

  const clearChat = () => {
    setMessages([]);
    setShowCrisisModal(false);
  };

  return (
    <>
      {showCrisisModal && (
        <CrisisModal onDismiss={() => setShowCrisisModal(false)} />
      )}

      <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Header (Original UI Restored) */}
        <header className="border-b border-blue-100 bg-white/70 backdrop-blur-md px-6 py-4 flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">UpliftMate</h1>
              <p className="text-xs text-slate-400">Your workplace wellness companion</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearChat}
            className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 gap-2 rounded-xl"
          >
            <Trash2 className="w-4 h-4" />
            Clear Chat
          </Button>
        </header>

        {/* Messages area (Framer Motion Logic restored) */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          <AnimatePresence initial={false}>
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center h-full text-center gap-4 pt-20"
              >
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-xl">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-700 mb-2">
                    Hi there! I&apos;m UpliftMate 👋
                  </h2>
                  <p className="text-slate-500 max-w-sm">
                    Your confidential space to talk through work stress or just vent. What&apos;s on your mind?
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center mt-2">
                  {["I'm feeling burned out", "Difficult coworker situation", "Imposter syndrome is hitting hard"].map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => setInput(prompt)}
                      className="px-4 py-2 rounded-full bg-white border border-blue-100 text-sm text-slate-600 hover:border-blue-300 hover:bg-blue-50 transition-all shadow-sm"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {messages.map((message) => {
              const textContent = safeContent(message);
              if (!textContent && message.role === 'assistant' && !isLoading) return null;

              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className={`flex items-end gap-2.5 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-sm flex-shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}

                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm text-sm leading-relaxed whitespace-pre-wrap ${
                      message.role === "user"
                        ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-br-sm"
                        : "bg-white text-slate-700 border border-blue-100 rounded-bl-sm"
                    }`}
                  >
                    {textContent || (message.role === 'assistant' && "...") }
                  </div>

                  {message.role === "user" && (
                    <div className="w-8 h-8 rounded-xl bg-slate-200 flex items-center justify-center shadow-sm flex-shrink-0">
                      <User className="w-4 h-4 text-slate-600" />
                    </div>
                  )}
                </motion.div>
              );
            })}

            {/* Typing indicator */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-end gap-2.5"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-sm">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white border border-blue-100 rounded-2xl rounded-bl-sm px-4 py-4 shadow-sm">
                  <div className="flex gap-1.5 items-center h-2">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="w-2 h-2 rounded-full bg-blue-300"
                        animate={{ y: [0, -4, 0] }}
                        transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={bottomRef} className="h-4" />
        </div>

        {/* Input area (Trim Error Fixed) */}
        <div className="border-t border-blue-100 bg-white/70 backdrop-blur-md p-4">
          <form onSubmit={onSubmit} className="flex items-end gap-3 max-w-3xl mx-auto">
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submitCurrentInput();
                  }
                }}
                placeholder="Share what's on your mind..."
                rows={1}
                className="w-full resize-none rounded-2xl border border-blue-200 bg-white px-4 py-3 pr-4 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all shadow-sm max-h-36"
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading || !(input || "").trim()}
              className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-md transition-all flex-shrink-0 p-0 disabled:opacity-50"
            >
              <Send className="w-4 h-4 text-white" />
            </Button>
          </form>
          <p className="text-center text-xs text-slate-400 mt-2">
            UpliftMate is an AI assistant. For emergencies, always contact a professional.
          </p>
        </div>
      </div>
    </>
  );
}