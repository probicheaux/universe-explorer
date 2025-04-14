"use client";

import { useState, useEffect, useRef } from "react";

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  onComplete: (data: { prompt: string }) => void;
  initialValue: string | undefined;
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
      <div className="space-y-2 mb-4">
        <h3 className="text-lg font-semibold tracking-tight text-gray-100">
          What do you want to understand about your image?
        </h3>
        <p className="text-xs text-gray-400 leading-relaxed">
          Identify in plain English what you want to understand about your image
        </p>
      </div>
      <textarea
        ref={textareaRef}
        id="prompt"
        rows={3}
        className="text-sm w-full px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-lg focus:ring-2 focus:ring-gray-700 focus:border-transparent text-gray-200 placeholder-gray-500 resize-none"
        placeholder="Example: I want to identify people and cars in street footage from my security camera"
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
