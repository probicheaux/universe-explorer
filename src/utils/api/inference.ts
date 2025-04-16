export interface ModelInfo {
  id: string;
  datasetId: string;
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
  };
  universe?: {
    stars: number;
  };
  models?: number[];
  icon?: string;
  iconOwner?: string;
  iconHasAnnotation?: boolean;
  annotation?: string;
  url?: string;
  version?: number;
  metadataScore?: number;
  semanticScore?: number;
  imageSimilarityScore?: number;
}

export interface InferenceCallbacks {
  onModels: (models: ModelInfo[], from?: number, to?: number) => void;
  onInference: (modelId: string | null, result: any) => void;
  onError: (modelId: string | null, error: any) => void;
  onComplete: () => void;
}

export interface InferenceOptions {
  searchClasses?: {
    class: string;
    drawCount: number;
  }[];
  from?: number;
  to?: number;
}

export const inferImage = (
  image: string,
  callbacks: InferenceCallbacks,
  options: InferenceOptions = {}
): (() => void) => {
  const base64Data = image.includes(",") ? image.split(",")[1] : image;

  // Create POST request with the image data and pagination parameters
  const body = JSON.stringify({
    image: base64Data,
    searchClasses: options.searchClasses || [],
    from: options.from,
    to: options.to,
  });

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
                console.log(`Received SSE event: ${event}`, parsedData);

                // Handle different event types
                switch (event) {
                  case "models":
                    callbacks.onModels?.(
                      parsedData.models,
                      parsedData.from,
                      parsedData.to
                    );
                    break;
                  case "inference":
                    if (!parsedData.modelId) {
                      console.warn(
                        "Inference event missing modelId:",
                        parsedData
                      );
                    }
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
                console.error("Error parsing SSE data:", e, data);
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
              console.log(
                `Processing remaining buffer - SSE event: ${event}`,
                parsedData
              );

              switch (event) {
                case "models":
                  callbacks.onModels?.(
                    parsedData.models,
                    parsedData.from,
                    parsedData.to
                  );
                  break;
                case "inference":
                  if (!parsedData.modelId) {
                    console.warn(
                      "Inference event missing modelId:",
                      parsedData
                    );
                  }
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
              console.error("Error parsing SSE data from buffer:", e, data);
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

export const INFERENCES_PAGE_SIZE = 100;
