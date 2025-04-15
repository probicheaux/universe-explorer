import { InferImageResponse } from "@/adapters/roboflowAdapter";

export type ModelInfo = {
  id: string;
  url: string;
  version: string;
  name: string;
  description: string;
};

export type InferenceEventCallbacks = {
  onModels?: (models: ModelInfo[]) => void;
  onInference?: (modelId: string, result: InferImageResponse) => void;
  onError?: (modelId: string, error: string) => void;
  onComplete?: () => void;
};

export const inferImage = (
  base64Image: string,
  callbacks: InferenceEventCallbacks
): (() => void) => {
  const base64Data = base64Image.includes(",")
    ? base64Image.split(",")[1]
    : base64Image;

  // Create POST request with the image data
  const body = JSON.stringify({ image: base64Data });
  const url = `/api/infer?body=${encodeURIComponent(body)}`;

  // Create EventSource for streaming
  const eventSource = new EventSource(url);

  // Handle different event types
  eventSource.addEventListener("models", ((event: MessageEvent) => {
    const { models } = JSON.parse(event.data);
    callbacks.onModels?.(models);
  }) as EventListener);

  eventSource.addEventListener("inference", ((event: MessageEvent) => {
    const { modelId, result } = JSON.parse(event.data);
    callbacks.onInference?.(modelId, result);
  }) as EventListener);

  eventSource.addEventListener("error", ((event: MessageEvent) => {
    if (event.data) {
      const { modelId, error } = JSON.parse(event.data);
      callbacks.onError?.(modelId, error);
    } else {
      // Handle connection errors
      console.error("EventSource failed:", event);
      eventSource.close();
    }
  }) as EventListener);

  eventSource.addEventListener("complete", ((event: MessageEvent) => {
    callbacks.onComplete?.();
    eventSource.close();
  }) as EventListener);

  // Return cleanup function
  return () => {
    eventSource.close();
  };
};
