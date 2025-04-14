"use client";

import { useState, useRef } from "react";
import PromptInput from "./PromptInput";

interface ExplorerData {
  image?: string;
  prompt?: string;
}

export default function UniverseExplorer() {
  const [data, setData] = useState<ExplorerData>({});
  const [isPromptEditing, setIsPromptEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Image = event.target?.result as string;
        setData((prev) => ({ ...prev, image: base64Image }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <h1 className="text-4xl font-semibold mb-4">Universe Explorer</h1>
      <div className="w-full h-[600px] bg-gray-900/50 rounded-lg overflow-hidden flex flex-col">
        {/* Image Area */}
        <div
          className="relative flex-grow cursor-pointer group"
          onClick={handleImageClick}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            ref={fileInputRef}
          />
          {data.image ? (
            <>
              <img
                src={data.image}
                alt="Uploaded"
                className="absolute inset-0 w-full h-full object-cover"
              />
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-gray-950/0 group-hover:bg-gray-950/40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="bg-gray-900/80 px-4 py-2 rounded-lg text-gray-300 text-sm transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                  Click to change image
                </div>
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
              Click to upload an image
            </div>
          )}
        </div>

        {/* Prompt Area */}
        <div className="p-6 bg-gray-900/80 border-t border-gray-800">
          <div className="relative min-h-[120px]">
            {/* Static Prompt View */}
            <div
              className={`cursor-pointer transition-all duration-300 ${
                isPromptEditing
                  ? "opacity-0 transform translate-y-2"
                  : "opacity-100 transform translate-y-0"
              }`}
              onClick={() => setIsPromptEditing(true)}
            >
              <h3 className="text-lg font-medium text-gray-200 mb-2">
                Your Prompt
              </h3>
              <div
                className={`${
                  data.prompt ? "text-gray-300" : "text-gray-500"
                } transition-colors duration-300`}
              >
                {data.prompt || "Click to enter your prompt"}
              </div>
            </div>

            {/* Editable Prompt */}
            <div
              className={`absolute inset-0 transition-all duration-300 ${
                isPromptEditing
                  ? "opacity-100 transform translate-y-0"
                  : "opacity-0 transform -translate-y-2 pointer-events-none"
              }`}
            >
              <PromptInput
                onSubmit={(prompt) => {
                  setData((prev) => ({ ...prev, prompt }));
                }}
                onComplete={(data) => {
                  setData((prev) => ({ ...prev, prompt: data.prompt }));
                  setIsPromptEditing(false);
                }}
                initialValue={data.prompt}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
