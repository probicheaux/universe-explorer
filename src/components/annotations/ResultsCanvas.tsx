import React from "react";
import { getColorForLabel } from "@/utils/colors";

interface ResultsCanvasProps {
  image: string;
  // This will be replaced with real data later
  results?: any[];
}

export default function ResultsCanvas({
  image,
  results = [],
}: ResultsCanvasProps) {
  // For now, we'll use hardcoded boxes for demonstration
  const hardcodedBoxes = [
    {
      class: "person",
      x: 100,
      y: 100,
      width: 200,
      height: 300,
      confidence: 0.95,
    },
    { class: "car", x: 400, y: 200, width: 300, height: 150, confidence: 0.87 },
    {
      class: "truck",
      x: 700,
      y: 300,
      width: 250,
      height: 180,
      confidence: 0.92,
    },
  ];

  const boxesToDisplay = results.length > 0 ? results : hardcodedBoxes;

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
