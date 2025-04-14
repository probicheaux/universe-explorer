"use client";

import { useState } from "react";
import ImageArea from "./ImageArea";
import PromptArea from "./PromptArea";
import AnnotationToolbar from "./AnnotationToolbar";

interface ExplorerData {
  image?: string;
  prompt?: string;
}

interface BoundingBox {
  start: { x: number; y: number };
  end: { x: number; y: number };
  label: string;
}

export default function UniverseExplorer() {
  const [data, setData] = useState<ExplorerData>({});
  const [classes, setClasses] = useState<string[]>(["person", "car", "truck"]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [boxes, setBoxes] = useState<BoundingBox[]>([]);

  const showToolbar = data.image && data.prompt;

  return (
    <div className="w-full h-full flex-1 mx-auto p-6">
      <div className="w-full h-[600px] bg-gray-900/50 rounded-lg overflow-hidden flex">
        {/* Toolbar container - fixed width, always present but with zero width when hidden */}
        <div
          className={`transition-all duration-500 ease-in-out ${
            showToolbar ? "w-64" : "w-0"
          } overflow-hidden`}
        >
          {/* Toolbar - Only render when visible to prevent layout issues */}
          {showToolbar && (
            <div className="w-64 h-full">
              <AnnotationToolbar
                classes={classes}
                onClassesChange={setClasses}
                selectedClass={selectedClass}
                onClassSelect={setSelectedClass}
              />
            </div>
          )}
        </div>

        {/* Main content area - always present with full width */}
        <div className="flex flex-col flex-1">
          <ImageArea
            image={data.image}
            onImageChange={(image) => setData((prev) => ({ ...prev, image }))}
            isAnnotationMode={showToolbar}
            selectedClass={selectedClass}
            onBoxesChange={setBoxes}
          />
          <PromptArea
            prompt={data.prompt}
            onPromptChange={(prompt) =>
              setData((prev) => ({ ...prev, prompt }))
            }
          />
        </div>
      </div>
    </div>
  );
}
