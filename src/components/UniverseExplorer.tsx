"use client";

import { useState } from "react";
import Header from "./Header";
import ImageUploader from "./ImageUploader";
import PromptInput from "./PromptInput";

export default function UniverseExplorer() {
  const [image, setImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showPrompt, setShowPrompt] = useState(false);

  const handleImageChange = (base64Image: string) => {
    setImage(base64Image);
    // Move to next step after a short delay for animation
    setTimeout(() => {
      setCurrentStep(2);
      setShowPrompt(true);
    }, 500);
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
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-b from-gray-950 to-black">
      <div className="w-full max-w-5xl mx-auto">
        <Header />

        <div className="flex flex-col md:flex-row gap-8 items-start justify-center">
          {/* Left side - Image upload or preview */}
          <div
            className={`w-full md:w-1/2 transition-all duration-500 ${
              currentStep > 1 ? "opacity-100" : "opacity-100"
            }`}
          >
            <div className="sticky top-8">
              <h2 className="text-lg font-medium text-gray-200 mb-4 tracking-tight">
                Step 1: Upload Image
              </h2>
              <ImageUploader onImageChange={handleImageChange} />
            </div>
          </div>

          {/* Right side - Prompt input (appears after image upload) */}
          <div
            className={`w-full md:w-1/2 transition-all duration-500 transform ${
              showPrompt
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8 pointer-events-none"
            }`}
          >
            <h2 className="text-lg font-medium text-gray-200 mb-4 tracking-tight">
              Step 2: Enter Prompt
            </h2>
            <PromptInput
              onSubmit={handlePromptSubmit}
              disabled={!image || isProcessing}
            />

            {isProcessing && (
              <div className="flex justify-center mt-6">
                <div className="animate-pulse flex space-x-2">
                  <div className="w-3 h-3 bg-gray-800 rounded-full"></div>
                  <div className="w-3 h-3 bg-gray-800 rounded-full"></div>
                  <div className="w-3 h-3 bg-gray-800 rounded-full"></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
