// API Configuration
import AsyncStorage from '@react-native-async-storage/async-storage';

// Local development - use your computer's IP address
// For production, update to your deployed backend URL (e.g., render.com)
export const API_BASE_URL = "http://192.168.1.42:3000";

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

export interface UserProfile {
    id: number;
    email: string;
    name: string;
    weight?: number;
    height?: number;
    dailyCalorieGoal?: number;
    streak?: number;
}

// Helper function to get auth headers
async function getHeaders(): Promise<HeadersInit> {
    const token = await AsyncStorage.getItem("authToken");
    return {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {})
    };
}

// Helper function to convert image URI to base64
async function uriToBase64(uri: string): Promise<string> {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            resolve(base64.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

// ============ AI FUNCTIONS ============

export async function analyzeImage(imageUri: string): Promise<FoodItem[]> {
    const formData = new FormData();

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

// ============ MEAL FUNCTIONS ============

export async function logMeal(item: FoodItem): Promise<{ msg: string }> {
    const headers = await getHeaders();
    const payload = {
        foodName: item.name,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat
    };

    const response = await fetch(`${API_BASE_URL}/meals`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Kaydetme başarısız oldu");
    }

    return response.json();
}

export async function getTodayMeals(): Promise<any[]> {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}/meals/today`, { headers });
    if (!response.ok) return [];
    return response.json();
}

export async function deleteMeal(id: number): Promise<void> {
    const headers = await getHeaders();
    await fetch(`${API_BASE_URL}/meals/${id}`, {
        method: "DELETE",
        headers,
    });
}

// ============ WATER FUNCTIONS ============

export async function addWaterLog(amount: number): Promise<any> {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}/water`, {
        method: "POST",
        headers,
        body: JSON.stringify({ amount }),
    });
    if (!response.ok) throw new Error("Su kaydedilemedi");
    return response.json();
}

export async function getWaterLogs(): Promise<{ logs: any[]; total: number }> {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}/water/today`, { headers });
    if (!response.ok) return { logs: [], total: 0 };
    return response.json();
}

// ============ DASHBOARD FUNCTIONS ============

export async function getDailyStats(): Promise<{
    calories: { consumed: number; goal: number; remaining: number };
    water: { consumed: number; goal: number };
    streak: number;
    todayMeals: any[];
}> {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}/dashboard/daily`, { headers });
    if (!response.ok) {
        // Return defaults if failed
        return {
            calories: { consumed: 0, goal: 2000, remaining: 2000 },
            water: { consumed: 0, goal: 2000 },
            streak: 0,
            todayMeals: []
        };
    }
    return response.json();
}

// ============ SOCIAL FUNCTIONS ============

export async function searchUser(query: string) {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE_URL}/social/search`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query })
    });
    if (!res.ok) throw new Error("Kullanıcı bulunamadı");
    return res.json();
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

export async function getFriends() {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE_URL}/social/friends`, { headers });
    if (!res.ok) return [];
    return res.json();
}

// ============ PROFILE FUNCTIONS ============

export async function updateProfile(data: {
    name?: string;
    weight?: number;
    height?: number;
    age?: number;
    dailyCalorieGoal?: number;
}): Promise<any> {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: "PUT",
        headers,
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Profil güncellenemedi");
    return response.json();
}

export async function getProfile(): Promise<UserProfile | null> {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}/auth/profile`, { headers });
    if (!response.ok) return null;
    return response.json();
}

// ============ CALORIE GOAL CALCULATOR ============

export function calculateDailyCalorieGoal(
    weight: number,
    height: number,
    age: number,
    gender: 'male' | 'female',
    goal: 'lose' | 'maintain' | 'gain' | 'muscle'
): number {
    // Harris-Benedict Equation for BMR
    let bmr: number;
    if (gender === 'male') {
        bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
    } else {
        bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
    }

    // Activity multiplier (assuming moderate activity)
    const tdee = bmr * 1.55;

    // Adjust based on goal
    switch (goal) {
        case 'lose':
            return Math.round(tdee - 500); // 500 cal deficit
        case 'gain':
            return Math.round(tdee + 300); // 300 cal surplus
        case 'muscle':
            return Math.round(tdee + 400); // More for muscle building
        case 'maintain':
        default:
            return Math.round(tdee);
    }
}

// ============ STREAK FUNCTIONS ============

export async function getStreak(): Promise<number> {
    const headers = await getHeaders();
    try {
        const response = await fetch(`${API_BASE_URL}/dashboard/streak`, { headers });
        if (!response.ok) return 0;
        const data = await response.json();
        return data.streak || 0;
    } catch {
        return 0;
    }
}

// Helper to check if user is logged in
export async function isAuthenticated(): Promise<boolean> {
    const token = await AsyncStorage.getItem("authToken");
    return !!token;
}

// Logout helper
export async function logout(): Promise<void> {
    await AsyncStorage.multiRemove([
        "authToken",
        "userId",
        "userName",
        "userEmail"
    ]);
}

// ============ DIET PLAN FUNCTIONS ============

export interface SavedDietPlan {
    id: number;
    breakfast: {
        title: string;
        items: string[];
        calories: number;
        completed?: boolean;
    };
    lunch: {
        title: string;
        items: string[];
        calories: number;
        completed?: boolean;
    };
    snack: {
        title: string;
        items: string[];
        calories: number;
        completed?: boolean;
    };
    dinner: {
        title: string;
        items: string[];
        calories: number;
        completed?: boolean;
    };
    total_calories: number;
    advice: string;
    createdAt?: string;
}

export interface DietProgress {
    completedMeals: string[];
    completedCalories: number;
    totalMeals: number;
    totalCalories: number;
}

// Diyet planı oluştur ve kaydet
export async function createAndSaveDietPlan(userInfo: UserInfo): Promise<SavedDietPlan> {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}/diet/create`, {
        method: "POST",
        headers,
        body: JSON.stringify(userInfo),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Diyet planı oluşturulamadı");
    }

    return response.json();
}

// Aktif diyet planını getir
export async function getActiveDietPlan(): Promise<{ plan: SavedDietPlan | null; todayProgress: DietProgress | null }> {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}/diet/active`, { headers });

    if (!response.ok) {
        return { plan: null, todayProgress: null };
    }

    return response.json();
}

// Öğünü tamamla
export async function completeDietMeal(mealType: 'breakfast' | 'lunch' | 'snack' | 'dinner', completed: boolean = true): Promise<{
    success: boolean;
    message: string;
    mealType: string;
    calories?: number;
}> {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}/diet/complete-meal`, {
        method: "POST",
        headers,
        body: JSON.stringify({ mealType, completed }),
    });

    if (!response.ok) {
        throw new Error("Öğün güncellenemedi");
    }

    return response.json();
}

// Diyet geçmişini getir
export async function getDietHistory(): Promise<{
    history: Array<{
        id: number;
        goal: string;
        totalCalories: number;
        isActive: boolean;
        createdAt: string;
        completionRate: number;
    }>;
}> {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}/diet/history`, { headers });

    if (!response.ok) {
        return { history: [] };
    }

    return response.json();
}
