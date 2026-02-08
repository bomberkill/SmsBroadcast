import { cancelScheduledSms } from '@/modules/expo-sms-manager';
import { Message } from '@/types';
import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'messages_storage';

export const [MessagesProvider, useMessages] = createContextHook(() => {
  const [messages, setMessages] = useState<Message[]>([]);

  const loadMessagesQuery = useQuery({
    queryKey: ['messages'],
    queryFn: async () => {
      console.log('Loading messages from AsyncStorage...');
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log('Loaded messages from storage:', parsed.length);
        return parsed as Message[];
      }
      console.log('No stored messages, starting with empty array');
      return [] as Message[];
    },
  });

  useEffect(() => {
    if (loadMessagesQuery.data) {
      setMessages(loadMessagesQuery.data);
    }
  }, [loadMessagesQuery.data]);

  const saveMessagesMutation = useMutation({
    mutationFn: async (newMessages: Message[]) => {
      console.log('Saving messages to AsyncStorage:', newMessages.length);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newMessages));
      return newMessages;
    },
    onSuccess: (data) => {
      setMessages(data);
    },
  });
  const { mutate: saveMessages } = saveMessagesMutation;

  const addMessage = useCallback((message: Omit<Message, 'id' | 'timestamp' | 'synced'> & { id?: string }) => {
    const newMessage = {
      ...message,
      id: message.id || uuidv4(),
      timestamp: new Date().toISOString(),
      synced: false,
    } as Message;
    setMessages(prevMessages => {
      const updated = [...prevMessages, newMessage];
      saveMessages(updated);
      return updated;
    });
    return newMessage;
  }, [saveMessages]);

  const updateMessageStatus = useCallback((id: string, status: Message['status']) => {
    setMessages(prevMessages => {
      const updated = prevMessages.map((m) =>
        m.id === id ? { ...m, status, synced: false } : m
      );
      saveMessages(updated);
      return updated;
    });
  }, [saveMessages]);

  const updateMessageRecipientStatus = useCallback((messageId: string, phoneNumber: string, status: 'pending' | 'sent' | 'failed' | 'delivered' | 'scheduled', errorCode?: string) => {
    setMessages(prevMessages => {
      const updated = prevMessages.map((m) => {
        if (m.id !== messageId) return m;

        const updatedRecipients = m.recipients.map(r =>
          r.phoneNumber === phoneNumber ? { ...r, status, errorCode, timestamp: new Date().toISOString() } : r
        );

        // Derive global status
        const total = updatedRecipients.length;
        const sent = updatedRecipients.filter(r => r.status === 'sent').length;
        const delivered = updatedRecipients.filter(r => r.status === 'delivered').length;
        const failed = updatedRecipients.filter(r => r.status === 'failed').length;
        const scheduled = updatedRecipients.filter(r => r.status === 'scheduled').length;
        const pending = total - sent - failed - delivered - scheduled;

        let newGlobalStatus: Message['status'] = 'sending';
        let newTimestamp = m.timestamp;

        // If the whole message was explicitly scheduled, and nobody is sent/failed yet
        if (m.status === 'scheduled' && sent === 0 && delivered === 0 && failed === 0) {
          newGlobalStatus = 'scheduled';
        } else {
          // If we transition FROM scheduled to anything else, update the timestamp to "now" (actual send time)
          if (m.status === 'scheduled') {
            newTimestamp = new Date().toISOString();
          }

          if (pending === 0 && scheduled === 0) {
            if (delivered === total) newGlobalStatus = 'sent';
            else if (delivered + sent === total) newGlobalStatus = 'sent';
            else if (failed === total) newGlobalStatus = 'failed';
            else newGlobalStatus = 'partial';
          } else if (sent > 0 || delivered > 0 || failed > 0) {
            newGlobalStatus = 'partial';
          } else if (scheduled > 0) {
            newGlobalStatus = 'scheduled';
          } else {
            newGlobalStatus = 'sending';
          }
        }

        return { ...m, recipients: updatedRecipients, status: newGlobalStatus, timestamp: newTimestamp };
      });
      saveMessages(updated);
      return updated;
    });
  }, [saveMessages]);

  const getMessagesByGroupId = useCallback((groupId: string) => {
    return messages.filter((m) => m.groupId === groupId);
  }, [messages]);

  const deleteMessage = useCallback(async (id: string) => {
    const messageToDelete = messages.find(m => m.id === id);
    if (messageToDelete?.status === 'scheduled') {
      try {
        await cancelScheduledSms(id);
      } catch (e) {
        console.error('Failed to cancel scheduled SMS natively:', e);
      }
    }

    setMessages(prevMessages => {
      const updated = prevMessages.filter((m) => m.id !== id);
      saveMessages(updated);
      return updated;
    });
  }, [messages, saveMessages]);

  return useMemo(() => ({
    messages,
    setMessages,
    addMessage,
    updateMessageStatus,
    updateMessageRecipientStatus,
    getMessagesByGroupId,
    deleteMessage,
    isLoading: loadMessagesQuery.isLoading,
  }), [messages, setMessages, addMessage, updateMessageStatus, updateMessageRecipientStatus, getMessagesByGroupId, deleteMessage, loadMessagesQuery.isLoading]);
});