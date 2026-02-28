import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { PrismaClient } from "@prisma/client";
import { generateToken, authenticateToken, AuthRequest } from "../middleware/auth";
import { authLimiter } from "../middleware/security";
import { validateRegister, validateLogin, validateProfileUpdate } from "../middleware/validate";

const router = Router();
const prisma = new PrismaClient();

// Register (with rate limiting + validation)
router.post("/register", authLimiter, validateRegister, async (req: Request, res: Response): Promise<any> => {
    try {
        const { email, password, name } = req.body;

        // Check if user exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: "Bu email zaten kullanımda" });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                name: name || null,
            },
        });

        const token = generateToken(user.id);

        res.status(201).json({
            message: "Kayıt başarılı",
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
            },
        });
    } catch (error) {
        console.error("Register error:", error);
        res.status(500).json({ error: "Kayıt sırasında hata oluştu" });
    }
});

// Login (with rate limiting + validation)
router.post("/login", authLimiter, validateLogin, async (req: Request, res: Response): Promise<any> => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: "Geçersiz email veya şifre" });
        }

        // Check password
        const validPassword = await bcrypt.compare(password, user.passwordHash);
        if (!validPassword) {
            return res.status(401).json({ error: "Geçersiz email veya şifre" });
        }

        const token = generateToken(user.id);

        res.json({
            message: "Giriş başarılı",
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                weight: user.weight,
                height: user.height,
                gender: user.gender,
                dailyCalorieGoal: user.dailyCalorieGoal,
                dailyWaterGoal: user.dailyWaterGoal,
            },
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Giriş sırasında hata oluştu" });
    }
});

// Get current user
router.get("/me", authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            select: {
                id: true,
                email: true,
                name: true,
                age: true,
                gender: true,
                weight: true,
                height: true,
                dailyCalorieGoal: true,
                dailyWaterGoal: true,
                createdAt: true,
            },
        });

        if (!user) {
            return res.status(404).json({ error: "Kullanıcı bulunamadı" });
        }

        res.json(user);
    } catch (error) {
        console.error("Get user error:", error);
        res.status(500).json({ error: "Kullanıcı bilgisi alınamadı" });
    }
});

// Update profile (with validation)
router.put("/profile", authenticateToken, validateProfileUpdate, async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { name, age, gender, weight, height, dailyCalorieGoal, dailyWaterGoal } = req.body;

        const user = await prisma.user.update({
            where: { id: req.userId },
            data: {
                name,
                age,
                gender,
                weight,
                height,
                dailyCalorieGoal,
                dailyWaterGoal,
            },
            select: {
                id: true,
                email: true,
                name: true,
                age: true,
                gender: true,
                weight: true,
                height: true,
                dailyCalorieGoal: true,
                dailyWaterGoal: true,
            },
        });

        res.json({ message: "Profil güncellendi", user });
    } catch (error) {
        console.error("Update profile error:", error);
        res.status(500).json({ error: "Profil güncellenemedi" });
    }
});

// ============ PASSWORD RESET ============

// Forgot password - creates a reset token
router.post("/forgot-password", authLimiter, async (req: Request, res: Response): Promise<any> => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: "Email gereklidir" });
        }

        const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
        if (!user) {
            // Güvenlik: kullanıcı olup olmadığını açığa vurma
            return res.json({ message: "Eğer bu email kayıtlıysa, şifre sıfırlama talimatları gönderildi." });
        }

        // Invalidate any existing tokens
        await prisma.passwordResetToken.updateMany({
            where: { userId: user.id, used: false },
            data: { used: true },
        });

        // Create new token (6 haneli kod)
        const resetCode = crypto.randomInt(100000, 999999).toString();
        const hashedToken = crypto.createHash("sha256").update(resetCode).digest("hex");

        await prisma.passwordResetToken.create({
            data: {
                userId: user.id,
                token: hashedToken,
                expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 dakika geçerli
            },
        });

        // NOT: Email servisi olmadığı için token'ı response'ta dönüyoruz
        // Production'da bu kodu email ile gönderin!
        res.json({
            message: "Şifre sıfırlama kodu oluşturuldu",
            resetCode, // ⚠️ Production'da bu alanı kaldırıp email ile gönderin
            expiresIn: "15 dakika",
        });
    } catch (error) {
        console.error("Forgot password error:", error);
        res.status(500).json({ error: "Şifre sıfırlama işlemi başarısız" });
    }
});

// Reset password with token
router.post("/reset-password", authLimiter, async (req: Request, res: Response): Promise<any> => {
    try {
        const { email, resetCode, newPassword } = req.body;

        if (!email || !resetCode || !newPassword) {
            return res.status(400).json({ error: "Email, sıfırlama kodu ve yeni şifre gereklidir" });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: "Yeni şifre en az 6 karakter olmalıdır" });
        }

        const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
        if (!user) {
            return res.status(400).json({ error: "Geçersiz sıfırlama kodu" });
        }

        // Find valid token
        const hashedToken = crypto.createHash("sha256").update(resetCode).digest("hex");
        const resetToken = await prisma.passwordResetToken.findFirst({
            where: {
                userId: user.id,
                token: hashedToken,
                used: false,
                expiresAt: { gt: new Date() },
            },
        });

        if (!resetToken) {
            return res.status(400).json({ error: "Geçersiz veya süresi dolmuş sıfırlama kodu" });
        }

        // Update password
        const passwordHash = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: user.id },
            data: { passwordHash },
        });

        // Mark token as used
        await prisma.passwordResetToken.update({
            where: { id: resetToken.id },
            data: { used: true },
        });

        res.json({ message: "Şifre başarıyla güncellendi" });
    } catch (error) {
        console.error("Reset password error:", error);
        res.status(500).json({ error: "Şifre sıfırlama başarısız" });
    }
});

export default router;
