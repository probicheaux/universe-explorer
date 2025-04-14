"use client";

import { useState, useEffect, useRef, forwardRef } from "react";

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  onComplete: (data: { prompt: string }) => void;
  initialValue: string | undefined;
  onBlur?: () => void;
}

const PromptInput = forwardRef<HTMLTextAreaElement, PromptInputProps>(
  ({ onSubmit, onComplete, initialValue = "", onBlur }, ref) => {
    const [prompt, setPrompt] = useState(initialValue);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const finalRef = (ref ||
      textareaRef) as React.RefObject<HTMLTextAreaElement>;

    useEffect(() => {
      if (initialValue) {
        setPrompt(initialValue);
      }
    }, [initialValue]);

    useEffect(() => {
      if (finalRef.current) {
        finalRef.current.focus();
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
            Identify in plain English what you want to understand about your
            image
          </p>
        </div>
        <textarea
          ref={finalRef}
          id="prompt"
          rows={3}
          className="text-sm w-full px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-lg focus:ring-1 focus:ring-gray-700 focus:border-gray-700 text-gray-200 placeholder-gray-500 resize-none outline-none"
          placeholder="Example: I want to identify people and cars in street footage from my security camera"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
        />
        <div className="absolute bottom-4 right-3 text-xs text-gray-500 flex items-center gap-1">
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
);

PromptInput.displayName = "PromptInput";

export default PromptInput;
