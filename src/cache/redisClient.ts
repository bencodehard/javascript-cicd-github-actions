import { createClient, RedisClientType } from "redis";
import { env } from "../config/env";

let redisClient: RedisClientType | null = null;

export const getRedisClient = (): RedisClientType => {
  if (!redisClient) {
    redisClient = createClient({
      socket: {
        host: env.redis.host,
        port: env.redis.port,
      },
      username: env.redis.username,
      password: env.redis.password,
      database: env.redis.db,
    });

    redisClient.on("error", (err) => {
      console.error("❌ Redis Client Error:", err);
    });

    redisClient.on("connect", () => {
      console.log("✅ Connected to Redis");
    });

    redisClient.connect().catch((err) => {
      console.error("❌ Failed to connect to Redis:", err);
    });
  }

  return redisClient;
};