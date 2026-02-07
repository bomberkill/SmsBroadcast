import { ContactSchema } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

interface ContactSchemaContextType {
  schemas: ContactSchema[];
  addSchema: (schema: Omit<ContactSchema, 'id' | 'createdAt'>) => ContactSchema;
  updateSchema: (id: string, updates: Partial<Omit<ContactSchema, 'id'>>) => void;
  deleteSchema: (id: string) => void;
  getSchemaById: (id: string) => ContactSchema | undefined;
  loading: boolean;
  setSchemas: (schemas: ContactSchema[]) => void;
}

const ContactSchemaContext = createContext<ContactSchemaContextType | undefined>(undefined);

const SCHEMAS_STORAGE_KEY = 'contact_schemas_storage';

export const ContactSchemaProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [schemas, setSchemas] = useState<ContactSchema[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSchemas = async () => {
      try {
        const storedSchemas = await AsyncStorage.getItem(SCHEMAS_STORAGE_KEY);
        if (storedSchemas) {
          setSchemas(JSON.parse(storedSchemas));
        }
      } catch (error) {
        console.error('Failed to load schemas from storage', error);
      } finally {
        setLoading(false);
      }
    };
    loadSchemas();
  }, []);

  const saveSchemas = async (newSchemas: ContactSchema[]) => {
    try {
      await AsyncStorage.setItem(SCHEMAS_STORAGE_KEY, JSON.stringify(newSchemas));
    } catch (error) {
      console.error('Failed to save schemas to storage', error);
    }
  };

  const addSchema = (schemaData: Omit<ContactSchema, 'id' | 'createdAt' | 'synced'>): ContactSchema => {
    const newSchema: ContactSchema = {
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      synced: false,
      ...schemaData,
    };
    const updatedSchemas = [...schemas, newSchema];
    setSchemas(updatedSchemas);
    saveSchemas(updatedSchemas);
    return newSchema;
  };

  const updateSchema = (id: string, updates: Partial<Omit<ContactSchema, 'id'>>) => {
    const updatedSchemas = schemas.map((schema) =>
      schema.id === id ? { ...schema, ...updates, id: schema.id, synced: false } : schema
    );
    setSchemas(updatedSchemas);
    saveSchemas(updatedSchemas);
  };

  const deleteSchema = (id: string) => {
    const updatedSchemas = schemas.filter((schema) => schema.id !== id);
    setSchemas(updatedSchemas);
    saveSchemas(updatedSchemas);
  };

  const getSchemaById = (id: string) => {
    return schemas.find((schema) => schema.id === id);
  };

  return (
    <ContactSchemaContext.Provider value={{ schemas, addSchema, updateSchema, deleteSchema, getSchemaById, loading, setSchemas }}>
      {children}
    </ContactSchemaContext.Provider>
  );
};

export const useContactSchemas = () => {
  const context = useContext(ContactSchemaContext);
  if (context === undefined) {
    throw new Error('useContactSchemas must be used within a ContactSchemaProvider');
  }
  return context;
};
