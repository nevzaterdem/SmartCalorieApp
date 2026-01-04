// API Configuration
// TODO: Deploy backend to Render.com and update this URL
const API_BASE_URL = "http://192.168.1.147:3000"; // Local development - change to your IP

// Types
interface ApiFoodItem {
    food_name: string;
    estimated_calories: number;
    protein: number;
    carbs: number;
    fat: number;
}

export interface FoodItem {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
}

export interface DietPlan {
    breakfast: { title: string; items: string[]; calories: number };
    lunch: { title: string; items: string[]; calories: number };
    snack: { title: string; items: string[]; calories: number };
    dinner: { title: string; items: string[]; calories: number };
    total_calories: number;
    advice: string;
}

export interface UserInfo {
    weight: string;
    height: string;
    gender: string;
    goal: string;
}

// Helper function to convert image URI to base64
async function uriToBase64(uri: string): Promise<string> {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            resolve(base64.split(",")[1]); // Remove data:image/...;base64, prefix
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

// API Functions
export async function analyzeImage(imageUri: string): Promise<FoodItem[]> {
    const formData = new FormData();

    // Get the file name and type from URI
    const uriParts = imageUri.split(".");
    const fileType = uriParts[uriParts.length - 1];

    formData.append("image", {
        uri: imageUri,
        name: `photo.${fileType}`,
        type: `image/${fileType}`,
    } as unknown as Blob);

    const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: "POST",
        body: formData,
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });

    if (!response.ok) {
        throw new Error("Analiz başarısız oldu");
    }

    const data: ApiFoodItem[] = await response.json();

    return data.map(item => ({
        name: item.food_name,
        calories: item.estimated_calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat
    }));
}

export async function createDietPlan(userInfo: UserInfo): Promise<DietPlan> {
    const response = await fetch(`${API_BASE_URL}/create-diet`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(userInfo),
    });

    if (!response.ok) {
        throw new Error("Diyet planı oluşturulamadı");
    }

    return response.json();
}

// Food & Meal APIs
export async function logMeal(item: FoodItem): Promise<{ msg: string }> {
    const payload = {
        foodName: item.name,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat
    };

    // Now pointing to real backend route (which has soft-auth)
    const response = await fetch(`${API_BASE_URL}/meals`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        throw new Error("Kaydetme başarısız oldu");
    }

    return response.json();
}

export async function getTodayMeals(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/meals/today`);
    if (!response.ok) throw new Error("Öğünler alınamadı");
    return response.json();
}

// Water APIs
export async function addWaterLog(amount: number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/water`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
    });
    if (!response.ok) throw new Error("Su kaydedilemedi");
    return response.json();
}

export async function getWaterLogs(): Promise<{ logs: any[]; total: number }> {
    const response = await fetch(`${API_BASE_URL}/water/today`);
    if (!response.ok) throw new Error("Su verisi alınamadı");
    return response.json();
}

// Export base URL for debugging
export { API_BASE_URL };

// AUTH & HEADERS
import AsyncStorage from '@react-native-async-storage/async-storage';

async function getHeaders() {
    const token = await AsyncStorage.getItem("authToken");
    return {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {})
    };
}

// SOCIAL API
export async function searchUser(query: string) {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE_URL}/social/search`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query })
    });
    if (!res.ok) throw new Error("Kullanıcı bulunamadı");
    return res.json(); // Returns array of users now
}

export async function followUser(targetId: number) {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE_URL}/social/follow`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ targetId })
    });
    if (!res.ok) throw new Error("Takip edilemedi");
    return res.json();
}

export async function getLeaderboard() {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE_URL}/social/leaderboard`, { headers });
    if (!res.ok) return [];
    return res.json();
}
