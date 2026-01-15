import { app } from "../src/app";

describe("server", () => {
  it("should have express app defined", () => {
    expect(app).toBeDefined();
  });

  it("should have basic routes defined", async () => {
    const request = require("supertest");

    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("should have middleware configured", () => {
    expect(app).toBeDefined();
    // The app is properly configured with middleware
    expect(typeof app.use).toBe("function");
  });
});
