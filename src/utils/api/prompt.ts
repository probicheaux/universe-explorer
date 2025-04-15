import { ApiResponse } from "./index";

export interface PromptResponse {
  task: string;
  classes: string[];
}

export async function send(
  prompt: string
): Promise<ApiResponse<PromptResponse>> {
  try {
    const response = await fetch("/api/prompt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || "Failed to get response" };
    }

    // Parse the stringified response
    const parsedMessage = JSON.parse(data.message);
    return { data: parsedMessage };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
