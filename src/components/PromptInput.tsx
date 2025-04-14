"use client";

import { useState, useEffect, useRef } from "react";

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  onComplete: (data: { prompt: string }) => void;
  initialValue?: string;
  onBlur?: () => void;
}

export default function PromptInput({
  onSubmit,
  onComplete,
  initialValue = "",
  onBlur,
}: PromptInputProps) {
  const [prompt, setPrompt] = useState(initialValue);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (initialValue) {
      setPrompt(initialValue);
    }
  }, [initialValue]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleSubmit = () => {
    if (prompt.trim()) {
      onSubmit(prompt);
      onComplete({ prompt });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Check if the related target is within the textarea
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      handleSubmit();
      onBlur?.();
    }
  };

  return (
    <div className="relative">
      <label
        htmlFor="prompt"
        className="block text-sm font-medium text-gray-300 mb-2"
      >
        What would you like to explore about this image?
      </label>
      <textarea
        ref={textareaRef}
        id="prompt"
        rows={3}
        className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-lg focus:ring-2 focus:ring-gray-700 focus:border-transparent text-gray-200 placeholder-gray-500 resize-none"
        placeholder="Describe what you want to explore..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
      />
      <div className="absolute bottom-2 right-2 text-xs text-gray-500 flex items-center gap-1">
        <kbd className="px-2 py-1 bg-gray-800 rounded-md border border-gray-700">
          ⌘
        </kbd>
        <span>+</span>
        <kbd className="px-2 py-1 bg-gray-800 rounded-md border border-gray-700">
          ↵
        </kbd>
      </div>
    </div>
  );
}
