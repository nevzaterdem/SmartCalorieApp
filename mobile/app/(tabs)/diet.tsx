import { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    TextInput,
    ActivityIndicator,
    Alert,
    StyleSheet,
    RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
    Calculator,
    Lightbulb,
    Sunrise,
    Sun,
    Coffee,
    Moon,
    Sparkles,
    Target,
    User,
    Ruler,
    Scale,
    TrendingDown,
    TrendingUp,
    Activity,
    Dumbbell,
    Check,
    Circle,
    ChevronDown,
    ChevronUp,
    Calendar,
    Trophy,
    Utensils,
    History,
} from "lucide-react-native";
import {
    createDietPlan,
    DietPlan,
    DayMeals,
    WeeklyDays,
    UserInfo,
    updateProfile,
    getActiveDietPlan,
    completeDietMeal,
    getDietHistory,
    createAndSaveDietPlan,
    SavedDietPlan,
    DietProgress,
    isAuthenticated
} from "../../services/api";
import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

const goals = [
    { id: "Kilo Vermek", label: "lose_weight", icon: TrendingDown, color: "#ef4444" },
    { id: "Kilo Almak", label: "gain_weight", icon: TrendingUp, color: "#22c55e" },
    { id: "Formu Korumak", label: "maintain", icon: Activity, color: "#3b82f6" },
    { id: "Kas Yapmak", label: "build_muscle", icon: Dumbbell, color: "#a855f7" },
];

