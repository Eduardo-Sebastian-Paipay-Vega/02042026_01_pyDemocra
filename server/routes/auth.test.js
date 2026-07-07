import request from "supertest";
import app from "../index.js";

describe("POST /api/auth/terminal-login", () => {
  test("400 cuando faltan campos requeridos", async () => {
    const res = await request(app).post("/api/auth/terminal-login").send({});

    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe("IAM-001");
  });

  test("400 cuando falta terminal_id", async () => {
    const res = await request(app).post("/api/auth/terminal-login").send({
      tenant_id: "11111111-1111-4111-8111-111111111111",
      user_id: "22222222-2222-4222-8222-222222222222",
      pin: "1234",
    });

    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe("IAM-001");
  });
});

describe("POST /api/auth/risk-evaluate", () => {
  test("401 sin token de autorizacion", async () => {
    const res = await request(app).post("/api/auth/risk-evaluate").send({});

    expect(res.status).toBe(401);
    expect(res.body.error_code).toBe("IAM-004");
  });
});

describe("POST /api/auth/step-up/verify-otp", () => {
  test("401 sin token de autorizacion", async () => {
    const res = await request(app)
      .post("/api/auth/step-up/verify-otp")
      .send({ challenge_id: "x", code: "123456" });

    expect(res.status).toBe(401);
    expect(res.body.error_code).toBe("IAM-004");
  });
});

describe("POST /api/auth/step-up/resend-otp", () => {
  test("401 sin token de autorizacion", async () => {
    const res = await request(app)
      .post("/api/auth/step-up/resend-otp")
      .send({ challenge_id: "x" });

    expect(res.status).toBe(401);
    expect(res.body.error_code).toBe("IAM-004");
  });
});
