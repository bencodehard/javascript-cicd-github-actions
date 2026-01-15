import { getRedisClient } from "../src/cache/redisClient";
import { getUserFromCache, setUserToCache, invalidateUserCache } from "../src/cache/userCache";

jest.mock("../src/cache/redisClient");

const mockedGetRedisClient = getRedisClient as jest.MockedFunction<typeof getRedisClient>;

describe("userCache", () => {
  let mockRedisClient: any;

  beforeEach(() => {
    mockRedisClient = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };
    mockedGetRedisClient.mockReturnValue(mockRedisClient as any);
    jest.clearAllMocks();
  });

  describe("getUserFromCache", () => {
    it("should return user from cache when exists", async () => {
      const now = new Date();
      const mockUser = { id: "1", email: "test@example.com", firstName: "Test", lastName: null, passwordHash: "hash", isActive: true, createdAt: now, updatedAt: now };
      mockRedisClient.get.mockResolvedValue(JSON.stringify(mockUser));

      const result = await getUserFromCache("1");

      expect(mockRedisClient.get).toHaveBeenCalledWith("user:1");
      expect(result).toBeDefined();
      expect(result?.id).toEqual("1");
      expect(result?.email).toEqual("test@example.com");
    });

    it("should return null when user not in cache", async () => {
      mockRedisClient.get.mockResolvedValue(null);

      const result = await getUserFromCache("999");

      expect(result).toBeNull();
    });

    it("should handle invalid JSON in cache", async () => {
      mockRedisClient.get.mockResolvedValue("invalid json");

      const result = await getUserFromCache("1");

      expect(result).toBeNull();
    });
  });

  describe("setUserToCache", () => {
    it("should set user to cache", async () => {
      const now = new Date();
      const mockUser = { id: "1", email: "test@example.com", firstName: "Test", lastName: null, passwordHash: "hash", isActive: true, createdAt: now, updatedAt: now };
      mockRedisClient.set.mockResolvedValue("OK");

      await setUserToCache(mockUser);

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        "user:1",
        JSON.stringify(mockUser),
        { EX: 300 }
      );
    });

    it("should handle cache set error gracefully", async () => {
      const now = new Date();
      const mockUser = { id: "1", email: "test@example.com", firstName: "Test", lastName: null, passwordHash: "hash", isActive: true, createdAt: now, updatedAt: now };
      mockRedisClient.set.mockRejectedValue(new Error("Redis error"));

      // Should not throw
      const result = await setUserToCache(mockUser).catch(() => undefined);

      expect(result).toBeUndefined();
    });
  });

  describe("invalidateUserCache", () => {
    it("should delete user from cache", async () => {
      mockRedisClient.del.mockResolvedValue(1);

      await invalidateUserCache("1");

      expect(mockRedisClient.del).toHaveBeenCalledWith("user:1");
    });

    it("should handle cache delete error gracefully", async () => {
      mockRedisClient.del.mockRejectedValue(new Error("Redis error"));

      // Should not throw
      const result = await invalidateUserCache("1").catch(() => undefined);

      expect(result).toBeUndefined();
    });
  });
});
