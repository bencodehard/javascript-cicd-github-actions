import { hashPassword, verifyPassword } from "../src/utils/password";

describe("password utils", () => {
  const plain = "Password123!";

  it("should hash password and verify correctly", async () => {
    const hash = await hashPassword(plain);

    expect(hash).toBeDefined();
    expect(hash).not.toEqual(plain);

    const ok = await verifyPassword(plain, hash);
    expect(ok).toBe(true);
  });

  it("should fail verification with wrong password", async () => {
    const hash = await hashPassword(plain);

    const ok = await verifyPassword("wrongpassword", hash);
    expect(ok).toBe(false);
  });
});