import React, { useRef, useEffect, useState } from "react";
import { getColorForLabel } from "@/utils/colors";
import { InferImageResponse } from "@/adapters/roboflowAdapter";
import BoundingBox from "./BoundingBox";

interface ResultsCanvasProps {
  results: InferImageResponse[];
  image?: string;
  imageDimensions?: {
    width: number;
    height: number;
    x: number;
    y: number;
  };
}

export default function ResultsCanvas({
  results = [],
  image,
  imageDimensions,
}: ResultsCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState({ x: 1, y: 1 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // For now, we'll use hardcoded boxes for demonstration
  console.log("results on canvas", results);
  const boxesToDisplay = results?.[0]?.predictions ?? [];

  const calculateScaleAndOffset = () => {
    if (!containerRef.current || !image || !imageDimensions) {
      console.log("Missing required data:", {
        hasContainer: !!containerRef.current,
        hasImage: !!image,
        hasDimensions: !!imageDimensions,
      });
      return;
    }

    // Create a temporary image to get the original dimensions
    const img = new Image();
    img.onload = () => {
      const imgWidth = img.width;
      const imgHeight = img.height;
      console.log("Original image dimensions:", {
        width: imgWidth,
        height: imgHeight,
      });

      // Get the container dimensions
      const containerRect = containerRef.current!.getBoundingClientRect();

      console.log("Container dimensions:", {
        width: containerRect.width,
        height: containerRect.height,
        left: containerRect.left,
        top: containerRect.top,
      });

      console.log("Rendered image dimensions:", imageDimensions);

      // Calculate scale factors based on the actual rendered image size
      const scaleX = imageDimensions.width / imgWidth;
      const scaleY = imageDimensions.height / imgHeight;

      console.log("Scale calculation:", {
        scaleX: `${imageDimensions.width} / ${imgWidth} = ${scaleX}`,
        scaleY: `${imageDimensions.height} / ${imgHeight} = ${scaleY}`,
      });

      // The imageDimensions x and y are already relative to the container
      // so we don't need to subtract containerRect.left/top
      const offsetX = imageDimensions.x;
      const offsetY = imageDimensions.y;

      console.log("Offset:", { x: offsetX, y: offsetY });

      setScale({ x: scaleX, y: scaleY });
      setOffset({ x: offsetX, y: offsetY });
    };
    img.src = image;
  };

  // Calculate scale and offset when image dimensions change
  useEffect(() => {
    calculateScaleAndOffset();
  }, [image, imageDimensions]);

  // Set up resize observer to recalculate when layout changes
  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      calculateScaleAndOffset();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Also observe window resize
    window.addEventListener("resize", calculateScaleAndOffset);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", calculateScaleAndOffset);
    };
  }, [image, imageDimensions]);

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
