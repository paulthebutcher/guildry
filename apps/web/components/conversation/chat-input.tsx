"use client";

import { useState, useRef, KeyboardEvent } from "react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  error?: boolean;
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = "Type your message...",
  error = false,
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (value.trim() && !disabled) {
      onSend(value.trim());
      setValue("");
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    // Auto-grow textarea up to 4 lines
    const textarea = e.target;
    textarea.style.height = "auto";
    const lineHeight = 24; // approximate line height
    const maxHeight = lineHeight * 4;
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
  };

  return (
    <div className="flex items-end gap-2">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className={`flex-1 resize-none rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 disabled:bg-slate-100 disabled:cursor-not-allowed ${
          error
            ? "border-red-300 focus:ring-red-500"
            : "border-slate-300 focus:ring-accent-blueprint"
        }`}
        style={{ minHeight: "40px", maxHeight: "96px" }}
      />
      <button
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        className="bg-accent-blueprint text-white px-6 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        style={{ minHeight: "40px" }}
      >
        Send
      </button>
    </div>
  );
}
