import { Router, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();

// Get daily summary
router.get("/daily", authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.userId!;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Get user's goals
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { dailyCalorieGoal: true, dailyWaterGoal: true },
        });

        // Get today's meals
        const meals = await prisma.mealLog.findMany({
            where: {
                userId,
                createdAt: { gte: today, lt: tomorrow },
            },
        });

        // Get today's water
        const waterLogs = await prisma.waterLog.findMany({
            where: {
                userId,
                createdAt: { gte: today, lt: tomorrow },
            },
        });

        // Get today's exercises
        const exercises = await prisma.exercise.findMany({
            where: {
                userId,
                createdAt: { gte: today, lt: tomorrow },
            },
        });

        // Calculate totals
        const totalCaloriesIn = meals.reduce((sum, m) => sum + m.calories, 0);
        const totalProtein = meals.reduce((sum, m) => sum + (m.protein || 0), 0);
        const totalCarbs = meals.reduce((sum, m) => sum + (m.carbs || 0), 0);
        const totalFat = meals.reduce((sum, m) => sum + (m.fat || 0), 0);
        const totalWater = waterLogs.reduce((sum, w) => sum + w.amount, 0);
        const totalCaloriesBurned = exercises.reduce((sum, e) => sum + e.caloriesBurned, 0);
        const netCalories = totalCaloriesIn - totalCaloriesBurned;

        res.json({
            date: today.toISOString().split("T")[0],
            calories: {
                consumed: totalCaloriesIn,
                burned: totalCaloriesBurned,
                net: netCalories,
                goal: user?.dailyCalorieGoal || 2000,
            },
            macros: {
                protein: Math.round(totalProtein),
                carbs: Math.round(totalCarbs),
                fat: Math.round(totalFat),
            },
            water: {
                consumed: totalWater,
                goal: user?.dailyWaterGoal || 2000,
            },
            meals: meals.map((m) => ({
                id: m.id,
                foodName: m.foodName,
                calories: m.calories,
                time: m.createdAt,
            })),
            exercises: exercises.map((e) => ({
                id: e.id,
                name: e.name,
                duration: e.duration,
                caloriesBurned: e.caloriesBurned,
            })),
        });
    } catch (error) {
        console.error("Daily summary error:", error);
        res.status(500).json({ error: "Günlük özet alınamadı" });
    }
});

// Get weekly stats
router.get("/weekly", authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.userId!;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);

        // Get meals for the week
        const meals = await prisma.mealLog.findMany({
            where: {
                userId,
                createdAt: { gte: weekAgo },
            },
            orderBy: { createdAt: "asc" },
        });

        // Group by day
        const dailyData: { [key: string]: number } = {};
        for (let i = 0; i < 7; i++) {
            const date = new Date(weekAgo);
            date.setDate(date.getDate() + i);
            dailyData[date.toISOString().split("T")[0]] = 0;
        }

        meals.forEach((meal) => {
            const dateKey = meal.createdAt.toISOString().split("T")[0];
            if (dailyData[dateKey] !== undefined) {
                dailyData[dateKey] += meal.calories;
            }
        });

        res.json({
            weeklyCalories: Object.entries(dailyData).map(([date, calories]) => ({
                date,
                calories,
            })),
            averageCalories: Math.round(
                Object.values(dailyData).reduce((a, b) => a + b, 0) / 7
            ),
        });
    } catch (error) {
        console.error("Weekly stats error:", error);
        res.status(500).json({ error: "Haftalık istatistikler alınamadı" });
    }
});

// Get streak (consecutive days with meals logged)
router.get("/streak", authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.userId!;

        // Get all meal dates for the user
        const meals = await prisma.mealLog.findMany({
            where: { userId },
            select: { createdAt: true },
            orderBy: { createdAt: "desc" },
        });

        if (meals.length === 0) {
            return res.json({ streak: 0 });
        }

        // Calculate streak
        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get unique dates
        const dates = new Set<string>();
        meals.forEach(meal => {
            dates.add(meal.createdAt.toISOString().split("T")[0]);
        });

        // Check consecutive days backwards from today
        let checkDate = new Date(today);
        while (true) {
            const dateStr = checkDate.toISOString().split("T")[0];
            if (dates.has(dateStr)) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else if (streak === 0) {
                // If today has no meals, check yesterday
                checkDate.setDate(checkDate.getDate() - 1);
                const yesterdayStr = checkDate.toISOString().split("T")[0];
                if (dates.has(yesterdayStr)) {
                    streak++;
                    checkDate.setDate(checkDate.getDate() - 1);
                } else {
                    break;
                }
            } else {
                break;
            }
        }

        // Update user's streak in database
        await prisma.user.update({
            where: { id: userId },
            data: { streak },
        });

        res.json({ streak });
    } catch (error) {
        console.error("Streak error:", error);
        res.status(500).json({ error: "Seri hesaplanamadı", streak: 0 });
    }
});

export default router;
