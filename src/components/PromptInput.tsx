"use client";

import { useState, ChangeEvent, FormEvent } from "react";

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  disabled?: boolean;
}

export default function PromptInput({
  onSubmit,
  disabled = false,
}: PromptInputProps) {
  const [prompt, setPrompt] = useState("");

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onSubmit(prompt);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl">
      <div className="relative">
        <textarea
          value={prompt}
          onChange={handleChange}
          placeholder="Enter your prompt here..."
          className="w-full h-24 px-4 py-3 bg-purple-950/30 border border-purple-800/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent text-white placeholder-purple-300/50 resize-none"
          disabled={disabled}
        />
        <button
          type="submit"
          disabled={!prompt.trim() || disabled}
          className={`absolute bottom-3 right-3 px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200
            ${
              !prompt.trim() || disabled
                ? "bg-purple-900/30 text-purple-400/50 cursor-not-allowed"
                : "bg-purple-600 hover:bg-purple-500 text-white"
            }`}
        >
          Submit
        </button>
      </div>
    </form>
  );
}
