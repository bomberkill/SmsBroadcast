import { Message } from '@/types';
import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';

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

  const addMessage = useCallback((message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage = { ...message, id: Date.now().toString(), timestamp: new Date().toISOString() };
    setMessages(prevMessages => {
      const updated = [...prevMessages, newMessage];
      saveMessages(updated);
      return updated;
    });
    return newMessage; // Note: This is the object before it's in state, which is fine for returning.
  }, [saveMessages]);

  const updateMessageStatus = useCallback((id: string, status: Message['status']) => {
    setMessages(prevMessages => {
      const updated = prevMessages.map((m) =>
        m.id === id ? { ...m, status } : m
      );
      saveMessages(updated);
      return updated;
    });
  }, [saveMessages]);

  const getMessagesByGroupId = useCallback((groupId: string) => {
    return messages.filter((m) => m.groupId === groupId);
  }, [messages]);

  return useMemo(() => ({
    messages,
    addMessage,
    updateMessageStatus,
    getMessagesByGroupId,
    isLoading: loadMessagesQuery.isLoading,
  }), [messages, addMessage, updateMessageStatus, getMessagesByGroupId, loadMessagesQuery.isLoading]);
});