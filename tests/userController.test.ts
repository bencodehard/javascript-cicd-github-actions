import { Request, Response } from "express";
import {
  registerHandler,
  loginHandler,
  meHandler,
  getUserByIdHandler,
  updateMeHandler,
} from "../src/controllers/userController";
import * as userService from "../src/services/userService";

jest.mock("../src/services/userService");

const mockedUserService = userService as jest.Mocked<typeof userService>;

describe("userController", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let statusSpy: jest.Mock;
  let jsonSpy: jest.Mock;

  beforeEach(() => {
    statusSpy = jest.fn().mockReturnValue({ json: jest.fn() });
    jsonSpy = jest.fn().mockReturnValue(undefined);

    mockRes = {
      status: statusSpy,
      json: jsonSpy,
    };

    mockReq = {
      body: {},
      params: {},
    };

    jest.clearAllMocks();
  });

  describe("registerHandler", () => {
    it("should register user successfully", async () => {
      mockReq.body = {
        email: "test@example.com",
        password: "Password123!",
        firstName: "Test",
        lastName: "User",
      };

      const mockResult = {
        user: { id: "1", email: "test@example.com", firstName: "Test", lastName: "User" },
        token: "mock_token",
      };

      mockedUserService.registerUser.mockResolvedValue(mockResult);
      statusSpy.mockReturnValue({ json: jsonSpy });

      await registerHandler(mockReq as Request, mockRes as Response);

      expect(statusSpy).toHaveBeenCalledWith(201);
      expect(jsonSpy).toHaveBeenCalledWith(mockResult);
    });

    it("should return 400 when email is missing", async () => {
      mockReq.body = { password: "Password123!" };

      statusSpy.mockReturnValue({ json: jsonSpy });

      await registerHandler(mockReq as Request, mockRes as Response);

      expect(statusSpy).toHaveBeenCalledWith(400);
    });

    it("should return 409 when email already exists", async () => {
      mockReq.body = {
        email: "test@example.com",
        password: "Password123!",
      };

      const error = new Error("EMAIL_ALREADY_EXISTS");
      mockedUserService.registerUser.mockRejectedValue(error);
      statusSpy.mockReturnValue({ json: jsonSpy });

      await registerHandler(mockReq as Request, mockRes as Response);

      expect(statusSpy).toHaveBeenCalledWith(409);
    });

    it("should return 500 on server error", async () => {
      mockReq.body = {
        email: "test@example.com",
        password: "Password123!",
      };

      mockedUserService.registerUser.mockRejectedValue(new Error("Server error"));
      statusSpy.mockReturnValue({ json: jsonSpy });

      await registerHandler(mockReq as Request, mockRes as Response);

      expect(statusSpy).toHaveBeenCalledWith(500);
    });
  });

  describe("loginHandler", () => {
    it("should login successfully", async () => {
      mockReq.body = {
        email: "test@example.com",
        password: "Password123!",
      };

      const mockResult = {
        user: { id: "1", email: "test@example.com" },
        token: "mock_token",
      };

      mockedUserService.loginUser.mockResolvedValue(mockResult);
      statusSpy.mockReturnValue({ json: jsonSpy });

      await loginHandler(mockReq as Request, mockRes as Response);

      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith(mockResult);
    });

    it("should return 400 when credentials missing", async () => {
      mockReq.body = { email: "test@example.com" };
      statusSpy.mockReturnValue({ json: jsonSpy });

      await loginHandler(mockReq as Request, mockRes as Response);

      expect(statusSpy).toHaveBeenCalledWith(400);
    });

    it("should return 401 when credentials invalid", async () => {
      mockReq.body = {
        email: "test@example.com",
        password: "Wrong",
      };

      const error = new Error("INVALID_CREDENTIALS");
      mockedUserService.loginUser.mockRejectedValue(error);
      statusSpy.mockReturnValue({ json: jsonSpy });

      await loginHandler(mockReq as Request, mockRes as Response);

      expect(statusSpy).toHaveBeenCalledWith(401);
    });
  });

  describe("meHandler", () => {
    it("should get current user", async () => {
      const authRequest = {
        ...mockReq,
        user: { userId: "1", email: "test@example.com" },
      };

      const mockUser = { id: "1", email: "test@example.com" };
      mockedUserService.getUserById.mockResolvedValue(mockUser);
      statusSpy.mockReturnValue({ json: jsonSpy });

      await meHandler(authRequest as any, mockRes as Response);

      expect(mockedUserService.getUserById).toHaveBeenCalledWith("1");
      expect(jsonSpy).toHaveBeenCalledWith({ user: mockUser });
    });

    it("should return 401 when not authenticated", async () => {
      mockRes.status = () => ({ json: jsonSpy });

      await meHandler(mockReq as any, mockRes as Response);

      expect(jsonSpy).toHaveBeenCalledWith({ message: "Unauthorized" });
    });

    it("should return 404 when user not found", async () => {
      const authRequest = {
        ...mockReq,
        user: { userId: "999", email: "notfound@example.com" },
      };

      mockedUserService.getUserById.mockResolvedValue(null);
      statusSpy.mockReturnValue({ json: jsonSpy });

      await meHandler(authRequest as any, mockRes as Response);

      expect(statusSpy).toHaveBeenCalledWith(404);
    });
  });

  describe("getUserByIdHandler", () => {
    it("should get user by id", async () => {
      const authRequest = {
        ...mockReq,
        params: { id: "1" },
        user: { userId: "1", email: "test@example.com" },
      };

      const mockUser = { id: "1", email: "test@example.com" };
      mockedUserService.getUserById.mockResolvedValue(mockUser);
      statusSpy.mockReturnValue({ json: jsonSpy });

      await getUserByIdHandler(authRequest as any, mockRes as Response);

      expect(jsonSpy).toHaveBeenCalledWith({ user: mockUser });
    });

    it("should return 400 when id missing", async () => {
      const authRequest = {
        ...mockReq,
        params: {},
        user: { userId: "1", email: "test@example.com" },
      };

      statusSpy.mockReturnValue({ json: jsonSpy });

      await getUserByIdHandler(authRequest as any, mockRes as Response);

      expect(statusSpy).toHaveBeenCalledWith(400);
    });

    it("should return 404 when user not found", async () => {
      const authRequest = {
        ...mockReq,
        params: { id: "999" },
        user: { userId: "1", email: "test@example.com" },
      };

      mockedUserService.getUserById.mockResolvedValue(null);
      statusSpy.mockReturnValue({ json: jsonSpy });

      await getUserByIdHandler(authRequest as any, mockRes as Response);

      expect(statusSpy).toHaveBeenCalledWith(404);
    });
  });

  describe("updateMeHandler", () => {
    it("should update user successfully", async () => {
      const authRequest = {
        ...mockReq,
        body: { firstName: "Updated" },
        user: { userId: "1", email: "test@example.com" },
      };

      const mockUpdatedUser = { id: "1", firstName: "Updated" };
      mockedUserService.updateCurrentUser.mockResolvedValue(mockUpdatedUser);
      statusSpy.mockReturnValue({ json: jsonSpy });

      await updateMeHandler(authRequest as any, mockRes as Response);

      expect(jsonSpy).toHaveBeenCalledWith({ user: mockUpdatedUser });
    });

    it("should return 401 when not authenticated", async () => {
      mockRes.status = () => ({ json: jsonSpy });

      await updateMeHandler(mockReq as any, mockRes as Response);

      expect(jsonSpy).toHaveBeenCalledWith({ message: "Unauthorized" });
    });

    it("should return 400 when no fields to update", async () => {
      const authRequest = {
        ...mockReq,
        body: {},
        user: { userId: "1", email: "test@example.com" },
      };

      statusSpy.mockReturnValue({ json: jsonSpy });

      await updateMeHandler(authRequest as any, mockRes as Response);

      expect(statusSpy).toHaveBeenCalledWith(400);
    });
  });
});
