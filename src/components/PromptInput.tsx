"use client";

import { useState, useEffect, useRef, forwardRef } from "react";
import api from "@/utils/api";

interface PromptSuggestion {
  text: string;
  timestamp: number;
}

interface PromptInputProps {
  onComplete: (data: { prompt: string }) => void;
  initialValue: string | undefined;
  onBlur?: () => void;
}

const PromptInput = forwardRef<HTMLTextAreaElement, PromptInputProps>(
  ({ onComplete, initialValue = "", onBlur }, ref) => {
    const [prompt, setPrompt] = useState(initialValue);
    const [suggestions, setSuggestions] = useState<PromptSuggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);
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

    useEffect(() => {
      const fetchSuggestions = async () => {
        if (!prompt.trim()) {
          setSuggestions([]);
          setShowSuggestions(false);
          return;
        }

        setIsLoading(true);
        try {
          const data = await api.prompt.suggestions.fetch(prompt);
          setSuggestions(data);
          setShowSuggestions(data.length > 0);
          setSelectedIndex(-1);
        } catch (error) {
          setSuggestions([]);
          setShowSuggestions(false);
        } finally {
          setIsLoading(false);
        }
      };

      const debounceTimer = setTimeout(fetchSuggestions, 300);
      return () => clearTimeout(debounceTimer);
    }, [prompt]);

    const handleSubmit = () => {
      if (prompt.trim()) {
        onComplete({ prompt });
        setShowSuggestions(false);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
        return;
      }

      if (!showSuggestions) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < suggestions.length - 1 ? prev + 1 : prev
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case "Enter":
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
            // Directly set the prompt and call onComplete
            const suggestion = suggestions[selectedIndex];
            setPrompt(suggestion.text);
            setShowSuggestions(false);
            onComplete({ prompt: suggestion.text });
          } else {
            handleSubmit();
          }
          break;
        case "Escape":
          e.preventDefault();
          setShowSuggestions(false);
          break;
      }
    };

    const handleBlur = (e: React.FocusEvent) => {
      // We're not handling blur for suggestions anymore
      // Just call the onBlur callback if provided
      onBlur?.();
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
        <div className="relative">
          {/* Suggestions appear above the textarea */}
          {showSuggestions && (
            <div
              ref={suggestionsRef}
              className="absolute z-50 w-full bottom-full mb-2 bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg shadow-xl overflow-hidden transition-all duration-200 ease-in-out suggestions-dropdown"
              style={{ boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)" }}
              onClick={(e) => {
                console.log("Suggestions container clicked");
                // Don't stop propagation here to allow the click to reach the li elements
              }}
            >
              {isLoading ? (
                <div className="px-4 py-2 text-sm text-gray-400">
                  Loading suggestions...
                </div>
              ) : (
                <ul className="max-h-48 overflow-y-auto">
                  {suggestions.map((suggestion, index) => (
                    <li
                      key={index}
                      className={`px-4 py-2 text-sm cursor-pointer transition-colors ${
                        index === selectedIndex
                          ? "bg-gray-800 text-gray-100"
                          : "text-gray-300 hover:bg-gray-800/50"
                      }`}
                      onClick={(e) => {
                        console.log(
                          "Suggestion item clicked directly:",
                          suggestion
                        );
                        e.preventDefault();
                        e.stopPropagation();

                        // Directly set the prompt and call onComplete
                        setPrompt(suggestion.text);
                        setShowSuggestions(false);
                        onComplete({ prompt: suggestion.text });
                      }}
                    >
                      {suggestion.text}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
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
      </div>
    );
  }
);

PromptInput.displayName = "PromptInput";

export default PromptInput;
