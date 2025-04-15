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
    const [isSuggestionClick, setIsSuggestionClick] = useState(false);
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
          console.log(`Fetching suggestions for: "${prompt}"`);
          const data = await api.prompt.suggestions.fetch(prompt);
          console.log(`Received ${data.length} suggestions:`, data);
          setSuggestions(data);
          setShowSuggestions(data.length > 0);
          setSelectedIndex(-1);
        } catch (error) {
          console.error("Error fetching suggestions:", error);
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
        console.log("Submitting prompt:", prompt);
        onComplete({ prompt });
        setShowSuggestions(false);
      }
    };

    const handleSuggestionClick = (suggestion: PromptSuggestion) => {
      console.log("Suggestion clicked:", suggestion);
      setIsSuggestionClick(true);
      setPrompt(suggestion.text);
      setShowSuggestions(false);
      console.log("Calling onComplete with:", suggestion.text);
      onComplete({ prompt: suggestion.text });

      // Reset the flag after a short delay
      setTimeout(() => {
        setIsSuggestionClick(false);
      }, 200);
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
            console.log(
              "Enter pressed with suggestion:",
              suggestions[selectedIndex]
            );
            handleSuggestionClick(suggestions[selectedIndex]);
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
      console.log("Blur event:", e);

      // Skip blur handling if a suggestion is being clicked
      if (isSuggestionClick) {
        console.log("Skipping blur handling due to suggestion click");
        return;
      }

      // Check if the related target is within the textarea or suggestions
      if (
        !e.currentTarget.contains(e.relatedTarget as Node) &&
        !suggestionsRef.current?.contains(e.relatedTarget as Node)
      ) {
        // Add a small delay to allow click events to process
        setTimeout(() => {
          if (!document.activeElement?.closest(".suggestions-dropdown")) {
            console.log("Blur outside component, calling onBlur");
            onBlur?.();
            setShowSuggestions(false);
          }
        }, 100);
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
        <div className="relative">
          {/* Suggestions appear above the textarea */}
          {showSuggestions && (
            <div
              ref={suggestionsRef}
              className="absolute z-50 w-full bottom-full mb-2 bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg shadow-xl overflow-hidden transition-all duration-200 ease-in-out suggestions-dropdown"
              style={{ boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)" }}
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
                        e.preventDefault();
                        e.stopPropagation();
                        handleSuggestionClick(suggestion);
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
