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
  color?: string;
}

interface BoundingBoxCanvasProps {
  selectedClass: string;
  onBoxesChange?: (boxes: BoundingBoxData[]) => void;
  availableClasses?: string[];
  onClassSelect?: (className: string) => void;
  classColors?: Record<string, string>;
}

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
  const [showBoxMenu, setShowBoxMenu] = useState(false);

  // New state for move and resize operations
  const [isMoving, setIsMoving] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [moveStartPosition, setMoveStartPosition] = useState<Point | null>(
    null
  );
  const [originalBox, setOriginalBox] = useState<BoundingBoxData | null>(null);

  // Undo history state
  const [history, setHistory] = useState<BoundingBoxData[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Use a ref to track the current mouse position during drawing
  const currentMousePositionRef = useRef<Point>({ x: 0, y: 0 });

  // Use a ref to track if we're currently in a drawing operation
  const isDrawingRef = useRef(false);

  // Use a ref to track the current box being drawn
  const currentBoxRef = useRef<BoundingBoxData | null>(null);

  // Initialize history with empty boxes array
  useEffect(() => {
    setHistory([[]]);
    setHistoryIndex(0);
  }, []);

  // Update box colors when classColors change
  useEffect(() => {
    if (boxes.length > 0) {
      const updatedBoxes = boxes.map((box) => {
        // Only update color if the class exists in classColors
        if (classColors[box.label]) {
          return {
            ...box,
            color: classColors[box.label],
          };
        }
        return box;
      });

      // Only update if there are actual changes
      if (JSON.stringify(updatedBoxes) !== JSON.stringify(boxes)) {
        setBoxes(updatedBoxes);
        onBoxesChange?.(updatedBoxes);
        addToHistory(updatedBoxes);
      }
    }
  }, [classColors]);

  // Function to add a new state to history
  const addToHistory = (newBoxes: BoundingBoxData[]) => {
    // Remove any future states if we're not at the end of history
    const newHistory = history.slice(0, historyIndex + 1);
    // Add the new state
    newHistory.push([...newBoxes]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Function to undo the last action
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const previousBoxes = history[newIndex];
      setBoxes(previousBoxes);
      onBoxesChange?.(previousBoxes);
    }
  };

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
        start,
        end: start,
        label: selectedClass,
        color: classColors[selectedClass],
      };
      currentBoxRef.current = newBox;
      setCurrentBox(newBox);
    } else {
      // Otherwise, create a temporary box with a placeholder label
      const newBox = { start, end: start, label: "Select class..." };
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
      const updatedBox = {
        ...currentBoxRef.current,
        end: position,
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
        start: {
          x: originalBox.start.x + dx,
          y: originalBox.start.y + dy,
        },
        end: {
          x: originalBox.end.x + dx,
          y: originalBox.end.y + dy,
        },
      };

      const newBoxes = [...boxes];
      newBoxes[selectedBoxIndex] = updatedBox;
      setBoxes(newBoxes);
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
          updatedBox.start = { x: position.x, y: position.y };
          break;
        case "ne":
          updatedBox.start = { x: originalBox.start.x, y: position.y };
          updatedBox.end = { x: position.x, y: originalBox.end.y };
          break;
        case "sw":
          updatedBox.start = { x: position.x, y: originalBox.start.y };
          updatedBox.end = { x: originalBox.end.x, y: position.y };
          break;
        case "se":
          updatedBox.end = { x: position.x, y: position.y };
          break;
      }

      // Ensure the box has a minimum size
      const minSize = 10;
      const width = Math.abs(updatedBox.end.x - updatedBox.start.x);
      const height = Math.abs(updatedBox.end.y - updatedBox.start.y);

      if (width < minSize || height < minSize) {
        return; // Don't update if the box would be too small
      }

      const newBoxes = [...boxes];
      newBoxes[selectedBoxIndex] = updatedBox;
      setBoxes(newBoxes);
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
        Math.abs(currentBoxRef.current.end.x - currentBoxRef.current.start.x) >
          5 &&
        Math.abs(currentBoxRef.current.end.y - currentBoxRef.current.start.y) >
          5
      ) {
        // If we have a selected class, add the box directly
        if (selectedClass) {
          const newBoxes = [...boxes, currentBoxRef.current];
          setBoxes(newBoxes);
          onBoxesChange?.(newBoxes);
          // Add to history
          addToHistory(newBoxes);
        } else {
          // Otherwise, show the class selection menu
          setPendingBox(currentBoxRef.current);

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
      // Add to history after move is complete
      addToHistory(boxes);
    }

    // End resize operation
    if (isResizing) {
      setIsResizing(false);
      setResizeHandle(null);
      setOriginalBox(null);
      // Add to history after resize is complete
      addToHistory(boxes);
    }
  };

  const handleClassSelect = (className: string) => {
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
      // Add to history
      addToHistory(newBoxes);

      // Select the class for future boxes
      onClassSelect(className);
    }

    setShowClassMenu(false);
    setPendingBox(null);
  };

  const handleCloseMenu = () => {
    setShowClassMenu(false);
    setPendingBox(null);
  };

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
      const left = Math.min(box.start.x, box.end.x);
      const top = Math.min(box.start.y, box.end.y);
      const width = Math.abs(box.end.x - box.start.x);

      // Position menu to the right of the box
      setMenuPosition({
        x: left + width + 10,
        y: top,
      });
    }
  };

  const handleDeleteBox = () => {
    console.log("Delete box clicked, selectedBoxIndex:", selectedBoxIndex);
    if (selectedBoxIndex !== null) {
      console.log("Deleting box at index:", selectedBoxIndex);
      const newBoxes = boxes.filter((_, i) => i !== selectedBoxIndex);
      console.log("New boxes array:", newBoxes);
      setBoxes(newBoxes);
      onBoxesChange?.(newBoxes);
      // Add to history
      addToHistory(newBoxes);
      setSelectedBoxIndex(null);
      setShowBoxMenu(false);
    }
  };

  const handleChangeClass = (className: string) => {
    if (selectedBoxIndex !== null) {
      const newBoxes = [...boxes];
      newBoxes[selectedBoxIndex] = {
        ...newBoxes[selectedBoxIndex],
        label: className,
        color: classColors[className],
      };
      setBoxes(newBoxes);
      onBoxesChange?.(newBoxes);
      // Add to history
      addToHistory(newBoxes);
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

  const handleKeyDown = (e: KeyboardEvent) => {
    // Handle undo with Cmd/Ctrl + Z
    if ((e.metaKey || e.ctrlKey) && e.key === "z") {
      e.preventDefault();
      handleUndo();
    }
    // Handle delete key
    else if (e.key === "Delete" && selectedBoxIndex !== null) {
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
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedBoxIndex, showClassMenu, showBoxMenu, historyIndex, history]);

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
      <DrawingGuides
        mousePosition={mousePosition}
        selectedClass={selectedClass}
        color={selectedClass ? classColors[selectedClass] : undefined}
        isHidden={isHoveringBox || selectedBoxIndex !== null}
      />

      {/* Existing Boxes */}
      {boxes.map((box, index) => (
        <BoundingBox
          key={index}
          start={box.start}
          end={box.end}
          label={box.label}
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
          start={currentBox.start}
          end={currentBox.end}
          label={currentBox.label}
          color={currentBox.color}
        />
      )}

      {/* Pending Box (when no class is selected) */}
      {pendingBox && !currentBox && (
        <BoundingBox
          start={pendingBox.start}
          end={pendingBox.end}
          label={pendingBox.label}
          color={pendingBox.color}
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
                className="text-left px-3 py-1.5 rounded-md text-sm hover:bg-gray-800 transition-colors cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  handleChangeClass(cls);
                }}
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
