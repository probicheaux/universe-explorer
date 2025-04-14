import { useState } from "react";

interface AnnotationToolbarProps {
  taskType?: string;
  classes?: string[];
  onClassesChange?: (classes: string[]) => void;
  selectedClass?: string;
  onClassSelect?: (className: string) => void;
}

export default function AnnotationToolbar({
  taskType = "Object Detection",
  classes = ["person", "car", "truck"],
  onClassesChange,
  selectedClass = "",
  onClassSelect,
}: AnnotationToolbarProps) {
  const [newClass, setNewClass] = useState("");
  const [isAddingClass, setIsAddingClass] = useState(false);

  const handleAddClass = () => {
    if (newClass.trim() && onClassesChange) {
      onClassesChange([...classes, newClass.trim()]);
      setNewClass("");
      setIsAddingClass(false);
    }
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
        <h3 className="text-sm font-medium text-gray-400 mb-1">Task Type</h3>
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
          {classes.map((cls) => (
            <div
              key={cls}
              className={`group flex items-center px-2 py-1 rounded-md text-xs cursor-pointer transition-all ${
                cls === selectedClass
                  ? "bg-blue-500 text-white"
                  : "bg-gray-800/50 text-gray-200 hover:bg-gray-700/50"
              }`}
              onClick={() => handleClassClick(cls)}
            >
              <span>{cls}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveClass(cls);
                }}
                className={`ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity ${
                  cls === selectedClass
                    ? "text-white"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        {isAddingClass && (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newClass}
              onChange={(e) => setNewClass(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddClass()}
              placeholder="New class name"
              className="flex-1 bg-gray-800/50 border border-gray-700 rounded-md px-2 py-1 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-600"
              autoFocus
            />
            <button
              onClick={handleAddClass}
              className="bg-gray-700 hover:bg-gray-600 text-gray-200 px-2 py-1 rounded-md text-xs transition-colors"
            >
              Add
            </button>
            <button
              onClick={() => setIsAddingClass(false)}
              className="text-gray-500 hover:text-gray-400 text-xs transition-colors"
            >
              Cancel
            </button>
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
          <ol className="list-decimal list-inside space-y-1 text-gray-400">
            <li>Select a class from the list above</li>
            <li>Click and drag to create a box</li>
            <li>
              Press{" "}
              <kbd className="px-1.5 py-0.5 bg-gray-900 rounded border border-gray-700">
                Delete
              </kbd>{" "}
              to remove the last box
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
