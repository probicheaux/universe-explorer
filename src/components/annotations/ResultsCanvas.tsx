import React from "react";
import { getColorForLabel } from "@/utils/colors";
import { InferImageResponse } from "@/adapters/roboflowAdapter";

interface ResultsCanvasProps {
  results: InferImageResponse[];
}

export default function ResultsCanvas({ results = [] }: ResultsCanvasProps) {
  // For now, we'll use hardcoded boxes for demonstration
  console.log("results on canvas", results);
  const boxesToDisplay = results?.[0]?.predictions ?? [];

  return (
    <div className="absolute inset-0 z-10">
      {boxesToDisplay.map((box, index) => {
        const color = getColorForLabel(box.class);
        return (
          <div
            key={index}
            className="absolute border-2 rounded-md"
            style={{
              left: `${box.x}px`,
              top: `${box.y}px`,
              width: `${box.width}px`,
              height: `${box.height}px`,
              borderColor: color,
              backgroundColor: `${color}33`,
            }}
          >
            <div
              className="absolute -top-6 left-0 px-2 py-1 text-xs font-medium rounded-t-md"
              style={{ backgroundColor: color }}
            >
              {box.class} ({(box.confidence * 100).toFixed(0)}%)
            </div>
          </div>
        );
      })}
    </div>
  );
}
