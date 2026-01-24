import { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ChefHat, Mail, Lock, User, Eye, EyeOff } from "lucide-react-native";
import { API_BASE_URL } from "../services/api";

export default function AuthScreen() {
    const router = useRouter();
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");

    const handleSubmit = async () => {
        if (!email || !password) {
            Alert.alert("Hata", "E-posta ve şifre gerekli");
            return;
        }

        if (!isLogin && !name) {
            Alert.alert("Hata", "İsim gerekli");
            return;
        }

        setLoading(true);

        try {
            const endpoint = isLogin ? "/auth/login" : "/auth/register";
            const body = isLogin
                ? { email, password }
                : { email, password, name };

            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Bir hata oluştu");
            }

            // Save token and user data
            await AsyncStorage.setItem("authToken", data.token);
            await AsyncStorage.setItem("userId", data.user.id.toString());
            await AsyncStorage.setItem("userName", data.user.name || name);
            await AsyncStorage.setItem("userEmail", data.user.email);

            // Direkt ana ekrana yönlendir
            router.replace("/(tabs)");
        } catch (error: any) {
            Alert.alert("Hata", error.message || "Bir hata oluştu");
        } finally {
            setLoading(false);
        }
    };

    const skipAuth = async () => {
        // Demo mode - use default user
        await AsyncStorage.setItem("userId", "1");
        await AsyncStorage.setItem("userName", "Demo Kullanıcı");
        router.replace("/(tabs)");
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <LinearGradient
                    colors={["#059669", "#10b981", "#34d399"]}
                    style={styles.header}
                >
                    <View style={styles.logoContainer}>
                        <ChefHat color="#fff" size={48} />
                    </View>
                    <Text style={styles.logoText}>SmartCalorie AI</Text>
                    <Text style={styles.tagline}>
                        Yapay Zeka ile Akıllı Beslenme
                    </Text>
                </LinearGradient>

                {/* Form */}
                <View style={styles.formContainer}>
                    <Text style={styles.title}>
                        {isLogin ? "Hoş Geldiniz!" : "Hesap Oluşturun"}
                    </Text>
                    <Text style={styles.subtitle}>
                        {isLogin
                            ? "Hesabınıza giriş yapın"
                            : "Sağlıklı yaşama ilk adım"}
                    </Text>

                    {/* Name Input (only for register) */}
                    {!isLogin && (
                        <View style={styles.inputContainer}>
                            <User color="#9ca3af" size={20} />
                            <TextInput
                                style={styles.input}
                                placeholder="Ad Soyad"
                                placeholderTextColor="#9ca3af"
                                value={name}
                                onChangeText={setName}
                                autoCapitalize="words"
                            />
                        </View>
                    )}

                    {/* Email Input */}
                    <View style={styles.inputContainer}>
                        <Mail color="#9ca3af" size={20} />
                        <TextInput
                            style={styles.input}
                            placeholder="E-posta"
                            placeholderTextColor="#9ca3af"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    {/* Password Input */}
                    <View style={styles.inputContainer}>
                        <Lock color="#9ca3af" size={20} />
                        <TextInput
                            style={styles.input}
                            placeholder="Şifre"
                            placeholderTextColor="#9ca3af"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity
                            onPress={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? (
                                <EyeOff color="#9ca3af" size={20} />
                            ) : (
                                <Eye color="#9ca3af" size={20} />
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                        onPress={handleSubmit}
                        disabled={loading}
                        activeOpacity={0.9}
                    >
                        <LinearGradient
                            colors={["#059669", "#10b981"]}
                            style={styles.submitButton}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.submitButtonText}>
                                    {isLogin ? "Giriş Yap" : "Kayıt Ol"}
                                </Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Toggle Auth Mode */}
                    <TouchableOpacity
                        onPress={() => setIsLogin(!isLogin)}
                        style={styles.toggleButton}
                    >
                        <Text style={styles.toggleText}>
                            {isLogin
                                ? "Hesabınız yok mu? "
                                : "Zaten hesabınız var mı? "}
                            <Text style={styles.toggleTextBold}>
                                {isLogin ? "Kayıt Olun" : "Giriş Yapın"}
                            </Text>
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Features */}
                <View style={styles.features}>
                    <View style={styles.featureItem}>
                        <Text style={styles.featureIcon}>📸</Text>
                        <Text style={styles.featureText}>AI Analiz</Text>
                    </View>
                    <View style={styles.featureItem}>
                        <Text style={styles.featureIcon}>🥗</Text>
                        <Text style={styles.featureText}>Diyet Planı</Text>
                    </View>
                    <View style={styles.featureItem}>
                        <Text style={styles.featureIcon}>💧</Text>
                        <Text style={styles.featureText}>Su Takibi</Text>
                    </View>
                    <View style={styles.featureItem}>
                        <Text style={styles.featureIcon}>🏆</Text>
                        <Text style={styles.featureText}>Seri Takibi</Text>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f3f4f6",
    },
    scrollContent: {
        flexGrow: 1,
    },
    header: {
        paddingTop: 80,
        paddingBottom: 40,
        alignItems: "center",
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.2)",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 16,
    },
    logoText: {
        fontSize: 28,
        fontWeight: "900",
        color: "#fff",
    },
    tagline: {
        fontSize: 14,
        color: "#d1fae5",
        marginTop: 4,
    },
    formContainer: {
        backgroundColor: "#fff",
        marginHorizontal: 20,
        marginTop: -20,
        borderRadius: 24,
        padding: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 5,
    },
    title: {
        fontSize: 24,
        fontWeight: "800",
        color: "#1f2937",
        textAlign: "center",
    },
    subtitle: {
        fontSize: 14,
        color: "#6b7280",
        textAlign: "center",
        marginTop: 4,
        marginBottom: 24,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f9fafb",
        borderRadius: 12,
        paddingHorizontal: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#e5e7eb",
    },
    input: {
        flex: 1,
        paddingVertical: 16,
        paddingHorizontal: 12,
        fontSize: 16,
        color: "#1f2937",
    },
    submitButton: {
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 8,
    },
    submitButtonText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "700",
    },
    toggleButton: {
        marginTop: 20,
        alignItems: "center",
    },
    toggleText: {
        color: "#6b7280",
        fontSize: 14,
    },
    toggleTextBold: {
        color: "#10b981",
        fontWeight: "700",
    },
    skipButton: {
        marginTop: 16,
        alignItems: "center",
        paddingVertical: 12,
    },
    skipText: {
        color: "#9ca3af",
        fontSize: 14,
    },
    features: {
        flexDirection: "row",
        justifyContent: "space-around",
        paddingHorizontal: 20,
        paddingVertical: 30,
    },
    featureItem: {
        alignItems: "center",
    },
    featureIcon: {
        fontSize: 28,
        marginBottom: 4,
    },
    featureText: {
        fontSize: 12,
        color: "#6b7280",
        fontWeight: "600",
    },
});
