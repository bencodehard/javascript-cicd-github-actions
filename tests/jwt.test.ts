import { signToken, verifyToken } from "../src/utils/jwt";

describe("jwt utils", () => {
  it("should sign and verify token correctly", () => {
    const payload = { userId: "123", email: "test@example.com" };

    const token = signToken(payload);
    expect(token).toBeDefined();
    expect(typeof token).toBe("string");

    const decoded = verifyToken(token);
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.email).toBe(payload.email);
  });

  it("should throw error for invalid token", () => {
    const invalidToken = "this.is.invalid";

    expect(() => verifyToken(invalidToken)).toThrow();
  });
});