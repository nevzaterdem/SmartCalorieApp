import express, { Response } from "express";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

// Tüm rozet tanımlamaları
const ACHIEVEMENT_DEFINITIONS = [
    // Başlangıç Rozetleri
    { type: "first_meal", name: "İlk Adım", icon: "🚀", description: "İlk yemeğini kaydet", category: "başlangıç" },
    { type: "first_water", name: "Su Kurbağası", icon: "🐸", description: "İlk su kaydını yap", category: "başlangıç" },
    { type: "first_diet", name: "Planlı Yaşam", icon: "📋", description: "İlk diyet planını oluştur", category: "başlangıç" },
    { type: "first_photo", name: "Fotoğrafçı", icon: "📸", description: "İlk yemek fotoğrafını analiz et", category: "başlangıç" },

    // Seri Rozetleri
    { type: "streak_3", name: "3 Gün Seri", icon: "🔥", description: "3 gün üst üste yemek kaydet", category: "seri" },
    { type: "streak_7", name: "Haftalık Şampiyon", icon: "🏆", description: "7 gün üst üste yemek kaydet", category: "seri" },
    { type: "streak_14", name: "2 Hafta Ustası", icon: "⭐", description: "14 gün üst üste yemek kaydet", category: "seri" },
    { type: "streak_30", name: "Aylık Efsane", icon: "👑", description: "30 gün üst üste yemek kaydet", category: "seri" },

    // Su Rozetleri
    { type: "water_goal_1", name: "Su Ustası", icon: "💧", description: "Günlük su hedefine ulaş", category: "su" },
    { type: "water_goal_7", name: "Hidrasyon Kralı", icon: "🌊", description: "7 gün su hedefini tamamla", category: "su" },

    // Kalori Rozetleri
    { type: "calorie_goal_1", name: "Dengeli Beslenme", icon: "⚖️", description: "Günlük kalori hedefine ulaş", category: "kalori" },
    { type: "calorie_goal_7", name: "Kalori Uzmanı", icon: "🎯", description: "7 gün kalori hedefini tamamla", category: "kalori" },

    // Sosyal Rozetler
    { type: "first_friend", name: "Sosyal Kelebek", icon: "🦋", description: "İlk arkadaşını ekle", category: "sosyal" },
    { type: "friends_5", name: "Popüler", icon: "🌟", description: "5 arkadaş edin", category: "sosyal" },

    // Özel Rozetler
    { type: "diet_complete", name: "Diyet Tamamlayıcı", icon: "✅", description: "Bir günlük diyet planını tamamla", category: "özel" },
    { type: "meals_10", name: "Kayıt Ustası", icon: "📝", description: "10 yemek kaydet", category: "özel" },
    { type: "meals_50", name: "Veri Canavarı", icon: "📊", description: "50 yemek kaydet", category: "özel" },
    { type: "meals_100", name: "Kalori Dedektifi", icon: "🔍", description: "100 yemek kaydet", category: "özel" },
];

// Kullanıcının başarılarını getir
router.get("/", authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: "Giriş yapmalısınız" });

    try {
        // Kullanıcının kazandığı rozetler
        const userAchievements = await prisma.achievement.findMany({
            where: { userId },
            select: { type: true, unlockedAt: true }
        });

        const unlockedTypes = new Set(userAchievements.map(a => a.type));

        // Tüm rozetleri döndür (kazanılmış ve kazanılmamış)
        const achievements = ACHIEVEMENT_DEFINITIONS.map(def => ({
            ...def,
            earned: unlockedTypes.has(def.type),
            unlockedAt: userAchievements.find(a => a.type === def.type)?.unlockedAt || null
        }));

        // Kategorilere göre grupla
        const grouped = {
            başlangıç: achievements.filter(a => a.category === "başlangıç"),
            seri: achievements.filter(a => a.category === "seri"),
            su: achievements.filter(a => a.category === "su"),
            kalori: achievements.filter(a => a.category === "kalori"),
            sosyal: achievements.filter(a => a.category === "sosyal"),
            özel: achievements.filter(a => a.category === "özel"),
        };

        const earnedCount = achievements.filter(a => a.earned).length;
        const totalCount = achievements.length;

        res.json({
            achievements,
            grouped,
            stats: {
                earned: earnedCount,
                total: totalCount,
                percentage: Math.round((earnedCount / totalCount) * 100)
            }
        });
    } catch (error) {
        console.error("Achievements error:", error);
        res.status(500).json({ error: "Başarılar alınamadı" });
    }
});

