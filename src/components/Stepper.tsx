"use client";

import { ReactNode, useState, forwardRef, useImperativeHandle } from "react";

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

export interface StepperRef {
  completeStep: (stepId: number, data?: StepData) => void;
}

const Stepper = forwardRef<StepperRef, StepperProps>(
  ({ steps, onComplete }, ref) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [completedSteps, setCompletedSteps] = useState<number[]>([]);
    const [previewData, setPreviewData] = useState<Record<string, StepData>>(
      {}
    );

    // Handle step navigation
    const goToStep = (stepId: number) => {
      // Allow going back to any previous step
      // Only allow going forward to the next step if current step is completed
      if (stepId < currentStep || completedSteps.includes(currentStep)) {
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

    // Expose completeStep function through ref
    useImperativeHandle(ref, () => ({
      completeStep,
    }));

    // Get the image and prompt data
    const imageData = previewData[1];
    const promptData = previewData[2];

    return (
      <div className="w-full max-w-5xl mx-auto">
        {/* Step indicators */}
        <div className="flex justify-between mb-8 relative">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-800 -translate-y-1/2 -z-10"></div>
          {steps.map((step) => {
            const isCompleted = completedSteps.includes(step.id);
            const isCurrent = currentStep === step.id;
            const isClickable =
              step.id < currentStep ||
              isCompleted ||
              step.id === currentStep + 1;

            return (
              <div
                key={step.id}
                className={`flex flex-col items-center relative group ${
                  isClickable ? "hover:cursor-pointer" : ""
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
          {steps.map((step) => {
            // For step 3, show the preview data if available
            if (step.id === 3 && imageData && promptData) {
              return (
                <div
                  key={step.id}
                  className={`absolute inset-0 transition-all duration-500 transform ${
                    currentStep === step.id
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-8 pointer-events-none"
                  }`}
                >
                  <div className="w-full h-[600px] bg-gray-900/50 rounded-lg overflow-hidden flex flex-col">
                    <div className="relative flex-grow">
                      {imageData.image ? (
                        <img
                          src={imageData.image}
                          alt="Uploaded"
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                          Your image will appear here
                        </div>
                      )}
                    </div>
                    <div className="p-6 bg-gray-900/80 border-t border-gray-800">
                      <h3 className="text-lg font-medium text-gray-200 mb-2">
                        Your Prompt
                      </h3>
                      <div className="text-gray-300">{promptData.prompt}</div>
                    </div>
                  </div>
                </div>
              );
            }

            // For other steps, show their original content
            return (
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
            );
          })}
        </div>
      </div>
    );
  }
);

Stepper.displayName = "Stepper";

export default Stepper;
