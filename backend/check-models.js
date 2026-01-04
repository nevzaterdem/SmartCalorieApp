require('dotenv').config(); // .env dosyasındaki şifreyi alır

const apiKey = process.env.GEMINI_API_KEY;
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

console.log("🔍 Google API'ye soruluyor: Hangi modeller açık?");
console.log("------------------------------------------------");

fetch(url)
  .then(response => response.json())
  .then(data => {
    if (data.error) {
        console.error("❌ HATA:", data.error.message);
    } else if (data.models) {
        console.log("✅ İŞTE SENİN KULLANABİLECEĞİN MODELLER:\n");
        
        // Sadece 'generateContent' (metin üretme) yeteneği olanları filtrele
        const usableModels = data.models.filter(m => 
            m.supportedGenerationMethods.includes("generateContent")
        );

        usableModels.forEach(model => {
            // "models/gemini-pro" kısmındaki "models/" i atıp temiz ismi yazalım
            console.log(`👉 ${model.name.replace("models/", "")}`);
        });

        console.log("\n------------------------------------------------");
        console.log("TAVSİYE: Yukarıdaki listeden 'gemini' ile başlayan birini seç.");
        console.log("Örneğin: 'gemini-1.5-flash' veya 'gemini-pro'");
    } else {
        console.log("🤔 Garip bir cevap döndü:", data);
    }
  })
  .catch(error => console.error("Bağlantı Hatası:", error));