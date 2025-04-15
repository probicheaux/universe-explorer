import { useRef, useState, useEffect, useCallback } from "react";
import BoundingBox from "./BoundingBox";
import DrawingGuides from "./DrawingGuides";

interface Point {
  x: number;
  y: number;
}

interface BoundingBoxPromptData {
  class: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
}

interface BoundingBoxCanvasProps {
  selectedClass: string;
  onBoxesChange?: (boxes: BoundingBoxPromptData[]) => void;
  availableClasses: string[];
  onClassSelect: (className: string) => void;
  classColors: Record<string, string>;
  className?: string;
  boxes: BoundingBoxPromptData[];
  hideGuides?: boolean;
}

export default function BoundingBoxCanvas({
  selectedClass,
  onBoxesChange,
  availableClasses,
  onClassSelect,
  classColors,
  className = "",
  boxes = [],
  hideGuides = false,
}: BoundingBoxCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentBox, setCurrentBox] = useState<BoundingBoxPromptData | null>(
    null
  );
  const [mousePosition, setMousePosition] = useState<Point>({ x: 0, y: 0 });
  const [showClassMenu, setShowClassMenu] = useState(false);
  const [pendingBox, setPendingBox] = useState<BoundingBoxPromptData | null>(
    null
  );
  const [menuPosition, setMenuPosition] = useState<Point>({ x: 0, y: 0 });
  const [selectedBoxIndex, setSelectedBoxIndex] = useState<number | null>(null);
  const [isHoveringBox, setIsHoveringBox] = useState(false);
  const [showBoxMenu, setShowBoxMenu] = useState(false);

  // New state for move and resize operations
  const [isMoving, setIsMoving] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [moveStartPosition, setMoveStartPosition] = useState<Point | null>(
    null
  );
  const [originalBox, setOriginalBox] = useState<BoundingBoxPromptData | null>(
    null
  );

  // Use a ref to track the current mouse position during drawing
  const currentMousePositionRef = useRef<Point>({ x: 0, y: 0 });

  // Use a ref to track if we're currently in a drawing operation
  const isDrawingRef = useRef(false);

  // Use a ref to track the current box being drawn
  const currentBoxRef = useRef<BoundingBoxPromptData | null>(null);

  const getRelativeCoordinates = (e: React.MouseEvent): Point => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // If we're showing the class menu or hovering a box, don't start drawing
    if (showClassMenu || isHoveringBox) return;

    // If a box is selected and we're clicking outside of it, deselect the box
    // But only if we're not clicking on the box menu
    if (selectedBoxIndex !== null) {
      // Check if the click is on the box menu
      const target = e.target as HTMLElement;
      const isClickOnMenu = target.closest(".box-actions-menu") !== null;

      if (!isClickOnMenu) {
        setSelectedBoxIndex(null);
        setShowBoxMenu(false);
        return;
      }
    }

    const start = getRelativeCoordinates(e);
    isDrawingRef.current = true;
    setIsDrawing(true);

    // If we have a selected class, use it
    if (selectedClass) {
      const newBox = {
        class: selectedClass,
        x: start.x,
        y: start.y,
        width: 0,
        height: 0,
        color: classColors[selectedClass],
      };
      currentBoxRef.current = newBox;
      setCurrentBox(newBox);
    } else {
      // Otherwise, create a temporary box with a placeholder label
      const newBox = {
        class: "Select class...",
        x: start.x,
        y: start.y,
        width: 0,
        height: 0,
      };
      currentBoxRef.current = newBox;
      setCurrentBox(newBox);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const position = getRelativeCoordinates(e);
    currentMousePositionRef.current = position;

    // Only update mouse position if not drawing to reduce re-renders
    if (!isDrawingRef.current && !isMoving && !isResizing) {
      setMousePosition(position);
    }

    // If we're drawing, update the current box directly
    if (isDrawingRef.current && currentBoxRef.current) {
      const width = position.x - currentBoxRef.current.x;
      const height = position.y - currentBoxRef.current.y;
      const updatedBox = {
        ...currentBoxRef.current,
        width,
        height,
      };
      currentBoxRef.current = updatedBox;
      setCurrentBox(updatedBox);
    }

    // Handle moving a box
    if (
      isMoving &&
      selectedBoxIndex !== null &&
      moveStartPosition &&
      originalBox
    ) {
      const dx = position.x - moveStartPosition.x;
      const dy = position.y - moveStartPosition.y;

      const updatedBox = {
        ...originalBox,
        x: originalBox.x + dx,
        y: originalBox.y + dy,
      };

      const newBoxes = [...boxes];
      newBoxes[selectedBoxIndex] = updatedBox;
      onBoxesChange?.(newBoxes);
    }

    // Handle resizing a box
    if (
      isResizing &&
      selectedBoxIndex !== null &&
      resizeHandle &&
      originalBox
    ) {
      const updatedBox = { ...originalBox };

      // Update the appropriate corner based on the resize handle
      switch (resizeHandle) {
        case "nw":
          updatedBox.width = originalBox.width - (position.x - originalBox.x);
          updatedBox.height = originalBox.height - (position.y - originalBox.y);
          updatedBox.x = position.x;
          updatedBox.y = position.y;
          break;
        case "ne":
          updatedBox.width = position.x - originalBox.x;
          updatedBox.height = originalBox.height - (position.y - originalBox.y);
          updatedBox.y = position.y;
          break;
        case "sw":
          updatedBox.width = originalBox.width - (position.x - originalBox.x);
          updatedBox.height = position.y - originalBox.y;
          updatedBox.x = position.x;
          break;
        case "se":
          updatedBox.width = position.x - originalBox.x;
          updatedBox.height = position.y - originalBox.y;
          break;
      }

      // Ensure the box has a minimum size
      const minSize = 10;
      if (
        Math.abs(updatedBox.width) < minSize ||
        Math.abs(updatedBox.height) < minSize
      ) {
        return; // Don't update if the box would be too small
      }

      const newBoxes = [...boxes];
      newBoxes[selectedBoxIndex] = updatedBox;
      onBoxesChange?.(newBoxes);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // If we're drawing, handle the box creation
    if (isDrawingRef.current && currentBoxRef.current) {
      // Only add box if it has some size
      if (
        Math.abs(currentBoxRef.current.width) > 5 &&
        Math.abs(currentBoxRef.current.height) > 5
      ) {
        // Normalize negative dimensions
        const box = { ...currentBoxRef.current };
        if (box.width < 0) {
          box.x += box.width;
          box.width = Math.abs(box.width);
        }
        if (box.height < 0) {
          box.y += box.height;
          box.height = Math.abs(box.height);
        }

        // If we have a selected class, add the box directly
        if (selectedClass) {
          const newBoxes = [...boxes, box];
          onBoxesChange?.(newBoxes);
        } else {
          // Otherwise, show the class selection menu
          setPendingBox(box);

          // Position the menu right next to the cursor
          setMenuPosition({
            x: e.clientX,
            y: e.clientY,
          });

          setShowClassMenu(true);
        }
      }

      isDrawingRef.current = false;
      currentBoxRef.current = null;
      setIsDrawing(false);
      setCurrentBox(null);
    }

    // End move operation
    if (isMoving) {
      setIsMoving(false);
      setMoveStartPosition(null);
      setOriginalBox(null);
    }

    // End resize operation
    if (isResizing) {
      setIsResizing(false);
      setResizeHandle(null);
      setOriginalBox(null);
    }
  };

  const handleClassSelect = (className: string) => {
    if (pendingBox && onClassSelect) {
      // Update the box with the selected class
      const updatedBox = {
        ...pendingBox,
        class: className,
        color: classColors[className],
      };
      const newBoxes = [...boxes, updatedBox];
      onBoxesChange?.(newBoxes);

      // Select the class for future boxes
      onClassSelect(className);
    }

    setShowClassMenu(false);
    setPendingBox(null);
  };

  const handleCloseMenu = useCallback(() => {
    setShowClassMenu(false);
    setPendingBox(null);
  }, []);

  const handleBoxHover = (isHovering: boolean) => {
    setIsHoveringBox(isHovering);
  };

  const handleBoxClick = (index: number) => {
    // Just select the box, don't open the menu
    setSelectedBoxIndex(index);
    setShowBoxMenu(false);
  };

  const handleMenuOpen = (index: number) => {
    // Select the box and open the menu
    setSelectedBoxIndex(index);
    setShowBoxMenu(true);
    // Get the box position for menu placement
    if (canvasRef.current && boxes[index]) {
      const box = boxes[index];
      const left = Math.min(box.x, box.x + box.width);
      const top = Math.min(box.y, box.y + box.height);
      const width = Math.abs(box.x + box.width - box.x);

      // Position menu to the right of the box
      setMenuPosition({
        x: left + width + 10,
        y: top,
      });
    }
  };

  const handleDeleteBox = useCallback(() => {
    if (selectedBoxIndex !== null) {
      const newBoxes = boxes.filter((_, i) => i !== selectedBoxIndex);
      onBoxesChange?.(newBoxes);
      setSelectedBoxIndex(null);
      setShowBoxMenu(false);
    }
  }, [selectedBoxIndex, boxes, onBoxesChange]);

  const handleChangeClass = (className: string) => {
    if (selectedBoxIndex !== null) {
      const newBoxes = [...boxes];
      newBoxes[selectedBoxIndex] = {
        ...newBoxes[selectedBoxIndex],
        class: className,
        color: classColors[className],
      };
      onBoxesChange?.(newBoxes);
      setSelectedBoxIndex(null);
      setShowBoxMenu(false);
    }
  };

  // New handlers for move and resize operations
  const handleMoveStart = () => {
    if (selectedBoxIndex !== null) {
      setIsMoving(true);
      setMoveStartPosition(currentMousePositionRef.current);
      setOriginalBox(boxes[selectedBoxIndex]);
    }
  };

  const handleResizeStart = (handle: string) => {
    if (selectedBoxIndex !== null) {
      setIsResizing(true);
      setResizeHandle(handle);
      setOriginalBox(boxes[selectedBoxIndex]);
    }
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Handle delete key
      if (e.key === "Delete" && selectedBoxIndex !== null) {
        handleDeleteBox();
      }
      // Handle escape key
      else if (e.key === "Escape") {
        if (showClassMenu) {
          handleCloseMenu();
        } else if (showBoxMenu) {
          setShowBoxMenu(false);
        } else if (selectedBoxIndex !== null) {
          setSelectedBoxIndex(null);
        }
      }
    },
    [
      selectedBoxIndex,
      showClassMenu,
      showBoxMenu,
      handleDeleteBox,
      handleCloseMenu,
    ]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div
      ref={canvasRef}
      className={`absolute inset-0 z-10 ${
        isDrawing ? "cursor-crosshair" : "cursor-default"
      } ${className}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <DrawingGuides
        mousePosition={mousePosition}
        selectedClass={selectedClass}
        color={selectedClass ? classColors[selectedClass] : undefined}
        isHidden={hideGuides || isHoveringBox || selectedBoxIndex !== null}
      />

      {/* Existing Boxes */}
      {boxes.map((box, index) => (
        <BoundingBox
          key={index}
          start={{ x: box.x, y: box.y }}
          end={{ x: box.x + box.width, y: box.y + box.height }}
          label={box.class}
          color={box.color}
          isSelected={index === selectedBoxIndex}
          onHover={handleBoxHover}
          onClick={() => handleBoxClick(index)}
          onMoveStart={handleMoveStart}
          onResizeStart={handleResizeStart}
          onMenuOpen={() => handleMenuOpen(index)}
        />
      ))}

      {/* Current Box Being Drawn */}
      {currentBox && (
        <BoundingBox
          start={{ x: currentBox.x, y: currentBox.y }}
          end={{
            x: currentBox.x + currentBox.width,
            y: currentBox.y + currentBox.height,
          }}
          label={currentBox.class}
          color={currentBox.color}
          isSelected={false}
          onHover={undefined}
          onClick={undefined}
          onResizeStart={undefined}
          onMoveStart={undefined}
          onMenuOpen={undefined}
        />
      )}

      {/* Pending Box (when no class is selected) */}
      {pendingBox && !currentBox && (
        <BoundingBox
          start={{ x: pendingBox.x, y: pendingBox.y }}
          end={{
            x: pendingBox.x + pendingBox.width,
            y: pendingBox.y + pendingBox.height,
          }}
          label={pendingBox.class}
          color={pendingBox.color}
          isSelected={false}
          onHover={undefined}
          onClick={undefined}
          onResizeStart={undefined}
          onMoveStart={undefined}
          onMenuOpen={undefined}
        />
      )}

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
              className="text-gray-500 hover:text-gray-300 text-xs cursor-pointer"
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
      {showBoxMenu && selectedBoxIndex !== null && (
        <div
          className="fixed z-20 bg-gray-900/90 backdrop-blur-md rounded-lg shadow-lg p-2 min-w-[150px] box-actions-menu"
          style={{
            left: menuPosition.x,
            top: menuPosition.y,
            transform: "none", // Remove the transform that was positioning relative to cursor
          }}
        >
          <div className="flex justify-between items-center mb-2 px-2">
            <div className="text-xs text-gray-400">Box Actions:</div>
            <button
              onClick={() => setShowBoxMenu(false)}
              className="text-gray-500 hover:text-gray-300 text-xs cursor-pointer"
            >
              ×
            </button>
          </div>
          <div className="flex flex-col gap-1">
            <button
              className="text-left px-3 py-1.5 rounded-md text-xs font-semibold hover:bg-gray-800 transition-colors flex items-center gap-2 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteBox();
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 6h18"></path>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
              Delete Box
            </button>
            <div className="px-2 py-1 text-xs text-gray-400">Change Class:</div>
            {availableClasses.map((cls) => (
              <button
                key={cls}
                className="text-left px-3 py-1.5 rounded-md text-xs text-gray-200 hover:bg-gray-800 transition-colors"
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
