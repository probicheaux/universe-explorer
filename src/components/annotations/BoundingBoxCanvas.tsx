import { useRef, useState, useEffect } from "react";
import BoundingBox from "./BoundingBox";
import DrawingGuides from "./DrawingGuides";

interface Point {
  x: number;
  y: number;
}

interface BoundingBoxData {
  start: Point;
  end: Point;
  label: string;
}

interface BoundingBoxCanvasProps {
  selectedClass: string;
  onBoxesChange?: (boxes: BoundingBoxData[]) => void;
}

export default function BoundingBoxCanvas({
  selectedClass,
  onBoxesChange,
}: BoundingBoxCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentBox, setCurrentBox] = useState<BoundingBoxData | null>(null);
  const [boxes, setBoxes] = useState<BoundingBoxData[]>([]);
  const [mousePosition, setMousePosition] = useState<Point>({ x: 0, y: 0 });

  const getRelativeCoordinates = (e: React.MouseEvent): Point => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!selectedClass) return;
    setIsDrawing(true);
    const start = getRelativeCoordinates(e);
    setCurrentBox({ start, end: start, label: selectedClass });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const position = getRelativeCoordinates(e);
    setMousePosition(position);

    if (isDrawing && currentBox) {
      setCurrentBox({ ...currentBox, end: position });
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentBox) return;

    // Only add box if it has some size
    if (
      Math.abs(currentBox.end.x - currentBox.start.x) > 5 &&
      Math.abs(currentBox.end.y - currentBox.start.y) > 5
    ) {
      const newBoxes = [...boxes, currentBox];
      setBoxes(newBoxes);
      onBoxesChange?.(newBoxes);
    }

    setIsDrawing(false);
    setCurrentBox(null);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Delete" && boxes.length > 0) {
      const newBoxes = boxes.slice(0, -1);
      setBoxes(newBoxes);
      onBoxesChange?.(newBoxes);
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [boxes]);

  return (
    <div
      ref={canvasRef}
      className="absolute inset-0 z-50 cursor-crosshair"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <DrawingGuides mousePosition={mousePosition} />

      {/* Existing Boxes */}
      {boxes.map((box, index) => (
        <BoundingBox
          key={index}
          start={box.start}
          end={box.end}
          label={box.label}
        />
      ))}

      {/* Current Box Being Drawn */}
      {currentBox && (
        <BoundingBox
          start={currentBox.start}
          end={currentBox.end}
          label={currentBox.label}
          isActive={true}
        />
      )}
    </div>
  );
}
