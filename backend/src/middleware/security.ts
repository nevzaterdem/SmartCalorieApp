import rateLimit from "express-rate-limit";

// Genel API rate limiter: 100 istek / 15 dakika
export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 dakika
    max: 100,
    message: { error: "Çok fazla istek gönderdiniz, lütfen 15 dakika sonra tekrar deneyin." },
    standardHeaders: true,
    legacyHeaders: false,
});

// Auth rate limiter: 5 istek / 15 dakika (brute-force koruması)
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { error: "Çok fazla giriş denemesi, lütfen 15 dakika sonra tekrar deneyin." },
    standardHeaders: true,
    legacyHeaders: false,
});

// AI endpoint rate limiter: 10 istek / 15 dakika (Gemini API koruması)
export const aiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: "AI istek limitine ulaştınız, lütfen bekleyin." },
    standardHeaders: true,
    legacyHeaders: false,
});
