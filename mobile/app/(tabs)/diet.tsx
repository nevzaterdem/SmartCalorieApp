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
import AsyncStorage from "@react-native-async-storage/async-storage";

const goals = [
    { id: "Kilo Vermek", label: "Kilo Ver", icon: TrendingDown, color: "#ef4444" },
    { id: "Kilo Almak", label: "Kilo Al", icon: TrendingUp, color: "#22c55e" },
    { id: "Formu Korumak", label: "Formu Koru", icon: Activity, color: "#3b82f6" },
    { id: "Kas Yapmak", label: "Kas Yap", icon: Dumbbell, color: "#a855f7" },
];

const mealConfig = {
    breakfast: { title: "Kahvaltı", icon: Sunrise, color: "#f97316", bg: "#fff7ed" },
    lunch: { title: "Öğle Yemeği", icon: Sun, color: "#eab308", bg: "#fefce8" },
    snack: { title: "Ara Öğün", icon: Coffee, color: "#a855f7", bg: "#faf5ff" },
    dinner: { title: "Akşam Yemeği", icon: Moon, color: "#3b82f6", bg: "#eff6ff" },
};

export default function DietScreen() {
    const { isDarkMode, colors } = useTheme();

    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'plan' | 'create' | 'history'>('plan');

    // Saved diet plan from backend
    const [activePlan, setActivePlan] = useState<SavedDietPlan | null>(null);
    const [todayProgress, setTodayProgress] = useState<DietProgress | null>(null);
    const [dietHistory, setDietHistory] = useState<any[]>([]);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

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
            const { plan, todayProgress: progress } = await getActiveDietPlan();
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
        } catch (e) {
            console.log("Local plan yüklenemedi", e);
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
            Alert.alert("Eksik Bilgi", "Lütfen kilo ve boy bilgilerinizi girin.");
            return;
        }
        setLoading(true);

        try {
            if (isLoggedIn) {
                // Use authenticated endpoint
                const plan = await createAndSaveDietPlan(userInfo);
                setActivePlan(plan);
                setTodayProgress({
                    completedMeals: [],
                    completedCalories: 0,
                    totalMeals: 4,
                    totalCalories: plan.total_calories
                });

                await AsyncStorage.setItem("dailyCalorieGoal", plan.total_calories.toString());

                Alert.alert(
                    "Plan Oluşturuldu! 🎉",
                    `Günlük kalori hedefiniz ${plan.total_calories} kcal olarak belirlendi. Öğünleri tamamladığınızda işaretleyin!`
                );
                setActiveTab('plan');
                setShowForm(false);
            } else {
                // Use public endpoint for non-logged users
                const plan = await createDietPlan(userInfo);
                if (plan.breakfast) {
                    const savedPlan: SavedDietPlan = {
                        id: 0,
                        breakfast: { ...plan.breakfast, completed: false },
                        lunch: { ...plan.lunch, completed: false },
                        snack: { ...plan.snack, completed: false },
                        dinner: { ...plan.dinner, completed: false },
                        total_calories: plan.total_calories,
                        advice: plan.advice
                    };
                    setActivePlan(savedPlan);
                    await AsyncStorage.setItem("currentDietPlan", JSON.stringify(plan));
                    await AsyncStorage.setItem("dailyCalorieGoal", plan.total_calories.toString());

                    Alert.alert(
                        "Plan Oluşturuldu! 🎉",
                        `Diyetiniz hazır! Giriş yaparak öğün takibinizi kaydedebilirsiniz.`
                    );
                    setActiveTab('plan');
                    setShowForm(false);
                } else {
                    Alert.alert("Hata", "Plan oluşturulamadı");
                }
            }
        } catch (error: any) {
            console.error("Diyet Hatası:", error);
            Alert.alert("Hata", error.message || "Sunucu hatası! Backend çalışıyor mu?");
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
            const result = await completeDietMeal(mealType, !isCompleted);

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
                            <Text style={styles.progressTitle}>Bugünkü İlerleme</Text>
                            <Text style={styles.progressSubtitle}>
                                {todayProgress?.completedMeals.length || 0} / 4 öğün tamamlandı
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
                            <Text style={styles.calorieLabel}>Tamamlanan</Text>
                            <Text style={styles.calorieValue}>
                                {todayProgress?.completedCalories || 0} kcal
                            </Text>
                        </View>
                        <View style={styles.calorieDivider} />
                        <View style={styles.calorieItem}>
                            <Text style={styles.calorieLabel}>Hedef</Text>
                            <Text style={styles.calorieValue}>
                                {activePlan.total_calories} kcal
                            </Text>
                        </View>
                    </View>
                </LinearGradient>

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
                                        {isCompleted ? "Tamamlandı" : "Tamamla"}
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
                    <Text style={styles.newPlanText}>🔄 Yeni Plan Oluştur</Text>
                </TouchableOpacity>
            </View>
        );
    };

    const renderCreateView = () => (
        <View style={styles.formCard}>
            <View style={styles.formHeader}>
                <Text style={styles.formTitle}>Profilini Oluştur</Text>
                <Text style={styles.formSubtitle}>Sana özel diyet planı için bilgilerini gir</Text>
            </View>

            {/* Weight & Height Row */}
            <View style={styles.row}>
                <View style={styles.inputHalf}>
                    <View style={styles.labelRow}>
                        <Scale color="#6b7280" size={16} />
                        <Text style={styles.label}>Kilo</Text>
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
                        <Text style={styles.label}>Boy</Text>
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

            {/* Gender Selection */}
            <View style={styles.section}>
                <View style={styles.labelRow}>
                    <User color="#6b7280" size={16} />
                    <Text style={styles.label}>Cinsiyet</Text>
                </View>
                <View style={styles.row}>
                    <TouchableOpacity
                        onPress={() => setUserInfo({ ...userInfo, gender: "Erkek" })}
                        style={[styles.genderButton, userInfo.gender === "Erkek" && styles.genderButtonMale]}
                    >
                        <Text style={[styles.genderText, userInfo.gender === "Erkek" && styles.genderTextActive]}>
                            👨 Erkek
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setUserInfo({ ...userInfo, gender: "Kadın" })}
                        style={[styles.genderButton, { marginLeft: 8 }, userInfo.gender === "Kadın" && styles.genderButtonFemale]}
                    >
                        <Text style={[styles.genderText, userInfo.gender === "Kadın" && styles.genderTextActive]}>
                            👩 Kadın
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Goal Selection */}
            <View style={styles.section}>
                <View style={styles.labelRow}>
                    <Target color="#6b7280" size={16} />
                    <Text style={styles.label}>Hedefin</Text>
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
                                        {goal.label}
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
                            <Text style={styles.createButtonText}>AI Oluşturuyor...</Text>
                        </>
                    ) : (
                        <>
                            <View style={styles.createButtonIcon}>
                                <Sparkles color="#ffffff" size={22} />
                            </View>
                            <Text style={styles.createButtonText}>Diyet Planımı Oluştur</Text>
                        </>
                    )}
                </LinearGradient>
            </TouchableOpacity>

            {activePlan && (
                <TouchableOpacity
                    onPress={() => setActiveTab('plan')}
                    style={styles.backButton}
                >
                    <Text style={styles.backButtonText}>← Mevcut Plana Dön</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    const renderHistoryView = () => (
        <View>
            <Text style={styles.historyTitle}>Diyet Geçmişiniz</Text>
            {!isLoggedIn ? (
                <View style={styles.loginPrompt}>
                    <History color="#a855f7" size={48} />
                    <Text style={styles.loginPromptText}>
                        Geçmiş takibi için giriş yapmalısınız
                    </Text>
                </View>
            ) : dietHistory.length === 0 ? (
                <View style={styles.emptyHistory}>
                    <Calendar color="#9ca3af" size={48} />
                    <Text style={styles.emptyHistoryText}>Henüz geçmiş yok</Text>
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
                        <Text style={styles.headerTitle}>Diyet Takibi</Text>
                        <Text style={styles.headerSubtitle}>AI Destekli Kişisel Program</Text>
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
                        Planım
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'create' && styles.tabActive]}
                    onPress={() => setActiveTab('create')}
                >
                    <Sparkles color={activeTab === 'create' ? "#7c3aed" : "#9ca3af"} size={16} />
                    <Text style={[styles.tabText, activeTab === 'create' && styles.tabTextActive]}>
                        Oluştur
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
                        Geçmiş
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
});
