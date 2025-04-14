"use client";

import { useState } from "react";
import Header from "./Header";
import ImageUploader from "./ImageUploader";
import PromptInput from "./PromptInput";

export default function UniverseExplorer() {
  const [image, setImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleImageChange = (base64Image: string) => {
    setImage(base64Image);
  };

  const handlePromptSubmit = (prompt: string) => {
    if (!image) return;

    setIsProcessing(true);

    // Here you would typically make an API call to Roboflow Universe
    // For now, we'll just simulate a delay
    setTimeout(() => {
      console.log("Processing image with prompt:", prompt);
      setIsProcessing(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-b from-gray-950 to-purple-950/20">
      <div className="w-full max-w-4xl mx-auto">
        <Header />

        <div className="space-y-8">
          <ImageUploader onImageChange={handleImageChange} />

          <PromptInput
            onSubmit={handlePromptSubmit}
            disabled={!image || isProcessing}
          />

          {isProcessing && (
            <div className="flex justify-center">
              <div className="animate-pulse flex space-x-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
