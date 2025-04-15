"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import ImageArea from "./ImageArea";
import PromptArea from "./PromptArea";
import AnnotationToolbar, { TaskType } from "./AnnotationToolbar";
import ModelsToolbar from "./ModelsToolbar";
import BoundingBoxCanvas from "./annotations/BoundingBoxCanvas";
import ResultsCanvas from "./annotations/ResultsCanvas";
import FindModelButton from "./FindModelButton";
import Tabs, { TabType } from "./Tabs";
import { getColorForLabel } from "../utils/colors";
import api from "@/utils/api";
import { ModelInfo } from "@/utils/api/inference";

export default function UniverseExplorer() {
  const [image, setImage] = useState<string | undefined>(undefined);
  const [prompt, setPrompt] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [classes, setClasses] = useState<string[]>(["person", "car", "truck"]);
  const [taskType, setTaskType] = useState<TaskType>("object-detection");
  const [boxes, setBoxes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPromptLoading, setIsPromptLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("find");
  const [inferenceResults, setInferenceResults] = useState<Record<string, any>>(
    {}
  );
  const [hideGuides, setHideGuides] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<
    | {
        width: number;
        height: number;
        x: number;
        y: number;
      }
    | undefined
  >(undefined);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const cleanupRef = useRef<(() => void) | null>(null);

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
    setInferenceResults({});
    setImage(imageData);
  };

  const handlePromptChange = async (newPrompt: string) => {
    setPrompt(newPrompt);
    setIsPromptLoading(true);

    try {
      const response = await api.prompt.send(newPrompt);
      if (response.error) {
        console.error("Error from prompt API:", response.error);
        return;
      }

      if (response.data) {
        const { task, classes: newClasses } = response.data;
        // Validate that the task is a valid TaskType
        if (
          task === "object-detection" ||
          task === "instance-segmentation" ||
          task === "classification" ||
          task === "keypoint-detection" ||
          task === "semantic-segmentation" ||
          task === "multimodal"
        ) {
          setTaskType(task);
        }
        // Update classes and remove invalid boxes
        setClasses(newClasses);
        setBoxes((prevBoxes) => {
          const filteredBoxes = prevBoxes.filter((box) => {
            const boxClassExists = newClasses.some(
              (cls) => cls.toLowerCase() === box.class.toLowerCase()
            );
            console.log("Box class check:", {
              boxClass: box.class,
              availableClasses: newClasses,
              exists: boxClassExists,
            });
            return boxClassExists;
          });
          console.log("Boxes update:", {
            before: prevBoxes.length,
            after: filteredBoxes.length,
            keptClasses: filteredBoxes.map((box) => box.class),
          });
          return filteredBoxes;
        });
        // Reset selected class since we have new classes
        setSelectedClass("");
      }
    } catch (error) {
      console.error("Error processing prompt response:", error);
    } finally {
      setIsPromptLoading(false);
    }
  };

  const handleClassSelect = (className: string) => {
    setSelectedClass(className);
  };

  const handleClassesChange = (newClasses: string[]) => {
    setClasses(newClasses);
    // Remove boxes that reference classes that no longer exist
    setBoxes((prevBoxes) => {
      const filteredBoxes = prevBoxes.filter((box) => {
        const boxClassExists = newClasses.some(
          (cls) => cls.toLowerCase() === box.class.toLowerCase()
        );
        console.log("Box class check:", {
          boxClass: box.class,
          availableClasses: newClasses,
          exists: boxClassExists,
        });
        return boxClassExists;
      });
      console.log("Boxes update:", {
        before: prevBoxes.length,
        after: filteredBoxes.length,
        keptClasses: filteredBoxes.map((box) => box.class),
      });
      return filteredBoxes;
    });
  };

  const handleBoxesChange = (newBoxes: any[]) => {
    setBoxes(newBoxes);
  };

  const handleFindModel = async () => {
    if (!image) return;

    setIsLoading(true);
    setInferenceResults({});
    setModels([]);

    try {
      // Remove the data:image/jpeg;base64, prefix if present
      const base64Data = image.includes(",") ? image.split(",")[1] : image;

      // Cleanup previous EventSource if exists
      if (cleanupRef.current) {
        cleanupRef.current();
      }

      // Start streaming inference
      const cleanup = api.inference.inferImage(base64Data, {
        onModels: (newModels) => {
          setModels(newModels);
          // Switch to results tab after receiving models
          setActiveTab("results");
        },
        onInference: (modelId, result) => {
          setInferenceResults((prev) => ({
            ...prev,
            [modelId]: result,
          }));
        },
        onError: (modelId, error) => {
          console.error(`Error with model ${modelId}:`, error);
          setInferenceResults((prev) => ({
            ...prev,
            [modelId]: { error },
          }));
        },
        onComplete: () => {
          setIsLoading(false);
        },
      });

      cleanupRef.current = cleanup;
    } catch (error) {
      console.error("Error finding model:", error);
      setIsLoading(false);
    }
  };

  const handleModelSelect = useCallback(
    (modelId: string) => {
      console.log("handleModelSelect called with modelId:", modelId);

      // Immediately update the selected model
      setSelectedModel(modelId);

      // Update the results canvas to show the selected model's results
      const selectedResult = inferenceResults[modelId];
      console.log("Selected result:", selectedResult);

      if (selectedResult && !selectedResult.error) {
        console.log("Setting inference results to show only this model");
        setInferenceResults((prev) => {
          // Only update if the results have actually changed
          if (prev[modelId] === selectedResult) {
            return prev;
          }
          return { [modelId]: selectedResult };
        });

        // Only switch to results tab if we're not already there
        if (activeTab !== "results") {
          console.log("Switching to results tab");
          setActiveTab("results");
        }
      } else {
        console.log("No valid result for this model or has error");
      }
    },
    [inferenceResults, activeTab]
  );

  const canFindModel = image && prompt && boxes.length > 0;

  const handleTaskTypeChange = (newTaskType: TaskType) => {
    setTaskType(newTaskType);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);

  // Log activeTab changes
  useEffect(() => {
    console.log("activeTab changed to:", activeTab);
  }, [activeTab]);

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
                onTaskTypeChange={handleTaskTypeChange}
                classes={classes}
                onClassesChange={handleClassesChange}
                selectedClass={selectedClass}
                onClassSelect={handleClassSelect}
                classColors={classColors}
                isLoading={isPromptLoading}
              />
            ) : (
              <ModelsToolbar
                onModelSelect={handleModelSelect}
                models={models}
                results={inferenceResults}
                isLoading={isLoading}
                drawnBoxes={boxes}
                imageDimensions={
                  imageDimensions as {
                    width: number;
                    height: number;
                    x: number;
                    y: number;
                  }
                }
              />
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
            {image && prompt && Object.keys(inferenceResults).length > 0 && (
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
                result={inferenceResults?.[selectedModel ?? ""]}
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
          <PromptArea
            prompt={prompt}
            onPromptChange={handlePromptChange}
            editable={activeTab === "find"}
          />
        </div>
      </div>
    </div>
  );
}
