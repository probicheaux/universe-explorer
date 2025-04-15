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
  const [userSelectedModel, setUserSelectedModel] = useState<boolean>(false);
  const [imageDimensions, setImageDimensions] = useState<
    | {
        width: number;
        height: number;
        x: number;
        y: number;
      }
    | undefined
  >(undefined);
  const [scale, setScale] = useState({ x: 1, y: 1 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [models, setModels] = useState<ModelInfo[]>([]);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Generate colors for all classes
  const classColors = useMemo(() => {
    return (classes || []).reduce((acc, className) => {
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

    // Ensure we're in the "find" tab when an image is selected
    setActiveTab("find");

    // If we already have a prompt, process it to get classes and task type
    if (prompt) {
      processPrompt(prompt);
    }
  };

  const processPrompt = async (promptText: string) => {
    setIsPromptLoading(true);
    try {
      console.log("=== PROCESS PROMPT START ===");
      console.log("Processing prompt:", promptText);
      console.log("Current classes before API call:", classes);

      const response = await api.prompt.send(promptText);
      console.log("Full API response:", JSON.stringify(response, null, 2));

      if (response.error) {
        console.error("Error from prompt API:", response.error);
        return;
      }

      // Check if we have a message property in the response
      if (response && typeof response === "object" && "message" in response) {
        console.log("Message in response:", response.message);

        try {
          // Parse the message as JSON
          const parsedMessage = JSON.parse(response.message as string);
          console.log("Parsed message:", parsedMessage);

          // Extract task and classes
          if (parsedMessage.task && parsedMessage.classes) {
            const { task, classes: newClasses } = parsedMessage;
            console.log("Extracted task:", task);
            console.log("Extracted classes:", newClasses);
            console.log("Current classes before update:", classes);

            // Update task type if valid
            if (
              task === "object-detection" ||
              task === "instance-segmentation" ||
              task === "classification" ||
              task === "keypoint-detection" ||
              task === "semantic-segmentation" ||
              task === "multimodal"
            ) {
              console.log("Setting task type to:", task);
              setTaskType(task);
            }

            // Update classes if valid
            if (
              newClasses &&
              Array.isArray(newClasses) &&
              newClasses.length > 0
            ) {
              console.log("Setting classes to:", newClasses);
              // Force a state update by creating a new array
              setClasses([...newClasses]);
              console.log("Classes state updated with:", [...newClasses]);

              // Remove boxes that reference classes that no longer exist
              setBoxes((prevBoxes) => {
                console.log(
                  "Filtering boxes, current count:",
                  prevBoxes.length
                );
                const filteredBoxes = prevBoxes.filter((box) => {
                  const boxClassExists = newClasses.some(
                    (cls) => cls.toLowerCase() === box.class.toLowerCase()
                  );
                  return boxClassExists;
                });
                console.log("Filtered boxes count:", filteredBoxes.length);
                return filteredBoxes;
              });

              // Reset selected class
              setSelectedClass("");
              console.log("Selected class reset to empty string");
            } else {
              console.log("Classes validation failed:", {
                isDefined: !!newClasses,
                isArray: Array.isArray(newClasses),
                length: newClasses?.length,
              });
            }
          } else {
            console.log(
              "Missing task or classes in parsed message:",
              parsedMessage
            );
          }
        } catch (e) {
          console.error("Error parsing message:", e);
        }
      }
      // Check if we have data property with task and classes
      else if (
        response.data &&
        "task" in response.data &&
        "classes" in response.data
      ) {
        const { task, classes: newClasses } = response.data;
        console.log("Direct data from API - task:", task);
        console.log("Direct data from API - classes:", newClasses);

        // Update task type if valid
        if (
          task === "object-detection" ||
          task === "instance-segmentation" ||
          task === "classification" ||
          task === "keypoint-detection" ||
          task === "semantic-segmentation" ||
          task === "multimodal"
        ) {
          console.log("Setting task type to:", task);
          setTaskType(task);
        }

        // Update classes if valid
        if (newClasses && Array.isArray(newClasses) && newClasses.length > 0) {
          console.log("Setting classes to:", newClasses);
          // Force a state update by creating a new array
          setClasses([...newClasses]);
          console.log("Classes state updated with:", [...newClasses]);

          // Remove boxes that reference classes that no longer exist
          setBoxes((prevBoxes) => {
            console.log("Filtering boxes, current count:", prevBoxes.length);
            const filteredBoxes = prevBoxes.filter((box) => {
              const boxClassExists = newClasses.some(
                (cls) => cls.toLowerCase() === box.class.toLowerCase()
              );
              return boxClassExists;
            });
            console.log("Filtered boxes count:", filteredBoxes.length);
            return filteredBoxes;
          });

          // Reset selected class
          setSelectedClass("");
          console.log("Selected class reset to empty string");
        } else {
          console.log("Classes validation failed:", {
            isDefined: !!newClasses,
            isArray: Array.isArray(newClasses),
            length: newClasses?.length,
          });
        }
      } else {
        console.log("No valid data found in response");
        console.log("Response structure:", Object.keys(response));
        if (response.data) {
          console.log("Response.data structure:", Object.keys(response.data));
        }
      }
    } catch (error) {
      console.error("Error processing prompt response:", error);
    } finally {
      setIsPromptLoading(false);
      console.log("=== PROCESS PROMPT END ===");
    }
  };

  const handlePromptChange = async (newPrompt: string) => {
    setPrompt(newPrompt);
    await processPrompt(newPrompt);
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

  const handleFindModel = async (): Promise<void> => {
    if (!image) return;

    setIsLoading(true);
    setInferenceResults({});
    setModels([]);
    setSelectedModel(null);
    setUserSelectedModel(false);

    try {
      const base64Data = image.includes(",") ? image.split(",")[1] : image;

      if (cleanupRef.current) {
        cleanupRef.current();
      }

      let currentModels: ModelInfo[] = [];
      let pendingResults: { result: any; index: number }[] = [];

      const cleanup = api.inference.inferImage(base64Data, {
        onModels: (newModels) => {
          console.log("Received models:", newModels);
          currentModels = newModels;
          setModels(newModels);
          setActiveTab("results");

          if (newModels.length > 0) {
            setSelectedModel(newModels[0].id);
          }

          // Process any pending results
          pendingResults.forEach(({ result, index }) => {
            if (index < newModels.length) {
              const modelId = newModels[index].id;
              setInferenceResults((prev) => ({
                ...prev,
                [modelId]: result,
              }));
            }
          });
          pendingResults = [];
        },
        onInference: (modelId, result) => {
          console.log("Received inference result for model:", modelId, result);

          if (!modelId) {
            // Store the result temporarily if we don't have models yet
            if (currentModels.length === 0) {
              pendingResults.push({ result, index: pendingResults.length });
            } else {
              // Find the first model without results
              const modelIndex = currentModels.findIndex(
                (m) => !inferenceResults[m.id]
              );
              if (modelIndex !== -1) {
                const fallbackModelId = currentModels[modelIndex].id;
                console.log("Using fallback modelId:", fallbackModelId);
                setInferenceResults((prev) => ({
                  ...prev,
                  [fallbackModelId]: result,
                }));
              }
            }
          } else {
            setInferenceResults((prev) => ({
              ...prev,
              [modelId]: result,
            }));
          }
        },
        onError: (modelId, error) => {
          console.error(`Error with model ${modelId}:`, error);
        },
        onComplete: () => {
          console.log("Inference complete");
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
      if (!modelId) {
        console.warn("handleModelSelect called with undefined modelId");
        return;
      }

      console.log("handleModelSelect called with modelId:", modelId);

      // Mark that the user has manually selected a model
      setUserSelectedModel(true);

      // Immediately update the selected model
      setSelectedModel(modelId);

      // Update the results canvas to show the selected model's results
      const selectedResult = inferenceResults[modelId];
      console.log("Selected result:", selectedResult);

      if (selectedResult && !selectedResult.error) {
        console.log("Setting inference results to show only this model");
        // Don't clear other results, just update the selected model
        setSelectedModel(modelId);

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

  // Log classes changes
  useEffect(() => {
    console.log("Classes updated:", classes);
  }, [classes]);

  // Select the first model by default when the order changes, but only if user hasn't manually selected
  useEffect(() => {
    if (models.length > 0 && !userSelectedModel) {
      setSelectedModel(models[0].id);
    }
  }, [models, userSelectedModel]);

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
            {/* Debug log */}
            {(() => {
              console.log(
                "Rendering toolbar with activeTab:",
                activeTab,
                "classes:",
                classes
              );
              return null;
            })()}
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
                scale={scale}
                offset={offset}
                selectedModel={selectedModel ?? undefined}
                autoSelectFirstModel={!userSelectedModel}
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
            {image &&
              prompt &&
              activeTab === "results" &&
              imageDimensions &&
              selectedModel && (
                <ResultsCanvas
                  result={inferenceResults[selectedModel]}
                  image={image}
                  imageDimensions={imageDimensions}
                  offset={offset}
                  setOffset={setOffset}
                  scale={scale}
                  setScale={setScale}
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
