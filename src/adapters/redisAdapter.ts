import { createClient } from "redis";
import { getEnv } from "@/utils/environment";

let CLIENT: ReturnType<typeof createClient> | null = null;

export interface PromptSuggestion {
  text: string;
  timestamp: number;
}

export const redis = async (): Promise<ReturnType<typeof createClient>> => {
  if (!CLIENT) {
    CLIENT = createClient({
      url: getEnv("REDIS_URL"),
    });
    await CLIENT.connect();
  }
  return CLIENT;
};

export const getPromptSuggestions = async (): Promise<PromptSuggestion[]> => {
  console.log("Getting prompt suggestions from Redis");
  const client = await redis();
  const keys = await client.keys("prompt-*");
  console.log(`Found ${keys.length} prompt keys in Redis`);

  if (keys.length > 0) {
    console.log("Sample keys:", keys.slice(0, 3));
  }

  const prompts = await Promise.all(
    keys.map(async (key) => {
      // The key format is "prompt-{promptText}"
      // We need to extract the prompt text from the key
      const promptText = key.replace("prompt-", "");
      const value = await client.get(key);

      // Parse the value to get the timestamp
      let timestamp = 0;
      try {
        if (value) {
          const parsed = JSON.parse(value);
          // If the value has a timestamp property, use it
          if (parsed.timestamp) {
            timestamp = parsed.timestamp;
          } else {
            // Otherwise use current time
            timestamp = Date.now();
          }
        }
      } catch (e) {
        console.error(`Error parsing value for key ${key}:`, e);
        timestamp = Date.now();
      }

      return { text: promptText, timestamp };
    })
  );

  const validPrompts = prompts
    .filter((p) => p.text.trim().length > 0)
    .sort((a, b) => b.timestamp - a.timestamp);

  console.log(`Returning ${validPrompts.length} valid prompts`);

  if (validPrompts.length > 0) {
    console.log(
      "Sample valid prompts:",
      validPrompts.slice(0, 3).map((p) => p.text)
    );
  }

  return validPrompts;
};
