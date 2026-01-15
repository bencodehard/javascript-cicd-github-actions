import { Request, Response, NextFunction } from "express";
import { authMiddleware, AuthRequest } from "../src/middleware/auth";
import * as jwtUtils from "../src/utils/jwt";

jest.mock("../src/utils/jwt");

const mockedJwtUtils = jwtUtils as jest.Mocked<typeof jwtUtils>;

describe("authMiddleware", () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;
  let statusSpy: jest.Mock;
  let jsonSpy: jest.Mock;

  beforeEach(() => {
    statusSpy = jest.fn().mockReturnValue({ json: jest.fn() });
    jsonSpy = jest.fn().mockReturnValue(undefined);
    mockNext = jest.fn();

    mockRes = {
      status: statusSpy,
      json: jsonSpy,
    };

    mockReq = {
      headers: {},
    };

    jest.clearAllMocks();
  });

  it("should verify valid token and call next", () => {
    const mockPayload = { userId: "1", email: "test@example.com" };
    mockReq.headers = {
      authorization: "Bearer valid.jwt.token",
    };

    mockedJwtUtils.verifyToken.mockReturnValue(mockPayload);

    authMiddleware(mockReq as AuthRequest, mockRes as Response, mockNext);

    expect(mockedJwtUtils.verifyToken).toHaveBeenCalledWith("valid.jwt.token");
    expect(mockReq.user).toEqual(mockPayload);
    expect(mockNext).toHaveBeenCalled();
  });

  it("should return 401 when authorization header missing", () => {
    mockReq.headers = {};
    statusSpy.mockReturnValue({ json: jsonSpy });

    authMiddleware(mockReq as AuthRequest, mockRes as Response, mockNext);

    expect(statusSpy).toHaveBeenCalledWith(401);
    expect(jsonSpy).toHaveBeenCalledWith({
      message: "Missing or invalid Authorization header",
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should return 401 when authorization header doesn't start with Bearer", () => {
    mockReq.headers = {
      authorization: "Basic dXNlcjpwYXNz",
    };
    statusSpy.mockReturnValue({ json: jsonSpy });

    authMiddleware(mockReq as AuthRequest, mockRes as Response, mockNext);

    expect(statusSpy).toHaveBeenCalledWith(401);
  });

  it("should return 401 when token is invalid", () => {
    mockReq.headers = {
      authorization: "Bearer invalid.token",
    };

    mockedJwtUtils.verifyToken.mockImplementation(() => {
      throw new Error("Invalid token");
    });

    statusSpy.mockReturnValue({ json: jsonSpy });

    authMiddleware(mockReq as AuthRequest, mockRes as Response, mockNext);

    expect(statusSpy).toHaveBeenCalledWith(401);
    expect(jsonSpy).toHaveBeenCalledWith({
      message: "Invalid or expired token",
    });
    expect(mockNext).not.toHaveBeenCalled();
  });
});
