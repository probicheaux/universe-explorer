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
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // For now, we'll use hardcoded boxes for demonstration
  console.log("results on canvas", results);
  const boxesToDisplay = results?.[0]?.predictions ?? [];

  // Calculate scale factors and offset when image dimensions change
  useEffect(() => {
    if (!containerRef.current || !image) return;

    // Create a temporary image to get the original dimensions
    const img = new Image();
    img.onload = () => {
      const imgWidth = img.width;
      const imgHeight = img.height;
      console.log("Original image dimensions:", {
        width: imgWidth,
        height: imgHeight,
      });

      // Find the image container (the div with centering classes)
      const imageContainer = document.querySelector(
        ".relative.w-full.h-full.flex.items-center.justify-center"
      );
      if (!imageContainer || !containerRef.current) {
        console.log("Could not find image container");
        return;
      }

      // Get the container dimensions
      const containerRect = containerRef.current.getBoundingClientRect();
      const imageContainerRect = imageContainer.getBoundingClientRect();

      console.log("Container dimensions:", {
        width: containerRect.width,
        height: containerRect.height,
        left: containerRect.left,
        top: containerRect.top,
      });

      // Find the actual rendered image element
      const renderedImg = imageContainer.querySelector("img");
      if (!renderedImg) {
        console.log("Could not find rendered image element");
        return;
      }

      const renderedRect = renderedImg.getBoundingClientRect();
      console.log("Rendered image dimensions:", {
        width: renderedRect.width,
        height: renderedRect.height,
      });

      // Calculate scale factors based on the actual rendered image size
      const scaleX = renderedRect.width / imgWidth;
      const scaleY = renderedRect.height / imgHeight;

      console.log("Scale calculation:", {
        scaleX: `${renderedRect.width} / ${imgWidth} = ${scaleX}`,
        scaleY: `${renderedRect.height} / ${imgHeight} = ${scaleY}`,
      });

      // Calculate offset based on the container's position relative to our canvas
      const offsetX = imageContainerRect.left - containerRect.left;
      const offsetY = imageContainerRect.top - containerRect.top;

      console.log("Offset:", { x: offsetX, y: offsetY });

      setScale({ x: scaleX, y: scaleY });
      setOffset({ x: offsetX, y: offsetY });
    };
    img.src = image;
  }, [image]);

  return (
    <div ref={containerRef} className="absolute inset-0 z-10">
      {boxesToDisplay.map((box, index) => {
        const color = getColorForLabel(box.class);

        // Scale the coordinates and apply offset to match the rendered image position
        const scaledX = box.x * scale.x + offset.x;
        const scaledY = box.y * scale.y + offset.y;
        const scaledWidth = box.width * scale.x;
        const scaledHeight = box.height * scale.y;

        console.log(`Box ${index} transformation:`, {
          original: {
            x: box.x,
            y: box.y,
            width: box.width,
            height: box.height,
          },
          scale: scale,
          offset: offset,
          scaled: {
            x: scaledX,
            y: scaledY,
            width: scaledWidth,
            height: scaledHeight,
          },
        });

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
