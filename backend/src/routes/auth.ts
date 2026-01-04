import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { generateToken, authenticateToken, AuthRequest } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();

// Register
router.post("/register", async (req: Request, res: Response): Promise<any> => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email ve şifre gerekli" });
        }

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

// Login
router.post("/login", async (req: Request, res: Response): Promise<any> => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email ve şifre gerekli" });
        }

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

// Update profile
router.put("/profile", authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
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

export default router;
