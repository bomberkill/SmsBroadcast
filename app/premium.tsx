import colors from '@/constants/colors';
import { useMonetization } from '@/contexts/MonetizationContext';
import i18n from '@/libs/i18n';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { Check, Crown, X } from 'lucide-react-native';
import React from 'react';
import { Dimensions, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

const PremiumScreen = () => {
    const router = useRouter();
    const { tier, setTier } = useMonetization();

    const handleSubscribe = (selectedTier: 'premium' | 'pro') => {
        const price = selectedTier === 'premium'
            ? i18n.t('premium.plans.premium.price')
            : i18n.t('premium.plans.pro.price');
        router.push({
            pathname: '/payment',
            params: { plan: selectedTier, price }
        });
    };

    const FeatureRow = ({ text, included = true }: { text: string; included?: boolean }) => (
        <View style={styles.featureRow}>
            <View style={[styles.checkCircle, !included && styles.dashCircle]}>
                {included ? <Check size={14} color="#FFF" /> : <View style={styles.dash} />}
            </View>
            <Text style={[styles.featureText, !included && styles.featureTextDisabled]}>{text}</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
                    <X size={24} color="#FFF" />
                </TouchableOpacity>

                <View style={styles.header}>
                    <LinearGradient
                        colors={[colors.primary, '#9c27b0']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.crownIconContainer}
                    >
                        <Crown size={40} color="#FFF" />
                    </LinearGradient>
                    <Text style={styles.title}>{i18n.t('premium.title')}</Text>
                    <Text style={styles.subtitle}>{i18n.t('premium.subtitle')}</Text>
                </View>

                <View style={[styles.card, tier === 'free' && styles.activeCard]}>
                    <Text style={styles.cardTier}>{i18n.t('premium.plans.free.name')}</Text>
                    <Text style={styles.cardPrice}>{i18n.t('premium.plans.free.price')}</Text>
                    <View style={styles.divider} />
                    {(i18n.t('premium.plans.free.features', { returnObjects: true }) as string[]).map((feature, index) => (
                        <FeatureRow key={index} text={feature} />
                    ))}
                </View>

                <TouchableOpacity
                    style={[styles.card, styles.premiumCard, tier === 'premium' && styles.activeCard]}
                    onPress={() => handleSubscribe('premium')}
                    activeOpacity={0.9}
                >
                    <View style={styles.popularBadge}>
                        <Text style={styles.popularBadgeText}>{i18n.t('premium.plans.premium.popular')}</Text>
                    </View>
                    <Text style={[styles.cardTier, styles.premiumText]}>{i18n.t('premium.plans.premium.name')}</Text>
                    <Text style={[styles.cardPrice, styles.premiumText]}>
                        {i18n.t('premium.plans.premium.price')}
                        <Text style={styles.pricePeriod}>{i18n.t('premium.plans.premium.period')}</Text>
                    </Text>
                    <View style={[styles.divider, { backgroundColor: 'rgba(255,255,255,0.1)' }]} />
                    {(i18n.t('premium.plans.premium.features', { returnObjects: true }) as string[]).map((feature, index) => (
                        <FeatureRow key={index} text={feature} />
                    ))}
                    <View style={styles.subscribeBtn}>
                        <Text style={styles.subscribeBtnText}>{i18n.t('premium.subscribe')}</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.card, styles.proCard, tier === 'pro' && styles.activeCard]}
                    onPress={() => handleSubscribe('pro')}
                    activeOpacity={0.9}
                >
                    <Text style={[styles.cardTier, styles.proText]}>{i18n.t('premium.plans.pro.name')}</Text>
                    <Text style={[styles.cardPrice, styles.proText]}>
                        {i18n.t('premium.plans.pro.price')}
                        <Text style={styles.pricePeriod}>{i18n.t('premium.plans.pro.period')}</Text>
                    </Text>
                    <View style={[styles.divider, { backgroundColor: 'rgba(255,193,7,0.1)' }]} />
                    {(i18n.t('premium.plans.pro.features', { returnObjects: true }) as string[]).map((feature, index) => (
                        <FeatureRow key={index} text={feature} />
                    ))}
                    <View style={[styles.subscribeBtn, styles.proBtn]}>
                        <Text style={styles.subscribeBtnText}>{i18n.t('premium.subscribe')}</Text>
                    </View>
                </TouchableOpacity>

                <Text style={styles.footerNote}>{i18n.t('premium.cancelAnytime')}</Text>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    scrollContent: {
        padding: 20,
        paddingTop: Platform.OS === 'ios' ? 0 : 40,
    },
    closeButton: {
        alignSelf: 'flex-end',
        padding: 10,
    },
    header: {
        alignItems: 'center',
        marginBottom: 30,
    },
    crownIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        ...Platform.select({
            ios: {
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.5,
                shadowRadius: 15,
            },
            android: {
                elevation: 10,
            },
        }),
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#FFF',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.6)',
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    card: {
        backgroundColor: colors.backgroundSecondary,
        borderRadius: 24,
        padding: 24,
        marginVertical: 10,
        borderWidth: 1,
        borderColor: colors.borderLight,
    },
    activeCard: {
        borderColor: colors.primary,
        borderWidth: 2,
    },
    premiumCard: {
        backgroundColor: '#1a1a2e',
        borderColor: 'rgba(156, 39, 176, 0.3)',
    },
    proCard: {
        backgroundColor: '#1a1810',
        borderColor: 'rgba(255, 193, 7, 0.3)',
    },
    cardTier: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    premiumText: {
        color: '#be4dff',
    },
    proText: {
        color: '#ffc107',
    },
    cardPrice: {
        fontSize: 36,
        fontWeight: '800',
        color: '#FFF',
        marginBottom: 16,
    },
    pricePeriod: {
        fontSize: 16,
        fontWeight: '400',
        color: 'rgba(255,255,255,0.5)',
    },
    divider: {
        height: 1,
        backgroundColor: colors.borderLight,
        marginBottom: 20,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    checkCircle: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: colors.success,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    dashCircle: {
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    dash: {
        width: 10,
        height: 2,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    featureText: {
        fontSize: 15,
        color: '#FFF',
    },
    featureTextDisabled: {
        color: 'rgba(255,255,255,0.3)',
    },
    subscribeBtn: {
        backgroundColor: colors.primary,
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 20,
    },
    proBtn: {
        backgroundColor: '#ffc107',
    },
    subscribeBtnText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '700',
    },
    popularBadge: {
        position: 'absolute',
        top: -12,
        right: 24,
        backgroundColor: colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    popularBadgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '800',
    },
    footerNote: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.4)',
        textAlign: 'center',
        marginTop: 20,
        marginBottom: 40,
    }
});

export default PremiumScreen;
