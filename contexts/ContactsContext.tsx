import initialContacts from '@/assets/data/contacts.json';
import { Contact } from '@/types';
import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'contacts_storage';

export const [ContactsProvider, useContacts] = createContextHook(() => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const loadContactsQuery = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      console.log('Loading contacts from AsyncStorage...');
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log('Loaded contacts from storage:', parsed.length);
        return parsed as Contact[];
      }
      console.log('No stored contacts, using initial data');
      // Add id and createdAt to initial raw contacts
      return initialContacts.map((contact, index) => ({
        ...contact,
        id: `${Date.now()}-${index}`,
        createdAt: new Date().toISOString(),
        // email: contact.email || '',
      })) as Contact[];
    },
  });

  useEffect(() => {
    if (loadContactsQuery.data) {
      setContacts(loadContactsQuery.data);
    }
  }, [loadContactsQuery.data]);

  const saveContactsMutation = useMutation({
    mutationFn: async (newContacts: Contact[]) => {
      console.log('Saving contacts to AsyncStorage:', newContacts.length);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newContacts));
      return newContacts;
    },
    onSuccess: (data) => {
      setContacts(data);
    },
  });
  const { mutate: saveContacts } = saveContactsMutation;

  const addContact = useCallback((contact: Omit<Contact, 'id' | 'createdAt'>) => {
    const newContact: Contact = {
      ...contact,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    const updatedContacts = [...contacts, newContact];
    saveContacts(updatedContacts);
  }, [contacts, saveContacts]);

  const updateContact = useCallback((id: string, updates: Partial<Contact>) => {
    const updatedContacts = contacts.map((c) =>
      c.id === id ? { ...c, ...updates } : c
    );
    saveContacts(updatedContacts);
  }, [contacts, saveContacts]);

  const deleteContact = useCallback((id: string) => {
    const updatedContacts = contacts.filter((c) => c.id !== id);
    saveContacts(updatedContacts);
  }, [contacts, saveContacts]);

  const syncWithGoogleSheets = useCallback(async (googleSheetUrl: string) => {
    setIsSyncing(true);
    try {
      console.log('Syncing with Google Sheets:', googleSheetUrl);
      const response = await fetch(googleSheetUrl);
      const data = await response.json();
      
      // Assuming the sheet has columns in this order:
      // email, gender, fullName, phoneNumber, country, region, healthDistrict, city, status, profession, tmsSpecialty, otherProfession
      const sheetContacts: Contact[] = data.values
        .slice(1)
        .map((row: string[], index: number) => ({
          id: `${Date.now()}-sheet-${index}`, // Generate a new ID
          email: row[0] || '',
          gender: row[1] || '',
          fullName: row[2] || 'No Name',
          phoneNumber: row[3] || '',
          country: row[4] || '',
          region: row[5] || '',
          healthDistrict: row[6] || '',
          city: row[7] || '',
          createdAt: new Date().toISOString(),
        }));

      const existingIds = new Set(contacts.map((c) => c.id));
      const existingPhones = new Set(contacts.map((c) => c.phoneNumber));

      const newContacts = sheetContacts.filter(
        (sc) => !existingIds.has(sc.id) && !existingPhones.has(sc.phoneNumber)
      );

      if (newContacts.length > 0) {
        const merged = [...contacts, ...newContacts];
        saveContacts(merged);
        console.log('Added new contacts from sync:', newContacts.length);
      } else {
        console.log('No new contacts to add from sync');
      }
    } catch (error) {
      console.error('Failed to sync with Google Sheets:', error);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, [contacts, saveContacts]);

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    const query = searchQuery.toLowerCase();
    return contacts.filter(
      (contact) =>
        contact.fullName.toLowerCase().includes(query) ||
        contact.phoneNumber.includes(query) ||
        contact.profession.toLowerCase().includes(query) ||
        contact.city.toLowerCase().includes(query) ||
        contact.email.toLowerCase().includes(query) ||
        contact.country.toLowerCase().includes(query) ||
        contact.region.toLowerCase().includes(query) ||
        contact.gender?.toLowerCase().includes(query)
    );
  }, [contacts, searchQuery]);

  return useMemo(() => ({
    contacts,
    filteredContacts,
    searchQuery,
    setSearchQuery,
    addContact,
    updateContact,
    deleteContact,
    syncWithGoogleSheets,
    isSyncing,
    isLoading: loadContactsQuery.isLoading,
  }), [contacts, filteredContacts, searchQuery, addContact, updateContact, deleteContact, syncWithGoogleSheets, isSyncing, loadContactsQuery.isLoading]);
});