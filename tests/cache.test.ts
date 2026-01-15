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
    mockedGetRedisClient.mockReturnValue(mockRedisClient);
    jest.clearAllMocks();
  });

  describe("getUserFromCache", () => {
    it("should return user from cache when exists", async () => {
      const mockUser = { id: "1", email: "test@example.com", firstName: "Test" };
      mockRedisClient.get.mockResolvedValue(JSON.stringify(mockUser));

      const result = await getUserFromCache("1");

      expect(mockRedisClient.get).toHaveBeenCalledWith("user:1");
      expect(result).toEqual(mockUser);
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
      const mockUser = { id: "1", email: "test@example.com" };
      mockRedisClient.set.mockResolvedValue("OK");

      await setUserToCache("1", mockUser);

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        "user:1",
        JSON.stringify(mockUser),
        { EX: 3600 }
      );
    });

    it("should handle cache set error", async () => {
      const mockUser = { id: "1", email: "test@example.com" };
      mockRedisClient.set.mockRejectedValue(new Error("Redis error"));

      const result = await setUserToCache("1", mockUser);

      expect(result).toBeUndefined();
    });
  });

  describe("invalidateUserCache", () => {
    it("should delete user from cache", async () => {
      mockRedisClient.del.mockResolvedValue(1);

      await invalidateUserCache("1");

      expect(mockRedisClient.del).toHaveBeenCalledWith("user:1");
    });

    it("should handle cache delete error", async () => {
      mockRedisClient.del.mockRejectedValue(new Error("Redis error"));

      const result = await invalidateUserCache("1");

      expect(result).toBeUndefined();
    });
  });
});
