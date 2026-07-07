import request from "supertest";
import app from "../index.js";

describe("POST /api/audit/summary", () => {
  test("401 sin token de autorizacion", async () => {
    const res = await request(app).post("/api/audit/summary").send({});

    expect(res.status).toBe(401);
    expect(res.body.error_code).toBe("IAM-004");
  });
});

describe("GET /api/audit/metrics", () => {
  test("401 sin token de autorizacion", async () => {
    const res = await request(app).get("/api/audit/metrics");

    expect(res.status).toBe(401);
    expect(res.body.error_code).toBe("IAM-004");
  });
});

describe("GET /api/security/metrics (mismo router montado en /api/security)", () => {
  test("401 sin token de autorizacion", async () => {
    const res = await request(app).get("/api/security/metrics");

    expect(res.status).toBe(401);
    expect(res.body.error_code).toBe("IAM-004");
  });
});
