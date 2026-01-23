import { Router, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import { createDietPlan as generateDietPlan } from "../geminiService";

const router = Router();
const prisma = new PrismaClient();

// Yeni diyet planı oluştur ve kaydet
router.post("/create", authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.userId!;
        const { weight, height, gender, goal } = req.body;

        if (!weight || !height || !gender || !goal) {
            return res.status(400).json({ error: "Eksik bilgi" });
        }

        // AI ile diyet planı oluştur
        const plan = await generateDietPlan({ weight, height, gender, goal });

        if (!plan.breakfast) {
            return res.status(500).json({ error: "Plan oluşturulamadı" });
        }

        // Önceki aktif planları deaktive et
        await prisma.dietPlan.updateMany({
            where: { userId, isActive: true },
            data: { isActive: false }
        });

        // Yeni planı veritabanına kaydet
        const savedPlan = await prisma.dietPlan.create({
            data: {
                userId,
                weight: parseFloat(weight),
                height: parseFloat(height),
                gender,
                goal,
                breakfastItems: JSON.stringify(plan.breakfast.items || []),
                breakfastCals: plan.breakfast.calories || 0,
                lunchItems: JSON.stringify(plan.lunch.items || []),
                lunchCals: plan.lunch.calories || 0,
                snackItems: JSON.stringify(plan.snack.items || []),
                snackCals: plan.snack.calories || 0,
                dinnerItems: JSON.stringify(plan.dinner.items || []),
                dinnerCals: plan.dinner.calories || 0,
                totalCalories: plan.total_calories || 0,
                advice: plan.advice || "Bol su içmeyi unutmayın!"
            }
        });

        // Kullanıcının kalori hedefini güncelle
        await prisma.user.update({
            where: { id: userId },
            data: { dailyCalorieGoal: plan.total_calories }
        });

        // Formatlanmış plan döndür
        res.json({
            id: savedPlan.id,
            breakfast: {
                title: "Kahvaltı",
                items: plan.breakfast.items || [],
                calories: plan.breakfast.calories || 0
            },
            lunch: {
                title: "Öğle Yemeği",
                items: plan.lunch.items || [],
                calories: plan.lunch.calories || 0
            },
            snack: {
                title: "Ara Öğün",
                items: plan.snack.items || [],
                calories: plan.snack.calories || 0
            },
            dinner: {
                title: "Akşam Yemeği",
                items: plan.dinner.items || [],
                calories: plan.dinner.calories || 0
            },
            total_calories: plan.total_calories || 0,
            advice: plan.advice || "Bol su içmeyi unutmayın!"
        });

    } catch (error: any) {
        console.error("Diyet oluşturma hatası:", error);
        res.status(500).json({ error: "Diyet planı oluşturulamadı: " + error.message });
    }
});

