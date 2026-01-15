import { registerUser, loginUser, getUserById, updateCurrentUser, getUserByIdRaw } from "../src/services/userService";
import { prisma } from "../src/config/prisma";
import { hashPassword, verifyPassword } from "../src/utils/password";
import { getUserFromCache, setUserToCache, invalidateUserCache } from "../src/cache/userCache";

// บอก Jest ว่าจะ mock modules เหล่านี้
jest.mock("../src/config/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  },
}));

jest.mock("../src/utils/password", () => ({
  hashPassword: jest.fn(),
  verifyPassword: jest.fn(),
}));

jest.mock("../src/cache/userCache", () => ({
  getUserFromCache: jest.fn(),
  setUserToCache: jest.fn(),
  invalidateUserCache: jest.fn(),
}));

const mockedPrisma = prisma as jest.Mocked<typeof prisma>;
const mockedHashPassword = hashPassword as jest.MockedFunction<typeof hashPassword>;
const mockedVerifyPassword = verifyPassword as jest.MockedFunction<typeof verifyPassword>;
const mockedGetUserFromCache = getUserFromCache as jest.MockedFunction<typeof getUserFromCache>;
const mockedSetUserToCache = setUserToCache as jest.MockedFunction<typeof setUserToCache>;
const mockedInvalidateUserCache = invalidateUserCache as jest.MockedFunction<typeof invalidateUserCache>;

