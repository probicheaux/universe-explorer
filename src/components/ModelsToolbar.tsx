import React from "react";

interface ModelsToolbarProps {
  // We'll add more props as we get real data
  onModelSelect?: (modelId: string) => void;
}

export default function ModelsToolbar({ onModelSelect }: ModelsToolbarProps) {
  // Placeholder data - will be replaced with real data later
  const models = [
    { id: "model1", name: "Object Detection Model 1", confidence: 0.92 },
    { id: "model2", name: "Object Detection Model 2", confidence: 0.87 },
    { id: "model3", name: "Object Detection Model 3", confidence: 0.95 },
  ];

  return (
    <div className="w-64 h-full bg-gray-900/80 backdrop-blur-md rounded-l-lg p-4 border border-gray-800 shadow-lg">
      {/* Models Section */}
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-400 mb-2">
          Available Models
        </h3>
        <div className="space-y-2">
          {models.map((model) => (
            <div
              key={model.id}
              onClick={() => onModelSelect?.(model.id)}
              className="group flex flex-col gap-1 p-3 bg-gray-800/50 rounded-md border border-gray-700 hover:bg-gray-700/50 transition-all cursor-pointer"
            >
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-200">{model.name}</span>
                <div className="px-1.5 py-0.5 bg-gray-900/50 rounded text-xs text-gray-400">
                  ID: {model.id}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${model.confidence * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400">
                  {(model.confidence * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div>
        <h3 className="text-sm font-medium text-gray-400 mb-2">Instructions</h3>
        <div className="bg-gray-800/50 p-3 rounded-md text-gray-300 text-xs leading-relaxed">
          <p className="mb-2">Select a model to view its detection results:</p>
          <ol className="list-decimal list-inside space-y-1.5 text-gray-400">
            <li>Choose a model from the list above</li>
            <li>View confidence scores and model details</li>
            <li>Compare results between different models</li>
            <li>Use the confidence bar to assess model performance</li>
          </ol>
        </div>
      </div>

      {/* Status Section */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span>Models ready for inference</span>
        </div>
      </div>
    </div>
  );
}
