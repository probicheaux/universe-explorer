import React from "react";

interface LoadingIndicatorProps {
  isLoading: boolean;
  progress: number;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  isLoading,
  progress,
}) => {
  if (!isLoading) return null;

  return (
    <div className="absolute top-0 left-1/3 transform -translate-x-1/2 z-50 bg-gray-900/80 backdrop-blur-sm rounded-b-lg shadow-sm px-3 py-1.5 flex items-center gap-2 text-xs text-gray-300">
      <div className="animate-spin h-3 w-3 border-2 border-blue-500 border-t-transparent rounded-full"></div>
      <span>
        Running inference
        {progress > 0
          ? `: ${progress} model${progress == 1 ? "" : "s"} evaluated`
          : ""}
      </span>
    </div>
  );
};

export default LoadingIndicator;
