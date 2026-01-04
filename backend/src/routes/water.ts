import { Router, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();

// Add water log
router.post("/", authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { amount } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: "Geçerli bir miktar girin (ml)" });
        }

        const waterLog = await prisma.waterLog.create({
            data: {
                userId: req.userId!,
                amount,
            },
        });

        res.status(201).json(waterLog);
    } catch (error) {
        console.error("Add water error:", error);
        res.status(500).json({ error: "Su kaydedilemedi" });
    }
});

// Get today's water logs
router.get("/today", authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const waterLogs = await prisma.waterLog.findMany({
            where: {
                userId: req.userId,
                createdAt: { gte: today, lt: tomorrow },
            },
            orderBy: { createdAt: "desc" },
        });

        const total = waterLogs.reduce((sum, w) => sum + w.amount, 0);

        res.json({ logs: waterLogs, total });
    } catch (error) {
        console.error("Get water error:", error);
        res.status(500).json({ error: "Su kayıtları alınamadı" });
    }
});

// Delete water log
router.delete("/:id", authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const id = parseInt(req.params.id);

        await prisma.waterLog.deleteMany({
            where: {
                id,
                userId: req.userId,
            },
        });

        res.json({ message: "Silindi" });
    } catch (error) {
        console.error("Delete water error:", error);
        res.status(500).json({ error: "Silinemedi" });
    }
});

export default router;
