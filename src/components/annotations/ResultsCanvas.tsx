import React, { useRef, useEffect, useMemo } from "react";
import { getColorForLabel } from "@/utils/colors";
import { InferImageResponse } from "@/adapters/roboflowAdapter";
import BoundingBox from "./BoundingBox";

interface ResultsCanvasProps {
  result: InferImageResponse | null | undefined;
  image?: string;
  imageDimensions?: {
    width: number;
    height: number;
    x: number;
    y: number;
  };
  offset: { x: number; y: number };
  setOffset: (offset: { x: number; y: number }) => void;
  scale: { x: number; y: number };
  setScale: (scale: { x: number; y: number }) => void;
  confidenceThreshold?: number;
  onConfidenceChange?: (threshold: number) => void;
}

export default function ResultsCanvas({
  result,
  image,
  imageDimensions,
  offset,
  setOffset,
  scale,
  setScale,
  confidenceThreshold = 0.5,
  onConfidenceChange,
}: ResultsCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Memoize the boxes to display to prevent unnecessary re-renders
  const boxesToDisplay = useMemo(() => {
    if (!result || result.error) {
      return [];
    }
    // Filter predictions based on confidence threshold
    return (result.predictions ?? []).filter(
      (prediction) => prediction.confidence >= confidenceThreshold
    );
  }, [result, confidenceThreshold]);

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

  // Handle confidence threshold change
  const handleConfidenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onConfidenceChange) {
      onConfidenceChange(parseFloat(e.target.value));
    }
  };

  return (
    <div ref={containerRef} className="absolute inset-0 z-10">
      {boundingBoxes}

      {/* Confidence Threshold Slider */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800/80 backdrop-blur-sm p-3 rounded-lg shadow-lg flex items-center gap-3 z-20">
        <span className="text-white text-sm whitespace-nowrap">
          Confidence: {(confidenceThreshold * 100).toFixed(0)}%
        </span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={confidenceThreshold}
          onChange={handleConfidenceChange}
          className="w-32 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
        />
      </div>
    </div>
  );
}
