import React from "react";
import { getColorForLabel } from "@/utils/colors";
import { InferImageResponse } from "@/adapters/roboflowAdapter";
import BoundingBox from "./BoundingBox";

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
          <BoundingBox
            key={index}
            start={{ x: box.x, y: box.y }}
            end={{ x: box.x + box.width, y: box.y + box.height }}
            label={`${box.class} (${(box.confidence * 100).toFixed(0)}%)`}
            color={color}
            isSelected={false}
            onHover={undefined}
            onClick={undefined}
            onResizeStart={undefined}
            onMoveStart={undefined}
            onMenuOpen={undefined}
          />
        );
      })}
    </div>
  );
}
