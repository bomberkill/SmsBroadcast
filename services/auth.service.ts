import api from '@/libs/api';
import { User } from '@/types';

export interface AuthResponse {
    access_token: string;
    user: {
        id?: string;
        _id?: string;
        email?: string;
        displayName: string;
        subscriptionTier?: string;
        isGuest: boolean;
        deviceId?: string;
        createdAt?: string;
        lastSyncAt?: string | null;
    };
}

/**
 * Map backend user response to frontend User type
 */
const mapBackendUser = (backendUser: AuthResponse['user'], deviceId?: string): User => ({
    id: backendUser.id || backendUser._id || '',
    email: backendUser.email,
    displayName: backendUser.displayName,
    createdAt: backendUser.createdAt || new Date().toISOString(),
    lastSyncAt: backendUser.lastSyncAt || null,
    isGuest: backendUser.isGuest,
    deviceId: backendUser.deviceId || deviceId || '',
});

export const authService = {
    /**
     * Initialize a guest session
     */
    async initGuest(deviceId: string): Promise<{ user: User; token: string }> {
        const { data } = await api.post<AuthResponse>('/auth/guest', { deviceId });
        return {
            user: mapBackendUser(data.user, deviceId),
            token: data.access_token,
        };
    },

    /**
     * Login with email and password
     */
    async login(email: string, password: string): Promise<{ user: User; token: string }> {
        const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
        return {
            user: mapBackendUser(data.user),
            token: data.access_token,
        };
    },

    /**
     * Sign up with email, password, and display name
     */
    async signup(email: string, password: string, displayName: string): Promise<{ user: User; token: string }> {
        const { data } = await api.post<AuthResponse>('/auth/signup', { email, password, displayName });
        return {
            user: mapBackendUser(data.user),
            token: data.access_token,
        };
    },

    /**
     * Link a guest account to a real account
     */
    async linkAccount(email: string, password: string, displayName: string, currentDeviceId: string): Promise<{ user: User; token: string }> {
        const { data } = await api.post<AuthResponse>('/auth/link', { email, password, displayName });
        return {
            user: mapBackendUser(data.user, currentDeviceId),
            token: data.access_token,
        };
    },

    /**
     * Get current user profile
     */
    async getProfile(): Promise<User> {
        const { data } = await api.get<AuthResponse['user']>('/auth/profile');
        return mapBackendUser(data);
    },
};
