import React, { useMemo, useEffect, useCallback } from "react";
import { ModelInfo } from "@/utils/api/inference";
import { calculateBoxOverlap } from "@/utils/boxOverlap";
import { InferImageResponse } from "@/adapters/roboflowAdapter";
import { FixedSizeList as List } from "react-window";

interface ModelsToolbarProps {
  models: ModelInfo[];
  results: Record<string, InferImageResponse>;
  onModelSelect?: (modelId: string) => void;
  isLoading?: boolean;
  drawnBoxes: any[];
  imageDimensions?: {
    width: number;
    height: number;
    x: number;
    y: number;
  };
  scale: { x: number; y: number };
  offset: { x: number; y: number };
  selectedModel?: string | undefined;
  autoSelectFirstModel?: boolean;
  classes: string[];
}

function calculateModelMatch(
  model: ModelInfo,
  result: InferImageResponse,
  drawnBoxes: any[],
  scale: { x: number; y: number },
  offset: { x: number; y: number },
  classes: string[]
) {
  // Base score from bounding boxes overlap (0-100)
  const boxOverlap = calculateBoxOverlap(drawnBoxes, result, scale, offset);

  // If no search classes provided or no metadata score available, just return the box overlap
  if (!classes.length || !model.metadataScore) {
    console.log(
      "no search classes or metadata score, returning only box overlap for match",
      boxOverlap
    );
    return boxOverlap;
  }

  // Use the pre-calculated metadata score from the backend
  // Weight: 70% box overlap, 30% metadata match
  const combinedScore = boxOverlap * 0.7 + model.metadataScore * 0.3;

  return combinedScore;
}

// Memoize the individual model card to prevent unnecessary re-renders
const ModelCard = React.memo(
  ({
    model,
    result,
    onSelect,
    match,
    isSelected,
    isBestMatch,
  }: {
    model: ModelInfo;
    result: InferImageResponse | undefined;
    onSelect: (modelId: string) => void;
    match: number;
    isSelected?: boolean;
    isBestMatch?: boolean;
  }) => {
    const hasError = result?.error;
    const isComplete = result && !hasError;

    const handleClick = useCallback(() => {
      onSelect(model.id);
    }, [model.id, onSelect]);

    // Format numbers for display
    const formatNumber = (num: number) => {
      if (num >= 1000) {
        return (num / 1000).toFixed(1) + "k";
      }
      return num.toString();
    };

    // Get top classes (up to 3)
    const topClasses = useMemo(() => {
      if (!model.classCounts || model.classCounts.length === 0) return [];
      return [...model.classCounts]
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);
    }, [model.classCounts]);

    return (
      <div
        className={`group h-[220px] flex flex-col rounded-md border transition-all cursor-pointer overflow-visible relative ${
          isSelected
            ? "bg-blue-900/30 border-blue-500/50 shadow-lg shadow-blue-500/20"
            : "bg-gray-800/50 border-gray-700 hover:bg-gray-700/50"
        }`}
        onClick={handleClick}
      >
        {isBestMatch && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-purple-900/80 text-purple-400 text-[10px] font-medium whitespace-nowrap shadow-lg">
            Best match
          </div>
        )}
        <div className="flex flex-col gap-2 p-3 h-full overflow-visible">
          {/* Header with model name and status */}
          <div className="flex justify-between items-center">
            <span
              className={`text-sm font-medium truncate flex-1 mr-2 ${
                isSelected ? "text-blue-200" : "text-gray-200"
              }`}
            >
              {model.name}
            </span>
            <div className="flex items-center gap-2 flex-shrink-0">
              {hasError ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : isComplete ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-4 w-4 ${
                    isSelected ? "text-blue-400" : "text-green-400"
                  }`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <div className="animate-spin">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-4 w-4 ${
                      isSelected ? "text-blue-400" : "text-gray-400"
                    }`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Model description */}
          {model.description && (
            <div className="text-xs text-gray-400 line-clamp-2">
              {model.description}
            </div>
          )}

          {/* Model type badge */}
          <div className="flex items-center gap-2 flex-wrap">
            {model.bestModelScore && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-purple-900/50 text-purple-400">
                mAP@50: {model.bestModelScore.toFixed(1)}%
              </span>
            )}
          </div>

          {/* Top classes */}
          {topClasses.length > 0 && (
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap gap-1 max-h-[24px] overflow-hidden">
                {topClasses.map((cls, index) => (
                  <span
                    key={index}
                    className="text-xs px-1.5 py-0.5 rounded bg-gray-700/50 text-gray-300 whitespace-nowrap"
                  >
                    {cls.name} ({formatNumber(cls.count)})
                  </span>
                ))}
              </div>
              {model.classCounts && model.classCounts.length > 3 && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-gray-700/50 text-gray-300 whitespace-nowrap w-fit">
                  +{model.classCounts.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Model stats */}
          <div className="flex flex-wrap items-center gap-2 mt-1 text-[10px] text-gray-400">
            {model.universeStats && (
              <>
                <div className="flex items-center gap-1 whitespace-nowrap">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path
                      fillRule="evenodd"
                      d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {formatNumber(model.universeStats.totals.views)}
                </div>
                <div className="flex items-center gap-1 whitespace-nowrap">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {formatNumber(model.universeStats.totals.downloads)}
                </div>
              </>
            )}
            {model.universe?.stars !== undefined && (
              <div className="flex items-center gap-1 whitespace-nowrap">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3 w-3"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {formatNumber(model.universe.stars)}
              </div>
            )}
            {model.images && (
              <div className="flex items-center gap-1 whitespace-nowrap">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3 w-3"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                    clipRule="evenodd"
                  />
                </svg>
                {formatNumber(model.images)}
              </div>
            )}
          </div>

          {/* Results info */}
          {isComplete && result.predictions && (
            <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-gray-700">
              <div className="flex items-center gap-2">
                <div className="text-xs text-gray-400 whitespace-nowrap">
                  {result.predictions.length} detection
                  {result.predictions.length !== 1 ? "s" : ""}
                </div>
                <div className="text-xs text-gray-400 whitespace-nowrap">
                  {(result.time * 1000).toFixed(0)}ms
                </div>
              </div>
              <div className="text-xs font-medium px-2 py-0.5 rounded bg-blue-900/50 text-blue-400 whitespace-nowrap w-fit">
                {match.toFixed(1)}% match
              </div>
            </div>
          )}
        </div>
      </div>
    );
  },
  // Custom comparison function to prevent unnecessary re-renders
  (prevProps, nextProps) => {
    // Only re-render if these specific props change
    return (
      prevProps.model.id === nextProps.model.id &&
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.isBestMatch === nextProps.isBestMatch &&
      prevProps.match === nextProps.match &&
      // Check if the result has changed
      (prevProps.result === nextProps.result ||
        (prevProps.result?.error === nextProps.result?.error &&
          prevProps.result?.predictions?.length ===
            nextProps.result?.predictions?.length &&
          prevProps.result?.time === nextProps.result?.time))
    );
  }
);

