import CustomAlert from '@/components/CustomAlert';
import { AlertProvider } from '@/contexts/AlertContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { BackupProvider } from '@/contexts/BackupContext';
import { ContactListProvider } from '@/contexts/ContactListContext';
import { ContactSchemaProvider } from '@/contexts/ContactSchemaContext';
import { ContactProvider } from '@/contexts/ContactsContext';
import { GroupsProvider } from '@/contexts/GroupsContext';
import { MessagesProvider } from '@/contexts/MessagesContext';
import { MonetizationProvider } from '@/contexts/MonetizationContext';
import '@/libs/i18n';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-get-random-values';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="create-group" options={{ presentation: 'modal' }} />
      <Stack.Screen name="edit-group/[id]" options={{ presentation: 'modal' }} />
      <Stack.Screen name="group-chat/[id]" />
      <Stack.Screen name="create-schema" options={{ presentation: 'modal' }} />
      <Stack.Screen name="import-contacts" options={{ presentation: 'modal' }} />
      <Stack.Screen name="contact-list/[id]" options={{ presentation: 'modal' }} />
      <Stack.Screen name="auth/login" options={{ presentation: 'modal' }} />
      <Stack.Screen name="auth/signup" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
    // AsyncStorage.removeItem(STORAGE_KEY);
    // AsyncStorage.removeItem(CONTACT_LISTS_STORAGE_KEY);
    // const loadConacts = async () => {
    // const storedContacts = await AsyncStorage.getItem(STORAGE_KEY);
    // const storedLists = await AsyncStorage.getItem(CONTACT_LISTS_STORAGE_KEY);
    // if (storedContacts) {
    //   console.log('groups storage', JSON.parse(storedContacts));
    // } else {
    //   console.log("no group found")
    // }
    // if (storedLists) {
    //   console.log('contacts list storage', JSON.parse(storedLists));
    // } else {
    //   console.log("no contacts list found")
    // }
    // }
    // loadConacts()
    // console.log('Cleared contact lists storage', AsyncStorage.getItem(CONTACT_LISTS_STORAGE_KEY));

  }, []);

  return (
    <AlertProvider>
      <QueryClientProvider client={queryClient}>
        <ContactProvider>
          <ContactListProvider>
            <ContactSchemaProvider>
              <GroupsProvider>
                <MessagesProvider>
                  <AuthProvider>
                    <MonetizationProvider>
                      <BackupProvider>
                        <GestureHandlerRootView style={{ flex: 1 }}>
                          <RootLayoutNav />
                        </GestureHandlerRootView>
                      </BackupProvider>
                    </MonetizationProvider>
                  </AuthProvider>
                </MessagesProvider>
              </GroupsProvider>
            </ContactSchemaProvider>
          </ContactListProvider>
        </ContactProvider>
      </QueryClientProvider>
      <CustomAlert />
    </AlertProvider>
  );
}