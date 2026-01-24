import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Dimensions,
    TouchableOpacity,
    Animated,
    ImageBackground,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera, Utensils, Activity, ChevronRight, Check } from 'lucide-react-native';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');

export default function OnboardingScreen() {
    const router = useRouter();
    const { t } = useLanguage();
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);

    const slides = [
        {
            id: '1',
            title: t('onboarding_1_title'),
            description: t('onboarding_1_desc'),
            icon: Camera,
            colors: ['#059669', '#10b981'] as const,
            iconColor: '#a7f3d0'
        },
        {
            id: '2',
            title: t('onboarding_2_title'),
            description: t('onboarding_2_desc'),
            icon: Utensils,
            colors: ['#7c3aed', '#a855f7'] as const,
            iconColor: '#e9d5ff'
        },
        {
            id: '3',
            title: t('onboarding_3_title'),
            description: t('onboarding_3_desc'),
            icon: Activity,
            colors: ['#3b82f6', '#60a5fa'] as const,
            iconColor: '#bfdbfe'
        },
    ];

    const handleNext = async () => {
        if (currentIndex < slides.length - 1) {
            flatListRef.current?.scrollToIndex({
                index: currentIndex + 1,
                animated: true,
            });
        } else {
            await completeOnboarding();
        }
    };

    const completeOnboarding = async () => {
        try {
            await AsyncStorage.setItem('hasSeenOnboarding', 'true');
            router.replace('/auth');
        } catch (error) {
            console.error('Error saving onboarding status:', error);
        }
    };

    const renderItem = ({ item }: { item: typeof slides[0] }) => {
        const Icon = item.icon;

        return (
            <View style={styles.slide}>
                <LinearGradient
                    colors={item.colors}
                    style={styles.imageContainer}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <View style={[styles.iconCircle, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                        <Icon color="#fff" size={80} />
                    </View>
                    {/* Glow effect */}
                    <View style={[styles.glow, { backgroundColor: item.colors[1] }]} />
                </LinearGradient>

                <View style={styles.textContainer}>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.description}>{item.description}</Text>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#f3f4f6', '#fff']}
                style={styles.background}
            />

            <View style={styles.header}>
                <TouchableOpacity onPress={completeOnboarding} style={styles.skipButton}>
                    <Text style={styles.skipText}>{t('skip')}</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                ref={flatListRef}
                data={slides}
                renderItem={renderItem}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(event) => {
                    const index = Math.round(event.nativeEvent.contentOffset.x / width);
                    setCurrentIndex(index);
                }}
                keyExtractor={(item) => item.id}
            />

            <View style={styles.footer}>
                <View style={styles.indicatorContainer}>
                    {slides.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.indicator,
                                currentIndex === index && styles.indicatorActive,
                                { backgroundColor: currentIndex === index ? slides[currentIndex].colors[1] : '#d1d5db' }
                            ]}
                        />
                    ))}
                </View>

                <TouchableOpacity
                    style={[styles.button, { backgroundColor: slides[currentIndex].colors[1] }]}
                    onPress={handleNext}
                    activeOpacity={0.8}
                >
                    <Text style={styles.buttonText}>
                        {currentIndex === slides.length - 1 ? t('get_started') : t('next')}
                    </Text>
                    {currentIndex !== slides.length - 1 && <ChevronRight color="#fff" size={20} />}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    background: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: 20,
        alignItems: 'flex-end',
        zIndex: 10,
    },
    skipButton: {
        padding: 8,
    },
    skipText: {
        fontSize: 16,
        color: '#6b7280',
        fontWeight: '600',
    },
    slide: {
        width,
        alignItems: 'center',
        paddingTop: 40,
    },
    imageContainer: {
        width: width * 0.8,
        height: width * 0.8,
        borderRadius: width * 0.4,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 60,
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
    },
    iconCircle: {
        width: 160,
        height: 160,
        borderRadius: 80,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    glow: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        borderRadius: 1000,
        opacity: 0.3,
        transform: [{ scale: 1.1 }],
        zIndex: -1,
    },
    textContainer: {
        paddingHorizontal: 40,
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1f2937',
        textAlign: 'center',
        marginBottom: 16,
    },
    description: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 24,
    },
    footer: {
        padding: 40,
        paddingBottom: 60,
    },
    indicatorContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 40,
    },
    indicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginHorizontal: 4,
    },
    indicatorActive: {
        width: 24,
    },
    button: {
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    buttonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
});
