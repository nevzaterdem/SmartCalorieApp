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

// --- Fonksiyon 1: Resim Analizi ---
export const analyzeImage = async (imagePath: string) => {
  try {
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString("base64");
    
    // LİSTENDEN SEÇİLDİ: "gemini-flash-latest" (En güncel hızlı model)
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `Bu yemeği analiz et. SADECE JSON formatında cevap ver. Markdown yok.
      Örnek Format: [{"food_name": "Elma", "estimated_calories": 50, "protein": 0, "carbs": 10, "fat": 0}]`;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Image, mimeType: "image/png" } },
    ]);
    
    const text = cleanJsonText(result.response.text());
    return JSON.parse(text);

  } catch (error: any) {
    console.error("📸 Resim Analiz Hatası:", error.message);
    return { error: "Analiz başarısız oldu." };
  }
};

// --- Fonksiyon 2: Diyet Planı ---
export const createDietPlan = async (userInfo: any) => {
  try {
    // LİSTENDEN SEÇİLDİ: "gemini-flash-latest"
    console.log("🤖 Yapay Zeka Devrede (Model: gemini-flash-latest)...");
    
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    
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
    console.error("❌ Model Hatası:", error.message);
    throw new Error("Plan oluşturulamadı: " + error.message);
  }
};