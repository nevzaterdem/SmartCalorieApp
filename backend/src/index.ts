import express, { Request, Response } from "express";
import cors from "cors";
import multer from "multer";
import { analyzeImage, createDietPlan } from "./geminiService";

// Import routes
import authRoutes from "./routes/auth";
import dashboardRoutes from "./routes/dashboard";
import mealsRoutes from "./routes/meals";
import waterRoutes from "./routes/water";
import exerciseRoutes from "./routes/exercise";
import socialRoutes from "./routes/social";
import { authenticateToken, AuthRequest } from "./middleware/auth";

const app = express();
const upload = multer({ dest: "uploads/" });

// CORS Ayarı: Herkese İzin Ver
app.use(cors({ origin: "*" }));
app.use(express.json());

// KONTROL ROTASI: Tarayıcıdan girince bunu görmelisin
app.get("/", (req, res) => {
  res.json({
    status: "Backend Çalışıyor!",
    version: "2.0.0",
    endpoints: [
      "/auth/register",
      "/auth/login",
      "/dashboard/daily",
      "/meals",
      "/water",
      "/exercise",
      "/analyze",
      "/create-diet"
    ]
  });
});

// ============ AUTH ROUTES ============
app.use("/auth", authRoutes);

// ============ PROTECTED ROUTES ============
app.use("/dashboard", dashboardRoutes);
app.use("/meals", mealsRoutes);
app.use("/water", waterRoutes);
app.use("/exercise", exerciseRoutes);
app.use("/social", socialRoutes);

// ============ AI ROUTES (Keep original for backward compatibility) ============

// 1. Resim Analizi (Public for now - can add auth later)
app.post("/analyze", upload.single("image"), async (req: Request, res: Response): Promise<any> => {
  try {
    if (!req.file) return res.status(400).json({ error: "Resim yok" });
    const result = await analyzeImage(req.file.path);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Hata" });
  }
});

// 2. Diyet Programı (Public for now)
app.post("/create-diet", async (req: Request, res: Response): Promise<any> => {
  console.log("🔔 DİYET İSTEĞİ GELDİ!");
  try {
    const plan = await createDietPlan(req.body);
    res.json(plan);
  } catch (error) {
    console.error("Diyet Hatası:", error);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

// 3. Legacy meal logging (for backward compatibility)
app.post("/log-meal", (req, res) => {
  res.json({ msg: "OK" });
});

// ============ AUTHENTICATED AI ROUTES ============

// Analyze with user context
app.post("/analyze-auth", authenticateToken, upload.single("image"), async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (!req.file) return res.status(400).json({ error: "Resim yok" });
    const result = await analyzeImage(req.file.path);
    // Could save to user's meal log here
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Hata" });
  }
});

// Create diet with user profile
app.post("/create-diet-auth", authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const plan = await createDietPlan(req.body);
    res.json(plan);
  } catch (error) {
    console.error("Diyet Hatası:", error);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ SUNUCU BAŞLADI: http://127.0.0.1:${PORT}`);
  console.log("📍 Yeni Endpoints: /auth, /dashboard, /meals, /water, /exercise");
});