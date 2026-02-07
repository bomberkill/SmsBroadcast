import colors from '@/constants/colors';
import i18n from '@/libs/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { CheckCircle2, MessageSquare, Shield, Users, Zap } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewToken
} from 'react-native';

const { width, height } = Dimensions.get('window');

const ONBOARDING_COMPLETE_KEY = 'onboarding_completed';

interface OnboardingSlide {
    id: string;
    icon: React.ComponentType<any>;
    titleKey: string;
    descriptionKey: string;
    gradient: string[];
}

const slides: OnboardingSlide[] = [
    {
        id: '1',
        icon: MessageSquare,
        titleKey: 'onboarding.slide1.title',
        descriptionKey: 'onboarding.slide1.description',
        gradient: [colors.primary, '#6366f1'],
    },
    {
        id: '2',
        icon: Users,
        titleKey: 'onboarding.slide2.title',
        descriptionKey: 'onboarding.slide2.description',
        gradient: ['#8b5cf6', '#a855f7'],
    },
    {
        id: '3',
        icon: Shield,
        titleKey: 'onboarding.slide3.title',
        descriptionKey: 'onboarding.slide3.description',
        gradient: ['#ec4899', '#f43f5e'],
    },
    {
        id: '4',
        icon: Zap,
        titleKey: 'onboarding.slide4.title',
        descriptionKey: 'onboarding.slide4.description',
        gradient: ['#f59e0b', '#eab308'],
    },
];

export default function OnboardingScreen() {
    const router = useRouter();
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollX = useRef(new Animated.Value(0)).current;
    const slidesRef = useRef<FlatList>(null);

    const viewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
        if (viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index || 0);
        }
    }).current;

    const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

    const completeOnboarding = async () => {
        await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
        router.replace('/(tabs)');
    };

    const scrollToNext = () => {
        if (currentIndex < slides.length - 1) {
            slidesRef.current?.scrollToIndex({ index: currentIndex + 1 });
        } else {
            completeOnboarding();
        }
    };

    const renderSlide = ({ item }: { item: OnboardingSlide }) => {
        const Icon = item.icon;
        return (
            <View style={styles.slide}>
                <LinearGradient
                    colors={item.gradient as [string, string]}
                    style={styles.iconContainer}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <Icon size={80} color="#fff" strokeWidth={1.5} />
                </LinearGradient>

                <Text style={styles.title}>{i18n.t(item.titleKey)}</Text>
                <Text style={styles.description}>{i18n.t(item.descriptionKey)}</Text>
            </View>
        );
    };

    const Paginator = () => {
        return (
            <View style={styles.paginatorContainer}>
                {slides.map((_, index) => {
                    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

                    const dotWidth = scrollX.interpolate({
                        inputRange,
                        outputRange: [10, 30, 10],
                        extrapolate: 'clamp',
                    });

                    const opacity = scrollX.interpolate({
                        inputRange,
                        outputRange: [0.3, 1, 0.3],
                        extrapolate: 'clamp',
                    });

                    return (
                        <Animated.View
                            key={index}
                            style={[styles.dot, { width: dotWidth, opacity }]}
                        />
                    );
                })}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={completeOnboarding} style={styles.skipButton}>
                    <Text style={styles.skipText}>{i18n.t('onboarding.skip')}</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                ref={slidesRef}
                data={slides}
                renderItem={renderSlide}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                bounces={false}
                keyExtractor={(item) => item.id}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                    { useNativeDriver: false }
                )}
                scrollEventThrottle={32}
                onViewableItemsChanged={viewableItemsChanged}
                viewabilityConfig={viewConfig}
            />

            <View style={styles.footer}>
                <Paginator />

                <TouchableOpacity
                    onPress={scrollToNext}
                    style={[
                        styles.nextButton,
                        currentIndex === slides.length - 1 && styles.getStartedButton,
                    ]}
                >
                    <LinearGradient
                        colors={[colors.primary, '#6366f1']}
                        style={styles.nextButtonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        {currentIndex === slides.length - 1 ? (
                            <>
                                <CheckCircle2 size={20} color="#fff" strokeWidth={2.5} />
                                <Text style={styles.nextButtonText}>
                                    {i18n.t('onboarding.getStarted')}
                                </Text>
                            </>
                        ) : (
                            <Text style={styles.nextButtonText}>{i18n.t('onboarding.next')}</Text>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: 20,
        alignItems: 'flex-end',
    },
    skipButton: {
        padding: 10,
    },
    skipText: {
        color: colors.textSecondary,
        fontSize: 16,
        fontWeight: '600',
    },
    slide: {
        width,
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
    },
    iconContainer: {
        width: 160,
        height: 160,
        borderRadius: 80,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: colors.text,
        textAlign: 'center',
        marginBottom: 16,
    },
    description: {
        fontSize: 16,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
    },
    footer: {
        paddingBottom: 60,
        paddingHorizontal: 20,
    },
    paginatorContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
    },
    dot: {
        height: 10,
        borderRadius: 5,
        backgroundColor: colors.primary,
        marginHorizontal: 4,
    },
    nextButton: {
        overflow: 'hidden',
        borderRadius: 12,
    },
    getStartedButton: {
        // Additional styling for final button if needed
    },
    nextButtonGradient: {
        paddingVertical: 18,
        paddingHorizontal: 32,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    nextButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
});
