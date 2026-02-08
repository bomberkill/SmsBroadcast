import { authService } from '@/services';
import { User } from '@/types';
import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { useCallback, useEffect, useMemo, useState } from 'react';

const AUTH_STORAGE_KEY = 'auth_session';
const AUTH_TOKEN_KEY = 'auth_token';

export const [AuthProvider, useAuth] = createContextHook(() => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const getDeviceId = useCallback(() => {
        // Fallback for deviceId if Constants.installationId is unavailable
        return Constants.installationId || Constants.experienceId || 'unknown-device';
    }, []);

    const initGuest = useCallback(async () => {
        try {
            const deviceId = getDeviceId();
            const { user: newUser, token } = await authService.initGuest(deviceId);

            setUser(newUser);
            await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
            await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
        } catch (e) {
            console.error('Failed to init guest:', e);
        }
    }, [getDeviceId]);

    useEffect(() => {
        const loadSession = async () => {
            try {
                const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
                if (stored) {
                    setUser(JSON.parse(stored));
                } else {
                    // Silent guest initialization at first launch
                    await initGuest();
                }
            } catch (e) {
                console.error('Failed to load auth session:', e);
            } finally {
                setLoading(false);
            }
        };
        loadSession();
    }, [initGuest]);

    const login = useCallback(async (email: string, password: string) => {
        setLoading(true);
        try {
            const { user: mappedUser, token } = await authService.login(email, password);

            setUser(mappedUser);
            await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
            await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(mappedUser));
            return mappedUser;
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    const signup = useCallback(async (email: string, password: string, displayName: string) => {
        setLoading(true);
        try {
            const { user: mappedUser, token } = await authService.signup(email, password, displayName);

            setUser(mappedUser);
            await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
            await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(mappedUser));
            return mappedUser;
        } catch (error) {
            console.error('Signup failed:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    const linkAccount = useCallback(async (email: string, password: string, displayName: string) => {
        if (!user || !user.isGuest) return;

        setLoading(true);
        try {
            const { user: mappedUser, token } = await authService.linkAccount(email, password, displayName, user.deviceId);

            setUser(mappedUser);
            await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
            await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(mappedUser));
            return mappedUser;
        } catch (error) {
            console.error('Linking failed:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [user]);

    const logout = useCallback(async () => {
        setUser(null);
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
        await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
        // After logout, we might want to re-init as guest
        await initGuest();
    }, [initGuest]);

    const updateLastSyncAt = useCallback(async (date: string) => {
        if (user) {
            const updatedUser = { ...user, lastSyncAt: date };
            setUser(updatedUser);
            await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
        }
    }, [user]);

    const value = useMemo(() => ({
        user,
        loading,
        isAuthenticated: !!user && !user.isGuest,
        isGuest: !!user?.isGuest,
        login,
        signup,
        linkAccount,
        logout,
        updateLastSyncAt,
    }), [user, loading, login, signup, linkAccount, logout, updateLastSyncAt]);

    return value;
});
