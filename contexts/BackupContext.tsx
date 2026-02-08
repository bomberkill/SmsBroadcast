import i18n from '@/libs/i18n';
import { syncService } from '@/services';
import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useMemo, useState } from 'react';
import { useAlert } from './AlertContext';
import { useAuth } from './AuthContext';
import { useContactLists } from './ContactListContext';
import { useContactSchemas } from './ContactSchemaContext';
import { useContacts } from './ContactsContext';
import { useGroups } from './GroupsContext';
import { useMessages } from './MessagesContext';

export const [BackupProvider, useBackup] = createContextHook(() => {
    const { user, updateLastSyncAt } = useAuth();
    const { contacts, setContacts } = useContacts();
    const { contactLists, setContactLists } = useContactLists();
    const { schemas, setSchemas } = useContactSchemas();
    const { groups, setGroups } = useGroups();
    const { messages, setMessages } = useMessages();
    const { showAlert } = useAlert();

    const [isSyncing, setIsSyncing] = useState(false);

    /**
     * Get only unsynced data for delta sync optimization
     */
    const getUnsyncedData = useCallback(() => {
        const contactsArray = Object.values(contacts);

        return {
            contactSchemas: schemas.filter(s => s.synced === false),
            contacts: contactsArray.filter(c => c.synced === false),
            contactLists: contactLists.filter(l => l.synced === false),
            groups: groups.filter(g => g.synced === false),
            messages: messages.filter(m => m.synced === false),
        };
    }, [contacts, contactLists, schemas, groups, messages]);

    /**
     * Mark successfully synced data as synced: true
     */
    const markAsSynced = useCallback((syncedIds: {
        contactSchemaIds?: string[];
        contactIds?: string[];
        contactListIds?: string[];
        groupIds?: string[];
        messageIds?: string[];
    }) => {
        // Mark schemas as synced
        if (syncedIds.contactSchemaIds?.length) {
            const updatedSchemas = schemas.map(s =>
                syncedIds.contactSchemaIds!.includes(s.id) ? { ...s, synced: true } : s
            );
            setSchemas(updatedSchemas);
        }

        // Mark contacts as synced
        if (syncedIds.contactIds?.length) {
            const updatedContacts = { ...contacts };
            syncedIds.contactIds.forEach(id => {
                if (updatedContacts[id]) {
                    updatedContacts[id] = { ...updatedContacts[id], synced: true };
                }
            });
            setContacts(updatedContacts);
        }

        // Mark lists as synced
        if (syncedIds.contactListIds?.length) {
            const updatedLists = contactLists.map(l =>
                syncedIds.contactListIds!.includes(l.id) ? { ...l, synced: true } : l
            );
            setContactLists(updatedLists);
        }

        // Mark groups as synced
        if (syncedIds.groupIds?.length) {
            const updatedGroups = groups.map(g =>
                syncedIds.groupIds!.includes(g.id) ? { ...g, synced: true } : g
            );
            setGroups(updatedGroups);
        }

        // Mark messages as synced
        if (syncedIds.messageIds?.length) {
            const updatedMessages = messages.map(m =>
                syncedIds.messageIds!.includes(m.id) ? { ...m, synced: true } : m
            );
            setMessages(updatedMessages);
        }
    }, [contacts, contactLists, schemas, groups, messages, setContacts, setContactLists, setSchemas, setGroups, setMessages]);

    const backupToCloud = useCallback(async () => {
        if (!user) return;

        setIsSyncing(true);
        try {
            // Get only unsynced data (delta sync optimization)
            const unsyncedData = getUnsyncedData();

            // Count unsynced items
            const totalUnsynced =
                unsyncedData.contactSchemas.length +
                unsyncedData.contacts.length +
                unsyncedData.contactLists.length +
                unsyncedData.groups.length +
                unsyncedData.messages.length;

            // Skip sync if nothing to sync
            if (totalUnsynced === 0) {
                console.log('No unsynced data, skipping sync');
                showAlert(i18n.t('common.success'), 'All data is already synced', [{ text: 'OK' }], 'success');
                return;
            }

            console.log(`Syncing ${totalUnsynced} unsynced items...`);

            // Push only unsynced data
            await syncService.push(unsyncedData);

            // Mark all pushed data as synced
            markAsSynced({
                contactSchemaIds: unsyncedData.contactSchemas.map(s => s.id),
                contactIds: unsyncedData.contacts.map(c => c.id),
                contactListIds: unsyncedData.contactLists.map(l => l.id),
                groupIds: unsyncedData.groups.map(g => g.id),
                messageIds: unsyncedData.messages.map(m => m.id),
            });

            const now = new Date().toISOString();
            await updateLastSyncAt(now);

            showAlert(i18n.t('common.success'), i18n.t('account.actions.backupSuccess'), [{ text: 'OK' }], 'success');
        } catch (e: any) {
            console.error('Backup failed:', e);
            const errorMsg = e.response?.data?.message || i18n.t('account.actions.backupError');
            showAlert(i18n.t('common.error'), errorMsg, [{ text: 'OK' }], 'error');
        } finally {
            setIsSyncing(false);
        }
    }, [user, getUnsyncedData, markAsSynced, updateLastSyncAt, showAlert]);

    const restoreFromCloud = useCallback(async () => {
        if (!user) return;

        setIsSyncing(true);
        try {
            // Use syncService instead of direct API call
            const data = await syncService.pull();

            // Convert contacts array to object keyed by ID and mark as synced
            const contactsObj = (data.contacts || []).reduce((acc: Record<string, any>, contact: any) => {
                acc[contact.id] = { ...contact, synced: true };
                return acc;
            }, {});

            // Mark all pulled data as synced
            const syncedSchemas = (data.contactSchemas || []).map(s => ({ ...s, synced: true }));
            const syncedLists = (data.contactLists || []).map(l => ({ ...l, synced: true }));
            const syncedGroups = (data.groups || []).map(g => ({ ...g, synced: true }));
            const syncedMessages = (data.messages || []).map(m => ({ ...m, synced: true }));

            setContacts(contactsObj);
            setContactLists(syncedLists);
            setSchemas(syncedSchemas);
            setGroups(syncedGroups);
            setMessages(syncedMessages);

            showAlert(i18n.t('common.success'), i18n.t('account.actions.restoreSuccess'), [{ text: 'OK' }], 'success');
        } catch (e: any) {
            console.error('Restoration failed:', e);
            const errorMsg = e.response?.data?.message || i18n.t('account.actions.restoreError');
            showAlert(i18n.t('common.error'), errorMsg, [{ text: 'OK' }], 'error');
        } finally {
            setIsSyncing(false);
        }
    }, [user, showAlert, setContacts, setContactLists, setSchemas, setGroups, setMessages]);

    const value = useMemo(() => ({
        isSyncing,
        backupToCloud,
        restoreFromCloud,
        getUnsyncedData, // Expose for debugging or manual checks
    }), [isSyncing, backupToCloud, restoreFromCloud, getUnsyncedData]);

    return value;
});