export default function DietScreen() {
    const { isDarkMode, colors } = useTheme();
    const { t, language } = useLanguage();

    const mealConfig = {
        breakfast: { title: t('breakfast'), icon: Sunrise, color: "#f97316", bg: "#fff7ed" },
        lunch: { title: t('lunch'), icon: Sun, color: "#eab308", bg: "#fefce8" },
        snack: { title: t('snack'), icon: Coffee, color: "#a855f7", bg: "#faf5ff" },
        dinner: { title: t('dinner'), icon: Moon, color: "#3b82f6", bg: "#eff6ff" },
    };

    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'plan' | 'create' | 'history'>('plan');

    // Saved diet plan from backend
    const [activePlan, setActivePlan] = useState<SavedDietPlan | null>(null);
    const [weeklyPlan, setWeeklyPlan] = useState<DietPlan | null>(null);
    const [selectedDay, setSelectedDay] = useState<keyof WeeklyDays>('monday');
    const [planStartDate, setPlanStartDate] = useState<Date | null>(null);
    const [todayProgress, setTodayProgress] = useState<DietProgress | null>(null);
    const [dietHistory, setDietHistory] = useState<any[]>([]);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // Gün isimleri
    const dayKeys: (keyof WeeklyDays)[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dayLabels = {
        monday: language === 'tr' ? 'Pzt' : 'Mon',
        tuesday: language === 'tr' ? 'Sal' : 'Tue',
        wednesday: language === 'tr' ? 'Çar' : 'Wed',
        thursday: language === 'tr' ? 'Per' : 'Thu',
        friday: language === 'tr' ? 'Cum' : 'Fri',
        saturday: language === 'tr' ? 'Cmt' : 'Sat',
        sunday: language === 'tr' ? 'Paz' : 'Sun',
    };

    // Form state for creating new plan
    const [userInfo, setUserInfo] = useState<UserInfo>({
        weight: "",
        height: "",
        gender: "Erkek",
        goal: "Kilo Vermek",
    });
    const [showForm, setShowForm] = useState(false);

    // Check auth status and load data
    useEffect(() => {
        checkAuthAndLoad();
    }, []);

    const checkAuthAndLoad = async () => {
        const loggedIn = await isAuthenticated();
        setIsLoggedIn(loggedIn);

        if (loggedIn) {
            loadActivePlan();
        } else {
            // Load from local storage for non-logged users
            loadLocalPlan();
        }
    };

    const loadActivePlan = async () => {
        try {
            const { plan, todayProgress: progress } = await getActiveDietPlan(language);
            setActivePlan(plan);
            setTodayProgress(progress);

            if (plan) {
                setActiveTab('plan');
            } else {
                setActiveTab('create');
            }
        } catch (e) {
            console.log("Plan yüklenemedi", e);
            loadLocalPlan();
        }
    };

    const loadLocalPlan = async () => {
        try {
            // Önce haftalık planı kontrol et
            const weeklyPlanStr = await AsyncStorage.getItem("weeklyDietPlan");
            const planCreatedAt = await AsyncStorage.getItem("weeklyDietPlanCreatedAt");

            if (weeklyPlanStr) {
                const plan: DietPlan = JSON.parse(weeklyPlanStr);

                // Planın hâlâ geçerli olup olmadığını kontrol et (7 gün içinde mi?)
                const createdDate = planCreatedAt ? new Date(planCreatedAt) : new Date();
                const now = new Date();
                const daysDiff = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

                if (daysDiff >= 7) {
                    // Plan süresi dolmuş, yeni plan oluşturulmalı
                    console.log("📅 Haftalık plan süresi doldu, yeni plan gerekli");
                    setActiveTab('create');
                    return;
                }

                // Haftalık planı kaydet
                setWeeklyPlan(plan);
                setPlanStartDate(createdDate);

                // Bugünün gününü bul
                const today = new Date().getDay();
                const dayMap: (keyof WeeklyDays)[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                const todayKey = dayMap[today];
                setSelectedDay(todayKey);

                // Bugünün planını yükle
                const dailyCals = plan.daily_calories || plan.total_calories || 0;

                if (plan.days && plan.days[todayKey]) {
                    const todayMeals = plan.days[todayKey];
                    const savedPlan: SavedDietPlan = {
                        id: 0,
                        breakfast: { ...(todayMeals.breakfast || { title: '', items: [], calories: 0 }), completed: false },
                        lunch: { ...(todayMeals.lunch || { title: '', items: [], calories: 0 }), completed: false },
                        snack: { ...(todayMeals.snack || { title: '', items: [], calories: 0 }), completed: false },
                        dinner: { ...(todayMeals.dinner || { title: '', items: [], calories: 0 }), completed: false },
                        total_calories: dailyCals,
                        advice: plan.advice
                    };
                    setActivePlan(savedPlan);
                    setActiveTab('plan');
                    console.log(`📅 Bugün: ${todayMeals.day_name || todayKey} - Plan yüklendi`);
                } else if (plan.breakfast) {
                    // Eski format (tek günlük plan)
                    setActivePlan({
                        id: 0,
                        breakfast: { ...(plan.breakfast || { title: '', items: [], calories: 0 }), completed: false },
                        lunch: { ...(plan.lunch || { title: '', items: [], calories: 0 }), completed: false },
                        snack: { ...(plan.snack || { title: '', items: [], calories: 0 }), completed: false },
                        dinner: { ...(plan.dinner || { title: '', items: [], calories: 0 }), completed: false },
                        total_calories: dailyCals,
                        advice: plan.advice
                    });
                    setActiveTab('plan');
                } else {
                    setActiveTab('create');
                }
            } else {
                // Haftalık plan yok, eski formatı dene
                const savedPlan = await AsyncStorage.getItem("currentDietPlan");
                if (savedPlan) {
                    const plan = JSON.parse(savedPlan);
                    setActivePlan({
                        id: 0,
                        ...plan
                    });
                    setActiveTab('plan');
                } else {
                    setActiveTab('create');
                }
            }
        } catch (e) {
            console.log("Local plan yüklenemedi", e);
            setActiveTab('create');
        }
    };

    const loadHistory = async () => {
        if (!isLoggedIn) return;
        try {
            const { history } = await getDietHistory();
            setDietHistory(history);
        } catch (e) {
            console.log("Geçmiş yüklenemedi", e);
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        if (isLoggedIn) {
            await loadActivePlan();
            await loadHistory();
        } else {
            await loadLocalPlan();
        }
        setRefreshing(false);
    }, [isLoggedIn]);

    const handleCreateDiet = async () => {
        if (!userInfo.weight || !userInfo.height) {
            Alert.alert(t('missing_info'), t('enter_details'));
            return;
        }
        setLoading(true);

        try {
            if (isLoggedIn) {
                // Use authenticated endpoint
                const plan = await createAndSaveDietPlan(userInfo, language);
                setActivePlan(plan);
                setTodayProgress({
                    completedMeals: [],
                    completedCalories: 0,
                    totalMeals: 4,
                    totalCalories: plan.total_calories || 0
                });

                await AsyncStorage.setItem("dailyCalorieGoal", (plan.total_calories || 0).toString());

                Alert.alert(
                    t('plan_created'),
                    t('plan_created_desc').replace('{calories}', (plan.total_calories || 0).toString())
                );
                setActiveTab('plan');
                setShowForm(false);
            } else {
                // Use public endpoint for non-logged users (haftalık plan)
                const plan = await createDietPlan(userInfo, language);

                // Haftalık planı kaydet
                setWeeklyPlan(plan);

                // Bugünün gününü seç
                const today = new Date().getDay();
                const dayMap: (keyof WeeklyDays)[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                const todayKey = dayMap[today];
                setSelectedDay(todayKey);

                const dailyCals = plan.daily_calories || plan.total_calories || 0;

                if (plan.days || plan.breakfast) {
                    // Bugünün verilerini yükle (monday değil, bugün)
                    const todayMeals = plan.days?.[todayKey] || plan.days?.monday || {
                        day_name: language === 'tr' ? 'Bugün' : 'Today',
                        breakfast: plan.breakfast || { title: '', items: [], calories: 0 },
                        lunch: plan.lunch || { title: '', items: [], calories: 0 },
                        snack: plan.snack || { title: '', items: [], calories: 0 },
                        dinner: plan.dinner || { title: '', items: [], calories: 0 },
                    };

                    const savedPlan: SavedDietPlan = {
                        id: 0,
                        breakfast: { ...(todayMeals.breakfast || { title: '', items: [], calories: 0 }), completed: false },
                        lunch: { ...(todayMeals.lunch || { title: '', items: [], calories: 0 }), completed: false },
                        snack: { ...(todayMeals.snack || { title: '', items: [], calories: 0 }), completed: false },
                        dinner: { ...(todayMeals.dinner || { title: '', items: [], calories: 0 }), completed: false },
                        total_calories: dailyCals,
                        advice: plan.advice
                    };
                    setActivePlan(savedPlan);

                    // Planı ve oluşturma tarihini kaydet
                    await AsyncStorage.setItem("currentDietPlan", JSON.stringify(plan));
                    await AsyncStorage.setItem("weeklyDietPlan", JSON.stringify(plan));
                    await AsyncStorage.setItem("weeklyDietPlanCreatedAt", new Date().toISOString());
                    await AsyncStorage.setItem("dailyCalorieGoal", dailyCals.toString());

                    Alert.alert(
                        language === 'tr' ? "Haftalık Plan Oluşturuldu! 🎉" : "Weekly Plan Created! 🎉",
                        language === 'tr'
                            ? `7 günlük diyetiniz hazır! Günlük kalori hedefiniz: ${dailyCals} kcal`
                            : `Your 7-day diet is ready! Daily calorie target: ${dailyCals} kcal`
                    );
                    setActiveTab('plan');
                    setShowForm(false);
                } else {
                    Alert.alert(language === 'tr' ? "Hata" : "Error", language === 'tr' ? "Plan oluşturulamadı" : "Failed to create plan");
                }
            }
        } catch (error: any) {
            console.error("Diyet Hatası:", error);
            Alert.alert(language === 'tr' ? "Hata" : "Error", error.message || (language === 'tr' ? "Sunucu hatası! Backend çalışıyor mu?" : "Server error!"));
        } finally {
            setLoading(false);
        }
    };

    const handleCompleteMeal = async (mealType: 'breakfast' | 'lunch' | 'snack' | 'dinner') => {
        if (!isLoggedIn) {
            Alert.alert(
                "Giriş Gerekli",
                "Öğün takibi yapabilmek için giriş yapmalısınız.",
                [{ text: "Tamam" }]
            );
            return;
        }

        const isCompleted = todayProgress?.completedMeals.includes(mealType);

        try {
            const result = await completeDietMeal(mealType, !isCompleted, language);

            if (result.success) {
                // Update local state
                if (!isCompleted) {
                    setTodayProgress(prev => ({
                        ...prev!,
                        completedMeals: [...(prev?.completedMeals || []), mealType],
                        completedCalories: (prev?.completedCalories || 0) + (result.calories || 0)
                    }));
                    Alert.alert("Afiyet Olsun! 😋", result.message);
                } else {
                    setTodayProgress(prev => ({
                        ...prev!,
                        completedMeals: prev?.completedMeals.filter(m => m !== mealType) || [],
                        completedCalories: Math.max(0, (prev?.completedCalories || 0) - (result.calories || 0))
                    }));
                }
            }
        } catch (e: any) {
            Alert.alert("Hata", e.message || "Öğün güncellenemedi");
        }
    };

    const renderPlanView = () => {
        if (!activePlan) {
            return (
                <View style={styles.emptyState}>
                    <Calculator color="#a855f7" size={64} />
                    <Text style={styles.emptyTitle}>Henüz Diyet Planınız Yok</Text>
                    <Text style={styles.emptySubtitle}>
                        Bilgilerinizi girerek AI destekli kişisel diyet planınızı oluşturun
                    </Text>
                    <TouchableOpacity
                        style={styles.createPlanButton}
                        onPress={() => setActiveTab('create')}
                    >
                        <Sparkles color="#fff" size={20} />
                        <Text style={styles.createPlanButtonText}>Plan Oluştur</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        const progressPercent = todayProgress
            ? Math.round((todayProgress.completedMeals.length / 4) * 100)
            : 0;

        return (
            <View>
                {/* Progress Card */}
                <LinearGradient
                    colors={["#7c3aed", "#a855f7"]}
                    style={styles.progressCard}
                >
                    <View style={styles.progressHeader}>
                        <View>
                            <Text style={styles.progressTitle}>
                                {language === 'tr' ? 'Bugünkü İlerleme' : "Today's Progress"}
                            </Text>
                            <Text style={styles.progressSubtitle}>
                                {todayProgress?.completedMeals.length || 0} / 4 {language === 'tr' ? 'öğün tamamlandı' : 'meals completed'}
                            </Text>
                        </View>
                        <View style={styles.progressCircle}>
                            <Text style={styles.progressPercent}>{progressPercent}%</Text>
                        </View>
                    </View>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
                    </View>
                    <View style={styles.calorieInfo}>
                        <View style={styles.calorieItem}>
                            <Text style={styles.calorieLabel}>
                                {language === 'tr' ? 'Tamamlanan' : 'Completed'}
                            </Text>
                            <Text style={styles.calorieValue}>
                                {todayProgress?.completedCalories || 0} kcal
                            </Text>
                        </View>
                        <View style={styles.calorieDivider} />
                        <View style={styles.calorieItem}>
                            <Text style={styles.calorieLabel}>
                                {language === 'tr' ? 'Hedef' : 'Target'}
                            </Text>
                            <Text style={styles.calorieValue}>
                                {activePlan.total_calories || weeklyPlan?.daily_calories || 0} kcal
                            </Text>
                        </View>
                    </View>
                </LinearGradient>

                {/* Haftalık Plan Bilgisi */}
                {weeklyPlan?.days && planStartDate && (
                    <View style={styles.planInfoBanner}>
                        <Calendar color="#7c3aed" size={20} />
                        <View style={{ marginLeft: 12, flex: 1 }}>
                            <Text style={styles.planInfoTitle}>
                                {language === 'tr' ? '7 Günlük Plan Aktif' : '7-Day Plan Active'}
                            </Text>
                            <Text style={styles.planInfoText}>
                                {language === 'tr'
                                    ? `${Math.max(0, 7 - Math.floor((new Date().getTime() - planStartDate.getTime()) / (1000 * 60 * 60 * 24)))} gün kaldı`
                                    : `${Math.max(0, 7 - Math.floor((new Date().getTime() - planStartDate.getTime()) / (1000 * 60 * 60 * 24)))} days remaining`
                                }
                            </Text>
                        </View>
                        <View style={styles.planDayBadge}>
                            <Text style={styles.planDayBadgeText}>
                                {dayLabels[selectedDay]}
                            </Text>
                        </View>
                    </View>
                )}

                {/* Haftalık Gün Seçici */}
                {weeklyPlan?.days && (
                    <View style={styles.weeklySelector}>
                        <Text style={styles.weeklySelectorTitle}>
                            {language === 'tr' ? '📅 Haftalık Plan' : '📅 Weekly Plan'}
                        </Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.dayTabsContainer}
                        >
                            {dayKeys.map((day) => {
                                const isSelected = selectedDay === day;
                                const dayData = weeklyPlan.days?.[day];
                                return (
                                    <TouchableOpacity
                                        key={day}
                                        style={[
                                            styles.dayTab,
                                            isSelected && styles.dayTabSelected
                                        ]}
                                        onPress={() => {
                                            setSelectedDay(day);
                                            // Seçili günün verilerini activePlan'a yükle
                                            if (dayData) {
                                                const updatedPlan: SavedDietPlan = {
                                                    id: activePlan?.id || 0,
                                                    breakfast: { ...dayData.breakfast, completed: false },
                                                    lunch: { ...dayData.lunch, completed: false },
                                                    snack: { ...dayData.snack, completed: false },
                                                    dinner: { ...dayData.dinner, completed: false },
                                                    total_calories: weeklyPlan.daily_calories || 0,
                                                    advice: weeklyPlan.advice
                                                };
                                                setActivePlan(updatedPlan);
                                            }
                                        }}
                                    >
                                        <Text style={[
                                            styles.dayTabText,
                                            isSelected && styles.dayTabTextSelected
                                        ]}>
                                            {dayLabels[day]}
                                        </Text>
                                        <Text style={[
                                            styles.dayTabName,
                                            isSelected && styles.dayTabNameSelected
                                        ]}>
                                            {dayData?.day_name || day}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                )}

                {/* Advice Card */}
                {activePlan.advice && (
                    <LinearGradient colors={["#fef3c7", "#fde68a"]} style={styles.adviceCard}>
                        <View style={styles.adviceIcon}>
                            <Lightbulb color="#ffffff" size={20} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.adviceTitle}>💡 Diyetisyen Notu</Text>
                            <Text style={styles.adviceText}>{activePlan.advice}</Text>
                        </View>
                    </LinearGradient>
                )}

                {/* Meal Cards */}
                {(['breakfast', 'lunch', 'snack', 'dinner'] as const).map((mealKey) => {
                    const meal = activePlan[mealKey];
                    const config = mealConfig[mealKey];
                    const isCompleted = todayProgress?.completedMeals.includes(mealKey);
                    const Icon = config.icon;

                    return (
                        <View key={mealKey} style={[styles.mealCard, isCompleted && styles.mealCardCompleted]}>
                            <View style={styles.mealHeader}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <View style={[styles.mealIcon, { backgroundColor: config.bg }]}>
                                        <Icon color={config.color} size={20} />
                                    </View>
                                    <View>
                                        <Text style={styles.mealTitle}>{config.title}</Text>
                                        <Text style={styles.mealCalories}>{meal?.calories || 0} kcal</Text>
                                    </View>
                                </View>
                                <TouchableOpacity
                                    onPress={() => handleCompleteMeal(mealKey)}
                                    style={[
                                        styles.completeButton,
                                        isCompleted && styles.completeButtonActive
                                    ]}
                                >
                                    {isCompleted ? (
                                        <Check color="#fff" size={18} />
                                    ) : (
                                        <Circle color="#10b981" size={18} />
                                    )}
                                    <Text style={[
                                        styles.completeButtonText,
                                        isCompleted && styles.completeButtonTextActive
                                    ]}>
                                        {isCompleted ? t('completed') : t('complete')}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.mealItems}>
                                {meal?.items && meal.items.length > 0 ? (
                                    meal.items.map((item: string, index: number) => (
                                        <View key={index} style={[styles.mealItem, index > 0 && { marginTop: 8 }]}>
                                            <View style={[styles.bullet, { backgroundColor: config.color }]} />
                                            <Text style={[
                                                styles.mealItemText,
                                                isCompleted && styles.mealItemTextCompleted
                                            ]}>{item}</Text>
                                        </View>
                                    ))
                                ) : (
                                    <Text style={{ color: '#9ca3af', fontStyle: 'italic' }}>Öneri yok</Text>
                                )}
                            </View>
                        </View>
                    );
                })}

                {/* New Plan Button */}
                <TouchableOpacity
                    onPress={() => {
                        setShowForm(true);
                        setActiveTab('create');
                    }}
                    style={styles.newPlanButton}
                >
                    <Text style={styles.newPlanText}>🔄 {t('regenerate_plan')}</Text>
                </TouchableOpacity>
            </View>
        );
    };

    const renderCreateView = () => (
        <View style={styles.formCard}>
            <View style={styles.formHeader}>
                <Text style={styles.formTitle}>{t('create_profile')}</Text>
                <Text style={styles.formSubtitle}>{t('enter_info_for_diet')}</Text>
            </View>

            {/* Weight & Height Row */}
            <View style={styles.row}>
                <View style={styles.inputHalf}>
                    <View style={styles.labelRow}>
                        <Scale color="#6b7280" size={16} />
                        <Text style={styles.label}>{t('weight')}</Text>
                    </View>
                    <View style={styles.inputContainer}>
                        <TextInput
                            value={userInfo.weight}
                            onChangeText={(text) => setUserInfo({ ...userInfo, weight: text })}
                            placeholder="75"
                            keyboardType="numeric"
                            style={styles.input}
                            placeholderTextColor="#9ca3af"
                        />
                        <Text style={styles.unit}>kg</Text>
                    </View>
                </View>

                <View style={styles.inputHalf}>
                    <View style={styles.labelRow}>
                        <Ruler color="#6b7280" size={16} />
                        <Text style={styles.label}>{t('height')}</Text>
                    </View>
                    <View style={styles.inputContainer}>
                        <TextInput
                            value={userInfo.height}
                            onChangeText={(text) => setUserInfo({ ...userInfo, height: text })}
                            placeholder="180"
                            keyboardType="numeric"
                            style={styles.input}
                            placeholderTextColor="#9ca3af"
                        />
                        <Text style={styles.unit}>cm</Text>
                    </View>
                </View>
            </View>

            <View style={styles.section}>
                <View style={styles.labelRow}>
                    <User color="#6b7280" size={16} />
                    <Text style={styles.label}>{t('gender')}</Text>
                </View>
                <View style={styles.row}>
                    <TouchableOpacity
                        onPress={() => setUserInfo({ ...userInfo, gender: "Erkek" })}
                        style={[styles.genderButton, userInfo.gender === "Erkek" && styles.genderButtonMale]}
                    >
                        <Text style={[styles.genderText, userInfo.gender === "Erkek" && styles.genderTextActive]}>
                            👨 {t('male')}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setUserInfo({ ...userInfo, gender: "Kadın" })}
                        style={[styles.genderButton, { marginLeft: 8 }, userInfo.gender === "Kadın" && styles.genderButtonFemale]}
                    >
                        <Text style={[styles.genderText, userInfo.gender === "Kadın" && styles.genderTextActive]}>
                            👩 {t('female')}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Goal Selection */}
            <View style={styles.section}>
                <View style={styles.labelRow}>
                    <Target color="#6b7280" size={16} />
                    <Text style={styles.label}>{t('goal')}</Text>
                </View>
                <View style={styles.goalsGrid}>
                    {goals.map((goal) => {
                        const Icon = goal.icon;
                        const isSelected = userInfo.goal === goal.id;
                        return (
                            <TouchableOpacity
                                key={goal.id}
                                onPress={() => setUserInfo({ ...userInfo, goal: goal.id })}
                                style={styles.goalWrapper}
                            >
                                <View style={[styles.goalButton, isSelected && styles.goalButtonActive]}>
                                    <View style={[styles.goalIcon, { backgroundColor: isSelected ? goal.color : "#e5e7eb" }]}>
                                        <Icon color={isSelected ? "#ffffff" : goal.color} size={18} />
                                    </View>
                                    <Text style={[styles.goalText, isSelected && styles.goalTextActive]}>
                                        {t(goal.label)}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            {/* Create Diet Button */}
            <TouchableOpacity onPress={handleCreateDiet} disabled={loading} activeOpacity={0.9}>
                <LinearGradient
                    colors={loading ? ["#9ca3af", "#6b7280"] : ["#7c3aed", "#a855f7"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.createButton}
                >
                    {loading ? (
                        <>
                            <ActivityIndicator color="#ffffff" />
                            <Text style={styles.createButtonText}>{t('creating_ai')}</Text>
                        </>
                    ) : (
                        <>
                            <View style={styles.createButtonIcon}>
                                <Sparkles color="#ffffff" size={22} />
                            </View>
                            <Text style={styles.createButtonText}>{t('create_your_plan')}</Text>
                        </>
                    )}
                </LinearGradient>
            </TouchableOpacity>

            {activePlan && (
                <TouchableOpacity
                    onPress={() => setActiveTab('plan')}
                    style={styles.backButton}
                >
                    <Text style={styles.backButtonText}>← {t('back_to_current')}</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    const renderHistoryView = () => (
        <View>
            <Text style={styles.historyTitle}>{t('diet_history')}</Text>
            {!isLoggedIn ? (
                <View style={styles.loginPrompt}>
                    <History color="#a855f7" size={48} />
                    <Text style={styles.loginPromptText}>
                        {t('login_for_history')}
                    </Text>
                </View>
            ) : dietHistory.length === 0 ? (
                <View style={styles.emptyHistory}>
                    <Calendar color="#9ca3af" size={48} />
                    <Text style={styles.emptyHistoryText}>{t('no_history')}</Text>
                </View>
            ) : (
                dietHistory.map((item, index) => (
                    <View key={item.id} style={styles.historyItem}>
                        <View style={styles.historyLeft}>
                            <Text style={styles.historyGoal}>{item.goal}</Text>
                            <Text style={styles.historyDate}>
                                {new Date(item.createdAt).toLocaleDateString('tr-TR')}
                            </Text>
                        </View>
                        <View style={styles.historyRight}>
                            <Text style={styles.historyCalories}>{item.totalCalories} kcal</Text>
                            <View style={[
                                styles.historyBadge,
                                item.isActive && styles.historyBadgeActive
                            ]}>
                                <Text style={styles.historyBadgeText}>
                                    {item.isActive ? "Aktif" : `%${item.completionRate}`}
                                </Text>
                            </View>
                        </View>
                    </View>
                ))
            )}
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <LinearGradient
                colors={["#7c3aed", "#a855f7", "#c084fc"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <View style={styles.headerIcon}>
                        <Calculator color="#ffffff" size={28} />
                    </View>
                    <View>
                        <Text style={styles.headerTitle}>{t('diet_tracking')}</Text>
                        <Text style={styles.headerSubtitle}>{t('ai_powered_program')}</Text>
                    </View>
                </View>
            </LinearGradient>

            {/* Tabs */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'plan' && styles.tabActive]}
                    onPress={() => setActiveTab('plan')}
                >
                    <Utensils color={activeTab === 'plan' ? "#7c3aed" : "#9ca3af"} size={16} />
                    <Text style={[styles.tabText, activeTab === 'plan' && styles.tabTextActive]}>
                        {t('my_plan')}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'create' && styles.tabActive]}
                    onPress={() => setActiveTab('create')}
                >
                    <Sparkles color={activeTab === 'create' ? "#7c3aed" : "#9ca3af"} size={16} />
                    <Text style={[styles.tabText, activeTab === 'create' && styles.tabTextActive]}>
                        {t('create_new')}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'history' && styles.tabActive]}
                    onPress={() => {
                        setActiveTab('history');
                        loadHistory();
                    }}
                >
                    <History color={activeTab === 'history' ? "#7c3aed" : "#9ca3af"} size={16} />
                    <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
                        {t('history')}
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                <View style={styles.content}>
                    {activeTab === 'plan' && renderPlanView()}
                    {activeTab === 'create' && renderCreateView()}
                    {activeTab === 'history' && renderHistoryView()}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9fafb' },
    header: { paddingTop: 60, paddingBottom: 32, paddingHorizontal: 20 },
    headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    headerIcon: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 12, marginRight: 12 },
    headerTitle: { color: '#fff', fontSize: 24, fontWeight: '900' },
    headerSubtitle: { color: '#e9d5ff', fontSize: 14, fontWeight: '500' },

    // Tabs
    tabContainer: { flexDirection: 'row', marginHorizontal: 16, marginTop: -16, backgroundColor: '#fff', borderRadius: 16, padding: 4, marginBottom: 16, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 2 } },
    tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, gap: 6 },
    tabActive: { backgroundColor: '#f3f4f6' },
    tabText: { fontSize: 13, fontWeight: '600', color: '#9ca3af' },
    tabTextActive: { color: '#7c3aed' },

    scrollView: { flex: 1 },
    content: { paddingHorizontal: 16, paddingBottom: 32 },

    // Progress Card
    progressCard: { borderRadius: 20, padding: 20, marginBottom: 16 },
    progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    progressTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
    progressSubtitle: { color: '#e9d5ff', fontSize: 14, marginTop: 4 },
    progressCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
    progressPercent: { color: '#fff', fontSize: 18, fontWeight: '900' },
    progressBar: { height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, marginBottom: 16 },
    progressFill: { height: '100%', backgroundColor: '#fff', borderRadius: 4 },
    calorieInfo: { flexDirection: 'row', alignItems: 'center' },
    calorieItem: { flex: 1 },
    calorieLabel: { color: '#e9d5ff', fontSize: 12 },
    calorieValue: { color: '#fff', fontSize: 16, fontWeight: '700' },
    calorieDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 16 },

    // Advice Card
    adviceCard: { flexDirection: 'row', borderRadius: 16, padding: 16, marginBottom: 16 },
    adviceIcon: { backgroundColor: '#f59e0b', padding: 10, borderRadius: 12, marginRight: 12 },
    adviceTitle: { fontWeight: '700', color: '#92400e', fontSize: 14 },
    adviceText: { color: '#78350f', fontSize: 13, marginTop: 4, lineHeight: 18 },

    // Meal Card
    mealCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12 },
    mealCardCompleted: { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#86efac' },
    mealHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    mealIcon: { padding: 10, borderRadius: 12, marginRight: 12 },
    mealTitle: { color: '#1f2937', fontSize: 16, fontWeight: '700' },
    mealCalories: { color: '#6b7280', fontSize: 13 },
    completeButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ecfdf5', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#10b981', gap: 6 },
    completeButtonActive: { backgroundColor: '#10b981' },
    completeButtonText: { color: '#059669', fontSize: 13, fontWeight: '600' },
    completeButtonTextActive: { color: '#fff' },
    mealItems: { backgroundColor: '#f9fafb', borderRadius: 12, padding: 12 },
    mealItem: { flexDirection: 'row', alignItems: 'flex-start' },
    bullet: { width: 6, height: 6, borderRadius: 3, marginRight: 8, marginTop: 6 },
    mealItemText: { color: '#4b5563', fontSize: 14, flex: 1 },
    mealItemTextCompleted: { textDecorationLine: 'line-through', color: '#9ca3af' },

    // Empty State
    emptyState: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 },
    emptyTitle: { color: '#1f2937', fontSize: 20, fontWeight: '700', marginTop: 16 },
    emptySubtitle: { color: '#6b7280', fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 20 },
    createPlanButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#7c3aed', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12, marginTop: 24, gap: 8 },
    createPlanButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },

    // New Plan Button
    newPlanButton: { backgroundColor: '#1f2937', padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 8, marginBottom: 20 },
    newPlanText: { color: '#fff', fontSize: 16, fontWeight: '700' },

    // Form
    formCard: { backgroundColor: '#fff', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 4 }, shadowRadius: 20, elevation: 3 },
    formHeader: { alignItems: 'center', marginBottom: 24 },
    formTitle: { color: '#1f2937', fontSize: 20, fontWeight: '700' },
    formSubtitle: { color: '#6b7280', fontSize: 14, marginTop: 4, textAlign: 'center' },
    row: { flexDirection: 'row' },
    inputHalf: { flex: 1, marginRight: 8 },
    labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    label: { color: '#4b5563', fontSize: 14, fontWeight: '600', marginLeft: 8 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 16, overflow: 'hidden' },
    input: { flex: 1, padding: 16, fontSize: 18, fontWeight: '600', color: '#1f2937' },
    unit: { color: '#9ca3af', fontWeight: '700', paddingRight: 16 },
    section: { marginTop: 16 },
    genderButton: { flex: 1, padding: 16, borderRadius: 16, backgroundColor: '#f3f4f6', alignItems: 'center' },
    genderButtonMale: { backgroundColor: '#3b82f6' },
    genderButtonFemale: { backgroundColor: '#ec4899' },
    genderText: { fontWeight: '700', fontSize: 16, color: '#4b5563' },
    genderTextActive: { color: '#fff' },
    goalsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
    goalWrapper: { width: '50%', padding: 4 },
    goalButton: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, backgroundColor: '#f3f4f6' },
    goalButtonActive: { backgroundColor: '#1f2937' },
    goalIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
    goalText: { fontWeight: '700', fontSize: 14, color: '#4b5563' },
    goalTextActive: { color: '#fff' },
    createButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: 16, marginTop: 24 },
    createButtonIcon: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 12, marginRight: 12 },
    createButtonText: { color: '#fff', fontSize: 18, fontWeight: '700', marginLeft: 8 },
    backButton: { marginTop: 16, alignItems: 'center' },
    backButtonText: { color: '#7c3aed', fontSize: 14, fontWeight: '600' },

    // History
    historyTitle: { color: '#1f2937', fontSize: 18, fontWeight: '700', marginBottom: 16 },
    historyItem: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    historyLeft: {},
    historyGoal: { color: '#1f2937', fontSize: 16, fontWeight: '600' },
    historyDate: { color: '#9ca3af', fontSize: 13, marginTop: 2 },
    historyRight: { alignItems: 'flex-end' },
    historyCalories: { color: '#6b7280', fontSize: 14, fontWeight: '600' },
    historyBadge: { backgroundColor: '#f3f4f6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 4 },
    historyBadgeActive: { backgroundColor: '#dcfce7' },
    historyBadgeText: { color: '#6b7280', fontSize: 12, fontWeight: '600' },
    emptyHistory: { alignItems: 'center', paddingVertical: 48 },
    emptyHistoryText: { color: '#9ca3af', fontSize: 14, marginTop: 12 },
    loginPrompt: { alignItems: 'center', paddingVertical: 48 },
    loginPromptText: { color: '#6b7280', fontSize: 14, marginTop: 12, textAlign: 'center' },

    // Plan Info Banner
    planInfoBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f3e8ff',
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e9d5ff',
    },
    planInfoTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#7c3aed',
    },
    planInfoText: {
        fontSize: 12,
        color: '#9333ea',
        marginTop: 2,
    },
    planDayBadge: {
        backgroundColor: '#7c3aed',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    planDayBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },

    // Weekly Day Selector Styles
    weeklySelector: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 8,
        elevation: 2,
    },
    weeklySelectorTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 12
    },
    dayTabsContainer: {
        flexDirection: 'row',
        gap: 8,
        paddingRight: 8,
    },
    dayTab: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        backgroundColor: '#f3f4f6',
        alignItems: 'center',
        minWidth: 60,
    },
    dayTabSelected: {
        backgroundColor: '#7c3aed',
    },
    dayTabText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#6b7280',
    },
    dayTabTextSelected: {
        color: '#fff',
    },
    dayTabName: {
        fontSize: 10,
        color: '#9ca3af',
        marginTop: 2,
    },
    dayTabNameSelected: {
        color: 'rgba(255,255,255,0.8)',
    },
});
