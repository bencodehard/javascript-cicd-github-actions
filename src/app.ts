import express from "express";
import cors from "cors";
import helmet from "helmet";
import { prisma } from "./config/prisma";
import { getRedisClient } from "./cache/redisClient";
import { userRoutes } from "./routes/userRoutes";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use("/api/users", userRoutes);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/db-check", async (_req, res) => {
  try {
    const usersCount = await prisma.user.count();
    res.json({ status: "ok", usersCount });
  } catch (error) {
    console.error("DB check failed:", error);
    res.status(500).json({ status: "error", message: "DB connection failed" });
  }
});

app.get("/cache-check", async (_req, res) => {
  try {
    const client = getRedisClient();

    // test set / get
    const key = "test:ping";
    const value = `pong:${Date.now()}`;

    await client.set(key, value, { EX: 60 });
    const result = await client.get(key);

    res.json({
      status: "ok",
      redis: {
        key,
        value: result,
      },
    });
  } catch (error) {
    console.error("Redis check failed:", error);
    res.status(500).json({ status: "error", message: "Redis connection failed" });
  }
});

export { app };