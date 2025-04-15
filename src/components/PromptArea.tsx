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

  // Handle click outside to close the editor
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      console.log("Document click event detected");

      // Check if the click is on a suggestion
      const target = event.target as HTMLElement;
      console.log("Click target:", target);

      if (target.closest(".suggestions-dropdown")) {
        console.log("Click is on a suggestion, not closing editor");
        return;
      }

      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        isEditing
      ) {
        console.log(
          "Click is outside the container and editor is open, closing editor"
        );
        setIsEditing(false);
      } else {
        console.log(
          "Click is inside the container or editor is closed, not closing editor"
        );
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

  const handlePromptChange = (data: { prompt: string }) => {
    console.log("PromptArea: handlePromptChange called with:", data);

    // Call the parent's onPromptChange function
    onPromptChange(data.prompt);

    // Add a small delay to ensure the prompt is set before transitioning
    setTimeout(() => {
      console.log("PromptArea: Setting isEditing to false");
      setIsEditing(false);
    }, 300); // Increased timeout to ensure the component has fully updated
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    // Only handle clicks when not in editing mode and when editable
    if (!isEditing && editable) {
      e.preventDefault();
      e.stopPropagation();
      setIsEditing(true);
    }
  };

  return (
    <div
      className={`p-6 border-t border-gray-800 transition-all duration-300 ${
        isEditing ? "bg-gray-900/80" : "bg-gray-900/20 backdrop-blur-md"
      }`}
      onClick={handleContainerClick}
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
              ? "opacity-100 transform translate-y-0 z-10"
              : "opacity-0 transform -translate-y-2 pointer-events-none"
          }`}
          style={{ zIndex: isEditing ? 10 : "auto" }}
          onClick={(e) => {
            console.log("Editable prompt container clicked");
            // Don't stop propagation here to allow the click to reach the suggestions
          }}
        >
          <PromptInput
            ref={inputRef}
            onComplete={handlePromptChange}
            initialValue={prompt}
          />
        </div>
      </div>
    </div>
  );
}
