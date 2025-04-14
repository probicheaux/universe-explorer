import { useState } from "react";
import PromptInput from "./PromptInput";

interface PromptAreaProps {
  prompt?: string;
  onPromptChange: (prompt: string) => void;
}

export default function PromptArea({
  prompt,
  onPromptChange,
}: PromptAreaProps) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="p-6 bg-gray-900/80 border-t border-gray-800">
      <div className="relative min-h-[120px]">
        {/* Static Prompt View */}
        <div
          className={`cursor-pointer transition-all duration-300 ${
            isEditing
              ? "opacity-0 transform translate-y-2"
              : "opacity-100 transform translate-y-0"
          }`}
          onClick={() => setIsEditing(true)}
        >
          <h3 className="text-lg font-medium text-gray-200 mb-2">
            Your Prompt
          </h3>
          <div
            className={`${
              prompt ? "text-gray-300" : "text-gray-500"
            } transition-colors duration-300`}
          >
            {prompt || "Click to enter your prompt"}
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
            onSubmit={(prompt) => {
              onPromptChange(prompt);
            }}
            onComplete={(data) => {
              onPromptChange(data.prompt);
              setIsEditing(false);
            }}
            initialValue={prompt}
          />
        </div>
      </div>
    </div>
  );
}
