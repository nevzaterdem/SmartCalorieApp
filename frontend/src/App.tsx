import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import {
  Loader2, ChefHat, Flame, Droplet,
  CalendarCheck, Sparkles, Camera,
  TrendingDown, TrendingUp, Dumbbell, Heart, Check, ArrowRight,
  Sun, Moon, Coffee, Sunrise, Zap, Target, LogIn, LayoutDashboard,
  Trophy, Bell, Users, X, ChevronRight, UserPlus, MessageCircle, Award
} from 'lucide-react';

// --- TYPE DEFINITIONS ---
interface FoodItem {
  food_name: string;
  estimated_calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface DietPlan {
  breakfast: { title: string; items: string[]; calories: number };
  lunch: { title: string; items: string[]; calories: number };
  snack: { title: string; items: string[]; calories: number };
  dinner: { title: string; items: string[]; calories: number };
  total_calories: number;
  advice: string;
}

const goals = [
  { id: 'Kilo Vermek', label: 'Kilo Ver', icon: TrendingDown, color: '#ef4444', deficit: -500 },
  { id: 'Kilo Almak', label: 'Kilo Al', icon: TrendingUp, color: '#22c55e', deficit: 500 },
  { id: 'Formu Korumak', label: 'Formu Koru', icon: Heart, color: '#3b82f6', deficit: 0 },
  { id: 'Kas Yapmak', label: 'Kas Yap', icon: Dumbbell, color: '#a855f7', deficit: 300 },
];

// Mock data
const mockMeals = [
  { id: 1, name: 'Kahvaltı - Yumurta & Peynir', calories: 320, protein: 18, carbs: 12, fat: 22, time: '08:30', emoji: '🍳' },
  { id: 2, name: 'Öğle - Tavuk Salata', calories: 450, protein: 35, carbs: 25, fat: 18, time: '12:45', emoji: '🥗' },
  { id: 3, name: 'Ara Öğün - Meyve', calories: 120, protein: 2, carbs: 28, fat: 0, time: '15:30', emoji: '🍎' },
];

const mockWaterLogs = [
  { id: 1, amount: 250, time: '07:00' },
  { id: 2, amount: 500, time: '09:30' },
  { id: 3, amount: 250, time: '12:00' },
  { id: 4, amount: 250, time: '15:00' },
];

const mockNotifications = [
  { id: 1, type: 'reminder', title: 'Su içme zamanı! 💧', desc: 'Günlük hedefinize 750ml kaldı', time: '5 dk önce', read: false },
  { id: 2, type: 'achievement', title: 'Yeni Rozet! 🏆', desc: '7 gün seri başarısı kazandınız', time: '1 saat önce', read: false },
  { id: 3, type: 'social', title: 'Ahmet sizi takip etti', desc: 'Arkadaş isteğinizi kabul etti', time: '2 saat önce', read: false },
  { id: 4, type: 'tip', title: 'Günlük İpucu 💡', desc: 'Kahvaltıda protein almayı unutmayın', time: '3 saat önce', read: true },
  { id: 5, type: 'reminder', title: 'Öğle yemeği zamanı! 🍽️', desc: 'Diyet planınıza göre yemek vakti', time: '5 saat önce', read: true },
];

const mockFriends = [
  { id: 1, name: 'Ahmet Yılmaz', avatar: '👨', streak: 15, calories: 1650, status: 'online', lastActive: 'Şimdi aktif' },
  { id: 2, name: 'Ayşe Demir', avatar: '👩', streak: 8, calories: 1420, status: 'online', lastActive: 'Şimdi aktif' },
  { id: 3, name: 'Mehmet Kaya', avatar: '👨‍🦱', streak: 22, calories: 1890, status: 'offline', lastActive: '2 saat önce' },
  { id: 4, name: 'Zeynep Öz', avatar: '👩‍🦰', streak: 5, calories: 1200, status: 'offline', lastActive: '1 gün önce' },
  { id: 5, name: 'Can Polat', avatar: '🧔', streak: 30, calories: 2100, status: 'online', lastActive: 'Şimdi aktif' },
];

const mockAchievements = [
  { id: 1, name: '7 Gün Seri', icon: '🔥', desc: 'Üst üste 7 gün hedef tutturma', earned: true },
  { id: 2, name: 'Su Canavarı', icon: '💧', desc: '7 gün boyunca su hedefini tuttur', earned: true },
  { id: 3, name: 'Fotoğrafçı', icon: '📸', desc: '50 yemek fotoğrafı analizi', earned: true },
  { id: 4, name: 'Disiplinli', icon: '🎯', desc: '30 gün seri başarısı', earned: false },
  { id: 5, name: 'Sosyal Kelebek', icon: '🦋', desc: '10 arkadaş ekle', earned: true },
  { id: 6, name: 'Kilometre Taşı', icon: '🏆', desc: '5 kg hedef tamamla', earned: true },
];

function App() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'analysis' | 'diet'>('analysis');
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FoodItem[] | null>(null);
  const [savedItems, setSavedItems] = useState<Set<number>>(new Set());
  const [dietLoading, setDietLoading] = useState(false);
  const [dietPlan, setDietPlan] = useState<DietPlan | null>(null);
  const [userInfo, setUserInfo] = useState({
    weight: '',
    height: '',
    gender: 'Erkek',
    goal: 'Kilo Vermek'
  });

