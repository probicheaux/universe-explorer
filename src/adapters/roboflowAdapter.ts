import axios, { AxiosError } from "axios";
import { getEnv } from "@/utils/environment";

const BASE_URL = "https://serverless.roboflow.com/";
const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY = 1000; // 1 second

type BoundingBoxPrediction = {
  class: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
};

export type InferImageResponse = {
  inference_id: string;
  time: number;
  image: {
    width: number;
    height: number;
  };
  predictions: BoundingBoxPrediction[];
};

// Helper function to delay execution
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const inferImage = async (
  modelUrl: string,
  imageB64: string
): Promise<InferImageResponse> => {
  const apiKey = getEnv("ROBOFLOW_API_KEY");

  if (!apiKey) {
    throw new Error("ROBOFLOW_API_KEY is not set");
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await axios({
        method: "POST",
        url: `${BASE_URL}${modelUrl}`,
        params: {
          api_key: apiKey,
        },
        data: imageB64,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      return response.data;
    } catch (error) {
      lastError = error as Error;

      // If this is the last attempt, throw the error
      if (attempt === MAX_RETRIES - 1) {
        throw error;
      }

      // Calculate delay with exponential backoff and jitter
      const backoffDelay = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
      const jitter = Math.random() * 1000; // Random delay between 0-1000ms
      const retryDelay = backoffDelay + jitter;

      console.warn(
        `Roboflow API call failed (attempt ${attempt + 1}/${MAX_RETRIES}). ` +
          `Retrying in ${Math.round(retryDelay / 1000)}s...`,
        error instanceof AxiosError
          ? {
              status: error.response?.status,
              message: error.message,
              url: modelUrl,
            }
          : error
      );

      // Wait before retrying
      await delay(retryDelay);
    }
  }

  // This should never be reached due to the throw in the last iteration,
  // but TypeScript doesn't know that
  throw lastError || new Error("Failed to call Roboflow API");
};
