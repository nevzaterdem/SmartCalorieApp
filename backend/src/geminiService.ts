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
export const analyzeImage = async (imagePath: string, language: string = 'tr') => {
  return withRetry(async () => {
    try {
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString("base64");

      // gemini-2.5-flash: 2026 güncel model, görsel analiz destekli
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      // Dile göre prompt seçimi
      const prompts: { [key: string]: string } = {
        tr: `Bu yemeği analiz et. Tahmini porsiyon veya gramajı da belirle. SADECE JSON formatında cevap ver. Markdown yok.
          Örnek Format: [{"food_name": "Elma", "estimated_calories": 50, "protein": 0, "carbs": 10, "fat": 0, "estimated_amount": 100, "unit": "g"}]
          NOT: estimated_calories ve makrolar, tahmin ettiğin miktar (estimated_amount) içindir. Birim (unit) genellikle 'g' (gram) veya 'ml' olmalı.`,
        en: `Analyze this food. Also estimate the portion size or weight. Respond ONLY in JSON format. No markdown.
          Example Format: [{"food_name": "Apple", "estimated_calories": 50, "protein": 0, "carbs": 10, "fat": 0, "estimated_amount": 100, "unit": "g"}]
          NOTE: estimated_calories and macros are for the estimated amount. Unit should typically be 'g' (grams) or 'ml'.`
      };

      const prompt = prompts[language] || prompts['en'];

      const result = await model.generateContent([
        prompt,
        { inlineData: { data: base64Image, mimeType: "image/png" } },
      ]);

      const text = cleanJsonText(result.response.text());
      return JSON.parse(text);

    } catch (error: any) {
      console.error("📸 Resim Analiz Hatası (Detaylı):", JSON.stringify(error, null, 2));
      throw error;
    }
  });
};

// --- Fonksiyon 2: Haftalık Diyet Planı (7 Gün) ---
export const createDietPlan = async (userInfo: any, language: string = 'tr') => {
  return withRetry(async () => {
    try {
      // gemini-2.5-flash: 2026 güncel model
      console.log(`🤖 Yapay Zeka Devrede (Model: gemini-2.5-flash, Dil: ${language})...`);
      console.log(`📅 7 Günlük Haftalık Plan Oluşturuluyor...`);

      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      // Gün isimleri
      const dayNames = {
        tr: ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"],
        en: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
      };

      // Dile göre prompt seçimi
      const prompts: { [key: string]: string } = {
        tr: `
          Sen uzman bir diyetisyensin.
          Kullanıcı: ${userInfo.weight}kg, ${userInfo.height}cm, Cinsiyet: ${userInfo.gender}, Hedef: ${userInfo.goal}.
          
          Görevin: 7 GÜNLÜK (1 Haftalık) Diyet Programı hazırla.
          Her gün için FARKLI ve ÇEŞİTLİ yemekler öner. Tekrar yapma!
          Günlük kalori hedefi her gün yaklaşık aynı olmalı.
          
          ÇOK ÖNEMLİ KURAL: Cevabın SADECE ve SADECE saf JSON formatında olmalı. 
          Markdown kullanma. Başlangıçta veya sonda yazı yazma.
          
          İstenen JSON Formatı:
          {
            "daily_calories": 1500,
            "advice": "Bol su içmeyi unutma.",
            "days": {
              "monday": {
                "day_name": "Pazartesi",
                "breakfast": { "title": "Kahvaltı", "items": ["Yumurta", "Peynir", "Domates"], "calories": 350 },
                "lunch": { "title": "Öğle", "items": ["Izgara Tavuk", "Salata"], "calories": 450 },
                "snack": { "title": "Ara Öğün", "items": ["Elma", "Badem"], "calories": 150 },
                "dinner": { "title": "Akşam", "items": ["Mercimek Çorbası", "Tam Buğday Ekmek"], "calories": 400 }
              },
              "tuesday": { ... },
              "wednesday": { ... },
              "thursday": { ... },
              "friday": { ... },
              "saturday": { ... },
              "sunday": { ... }
            }
          }
          
          Her gün için tüm öğünleri doldur. Yemekler çeşitli ve sağlıklı olmalı.
        `,
        en: `
          You are an expert dietitian.
          User: ${userInfo.weight}kg, ${userInfo.height}cm, Gender: ${userInfo.gender}, Goal: ${userInfo.goal}.
          
          Your task: Create a 7-DAY (1 Week) Diet Plan.
          Suggest DIFFERENT and VARIED meals for each day. No repetition!
          Daily calorie target should be approximately the same each day.
          
          VERY IMPORTANT RULE: Your response must be ONLY and ONLY pure JSON format. 
          No markdown. No text before or after.
          
          Required JSON Format:
          {
            "daily_calories": 1500,
            "advice": "Don't forget to drink plenty of water.",
            "days": {
              "monday": {
                "day_name": "Monday",
                "breakfast": { "title": "Breakfast", "items": ["Eggs", "Cheese", "Tomato"], "calories": 350 },
                "lunch": { "title": "Lunch", "items": ["Grilled Chicken", "Salad"], "calories": 450 },
                "snack": { "title": "Snack", "items": ["Apple", "Almonds"], "calories": 150 },
                "dinner": { "title": "Dinner", "items": ["Lentil Soup", "Whole Wheat Bread"], "calories": 400 }
              },
              "tuesday": { ... },
              "wednesday": { ... },
              "thursday": { ... },
              "friday": { ... },
              "saturday": { ... },
              "sunday": { ... }
            }
          }
          
          Fill all meals for each day. Meals should be varied and healthy.
        `
      };

      const prompt = prompts[language] || prompts['en'];

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      console.log("📩 AI Cevabı Geldi! (7 Günlük Plan)");

      const cleanText = cleanJsonText(responseText);
      const plan = JSON.parse(cleanText);

      // Eski format uyumluluğu için ilk günü de ekle
      if (plan.days && plan.days.monday) {
        plan.breakfast = plan.days.monday.breakfast;
        plan.lunch = plan.days.monday.lunch;
        plan.snack = plan.days.monday.snack;
        plan.dinner = plan.days.monday.dinner;
        plan.total_calories = plan.daily_calories;
      }

      return plan;

    } catch (error: any) {
      console.error("❌ Model Hatası (Detaylı):", JSON.stringify(error, null, 2));
      throw new Error("Plan oluşturulamadı: " + error.message);
    }
  });
};