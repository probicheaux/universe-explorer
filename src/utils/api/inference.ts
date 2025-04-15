import { InferImageResponse } from "@/adapters/roboflowAdapter";

export interface ModelInfo {
  id: string;
  name: string;
  description?: string;
  type?: string;
  bestModelScore?: number;
  classCounts?: Array<{
    name: string;
    count: number;
  }>;
  images?: number;
  universeStats?: {
    totals: {
      downloads: number;
      views: number;
    };
    last30DaysTotals: {
      downloads: number;
      views: number;
    };
  };
  universe?: {
    stars: number;
  };
  icon?: string;
  annotation?: string;
  url?: string;
  version?: number;
}

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

  // Create AbortController for cleanup
  const controller = new AbortController();
  const { signal } = controller;

  // Use fetch with streaming
  fetch("/api/infer", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body,
    signal,
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get the reader from the response body stream
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Response body is not readable");
      }

      // Create a text decoder to decode the stream
      const decoder = new TextDecoder();
      let buffer = "";

      // Process the stream
      const processStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              break;
            }

            // Decode the chunk and add it to the buffer
            buffer += decoder.decode(value, { stream: true });

            // Process complete SSE messages in the buffer
            const lines = buffer.split("\n\n");
            buffer = lines.pop() || ""; // Keep the last incomplete chunk in the buffer

            for (const line of lines) {
              if (!line.trim()) continue;

              // Parse SSE message
              const [eventLine, dataLine] = line.split("\n");
              const event = eventLine.replace("event: ", "");
              const data = dataLine.replace("data: ", "");

              try {
                const parsedData = JSON.parse(data);

                // Handle different event types
                switch (event) {
                  case "models":
                    callbacks.onModels?.(parsedData.models);
                    break;
                  case "inference":
                    callbacks.onInference?.(
                      parsedData.modelId,
                      parsedData.result
                    );
                    break;
                  case "error":
                    callbacks.onError?.(parsedData.modelId, parsedData.error);
                    break;
                  case "complete":
                    callbacks.onComplete?.();
                    break;
                }
              } catch (e) {
                console.error("Error parsing SSE data:", e);
              }
            }
          }

          // Process any remaining data in the buffer
          if (buffer.trim()) {
            const [eventLine, dataLine] = buffer.split("\n");
            const event = eventLine.replace("event: ", "");
            const data = dataLine.replace("data: ", "");

            try {
              const parsedData = JSON.parse(data);

              switch (event) {
                case "models":
                  callbacks.onModels?.(parsedData.models);
                  break;
                case "inference":
                  callbacks.onInference?.(
                    parsedData.modelId,
                    parsedData.result
                  );
                  break;
                case "error":
                  callbacks.onError?.(parsedData.modelId, parsedData.error);
                  break;
                case "complete":
                  callbacks.onComplete?.();
                  break;
              }
            } catch (e) {
              console.error("Error parsing SSE data:", e);
            }
          }
        } catch (error) {
          console.error("Error reading stream:", error);
        }
      };

      processStream();
    })
    .catch((error) => {
      console.error("Fetch error:", error);
      callbacks.onError?.(
        "connection",
        "Failed to connect to inference service"
      );
      callbacks.onComplete?.();
    });

  // Return cleanup function
  return () => {
    controller.abort();
  };
};
