import colors from '@/constants/colors';
import { useMonetization } from '@/contexts/MonetizationContext';
import i18n from '@/libs/i18n';
import { useRouter } from 'expo-router';
import { ExternalLink, X } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface AdPlaceholderProps {
    onClose?: () => void;
}

const AdPlaceholder: React.FC<AdPlaceholderProps> = ({ onClose }) => {
    const router = useRouter();
    const { hasAds } = useMonetization();

    if (!hasAds) return null;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.adLabel}>{i18n.t('premium.ads.sponsored')}</Text>
                {onClose && (
                    <TouchableOpacity onPress={onClose} hitSlop={10}>
                        <X size={14} color={colors.textTertiary} />
                    </TouchableOpacity>
                )}
            </View>

            <TouchableOpacity
                style={styles.content}
                onPress={() => router.push('/premium' as any)}
                activeOpacity={0.9}
            >
                <View style={styles.iconContainer}>
                    <ExternalLink size={20} color={colors.primary} />
                </View>
                <View style={styles.textContainer}>
                    <Text style={styles.title}>{i18n.t('premium.ads.title')}</Text>
                    <Text style={styles.subtitle}>{i18n.t('premium.ads.subtitle')}</Text>
                </View>
                <TouchableOpacity
                    style={styles.upgradeBtn}
                    onPress={() => router.push('/premium' as any)}
                >
                    <Text style={styles.upgradeBtnText}>{i18n.t('premium.ads.upgrade')}</Text>
                </TouchableOpacity>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.background,
        borderRadius: 12,
        marginVertical: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: colors.borderLight,
        borderStyle: 'dashed',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    adLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: colors.textTertiary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.backgroundSecondary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 2,
    },
    subtitle: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    upgradeBtn: {
        backgroundColor: colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    upgradeBtnText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '800',
    }
});

export default AdPlaceholder;
