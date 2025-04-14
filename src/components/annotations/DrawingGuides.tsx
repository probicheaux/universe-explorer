import { useMemo } from "react";

interface Point {
  x: number;
  y: number;
}

interface DrawingGuidesProps {
  mousePosition: Point;
  selectedClass?: string;
  color?: string;
}

export default function DrawingGuides({
  mousePosition,
  selectedClass,
  color,
}: DrawingGuidesProps) {
  const { x, y } = mousePosition;

  const guideColor = useMemo(() => {
    if (!color) return "rgba(255, 255, 255, 0.3)";
    return color;
  }, [color]);

  return (
    <>
      {/* Horizontal Guide */}
      <div
        className="absolute w-full h-[1px]"
        style={{
          top: y,
          backgroundColor: guideColor,
          opacity: 0.5,
        }}
      />

      {/* Vertical Guide */}
      <div
        className="absolute h-full w-[1px]"
        style={{
          left: x,
          backgroundColor: guideColor,
          opacity: 0.5,
        }}
      />

      {/* Class Label */}
      {selectedClass && (
        <div
          className="absolute px-2 py-1 rounded-md text-xs font-medium backdrop-blur-md"
          style={{
            left: x + 10,
            top: y + 10,
            backgroundColor: `${guideColor}33`,
            color: guideColor,
          }}
        >
          draw {selectedClass}
        </div>
      )}
    </>
  );
}
