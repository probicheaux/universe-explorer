import { PromptSuggestion } from "@/adapters/redisAdapter";

export interface PromptResponse {
  task: string;
  classes: string[];
}

export interface PromptRequest {
  prompt: string;
}

export interface PromptError {
  error: string;
}

export type PromptResult = {
  data?: PromptResponse;
  error?: PromptError;
};

export const prompt = {
  send: async (prompt: string): Promise<PromptResult> => {
    try {
      const response = await fetch("/api/prompt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        return {
          error: {
            error: `Failed to send prompt: ${response.statusText}`,
          },
        };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error("Error sending prompt:", error);
      return {
        error: {
          error: "Failed to send prompt",
        },
      };
    }
  },

  suggestions: {
    fetch: async (query: string): Promise<PromptSuggestion[]> => {
      try {
        const response = await fetch(
          `/api/prompt/suggestions?q=${encodeURIComponent(query)}`
        );

        if (!response.ok) {
          console.error(`Failed to fetch suggestions: ${response.statusText}`);
          return [];
        }

        const data = await response.json();
        return data;
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        return [];
      }
    },
  },
};
