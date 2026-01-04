import { useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    TextInput,
    ActivityIndicator,
    Alert,
    StyleSheet,
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
    ChevronRight,
    Utensils,
} from "lucide-react-native";
import { createDietPlan, DietPlan, UserInfo } from "../../services/api";
import { useTheme } from "../../context/ThemeContext";

const goals = [
    { id: "Kilo Vermek", label: "Kilo Ver", icon: TrendingDown, color: "#ef4444" },
    { id: "Kilo Almak", label: "Kilo Al", icon: TrendingUp, color: "#22c55e" },
    { id: "Formu Korumak", label: "Formu Koru", icon: Activity, color: "#3b82f6" },
    { id: "Kas Yapmak", label: "Kas Yap", icon: Dumbbell, color: "#a855f7" },
];

export default function DietScreen() {
    const { isDarkMode, colors } = useTheme();

    const [loading, setLoading] = useState(false);
    const [dietPlan, setDietPlan] = useState<DietPlan | null>(null);
    const [userInfo, setUserInfo] = useState<UserInfo>({
        weight: "",
        height: "",
        gender: "Erkek",
        goal: "Kilo Vermek",
    });

    const handleCreateDiet = async () => {
        if (!userInfo.weight || !userInfo.height) {
            Alert.alert("Eksik Bilgi", "Lütfen kilo ve boy bilgilerinizi girin.");
            return;
        }
        setLoading(true);
        setDietPlan(null);
        try {
            const plan = await createDietPlan(userInfo);
            if (plan.breakfast) {
                setDietPlan(plan);
            } else {
                Alert.alert("Hata", "Plan oluşturulamadı");
            }
        } catch (error) {
            console.error("Diyet Hatası:", error);
            Alert.alert("Hata", "Sunucu hatası! Backend çalışıyor mu?");
        } finally {
            setLoading(false);
        }
    };

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
                        <Text style={styles.headerTitle}>Diyet Planı</Text>
                        <Text style={styles.headerSubtitle}>AI Destekli Kişisel Program</Text>
                    </View>
                </View>
            </LinearGradient>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.content}>
                    {/* User Info Form */}
                    <View style={styles.formCard}>
                        <View style={styles.formHeader}>
                            <Text style={styles.formTitle}>Profilini Oluştur</Text>
                            <Text style={styles.formSubtitle}>Sana özel diyet planı için bilgilerini gir</Text>
                        </View>

                        {/* Weight & Height Row */}
                        <View style={styles.row}>
                            {/* Weight */}
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

                            {/* Height */}
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
                                        <Text style={styles.createButtonText}>Hazırlanıyor...</Text>
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
                    </View>

                    {/* Diet Plan Results */}
                    {dietPlan && (
                        <View>
                            {/* Advice Card */}
                            <LinearGradient colors={["#fef3c7", "#fde68a"]} style={styles.adviceCard}>
                                <View style={styles.adviceIcon}>
                                    <Lightbulb color="#ffffff" size={20} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.adviceTitle}>💡 Diyetisyen Notu</Text>
                                    <Text style={styles.adviceText}>{dietPlan.advice}</Text>
                                </View>
                            </LinearGradient>

                            {/* Total Calories */}
                            <View style={styles.totalCard}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <View style={styles.totalIcon}>
                                        <Utensils color="#f97316" size={20} />
                                    </View>
                                    <Text style={styles.totalLabel}>Günlük Toplam</Text>
                                </View>
                                <Text style={styles.totalValue}>{dietPlan.total_calories} kcal</Text>
                            </View>

                            {/* Meal Cards */}
                            <MealCard icon={Sunrise} iconColor="#f97316" bgColor="#fff7ed" title="Kahvaltı" calories={dietPlan.breakfast.calories} items={dietPlan.breakfast.items} />
                            <MealCard icon={Sun} iconColor="#eab308" bgColor="#fefce8" title="Öğle Yemeği" calories={dietPlan.lunch.calories} items={dietPlan.lunch.items} />
                            <MealCard icon={Coffee} iconColor="#a855f7" bgColor="#faf5ff" title="Ara Öğün" calories={dietPlan.snack.calories} items={dietPlan.snack.items} />
                            <MealCard icon={Moon} iconColor="#3b82f6" bgColor="#eff6ff" title="Akşam Yemeği" calories={dietPlan.dinner.calories} items={dietPlan.dinner.items} />

                            {/* New Plan Button */}
                            <TouchableOpacity onPress={() => setDietPlan(null)} style={styles.newPlanButton}>
                                <Text style={styles.newPlanText}>🔄 Yeni Plan Oluştur</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

// Meal Card Component
function MealCard({ icon: Icon, iconColor, bgColor, title, calories, items }: { icon: any; iconColor: string; bgColor: string; title: string; calories: number; items: string[] }) {
    return (
        <View style={styles.mealCard}>
            <View style={styles.mealHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={[styles.mealIcon, { backgroundColor: bgColor }]}>
                        <Icon color={iconColor} size={20} />
                    </View>
                    <Text style={styles.mealTitle}>{title}</Text>
                </View>
                <View style={styles.mealCalories}>
                    <Text style={styles.mealCaloriesText}>{calories} kcal</Text>
                </View>
            </View>
            <View style={styles.mealItems}>
                {items.map((item, index) => (
                    <View key={index} style={[styles.mealItem, index > 0 && { marginTop: 8 }]}>
                        <ChevronRight color="#9ca3af" size={16} />
                        <Text style={styles.mealItemText}>{item}</Text>
                    </View>
                ))}
            </View>
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
    scrollView: { flex: 1, marginTop: -16 },
    content: { paddingHorizontal: 16, paddingBottom: 32 },
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
    adviceCard: { flexDirection: 'row', borderRadius: 24, padding: 20, marginTop: 20 },
    adviceIcon: { backgroundColor: '#f59e0b', padding: 10, borderRadius: 12, marginRight: 12 },
    adviceTitle: { fontWeight: '700', color: '#92400e', fontSize: 16 },
    adviceText: { color: '#78350f', fontSize: 14, marginTop: 4, lineHeight: 20 },
    totalCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    totalIcon: { backgroundColor: '#ffedd5', padding: 10, borderRadius: 12, marginRight: 12 },
    totalLabel: { color: '#1f2937', fontSize: 16, fontWeight: '700' },
    totalValue: { color: '#f97316', fontSize: 22, fontWeight: '900' },
    mealCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginTop: 12 },
    mealHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    mealIcon: { padding: 10, borderRadius: 12, marginRight: 12 },
    mealTitle: { color: '#1f2937', fontSize: 16, fontWeight: '700' },
    mealCalories: { backgroundColor: '#f3f4f6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    mealCaloriesText: { color: '#4b5563', fontSize: 14, fontWeight: '600' },
    mealItems: { backgroundColor: '#f9fafb', borderRadius: 12, padding: 12 },
    mealItem: { flexDirection: 'row', alignItems: 'center' },
    mealItemText: { color: '#4b5563', fontSize: 14, marginLeft: 4, flex: 1 },
    newPlanButton: { backgroundColor: '#1f2937', padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 16, marginBottom: 20 },
    newPlanText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
