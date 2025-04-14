import React from "react";
import { memo } from "react";

interface Point {
  x: number;
  y: number;
}

interface DrawingGuidesProps {
  mousePosition: Point;
  selectedClass: string | undefined;
  color: string | undefined;
  isHidden: boolean | undefined;
}

function DrawingGuides({
  mousePosition,
  selectedClass,
  color,
  isHidden = false,
}: DrawingGuidesProps) {
  const { x, y } = mousePosition;
  const guideColor = color || "rgba(255, 255, 255, 0.3)";

  if (isHidden) return null;

  return (
    <>
      {/* Horizontal Guide */}
      <div
        className="absolute w-full h-[2px]"
        style={{
          top: y,
          borderTop: `2px dashed ${guideColor}`,
          opacity: 0.5,
        }}
      />

      {/* Vertical Guide */}
      <div
        className="absolute h-full w-[2px]"
        style={{
          left: x,
          borderLeft: `2px dashed ${guideColor}`,
          opacity: 0.5,
        }}
      />

      {/* Class Label */}
      {selectedClass && (
        <div
          className="absolute px-2 py-1 rounded-md text-xs font-medium backdrop-blur-md !text-white"
          style={{
            left: x + 10,
            top: y + 10,
            backgroundColor: `${guideColor}33`,
          }}
        >
          draw {selectedClass}
        </div>
      )}
    </>
  );
}

// Memoize the component to prevent unnecessary re-renders
export default memo(DrawingGuides);
