import React, { useState, useEffect } from 'react';
import { useAuth, API_URL } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import {
    Flame, Droplet, Dumbbell, Plus, TrendingUp,
    Utensils, ChevronRight, Loader2, LogOut, User,
    Target, Bell, Users, Trophy, Calendar, Heart,
    Activity, Timer, Footprints, Bike, Waves, Check,
    MessageCircle, UserPlus, Award, Zap
} from 'lucide-react';

interface DailyData {
    date: string;
    calories: {
        consumed: number;
        burned: number;
        net: number;
        goal: number;
    };
    macros: {
        protein: number;
        carbs: number;
        fat: number;
    };
    water: {
        consumed: number;
        goal: number;
    };
    meals: Array<{ id: number; foodName: string; calories: number; time: string }>;
    exercises: Array<{ id: number; name: string; duration: number; caloriesBurned: number }>;
}

const exerciseTypes = [
    { name: 'Yürüyüş', icon: Footprints, color: '#22c55e' },
    { name: 'Koşu', icon: Activity, color: '#ef4444' },
    { name: 'Bisiklet', icon: Bike, color: '#3b82f6' },
    { name: 'Yüzme', icon: Waves, color: '#06b6d4' },
];

const mockNotifications = [
    { id: 1, type: 'reminder', text: 'Öğle yemeği zamanı! 🍽️', time: '12:00' },
    { id: 2, type: 'achievement', text: '7 gün üst üste giriş yaptın! 🎉', time: '10:30' },
    { id: 3, type: 'water', text: 'Su içmeyi unutma 💧', time: '09:00' },
];

const mockFriends = [
    { id: 1, name: 'Ahmet', avatar: '👨', streak: 12, calories: 1850 },
    { id: 2, name: 'Ayşe', avatar: '👩', streak: 8, calories: 1620 },
    { id: 3, name: 'Mehmet', avatar: '👨‍🦱', streak: 5, calories: 2100 },
];

