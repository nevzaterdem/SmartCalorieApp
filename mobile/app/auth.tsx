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
import { ChefHat, Mail, Lock, User, Eye, EyeOff, ArrowLeft, KeyRound, ShieldCheck } from "lucide-react-native";
import { API_BASE_URL } from "../services/api";
import { useLanguage } from "../context/LanguageContext";

export default function AuthScreen() {
    const router = useRouter();
    const { t, language } = useLanguage();
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");

    // Forgot password state
    const [forgotMode, setForgotMode] = useState<'none' | 'email' | 'code' | 'newpass'>('none');
    const [resetEmail, setResetEmail] = useState("");
    const [resetCode, setResetCode] = useState("");
    const [newPassword, setNewPassword] = useState("");

    const handleSubmit = async () => {
        if (!email || !password) {
            Alert.alert(t('error'), t('error_email_password'));
            return;
        }

        if (!isLogin && !name) {
            Alert.alert(t('error'), t('error_name'));
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
            Alert.alert(t('error'), error.message || t('error_generic'));
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

    // Forgot password handlers
    const handleForgotSendCode = async () => {
        if (!resetEmail) {
            Alert.alert(t('error'), language === 'tr' ? 'Email adresinizi girin' : 'Enter your email');
            return;
        }
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: resetEmail }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || (language === 'tr' ? 'Kod gönderilemedi' : 'Failed to send code'));
            }
            // Backend returns the code in API response (no email service yet)
            Alert.alert(
                language === 'tr' ? 'Kod Gönderildi' : 'Code Sent',
                language === 'tr'
                    ? `Şifre sıfırlama kodunuz: ${data.resetCode}\n\n(Not: Email servisi bağlanınca kod email ile gönderilecek)`
                    : `Your reset code is: ${data.resetCode}\n\n(Note: Code will be sent via email once email service is connected)`
            );
            setForgotMode('code');
        } catch (error: any) {
            Alert.alert(t('error'), error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!resetCode || !newPassword) {
            Alert.alert(t('error'), language === 'tr' ? 'Kod ve yeni şifre gerekli' : 'Code and new password required');
            return;
        }
        if (newPassword.length < 6) {
            Alert.alert(t('error'), language === 'tr' ? 'Şifre en az 6 karakter olmalı' : 'Password must be at least 6 characters');
            return;
        }
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: resetEmail, code: resetCode, newPassword }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || (language === 'tr' ? 'Şifre sıfırlanamadı' : 'Failed to reset password'));
            }
            Alert.alert(
                language === 'tr' ? 'Başarılı!' : 'Success!',
                language === 'tr' ? 'Şifreniz başarıyla değiştirildi. Giriş yapabilirsiniz.' : 'Password changed successfully. You can now log in.',
            );
            // Reset state and go back to login
            setForgotMode('none');
            setResetEmail("");
            setResetCode("");
            setNewPassword("");
            setIsLogin(true);
        } catch (error: any) {
            Alert.alert(t('error'), error.message);
        } finally {
            setLoading(false);
        }
    };

    // Forgot password screens
    if (forgotMode !== 'none') {
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
                            <KeyRound color="#fff" size={48} />
                        </View>
                        <Text style={styles.logoText}>
                            {language === 'tr' ? 'Şifre Sıfırlama' : 'Reset Password'}
                        </Text>
                        <Text style={styles.tagline}>
                            {forgotMode === 'email'
                                ? (language === 'tr' ? 'Email adresinizi girin' : 'Enter your email')
                                : (language === 'tr' ? 'Sıfırlama kodunu girin' : 'Enter reset code')
                            }
                        </Text>
                    </LinearGradient>

                    {/* Form */}
                    <View style={styles.formContainer}>
                        {/* Back button */}
                        <TouchableOpacity
                            onPress={() => {
                                if (forgotMode === 'code') setForgotMode('email');
                                else setForgotMode('none');
                            }}
                            style={styles.backButton}
                        >
                            <ArrowLeft color="#6b7280" size={20} />
                            <Text style={styles.backButtonText}>
                                {language === 'tr' ? 'Geri' : 'Back'}
                            </Text>
                        </TouchableOpacity>

                        {forgotMode === 'email' && (
                            <>
                                <Text style={styles.title}>
                                    {language === 'tr' ? 'Şifremi Unuttum' : 'Forgot Password'}
                                </Text>
                                <Text style={styles.subtitle}>
                                    {language === 'tr'
                                        ? 'Hesabınıza bağlı email adresini girin, size bir sıfırlama kodu göndereceğiz.'
                                        : 'Enter the email associated with your account and we\'ll send you a reset code.'}
                                </Text>

                                <View style={styles.inputContainer}>
                                    <Mail color="#9ca3af" size={20} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Email"
                                        placeholderTextColor="#9ca3af"
                                        value={resetEmail}
                                        onChangeText={setResetEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                </View>

                                <TouchableOpacity
                                    onPress={handleForgotSendCode}
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
                                                {language === 'tr' ? 'Kod Gönder' : 'Send Code'}
                                            </Text>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>
                            </>
                        )}

                        {forgotMode === 'code' && (
                            <>
                                <Text style={styles.title}>
                                    {language === 'tr' ? 'Kodu Girin' : 'Enter Code'}
                                </Text>
                                <Text style={styles.subtitle}>
                                    {language === 'tr'
                                        ? `${resetEmail} adresine gönderilen 6 haneli kodu girin.`
                                        : `Enter the 6-digit code sent to ${resetEmail}.`}
                                </Text>

                                {/* Code Input */}
                                <View style={styles.inputContainer}>
                                    <ShieldCheck color="#9ca3af" size={20} />
                                    <TextInput
                                        style={[styles.input, styles.codeInput]}
                                        placeholder={language === 'tr' ? '6 haneli kod' : '6-digit code'}
                                        placeholderTextColor="#9ca3af"
                                        value={resetCode}
                                        onChangeText={setResetCode}
                                        keyboardType="number-pad"
                                        maxLength={6}
                                    />
                                </View>

                                {/* New Password Input */}
                                <View style={styles.inputContainer}>
                                    <Lock color="#9ca3af" size={20} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder={language === 'tr' ? 'Yeni şifre (min 6 karakter)' : 'New password (min 6 chars)'}
                                        placeholderTextColor="#9ca3af"
                                        value={newPassword}
                                        onChangeText={setNewPassword}
                                        secureTextEntry={!showPassword}
                                    />
                                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                        {showPassword ? (
                                            <EyeOff color="#9ca3af" size={20} />
                                        ) : (
                                            <Eye color="#9ca3af" size={20} />
                                        )}
                                    </TouchableOpacity>
                                </View>

                                <TouchableOpacity
                                    onPress={handleResetPassword}
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
                                                {language === 'tr' ? 'Şifreyi Değiştir' : 'Reset Password'}
                                            </Text>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        );
    }

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
                        {t('tagline')}
                    </Text>
                </LinearGradient>

                {/* Form */}
                <View style={styles.formContainer}>
                    <Text style={styles.title}>
                        {isLogin ? t('welcome') : t('create_account')}
                    </Text>
                    <Text style={styles.subtitle}>
                        {isLogin
                            ? t('login_desc')
                            : t('register_desc')}
                    </Text>

                    {/* Name Input (only for register) */}
                    {!isLogin && (
                        <View style={styles.inputContainer}>
                            <User color="#9ca3af" size={20} />
                            <TextInput
                                style={styles.input}
                                placeholder={t('name')}
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
                            placeholder={t('email')}
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
                            placeholder={t('password')}
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

                    {/* Forgot Password Link (only on login) */}
                    {isLogin && (
                        <TouchableOpacity
                            onPress={() => setForgotMode('email')}
                            style={styles.forgotButton}
                        >
                            <Text style={styles.forgotText}>
                                {language === 'tr' ? 'Şifremi Unuttum' : 'Forgot Password?'}
                            </Text>
                        </TouchableOpacity>
                    )}

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
                                    {isLogin ? t('login') : t('register')}
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
                                ? t('no_account') + " "
                                : t('have_account') + " "}
                            <Text style={styles.toggleTextBold}>
                                {isLogin ? t('register') : t('login')}
                            </Text>
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Features */}
                <View style={styles.features}>
                    <View style={styles.featureItem}>
                        <Text style={styles.featureIcon}>📸</Text>
                        <Text style={styles.featureText}>{t('analyze')} AI</Text>
                    </View>
                    <View style={styles.featureItem}>
                        <Text style={styles.featureIcon}>🥗</Text>
                        <Text style={styles.featureText}>{t('diet_plan')}</Text>
                    </View>
                    <View style={styles.featureItem}>
                        <Text style={styles.featureIcon}>💧</Text>
                        <Text style={styles.featureText}>{t('water_tracking')}</Text>
                    </View>
                    <View style={styles.featureItem}>
                        <Text style={styles.featureIcon}>🏆</Text>
                        <Text style={styles.featureText}>{t('streak')}</Text>
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
        lineHeight: 20,
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
    codeInput: {
        fontSize: 24,
        fontWeight: "700",
        letterSpacing: 8,
        textAlign: "center",
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
    forgotButton: {
        alignItems: "flex-end",
        marginBottom: 8,
        marginTop: -8,
    },
    forgotText: {
        color: "#10b981",
        fontSize: 14,
        fontWeight: "600",
    },
    backButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: 16,
    },
    backButtonText: {
        color: "#6b7280",
        fontSize: 14,
        fontWeight: "500",
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
