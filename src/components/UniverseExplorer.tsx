"use client";

import { useState } from "react";
import ImageArea from "./ImageArea";
import PromptArea from "./PromptArea";
import AnnotationToolbar from "./AnnotationToolbar";
import BoundingBoxCanvas from "./annotations/BoundingBoxCanvas";

export default function UniverseExplorer() {
  const [image, setImage] = useState<string | undefined>(undefined);
  const [prompt, setPrompt] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [classes, setClasses] = useState<string[]>(["person", "car", "truck"]);
  const [taskType] = useState<string>("Object Detection");

  const handleImageChange = (imageData: string) => {
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

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white">
      <div className="flex-1 flex overflow-hidden">
        {/* Annotation Toolbar */}
        <div
          className={`transition-all duration-500 ease-in-out ${
            image && prompt ? "w-64" : "w-0"
          } overflow-hidden`}
        >
          <div className="w-64 h-full">
            <AnnotationToolbar
              taskType={taskType}
              classes={classes}
              onClassesChange={handleClassesChange}
              selectedClass={selectedClass}
              onClassSelect={handleClassSelect}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 relative overflow-hidden">
            <ImageArea
              image={image}
              onImageChange={handleImageChange}
              isAnnotationMode={!!(image && prompt)}
            />
            {image && prompt && (
              <BoundingBoxCanvas
                selectedClass={selectedClass}
                availableClasses={classes}
                onClassSelect={handleClassSelect}
              />
            )}
          </div>
          <PromptArea prompt={prompt} onPromptChange={handlePromptChange} />
        </div>
      </div>
    </div>
  );
}
