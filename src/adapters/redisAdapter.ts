import { createClient } from "redis";
import { getEnv } from "@/utils/environment";

let CLIENT: ReturnType<typeof createClient> | null = null;

export const redis = async (): Promise<ReturnType<typeof createClient>> => {
  if (!CLIENT) {
    CLIENT = createClient({
      url: getEnv("REDIS_URL"),
    });
    await CLIENT.connect();
  }
  return CLIENT;
};
