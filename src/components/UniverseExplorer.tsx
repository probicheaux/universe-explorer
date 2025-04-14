"use client";

import { useRef } from "react";
import ImageUploader from "./ImageUploader";
import PromptInput from "./PromptInput";
import Stepper, { StepperRef } from "./Stepper";

export default function UniverseExplorer() {
  const stepperRef = useRef<StepperRef>(null);

  const steps = [
    {
      id: 1,
      title: "Upload Image",
      description: "Upload an image to explore its universe",
      content: (
        <ImageUploader
          onImageChange={(image) => {
            console.log("Image changed:", image);
          }}
          onComplete={(data) => {
            console.log("Image upload complete:", data);
            stepperRef.current?.completeStep(1, data);
          }}
        />
      ),
    },
    {
      id: 2,
      title: "Enter Prompt",
      description: "Describe what you want to explore",
      content: (
        <PromptInput
          onSubmit={(prompt) => {
            console.log("Prompt submitted:", prompt);
          }}
          onComplete={(data) => {
            console.log("Prompt complete:", data);
            stepperRef.current?.completeStep(2, data);
          }}
        />
      ),
    },
    {
      id: 3,
      title: "Explore",
      description: "Discover the universe of your image",
      content: (
        <div className="w-full h-64 bg-gray-900/50 rounded-lg flex items-center justify-center text-gray-400">
          Coming soon...
        </div>
      ),
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <Stepper ref={stepperRef} steps={steps} />
    </div>
  );
}
