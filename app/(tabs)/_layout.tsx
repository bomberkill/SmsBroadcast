import colors from '@/constants/colors';
import i18n from '@/libs/i18n';
import { Tabs, useRouter } from 'expo-router';
import { CircleUserRound, Contact, LayoutTemplate, UsersRound } from 'lucide-react-native';
import React from 'react';

export default function TabLayout() {
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tabIconSelected,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.borderLight,
          borderTopWidth: 1,
        },
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTitleStyle: {
          fontWeight: '600' as const,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: i18n.t('tabs.contacts'),
          headerTitleStyle: {
            color: colors.text,
          },
          headerTintColor: colors.primary,
          // headerRight: () => (
          //   <TouchableOpacity onPress={() => router.push('/import-contacts')} style={{ padding: 8 }}>
          //     <FilePlus size={24} color={colors.primary} />
          //   </TouchableOpacity>
          // ),
          tabBarIcon: ({ color }) => <Contact size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: i18n.t('tabs.groups'),
          headerTitleStyle: {
            color: colors.text,
          },
          headerTintColor: colors.primary,
          tabBarIcon: ({ color }) => <UsersRound size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="schemas"
        options={{
          title: i18n.t('tabs.schemas'),
          headerTitleStyle: {
            color: colors.text,
          },
          headerTintColor: colors.primary,
          tabBarIcon: ({ color }) => (
            <LayoutTemplate size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: i18n.t('tabs.account'),
          headerTitleStyle: {
            color: colors.text,
          },
          headerTintColor: colors.primary,
          tabBarIcon: ({ color }) => (
            <CircleUserRound size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
