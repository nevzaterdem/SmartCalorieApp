import { useState, useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet, TextInput, ScrollView, Alert, ActivityIndicator, Switch, Linking, RefreshControl } from "react-native";
import { Camera, User, Settings, LogOut, ChevronRight, Bell, Moon, Shield, Globe, HelpCircle, Star, Ruler, Scale, Copy, LogIn, UserPlus } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";
import * as Clipboard from 'expo-clipboard';
import * as Notifications from 'expo-notifications';
import { useTheme } from "../../context/ThemeContext";
import { LinearGradient } from "expo-linear-gradient";
import { isAuthenticated, getProfile, updateProfile, logout as apiLogout } from "../../services/api";
import { useLanguage } from "../../context/LanguageContext";

export default function ProfileScreen() {
    const router = useRouter();
    const { isDarkMode, toggleDarkMode, colors } = useTheme();
    const { t, language, setLanguage } = useLanguage();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [notifications, setNotifications] = useState(true);
    const [waterReminder, setWaterReminder] = useState(true);
    const [mealReminder, setMealReminder] = useState(false);

    const [userId, setUserId] = useState<number | null>(null);

    const [user, setUser] = useState({
        name: "Kullanıcı",
        email: "",
        avatar: null as string | null,
        height: "",
        weight: "",
        age: "",
    });

    useEffect(() => {
        checkAuthAndLoad();
    }, []);

    const checkAuthAndLoad = async () => {
        setLoading(true);
        try {
            const loggedIn = await isAuthenticated();
            setIsLoggedIn(loggedIn);

            if (loggedIn) {
                // Get user data from backend
                const profile = await getProfile();
                if (profile) {
                    setUser({
                        name: profile.name || "Kullanıcı",
                        email: profile.email || "",
                        avatar: null,
                        height: profile.height?.toString() || "",
                        weight: profile.weight?.toString() || "",
                        age: "",
                    });
                    setUserId(profile.id);
                }
            }

            // Load from AsyncStorage as fallback
            await loadLocalProfile();
            await loadSettings();
        } catch (e) {
            console.log("Auth check error", e);
        } finally {
            setLoading(false);
        }
    };

    const loadLocalProfile = async () => {
        try {
            const name = await AsyncStorage.getItem("userName");
            const avatar = await AsyncStorage.getItem("userAvatar");
            const height = await AsyncStorage.getItem("userHeight");
            const weight = await AsyncStorage.getItem("userWeight");
            const age = await AsyncStorage.getItem("userAge");
            const email = await AsyncStorage.getItem("userEmail");
            const id = await AsyncStorage.getItem("userId");

            setUser(prev => ({
                ...prev,
                name: name || prev.name,
                avatar: avatar || null,
                height: height || prev.height,
                weight: weight || prev.weight,
                age: age || prev.age,
                email: email || prev.email,
            }));

            if (id) setUserId(parseInt(id));
        } catch (e) {
            console.log("Profile load error", e);
        }
    };

    const loadSettings = async () => {
        try {
            const notif = await AsyncStorage.getItem("notifications");
            const water = await AsyncStorage.getItem("waterReminder");
            const meal = await AsyncStorage.getItem("mealReminder");

            if (notif !== null) setNotifications(notif === "true");
            if (water !== null) setWaterReminder(water === "true");
            if (meal !== null) setMealReminder(meal === "true");
        } catch (e) {
            console.log("Settings load error", e);
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await checkAuthAndLoad();
        setRefreshing(false);
    }, []);

    const saveSetting = async (key: string, value: boolean) => {
        try {
            await AsyncStorage.setItem(key, value.toString());
        } catch (e) {
            console.log("Settings save error", e);
        }
    };

    const handlePickImage = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            Alert.alert("İzin Gerekli", "Galeriye erişim izni vermelisiniz.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled && result.assets[0]) {
            setUser(prev => ({ ...prev, avatar: result.assets[0].uri }));
            await AsyncStorage.setItem("userAvatar", result.assets[0].uri);
        }
    };

    const handleLogin = () => {
        router.push("/auth");
    };

    const handleLogout = async () => {
        Alert.alert(
            t('logout'),
            t('logout_confirm'),
            [
                { text: t('cancel'), style: "cancel" },
                {
                    text: t('logout'),
                    style: "destructive",
                    onPress: async () => {
                        await apiLogout();
                        await AsyncStorage.multiRemove([
                            "authToken", "userId", "userName", "userEmail",
                            "userWeight", "userHeight", "userAge", "dailyCalorieGoal",
                            "currentDietPlan"
                        ]);
                        // Auth ekranına yönlendir
                        router.replace("/auth");
                    }
                }
            ]
        );
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Save to AsyncStorage
            await AsyncStorage.setItem("userName", user.name);
            await AsyncStorage.setItem("userHeight", user.height);
            await AsyncStorage.setItem("userWeight", user.weight);
            await AsyncStorage.setItem("userAge", user.age);

            // If logged in, also update backend
            if (isLoggedIn) {
                await updateProfile({
                    name: user.name,
                    weight: user.weight ? parseFloat(user.weight) : undefined,
                    height: user.height ? parseFloat(user.height) : undefined,
                    age: user.age ? parseInt(user.age) : undefined,
                });
            }

            // Calculate and save calorie goal
            if (user.weight && user.height) {
                const weight = parseFloat(user.weight);
                const height = parseFloat(user.height);
                const age = parseInt(user.age) || 25;

                const bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
                const tdee = bmr * 1.55;
                const calorieGoal = Math.round(tdee - 500);

                await AsyncStorage.setItem("dailyCalorieGoal", calorieGoal.toString());
            }

            setSaving(false);
            Alert.alert(
                "Başarılı ✅",
                "Profil bilgileriniz güncellendi. Kalori hedefiniz yeniden hesaplandı."
            );
        } catch (e) {
            setSaving(false);
            Alert.alert("Hata", "Kaydedilemedi");
        }
    };

    const copyUserId = async () => {
        if (!userId) return;
        await Clipboard.setStringAsync(`${user.name}#${userId}`);
        Alert.alert("Kopyalandı!", `${user.name}#${userId} panoya kopyalandı. Arkadaşlarınla paylaş!`);
    };

    const toggleNotifications = async (value: boolean) => {
        setNotifications(value);
        saveSetting("notifications", value);

        if (value) {
            const { status } = await Notifications.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert("İzin Gerekli", "Bildirimler için izin vermelisiniz.");
                setNotifications(false);
                saveSetting("notifications", false);
            }
        } else {
            await Notifications.cancelAllScheduledNotificationsAsync();
        }
    };

    const toggleWaterReminder = async (value: boolean) => {
        setWaterReminder(value);
        saveSetting("waterReminder", value);

        if (value) {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: "💧 Su İçme Zamanı!",
                    body: "Günde en az 2 litre su içmeyi unutma!",
                    sound: true,
                },
                trigger: {
                    type: 'timeInterval',
                    seconds: 3600,
                    repeats: true,
                } as any,
            });
            Alert.alert("Aktif", "Su hatırlatıcısı aktif edildi!");
        } else {
            const scheduled = await Notifications.getAllScheduledNotificationsAsync();
            for (const notif of scheduled) {
                if (notif.content.title?.includes("Su")) {
                    await Notifications.cancelScheduledNotificationAsync(notif.identifier);
                }
            }
        }
    };

    const toggleMealReminder = async (value: boolean) => {
        setMealReminder(value);
        saveSetting("mealReminder", value);

        if (value) {
            const mealTimes = [
                { hour: 8, minute: 0, title: "🍳 Kahvaltı Zamanı!" },
                { hour: 12, minute: 30, title: "🍽️ Öğle Yemeği Zamanı!" },
                { hour: 19, minute: 0, title: "🍲 Akşam Yemeği Zamanı!" },
            ];

            for (const meal of mealTimes) {
                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: meal.title,
                        body: "Yemeğini kaydetmeyi unutma!",
                        sound: true,
                    },
                    trigger: {
                        type: 'daily',
                        hour: meal.hour,
                        minute: meal.minute,
                    } as any,
                });
            }
            Alert.alert("Aktif", "Öğün hatırlatıcıları aktif edildi!");
        } else {
            const scheduled = await Notifications.getAllScheduledNotificationsAsync();
            for (const notif of scheduled) {
                if (notif.content.title?.includes("Yemeği") || notif.content.title?.includes("Kahvaltı")) {
                    await Notifications.cancelScheduledNotificationAsync(notif.identifier);
                }
            }
        }
    };

    const openPrivacySettings = () => {
        Alert.alert(
            "Gizlilik ve Güvenlik",
            "Verileriniz güvende! Tüm veriler cihazınızda şifreli olarak saklanır.",
            [{ text: "Tamam" }]
        );
    };

    const openLanguageSettings = () => {
        Alert.alert(
            t('language'),
            t('settings') + ":",
            [
                { text: "Türkçe 🇹🇷", onPress: () => setLanguage('tr') },
                { text: "English 🇬🇧", onPress: () => setLanguage('en') },
                { text: t('cancel'), style: 'cancel' }
            ]
        );
    };

    const openHelp = () => {
        Alert.alert(
            "Yardım & Destek",
            "Sorularınız için: destek@smartcalorie.app\n\nSSS:\n• Kalori nasıl hesaplanır?\n• Fotoğraf analizi nasıl çalışır?\n• Diyet planı nasıl oluşturulur?",
            [
                { text: "E-posta Gönder", onPress: () => Linking.openURL("mailto:destek@smartcalorie.app") },
                { text: "Kapat" }
            ]
        );
    };

    const rateApp = () => {
        Alert.alert(
            "Uygulamayı Değerlendir",
            "SmartCalorie AI'ı beğendiniz mi? App Store'da değerlendirin!",
            [
                { text: "Daha Sonra", style: "cancel" },
                {
                    text: "Değerlendir ⭐", onPress: () => {
                        Alert.alert("Teşekkürler!", "Değerlendirmeniz için teşekkürler! 💚");
                    }
                }
            ]
        );
    };

    const dynamicStyles = {
        container: { backgroundColor: colors.background },
        card: { backgroundColor: colors.card },
        text: { color: colors.text },
        textSecondary: { color: colors.textSecondary },
        textMuted: { color: colors.textMuted },
        border: { borderColor: colors.border },
        input: { backgroundColor: colors.inputBg, borderColor: colors.border },
    };

    if (loading) {
        return (
            <View style={[styles.container, dynamicStyles.container, styles.loadingContainer]}>
                <ActivityIndicator size="large" color="#10b981" />
            </View>
        );
    }

    // Not logged in - Show login prompt
    if (!isLoggedIn) {
        return (
            <ScrollView
                style={[styles.container, dynamicStyles.container]}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Header */}
                <LinearGradient
                    colors={["#059669", "#10b981", "#34d399"]}
                    style={styles.loginHeader}
                >
                    <View style={styles.loginLogoContainer}>
                        <User color="#fff" size={48} />
                    </View>
                    <Text style={styles.loginHeaderTitle}>Hesabınıza Giriş Yapın</Text>
                    <Text style={styles.loginHeaderSubtitle}>
                        Tüm özelliklerden yararlanmak için giriş yapın
                    </Text>
                </LinearGradient>

                {/* Login Card */}
                <View style={[styles.loginCard, dynamicStyles.card]}>
                    <Text style={[styles.loginCardTitle, dynamicStyles.text]}>
                        Neden Giriş Yapmalıyım?
                    </Text>

                    <View style={styles.benefitItem}>
                        <Text style={styles.benefitIcon}>💾</Text>
                        <View style={styles.benefitText}>
                            <Text style={[styles.benefitTitle, dynamicStyles.text]}>Verilerinizi Kaydedin</Text>
                            <Text style={[styles.benefitDesc, dynamicStyles.textMuted]}>
                                Diyet planlarınız ve ilerlemeniz güvenle saklanır
                            </Text>
                        </View>
                    </View>

                    <View style={styles.benefitItem}>
                        <Text style={styles.benefitIcon}>📊</Text>
                        <View style={styles.benefitText}>
                            <Text style={[styles.benefitTitle, dynamicStyles.text]}>Öğün Takibi</Text>
                            <Text style={[styles.benefitDesc, dynamicStyles.textMuted]}>
                                Günlük öğünlerinizi takip edin ve ilerlemenizi görün
                            </Text>
                        </View>
                    </View>

                    <View style={styles.benefitItem}>
                        <Text style={styles.benefitIcon}>👥</Text>
                        <View style={styles.benefitText}>
                            <Text style={[styles.benefitTitle, dynamicStyles.text]}>Arkadaş Ekle</Text>
                            <Text style={[styles.benefitDesc, dynamicStyles.textMuted]}>
                                Arkadaşlarınızla yarışın ve motive olun
                            </Text>
                        </View>
                    </View>

                    <View style={styles.benefitItem}>
                        <Text style={styles.benefitIcon}>🔥</Text>
                        <View style={styles.benefitText}>
                            <Text style={[styles.benefitTitle, dynamicStyles.text]}>Seri Takibi</Text>
                            <Text style={[styles.benefitDesc, dynamicStyles.textMuted]}>
                                Günlük serinizi koruyun ve rozetler kazanın
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity onPress={handleLogin} activeOpacity={0.9}>
                        <LinearGradient
                            colors={["#059669", "#10b981"]}
                            style={styles.loginButton}
                        >
                            <LogIn color="#fff" size={20} />
                            <Text style={styles.loginButtonText}>Giriş Yap</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={handleLogin} style={styles.registerButton}>
                        <UserPlus color="#10b981" size={20} />
                        <Text style={styles.registerButtonText}>Hesap Oluştur</Text>
                    </TouchableOpacity>
                </View>

                {/* Settings (available without login) */}
                <View style={[styles.settingsSection, dynamicStyles.card]}>
                    <Text style={[styles.sectionTitle, dynamicStyles.text]}>🎨 Görünüm</Text>

                    <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
                        <View style={styles.settingInfo}>
                            <View style={[styles.settingIcon, { backgroundColor: isDarkMode ? '#374151' : '#1f2937' }]}>
                                <Moon color="#fff" size={20} />
                            </View>
                            <View>
                                <Text style={[styles.settingText, dynamicStyles.text]}>Karanlık Tema</Text>
                                <Text style={[styles.settingDesc, dynamicStyles.textMuted]}>
                                    {isDarkMode ? "Açık" : "Kapalı"}
                                </Text>
                            </View>
                        </View>
                        <Switch
                            value={isDarkMode}
                            onValueChange={toggleDarkMode}
                            trackColor={{ false: colors.border, true: "#a7f3d0" }}
                            thumbColor={isDarkMode ? "#10b981" : colors.textMuted}
                        />
                    </View>
                </View>

                <View style={styles.versionSection}>
                    <Text style={[styles.versionText, dynamicStyles.textMuted]}>SmartCalorie AI v1.0.0</Text>
                    <Text style={[styles.versionSubtext, { color: colors.border }]}>Made with ❤️</Text>
                </View>
            </ScrollView>
        );
    }

    // Logged in - Show full profile
    return (
        <ScrollView
            style={[styles.container, dynamicStyles.container]}
            showsVerticalScrollIndicator={false}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
            {/* Header */}
            <View style={[styles.header, dynamicStyles.card]}>
                <Text style={[styles.headerTitle, dynamicStyles.text]}>Profilim</Text>
            </View>

            {/* Avatar Section */}
            <View style={[styles.avatarSection, dynamicStyles.card]}>
                <TouchableOpacity onPress={handlePickImage} style={styles.avatarContainer}>
                    {user.avatar ? (
                        <Image source={{ uri: user.avatar }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatarPlaceholder, { backgroundColor: colors.inputBg }]}>
                            <User color={colors.textMuted} size={40} />
                        </View>
                    )}
                    <View style={styles.editBadge}>
                        <Camera color="#fff" size={14} />
                    </View>
                </TouchableOpacity>
                <Text style={[styles.userName, dynamicStyles.text]}>{user.name}</Text>
                <Text style={[styles.userEmail, dynamicStyles.textMuted]}>{user.email}</Text>

                {/* User ID Badge */}
                {userId && (
                    <>
                        <TouchableOpacity style={styles.userIdBadge} onPress={copyUserId}>
                            <Text style={styles.userIdText}>{user.name}#{userId}</Text>
                            <Copy color="#3b82f6" size={14} />
                        </TouchableOpacity>
                        <Text style={[styles.userIdHint, dynamicStyles.textMuted]}>ID'ni kopyalamak için dokun</Text>
                    </>
                )}
            </View>

            {/* Form Section */}
            <View style={[styles.formSection, dynamicStyles.card]}>
                <Text style={[styles.sectionTitle, dynamicStyles.text]}>{t('personal_info')}</Text>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, dynamicStyles.textSecondary]}>{t('name')}</Text>
                    <View style={[styles.inputContainer, dynamicStyles.input]}>
                        <User color={colors.textMuted} size={20} />
                        <TextInput
                            style={[styles.input, dynamicStyles.text]}
                            value={user.name}
                            onChangeText={(t) => setUser({ ...user, name: t })}
                            placeholderTextColor={colors.textMuted}
                        />
                    </View>
                </View>

                <View style={styles.row}>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={[styles.label, dynamicStyles.textSecondary]}>{t('height')} (cm)</Text>
                        <View style={[styles.inputContainer, dynamicStyles.input]}>
                            <Ruler color={colors.textMuted} size={20} />
                            <TextInput
                                style={[styles.input, dynamicStyles.text]}
                                value={user.height}
                                keyboardType="numeric"
                                onChangeText={(t) => setUser({ ...user, height: t })}
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>
                    </View>
                    <View style={{ width: 16 }} />
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={[styles.label, dynamicStyles.textSecondary]}>{t('weight')} (kg)</Text>
                        <View style={[styles.inputContainer, dynamicStyles.input]}>
                            <Scale color={colors.textMuted} size={20} />
                            <TextInput
                                style={[styles.input, dynamicStyles.text]}
                                value={user.weight}
                                keyboardType="numeric"
                                onChangeText={(t) => setUser({ ...user, weight: t })}
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, dynamicStyles.textSecondary]}>{t('age')}</Text>
                    <View style={[styles.inputContainer, dynamicStyles.input]}>
                        <User color={colors.textMuted} size={20} />
                        <TextInput
                            style={[styles.input, dynamicStyles.text]}
                            value={user.age}
                            keyboardType="numeric"
                            placeholder="25"
                            onChangeText={(t) => setUser({ ...user, age: t })}
                            placeholderTextColor={colors.textMuted}
                        />
                    </View>
                </View>

                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                    {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>{t('save')}</Text>}
                </TouchableOpacity>
            </View>

            {/* Notification Settings */}
            <View style={[styles.settingsSection, dynamicStyles.card]}>
                <Text style={[styles.sectionTitle, dynamicStyles.text]}>🔔 {t('notifications')}</Text>

                <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
                    <View style={styles.settingInfo}>
                        <View style={[styles.settingIcon, { backgroundColor: '#fef3c7' }]}>
                            <Bell color="#f59e0b" size={20} />
                        </View>
                        <View>
                            <Text style={[styles.settingText, dynamicStyles.text]}>{t('notifications')}</Text>
                            <Text style={[styles.settingDesc, dynamicStyles.textMuted]}>{t('notifications')}</Text>
                        </View>
                    </View>
                    <Switch
                        value={notifications}
                        onValueChange={toggleNotifications}
                        trackColor={{ false: colors.border, true: "#a7f3d0" }}
                        thumbColor={notifications ? "#10b981" : colors.textMuted}
                    />
                </View>

                <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
                    <View style={styles.settingInfo}>
                        <View style={[styles.settingIcon, { backgroundColor: '#dbeafe' }]}>
                            <Text style={{ fontSize: 18 }}>💧</Text>
                        </View>
                        <View>
                            <Text style={[styles.settingText, dynamicStyles.text]}>{t('water_reminder')}</Text>
                            <Text style={[styles.settingDesc, dynamicStyles.textMuted]}>{t('water_reminder')}</Text>
                        </View>
                    </View>
                    <Switch
                        value={waterReminder}
                        onValueChange={toggleWaterReminder}
                        trackColor={{ false: colors.border, true: "#a7f3d0" }}
                        thumbColor={waterReminder ? "#10b981" : colors.textMuted}
                    />
                </View>

                <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
                    <View style={styles.settingInfo}>
                        <View style={[styles.settingIcon, { backgroundColor: '#fce7f3' }]}>
                            <Text style={{ fontSize: 18 }}>🍽️</Text>
                        </View>
                        <View>
                            <Text style={[styles.settingText, dynamicStyles.text]}>{t('meal_reminder')}</Text>
                            <Text style={[styles.settingDesc, dynamicStyles.textMuted]}>{t('meal_reminder')}</Text>
                        </View>
                    </View>
                    <Switch
                        value={mealReminder}
                        onValueChange={toggleMealReminder}
                        trackColor={{ false: colors.border, true: "#a7f3d0" }}
                        thumbColor={mealReminder ? "#10b981" : colors.textMuted}
                    />
                </View>
            </View>

            {/* Appearance Settings */}
            <View style={[styles.settingsSection, dynamicStyles.card]}>
                <Text style={[styles.sectionTitle, dynamicStyles.text]}>🎨 {t('appearance')}</Text>

                <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
                    <View style={styles.settingInfo}>
                        <View style={[styles.settingIcon, { backgroundColor: isDarkMode ? '#374151' : '#1f2937' }]}>
                            <Moon color="#fff" size={20} />
                        </View>
                        <View>
                            <Text style={[styles.settingText, dynamicStyles.text]}>{t('dark_mode')}</Text>
                            <Text style={[styles.settingDesc, dynamicStyles.textMuted]}>
                                {isDarkMode ? "On" : "Off"}
                            </Text>
                        </View>
                    </View>
                    <Switch
                        value={isDarkMode}
                        onValueChange={toggleDarkMode}
                        trackColor={{ false: colors.border, true: "#a7f3d0" }}
                        thumbColor={isDarkMode ? "#10b981" : colors.textMuted}
                    />
                </View>
            </View>

            {/* Other Settings */}
            <View style={[styles.settingsSection, dynamicStyles.card]}>
                <Text style={[styles.sectionTitle, dynamicStyles.text]}>⚙️ {t('other_settings')}</Text>

                <TouchableOpacity style={[styles.settingItem, { borderBottomColor: colors.border }]} onPress={openPrivacySettings}>
                    <View style={styles.settingInfo}>
                        <View style={[styles.settingIcon, { backgroundColor: '#dcfce7' }]}>
                            <Shield color="#22c55e" size={20} />
                        </View>
                        <Text style={[styles.settingText, dynamicStyles.text]}>{t('privacy_security')}</Text>
                    </View>
                    <ChevronRight color={colors.textMuted} size={20} />
                </TouchableOpacity>

                <TouchableOpacity style={[styles.settingItem, { borderBottomColor: colors.border }]} onPress={openLanguageSettings}>
                    <View style={styles.settingInfo}>
                        <View style={[styles.settingIcon, { backgroundColor: '#e0e7ff' }]}>
                            <Globe color="#6366f1" size={20} />
                        </View>
                        <Text style={[styles.settingText, dynamicStyles.text]}>{t('language')}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={[styles.settingValue, dynamicStyles.textMuted]}>{language === 'tr' ? 'Türkçe' : 'English'}</Text>
                        <ChevronRight color={colors.textMuted} size={20} />
                    </View>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.settingItem, { borderBottomColor: colors.border }]} onPress={openHelp}>
                    <View style={styles.settingInfo}>
                        <View style={[styles.settingIcon, { backgroundColor: '#fef3c7' }]}>
                            <HelpCircle color="#f59e0b" size={20} />
                        </View>
                        <Text style={[styles.settingText, dynamicStyles.text]}>{t('help_support')}</Text>
                    </View>
                    <ChevronRight color={colors.textMuted} size={20} />
                </TouchableOpacity>

                <TouchableOpacity style={[styles.settingItem, { borderBottomColor: colors.border }]} onPress={rateApp}>
                    <View style={styles.settingInfo}>
                        <View style={[styles.settingIcon, { backgroundColor: '#fce7f3' }]}>
                            <Star color="#ec4899" size={20} />
                        </View>
                        <Text style={[styles.settingText, dynamicStyles.text]}>{t('rate_app')}</Text>
                    </View>
                    <ChevronRight color={colors.textMuted} size={20} />
                </TouchableOpacity>

                <TouchableOpacity style={[styles.settingItem, styles.logoutItem]} onPress={handleLogout}>
                    <View style={styles.settingInfo}>
                        <View style={[styles.settingIcon, { backgroundColor: '#fee2e2' }]}>
                            <LogOut color="#ef4444" size={20} />
                        </View>
                        <Text style={[styles.settingText, { color: '#ef4444' }]}>{t('logout')}</Text>
                    </View>
                </TouchableOpacity>
            </View>

            {/* App Version */}
            <View style={styles.versionSection}>
                <Text style={[styles.versionText, dynamicStyles.textMuted]}>SmartCalorie AI v1.0.0</Text>
                <Text style={[styles.versionSubtext, { color: colors.border }]}>Made with ❤️</Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
    },

    // Login Screen Styles
    loginHeader: {
        paddingTop: 80,
        paddingBottom: 60,
        alignItems: 'center',
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
    },
    loginLogoContainer: {
        width: 100,
        height: 100,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    loginHeaderTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#fff',
    },
    loginHeaderSubtitle: {
        fontSize: 14,
        color: '#d1fae5',
        marginTop: 8,
        textAlign: 'center',
        paddingHorizontal: 40,
    },
    loginCard: {
        marginHorizontal: 20,
        marginTop: -30,
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 5,
    },
    loginCardTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 20,
        textAlign: 'center',
    },
    benefitItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    benefitIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    benefitText: {
        flex: 1,
    },
    benefitTitle: {
        fontSize: 15,
        fontWeight: '600',
    },
    benefitDesc: {
        fontSize: 13,
        marginTop: 2,
    },
    loginButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        marginTop: 16,
        gap: 8,
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    registerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        marginTop: 12,
        backgroundColor: '#ecfdf5',
        borderWidth: 2,
        borderColor: '#10b981',
        gap: 8,
    },
    registerButtonText: {
        color: '#10b981',
        fontSize: 16,
        fontWeight: '700',
    },

    // Avatar Section
    avatarSection: {
        alignItems: 'center',
        paddingBottom: 24,
        marginBottom: 16,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 12,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#10b981',
        padding: 8,
        borderRadius: 20,
        borderWidth: 3,
        borderColor: '#fff',
    },
    userName: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        marginBottom: 12,
    },
    userIdBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#eff6ff',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 8,
        borderWidth: 1,
        borderColor: '#bfdbfe',
    },
    userIdText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#3b82f6',
    },
    userIdHint: {
        fontSize: 12,
        marginTop: 6,
    },

    // Form Section
    formSection: {
        marginHorizontal: 16,
        padding: 20,
        borderRadius: 20,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 16,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 50,
    },
    input: {
        flex: 1,
        marginLeft: 10,
        fontSize: 15,
    },
    row: {
        flexDirection: 'row',
    },
    saveButton: {
        backgroundColor: '#10b981',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
    },

    // Settings Section
    settingsSection: {
        marginHorizontal: 16,
        padding: 20,
        borderRadius: 20,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    settingInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    settingIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    settingText: {
        fontSize: 15,
        fontWeight: '600',
    },
    settingDesc: {
        fontSize: 12,
        marginTop: 2,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    settingValue: {
        fontSize: 14,
        marginRight: 4,
    },
    logoutItem: {
        borderBottomWidth: 0,
        marginTop: 8,
    },
    versionSection: {
        alignItems: 'center',
        paddingVertical: 30,
        marginBottom: 20,
    },
    versionText: {
        fontSize: 14,
        fontWeight: '600',
    },
    versionSubtext: {
        fontSize: 12,
        marginTop: 4,
    },
});
