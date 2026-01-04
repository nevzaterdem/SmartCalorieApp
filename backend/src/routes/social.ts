import express from "express";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import { PrismaClient, Prisma } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

// Arkadaş Ara (Email, İsim veya ID ile)
router.post("/search", authenticateToken, async (req: AuthRequest, res: any) => {
    const { query } = req.body; // Can be email, name, or ID
    if (!query) return res.status(400).json({ error: "Arama terimi gerekli" });

    try {
        // Check if query is a number (ID search)
        const isIdSearch = /^\d+$/.test(query);

        let users;
        if (isIdSearch) {
            // Search by ID
            const user = await prisma.user.findUnique({
                where: { id: parseInt(query) },
                select: { id: true, name: true, email: true }
            });
            users = user && user.id !== req.userId ? [user] : [];
        } else {
            // Search by name or email
            users = await prisma.user.findMany({
                where: {
                    OR: [
                        { email: { contains: query, mode: 'insensitive' as Prisma.QueryMode } },
                        { name: { contains: query, mode: 'insensitive' as Prisma.QueryMode } }
                    ],
                    NOT: { id: req.userId } // Exclude self
                },
                select: { id: true, name: true, email: true },
                take: 10
            });
        }
        res.json(users);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Arama hatası" });
    }
});

// Takip Et
router.post("/follow", authenticateToken, async (req: AuthRequest, res: any) => {
    const { targetId } = req.body;
    const userId = req.userId;

    if (!userId) return res.status(401).json({ error: "Giriş yapmalısınız" });
    if (userId === targetId) return res.status(400).json({ error: "Kendini takip edemezsin" });

    try {
        await prisma.friendship.create({
            data: {
                followerId: userId,
                followingId: targetId
            }
        });
        res.json({ msg: "Takip edildi" });
    } catch (e) {
        res.status(400).json({ error: "Zaten takip ediyorsun veya hata" });
    }
});

// Takibi Bırak
router.post("/unfollow", authenticateToken, async (req: AuthRequest, res: any) => {
    const { targetId } = req.body;
    const userId = req.userId;

    if (!userId) return res.status(401).json({ error: "Giriş yapmalısınız" });

    try {
        await prisma.friendship.delete({
            where: {
                followerId_followingId: {
                    followerId: userId,
                    followingId: targetId
                }
            }
        });
        res.json({ msg: "Takip bırakıldı" });
    } catch (e) {
        res.status(400).json({ error: "Hata" });
    }
});

// Arkadaşlarım (Takip Ettiklerim)
router.get("/friends", authenticateToken, async (req: AuthRequest, res: any) => {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: "Giriş yapmalısınız" });

    try {
        const following = await prisma.friendship.findMany({
            where: { followerId: userId },
            include: {
                following: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        mealLogs: {
                            where: {
                                createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
                            },
                            select: { calories: true }
                        }
                    }
                }
            }
        });

        const friends = following.map((f: any) => ({
            id: f.following.id,
            name: f.following.name || "Anonim",
            email: f.following.email,
            avatar: "👤",
            calories: f.following.mealLogs.reduce((acc: number, m: any) => acc + m.calories, 0),
            status: "online"
        }));

        res.json(friends);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Hata" });
    }
});

// Liderlik Tablosu
router.get("/leaderboard", authenticateToken, async (req: AuthRequest, res: any) => {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: "Giriş yapmalısınız" });

    try {
        // Takip ettiklerim + ben
        const following = await prisma.friendship.findMany({
            where: { followerId: userId },
            select: { followingId: true }
        });

        const ids = following.map((f: any) => f.followingId);
        ids.push(userId); // Add self

        // Get stats
        const users = await prisma.user.findMany({
            where: { id: { in: ids } },
            select: {
                id: true,
                name: true,
                achievements: true,
                mealLogs: {
                    where: {
                        createdAt: {
                            gte: new Date(new Date().setHours(0, 0, 0, 0))
                        }
                    },
                    select: { calories: true }
                }
            }
        });

        // Format
        const leaderboard = users.map((u: any) => ({
            id: u.id,
            name: u.name || "Anonim",
            calories: u.mealLogs.reduce((acc: number, curr: any) => acc + curr.calories, 0),
            streak: u.achievements.length * 2, // Mock streak logic from achievements
            avatar: "👤"
        })).sort((a: any, b: any) => b.calories - a.calories);

        res.json(leaderboard);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Hata" });
    }
});

export default router;
