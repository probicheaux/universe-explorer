import React, { useRef, useEffect, useState, useMemo } from "react";
import { getColorForLabel } from "@/utils/colors";
import { InferImageResponse } from "@/adapters/roboflowAdapter";
import BoundingBox from "./BoundingBox";

interface ResultsCanvasProps {
  result: InferImageResponse;
  image?: string;
  imageDimensions?: {
    width: number;
    height: number;
    x: number;
    y: number;
  };
}

export default function ResultsCanvas({
  result,
  image,
  imageDimensions,
}: ResultsCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState({ x: 1, y: 1 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // Memoize the boxes to display to prevent unnecessary re-renders
  const boxesToDisplay = useMemo(() => {
    return result?.predictions ?? [];
  }, [result]);

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

      // Calculate scale factors based on the rendered image size
      const scaleX = imageDimensions.width / imgWidth;
      const scaleY = imageDimensions.height / imgHeight;

      // Get the container's dimensions
      if (!containerRef.current) return;

      // Calculate offset relative to the container
      const offsetX = imageDimensions.x;
      const offsetY = imageDimensions.y;

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

  // Memoize the bounding boxes to prevent unnecessary re-renders
  const boundingBoxes = useMemo(() => {
    return boxesToDisplay.map((box, index) => {
      const color = getColorForLabel(box.class);

      // First subtract the offset to get coordinates relative to the image content
      // Then scale, and finally add the offset back
      const scaledX = box.x * scale.x + offset.x - (box.width * scale.x) / 2;
      const scaledY = box.y * scale.y + offset.y - (box.height * scale.y) / 2;
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
    });
  }, [boxesToDisplay, scale, offset]);

  return (
    <div ref={containerRef} className="absolute inset-0 z-10">
      {boundingBoxes}
    </div>
  );
}