// Aktif diyet planını getir
router.get("/active", authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.userId!;

        const activePlan = await prisma.dietPlan.findFirst({
            where: { userId, isActive: true },
            include: {
                completions: {
                    where: {
                        date: {
                            gte: new Date(new Date().setHours(0, 0, 0, 0))
                        }
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        if (!activePlan) {
            return res.json({ plan: null });
        }

        // Bugünkü tamamlanmış öğünler
        const completedMeals: string[] = activePlan.completions.map((c: { mealType: string }) => c.mealType);

        res.json({
            plan: {
                id: activePlan.id,
                breakfast: {
                    title: "Kahvaltı",
                    items: JSON.parse(activePlan.breakfastItems),
                    calories: activePlan.breakfastCals,
                    completed: completedMeals.includes("breakfast")
                },
                lunch: {
                    title: "Öğle Yemeği",
                    items: JSON.parse(activePlan.lunchItems),
                    calories: activePlan.lunchCals,
                    completed: completedMeals.includes("lunch")
                },
                snack: {
                    title: "Ara Öğün",
                    items: JSON.parse(activePlan.snackItems),
                    calories: activePlan.snackCals,
                    completed: completedMeals.includes("snack")
                },
                dinner: {
                    title: "Akşam Yemeği",
                    items: JSON.parse(activePlan.dinnerItems),
                    calories: activePlan.dinnerCals,
                    completed: completedMeals.includes("dinner")
                },
                total_calories: activePlan.totalCalories,
                advice: activePlan.advice,
                createdAt: activePlan.createdAt
            },
            todayProgress: {
                completedMeals,
                completedCalories: completedMeals.reduce((sum: number, meal: string) => {
                    switch (meal) {
                        case "breakfast": return sum + activePlan.breakfastCals;
                        case "lunch": return sum + activePlan.lunchCals;
                        case "snack": return sum + activePlan.snackCals;
                        case "dinner": return sum + activePlan.dinnerCals;
                        default: return sum;
                    }
                }, 0),
                totalMeals: 4,
                totalCalories: activePlan.totalCalories
            }
        });

    } catch (error: any) {
        console.error("Diyet getirme hatası:", error);
        res.status(500).json({ error: "Diyet planı alınamadı" });
    }
});

// Öğünü tamamla / tamamlanmadı işaretle
router.post("/complete-meal", authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.userId!;
        const { mealType, completed = true } = req.body;

        if (!["breakfast", "lunch", "snack", "dinner"].includes(mealType)) {
            return res.status(400).json({ error: "Geçersiz öğün tipi" });
        }

        // Aktif planı bul
        const activePlan = await prisma.dietPlan.findFirst({
            where: { userId, isActive: true }
        });

        if (!activePlan) {
            return res.status(404).json({ error: "Aktif diyet planı bulunamadı" });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (completed) {
            // Öğünü tamamlandı olarak işaretle
            await prisma.dietMealCompletion.upsert({
                where: {
                    dietPlanId_mealType_date: {
                        dietPlanId: activePlan.id,
                        mealType,
                        date: today
                    }
                },
                update: { completed: true },
                create: {
                    dietPlanId: activePlan.id,
                    mealType,
                    date: today,
                    completed: true
                }
            });

            // İlgili kaloriyi meal log'a ekle
            let calories = 0;
            let items = "";
            switch (mealType) {
                case "breakfast":
                    calories = activePlan.breakfastCals;
                    items = activePlan.breakfastItems;
                    break;
                case "lunch":
                    calories = activePlan.lunchCals;
                    items = activePlan.lunchItems;
                    break;
                case "snack":
                    calories = activePlan.snackCals;
                    items = activePlan.snackItems;
                    break;
                case "dinner":
                    calories = activePlan.dinnerCals;
                    items = activePlan.dinnerItems;
                    break;
            }

            // Öğünü meal log'a kaydet
            const mealNames: { [key: string]: string } = {
                breakfast: "Kahvaltı",
                lunch: "Öğle Yemeği",
                snack: "Ara Öğün",
                dinner: "Akşam Yemeği"
            };

            await prisma.mealLog.create({
                data: {
                    userId,
                    foodName: `${mealNames[mealType]} (Diyet)`,
                    calories,
                    protein: 0,
                    carbs: 0,
                    fat: 0
                }
            });

            res.json({
                success: true,
                message: `${mealNames[mealType]} tamamlandı!`,
                mealType,
                calories
            });
        } else {
            // Öğünü tamamlanmadı olarak işaretle (sil)
            await prisma.dietMealCompletion.deleteMany({
                where: {
                    dietPlanId: activePlan.id,
                    mealType,
                    date: today
                }
            });

            res.json({
                success: true,
                message: "Öğün işareti kaldırıldı",
                mealType
            });
        }

    } catch (error: any) {
        console.error("Öğün tamamlama hatası:", error);
        res.status(500).json({ error: "Öğün güncellenemedi" });
    }
});

// Diyet geçmişi
router.get("/history", authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.userId!;

        const plans = await prisma.dietPlan.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: 10,
            include: {
                completions: true
            }
        });

        const history = plans.map((plan: any) => ({
            id: plan.id,
            goal: plan.goal,
            totalCalories: plan.totalCalories,
            isActive: plan.isActive,
            createdAt: plan.createdAt,
            completionRate: plan.completions.length > 0
                ? Math.round((plan.completions.length / 4) * 100)
                : 0
        }));

        res.json({ history });

    } catch (error: any) {
        console.error("Diyet geçmişi hatası:", error);
        res.status(500).json({ error: "Geçmiş alınamadı" });
    }
});

export default router;
