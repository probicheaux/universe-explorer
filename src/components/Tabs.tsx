import React from "react";

export type TabType = "find" | "results";

interface TabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export default function Tabs({ activeTab, onTabChange }: TabsProps) {
  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 flex space-x-2 bg-gray-900/80 backdrop-blur-sm rounded-lg p-1 shadow-lg">
      <button
        onClick={() => onTabChange("find")}
        className={`px-4 py-2 rounded-md transition-all duration-200 ${
          activeTab === "find"
            ? "bg-purple-600 text-white"
            : "text-gray-300 hover:bg-gray-800"
        }`}
      >
        Find
      </button>
      <button
        onClick={() => onTabChange("results")}
        className={`px-4 py-2 rounded-md transition-all duration-200 ${
          activeTab === "results"
            ? "bg-blue-600 text-white"
            : "text-gray-300 hover:bg-gray-800"
        }`}
      >
        Results
      </button>
    </div>
  );
}
