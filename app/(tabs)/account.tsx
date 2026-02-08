import colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useBackup } from '@/contexts/BackupContext';
import { useMessages } from '@/contexts/MessagesContext';
import { useMonetization } from '@/contexts/MonetizationContext';
import i18n from '@/libs/i18n';
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs, useRouter } from 'expo-router';
import {
    Archive,
    ArrowRight,
    BarChart3,
    CloudUpload,
    Crown,
    LogOut,
    Settings,
    ShieldCheck,
    User as UserIcon,
} from 'lucide-react-native';
import React, { useMemo } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AccountScreen() {
    const router = useRouter();
    const { user, isAuthenticated, logout } = useAuth();
    const { tier, isPremium } = useMonetization();
    const { messages } = useMessages();
    const { backupToCloud, restoreFromCloud, isSyncing } = useBackup();

    const totalSent = useMemo(() => {
        return messages.filter(m => (m.status as string) === 'sent' || (m.status as string) === 'delivered').length;
    }, [messages]);

    const renderPremiumCard = () => (
        <TouchableOpacity
            style={styles.premiumPromoCard}
            onPress={() => router.push('/premium' as any)}
            activeOpacity={0.9}
        >
            <LinearGradient
                colors={[colors.primary, '#9c27b0']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.premiumGradient}
            >
                <View style={styles.premiumPromoContent}>
                    <View>
                        <Text style={styles.premiumPromoTitle}>
                            {tier === 'free' ? i18n.t('premium.tryPremium') : i18n.t('premium.currentPlan')}
                        </Text>
                        <Text style={styles.premiumPromoTier}>
                            {i18n.t(`premium.${tier}`)}
                        </Text>
                    </View>
                    <Crown size={24} color="#FFF" />
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );

    const renderUnauthenticated = () => (
        <ScrollView contentContainerStyle={styles.scrollContent}>
            {renderPremiumCard()}
            <View style={styles.promoContainer}>
                <View style={styles.promoIconContainer}>
                    <CloudUpload size={48} color={colors.primary} />
                </View>
                <Text style={styles.promoTitle}>{i18n.t('account.unauthenticated.title')}</Text>
                <Text style={styles.promoSubtitle}>{i18n.t('account.unauthenticated.subtitle')}</Text>

                <View style={styles.benefitsContainer}>
                    <View style={styles.benefitItem}>
                        <ShieldCheck size={20} color={colors.success} />
                        <Text style={styles.benefitText}>{i18n.t('account.unauthenticated.benefits.backup')}</Text>
                    </View>
                    <View style={styles.benefitItem}>
                        <BarChart3 size={20} color={colors.success} />
                        <Text style={styles.benefitText}>{i18n.t('account.unauthenticated.benefits.stats')}</Text>
                    </View>
                    <View style={styles.benefitItem}>
                        <Archive size={20} color={colors.success} />
                        <Text style={styles.benefitText}>{i18n.t('account.unauthenticated.benefits.sync')}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.authButtons}>
                <TouchableOpacity
                    style={[styles.button, styles.primaryButton]}
                    onPress={() => router.push('/auth/signup' as any)}
                >
                    <Text style={styles.primaryButtonText}>{i18n.t('account.unauthenticated.signup')}</Text>
                    <ArrowRight size={20} color="#FFFFFF" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, styles.secondaryButton]}
                    onPress={() => router.push('/auth/login' as any)}
                >
                    <Text style={styles.secondaryButtonText}>{i18n.t('account.unauthenticated.login')}</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );

    const renderAuthenticated = () => (
        <ScrollView contentContainerStyle={styles.scrollContent}>
            {renderPremiumCard()}
            <View style={styles.profileCard}>
                <View style={styles.avatarContainer}>
                    <UserIcon size={40} color={colors.primary} />
                </View>
                <View style={styles.profileInfo}>
                    <Text style={styles.profileName}>{user?.displayName}</Text>
                    <Text style={styles.profileEmail}>{user?.email}</Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>{i18n.t('account.stats.title')}</Text>
                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{totalSent}</Text>
                        <Text style={styles.statLabel}>{i18n.t('account.stats.totalSent')}</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>0</Text>
                        <Text style={styles.statLabel}>{i18n.t('account.stats.sentToday')}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>{i18n.t('account.profile.lastSync')}</Text>
                <View style={styles.syncCard}>
                    <Text style={styles.syncText}>
                        {user?.lastSyncAt ? i18n.t('account.profile.lastSync', { date: new Date(user.lastSyncAt).toLocaleString() }) : i18n.t('account.profile.neverSync')}
                    </Text>
                    <TouchableOpacity
                        style={[styles.syncButton, isSyncing && styles.disabledButton]}
                        onPress={backupToCloud}
                        disabled={isSyncing}
                    >
                        {isSyncing ? (
                            <ActivityIndicator size="small" color={colors.primary} />
                        ) : (
                            <Text style={styles.syncButtonText}>{i18n.t('account.actions.backupNow')}</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.section}>
                <TouchableOpacity
                    style={[styles.restoreCard, isSyncing && styles.disabledButton]}
                    onPress={restoreFromCloud}
                    disabled={isSyncing}
                >
                    <Text style={styles.restoreText}>{i18n.t('account.actions.restoreData')}</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.menuContainer}>
                <TouchableOpacity style={styles.menuItem}>
                    <Settings size={22} color={colors.textSecondary} />
                    <Text style={styles.menuItemText}>{i18n.t('common.settings')}</Text>
                    <ArrowRight size={18} color={colors.textTertiary} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/premium' as any)}>
                    <Crown size={22} color={colors.primary} />
                    <Text style={styles.menuItemText}>{i18n.t('premium.title')}</Text>
                    <ArrowRight size={18} color={colors.textTertiary} />
                </TouchableOpacity>

                <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={logout}>
                    <LogOut size={22} color={colors.danger} />
                    <Text style={[styles.menuItemText, styles.logoutText]}>{i18n.t('account.actions.logout')}</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <Tabs.Screen
                options={{
                    headerStyle: { backgroundColor: colors.backgroundSecondary },
                    headerTintColor: colors.primary,
                    headerTitleStyle: { color: colors.text },
                }}
            />
            {isAuthenticated ? renderAuthenticated() : renderUnauthenticated()}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.backgroundSecondary,
    },
    scrollContent: {
        padding: 20,
        paddingTop: 10,
    },
    promoContainer: {
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 40,
    },
    promoIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    promoTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.text,
        textAlign: 'center',
        marginBottom: 12,
    },
    promoSubtitle: {
        fontSize: 16,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 20,
        marginBottom: 32,
    },
    benefitsContainer: {
        width: '100%',
        backgroundColor: colors.background,
        borderRadius: 16,
        padding: 20,
        gap: 16,
    },
    benefitItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    benefitText: {
        fontSize: 15,
        color: colors.text,
        fontWeight: '500',
    },
    authButtons: {
        gap: 16,
    },
    button: {
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    primaryButton: {
        backgroundColor: colors.primary,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.primary,
    },
    secondaryButtonText: {
        color: colors.primary,
        fontSize: 18,
        fontWeight: '600',
    },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        padding: 20,
        borderRadius: 16,
        marginBottom: 24,
    },
    avatarContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: colors.backgroundSecondary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    profileInfo: {
        flex: 1,
    },
    profileName: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 4,
    },
    profileEmail: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 12,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: colors.background,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.primary,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: colors.textSecondary,
        textAlign: 'center',
    },
    syncCard: {
        backgroundColor: colors.background,
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
    },
    syncText: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: 16,
        textAlign: 'center',
    },
    syncButton: {
        backgroundColor: colors.backgroundSecondary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 20,
    },
    syncButtonText: {
        color: colors.primary,
        fontWeight: '600',
        fontSize: 14,
    },
    restoreCard: {
        backgroundColor: colors.background,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.borderLight,
    },
    restoreText: {
        color: colors.textSecondary,
        fontWeight: '500',
    },
    disabledButton: {
        opacity: 0.5,
    },
    menuContainer: {
        backgroundColor: colors.background,
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 40,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
        gap: 12,
    },
    menuItemText: {
        flex: 1,
        fontSize: 16,
        color: colors.text,
    },
    logoutItem: {
        borderBottomWidth: 0,
    },
    logoutText: {
        color: colors.danger,
    },
    premiumPromoCard: {
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 20,
        elevation: 4,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    premiumGradient: {
        padding: 20,
    },
    premiumPromoContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    premiumPromoTitle: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    premiumPromoTier: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: '800',
        marginTop: 4,
    },
});
