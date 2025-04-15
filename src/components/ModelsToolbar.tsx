import React, { useMemo } from "react";
import { ModelInfo } from "@/utils/api/inference";

interface ModelsToolbarProps {
  models: ModelInfo[];
  results: Record<string, any>;
  onModelSelect?: (modelId: string) => void;
  isLoading?: boolean;
}

// Memoize the individual model card to prevent unnecessary re-renders
const ModelCard = React.memo(
  ({
    model,
    result,
    onSelect,
  }: {
    model: ModelInfo;
    result: any;
    onSelect: (modelId: string) => void;
  }) => {
    const hasError = result?.error;
    const isComplete = result && !hasError;

    return (
      <div
        key={model.id}
        className="group flex flex-col gap-1 p-3 bg-gray-800/50 rounded-md border border-gray-700 hover:bg-gray-700/50 transition-all cursor-pointer"
        onClick={() => onSelect(model.id)}
      >
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-200">{model.name}</span>
          <div className="flex items-center gap-2">
            {hasError ? (
              <span className="text-xs text-red-400">Failed</span>
            ) : isComplete ? (
              <span className="text-xs text-green-400">Complete</span>
            ) : (
              <div className="animate-pulse">
                <span className="text-xs text-gray-400">Processing...</span>
              </div>
            )}
          </div>
        </div>
        <div className="text-xs text-gray-500 truncate">
          {model.description}
        </div>
        {isComplete && result.predictions && (
          <div className="flex items-center gap-2 mt-1">
            <div className="text-xs text-gray-400">
              {result.predictions.length} detection
              {result.predictions.length !== 1 ? "s" : ""}
            </div>
            <div className="text-xs text-gray-400">
              {(result.time * 1000).toFixed(0)}ms
            </div>
          </div>
        )}
      </div>
    );
  }
);

ModelCard.displayName = "ModelCard";

function ModelsToolbar({
  models = [],
  results = {},
  onModelSelect,
  isLoading = false,
}: ModelsToolbarProps) {
  // Memoize the model cards list to prevent unnecessary recalculation
  const modelCards = useMemo(() => {
    return models.map((model) => (
      <ModelCard
        key={model.id}
        model={model}
        result={results[model.id]}
        onSelect={onModelSelect || (() => {})}
      />
    ));
  }, [models, results, onModelSelect]);

  return (
    <div className="w-full h-full bg-gray-900/80 backdrop-blur-md rounded-l-lg p-4 border border-gray-800 shadow-lg">
      <h2 className="text-sm font-medium text-gray-400 mb-4">
        Available Models
      </h2>
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-2">
          {isLoading && models.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400"></div>
            </div>
          ) : (
            modelCards
          )}
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span>Models ready for inference</span>
        </div>
      </div>
    </div>
  );
}

// Memoize the entire toolbar component
export default React.memo(ModelsToolbar);
