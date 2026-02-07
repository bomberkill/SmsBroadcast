import { subscriptionService } from '@/services';
import { SubscriptionSnapshot, UserTier } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';

interface MonetizationContextType {
    tier: UserTier;
    isPremium: boolean;
    isPro: boolean;
    isExpired: boolean;
    snapshot: SubscriptionSnapshot | null;
    refreshSnapshot: () => Promise<void>;
    limits: {
        maxGroups: number;
        maxSmsPerMonth: number;
        maxScheduledConcurrent: number;
        maxTemplates: number;
        hasAds: boolean;
        hasAutoBackup: boolean;
    };
    hasAds: boolean;
    canCreateGroup: (currentGroupsCount: number) => boolean;
    canSendSms: (currentSentCount: number, batchSize: number) => boolean;
}

const MonetizationContext = createContext<MonetizationContextType | undefined>(undefined);

const SNAPSHOT_STORAGE_KEY = 'subscription_snapshot';

const TIER_LIMITS: Record<UserTier, MonetizationContextType['limits']> = {
    free: {
        maxGroups: 1,
        maxSmsPerMonth: 200,
        maxScheduledConcurrent: 5,
        maxTemplates: 2,
        hasAds: true,
        hasAutoBackup: false,
    },
    premium: {
        maxGroups: 5,
        maxSmsPerMonth: 1000,
        maxScheduledConcurrent: 50,
        maxTemplates: 20,
        hasAds: false,
        hasAutoBackup: true,
    },
    pro: {
        maxGroups: Infinity,
        maxSmsPerMonth: Infinity,
        maxScheduledConcurrent: Infinity,
        maxTemplates: Infinity,
        hasAds: false,
        hasAutoBackup: true,
    },
};

export const MonetizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [snapshot, setSnapshot] = useState<SubscriptionSnapshot | null>(null);
    const { user } = useAuth();

    const isExpired = useMemo(() => {
        if (!snapshot || !snapshot.expiresAt) return false;
        return new Date(snapshot.expiresAt).getTime() < Date.now();
    }, [snapshot]);

    const effectiveTier = useMemo((): UserTier => {
        if (!snapshot || isExpired) return 'free';
        return snapshot.tier;
    }, [snapshot, isExpired]);

    const loadSnapshot = useCallback(async () => {
        try {
            const stored = await AsyncStorage.getItem(SNAPSHOT_STORAGE_KEY);
            if (stored) {
                setSnapshot(JSON.parse(stored));
            }
        } catch (e) {
            console.error('Failed to load snapshot:', e);
        }
    }, []);

    const refreshSnapshot = useCallback(async () => {
        if (!user) return;
        try {
            const data = await subscriptionService.getSnapshot();
            setSnapshot(data);
            await AsyncStorage.setItem(SNAPSHOT_STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.error('Failed to refresh snapshot:', e);
        }
    }, [user]);

    useEffect(() => {
        loadSnapshot();
    }, [loadSnapshot]);

    // Periodically refresh snapshot when user is online (optional, managed by Sync)

    const value = useMemo(() => ({
        tier: effectiveTier,
        isPremium: effectiveTier === 'premium' || effectiveTier === 'pro',
        isPro: effectiveTier === 'pro',
        isExpired,
        snapshot,
        refreshSnapshot,
        limits: TIER_LIMITS[effectiveTier],
        hasAds: TIER_LIMITS[effectiveTier].hasAds,
        canCreateGroup: (count: number) => count < TIER_LIMITS[effectiveTier].maxGroups,
        canSendSms: (sent: number, batch: number) => sent + batch <= TIER_LIMITS[effectiveTier].maxSmsPerMonth,
    }), [effectiveTier, isExpired, snapshot, refreshSnapshot]);

    return (
        <MonetizationContext.Provider value={value}>
            {children}
        </MonetizationContext.Provider>
    );
};

export const useMonetization = () => {
    const context = useContext(MonetizationContext);
    if (context === undefined) {
        throw new Error('useMonetization must be used within a MonetizationProvider');
    }
    return context;
};
