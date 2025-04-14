import { memo, useState } from "react";

interface Point {
  x: number;
  y: number;
}

export interface BoundingBoxProps {
  start: Point;
  end: Point;
  label: string;
  color?: string;
  isSelected?: boolean;
  onHover?: (isHovering: boolean) => void;
  onClick?: () => void;
  onResizeStart?: (handle: string) => void;
  onMoveStart?: () => void;
  onMenuOpen?: () => void;
}

// Generate a consistent color based on the class name
export const getColorForLabel = (label: string) => {
  let hash = 0;
  for (let i = 0; i < label.length; i++) {
    hash = label.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 50%)`;
};

function BoundingBox({
  start,
  end,
  label,
  color = "#666666",
  isSelected = false,
  onHover,
  onClick,
  onResizeStart,
  onMoveStart,
  onMenuOpen,
}: BoundingBoxProps) {
  const left = Math.min(start.x, end.x);
  const top = Math.min(start.y, end.y);
  const width = Math.abs(end.x - start.x);
  const height = Math.abs(end.y - start.y);
  const [isMenuHovered, setIsMenuHovered] = useState(false);

  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent, handle: string) => {
    e.stopPropagation();
    onResizeStart?.(handle);
  };

  // Handle move start
  const handleMoveStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMoveStart?.();
  };

  // Handle menu button click
  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMenuOpen?.();
  };

  return (
    <div
      className={`absolute group ${
        isSelected ? "z-20" : "z-10"
      } cursor-pointer`}
      style={{
        left,
        top,
        width,
        height,
        border: `2px solid ${color}`,
        backgroundColor: isSelected ? `${color}33` : "transparent",
        transition: "background-color 0.2s ease-in-out",
      }}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
      onClick={onClick}
      onMouseDown={isSelected ? handleMoveStart : undefined}
    >
      {/* Label */}
      <div
        className="absolute -top-6 left-0 px-2 py-1 rounded-t-md text-xs font-medium whitespace-nowrap"
        style={{
          backgroundColor: color,
          color: "#fff",
        }}
      >
        {label}
      </div>

      {/* Three Dots Menu Button */}
      <div
        className={`absolute -top-6 right-0 w-6 h-6 flex items-center justify-center rounded-t-md text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150 ${
          isMenuHovered ? "opacity-100" : ""
        }`}
        style={{
          backgroundColor: color,
        }}
        onMouseEnter={() => setIsMenuHovered(true)}
        onMouseLeave={() => setIsMenuHovered(false)}
        onClick={handleMenuClick}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="1"></circle>
          <circle cx="12" cy="5" r="1"></circle>
          <circle cx="12" cy="19" r="1"></circle>
        </svg>
      </div>

      {/* Selection Overlay */}
      {isSelected && (
        <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" />
      )}

      {/* Hover Indicator */}
      {!isSelected && (
        <div className="absolute inset-0 border-2 border-dashed border-white/50 opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
      )}

      {/* Hover Background */}
      {!isSelected && (
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
          style={{
            backgroundColor: `${color}22`,
          }}
        />
      )}

      {/* Corner Resize Handles - Only show when selected */}
      {isSelected && (
        <>
          {/* Top-left handle */}
          <div
            className="absolute w-3 h-3 bg-white border border-gray-700 rounded-full -top-1.5 -left-1.5 cursor-nw-resize"
            onMouseDown={(e) => handleResizeStart(e, "nw")}
          />

          {/* Top-right handle */}
          <div
            className="absolute w-3 h-3 bg-white border border-gray-700 rounded-full -top-1.5 -right-1.5 cursor-ne-resize"
            onMouseDown={(e) => handleResizeStart(e, "ne")}
          />

          {/* Bottom-left handle */}
          <div
            className="absolute w-3 h-3 bg-white border border-gray-700 rounded-full -bottom-1.5 -left-1.5 cursor-sw-resize"
            onMouseDown={(e) => handleResizeStart(e, "sw")}
          />

          {/* Bottom-right handle */}
          <div
            className="absolute w-3 h-3 bg-white border border-gray-700 rounded-full -bottom-1.5 -right-1.5 cursor-se-resize"
            onMouseDown={(e) => handleResizeStart(e, "se")}
          />
        </>
      )}
    </div>
  );
}

// Memoize the component to prevent unnecessary re-renders
export default memo(BoundingBox);
