import { Group } from '@/types';
import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

export const STORAGE_KEY = 'groups_storage';

export const [GroupsProvider, useGroups] = createContextHook(() => {
  const [groups, setGroups] = useState<Group[]>([]);

  const loadGroupsQuery = useQuery({
    queryKey: ['groups'],
    queryFn: async () => {
      console.log('Loading groups from AsyncStorage...');
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log('Loaded groups from storage:', parsed.length);
        return parsed as Group[];
      }
      console.log('No stored groups, starting with empty array');
      return [] as Group[];
    },
  });

  useEffect(() => {
    if (loadGroupsQuery.data) {
      setGroups(loadGroupsQuery.data);
    }
  }, [loadGroupsQuery.data]);

  const saveGroupsMutation = useMutation({
    mutationFn: async (newGroups: Group[]) => {
      console.log('Saving groups to AsyncStorage:', newGroups.length);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newGroups));
      return newGroups;
    },
    onSuccess: (data) => {
      setGroups(data);
    },
  });
  const { mutate: saveGroups } = saveGroupsMutation;

  const addGroup = useCallback((group: Omit<Group, 'id' | 'createdAt' | 'updatedAt' | 'synced'>) => {
    const now = new Date().toISOString();
    const newGroup: Group = {
      ...group,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
      synced: false,
    };
    const updatedGroups = [...groups, newGroup];
    saveGroups(updatedGroups);
  }, [groups, saveGroups]);

  const updateGroup = useCallback((id: string, updates: Partial<Group>) => {
    const updatedGroups = groups.map((g) =>
      g.id === id ? { ...g, ...updates, updatedAt: new Date().toISOString(), synced: false } : g
    );
    saveGroups(updatedGroups);
  }, [groups, saveGroups]);

  const deleteGroup = useCallback((id: string) => {
    const updatedGroups = groups.filter((g) => g.id !== id);
    saveGroups(updatedGroups);
  }, [groups, saveGroups]);

  const getGroupById = useCallback((id: string) => {
    return groups.find((g) => g.id === id);
  }, [groups]);

  return useMemo(() => ({
    groups,
    setGroups,
    addGroup,
    updateGroup,
    deleteGroup,
    getGroupById,
    isLoading: loadGroupsQuery.isLoading,
  }), [groups, setGroups, addGroup, updateGroup, deleteGroup, getGroupById, loadGroupsQuery.isLoading]);
});