import { ContactList } from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { v4 as uuidv4 } from 'uuid';

interface ContactListContextType {
  contactLists: ContactList[];
  loading: boolean;
  getContactListById: (id: string) => ContactList | undefined;
  addContactList: (data: Omit<ContactList, "id" | "createdAt">) => void;
  updateContactList: (id: string, data: Partial<ContactList>) => void;
  deleteContactList: (id: string) => void;
  setContactLists: (lists: ContactList[]) => void;
}

const ContactListContext = createContext<ContactListContextType | undefined>(undefined);

export const CONTACT_LISTS_STORAGE_KEY = "app_contact_lists_storage";

export const ContactListProvider = ({ children }: { children: React.ReactNode }) => {
  const [contactLists, setContactLists] = useState<ContactList[]>([]);
  const [loading, setLoading] = useState(true);

  /** Load lists */
  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(CONTACT_LISTS_STORAGE_KEY);
        if (stored) setContactLists(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to load contact lists", e);
      }
      setLoading(false);
    };

    load();
  }, []);

  const saveLists = async (lists: ContactList[]) => {
    try {
      await AsyncStorage.setItem(CONTACT_LISTS_STORAGE_KEY, JSON.stringify(lists));
    } catch (e) {
      console.error("Failed to save contact lists", e);
    }
  };

  const getContactListById = (id: string) =>
    contactLists.find((list) => list.id === id);

  const addContactList = (data: Omit<ContactList, "id" | "createdAt" | "synced">) => {
    const newList: ContactList = {
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      synced: false,
      ...data,
    };

    const updated = [...contactLists, newList];
    setContactLists(updated);
    saveLists(updated);
  };

  const updateContactList = (id: string, updates: Partial<ContactList>) => {
    const updated = contactLists.map((list) =>
      list.id === id ? { ...list, ...updates, synced: false } : list
    );
    setContactLists(updated);
    saveLists(updated);
  };

  const deleteContactList = (id: string) => {
    const updated = contactLists.filter((list) => list.id !== id);
    setContactLists(updated);
    saveLists(updated);
  };

  return (
    <ContactListContext.Provider
      value={{
        contactLists,
        loading,
        getContactListById,
        addContactList,
        updateContactList,
        deleteContactList,
        setContactLists,
      }}
    >
      {children}
    </ContactListContext.Provider>
  );
};

export const useContactLists = () => {
  const ctx = useContext(ContactListContext);
  if (!ctx) throw new Error("useContactLists must be used inside provider");
  return ctx;
};
