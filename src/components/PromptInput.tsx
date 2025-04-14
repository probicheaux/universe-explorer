"use client";

import { useState, useEffect } from "react";

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  onComplete: (data: { prompt: string }) => void;
  initialValue?: string;
}

export default function PromptInput({
  onSubmit,
  onComplete,
  initialValue = "",
}: PromptInputProps) {
  const [prompt, setPrompt] = useState(initialValue);

  useEffect(() => {
    if (initialValue) {
      setPrompt(initialValue);
    }
  }, [initialValue]);

  const handleBlur = () => {
    if (prompt.trim()) {
      onSubmit(prompt);
      onComplete({ prompt });
    }
  };

  return (
    <div>
      <label
        htmlFor="prompt"
        className="block text-sm font-medium text-gray-300 mb-2"
      >
        What would you like to explore about this image?
      </label>
      <textarea
        id="prompt"
        rows={3}
        className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-lg focus:ring-2 focus:ring-gray-700 focus:border-transparent text-gray-200 placeholder-gray-500 resize-none"
        placeholder="Describe what you want to explore..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onBlur={handleBlur}
        autoFocus
      />
    </div>
  );
}
