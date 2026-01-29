import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import * as fs from "fs";

dotenv.config();

// API Key Kontrolü
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ HATA: .env dosyasında GEMINI_API_KEY bulunamadı!");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// --- YARDIMCI: JSON Temizleyici ---
function cleanJsonText(text: string): string {
  return text.replace(/```json/g, "").replace(/```/g, "").trim();
}

// --- YARDIMCI: Retry Fonksiyonu ---
async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0 && (error.message?.includes("503") || error.message?.includes("overloaded"))) {
      console.log(`⚠️ Model yoğun, ${delay}ms sonra tekrar deneniyor... (Kalan deneme: ${retries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

// --- Fonksiyon 1: Resim Analizi ---
export const analyzeImage = async (imagePath: string) => {
  return withRetry(async () => {
    try {
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString("base64");

      // gemini-2.5-flash: 2026 güncel model, görsel analiz destekli
      // Hem görsel hem metin destekler, hızlı ve güvenilir
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `Bu yemeği analiz et. Tahmini porsiyon veya gramajı da belirle. SADECE JSON formatında cevap ver. Markdown yok.
        Örnek Format: [{"food_name": "Elma", "estimated_calories": 50, "protein": 0, "carbs": 10, "fat": 0, "estimated_amount": 100, "unit": "g"}]
        NOT: estimated_calories ve makrolar, tahmin ettiğin miktar (estimated_amount) içindir. Birim (unit) genellikle 'g' (gram) veya 'ml' olmalı.`;

      const result = await model.generateContent([
        prompt,
        { inlineData: { data: base64Image, mimeType: "image/png" } },
      ]);

      const text = cleanJsonText(result.response.text());
      return JSON.parse(text);

    } catch (error: any) {
      console.error("📸 Resim Analiz Hatası (Detaylı):", JSON.stringify(error, null, 2));
      throw error; // Retry için hatayı fırlat
    }
  });
};

// --- Fonksiyon 2: Diyet Planı ---
export const createDietPlan = async (userInfo: any) => {
  return withRetry(async () => {
    try {
      // gemini-2.5-flash: 2026 güncel model
      // Hızlı, güvenilir ve metin üretimi için optimize
      console.log("🤖 Yapay Zeka Devrede (Model: gemini-2.5-flash)...");

      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `
        Sen uzman bir diyetisyensin.
        Kullanıcı: ${userInfo.weight}kg, ${userInfo.height}cm, Cinsiyet: ${userInfo.gender}, Hedef: ${userInfo.goal}.
        
        Görevin: 1 Günlük Örnek Diyet Listesi hazırla.
        
        ÇOK ÖNEMLİ KURAL: Cevabın SADECE ve SADECE saf JSON formatında olmalı. 
        Markdown kullanma. Başlangıçta veya sonda yazı yazma.
        
        İstenen JSON Formatı:
        {
          "breakfast": { "title": "Sabah", "items": ["Yumurta", "Peynir"], "calories": 300 },
          "lunch": { "title": "Öğle", "items": ["Tavuk", "Salata"], "calories": 500 },
          "snack": { "title": "Ara Öğün", "items": ["Elma"], "calories": 100 },
          "dinner": { "title": "Akşam", "items": ["Çorba"], "calories": 400 },
          "total_calories": 1300,
          "advice": "Bol su içmeyi unutma."
        }
      `;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      console.log("📩 AI Cevabı Geldi!");

      const cleanText = cleanJsonText(responseText);
      return JSON.parse(cleanText);

    } catch (error: any) {
      console.error("❌ Model Hatası (Detaylı):", JSON.stringify(error, null, 2));
      throw new Error("Plan oluşturulamadı: " + error.message);
    }
  });
};