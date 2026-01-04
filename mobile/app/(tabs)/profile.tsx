import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet, TextInput, ScrollView, Alert, ActivityIndicator, Switch, Linking } from "react-native";
import { Camera, User, Settings, LogOut, ChevronRight, Bell, Moon, Shield, Globe, HelpCircle, Star, Ruler, Scale, Copy } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";
import * as Clipboard from 'expo-clipboard';
import * as Notifications from 'expo-notifications';
import { useTheme } from "../../context/ThemeContext";

export default function ProfileScreen() {
    const router = useRouter();
    const { isDarkMode, toggleDarkMode, colors } = useTheme();

    const [loading, setLoading] = useState(false);
    const [notifications, setNotifications] = useState(true);
    const [waterReminder, setWaterReminder] = useState(true);
    const [mealReminder, setMealReminder] = useState(false);

    // Mock user ID - in real app this comes from backend
    const [userId] = useState(1);

    const [user, setUser] = useState({
        name: "Kullanıcı",
        email: "nevzat@example.com",
        avatar: null as string | null,
        height: "180",
        weight: "75",
        age: "25",
    });

    useEffect(() => {
        loadProfile();
        loadSettings();
    }, []);

    const loadProfile = async () => {
        // TODO: Load from backend
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

    const handleLogout = async () => {
        Alert.alert(
            "Çıkış Yap",
            "Hesabınızdan çıkış yapmak istediğinize emin misiniz?",
            [
                { text: "İptal", style: "cancel" },
                {
                    text: "Çıkış Yap",
                    style: "destructive",
                    onPress: async () => {
                        await AsyncStorage.removeItem("authToken");
                        router.replace("/(tabs)");
                        Alert.alert("Çıkış Yapıldı", "Başarıyla çıkış yaptınız.");
                    }
                }
            ]
        );
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await AsyncStorage.setItem("userName", user.name);
            await AsyncStorage.setItem("userHeight", user.height);
            await AsyncStorage.setItem("userWeight", user.weight);
            setTimeout(() => {
                setLoading(false);
                Alert.alert("Başarılı", "Profil bilgileriniz güncellendi.");
            }, 500);
        } catch (e) {
            setLoading(false);
            Alert.alert("Hata", "Kaydedilemedi");
        }
    };

    const copyUserId = async () => {
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
            // Schedule water reminder every hour
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: "💧 Su İçme Zamanı!",
                    body: "Günde en az 2 litre su içmeyi unutma!",
                    sound: true,
                },
                trigger: {
                    seconds: 3600, // Every hour
                    repeats: true,
                } as any,
            });
            Alert.alert("Aktif", "Su hatırlatıcısı aktif edildi!");
        } else {
            // Cancel water reminders
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
            // Schedule meal reminders at 8:00, 12:30, 19:00
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
                        hour: meal.hour,
                        minute: meal.minute,
                        repeats: true,
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
            "Dil Seçimi",
            "Şu anda sadece Türkçe desteklenmektedir. Yakında daha fazla dil eklenecek!",
            [{ text: "Tamam" }]
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
                        // In production, this would open App Store
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

    return (
        <ScrollView style={[styles.container, dynamicStyles.container]} showsVerticalScrollIndicator={false}>
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

                {/* User ID Badge */}
                <TouchableOpacity style={styles.userIdBadge} onPress={copyUserId}>
                    <Text style={styles.userIdText}>{user.name}#{userId}</Text>
                    <Copy color="#3b82f6" size={14} />
                </TouchableOpacity>
                <Text style={[styles.userIdHint, dynamicStyles.textMuted]}>ID'ni kopyalamak için dokun</Text>
            </View>

            {/* Form Section */}
            <View style={[styles.formSection, dynamicStyles.card]}>
                <Text style={[styles.sectionTitle, dynamicStyles.text]}>Kişisel Bilgiler</Text>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, dynamicStyles.textSecondary]}>Ad Soyad</Text>
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
                        <Text style={[styles.label, dynamicStyles.textSecondary]}>Boy (cm)</Text>
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
                        <Text style={[styles.label, dynamicStyles.textSecondary]}>Kilo (kg)</Text>
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

                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Değişiklikleri Kaydet</Text>}
                </TouchableOpacity>
            </View>

            {/* Notification Settings */}
            <View style={[styles.settingsSection, dynamicStyles.card]}>
                <Text style={[styles.sectionTitle, dynamicStyles.text]}>🔔 Bildirim Ayarları</Text>

                <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
                    <View style={styles.settingInfo}>
                        <View style={[styles.settingIcon, { backgroundColor: '#fef3c7' }]}>
                            <Bell color="#f59e0b" size={20} />
                        </View>
                        <View>
                            <Text style={[styles.settingText, dynamicStyles.text]}>Bildirimler</Text>
                            <Text style={[styles.settingDesc, dynamicStyles.textMuted]}>Tüm bildirimleri aç/kapat</Text>
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
                            <Text style={[styles.settingText, dynamicStyles.text]}>Su Hatırlatıcı</Text>
                            <Text style={[styles.settingDesc, dynamicStyles.textMuted]}>Saatlik su içme hatırlatması</Text>
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
                            <Text style={[styles.settingText, dynamicStyles.text]}>Öğün Hatırlatıcı</Text>
                            <Text style={[styles.settingDesc, dynamicStyles.textMuted]}>Yemek zamanı bildirimleri</Text>
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

            {/* Other Settings */}
            <View style={[styles.settingsSection, dynamicStyles.card]}>
                <Text style={[styles.sectionTitle, dynamicStyles.text]}>⚙️ Diğer Ayarlar</Text>

                <TouchableOpacity style={[styles.settingItem, { borderBottomColor: colors.border }]} onPress={openPrivacySettings}>
                    <View style={styles.settingInfo}>
                        <View style={[styles.settingIcon, { backgroundColor: '#dcfce7' }]}>
                            <Shield color="#22c55e" size={20} />
                        </View>
                        <Text style={[styles.settingText, dynamicStyles.text]}>Gizlilik ve Güvenlik</Text>
                    </View>
                    <ChevronRight color={colors.textMuted} size={20} />
                </TouchableOpacity>

                <TouchableOpacity style={[styles.settingItem, { borderBottomColor: colors.border }]} onPress={openLanguageSettings}>
                    <View style={styles.settingInfo}>
                        <View style={[styles.settingIcon, { backgroundColor: '#e0e7ff' }]}>
                            <Globe color="#6366f1" size={20} />
                        </View>
                        <Text style={[styles.settingText, dynamicStyles.text]}>Dil</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={[styles.settingValue, dynamicStyles.textMuted]}>Türkçe</Text>
                        <ChevronRight color={colors.textMuted} size={20} />
                    </View>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.settingItem, { borderBottomColor: colors.border }]} onPress={openHelp}>
                    <View style={styles.settingInfo}>
                        <View style={[styles.settingIcon, { backgroundColor: '#fef3c7' }]}>
                            <HelpCircle color="#f59e0b" size={20} />
                        </View>
                        <Text style={[styles.settingText, dynamicStyles.text]}>Yardım & Destek</Text>
                    </View>
                    <ChevronRight color={colors.textMuted} size={20} />
                </TouchableOpacity>

                <TouchableOpacity style={[styles.settingItem, { borderBottomColor: colors.border }]} onPress={rateApp}>
                    <View style={styles.settingInfo}>
                        <View style={[styles.settingIcon, { backgroundColor: '#fce7f3' }]}>
                            <Star color="#ec4899" size={20} />
                        </View>
                        <Text style={[styles.settingText, dynamicStyles.text]}>Uygulamayı Değerlendir</Text>
                    </View>
                    <ChevronRight color={colors.textMuted} size={20} />
                </TouchableOpacity>

                <TouchableOpacity style={[styles.settingItem, styles.logoutItem]} onPress={handleLogout}>
                    <View style={styles.settingInfo}>
                        <View style={[styles.settingIcon, { backgroundColor: '#fee2e2' }]}>
                            <LogOut color="#ef4444" size={20} />
                        </View>
                        <Text style={[styles.settingText, { color: '#ef4444' }]}>Çıkış Yap</Text>
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
    header: {
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
    },
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
        marginBottom: 8,
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
