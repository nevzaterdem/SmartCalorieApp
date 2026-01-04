// backend/test-models.js
require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
  try {
    console.log("🔍 Modeller aranıyor...");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); 
    // Sadece bağlantıyı test etmek için rastgele bir model çağırmıyoruz,
    // Google'ın bize sunduğu listeyi çekmeye çalışıyoruz ama
    // SDK'de doğrudan listeleme yoksa basit bir 'generate' denemesi yapacağız.
    
    // Basit bir "Merhaba" testi yapalım
    const result = await model.generateContent("Merhaba");
    const response = await result.response;
    console.log("✅ BAŞARILI! 'gemini-1.5-flash' çalışıyor.");
    console.log("Cevap:", response.text());
  } catch (error) {
    console.error("❌ HATA: Model çalışmadı.");
    console.error("Hata Detayı:", error.message);
  }
}

listModels();