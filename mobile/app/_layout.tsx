import "../global.css";
import { useEffect, useState, useCallback } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider, useTheme } from "../context/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, ActivityIndicator, AppState } from "react-native";

function AuthCheck({ children }: { children: React.ReactNode }) {
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const segments = useSegments();
    const router = useRouter();

    const checkAuth = useCallback(async () => {
        try {
            // Önce onboarding kontrolü
            const hasSeenOnboarding = await AsyncStorage.getItem("hasSeenOnboarding");
            if (!hasSeenOnboarding) {
                // Onboarding görülmediyse, state güncelle ama yönlendirmeyi useEffect'e bırak
                // Ancak burada loading'i bitirmeliyiz ki useEffect çalışsın.
                setIsAuthenticated(false); // Henüz giriş yapmamış sayılır
            } else {
                const token = await AsyncStorage.getItem("authToken");
                setIsAuthenticated(!!token);
            }
        } catch (e) {
            setIsAuthenticated(false);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // İlk yükleme
    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    // Sayfa değişikliklerinde tekrar kontrol et
    useEffect(() => {
        checkAuth();
    }, [segments, checkAuth]);

    // App state değişikliklerinde kontrol et
    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState) => {
            if (nextAppState === 'active') {
                checkAuth();
            }
        });

        return () => {
            subscription.remove();
        };
    }, [checkAuth]);

    useEffect(() => {
        if (isLoading) return;

        const checkFlow = async () => {
            const hasSeenOnboarding = await AsyncStorage.getItem("hasSeenOnboarding");
            const inAuthGroup = segments[0] === "auth";
            const inOnboarding = segments[0] === "onboarding";

            if (!hasSeenOnboarding) {
                if (!inOnboarding) {
                    router.replace("/onboarding");
                }
                return;
            }

            // Onboarding görülmüşse normal auth akışı
            if (!isAuthenticated && !inAuthGroup) {
                router.replace("/auth");
            } else if (isAuthenticated && inAuthGroup) {
                router.replace("/(tabs)");
            }
        };

        checkFlow();
    }, [isAuthenticated, segments, isLoading]);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }}>
                <ActivityIndicator size="large" color="#10b981" />
            </View>
        );
    }

    return <>{children}</>;
}

function AppContent() {
    const { isDarkMode } = useTheme();

    return (
        <>
            <StatusBar style={isDarkMode ? "light" : "dark"} />
            <AuthCheck>
                <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="onboarding" options={{ headerShown: false }} />
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen name="auth" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
                </Stack>
            </AuthCheck>
        </>
    );
}

export default function RootLayout() {
    // LanguageProvider'ı lazy import edelim
    const { LanguageProvider } = require("../context/LanguageContext");

    return (
        <SafeAreaProvider>
            <LanguageProvider>
                <ThemeProvider>
                    <AppContent />
                </ThemeProvider>
            </LanguageProvider>
        </SafeAreaProvider>
    );
}