export default function Dashboard() {
    const { user, token, logout } = useAuth();
    const [data, setData] = useState<DailyData | null>(null);
    const [loading, setLoading] = useState(true);
    const [addingWater, setAddingWater] = useState(false);
    const [showExerciseModal, setShowExerciseModal] = useState(false);
    const [selectedExercise, setSelectedExercise] = useState('');
    const [exerciseDuration, setExerciseDuration] = useState('');

    useEffect(() => {
        fetchDailyData();
    }, []);

    const fetchDailyData = async () => {
        try {
            const res = await fetch(`${API_URL}/dashboard/daily`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                setData(await res.json());
            }
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const addWater = async (amount: number) => {
        setAddingWater(true);
        try {
            await fetch(`${API_URL}/water`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ amount }),
            });
            fetchDailyData();
        } catch (error) {
            console.error('Add water error:', error);
        } finally {
            setAddingWater(false);
        }
    };

    const addExercise = async () => {
        if (!selectedExercise || !exerciseDuration) return;
        try {
            await fetch(`${API_URL}/exercise`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: selectedExercise,
                    duration: parseInt(exerciseDuration)
                }),
            });
            setShowExerciseModal(false);
            setSelectedExercise('');
            setExerciseDuration('');
            fetchDailyData();
        } catch (error) {
            console.error('Add exercise error:', error);
        }
    };

    const calorieProgress = data ? Math.min((data.calories.consumed / data.calories.goal) * 100, 100) : 0;
    const waterProgress = data ? Math.min((data.water.consumed / data.water.goal) * 100, 100) : 0;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-emerald-500" size={48} />
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-24">
            {/* Background */}
            <div className="fixed inset-0 -z-10 overflow-hidden">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30" />
            </div>

            {/* Header */}
            <header className="glass sticky top-0 z-50 border-b border-white/20">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 text-sm">Hoş geldin,</p>
                        <h1 className="text-xl font-bold text-gray-800">{user?.name || 'Kullanıcı'}</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link to="/" className="p-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all">
                            <Utensils size={20} className="text-gray-600" />
                        </Link>
                        <button onClick={logout} className="p-2 bg-red-50 rounded-xl hover:bg-red-100 transition-all">
                            <LogOut size={20} className="text-red-500" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-6">
                {/* Main Grid Layout */}
                <div className="grid lg:grid-cols-3 gap-6">

                    {/* Left Column - Main Stats */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Calorie Card */}
                        <div className="card-elevated bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 text-white">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold">Günlük Kalori</h2>
                                <span className="text-gray-400 text-sm">{new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                            </div>

                            <div className="flex items-center gap-8">
                                <div className="relative w-32 h-32">
                                    <svg className="w-32 h-32 transform -rotate-90">
                                        <circle cx="64" cy="64" r="56" stroke="#374151" strokeWidth="12" fill="none" />
                                        <circle
                                            cx="64" cy="64" r="56"
                                            stroke="url(#gradient)"
                                            strokeWidth="12"
                                            fill="none"
                                            strokeLinecap="round"
                                            strokeDasharray={`${calorieProgress * 3.52} 352`}
                                        />
                                        <defs>
                                            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                <stop offset="0%" stopColor="#10b981" />
                                                <stop offset="100%" stopColor="#34d399" />
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <Flame className="text-orange-400 mb-1" size={20} />
                                        <span className="text-2xl font-black">{data?.calories.consumed || 0}</span>
                                        <span className="text-gray-400 text-xs">/ {data?.calories.goal || 2000}</span>
                                    </div>
                                </div>

                                <div className="flex-1 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-400 text-sm">Alınan</span>
                                        <span className="text-emerald-400 font-bold">{data?.calories.consumed || 0} kcal</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-400 text-sm">Yakılan</span>
                                        <span className="text-orange-400 font-bold">{data?.calories.burned || 0} kcal</span>
                                    </div>
                                    <div className="flex items-center justify-between border-t border-gray-700 pt-2">
                                        <span className="text-gray-400 text-sm">Net</span>
                                        <span className="text-white font-bold">{data?.calories.net || 0} kcal</span>
                                    </div>
                                </div>
                            </div>

                            {/* Macros */}
                            <div className="grid grid-cols-3 gap-3 mt-6">
                                <div className="bg-blue-500/20 rounded-xl p-3 text-center">
                                    <p className="text-blue-400 text-xl font-bold">{data?.macros.protein || 0}g</p>
                                    <p className="text-blue-300/60 text-xs">Protein</p>
                                </div>
                                <div className="bg-yellow-500/20 rounded-xl p-3 text-center">
                                    <p className="text-yellow-400 text-xl font-bold">{data?.macros.carbs || 0}g</p>
                                    <p className="text-yellow-300/60 text-xs">Karbonhidrat</p>
                                </div>
                                <div className="bg-pink-500/20 rounded-xl p-3 text-center">
                                    <p className="text-pink-400 text-xl font-bold">{data?.macros.fat || 0}g</p>
                                    <p className="text-pink-300/60 text-xs">Yağ</p>
                                </div>
                            </div>
                        </div>

                        {/* Water & Exercise Row */}
                        <div className="grid md:grid-cols-2 gap-4">
                            {/* Water Card */}
                            <div className="card-elevated bg-white rounded-2xl p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                            <Droplet className="text-blue-500" size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-800">Su Takibi</h3>
                                            <p className="text-gray-500 text-xs">{data?.water.consumed || 0} / {data?.water.goal || 2000} ml</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-4">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-500"
                                        style={{ width: `${waterProgress}%` }}
                                    />
                                </div>

                                <div className="flex gap-2">
                                    {[250, 500, 1000].map((amount) => (
                                        <button
                                            key={amount}
                                            onClick={() => addWater(amount)}
                                            disabled={addingWater}
                                            className="flex-1 py-2 px-2 bg-blue-50 text-blue-600 rounded-xl font-bold text-xs hover:bg-blue-100 transition-all flex items-center justify-center gap-1"
                                        >
                                            <Plus size={14} />
                                            {amount}ml
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Exercise Card */}
                            <div className="card-elevated bg-white rounded-2xl p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                                            <Dumbbell className="text-orange-500" size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-800">Egzersiz</h3>
                                            <p className="text-gray-500 text-xs">{data?.calories.burned || 0} kcal yakıldı</p>
                                        </div>
                                    </div>
                                </div>

                                {data?.exercises && data.exercises.length > 0 ? (
                                    <div className="space-y-2 mb-4">
                                        {data.exercises.slice(0, 2).map((ex) => (
                                            <div key={ex.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-xl">
                                                <span className="font-medium text-gray-700 text-sm">{ex.name}</span>
                                                <span className="text-orange-500 font-bold text-xs">{ex.caloriesBurned} kcal</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-400 text-sm mb-4">Bugün henüz egzersiz yok</p>
                                )}

                                <button
                                    onClick={() => setShowExerciseModal(true)}
                                    className="w-full py-2 bg-orange-50 text-orange-600 rounded-xl font-bold text-sm hover:bg-orange-100 transition-all flex items-center justify-center gap-1"
                                >
                                    <Plus size={16} />
                                    Egzersiz Ekle
                                </button>
                            </div>
                        </div>

                        {/* Progress Tracking */}
                        <div className="card-elevated bg-white rounded-2xl p-5">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                                        <TrendingUp className="text-purple-500" size={20} />
                                    </div>
                                    <h3 className="font-bold text-gray-800">İlerleme Takibi</h3>
                                </div>
                                <span className="text-emerald-500 font-bold text-sm flex items-center gap-1">
                                    <Trophy size={16} />
                                    7 Gün Seri
                                </span>
                            </div>

                            {/* Weekly Progress */}
                            <div className="grid grid-cols-7 gap-2 mb-4">
                                {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((day, i) => (
                                    <div key={day} className="text-center">
                                        <p className="text-gray-400 text-xs mb-2">{day}</p>
                                        <div className={`w-full aspect-square rounded-lg flex items-center justify-center ${i < 5 ? 'bg-emerald-100' : i === 5 ? 'bg-emerald-500' : 'bg-gray-100'
                                            }`}>
                                            {i <= 5 && <Check size={16} className={i === 5 ? 'text-white' : 'text-emerald-500'} />}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Stats Row */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-3 rounded-xl text-center">
                                    <p className="text-2xl font-black text-emerald-600">12</p>
                                    <p className="text-gray-500 text-xs">Toplam Gün</p>
                                </div>
                                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-3 rounded-xl text-center">
                                    <p className="text-2xl font-black text-purple-600">3</p>
                                    <p className="text-gray-500 text-xs">Rozet</p>
                                </div>
                                <div className="bg-gradient-to-br from-orange-50 to-red-50 p-3 rounded-xl text-center">
                                    <p className="text-2xl font-black text-orange-600">-2.5</p>
                                    <p className="text-gray-500 text-xs">kg Bu Ay</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Side Widgets */}
                    <div className="space-y-6">
                        {/* Notifications */}
                        <div className="card-elevated bg-white rounded-2xl p-5">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                                        <Bell className="text-red-500" size={20} />
                                    </div>
                                    <h3 className="font-bold text-gray-800">Bildirimler</h3>
                                </div>
                                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">3</span>
                            </div>

                            <div className="space-y-3">
                                {mockNotifications.map((notif) => (
                                    <div key={notif.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${notif.type === 'reminder' ? 'bg-blue-100' :
                                                notif.type === 'achievement' ? 'bg-yellow-100' : 'bg-cyan-100'
                                            }`}>
                                            {notif.type === 'reminder' ? <Calendar size={16} className="text-blue-500" /> :
                                                notif.type === 'achievement' ? <Award size={16} className="text-yellow-500" /> :
                                                    <Droplet size={16} className="text-cyan-500" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-gray-700 text-sm">{notif.text}</p>
                                            <p className="text-gray-400 text-xs">{notif.time}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Friends / Social */}
                        <div className="card-elevated bg-white rounded-2xl p-5">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                                        <Users className="text-indigo-500" size={20} />
                                    </div>
                                    <h3 className="font-bold text-gray-800">Arkadaşlar</h3>
                                </div>
                                <button className="p-2 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-all">
                                    <UserPlus size={16} className="text-indigo-500" />
                                </button>
                            </div>

                            <div className="space-y-3">
                                {mockFriends.map((friend, i) => (
                                    <div key={friend.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${i === 0 ? 'bg-yellow-100' : i === 1 ? 'bg-gray-100' : 'bg-orange-100'
                                                }`}>
                                                {friend.avatar}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800 text-sm">{friend.name}</p>
                                                <p className="text-gray-400 text-xs flex items-center gap-1">
                                                    <Zap size={10} />
                                                    {friend.streak} gün seri
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-gray-800 text-sm">{friend.calories}</p>
                                            <p className="text-gray-400 text-xs">kcal bugün</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button className="w-full mt-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-100 transition-all flex items-center justify-center gap-1">
                                <MessageCircle size={16} />
                                Arkadaşlarını Davet Et
                            </button>
                        </div>

                        {/* Quick Actions */}
                        <div className="grid grid-cols-2 gap-3">
                            <Link
                                to="/"
                                className="card-elevated bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-4 text-white"
                            >
                                <Utensils size={20} className="mb-2" />
                                <h3 className="font-bold text-sm">Yemek Ekle</h3>
                            </Link>
                            <Link
                                to="/?tab=diet"
                                className="card-elevated bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-4 text-white"
                            >
                                <Target size={20} className="mb-2" />
                                <h3 className="font-bold text-sm">Diyet Planı</h3>
                            </Link>
                        </div>
                    </div>
                </div>
            </main>

            {/* Exercise Modal */}
            {showExerciseModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl p-6 max-w-md w-full">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Egzersiz Ekle</h3>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                            {exerciseTypes.map((ex) => {
                                const Icon = ex.icon;
                                return (
                                    <button
                                        key={ex.name}
                                        onClick={() => setSelectedExercise(ex.name)}
                                        className={`p-4 rounded-xl flex flex-col items-center gap-2 transition-all ${selectedExercise === ex.name
                                                ? 'bg-gray-900 text-white'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        <Icon size={24} style={{ color: selectedExercise === ex.name ? 'white' : ex.color }} />
                                        <span className="font-bold text-sm">{ex.name}</span>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Süre (dakika)</label>
                            <input
                                type="number"
                                value={exerciseDuration}
                                onChange={(e) => setExerciseDuration(e.target.value)}
                                className="w-full p-4 bg-gray-100 rounded-xl text-lg font-semibold"
                                placeholder="30"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowExerciseModal(false)}
                                className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold"
                            >
                                İptal
                            </button>
                            <button
                                onClick={addExercise}
                                disabled={!selectedExercise || !exerciseDuration}
                                className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-bold disabled:opacity-50"
                            >
                                Kaydet
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
