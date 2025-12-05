import CustomAlert from '@/components/CustomAlert';
import { AlertProvider } from '@/contexts/AlertContext';
import { ContactsProvider } from '@/contexts/ContactsContext';
import { GroupsProvider } from '@/contexts/GroupsContext';
import { MessagesProvider } from '@/contexts/MessagesContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: 'Back' }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen 
        name="add-contact" 
        options={{ 
          presentation: 'modal',
          title: 'Add Contact'
        }} 
      />
      <Stack.Screen 
        name="edit-contact/[id]" 
        options={{ 
          presentation: 'modal',
          title: 'Edit Contact'
        }} 
      />
      <Stack.Screen 
        name="create-group" 
        options={{ 
          presentation: 'modal',
          title: 'Create Group'
        }} 
      />
      <Stack.Screen 
        name="edit-group/[id]" 
        options={{ 
          presentation: 'modal',
          title: 'Edit Group'
        }} 
      />
      <Stack.Screen 
        name="group-chat/[id]" 
        options={{ 
          title: 'Group Chat'
        }} 
      />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <AlertProvider>
      <QueryClientProvider client={queryClient}>
        <ContactsProvider>
          <GroupsProvider>
            <MessagesProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <RootLayoutNav />
              </GestureHandlerRootView>
            </MessagesProvider>
          </GroupsProvider>
        </ContactsProvider>
      </QueryClientProvider>
      <CustomAlert />
    </AlertProvider>
  );
}