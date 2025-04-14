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
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative">
        <textarea
          value={prompt}
          onChange={handleChange}
          placeholder="Enter your prompt here..."
          className="w-full h-24 px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-700 focus:border-transparent text-white placeholder-gray-500 resize-none font-light"
          disabled={disabled}
        />
        <button
          type="submit"
          disabled={!prompt.trim() || disabled}
          className={`absolute bottom-3 right-3 px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200
            ${
              !prompt.trim() || disabled
                ? "bg-gray-900/50 text-gray-500 cursor-not-allowed"
                : "bg-gray-800 hover:bg-gray-700 text-white"
            }`}
        >
          Submit
        </button>
      </div>
    </form>
  );
}
