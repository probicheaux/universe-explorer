import { useRef, useState, useEffect, useCallback, useMemo, memo } from "react";
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
  color?: string;
}

interface BoundingBoxCanvasProps {
  selectedClass: string;
  onBoxesChange?: (boxes: BoundingBoxData[]) => void;
  availableClasses?: string[];
  onClassSelect?: (className: string) => void;
  classColors?: Record<string, string>;
}

// Memoized DrawingGuides component to prevent unnecessary re-renders
const MemoizedDrawingGuides = memo(DrawingGuides);

// Memoized BoundingBox component to prevent unnecessary re-renders
const MemoizedBoundingBox = memo(BoundingBox);

export default function BoundingBoxCanvas({
  selectedClass,
  onBoxesChange,
  availableClasses = [],
  onClassSelect,
  classColors = {},
}: BoundingBoxCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentBox, setCurrentBox] = useState<BoundingBoxData | null>(null);
  const [boxes, setBoxes] = useState<BoundingBoxData[]>([]);
  const [mousePosition, setMousePosition] = useState<Point>({ x: 0, y: 0 });
  const [showClassMenu, setShowClassMenu] = useState(false);
  const [pendingBox, setPendingBox] = useState<BoundingBoxData | null>(null);
  const [menuPosition, setMenuPosition] = useState<Point>({ x: 0, y: 0 });
  const [selectedBoxIndex, setSelectedBoxIndex] = useState<number | null>(null);
  const [isHoveringBox, setIsHoveringBox] = useState(false);

  // Memoize the getRelativeCoordinates function
  const getRelativeCoordinates = useCallback((e: React.MouseEvent): Point => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  // Optimize mouseDown handler
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // If we're showing the class menu or hovering a box, don't start drawing
      if (showClassMenu || isHoveringBox) return;

      setIsDrawing(true);
      const start = getRelativeCoordinates(e);

      // If we have a selected class, use it
      if (selectedClass) {
        setCurrentBox({
          start,
          end: start,
          label: selectedClass,
          color: classColors[selectedClass],
        });
      } else {
        // Otherwise, create a temporary box with a placeholder label
        setCurrentBox({ start, end: start, label: "Select class..." });
      }
    },
    [
      showClassMenu,
      isHoveringBox,
      selectedClass,
      classColors,
      getRelativeCoordinates,
    ]
  );

  // Optimize mouseMove handler - use requestAnimationFrame for smoother updates
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const position = getRelativeCoordinates(e);

      // Only update mouse position if not drawing to reduce re-renders
      if (!isDrawing) {
        setMousePosition(position);
      }

      if (isDrawing && currentBox) {
        // Use requestAnimationFrame for smoother updates
        requestAnimationFrame(() => {
          setCurrentBox({ ...currentBox, end: position });
        });
      }
    },
    [isDrawing, currentBox, getRelativeCoordinates]
  );

  // Optimize mouseUp handler
  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!isDrawing || !currentBox) return;

      // Only add box if it has some size
      if (
        Math.abs(currentBox.end.x - currentBox.start.x) > 5 &&
        Math.abs(currentBox.end.y - currentBox.start.y) > 5
      ) {
        // If we have a selected class, add the box directly
        if (selectedClass) {
          const newBoxes = [...boxes, currentBox];
          setBoxes(newBoxes);
          onBoxesChange?.(newBoxes);
        } else {
          // Otherwise, show the class selection menu
          setPendingBox(currentBox);

          // Position the menu right next to the cursor
          setMenuPosition({
            x: e.clientX,
            y: e.clientY,
          });

          setShowClassMenu(true);
        }
      }

      setIsDrawing(false);
      setCurrentBox(null);
    },
    [isDrawing, currentBox, selectedClass, boxes, onBoxesChange]
  );

  // Optimize class selection handler
  const handleClassSelect = useCallback(
    (className: string) => {
      if (pendingBox && onClassSelect) {
        // Update the box with the selected class
        const updatedBox = {
          ...pendingBox,
          label: className,
          color: classColors[className],
        };
        const newBoxes = [...boxes, updatedBox];
        setBoxes(newBoxes);
        onBoxesChange?.(newBoxes);

        // Select the class for future boxes
        onClassSelect(className);
      }

      setShowClassMenu(false);
      setPendingBox(null);
    },
    [pendingBox, onClassSelect, classColors, boxes, onBoxesChange]
  );

  // Optimize menu close handler
  const handleCloseMenu = useCallback(() => {
    setShowClassMenu(false);
    setPendingBox(null);
  }, []);

  // Optimize box hover handler
  const handleBoxHover = useCallback((isHovering: boolean) => {
    setIsHoveringBox(isHovering);
  }, []);

  // Optimize box click handler
  const handleBoxClick = useCallback(
    (index: number) => {
      setSelectedBoxIndex(index);
      // Get the box position for menu placement
      if (canvasRef.current && boxes[index]) {
        const box = boxes[index];
        const left = Math.min(box.start.x, box.end.x);
        const top = Math.min(box.start.y, box.end.y);
        const width = Math.abs(box.end.x - box.start.x);

        // Position menu to the right of the box
        setMenuPosition({
          x: left + width + 10,
          y: top,
        });
      }
    },
    [boxes]
  );

  // Optimize delete box handler
  const handleDeleteBox = useCallback(() => {
    if (selectedBoxIndex !== null) {
      const newBoxes = boxes.filter((_, i) => i !== selectedBoxIndex);
      setBoxes(newBoxes);
      onBoxesChange?.(newBoxes);
      setSelectedBoxIndex(null);
    }
  }, [selectedBoxIndex, boxes, onBoxesChange]);

  // Optimize change class handler
  const handleChangeClass = useCallback(
    (className: string) => {
      if (selectedBoxIndex !== null) {
        const newBoxes = [...boxes];
        newBoxes[selectedBoxIndex] = {
          ...newBoxes[selectedBoxIndex],
          label: className,
          color: classColors[className],
        };
        setBoxes(newBoxes);
        onBoxesChange?.(newBoxes);
        setSelectedBoxIndex(null);
      }
    },
    [selectedBoxIndex, boxes, onBoxesChange, classColors]
  );

  // Optimize key down handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Delete" && selectedBoxIndex !== null) {
        handleDeleteBox();
      } else if (e.key === "Escape") {
        if (showClassMenu) {
          handleCloseMenu();
        } else if (selectedBoxIndex !== null) {
          setSelectedBoxIndex(null);
        }
      }
    },
    [selectedBoxIndex, showClassMenu, handleDeleteBox, handleCloseMenu]
  );

  // Add keyboard event listener
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Memoize the boxes rendering to prevent unnecessary re-renders
  const renderedBoxes = useMemo(() => {
    return boxes.map((box, index) => (
      <MemoizedBoundingBox
        key={index}
        start={box.start}
        end={box.end}
        label={box.label}
        color={box.color}
        isSelected={index === selectedBoxIndex}
        onHover={handleBoxHover}
        onClick={() => handleBoxClick(index)}
      />
    ));
  }, [boxes, selectedBoxIndex, handleBoxHover, handleBoxClick]);

  // Memoize the current box rendering
  const renderedCurrentBox = useMemo(() => {
    if (!currentBox) return null;

    return (
      <MemoizedBoundingBox
        start={currentBox.start}
        end={currentBox.end}
        label={currentBox.label}
        color={currentBox.color}
      />
    );
  }, [currentBox]);

  // Memoize the pending box rendering
  const renderedPendingBox = useMemo(() => {
    if (!pendingBox || currentBox) return null;

    return (
      <MemoizedBoundingBox
        start={pendingBox.start}
        end={pendingBox.end}
        label={pendingBox.label}
        color={pendingBox.color}
      />
    );
  }, [pendingBox, currentBox]);

  return (
    <div
      ref={canvasRef}
      className={`absolute inset-0 z-10 ${
        isDrawing ? "cursor-crosshair" : "cursor-default"
      }`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <MemoizedDrawingGuides
        mousePosition={mousePosition}
        selectedClass={selectedClass}
        color={selectedClass ? classColors[selectedClass] : undefined}
        isHidden={isHoveringBox || selectedBoxIndex !== null}
      />

      {/* Existing Boxes */}
      {renderedBoxes}

      {/* Current Box Being Drawn */}
      {renderedCurrentBox}

      {/* Pending Box (when no class is selected) */}
      {renderedPendingBox}

      {/* Class Selection Menu */}
      {showClassMenu && (
        <div
          className="fixed z-20 bg-gray-900/90 backdrop-blur-md rounded-lg shadow-lg p-2 min-w-[150px]"
          style={{
            left: menuPosition.x,
            top: menuPosition.y,
            transform: "translate(10px, 10px)", // Position right next to the cursor
          }}
        >
          <div className="flex justify-between items-center mb-2 px-2">
            <div className="text-xs text-gray-400">Select class:</div>
            <button
              onClick={handleCloseMenu}
              className="text-gray-500 hover:text-gray-300 text-xs"
            >
              ×
            </button>
          </div>
          <div className="flex flex-col gap-1">
            {availableClasses.map((cls) => (
              <button
                key={cls}
                className="text-left px-3 py-1.5 rounded-md text-sm text-gray-200 hover:bg-gray-800 transition-colors"
                onClick={() => handleClassSelect(cls)}
                style={{
                  color: classColors[cls],
                }}
              >
                {cls}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Box Actions Menu */}
      {selectedBoxIndex !== null && (
        <div
          className="fixed z-20 bg-gray-900/90 backdrop-blur-md rounded-lg shadow-lg p-2 min-w-[150px]"
          style={{
            left: menuPosition.x,
            top: menuPosition.y,
            transform: "none", // Remove the transform that was positioning relative to cursor
          }}
        >
          <div className="flex justify-between items-center mb-2 px-2">
            <div className="text-xs text-gray-400">Box Actions:</div>
            <button
              onClick={() => setSelectedBoxIndex(null)}
              className="text-gray-500 hover:text-gray-300 text-xs"
            >
              ×
            </button>
          </div>
          <div className="flex flex-col gap-1">
            <button
              className="text-left px-3 py-1.5 rounded-md text-xs font-semibold hover:bg-gray-800 transition-colors"
              onClick={handleDeleteBox}
            >
              Delete Box
            </button>
            <div className="px-2 py-1 text-xs text-gray-400">Change Class:</div>
            {availableClasses.map((cls) => (
              <button
                key={cls}
                className="text-left px-3 py-1.5 rounded-md text-sm hover:bg-gray-800 transition-colors"
                onClick={() => handleChangeClass(cls)}
                style={{
                  color: classColors[cls],
                }}
              >
                {cls}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
