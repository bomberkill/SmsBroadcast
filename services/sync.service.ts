import api from '@/libs/api';
import { Contact, ContactList, ContactSchema, Group, Message } from '@/types';

export interface SyncPushPayload {
    contactSchemas?: ContactSchema[];
    contacts?: Contact[];
    contactLists?: ContactList[];
    groups?: Group[];
    messages?: Message[];
}

export interface SyncPullResponse {
    contactSchemas: ContactSchema[];
    contacts: Contact[];
    contactLists: ContactList[];
    groups: Group[];
    messages: Message[];
}

export const syncService = {
    /**
     * Push local data to the cloud
     */
    async push(payload: SyncPushPayload): Promise<{ success: boolean }> {
        const { data } = await api.post<{ success: boolean }>('/sync/push', payload);
        return data;
    },

    /**
     * Pull all user data from the cloud
     */
    async pull(): Promise<SyncPullResponse> {
        const { data } = await api.get<SyncPullResponse>('/sync/pull');
        return data;
    },
};
