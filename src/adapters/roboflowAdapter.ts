import axios from "axios";
import { getEnv } from "@/utils/environment";

const BASE_URL = "https://serverless.roboflow.com/";

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

export const inferImage = async (
  modelUrl: string,
  imageB64: string
): Promise<InferImageResponse> => {
  const apiKey = getEnv("ROBOFLOW_API_KEY");

  if (!apiKey) {
    throw new Error("ROBOFLOW_API_KEY is not set");
  }

  console.log("Using API key:", apiKey.substring(0, 5) + "...");
  console.log("Request URL:", `${BASE_URL}${modelUrl}`);

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
};
