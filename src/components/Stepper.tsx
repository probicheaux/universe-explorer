"use client";

import { ReactNode, useState } from "react";

interface Step {
  id: number;
  title: string;
  description: string;
  content: ReactNode;
}

interface StepData {
  image?: string;
  prompt?: string;
  [key: string]: unknown;
}

interface StepperProps {
  steps: Step[];
  onComplete?: () => void;
}

export default function Stepper({ steps, onComplete }: StepperProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [previewData, setPreviewData] = useState<Record<string, StepData>>({});

  // Handle step navigation
  const goToStep = (stepId: number) => {
    // Only allow going to completed steps or the next available step
    if (completedSteps.includes(stepId) || stepId === currentStep + 1) {
      setCurrentStep(stepId);
    }
  };

  // Mark a step as completed and move to the next step
  const completeStep = (stepId: number, data?: StepData) => {
    if (stepId === currentStep) {
      // Add data to preview if provided
      if (data) {
        setPreviewData((prev) => ({ ...prev, [stepId]: data }));
      }

      // Mark step as completed
      if (!completedSteps.includes(stepId)) {
        setCompletedSteps((prev) => [...prev, stepId]);
      }

      // Move to next step if available
      if (stepId < steps.length) {
        setCurrentStep(stepId + 1);
      } else if (onComplete) {
        // If this was the last step, call onComplete
        onComplete();
      }
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Step indicators */}
      <div className="flex justify-between mb-8 relative">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-800 -translate-y-1/2 -z-10"></div>
        {steps.map((step) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = currentStep === step.id;
          const isClickable = isCompleted || step.id === currentStep + 1;

          return (
            <div
              key={step.id}
              className={`flex flex-col items-center relative group ${
                isClickable ? "cursor-pointer" : "cursor-not-allowed"
              }`}
              onClick={() => isClickable && goToStep(step.id)}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all duration-300 ${
                  isCompleted
                    ? "bg-gray-700 text-white"
                    : isCurrent
                    ? "bg-gray-800 text-white ring-2 ring-gray-600 ring-offset-2 ring-offset-gray-950"
                    : "bg-gray-900 text-gray-500"
                }`}
              >
                {isCompleted ? (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <span className="text-sm font-medium">{step.id}</span>
                )}
              </div>
              <div className="text-center">
                <h3
                  className={`text-sm font-medium transition-colors duration-300 ${
                    isCurrent
                      ? "text-white"
                      : isCompleted
                      ? "text-gray-400"
                      : "text-gray-600"
                  }`}
                >
                  {step.title}
                </h3>
                <p className="text-xs text-gray-500 mt-1 hidden md:block">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Current step content */}
      <div className="relative min-h-[400px]">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`absolute inset-0 transition-all duration-500 transform ${
              currentStep === step.id
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8 pointer-events-none"
            }`}
          >
            {step.content}
          </div>
        ))}
      </div>

      {/* Preview section */}
      {Object.keys(previewData).length > 0 && (
        <div className="mt-12 border-t border-gray-800 pt-8">
          <h3 className="text-lg font-medium text-gray-200 mb-4">Preview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(previewData).map(([stepId, data]) => {
              const step = steps.find((s) => s.id === parseInt(stepId));
              if (!step) return null;

              return (
                <div
                  key={stepId}
                  className="bg-gray-900/50 rounded-lg p-4 border border-gray-800"
                >
                  <h4 className="text-sm font-medium text-gray-300 mb-2">
                    {step.title}
                  </h4>
                  {data.image && (
                    <div className="mb-3">
                      <img
                        src={data.image}
                        alt="Uploaded"
                        className="w-full h-32 object-cover rounded-md"
                      />
                    </div>
                  )}
                  {data.prompt && (
                    <div className="text-sm text-gray-400">
                      <span className="font-medium">Prompt:</span> {data.prompt}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
