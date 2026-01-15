import request from "supertest";
import { app } from "../src/app";
import { getRedisClient } from "../src/cache/redisClient";

jest.mock("../src/cache/redisClient");

const mockedGetRedisClient = getRedisClient as jest.MockedFunction<typeof getRedisClient>;

// Mock prisma after the app import
jest.mock("../src/config/prisma", () => ({
  prisma: {
    user: {
      count: jest.fn(),
    },
  },
}));

import { prisma } from "../src/config/prisma";

describe("app basic routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GET /health should return ok", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("GET /db-check should return ok with user count", async () => {
    (prisma.user.count as jest.Mock).mockResolvedValueOnce(5);

    const res = await request(app).get("/db-check");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.usersCount).toBe(5);
  });

  it("GET /db-check should return error on db failure", async () => {
    (prisma.user.count as jest.Mock).mockRejectedValueOnce(new Error("DB error"));

    const res = await request(app).get("/db-check");

    expect(res.status).toBe(500);
    expect(res.body.status).toBe("error");
    expect(res.body.message).toBe("DB connection failed");
  });

  it("GET /cache-check should return ok with redis test", async () => {
    const mockRedis = {
      set: jest.fn().mockResolvedValue("OK"),
      get: jest.fn().mockResolvedValue("pong:123456"),
    };

    mockedGetRedisClient.mockReturnValue(mockRedis as any);

    const res = await request(app).get("/cache-check");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.redis.key).toBe("test:ping");
    expect(res.body.redis.value).toBe("pong:123456");
  });

  it("GET /cache-check should return error on redis failure", async () => {
    const mockRedis = {
      set: jest.fn().mockRejectedValue(new Error("Redis error")),
    };

    mockedGetRedisClient.mockReturnValue(mockRedis as any);

    const res = await request(app).get("/cache-check");

    expect(res.status).toBe(500);
    expect(res.body.status).toBe("error");
    expect(res.body.message).toBe("Redis connection failed");
  });

  it("should return 404 for non-existent route", async () => {
    const res = await request(app).get("/non-existent-route");

    expect(res.status).toBe(404);
  });
});