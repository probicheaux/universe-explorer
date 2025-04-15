"use client";

import { useState, useMemo, useEffect } from "react";
import ImageArea from "./ImageArea";
import PromptArea from "./PromptArea";
import AnnotationToolbar from "./AnnotationToolbar";
import ModelsToolbar from "./ModelsToolbar";
import BoundingBoxCanvas from "./annotations/BoundingBoxCanvas";
import ResultsCanvas from "./annotations/ResultsCanvas";
import FindModelButton from "./FindModelButton";
import Tabs, { TabType } from "./Tabs";
import { getColorForLabel } from "../utils/colors";
import api from "@/utils/api";

export default function UniverseExplorer() {
  const [image, setImage] = useState<string | undefined>(undefined);
  const [prompt, setPrompt] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [classes, setClasses] = useState<string[]>(["person", "car", "truck"]);
  const [taskType] = useState<string>("Object Detection");
  const [boxes, setBoxes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("find");
  const [inferenceResults, setInferenceResults] = useState<any[]>([]);
  const [hideGuides, setHideGuides] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<
    | {
        width: number;
        height: number;
        x: number;
        y: number;
      }
    | undefined
  >(undefined);

  // Generate colors for all classes
  const classColors = useMemo(() => {
    return classes.reduce((acc, className) => {
      acc[className] = getColorForLabel(className);
      return acc;
    }, {} as Record<string, string>);
  }, [classes]);

  // Reset selected class if it's removed from classes
  useEffect(() => {
    if (selectedClass && !classes.includes(selectedClass)) {
      setSelectedClass("");
    }
  }, [classes, selectedClass]);

  const handleImageChange = (imageData: string) => {
    // Clear bounding boxes when image changes
    setBoxes([]);
    setInferenceResults([]);
    setImage(imageData);
  };

  const handlePromptChange = (newPrompt: string) => {
    setPrompt(newPrompt);
  };

  const handleClassSelect = (className: string) => {
    setSelectedClass(className);
  };

  const handleClassesChange = (newClasses: string[]) => {
    setClasses(newClasses);
  };

  const handleBoxesChange = (newBoxes: any[]) => {
    setBoxes(newBoxes);
  };

  const handleFindModel = async () => {
    if (!image) return;

    setIsLoading(true);
    try {
      // Remove the data:image/jpeg;base64, prefix if present
      const base64Data = image.includes(",") ? image.split(",")[1] : image;

      const response = await api.inference.inferImage(base64Data);

      console.log("Model inference result:", response);

      // Switch to results tab after successful inference
      setActiveTab("results");

      // For now, we'll just use hardcoded results
      // In the future, we'll parse the actual response
      setInferenceResults([response]);
    } catch (error) {
      console.error("Error finding model:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModelSelect = (modelId: string) => {
    console.log("Selected model:", modelId);
    // In the future, we'll load the specific model's results
  };

  const canFindModel = image && prompt && boxes.length > 0;

  return (
    <div className="flex flex-col h-full bg-gray-950 text-white relative">
      <div className="flex-1 flex overflow-hidden relative">
        {/* Toolbar - switches between Annotation and Models */}
        <div
          className={`transition-all duration-500 ease-in-out ${
            image && prompt ? "w-64" : "w-0"
          } overflow-hidden`}
        >
          <div className="w-64 h-full">
            {activeTab === "find" ? (
              <AnnotationToolbar
                taskType={taskType}
                classes={classes}
                onClassesChange={handleClassesChange}
                selectedClass={selectedClass}
                onClassSelect={handleClassSelect}
                classColors={classColors}
              />
            ) : (
              <ModelsToolbar onModelSelect={handleModelSelect} />
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <div className="flex-1 relative overflow-hidden">
            <ImageArea
              image={image}
              onImageChange={handleImageChange}
              onImageDimensionsChange={(dimensions) => {
                setImageDimensions(dimensions);
              }}
            />

            {/* Tabs for switching between Find and Results */}
            {image && prompt && inferenceResults.length > 0 && (
              <Tabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onMouseEnterTabButton={() => setHideGuides(true)}
                onMouseLeaveTabButton={() => setHideGuides(false)}
              />
            )}

            {/* Canvas - Always render BoundingBoxCanvas but control visibility */}
            {image && prompt && (
              <BoundingBoxCanvas
                selectedClass={selectedClass}
                availableClasses={classes}
                onClassSelect={handleClassSelect}
                classColors={classColors}
                onBoxesChange={handleBoxesChange}
                className={activeTab === "find" ? "block" : "hidden z-0"}
                boxes={boxes}
                hideGuides={hideGuides}
              />
            )}

            {/* Image Change Button - Only show in find tab */}
            {activeTab === "find" && (
              <button
                onMouseEnter={() => setHideGuides(true)}
                onMouseLeave={() => setHideGuides(false)}
                onClick={() => {
                  // Trigger file input click
                  const fileInput = document.createElement("input");
                  fileInput.type = "file";
                  fileInput.accept = "image/*";
                  fileInput.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        if (event.target?.result) {
                          handleImageChange(event.target.result as string);
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  };
                  fileInput.click();
                }}
                className="cursor-pointer absolute top-4 right-4 z-20 bg-gray-900/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors duration-200 flex items-center gap-2 shadow-lg"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                    clipRule="evenodd"
                  />
                </svg>
                Change Image
              </button>
            )}

            {/* Results Canvas */}
            {image && prompt && activeTab === "results" && imageDimensions && (
              <ResultsCanvas
                results={inferenceResults}
                image={image}
                imageDimensions={imageDimensions}
              />
            )}

            {/* Find Model Button */}
            {canFindModel && activeTab === "find" && (
              <FindModelButton
                onClick={handleFindModel}
                isLoading={isLoading}
                onMouseEnter={() => setHideGuides(true)}
                onMouseLeave={() => setHideGuides(false)}
              />
            )}
          </div>
          <PromptArea prompt={prompt} onPromptChange={handlePromptChange} />
        </div>
      </div>
    </div>
  );
}
