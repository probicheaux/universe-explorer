import { redis } from "@/adapters/redisAdapter";

export const getAndCache = async <T>(
  key: string,
  fn: () => Promise<T>
): Promise<T> => {
  const redisClient = await redis();
  const value = await redisClient.get(key);

  if (value) {
    console.log(`Cache hit for ${key}`);
    return JSON.parse(value);
  }

  console.log(`Cache miss for ${key}`);

  const result = await fn();
  await redisClient.set(key, JSON.stringify(result));

  return result;
};
