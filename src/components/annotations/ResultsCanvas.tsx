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
  const [containerDimensions, setContainerDimensions] = useState({
    width: 0,
    height: 0,
    x: 0,
    y: 0,
  });

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

      // Calculate scale factors based on the rendered image size
      const scaleX = imageDimensions.width / imgWidth;
      const scaleY = imageDimensions.height / imgHeight;

      // Get the container's dimensions
      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();

      // Calculate container position based on it being centered with the image
      const containerX =
        imageDimensions.x + (imageDimensions.width - containerRect.width) / 2;
      const containerY =
        imageDimensions.y + (imageDimensions.height - containerRect.height) / 2;

      setContainerDimensions({
        width: containerRect.width,
        height: containerRect.height,
        x: containerX,
        y: containerY,
      });

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

  return (
    <div ref={containerRef} className="absolute inset-0 z-10">
      {/* Debug box to visualize reported dimensions */}
      {imageDimensions && (
        <div
          style={{
            position: "absolute",
            left: imageDimensions.x,
            top: imageDimensions.y,
            width: imageDimensions.width,
            height: imageDimensions.height,
            border: "2px solid red",
            pointerEvents: "none",
          }}
        />
      )}
      {/* Debug box to visualize container dimensions */}
      {containerRef.current && (
        <div
          style={{
            position: "absolute",
            left: containerDimensions.x,
            top: containerDimensions.y,
            width: containerDimensions.width,
            height: containerDimensions.height,
            border: "2px solid blue",
            pointerEvents: "none",
          }}
        />
      )}
      {/* Debug offset point visualization   */}
      <div
        style={{
          position: "absolute",
          left: offset.x,
          top: offset.y,
          width: 10,
          height: 10,
          backgroundColor: "green",
          pointerEvents: "none",
        }}
      />
      {boxesToDisplay.map((box, index) => {
        const color = getColorForLabel(box.class);

        console.log("offset", offset);

        // Scale the coordinates and apply offset to match the rendered image position
        const removeBoxWidth =
          imageDimensions?.width &&
          containerDimensions.width === imageDimensions?.width
            ? (box.width * scale.x) / 2
            : 0;
        const removeBoxHeight =
          imageDimensions?.height &&
          containerDimensions.height === imageDimensions?.height
            ? (box.height * scale.y) / 2
            : 0;
        const scaledX =
          (box.x - offset.x) * scale.x + offset.x - removeBoxWidth;
        const scaledY =
          (box.y - offset.y) * scale.y + offset.y - removeBoxHeight;

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