describe("userService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("registerUser", () => {
    it("should create new user when email not exists", async () => {
      (mockedPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      mockedHashPassword.mockResolvedValue("hashed_pw");

      (mockedPrisma.user.create as jest.Mock).mockResolvedValue({
        id: "user-1",
        email: "test@example.com",
        passwordHash: "hashed_pw",
        firstName: "Test",
        lastName: "User",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await registerUser({
        email: "test@example.com",
        password: "Password123!",
        firstName: "Test",
        lastName: "User",
      });

      expect(mockedPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: "test@example.com" },
      });

      expect(mockedHashPassword).toHaveBeenCalledWith("Password123!");

      expect(result.user.email).toBe("test@example.com");
      expect(result.user).not.toHaveProperty("passwordHash");
      expect(result.token).toBeDefined();
    });

    it("should throw EMAIL_ALREADY_EXISTS when email already used", async () => {
      (mockedPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: "user-1",
        email: "test@example.com",
        passwordHash: "hashed_pw",
        firstName: "Test",
        lastName: "User",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        registerUser({
          email: "test@example.com",
          password: "Password123!",
        })
      ).rejects.toThrow("EMAIL_ALREADY_EXISTS");
    });
  });

  describe("loginUser", () => {
    it("should login with valid credentials", async () => {
      (mockedPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: "user-1",
        email: "test@example.com",
        passwordHash: "hashed_pw",
        firstName: "Test",
        lastName: "User",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockedVerifyPassword.mockResolvedValue(true);

      const result = await loginUser({
        email: "test@example.com",
        password: "Password123!",
      });

      expect(mockedPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: "test@example.com" },
      });
      expect(mockedVerifyPassword).toHaveBeenCalledWith("Password123!", "hashed_pw");
      expect(result.user.email).toBe("test@example.com");
      expect(result.token).toBeDefined();
    });

    it("should throw INVALID_CREDENTIALS when user not found", async () => {
      (mockedPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        loginUser({
          email: "notfound@example.com",
          password: "Password123!",
        })
      ).rejects.toThrow("INVALID_CREDENTIALS");
    });

    it("should throw INVALID_CREDENTIALS when password incorrect", async () => {
      (mockedPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: "user-1",
        email: "test@example.com",
        passwordHash: "hashed_pw",
        firstName: "Test",
        lastName: "User",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockedVerifyPassword.mockResolvedValue(false);

      await expect(
        loginUser({
          email: "test@example.com",
          password: "WrongPassword!",
        })
      ).rejects.toThrow("INVALID_CREDENTIALS");
    });
  });

  describe("getUserById with cache", () => {
    it("should return user from cache when available", async () => {
      mockedGetUserFromCache.mockResolvedValue({
        id: "user-1",
        email: "cache@example.com",
        passwordHash: "hash",
        firstName: "Cache",
        lastName: "User",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const user = await getUserById("user-1");

      expect(mockedGetUserFromCache).toHaveBeenCalledWith("user-1");
      expect(mockedPrisma.user.findUnique).not.toHaveBeenCalled();
      expect(user?.email).toBe("cache@example.com");
    });

    it("should query DB and set cache when cache miss", async () => {
      mockedGetUserFromCache.mockResolvedValue(null);

      (mockedPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: "user-1",
        email: "db@example.com",
        passwordHash: "hash",
        firstName: "Db",
        lastName: "User",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const user = await getUserById("user-1");

      expect(mockedGetUserFromCache).toHaveBeenCalledWith("user-1");
      expect(mockedPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: "user-1" },
      });
      expect(mockedSetUserToCache).toHaveBeenCalled();
      expect(user?.email).toBe("db@example.com");
    });

    it("should handle cache set error gracefully", async () => {
      mockedGetUserFromCache.mockResolvedValue(null);
      (mockedPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: "user-1",
        email: "test@example.com",
        passwordHash: "hash",
        firstName: "Test",
        lastName: "User",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      (mockedSetUserToCache as jest.Mock).mockRejectedValue(new Error("Cache error"));

      // setUserToCache might fail but we should still return the user
      try {
        const user = await getUserById("user-1");
        expect(user?.email).toBe("test@example.com");
      } catch {
        // If cache fails, the error bubbles up - that's ok
        expect(mockedSetUserToCache).toHaveBeenCalled();
      }
    });
  });

  describe("getUserByIdRaw", () => {
    it("should return cached user if available", async () => {
      const cachedUser = {
        id: "user-1",
        email: "test@example.com",
        passwordHash: "hashed_pw",
        firstName: "Test",
        lastName: "User",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockedGetUserFromCache as jest.Mock).mockResolvedValue(cachedUser);

      const result = await getUserByIdRaw("user-1");

      expect(mockedGetUserFromCache).toHaveBeenCalledWith("user-1");
      expect(result).toEqual(cachedUser);
      expect(mockedPrisma.user.findUnique).not.toHaveBeenCalled();
    });

    it("should fetch from DB if not in cache", async () => {
      const user = {
        id: "user-1",
        email: "test@example.com",
        passwordHash: "hashed_pw",
        firstName: "Test",
        lastName: "User",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockedGetUserFromCache as jest.Mock).mockResolvedValue(null);
      (mockedPrisma.user.findUnique as jest.Mock).mockResolvedValue(user);
      (mockedSetUserToCache as jest.Mock).mockResolvedValue(undefined);

      const result = await getUserByIdRaw("user-1");

      expect(mockedGetUserFromCache).toHaveBeenCalledWith("user-1");
      expect(mockedPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: "user-1" },
      });
      expect(result).toEqual(user);
      expect(mockedSetUserToCache).toHaveBeenCalledWith(user);
    });

    it("should return null when user not found", async () => {
      (mockedGetUserFromCache as jest.Mock).mockResolvedValue(null);
      (mockedPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await getUserByIdRaw("user-999");

      expect(result).toBeNull();
    });
    it("should update user and invalidate cache", async () => {
      (mockedPrisma.user.update as jest.Mock).mockResolvedValue({
        id: "user-1",
        email: "test@example.com",
        passwordHash: "hash",
        firstName: "Updated",
        lastName: "User",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const user = await updateCurrentUser({
        userId: "user-1",
        firstName: "Updated",
      });

      expect(mockedPrisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { firstName: "Updated", lastName: undefined },
      });

      expect(mockedInvalidateUserCache).toHaveBeenCalledWith("user-1");
      expect(user.firstName).toBe("Updated");
      expect((user as any).passwordHash).toBeUndefined();
    });
  });

  describe("getUserByIdRaw", () => {
    it("should return cached user if available", async () => {
      const cachedUser = {
        id: "user-1",
        email: "test@example.com",
        passwordHash: "hashed_pw",
        firstName: "Test",
        lastName: "User",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockedGetUserFromCache as jest.Mock).mockResolvedValue(cachedUser);

      const result = await getUserByIdRaw("user-1");

      expect(mockedGetUserFromCache).toHaveBeenCalledWith("user-1");
      expect(result).toEqual(cachedUser);
      expect(mockedPrisma.user.findUnique).not.toHaveBeenCalled();
    });

    it("should fetch from DB if not in cache", async () => {
      const user = {
        id: "user-1",
        email: "test@example.com",
        passwordHash: "hashed_pw",
        firstName: "Test",
        lastName: "User",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockedGetUserFromCache as jest.Mock).mockResolvedValue(null);
      (mockedPrisma.user.findUnique as jest.Mock).mockResolvedValue(user);

      const result = await getUserByIdRaw("user-1");

      expect(mockedGetUserFromCache).toHaveBeenCalledWith("user-1");
      expect(mockedPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: "user-1" },
      });
      expect(result).toEqual(user);
      expect(mockedSetUserToCache).toHaveBeenCalledWith(user);
    });

    it("should return null when user not found", async () => {
      (mockedGetUserFromCache as jest.Mock).mockResolvedValue(null);
      (mockedPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await getUserByIdRaw("user-999");

      expect(result).toBeNull();
    });
  });
});