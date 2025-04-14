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
    <div className="w-full h-full bg-gray-900 text-white p-4 flex flex-col">
      <h2 className="text-xl font-bold mb-4">Models</h2>
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-2">
          {models.map((model) => (
            <div
              key={model.id}
              className="p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
              onClick={() => onModelSelect?.(model.id)}
            >
              <div className="flex justify-between items-center">
                <span className="font-medium">{model.name}</span>
                <span className="text-sm bg-green-600 text-white px-2 py-1 rounded">
                  {(model.confidence * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-700">
        <p className="text-sm text-gray-400">
          Select a model to view its detection results
        </p>
      </div>
    </div>
  );
}
