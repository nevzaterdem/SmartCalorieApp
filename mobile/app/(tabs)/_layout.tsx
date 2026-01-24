import { Tabs } from "expo-router";
import { View } from "react-native";
import { Camera, CalendarCheck, User } from "lucide-react-native";
import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";

export default function TabsLayout() {
    const { isDarkMode, colors } = useTheme();
    const { t } = useLanguage();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: colors.card,
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                    height: 80,
                    paddingTop: 10,
                    paddingBottom: 20,
                },
                tabBarActiveTintColor: "#10b981",
                tabBarInactiveTintColor: colors.textMuted,
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: "700",
                    marginTop: 4,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: t('analyze'),
                    tabBarIcon: ({ color, focused }) => (
                        <View
                            style={{
                                backgroundColor: focused ? (isDarkMode ? "#064e3b" : "#ecfdf5") : "transparent",
                                padding: 8,
                                borderRadius: 12,
                            }}
                        >
                            <Camera color={color} size={24} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="diet"
                options={{
                    title: t('diet'),
                    tabBarIcon: ({ color, focused }) => (
                        <View
                            style={{
                                backgroundColor: focused ? (isDarkMode ? "#4c1d95" : "#f3e8ff") : "transparent",
                                padding: 8,
                                borderRadius: 12,
                            }}
                        >
                            <CalendarCheck color={focused ? "#a855f7" : color} size={24} />
                        </View>
                    ),
                    tabBarActiveTintColor: "#a855f7",
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: t('profile'),
                    tabBarIcon: ({ color, focused }) => (
                        <View
                            style={{
                                backgroundColor: focused ? (isDarkMode ? "#1e3a8a" : "#dbeafe") : "transparent",
                                padding: 8,
                                borderRadius: 12,
                            }}
                        >
                            <User color={focused ? "#3b82f6" : color} size={24} />
                        </View>
                    ),
                    tabBarActiveTintColor: "#3b82f6",
                }}
            />
        </Tabs>
    );
}
