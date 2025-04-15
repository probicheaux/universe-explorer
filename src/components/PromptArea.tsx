import { useState, useEffect, useRef } from "react";
import PromptInput from "./PromptInput";
import { cn } from "@/utils/cn";

interface PromptAreaProps {
  prompt?: string;
  onPromptChange: (prompt: string) => void;
  editable?: boolean;
}

export default function PromptArea({
  prompt,
  onPromptChange,
  editable,
}: PromptAreaProps) {
  const [isEditing, setIsEditing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        isEditing
      ) {
        setIsEditing(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isEditing]);

  // Focus input when switching to edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  return (
    <div
      className={`p-6 border-t border-gray-800 transition-all duration-300 ${
        isEditing ? "bg-gray-900/80" : "bg-gray-900/20 backdrop-blur-md"
      }`}
    >
      <div
        ref={containerRef}
        className={`relative transition-all duration-300 ${
          isEditing ? "min-h-[160px]" : "min-h-[80px]"
        }`}
      >
        {/* Static Prompt View */}
        <div
          className={cn(
            "transition-all duration-300",
            isEditing
              ? "opacity-0 transform translate-y-2"
              : "opacity-100 transform translate-y-0",
            editable ? "cursor-pointer" : "cursor-default"
          )}
          onClick={() => editable && setIsEditing(true)}
        >
          <h3 className="text-lg font-semibold text-gray-200 mb-2">
            What do you want to understand about your image?
          </h3>
          <div
            className={`${
              prompt ? "text-gray-300" : "text-gray-500"
            } transition-colors duration-300 text-sm`}
          >
            {prompt ||
              "Example: I want to identify people and cars in street footage from my security camera"}
          </div>
        </div>

        {/* Editable Prompt */}
        <div
          className={`absolute inset-0 transition-all duration-300 ${
            isEditing
              ? "opacity-100 transform translate-y-0"
              : "opacity-0 transform -translate-y-2 pointer-events-none"
          }`}
        >
          <PromptInput
            ref={inputRef}
            onComplete={(data) => {
              onPromptChange(data.prompt);
              setIsEditing(false);
            }}
            onBlur={() => setIsEditing(false)}
            initialValue={prompt}
          />
        </div>
      </div>
    </div>
  );
}
