import React, { useRef, useEffect, useState } from "react";
import { getColorForLabel } from "@/utils/colors";
import { InferImageResponse } from "@/adapters/roboflowAdapter";
import BoundingBox from "./BoundingBox";

interface ResultsCanvasProps {
  results: InferImageResponse[];
  image?: string;
}

export default function ResultsCanvas({
  results = [],
  image,
}: ResultsCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState({ x: 1, y: 1 });

  // For now, we'll use hardcoded boxes for demonstration
  console.log("results on canvas", results);
  const boxesToDisplay = results?.[0]?.predictions ?? [];

  // Calculate scale factors when image dimensions change
  useEffect(() => {
    if (!containerRef.current || !image) return;

    // Get the container dimensions
    const containerRect = containerRef.current.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;

    // Create a temporary image to get the original dimensions
    const img = new Image();
    img.onload = () => {
      const imgWidth = img.width;
      const imgHeight = img.height;

      // Calculate scale factors
      const scaleX = containerWidth / imgWidth;
      const scaleY = containerHeight / imgHeight;

      setScale({ x: scaleX, y: scaleY });
    };
    img.src = image;
  }, [image]);

  return (
    <div ref={containerRef} className="absolute inset-0 z-10">
      {boxesToDisplay.map((box, index) => {
        const color = getColorForLabel(box.class);

        // Scale the coordinates to match the rendered image size
        const scaledX = box.x * scale.x;
        const scaledY = box.y * scale.y;
        const scaledWidth = box.width * scale.x;
        const scaledHeight = box.height * scale.y;

        return (
          <BoundingBox
            key={index}
            start={{ x: scaledX, y: scaledY }}
            end={{ x: scaledX + scaledWidth, y: scaledY + scaledHeight }}
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
