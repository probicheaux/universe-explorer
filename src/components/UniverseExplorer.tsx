"use client";

import { useState } from "react";
import ImageArea from "./ImageArea";
import PromptArea from "./PromptArea";
import ImageToolbar from "./ImageToolbar";

interface ExplorerData {
  image?: string;
  prompt?: string;
}

export default function UniverseExplorer() {
  const [data, setData] = useState<ExplorerData>({});
  const [classes, setClasses] = useState<string[]>(["person", "car", "truck"]);

  const showToolbar = data.image && data.prompt;

  return (
    <div className="w-full h-full flex-1 mx-auto p-6">
      <div className="w-full h-[600px] bg-gray-900/50 rounded-lg overflow-hidden flex">
        {/* Toolbar - Only show when both image and prompt are present */}
        <div
          className={`transition-all duration-300 ease-in-out ${
            showToolbar ? "w-64 opacity-100" : "w-0 opacity-0"
          } overflow-hidden`}
        >
          {showToolbar && (
            <ImageToolbar classes={classes} onClassesChange={setClasses} />
          )}
        </div>

        {/* Main content area */}
        <div
          className={`flex flex-col transition-all duration-300 ease-in-out ${
            showToolbar ? "flex-1" : "w-full"
          }`}
        >
          <ImageArea
            image={data.image}
            onImageChange={(image) => setData((prev) => ({ ...prev, image }))}
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
