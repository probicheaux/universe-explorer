import React from "react";

export type TabType = "find" | "results";

export interface TabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onMouseEnterTabButton?: () => void;
  onMouseLeaveTabButton?: () => void;
}

export default function Tabs({
  activeTab,
  onTabChange,
  onMouseEnterTabButton,
  onMouseLeaveTabButton,
}: TabsProps) {
  return (
    <div className="absolute z-20 top-0 left-1/2 transform -translate-x-1/2 flex space-x-2 bg-gray-900/80 backdrop-blur-sm rounded-b-lg p-1 shadow-lg">
      <button
        onClick={() => onTabChange("find")}
        className={`px-4 py-1 text-sm rounded-md transition-all duration-200 *:${
          activeTab === "find"
            ? " bg-gray-800 font-semibold shadow-lg shadow-blue-400/50 text-white"
            : "text-gray-300 hover:bg-gray-800 cursor-pointer"
        }`}
        onMouseEnter={onMouseEnterTabButton}
        onMouseLeave={onMouseLeaveTabButton}
      >
        Find
      </button>
      <button
        onClick={() => onTabChange("results")}
        className={`px-4 py-1 text-sm rounded-md transition-all duration-200 *:${
          activeTab === "results"
            ? " bg-gray-800 font-semibold shadow-lg shadow-blue-400/50 text-white"
            : "text-gray-300 hover:bg-gray-800 cursor-pointer"
        }`}
        onMouseEnter={onMouseEnterTabButton}
        onMouseLeave={onMouseLeaveTabButton}
      >
        Results
      </button>
    </div>
  );
}
