import api from '@/libs/api';
import { SubscriptionSnapshot, UserTier } from '@/types';

export interface PaymentInitResponse {
    authorization_url: string;
    reference: string;
}

export const subscriptionService = {
    /**
     * Get the current subscription snapshot (tier, expiration, signature)
     */
    async getSnapshot(): Promise<SubscriptionSnapshot> {
        const { data } = await api.get<SubscriptionSnapshot>('/subscription/snapshot');
        return data;
    },
};

export const paymentService = {
    /**
     * Initialize a payment for a subscription tier
     */
    async initialize(tier: UserTier): Promise<PaymentInitResponse> {
        const { data } = await api.post<PaymentInitResponse>('/payments/initialize', { tier });
        return data;
    },
};
