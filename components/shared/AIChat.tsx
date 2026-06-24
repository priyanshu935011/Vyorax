"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAIChatStore, useCartStore } from "@/lib/store";
import { Sparkles, X, Send, RefreshCw, MessageSquare } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function AIChat() {
  const pathname = usePathname();
  const { isOpen, setIsOpen, messages, isLoading, sendMessage, clearChat } = useAIChatStore();
  const cartItems = useCartStore((state) => state.items);

  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, messages]);

  // Suggested quick replies
  const suggestions = [
    "Find me a cycle under ₹30,000",
    "What's good for weight loss?",
    "Compare MTB vs city cycle",
  ];

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    setInput("");
    
    // Inject current page and cart context
    const productContext = pathname.startsWith("/products/")
      ? { slug: pathname.split("/").pop() }
      : null;
    const cartContext = cartItems.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
    }));

    await sendMessage(text, productContext, cartContext);
  };

  return (
    <div className="fixed bottom-20 md:bottom-6 right-6 z-50 flex flex-col items-end">
      
      {/* Floating Action Button (Cycle Wheel inspired) */}
      <motion.button
        id="ai-chat-trigger"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 rounded-full bg-[var(--agni)] text-neutral-50 shadow-2xl flex items-center justify-center hover:bg-[var(--agni-light)] transition-colors focus:outline-none border-2 border-[var(--white)]/10 relative group"
        title="AI Shopping Assistant"
      >
        <Sparkles size={22} className="group-hover:rotate-12 transition-transform duration-300" />
        
        {/* Animated outer ring (cycle wheel spokes feel) */}
        <span className="absolute inset-0 rounded-full border border-[var(--agni)] animate-ping opacity-25 pointer-events-none" />
      </motion.button>

      {/* Chat Interface Slider Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ type: "spring", damping: 20, stiffness: 250 }}
            className="fixed inset-0 sm:absolute sm:inset-auto sm:bottom-20 sm:right-0 w-screen sm:w-[400px] h-[100dvh] sm:h-[550px] max-h-none bg-[var(--charcoal)] border-0 sm:border border-[var(--steel)]/60 rounded-none sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden glass-panel-glow z-50"
          >
            {/* Panel Header */}
            <div className="p-4 bg-[var(--carbon)] border-b border-[var(--steel)] flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-full bg-[var(--agni)] flex items-center justify-center">
                  <Sparkles size={16} className="text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-sans font-bold text-white leading-none">Vyorax Assistant</h3>
                  <span className="text-[10px] text-[var(--gold-light)] font-sans font-semibold">Online · Claude 3.5</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-1">
                <button
                  onClick={clearChat}
                  className="p-1.5 rounded-full text-[var(--smoke)] hover:text-white hover:bg-[var(--charcoal)] transition-colors"
                  title="Clear conversation"
                >
                  <RefreshCw size={14} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-full text-[var(--smoke)] hover:text-white hover:bg-[var(--charcoal)] transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Message Thread */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-[var(--obsidian)]/30">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed font-sans ${
                      msg.role === "user"
                        ? "bg-[var(--agni)] text-neutral-50 rounded-tr-none"
                        : "bg-[var(--carbon)] text-[var(--chalk)] border border-[var(--steel)]/60 rounded-tl-none prose prose-invert prose-xs"
                    }`}
                  >
                    {msg.role === "user" ? (
                      msg.content
                    ) : (
                      <div className="markdown-chat">
                        <ReactMarkdown>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-[var(--carbon)] text-[var(--silver)] border border-[var(--steel)]/60 rounded-2xl rounded-tl-none px-4 py-3 flex space-x-1 items-center">
                    <span className="w-1.5 h-1.5 bg-[var(--silver)] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-[var(--silver)] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-[var(--silver)] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestions */}
            {messages.length === 1 && !isLoading && (
              <div className="px-4 py-2 border-t border-[var(--steel)]/40 bg-[var(--carbon)]/50 space-y-1.5">
                <span className="text-[10px] text-[var(--smoke)] font-sans uppercase font-bold tracking-wider">Suggested Questions:</span>
                <div className="flex flex-col space-y-1">
                  {suggestions.map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(suggestion)}
                      className="text-left w-full text-[11px] font-sans text-[var(--silver)] hover:text-[var(--agni-light)] transition-colors py-1 flex items-center space-x-1.5"
                    >
                      <MessageSquare size={10} className="text-[var(--agni)]" />
                      <span className="truncate">{suggestion}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Bar */}
            <div className="p-4 bg-[var(--carbon)] border-t border-[var(--steel)] flex items-center space-x-2">
              <input
                type="text"
                placeholder="Ask Vyorax Shopping AI..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend(input)}
                className="flex-1 bg-[var(--obsidian)] border border-[var(--steel)] rounded-lg px-3 py-2.5 text-xs text-white placeholder-[var(--smoke)] focus:outline-none focus:border-[var(--agni)]"
              />
              <button
                onClick={() => handleSend(input)}
                disabled={isLoading}
                className="p-2.5 rounded-lg bg-[var(--agni)] hover:bg-[var(--agni-light)] text-neutral-50 disabled:opacity-50 disabled:hover:bg-[var(--agni)] transition-colors focus:outline-none"
              >
                <Send size={14} />
              </button>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
