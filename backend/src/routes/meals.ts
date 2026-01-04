import { Router, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();

// Add meal log
router.post("/", authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { foodName, calories, protein, carbs, fat, imageUrl } = req.body;

        if (!foodName || !calories) {
            return res.status(400).json({ error: "Yemek adı ve kalori gerekli" });
        }

        const meal = await prisma.mealLog.create({
            data: {
                userId: req.userId!,
                foodName,
                calories,
                protein: protein || 0,
                carbs: carbs || 0,
                fat: fat || 0,
                imageUrl,
            },
        });

        res.status(201).json(meal);
    } catch (error) {
        console.error("Add meal error:", error);
        res.status(500).json({ error: "Öğün kaydedilemedi" });
    }
});

// Get today's meals
router.get("/today", authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const meals = await prisma.mealLog.findMany({
            where: {
                userId: req.userId,
                createdAt: { gte: today, lt: tomorrow },
            },
            orderBy: { createdAt: "desc" },
        });

        res.json(meals);
    } catch (error) {
        console.error("Get meals error:", error);
        res.status(500).json({ error: "Öğünler alınamadı" });
    }
});

// Delete meal
router.delete("/:id", authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const id = parseInt(req.params.id);

        await prisma.mealLog.deleteMany({
            where: {
                id,
                userId: req.userId,
            },
        });

        res.json({ message: "Silindi" });
    } catch (error) {
        console.error("Delete meal error:", error);
        res.status(500).json({ error: "Silinemedi" });
    }
});

// Add to favorites
router.post("/:id/favorite", authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const id = parseInt(req.params.id);

        const meal = await prisma.mealLog.findFirst({
            where: { id, userId: req.userId },
        });

        if (!meal) {
            return res.status(404).json({ error: "Öğün bulunamadı" });
        }

        const favorite = await prisma.favoriteMeal.create({
            data: {
                userId: req.userId!,
                foodName: meal.foodName,
                calories: meal.calories,
                protein: meal.protein || 0,
                carbs: meal.carbs || 0,
                fat: meal.fat || 0,
            },
        });

        res.status(201).json(favorite);
    } catch (error) {
        console.error("Add favorite error:", error);
        res.status(500).json({ error: "Favorilere eklenemedi" });
    }
});

// Get favorites
router.get("/favorites", authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const favorites = await prisma.favoriteMeal.findMany({
            where: { userId: req.userId },
            orderBy: { id: "desc" },
        });

        res.json(favorites);
    } catch (error) {
        console.error("Get favorites error:", error);
        res.status(500).json({ error: "Favoriler alınamadı" });
    }
});

export default router;
