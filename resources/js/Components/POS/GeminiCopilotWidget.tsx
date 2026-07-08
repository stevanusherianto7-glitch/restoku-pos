import React, { useState, useRef, useEffect } from "react";

interface Message {
  id: string;
  sender: "user" | "gemini";
  text: string;
  timestamp: string;
}

export default function GeminiCopilotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-1",
      sender: "gemini",
      text: "Halo! Saya **Restoku AI Co-Pilot**. Apa yang ingin Anda periksa mengenai jadwal operasional, pajak tenant, analisa penjualan, atau operasional hari ini?",
      timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const getCsrfToken = () => {
    const el = document.querySelector('meta[name="csrf-token"]');
    return el ? el.getAttribute("content") || "" : "";
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const promptToSend = customPrompt || inputMessage;
    if (!promptToSend.trim() || isLoading) return;

    const userMsg: Message = {
      id: "usr-" + Date.now(),
      sender: "user",
      text: promptToSend,
      timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setInputMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-TOKEN": getCsrfToken(),
          "Accept": "application/json",
        },
        body: JSON.stringify({ message: promptToSend }),
      });

      const data = await response.json();

      if (response.ok && data.status === "success") {
        setMessages((prev) => [
          ...prev,
          {
            id: "gem-" + Date.now(),
            sender: "gemini",
            text: data.reply || "Selesai memproses permintaan Anda.",
            timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: "err-" + Date.now(),
            sender: "gemini",
            text: `⚠️ **Gagal memproses:** ${data.message || "Terjadi kesalahan koneksi ke server."}`,
            timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      }
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: "err-" + Date.now(),
          sender: "gemini",
          text: `⚠️ **Error jaringan:** ${error.message || "Tidak dapat terhubung ke server Asisten AI."}`,
          timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    "Cek jam operasional outlet 1",
    "Cek konfigurasi pajak tenant 1",
    "Bagaimana aturan void di Restoku?",
  ];

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white font-semibold rounded-full shadow-2xl hover:shadow-indigo-500/50 transition-all duration-300 transform hover:-translate-y-1 group border border-indigo-400/30"
          title="Buka Restoku AI Co-Pilot"
        >
          <span className="text-xl animate-pulse">✨</span>
          <span className="text-sm tracking-wide">AI Co-Pilot</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping ml-1"></span>
        </button>
      </div>

      {/* Chat Drawer / Window */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 w-[400px] sm:w-[440px] h-[540px] bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col z-50 text-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 bg-gradient-to-r from-indigo-900/80 via-purple-900/80 to-slate-900/90 border-b border-slate-700/60">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-lg shadow-inner">
                ✨
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                  Restoku AI Co-Pilot
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 font-mono">
                    Enterprise
                  </span>
                </h3>
                <p className="text-[11px] text-slate-300">Asisten Pintar Operasional & Keuangan</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  <span className="text-[10px] font-medium text-slate-400">
                    {msg.sender === "user" ? "Anda (Manager)" : "✨ Restoku AI Co-Pilot"}
                  </span>
                  <span className="text-[10px] text-slate-500">• {msg.timestamp}</span>
                </div>
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-none shadow-md"
                      : "bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-bl-none shadow-sm whitespace-pre-line"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex flex-col items-start animate-pulse">
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  <span className="text-[10px] font-medium text-indigo-400">✨ Restoku AI Co-Pilot</span>
                </div>
                <div className="bg-slate-800/90 border border-slate-700/60 px-4 py-3 rounded-2xl rounded-bl-none flex items-center gap-2">
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-bounce delay-200"></div>
                  </div>
                  <span className="text-xs text-slate-300 font-medium">
                    Sedang berpikir & memanggil skill...
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="px-3 py-2 bg-slate-900/60 border-t border-slate-800/80 flex gap-1.5 overflow-x-auto scrollbar-none">
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(qp)}
                disabled={isLoading}
                className="whitespace-nowrap px-2.5 py-1 text-[11px] bg-slate-800/80 hover:bg-indigo-600/30 text-slate-300 hover:text-indigo-200 border border-slate-700 hover:border-indigo-500/50 rounded-full transition-all flex items-center gap-1 shrink-0"
              >
                <span>💡</span>
                <span>{qp}</span>
              </button>
            ))}
          </div>

          {/* Input Area */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-slate-950/80 border-t border-slate-800 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Tanyakan ke Asisten AI Restoku..."
              disabled={isLoading}
              className="flex-1 bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
            />
            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-semibold rounded-xl transition-all shadow-md flex items-center justify-center shrink-0"
            >
              Kirim
            </button>
          </form>
        </div>
      )}
    </>
  );
}
