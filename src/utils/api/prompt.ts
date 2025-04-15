import { ApiResponse } from "./index";

export async function send(
  prompt: string
): Promise<ApiResponse<{ message: string }>> {
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

    return { data };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
