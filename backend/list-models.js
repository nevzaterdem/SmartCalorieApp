require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

fetch(url)
    .then(response => response.json())
    .then(data => {
        if (data.models) {
            console.log("Mevcut modeller:");
            data.models
                .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent"))
                .filter(m => m.name.includes("gemini"))
                .forEach(m => console.log(m.name.replace("models/", "")));
        } else {
            console.log("Hata:", JSON.stringify(data));
        }
    });
