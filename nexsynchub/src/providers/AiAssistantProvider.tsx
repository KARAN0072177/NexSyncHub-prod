"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  confidence?: number;
  sources?: Array<{
    id: string;
    source: string;
    section: string;
    category: string;
    text: string;
    score: number;
  }>;
  isError?: boolean;
};

interface AiAssistantContextType {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  messages: ChatMessage[];
  isGenerating: boolean;
  sendMessage: (text: string) => Promise<void>;
  clearHistory: () => void;
}

const AiAssistantContext = createContext<AiAssistantContextType | undefined>(undefined);

export function AiAssistantProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Initialize with a welcome message on mount
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: "Hi! I am the NexSyncHub AI assistant. Ask me anything about our platform's workspace structure, user permissions, task workflows, notification settings, or billing plans!",
        },
      ]);
    }
  }, [messages.length]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsgId = Math.random().toString();
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsGenerating(true);

    try {
      const res = await fetch("/api/ai/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: text }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to query assistant");
      }

      const data = await res.json();
      
      const assistantMsg: ChatMessage = {
        id: Math.random().toString(),
        role: "assistant",
        content: data.answer,
        confidence: data.confidence,
        sources: data.sources || [],
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: Math.random().toString(),
        role: "assistant",
        content: err.message || "An unexpected error occurred while communicating with the assistant.",
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsGenerating(false);
    }
  };

  const clearHistory = () => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: "History cleared! Ask me anything about NexSyncHub's architecture, permissions, workspace settings, notifications, or Stripe billing.",
      },
    ]);
  };

  return (
    <AiAssistantContext.Provider
      value={{
        isOpen,
        setIsOpen,
        messages,
        isGenerating,
        sendMessage,
        clearHistory,
      }}
    >
      {children}
    </AiAssistantContext.Provider>
  );
}

export function useAiAssistant() {
  const context = useContext(AiAssistantContext);
  if (!context) {
    throw new Error("useAiAssistant must be used within an AiAssistantProvider");
  }
  return context;
}