// Başarıları kontrol et ve otomatik olarak ver
router.post("/check", authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: "Giriş yapmalısınız" });

    try {
        const newAchievements: string[] = [];

        // Mevcut rozetleri al
        const existing = await prisma.achievement.findMany({
            where: { userId },
            select: { type: true }
        });
        const existingTypes = new Set(existing.map(a => a.type));

        // Yemek sayısı kontrolü
        const mealCount = await prisma.mealLog.count({ where: { userId } });

        if (mealCount >= 1 && !existingTypes.has("first_meal")) {
            await prisma.achievement.create({ data: { userId, type: "first_meal" } });
            newAchievements.push("first_meal");
        }
        if (mealCount >= 10 && !existingTypes.has("meals_10")) {
            await prisma.achievement.create({ data: { userId, type: "meals_10" } });
            newAchievements.push("meals_10");
        }
        if (mealCount >= 50 && !existingTypes.has("meals_50")) {
            await prisma.achievement.create({ data: { userId, type: "meals_50" } });
            newAchievements.push("meals_50");
        }
        if (mealCount >= 100 && !existingTypes.has("meals_100")) {
            await prisma.achievement.create({ data: { userId, type: "meals_100" } });
            newAchievements.push("meals_100");
        }

        // Su kaydı kontrolü
        const waterCount = await prisma.waterLog.count({ where: { userId } });
        if (waterCount >= 1 && !existingTypes.has("first_water")) {
            await prisma.achievement.create({ data: { userId, type: "first_water" } });
            newAchievements.push("first_water");
        }

        // Diyet planı kontrolü
        const dietCount = await prisma.dietPlan.count({ where: { userId } });
        if (dietCount >= 1 && !existingTypes.has("first_diet")) {
            await prisma.achievement.create({ data: { userId, type: "first_diet" } });
            newAchievements.push("first_diet");
        }

        // Arkadaş kontrolü
        const friendCount = await prisma.friendship.count({ where: { followerId: userId } });
        if (friendCount >= 1 && !existingTypes.has("first_friend")) {
            await prisma.achievement.create({ data: { userId, type: "first_friend" } });
            newAchievements.push("first_friend");
        }
        if (friendCount >= 5 && !existingTypes.has("friends_5")) {
            await prisma.achievement.create({ data: { userId, type: "friends_5" } });
            newAchievements.push("friends_5");
        }

        // Streak kontrolü
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { streak: true } });
        const streak = user?.streak || 0;

        if (streak >= 3 && !existingTypes.has("streak_3")) {
            await prisma.achievement.create({ data: { userId, type: "streak_3" } });
            newAchievements.push("streak_3");
        }
        if (streak >= 7 && !existingTypes.has("streak_7")) {
            await prisma.achievement.create({ data: { userId, type: "streak_7" } });
            newAchievements.push("streak_7");
        }
        if (streak >= 14 && !existingTypes.has("streak_14")) {
            await prisma.achievement.create({ data: { userId, type: "streak_14" } });
            newAchievements.push("streak_14");
        }
        if (streak >= 30 && !existingTypes.has("streak_30")) {
            await prisma.achievement.create({ data: { userId, type: "streak_30" } });
            newAchievements.push("streak_30");
        }

        // Günlük su hedefi kontrolü
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayWater = await prisma.waterLog.aggregate({
            where: { userId, createdAt: { gte: today } },
            _sum: { amount: true }
        });

        const userGoal = await prisma.user.findUnique({ where: { id: userId }, select: { dailyWaterGoal: true } });
        if ((todayWater._sum.amount || 0) >= (userGoal?.dailyWaterGoal || 2000) && !existingTypes.has("water_goal_1")) {
            await prisma.achievement.create({ data: { userId, type: "water_goal_1" } });
            newAchievements.push("water_goal_1");
        }

        // Kazanılan yeni rozetlerin detaylarını döndür
        const newAchievementDetails = ACHIEVEMENT_DEFINITIONS.filter(d => newAchievements.includes(d.type));

        res.json({
            newAchievements: newAchievementDetails,
            count: newAchievements.length
        });
    } catch (error) {
        console.error("Achievement check error:", error);
        res.status(500).json({ error: "Başarı kontrolü başarısız" });
    }
});

// Fotoğraf analizi rozetini ver
router.post("/photo-analyzed", authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: "Giriş yapmalısınız" });

    try {
        const existing = await prisma.achievement.findFirst({
            where: { userId, type: "first_photo" }
        });

        if (!existing) {
            await prisma.achievement.create({ data: { userId, type: "first_photo" } });
            const badge = ACHIEVEMENT_DEFINITIONS.find(d => d.type === "first_photo");
            return res.json({ newAchievement: badge });
        }

        res.json({ newAchievement: null });
    } catch (error) {
        res.status(500).json({ error: "Hata" });
    }
});

export default router;
