import { Contact } from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { v4 as uuidv4 } from 'uuid';

interface ContactContextType {
  contacts: Record<string, Contact>;
  loading: boolean;
  getContactById: (id: string) => Contact | undefined;
  addContact: (contactData: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateContact: (id: string, data: Partial<Contact>) => void;
  deleteContact: (id: string) => void;
  setContacts: (contacts: Record<string, Contact>) => void;
}

const ContactContext = createContext<ContactContextType | undefined>(undefined);

export const CONTACTS_STORAGE_KEY = "app_contacts_storage";

export const ContactProvider = ({ children }: { children: React.ReactNode }) => {
  const [contacts, setContacts] = useState<Record<string, Contact>>({});
  const [loading, setLoading] = useState(true);

  /** Load contacts from storage */
  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(CONTACTS_STORAGE_KEY);
        if (stored) setContacts(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to load contacts", e);
      }
      setLoading(false);
    };

    load();
  }, []);

  /** Save on update */
  const saveContacts = async (data: Record<string, Contact>) => {
    try {
      await AsyncStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error("Failed to save contacts", e);
    }
  };

  const getContactById = (id: string) => contacts[id];

  const addContact = (contactData: Omit<Contact, 'id' | 'createdAt' | 'updatedAt' | 'synced'>): string => {
    const id = uuidv4();

    const newContact: Contact = {
      id,
      ...contactData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: false,
    };

    setContacts(prevContacts => {
      const updated = { ...prevContacts, [id]: newContact };
      saveContacts(updated);
      return updated;
    });

    return id;
  };

  const updateContact = (id: string, updates: Partial<Contact>) => {
    if (!contacts[id]) return;

    const updated = {
      ...contacts,
      [id]: {
        ...contacts[id],
        ...updates,
        updatedAt: new Date().toISOString(),
        synced: false,
      },
    };

    setContacts(updated);
    saveContacts(updated);
  };

  const deleteContact = (id: string) => {
    const copy = { ...contacts };
    delete copy[id];
    setContacts(copy);
    saveContacts(copy);
  };

  return (
    <ContactContext.Provider
      value={{
        contacts,
        loading,
        getContactById,
        addContact,
        updateContact,
        deleteContact,
        setContacts,
      }}
    >
      {children}
    </ContactContext.Provider>
  );
};

export const useContacts = () => {
  const ctx = useContext(ContactContext);
  if (!ctx) throw new Error("useContactContext must be inside provider");
  return ctx;
};
