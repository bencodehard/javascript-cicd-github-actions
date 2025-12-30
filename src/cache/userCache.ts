import { getRedisClient } from "./redisClient";
import type { User } from "../generated/prisma/client";

// TTL cache 5 นาที (300 วินาที) – Dev สามารถปรับได้ทีหลัง
const USER_CACHE_TTL_SECONDS = 300;

const getUserCacheKey = (userId: string) => `user:${userId}`;

export const getUserFromCache = async (userId: string): Promise<User | null> => {
  const client = getRedisClient();
  const cacheKey = getUserCacheKey(userId);

  const data = await client.get(cacheKey);
  if (!data) {
  console.log(`[CACHE MISS] user:${userId}`);
  return null;
  }
  console.log(`[CACHE HIT] user:${userId}`);

  try {
    return JSON.parse(data) as User;
  } catch (error) {
    console.error("Error parsing user from cache:", error);
    return null;
  }
};

export const setUserToCache = async (user: User): Promise<void> => {
  const client = getRedisClient();
  const cacheKey = getUserCacheKey(user.id);

  await client.set(cacheKey, JSON.stringify(user), {
    EX: USER_CACHE_TTL_SECONDS,
  });
};

export const invalidateUserCache = async (userId: string): Promise<void> => {
  const client = getRedisClient();
  const cacheKey = getUserCacheKey(userId);

  await client.del(cacheKey);
};