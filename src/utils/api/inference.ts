import { InferImageResponse } from "@/adapters/roboflowAdapter";

export const inferImage = async (
  base64Image: string
): Promise<InferImageResponse> => {
  const base64Data = base64Image.includes(",")
    ? base64Image.split(",")[1]
    : base64Image;

  const response = await fetch("/api/infer", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      image: base64Data,
    }),
  });

  const data = await response.json();

  return data as InferImageResponse;
};
