"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mic, Send, X, MessageSquare, Loader2, Volume2 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AIChatBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const recognitionRef = useRef<any>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize Web Speech API
    if (typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "en-IN";

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsRecording(false);
        handleSendMessage(transcript);
      };

      recognitionRef.current.onerror = () => setIsRecording(false);
      recognitionRef.current.onend = () => setIsRecording(false);
    }
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      setInput("");
      recognitionRef.current?.start();
      setIsRecording(true);
      setIsOpen(true);
    }
  };

  const handleSendMessage = async (text: string = input) => {
    if (!text.trim()) return;

    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: messages }),
      });

      const data = await res.json();
      const assistantMsg: Message = { role: "assistant", content: data.reply };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error("Chat error:", err);
    } finally {
      setIsTyping(false);
    }
  };

  if (typeof window === "undefined") return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[1000] flex flex-col items-center pointer-events-none">
      {/* Agent Response Panel */}
      {isOpen && (
        <div className="w-full max-w-2xl px-4 pointer-events-auto">
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-t-3xl shadow-2xl p-6 mb-0 transition-all duration-300 animate-in slide-in-from-bottom-5">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                <span className="text-sm font-bold text-gray-900 tracking-tight">DEALDROP ADVISOR</span>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            <div className="max-h-[40vh] overflow-y-auto space-y-4 mb-4 scrollbar-hide py-2">
              {messages.length === 0 && (
                <div className="text-center py-8 text-gray-500 italic">
                  "Try: 'Find food deals' or 'Post a flash sale'"
                </div>
              )}
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                      msg.role === "user"
                        ? "bg-orange-500 text-white font-medium rounded-tr-none"
                        : "bg-gray-100 text-gray-800 rounded-tl-none border border-gray-200"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 px-4 py-2 rounded-2xl border border-gray-200 animate-pulse">
                    <Loader2 size={16} className="animate-spin text-orange-500" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Persistent Bottom Bar */}
      <div className="w-full bg-white/90 backdrop-blur-2xl border-t border-gray-100 py-3 px-4 flex items-center justify-center gap-3 pointer-events-auto shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
        <div className="relative flex-1 max-w-3xl flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-1.5 focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:border-orange-500 transition-all">
          <input
            type="text"
            placeholder="Ask anything..."
            className="flex-1 bg-transparent border-none focus:outline-none text-gray-900 text-sm font-medium py-1.5"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            onFocus={() => setIsOpen(true)}
          />
          <button 
            onClick={() => handleSendMessage()}
            className="p-1.5 text-orange-500 hover:bg-orange-50 rounded-xl transition-colors"
          >
            <Send size={18} />
          </button>
        </div>

        <button
          onClick={toggleRecording}
          className={`relative group flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300 ${
            isRecording 
            ? "bg-red-500 text-white scale-110 shadow-lg shadow-red-500/20" 
            : "bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-500/20"
          }`}
        >
          {isRecording ? (
            <>
              <div className="absolute inset-0 bg-red-500 rounded-2xl animate-ping opacity-20" />
              <div className="w-1.5 h-6 bg-white rounded-full animate-bounce mx-0.5" />
              <div className="w-1.5 h-4 bg-white rounded-full animate-bounce mx-0.5 [animation-delay:0.2s]" />
              <div className="w-1.5 h-6 bg-white rounded-full animate-bounce mx-0.5 [animation-delay:0.4s]" />
            </>
          ) : (
            <Mic size={22} className="group-hover:scale-110 transition-transform" />
          )}
        </button>
      </div>
    </div>
  );
}