  // Modal states
  const [showCalorieModal, setShowCalorieModal] = useState(false);
  const [showWaterModal, setShowWaterModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showFriendsModal, setShowFriendsModal] = useState(false);

  // Daily calorie tracking
  const [consumedCalories, setConsumedCalories] = useState(890);
  const dailyCalorieGoal = dietPlan?.total_calories || 2000;
  const remainingCalories = dailyCalorieGoal - consumedCalories;
  const calorieProgress = Math.min((consumedCalories / dailyCalorieGoal) * 100, 100);

  // Water state
  const [waterAmount, setWaterAmount] = useState(1250);
  const waterGoal = 2000;

  // Notifications
  const [notifications, setNotifications] = useState(mockNotifications);
  const unreadCount = notifications.filter(n => !n.read).length;

  // Get current goal info
  const currentGoal = goals.find(g => g.id === userInfo.goal);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
      setSavedItems(new Set());
    }
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setLoading(true);
    setResult(null);
    const formData = new FormData();
    formData.append('image', image);

    try {
      const response = await fetch('http://127.0.0.1:3000/analyze', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (Array.isArray(data)) {
        setResult(data);
        const newCalories = data.reduce((sum: number, item: FoodItem) => sum + item.estimated_calories, 0);
        setConsumedCalories(prev => prev + newCalories);
      } else {
        alert(`Hata: ${data.error || JSON.stringify(data)}`);
      }
    } catch (error) {
      console.error("Analiz Hatası:", error);
      alert("Sunucuya bağlanılamadı!");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDiet = async () => {
    if (!userInfo.weight || !userInfo.height) {
      alert("Lütfen kilo ve boy bilgilerinizi girin.");
      return;
    }
    setDietLoading(true);
    setDietPlan(null);

    try {
      const response = await fetch('http://127.0.0.1:3000/create-diet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userInfo),
      });
      const data = await response.json();

      if (data.breakfast) {
        setDietPlan(data);
      } else {
        alert("Plan oluşturulamadı: " + (data.error || "Bilinmeyen hata"));
      }
    } catch (error) {
      console.error("Diyet Hatası:", error);
      alert("Sunucu hatası!");
    } finally {
      setDietLoading(false);
    }
  };

  const handleSaveToDB = async (item: FoodItem, index: number) => {
    try {
      await fetch('http://127.0.0.1:3000/log-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      setSavedItems(prev => new Set(prev).add(index));
    } catch (error) {
      console.error("Kayıt Hatası:", error);
      alert("Kaydedilemedi!");
    }
  };

  const addWater = (amount: number) => {
    setWaterAmount(prev => Math.min(prev + amount, 5000));
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const totalCalories = result?.reduce((acc, item) => acc + item.estimated_calories, 0) || 0;
  const totalProtein = result?.reduce((acc, item) => acc + item.protein, 0) || 0;
  const totalCarbs = result?.reduce((acc, item) => acc + item.carbs, 0) || 0;
  const totalFat = result?.reduce((acc, item) => acc + item.fat, 0) || 0;

  return (
    <div className="min-h-screen max-w-md mx-auto bg-gray-50">
      {/* Mobile Header */}
      <header className="bg-white px-4 py-3 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2 rounded-xl">
            <ChefHat className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-lg font-black gradient-text">SmartCalorie</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Notifications Button */}
          <button
            onClick={() => setShowNotificationsModal(true)}
            className="relative p-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all"
          >
            <Bell size={18} className="text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Friends Button */}
          <button
            onClick={() => setShowFriendsModal(true)}
            className="relative p-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all"
          >
            <Users size={18} className="text-gray-600" />
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-indigo-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {mockFriends.length}
            </span>
          </button>

          {/* Login/Dashboard */}
          {user ? (
            <Link to="/dashboard" className="p-2 bg-emerald-100 rounded-xl">
              <LayoutDashboard size={18} className="text-emerald-600" />
            </Link>
          ) : (
            <Link to="/login" className="p-2 bg-emerald-500 rounded-xl">
              <LogIn size={18} className="text-white" />
            </Link>
          )}
        </div>
      </header>

      {/* Tab Switcher */}
      <div className="bg-white px-4 py-2 border-b border-gray-100">
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('analysis')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'analysis' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500'
              }`}
          >
            <Camera size={16} />
            Analiz
          </button>
          <button
            onClick={() => setActiveTab('diet')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'diet' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500'
              }`}
          >
            <CalendarCheck size={16} />
            Diyet
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="px-4 py-4 pb-24 space-y-4">

        {/* Daily Calorie Goal Widget */}
        <button
          onClick={() => setShowCalorieModal(true)}
          className="w-full bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-5 shadow-lg text-left hover:scale-[1.02] transition-transform"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-gray-400 text-xs mb-1">Günlük Hedef</p>
              <div className="flex items-center gap-2">
                {currentGoal && <currentGoal.icon size={18} style={{ color: currentGoal.color }} />}
                <span className="text-white font-bold">{currentGoal?.label || 'Hedef Seç'}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-black text-white">{dailyCalorieGoal}</p>
              <p className="text-gray-400 text-xs">kcal hedef</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20">
              <svg className="w-20 h-20 transform -rotate-90">
                <circle cx="40" cy="40" r="34" stroke="#374151" strokeWidth="6" fill="none" />
                <circle
                  cx="40" cy="40" r="34"
                  stroke={remainingCalories > 0 ? "#10b981" : "#ef4444"}
                  strokeWidth="6"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray="213.6"
                  strokeDashoffset={213.6 - (213.6 * calorieProgress / 100)}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Flame className="text-orange-400" size={14} />
                <span className="text-lg font-black text-white">{consumedCalories}</span>
              </div>
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-xs">Tüketilen</span>
                <span className="text-emerald-400 font-bold text-sm">{consumedCalories} kcal</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-xs">Hedef</span>
                <span className="text-gray-300 font-bold text-sm">{dailyCalorieGoal} kcal</span>
              </div>
              <div className="flex items-center justify-between border-t border-gray-700 pt-2">
                <span className="text-gray-400 text-xs">Kalan</span>
                <span className={`font-bold text-sm ${remainingCalories > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {remainingCalories > 0 ? remainingCalories : 0} kcal
                </span>
              </div>
            </div>
            <ChevronRight className="text-gray-500" size={20} />
          </div>

          <div className={`mt-4 p-3 rounded-xl ${remainingCalories > 0 ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
            <p className={`text-sm font-bold ${remainingCalories > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {remainingCalories > 0
                ? `✅ Hedefe ${remainingCalories} kcal kaldı`
                : `⚠️ Hedefinizi ${Math.abs(remainingCalories)} kcal aştınız`}
            </p>
          </div>
        </button>

        {/* Water & Progress Widgets */}
        <div className="grid grid-cols-2 gap-3">
          {/* Water Widget */}
          <button
            onClick={() => setShowWaterModal(true)}
            className="bg-white rounded-2xl p-4 shadow-sm text-left hover:scale-[1.02] transition-transform"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl flex items-center justify-center">
                <Droplet className="text-white" size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">Su Takibi</p>
                <p className="text-xs text-gray-500">{waterAmount} / {waterGoal} ml</p>
              </div>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full transition-all"
                style={{ width: `${Math.min((waterAmount / waterGoal) * 100, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>💧 {Math.round((waterAmount / waterGoal) * 100)}%</span>
              <ChevronRight size={14} />
            </div>
          </button>

          {/* Progress Widget */}
          <button
            onClick={() => setShowProgressModal(true)}
            className="bg-white rounded-2xl p-4 shadow-sm text-left hover:scale-[1.02] transition-transform"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
                <Trophy className="text-white" size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">İlerleme</p>
                <p className="text-xs text-gray-500">7 gün seri 🔥</p>
              </div>
            </div>
            <div className="flex gap-1 mb-2">
              {[1, 2, 3, 4, 5, 6, 7].map((_, i) => (
                <div key={i} className={`flex-1 h-6 rounded ${i < 6 ? 'bg-emerald-500' : 'bg-gray-200'} flex items-center justify-center`}>
                  {i < 6 && <Check size={10} className="text-white" />}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-end text-xs text-gray-400">
              <ChevronRight size={14} />
            </div>
          </button>
        </div>

        {/* ===== ANALYSIS TAB ===== */}
        {activeTab === 'analysis' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {!preview ? (
                <label className="block cursor-pointer">
                  <div className="p-8 text-center">
                    <div className="w-24 h-24 mx-auto bg-gradient-to-br from-emerald-500 to-teal-500 rounded-3xl flex items-center justify-center mb-4 shadow-xl">
                      <Camera className="w-12 h-12 text-white" />
                    </div>
                    <h3 className="text-xl font-black text-gray-800 mb-2">Yemek Fotoğrafı Çek</h3>
                    <p className="text-gray-500 text-sm mb-4">AI ile anında kalori hesapla ve hedefe ekle</p>

                    <div className="flex items-center justify-center gap-6 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Zap size={14} className="text-yellow-500" /> Hızlı</span>
                      <span className="flex items-center gap-1"><Target size={14} className="text-blue-500" /> Doğru</span>
                      <span className="flex items-center gap-1"><Sparkles size={14} className="text-purple-500" /> AI</span>
                    </div>
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                </label>
              ) : (
                <div>
                  <div className="relative h-56">
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <button
                      onClick={() => { setPreview(null); setImage(null); setResult(null); }}
                      className="absolute top-3 right-3 bg-white/20 backdrop-blur text-white px-4 py-2 rounded-xl text-sm font-bold"
                    >
                      Değiştir
                    </button>
                    <div className="absolute bottom-4 left-4 text-white">
                      <p className="text-sm opacity-80">Hazır!</p>
                      <p className="text-lg font-bold">Analiz için tıkla 📸</p>
                    </div>
                  </div>
                  {!result && (
                    <button
                      onClick={handleAnalyze}
                      disabled={loading}
                      className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-lg flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <><Loader2 className="animate-spin" size={20} /> Analiz Ediliyor...</>
                      ) : (
                        <><Sparkles size={20} /> AI ile Analiz Et</>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>

            {result && (
              <div className="space-y-3">
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-5 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-base font-bold">Analiz Sonucu</span>
                    <div className="flex items-center gap-2 bg-orange-500/20 px-4 py-2 rounded-xl">
                      <Flame className="text-orange-400" size={18} />
                      <span className="text-xl font-black text-orange-400">{totalCalories}</span>
                      <span className="text-orange-300/70 text-sm">kcal</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-blue-500/20 rounded-xl p-3 text-center">
                      <p className="text-lg font-bold text-blue-400">{totalProtein.toFixed(0)}g</p>
                      <p className="text-blue-300/60 text-xs">Protein</p>
                    </div>
                    <div className="bg-yellow-500/20 rounded-xl p-3 text-center">
                      <p className="text-lg font-bold text-yellow-400">{totalCarbs.toFixed(0)}g</p>
                      <p className="text-yellow-300/60 text-xs">Karbonhidrat</p>
                    </div>
                    <div className="bg-pink-500/20 rounded-xl p-3 text-center">
                      <p className="text-lg font-bold text-pink-400">{totalFat.toFixed(0)}g</p>
                      <p className="text-pink-300/60 text-xs">Yağ</p>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-emerald-500/20 rounded-xl">
                    <p className="text-emerald-400 text-sm font-bold text-center">
                      ✅ Günlük hedefinize eklendi
                    </p>
                  </div>
                </div>

                {result.map((item, index) => (
                  <div key={index} className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3">
                    <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center text-2xl">🍽️</div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-800 truncate">{item.food_name}</h4>
                      <p className="text-emerald-600 font-semibold text-sm">{item.estimated_calories} kcal</p>
                    </div>
                    <button
                      onClick={() => handleSaveToDB(item, index)}
                      disabled={savedItems.has(index)}
                      className={`px-4 py-2.5 rounded-xl font-bold text-sm ${savedItems.has(index) ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-500 text-white'
                        }`}
                    >
                      {savedItems.has(index) ? <Check size={16} /> : 'Kaydet'}
                    </button>
                  </div>
                ))}

                <button
                  onClick={() => { setImage(null); setPreview(null); setResult(null); setSavedItems(new Set()); }}
                  className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl"
                >
                  🔄 Yeni Analiz
                </button>
              </div>
            )}
          </div>
        )}

        {/* ===== DIET TAB ===== */}
        {activeTab === 'diet' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 mb-2 block">Kilo (kg)</label>
                  <input
                    type="number"
                    value={userInfo.weight}
                    onChange={(e) => setUserInfo({ ...userInfo, weight: e.target.value })}
                    className="w-full p-3.5 bg-gray-100 rounded-xl text-base font-semibold"
                    placeholder="75"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 mb-2 block">Boy (cm)</label>
                  <input
                    type="number"
                    value={userInfo.height}
                    onChange={(e) => setUserInfo({ ...userInfo, height: e.target.value })}
                    className="w-full p-3.5 bg-gray-100 rounded-xl text-base font-semibold"
                    placeholder="180"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 mb-2 block">Cinsiyet</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setUserInfo({ ...userInfo, gender: 'Erkek' })}
                    className={`py-3 rounded-xl font-bold ${userInfo.gender === 'Erkek' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                      }`}
                  >
                    👨 Erkek
                  </button>
                  <button
                    onClick={() => setUserInfo({ ...userInfo, gender: 'Kadın' })}
                    className={`py-3 rounded-xl font-bold ${userInfo.gender === 'Kadın' ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-600'
                      }`}
                  >
                    👩 Kadın
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 mb-2 block">Hedef</label>
                <div className="grid grid-cols-2 gap-2">
                  {goals.map((goal) => {
                    const Icon = goal.icon;
                    const isActive = userInfo.goal === goal.id;
                    return (
                      <button
                        key={goal.id}
                        onClick={() => setUserInfo({ ...userInfo, goal: goal.id })}
                        className={`p-3 rounded-xl flex items-center gap-2 font-bold text-sm ${isActive ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'
                          }`}
                      >
                        <Icon size={18} style={{ color: isActive ? 'white' : goal.color }} />
                        {goal.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={handleCreateDiet}
                disabled={dietLoading}
                className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl text-lg flex items-center justify-center gap-2"
              >
                {dietLoading ? (
                  <><Loader2 className="animate-spin" size={18} /> Hazırlanıyor...</>
                ) : (
                  <><Sparkles size={18} /> Diyet Planı Oluştur</>
                )}
              </button>
            </div>

            {dietPlan && (
              <div className="space-y-3">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl p-4 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold">AI Diyetisyen Hedefi</span>
                    <span className="text-2xl font-black">{dietPlan.total_calories} kcal</span>
                  </div>
                  <p className="text-emerald-100 text-sm">
                    {userInfo.goal === 'Kilo Vermek' && '📉 Kilo vermek için günlük kalori hedefiniz'}
                    {userInfo.goal === 'Kilo Almak' && '📈 Kilo almak için günlük kalori hedefiniz'}
                    {userInfo.goal === 'Formu Korumak' && '⚖️ Formunuzu korumak için günlük kalori hedefiniz'}
                    {userInfo.goal === 'Kas Yapmak' && '💪 Kas yapmak için günlük kalori hedefiniz'}
                  </p>
                </div>

                {[
                  { meal: dietPlan.breakfast, icon: Sunrise, title: 'Kahvaltı' },
                  { meal: dietPlan.lunch, icon: Sun, title: 'Öğle' },
                  { meal: dietPlan.snack, icon: Coffee, title: 'Ara Öğün' },
                  { meal: dietPlan.dinner, icon: Moon, title: 'Akşam' },
                ].map((item, i) => (
                  <div key={i} className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <item.icon size={18} className="text-gray-500" />
                        <span className="font-bold text-gray-800">{item.title}</span>
                      </div>
                      <span className="text-sm font-bold text-gray-500">{item.meal.calories} kcal</span>
                    </div>
                    <ul className="text-sm text-gray-600 space-y-1.5">
                      {item.meal.items.map((food, j) => (
                        <li key={j} className="flex items-center gap-2">
                          <ArrowRight size={12} className="text-gray-400" />
                          {food}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 max-w-md mx-auto">
        <div className="flex justify-around">
          <button onClick={() => setActiveTab('analysis')} className="flex flex-col items-center gap-1 p-2">
            <Camera size={22} className={activeTab === 'analysis' ? 'text-emerald-500' : 'text-gray-400'} />
            <span className={`text-xs font-bold ${activeTab === 'analysis' ? 'text-emerald-500' : 'text-gray-400'}`}>Analiz</span>
          </button>
          <button onClick={() => setShowCalorieModal(true)} className="flex flex-col items-center gap-1 p-2">
            <Flame size={22} className="text-gray-400" />
            <span className="text-xs font-medium text-gray-400">Kalori</span>
          </button>
          <button onClick={() => setShowWaterModal(true)} className="flex flex-col items-center gap-1 p-2">
            <Droplet size={22} className="text-gray-400" />
            <span className="text-xs font-medium text-gray-400">Su</span>
          </button>
          <button onClick={() => setActiveTab('diet')} className="flex flex-col items-center gap-1 p-2">
            <CalendarCheck size={22} className={activeTab === 'diet' ? 'text-purple-500' : 'text-gray-400'} />
            <span className={`text-xs font-bold ${activeTab === 'diet' ? 'text-purple-500' : 'text-gray-400'}`}>Diyet</span>
          </button>
        </div>
      </nav>

      {/* ===== ALL MODALS ===== */}

      {/* Calorie Detail Modal */}
      {showCalorieModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-md rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-gray-800">Günlük Kalori Takibi</h2>
              <button onClick={() => setShowCalorieModal(false)} className="p-2 bg-gray-100 rounded-xl">
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-5 text-white mb-6">
              <div className="flex items-center gap-3 mb-4">
                {currentGoal && <currentGoal.icon size={24} style={{ color: currentGoal.color }} />}
                <div>
                  <p className="text-gray-400 text-xs">Hedefin</p>
                  <p className="font-bold text-lg">{currentGoal?.label}</p>
                </div>
              </div>

              <div className="text-center mb-4">
                <p className="text-5xl font-black">{consumedCalories}</p>
                <p className="text-gray-400">/ {dailyCalorieGoal} kcal</p>
              </div>

              <div className="h-3 bg-gray-700 rounded-full overflow-hidden mb-4">
                <div
                  className={`h-full rounded-full transition-all ${remainingCalories > 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
                  style={{ width: `${calorieProgress}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-emerald-400 text-2xl font-black">{consumedCalories}</p>
                  <p className="text-gray-400 text-xs">Tüketilen</p>
                </div>
                <div className="text-center">
                  <p className={`text-2xl font-black ${remainingCalories > 0 ? 'text-white' : 'text-red-400'}`}>
                    {remainingCalories > 0 ? remainingCalories : 0}
                  </p>
                  <p className="text-gray-400 text-xs">Kalan</p>
                </div>
              </div>
            </div>

            <h3 className="font-bold text-gray-800 mb-3">Bugünkü Öğünler</h3>
            <div className="space-y-3 mb-6">
              {mockMeals.map((meal) => (
                <div key={meal.id} className="bg-gray-50 p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{meal.emoji}</span>
                      <div>
                        <p className="font-bold text-gray-800">{meal.name}</p>
                        <p className="text-gray-400 text-xs">{meal.time}</p>
                      </div>
                    </div>
                    <span className="font-bold text-emerald-600">{meal.calories} kcal</span>
                  </div>
                  <div className="flex gap-4 text-xs text-gray-500">
                    <span>P: {meal.protein}g</span>
                    <span>K: {meal.carbs}g</span>
                    <span>Y: {meal.fat}g</span>
                  </div>
                </div>
              ))}
            </div>

            {!dietPlan && (
              <div className="bg-purple-50 p-4 rounded-xl mb-6">
                <p className="text-purple-600 font-bold text-sm">💡 İpucu</p>
                <p className="text-purple-600 text-xs mt-1">
                  Kişiselleştirilmiş kalori hedefi için "Diyet" sekmesinden AI diyetisyenle plan oluşturun.
                </p>
              </div>
            )}

            <button
              onClick={() => setShowCalorieModal(false)}
              className="w-full py-4 bg-emerald-500 text-white font-bold rounded-xl"
            >
              Tamam
            </button>
          </div>
        </div>
      )}

      {/* Water Detail Modal */}
      {showWaterModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-md rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-gray-800">Su Takibi</h2>
              <button onClick={() => setShowWaterModal(false)} className="p-2 bg-gray-100 rounded-xl">
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-6 text-white mb-6 text-center">
              <Droplet size={48} className="mx-auto mb-2" />
              <p className="text-4xl font-black">{waterAmount} ml</p>
              <p className="text-blue-100">/ {waterGoal} ml hedef</p>
              <div className="h-3 bg-white/30 rounded-full mt-4 overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all"
                  style={{ width: `${Math.min((waterAmount / waterGoal) * 100, 100)}%` }}
                />
              </div>
            </div>

            <h3 className="font-bold text-gray-800 mb-3">Hızlı Ekle</h3>
            <div className="grid grid-cols-4 gap-2 mb-6">
              {[100, 200, 250, 500].map((amount) => (
                <button
                  key={amount}
                  onClick={() => addWater(amount)}
                  className="py-3 bg-blue-50 text-blue-600 rounded-xl font-bold text-sm hover:bg-blue-100"
                >
                  +{amount}ml
                </button>
              ))}
            </div>

            <h3 className="font-bold text-gray-800 mb-3">Bugünkü Kayıtlar</h3>
            <div className="space-y-2 mb-6">
              {mockWaterLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Droplet size={16} className="text-blue-500" />
                    <span className="font-bold text-gray-800">{log.amount} ml</span>
                  </div>
                  <span className="text-gray-400 text-sm">{log.time}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowWaterModal(false)}
              className="w-full py-4 bg-blue-500 text-white font-bold rounded-xl"
            >
              Tamam
            </button>
          </div>
        </div>
      )}

      {/* Progress & Achievements Modal */}
      {showProgressModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-md rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-gray-800">İlerleme & Rozetler</h2>
              <button onClick={() => setShowProgressModal(false)} className="p-2 bg-gray-100 rounded-xl">
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-6 text-white mb-6 text-center">
              <Trophy size={48} className="mx-auto mb-2" />
              <p className="text-4xl font-black">7 Gün</p>
              <p className="text-yellow-100">üst üste seri 🔥</p>
            </div>

            <h3 className="font-bold text-gray-800 mb-3">Bu Hafta</h3>
            <div className="grid grid-cols-7 gap-2 mb-6">
              {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((day, i) => (
                <div key={i} className="text-center">
                  <p className="text-xs text-gray-400 mb-2">{day}</p>
                  <div className={`w-full aspect-square rounded-xl flex items-center justify-center ${i < 6 ? 'bg-emerald-500' : 'bg-gray-200'
                    }`}>
                    {i < 6 && <Check size={16} className="text-white" />}
                  </div>
                </div>
              ))}
            </div>

            <h3 className="font-bold text-gray-800 mb-3">İstatistikler</h3>
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-emerald-50 p-4 rounded-xl text-center">
                <p className="text-2xl font-black text-emerald-600">28</p>
                <p className="text-xs text-gray-500">Toplam Gün</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-xl text-center">
                <p className="text-2xl font-black text-purple-600">5</p>
                <p className="text-xs text-gray-500">Rozet</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-xl text-center">
                <p className="text-2xl font-black text-orange-600">-3.2</p>
                <p className="text-xs text-gray-500">kg Bu Ay</p>
              </div>
            </div>

            <h3 className="font-bold text-gray-800 mb-3">Rozetler</h3>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {mockAchievements.map((badge) => (
                <div
                  key={badge.id}
                  className={`p-3 rounded-xl text-center ${badge.earned ? 'bg-yellow-50' : 'bg-gray-100 opacity-50'}`}
                >
                  <span className="text-3xl">{badge.icon}</span>
                  <p className="text-xs font-bold text-gray-700 mt-1">{badge.name}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowProgressModal(false)}
              className="w-full py-4 bg-emerald-500 text-white font-bold rounded-xl"
            >
              Tamam
            </button>
          </div>
        </div>
      )}

      {/* Notifications Modal */}
      {showNotificationsModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-md rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-gray-800">Bildirimler</h2>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllNotificationsRead}
                    className="text-xs text-emerald-600 font-bold"
                  >
                    Tümünü Okundu İşaretle
                  </button>
                )}
                <button onClick={() => setShowNotificationsModal(false)} className="p-2 bg-gray-100 rounded-xl">
                  <X size={20} className="text-gray-600" />
                </button>
              </div>
            </div>

            {notifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">Bildirim yok</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 rounded-xl ${notif.read ? 'bg-gray-50' : 'bg-blue-50 border-l-4 border-blue-500'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${notif.type === 'reminder' ? 'bg-blue-100' :
                          notif.type === 'achievement' ? 'bg-yellow-100' :
                            notif.type === 'social' ? 'bg-indigo-100' :
                              'bg-purple-100'
                        }`}>
                        {notif.type === 'reminder' && <Bell size={18} className="text-blue-500" />}
                        {notif.type === 'achievement' && <Trophy size={18} className="text-yellow-500" />}
                        {notif.type === 'social' && <Users size={18} className="text-indigo-500" />}
                        {notif.type === 'tip' && <Sparkles size={18} className="text-purple-500" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-800 text-sm">{notif.title}</p>
                        <p className="text-gray-500 text-xs mt-0.5">{notif.desc}</p>
                        <p className="text-gray-400 text-xs mt-1">{notif.time}</p>
                      </div>
                      {!notif.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowNotificationsModal(false)}
              className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl mt-6"
            >
              Kapat
            </button>
          </div>
        </div>
      )}

      {/* Friends Modal */}
      {showFriendsModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-md rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-gray-800">Arkadaşlar</h2>
              <button onClick={() => setShowFriendsModal(false)} className="p-2 bg-gray-100 rounded-xl">
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            {/* Add Friend */}
            <button className="w-full p-4 bg-indigo-50 text-indigo-600 rounded-xl font-bold flex items-center justify-center gap-2 mb-6">
              <UserPlus size={20} />
              Arkadaş Ekle
            </button>

            {/* Leaderboard */}
            <h3 className="font-bold text-gray-800 mb-3">Haftalık Liderlik 🏆</h3>
            <div className="space-y-3 mb-6">
              {mockFriends.sort((a, b) => b.streak - a.streak).slice(0, 3).map((friend, i) => (
                <div key={friend.id} className={`p-4 rounded-xl flex items-center gap-3 ${i === 0 ? 'bg-yellow-50 border border-yellow-200' :
                    i === 1 ? 'bg-gray-100' :
                      'bg-gray-50'
                  }`}>
                  <span className="text-2xl font-black text-gray-400">#{i + 1}</span>
                  <span className="text-3xl">{friend.avatar}</span>
                  <div className="flex-1">
                    <p className="font-bold text-gray-800">{friend.name}</p>
                    <p className="text-xs text-gray-500">{friend.streak} gün seri 🔥</p>
                  </div>
                  {i === 0 && <span className="text-2xl">🥇</span>}
                  {i === 1 && <span className="text-2xl">🥈</span>}
                  {i === 2 && <span className="text-2xl">🥉</span>}
                </div>
              ))}
            </div>

            {/* All Friends */}
            <h3 className="font-bold text-gray-800 mb-3">Tüm Arkadaşlar ({mockFriends.length})</h3>
            <div className="space-y-3">
              {mockFriends.map((friend) => (
                <div key={friend.id} className="p-4 bg-gray-50 rounded-xl flex items-center gap-3">
                  <div className="relative">
                    <span className="text-3xl">{friend.avatar}</span>
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${friend.status === 'online' ? 'bg-emerald-500' : 'bg-gray-400'
                      }`}></div>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-800">{friend.name}</p>
                    <p className="text-xs text-gray-500">{friend.lastActive}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-gray-800">{friend.calories} kcal</p>
                    <p className="text-xs text-orange-500">{friend.streak} 🔥</p>
                  </div>
                  <button className="p-2 bg-gray-200 rounded-lg hover:bg-gray-300">
                    <MessageCircle size={16} className="text-gray-600" />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowFriendsModal(false)}
              className="w-full py-4 bg-indigo-500 text-white font-bold rounded-xl mt-6"
            >
              Tamam
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;