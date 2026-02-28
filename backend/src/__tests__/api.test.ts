import express from "express";
import request from "supertest";
import { generalLimiter, authLimiter } from "../middleware/security";

// Basit Express app oluştur (test amaçlı)
function createTestApp() {
    const app = express();
    app.use(express.json());

    // Genel limiter ile endpoint
    app.get("/api/test", generalLimiter, (req, res) => {
        res.json({ success: true });
    });

    // Auth limiter ile endpoint
    app.post("/auth/test", authLimiter, (req, res) => {
        res.json({ success: true });
    });

    return app;
}

describe("Security Middleware", () => {
    describe("Rate Limiting", () => {
        it("normal isteklere izin verir", async () => {
            const app = createTestApp();
            const response = await request(app).get("/api/test");
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it("rate limit header'larını döner", async () => {
            const app = createTestApp();
            const response = await request(app).get("/api/test");
            expect(response.headers["ratelimit-limit"]).toBeDefined();
            expect(response.headers["ratelimit-remaining"]).toBeDefined();
        });

        it("auth endpoint'e normal isteklere izin verir", async () => {
            const app = createTestApp();
            const response = await request(app).post("/auth/test").send({});
            expect(response.status).toBe(200);
        });
    });
});

describe("Input Validation Middleware", () => {
    function createValidationApp() {
        const app = express();
        app.use(express.json());

        // Import validation middleware
        const { validateRegister, validateLogin, validateMeal, validateWater, validateExercise } = require("../middleware/validate");

        app.post("/register", validateRegister, (req: any, res: any) => {
            res.json({ success: true, body: req.body });
        });

        app.post("/login", validateLogin, (req: any, res: any) => {
            res.json({ success: true });
        });

        app.post("/meal", validateMeal, (req: any, res: any) => {
            res.json({ success: true });
        });

        app.post("/water", validateWater, (req: any, res: any) => {
            res.json({ success: true });
        });

        app.post("/exercise", validateExercise, (req: any, res: any) => {
            res.json({ success: true });
        });

        return app;
    }

    // ============ REGISTER VALIDATION ============
    describe("Register Validation", () => {
        it("geçerli email ve şifre ile başarılı", async () => {
            const app = createValidationApp();
            const res = await request(app)
                .post("/register")
                .send({ email: "test@example.com", password: "123456" });
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it("email'i lowercase yapar", async () => {
            const app = createValidationApp();
            const res = await request(app)
                .post("/register")
                .send({ email: "TEST@Example.COM", password: "123456" });
            expect(res.body.body.email).toBe("test@example.com");
        });

        it("geçersiz email reddedilir", async () => {
            const app = createValidationApp();
            const res = await request(app)
                .post("/register")
                .send({ email: "not-valid", password: "123456" });
            expect(res.status).toBe(400);
        });

        it("kısa şifre reddedilir", async () => {
            const app = createValidationApp();
            const res = await request(app)
                .post("/register")
                .send({ email: "test@example.com", password: "123" });
            expect(res.status).toBe(400);
        });

        it("boş email reddedilir", async () => {
            const app = createValidationApp();
            const res = await request(app)
                .post("/register")
                .send({ password: "123456" });
            expect(res.status).toBe(400);
        });

        it("isim XSS temizlenir", async () => {
            const app = createValidationApp();
            const res = await request(app)
                .post("/register")
                .send({ email: "a@b.com", password: "123456", name: "<script>alert(1)</script>Test" });
            expect(res.body.body.name).not.toContain("<script>");
        });
    });

    // ============ LOGIN VALIDATION ============
    describe("Login Validation", () => {
        it("geçerli giriş verisi ile başarılı", async () => {
            const app = createValidationApp();
            const res = await request(app)
                .post("/login")
                .send({ email: "test@example.com", password: "123456" });
            expect(res.status).toBe(200);
        });

        it("boş şifre reddedilir", async () => {
            const app = createValidationApp();
            const res = await request(app)
                .post("/login")
                .send({ email: "test@example.com" });
            expect(res.status).toBe(400);
        });
    });

    // ============ MEAL VALIDATION ============
    describe("Meal Validation", () => {
        it("geçerli yemek verisi ile başarılı", async () => {
            const app = createValidationApp();
            const res = await request(app)
                .post("/meal")
                .send({ foodName: "Tavuk Göğsü", calories: 250 });
            expect(res.status).toBe(200);
        });

        it("yemek adı olmadan reddedilir", async () => {
            const app = createValidationApp();
            const res = await request(app)
                .post("/meal")
                .send({ calories: 250 });
            expect(res.status).toBe(400);
        });

        it("kalori olmadan reddedilir", async () => {
            const app = createValidationApp();
            const res = await request(app)
                .post("/meal")
                .send({ foodName: "Tavuk" });
            expect(res.status).toBe(400);
        });

        it("negatif kalori reddedilir", async () => {
            const app = createValidationApp();
            const res = await request(app)
                .post("/meal")
                .send({ foodName: "Tavuk", calories: -100 });
            expect(res.status).toBe(400);
        });
    });

    // ============ WATER VALIDATION ============
    describe("Water Validation", () => {
        it("geçerli su miktarı ile başarılı", async () => {
            const app = createValidationApp();
            const res = await request(app)
                .post("/water")
                .send({ amount: 250 });
            expect(res.status).toBe(200);
        });

        it("0 veya negatif miktar reddedilir", async () => {
            const app = createValidationApp();
            const res = await request(app)
                .post("/water")
                .send({ amount: 0 });
            expect(res.status).toBe(400);
        });

        it("5000ml üzeri reddedilir", async () => {
            const app = createValidationApp();
            const res = await request(app)
                .post("/water")
                .send({ amount: 6000 });
            expect(res.status).toBe(400);
        });
    });

    // ============ EXERCISE VALIDATION ============
    describe("Exercise Validation", () => {
        it("geçerli egzersiz verisi ile başarılı", async () => {
            const app = createValidationApp();
            const res = await request(app)
                .post("/exercise")
                .send({ name: "Koşu", duration: 30 });
            expect(res.status).toBe(200);
        });

        it("süre olmadan reddedilir", async () => {
            const app = createValidationApp();
            const res = await request(app)
                .post("/exercise")
                .send({ name: "Koşu" });
            expect(res.status).toBe(400);
        });

        it("600 dakikadan fazla süre reddedilir", async () => {
            const app = createValidationApp();
            const res = await request(app)
                .post("/exercise")
                .send({ name: "Koşu", duration: 700 });
            expect(res.status).toBe(400);
        });
    });
});
