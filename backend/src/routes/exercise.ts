import { Router, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import { validateExercise } from "../middleware/validate";

const router = Router();
const prisma = new PrismaClient();

// Common exercises with calorie burn rates (per minute)
const exerciseCalories: { [key: string]: number } = {
    "Yürüyüş": 5,
    "Koşu": 10,
    "Bisiklet": 8,
    "Yüzme": 9,
    "Yoga": 3,
    "Ağırlık": 6,
    "Dans": 7,
    "Pilates": 4,
    "HIIT": 12,
    "Diğer": 5,
};

// Add exercise (with validation)
router.post("/", authenticateToken, validateExercise, async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { name, duration, caloriesBurned } = req.body;

        if (!name || !duration) {
            return res.status(400).json({ error: "Egzersiz adı ve süre gerekli" });
        }

        // Calculate calories if not provided
        const burnRate = exerciseCalories[name] || exerciseCalories["Diğer"];
        const calculatedCalories = caloriesBurned || duration * burnRate;

        const exercise = await prisma.exercise.create({
            data: {
                userId: req.userId!,
                name,
                duration,
                caloriesBurned: calculatedCalories,
            },
        });

        res.status(201).json(exercise);
    } catch (error) {
        console.error("Add exercise error:", error);
        res.status(500).json({ error: "Egzersiz kaydedilemedi" });
    }
});

// Get today's exercises
router.get("/today", authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const exercises = await prisma.exercise.findMany({
            where: {
                userId: req.userId,
                createdAt: { gte: today, lt: tomorrow },
            },
            orderBy: { createdAt: "desc" },
        });

        const totalBurned = exercises.reduce((sum, e) => sum + e.caloriesBurned, 0);

        res.json({ exercises, totalBurned });
    } catch (error) {
        console.error("Get exercises error:", error);
        res.status(500).json({ error: "Egzersizler alınamadı" });
    }
});

// Get exercise types
router.get("/types", (req, res) => {
    res.json(Object.entries(exerciseCalories).map(([name, burnRate]) => ({
        name,
        burnRate,
    })));
});

// Delete exercise
router.delete("/:id", authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const id = parseInt(req.params.id);

        await prisma.exercise.deleteMany({
            where: {
                id,
                userId: req.userId,
            },
        });

        res.json({ message: "Silindi" });
    } catch (error) {
        console.error("Delete exercise error:", error);
        res.status(500).json({ error: "Silinemedi" });
    }
});

export default router;
