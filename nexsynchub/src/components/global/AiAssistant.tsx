"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAiAssistant, ChatMessage } from "@/providers/AiAssistantProvider";
import { 
  MessageSquareCode, 
  Send, 
  X, 
  Trash2, 
  Sparkles, 
  User, 
  FileText,
  AlertCircle
} from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function AiAssistant() {
  const { 
    isOpen, 
    setIsOpen, 
    messages, 
    isGenerating, 
    sendMessage, 
    clearHistory 
  } = useAiAssistant();
  
  const [input, setInput] = useState("");
  const [selectedSource, setSelectedSource] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom of chat thread when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isGenerating) return;
    sendMessage(input);
    setInput("");
  };

  const handleChipClick = (question: string) => {
    if (isGenerating) return;
    sendMessage(question);
  };

  const suggestionChips = [
    "How does RBAC work?",
    "How does Stripe billing work?",
    "How do notifications work?",
    "How do task comments work?",
  ];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-500/20 transition-all duration-300 hover:scale-110 hover:bg-blue-700 hover:shadow-blue-500/40 active:scale-95"
        title="Ask NexSyncHub AI"
        id="ai-assistant-trigger"
      >
        <MessageSquareCode className="h-6 w-6 animate-pulse" />
      </button>
    );
  }

  return (
    <div 
      className="fixed bottom-6 right-6 z-50 flex h-[580px] w-96 flex-col overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/90 text-slate-100 shadow-2xl shadow-black/50 backdrop-blur-md transition-all duration-300 ease-in-out md:w-[420px]"
      id="ai-assistant-drawer"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm tracking-wide">NexSyncHub AI</h3>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] text-slate-400 font-medium">Assistant Online</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={clearHistory}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
            title="Clear Chat History"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
            title="Close Assistant"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 max-w-[85%] ${
              msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
            }`}
          >
            {/* Avatar */}
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                msg.role === "user"
                  ? "bg-blue-600/10 text-blue-400 border border-blue-500/20"
                  : msg.isError
                  ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                  : "bg-slate-800 text-slate-300 border border-slate-700/50"
              }`}
            >
              {msg.role === "user" ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
            </div>

            {/* Bubble */}
            <div className="space-y-1.5">
              <div
                className={`rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-tr-none font-medium"
                    : msg.isError
                    ? "bg-rose-950/40 text-rose-200 border border-rose-900/30 rounded-tl-none"
                    : "bg-slate-800/80 text-slate-200 border border-slate-700/30 rounded-tl-none"
                }`}
              >
                {msg.role === "user" ? (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <div className="prose prose-invert prose-sm max-w-none text-slate-200">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                )}
              </div>

              {/* Confidence & Sources */}
              {msg.role === "assistant" && msg.sources && msg.sources.length > 0 && (
                <div className="flex flex-col gap-1 pt-0.5">
                  <span className="text-[9px] text-slate-500 font-medium pl-1">Sources:</span>
                  <div className="flex flex-wrap gap-1.5 pl-1">
                    {msg.sources.map((src, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelectedSource(src)}
                        className="flex items-center gap-1 rounded bg-slate-800/90 border border-slate-700/50 px-2.5 py-1 text-[9px] text-slate-300 font-medium hover:bg-slate-750 hover:text-white transition-all duration-200 active:scale-95 cursor-pointer"
                      >
                        <FileText className="h-3 w-3 text-blue-400" />
                        <span>📄 {src.section}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Typing Loading State */}
        {isGenerating && (
          <div className="flex gap-3 max-w-[85%] mr-auto">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-slate-300 border border-slate-700/50">
              <Sparkles className="h-4 w-4 animate-spin text-blue-400" />
            </div>
            <div className="flex items-center gap-1.5 rounded-2xl bg-slate-800/80 border border-slate-700/30 px-4 py-3 rounded-tl-none">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "0ms" }}></span>
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "150ms" }}></span>
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "300ms" }}></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Chips */}
      {messages.length === 1 && !isGenerating && (
        <div className="px-4 py-2 border-t border-slate-800/50 bg-slate-950/20">
          <p className="text-[10px] font-medium text-slate-400 mb-1.5">Suggested Questions:</p>
          <div className="flex flex-wrap gap-1.5">
            {suggestionChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleChipClick(chip)}
                className="rounded-full bg-blue-950/40 border border-blue-900/30 hover:bg-blue-900/30 text-blue-300 hover:text-blue-200 px-3 py-1 text-[10px] font-medium transition-all duration-200 text-left active:scale-95"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Footer */}
      <form 
        onSubmit={handleSubmit}
        className="border-t border-slate-800 bg-slate-950/60 p-3"
      >
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question..."
            disabled={isGenerating}
            className="flex-1 rounded-xl bg-slate-800/70 border border-slate-700/50 px-3.5 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500/70 focus:bg-slate-800 transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isGenerating}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white transition-all hover:bg-blue-700 active:scale-95 disabled:bg-slate-800 disabled:text-slate-500 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>

      {/* Click-to-view Source Modal Overlay */}
      {selectedSource && (
        <div className="absolute inset-0 z-55 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="flex h-[420px] w-[90%] flex-col rounded-xl border border-slate-700/60 bg-slate-900/95 text-slate-100 shadow-2xl p-4 overflow-hidden">
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-800 pb-2 mb-3">
              <div>
                <h4 className="font-semibold text-xs text-blue-400 leading-tight">📄 {selectedSource.section}</h4>
                <div className="flex flex-wrap gap-x-3 text-[9px] text-slate-400 mt-1">
                  <span>Source: <span className="text-slate-300">{selectedSource.source}</span></span>
                  <span>Similarity: <span className="text-slate-300">{(selectedSource.score * 100).toFixed(0)}%</span></span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSource(null)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto pr-1 text-[11px] leading-relaxed text-slate-300 prose prose-invert prose-sm max-w-none select-text selection:bg-blue-600/30">
              <ReactMarkdown>{selectedSource.text}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
