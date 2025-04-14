import { useState } from "react";

interface AnnotationToolbarProps {
  taskType?: string;
  classes?: string[];
  onClassesChange?: (classes: string[]) => void;
  selectedClass?: string;
  onClassSelect?: (className: string) => void;
  classColors?: Record<string, string>;
}

export default function AnnotationToolbar({
  taskType = "Object Detection",
  classes = ["person", "car", "truck"],
  onClassesChange,
  selectedClass = "",
  onClassSelect,
  classColors = {},
}: AnnotationToolbarProps) {
  const [newClass, setNewClass] = useState("");
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddClass = () => {
    const trimmedClass = newClass.trim();
    if (trimmedClass && onClassesChange) {
      // Check for duplicates (case-insensitive)
      if (classes.some((c) => c.toLowerCase() === trimmedClass.toLowerCase())) {
        setError("This class already exists");
        return;
      }
      setError(null);
      onClassesChange([...classes, trimmedClass]);
      setNewClass("");
      setIsAddingClass(false);
    }
  };

  const handleNewClassChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewClass(e.target.value);
    setError(null); // Clear error when user types
  };

  const handleCancel = () => {
    setNewClass("");
    setError(null);
    setIsAddingClass(false);
  };

  const handleRemoveClass = (classToRemove: string) => {
    if (onClassesChange) {
      onClassesChange(classes.filter((c) => c !== classToRemove));
      if (selectedClass === classToRemove && onClassSelect) {
        onClassSelect("");
      }
    }
  };

  const handleClassClick = (className: string) => {
    if (onClassSelect) {
      onClassSelect(className === selectedClass ? "" : className);
    }
  };

  return (
    <div className="w-64 h-full bg-gray-900/80 backdrop-blur-md rounded-l-lg p-4 border border-gray-800 shadow-lg">
      {/* Task Type */}
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-400 mb-1">Task</h3>
        <div className="bg-gray-800/50 px-3 py-1.5 rounded-md text-gray-200 text-sm">
          {taskType}
        </div>
      </div>

      {/* Classes */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium text-gray-400">Classes</h3>
          <button
            onClick={() => setIsAddingClass(true)}
            className="text-xs text-gray-400 hover:text-gray-300 transition-colors"
          >
            + Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mb-2">
          {classes.map((cls) => {
            const color = classColors[cls] || "#666666";
            const isSelected = cls === selectedClass;

            return (
              <div
                key={cls}
                className={`group flex items-center px-2 py-1 rounded-md text-xs cursor-pointer transition-all ${
                  isSelected
                    ? "text-white"
                    : "text-gray-200 hover:bg-gray-700/50"
                }`}
                style={{
                  backgroundColor: isSelected ? color : "rgba(31, 41, 55, 0.5)",
                  borderLeft: `3px solid ${color}`,
                }}
                onClick={() => handleClassClick(cls)}
              >
                <span>{cls}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveClass(cls);
                  }}
                  className={`ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity ${
                    isSelected
                      ? "text-white"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
        {isAddingClass && (
          <div className="p-3 bg-gray-800/50 rounded-md border border-gray-700">
            <input
              type="text"
              value={newClass}
              onChange={handleNewClassChange}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleAddClass();
                } else if (e.key === "Escape") {
                  handleCancel();
                }
              }}
              placeholder="New class name"
              className="w-full bg-gray-900/50 border border-gray-700 rounded-md px-2 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-600"
              autoFocus
            />
            {error && (
              <div className="mt-1.5 text-xs text-red-400">{error}</div>
            )}
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={handleCancel}
                className="text-gray-500 hover:text-gray-400 text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddClass}
                className="bg-gray-700 hover:bg-gray-600 text-gray-200 px-2 py-1 rounded-md text-xs transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div>
        <h3 className="text-sm font-medium text-gray-400 mb-2">Instructions</h3>
        <div className="bg-gray-800/50 p-3 rounded-md text-gray-300 text-xs leading-relaxed">
          <p className="mb-2">
            Draw bounding boxes around objects you want to detect:
          </p>
          <ol className="list-decimal list-inside space-y-1.5 text-gray-400">
            <li>
              Select a class from the list above (or draw first, then select)
            </li>
            <li>Click and drag to create a box</li>
            <li>
              Use the three dots menu to:
              <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                <li>Delete a box</li>
                <li>Change its class</li>
                <li>Move or resize it</li>
              </ul>
            </li>
            <li>
              Press{" "}
              <kbd className="px-1.5 py-0.5 bg-gray-900 rounded border border-gray-700">
                ⌘Z
              </kbd>{" "}
              to undo your last action
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