ModelCard.displayName = "ModelCard";

// Create a memoized row component that only depends on the specific model data
const ModelRow = React.memo(
  ({
    model,
    result,
    match,
    isSelected,
    isBestMatch,
    onSelect,
    style,
  }: {
    model: ModelInfo;
    result: InferImageResponse | undefined;
    match: number;
    isSelected: boolean;
    isBestMatch: boolean;
    onSelect: (modelId: string) => void;
    style: React.CSSProperties;
  }) => {
    return (
      <div style={{ ...style, paddingBottom: "12px", paddingTop: "12px" }}>
        <ModelCard
          model={model}
          result={result}
          onSelect={onSelect}
          match={match}
          isSelected={isSelected}
          isBestMatch={isBestMatch}
        />
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Only re-render if these specific props change
    return (
      prevProps.model.id === nextProps.model.id &&
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.isBestMatch === nextProps.isBestMatch &&
      prevProps.match === nextProps.match &&
      // Check if the result has changed
      (prevProps.result === nextProps.result ||
        (prevProps.result?.error === nextProps.result?.error &&
          prevProps.result?.predictions?.length ===
            nextProps.result?.predictions?.length &&
          prevProps.result?.time === nextProps.result?.time))
    );
  }
);

ModelRow.displayName = "ModelRow";

function ModelsToolbar({
  models = [],
  results = {},
  onModelSelect,
  isLoading = false,
  drawnBoxes = [],
  imageDimensions,
  scale,
  offset,
  selectedModel,
  autoSelectFirstModel = false,
  classes,
}: ModelsToolbarProps) {
  // Memoize the match calculations for each model
  const modelMatches = useMemo(() => {
    if (!imageDimensions) return {};

    const matches: Record<string, number> = {};

    models.forEach((model) => {
      const result = results[model.id];
      if (result && !result.error) {
        matches[model.id] = calculateModelMatch(
          model,
          result,
          drawnBoxes,
          scale,
          offset,
          classes
        );
      }
    });

    return matches;
  }, [models, results, drawnBoxes, imageDimensions, scale, offset, classes]);

  // Filter out models with errors and calculate match percentages
  const sortedModels = useMemo(() => {
    if (!imageDimensions) return models;

    // Filter out models with errors
    const validModels = models.filter((model) => {
      const result = results[model.id];
      return result && !result.error;
    });

    return [...validModels].sort((a, b) => {
      const matchA = modelMatches[a.id] || 0;
      const matchB = modelMatches[b.id] || 0;
      return matchB - matchA; // Sort in descending order
    });
  }, [models, results, imageDimensions, modelMatches]);

  // Select the first model by default when no model is selected
  useEffect(() => {
    if (sortedModels.length > 0 && autoSelectFirstModel && onModelSelect) {
      onModelSelect(sortedModels[0].id);
    }
  }, [sortedModels, autoSelectFirstModel, onModelSelect]);

  // Create a row renderer that uses the memoized row component
  const Row = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const model = sortedModels[index];
      const modelResult = results[model.id];
      const isSelected = selectedModel === model.id;
      const isBestMatch = index === 0;
      const match = modelMatches[model.id] || 0;

      return (
        <ModelRow
          model={model}
          result={modelResult}
          match={match}
          isSelected={isSelected}
          isBestMatch={isBestMatch}
          onSelect={onModelSelect || (() => {})}
          style={style}
        />
      );
    },
    [sortedModels, results, onModelSelect, modelMatches, selectedModel]
  );

  return (
    <div className="w-full h-full bg-gray-900/80 backdrop-blur-md rounded-l-lg p-4 border border-gray-800 shadow-lg flex flex-col">
      <h2 className="text-sm font-medium text-gray-400 mb-4">
        Available Models
      </h2>
      <div className="flex-1 overflow-hidden">
        {isLoading && models.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400"></div>
          </div>
        ) : (
          <List
            height={window.innerHeight - 200}
            width="100%"
            itemCount={sortedModels.length}
            itemSize={232}
            className="[&::-webkit-scrollbar]:hidden [&::-webkit-scrollbar]:w-0 [&::-webkit-scrollbar]:h-0"
          >
            {Row}
          </List>
        )}
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
