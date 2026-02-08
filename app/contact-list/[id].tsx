import ContactActionModal from '@/components/ContactActionModal';
import ContactFormModal from '@/components/ContactFormModal';
import colors from '@/constants/colors';
import { useAlert } from '@/contexts/AlertContext';
import { useContactLists } from '@/contexts/ContactListContext';
import { useContactSchemas } from '@/contexts/ContactSchemaContext';
import { useContacts } from '@/contexts/ContactsContext';
import i18n from '@/libs/i18n';
import { Contact } from '@/types';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { MoreVertical, Plus, Search, Users } from 'lucide-react-native';
import React, { Fragment, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

const PAGE_SIZE = 15;

export default function ContactListDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getContactListById, updateContactList } = useContactLists();
  const { contacts, loading: contactsLoading, addContact, updateContact, deleteContact } = useContacts();
  const { getSchemaById, loading: schemasLoading } = useContactSchemas();
  const { showAlert } = useAlert();

  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [selectedContactForMenu, setSelectedContactForMenu] = useState<Contact | null>(null);

  const contactList = useMemo(() => getContactListById(id!), [id, getContactListById]);
  const schema = useMemo(() => contactList ? getSchemaById(contactList.contactSchemaId) : null, [contactList, getSchemaById]);
  // useEffect(() => {
  //   if (contactList) {
  //     const realContactIds = Object.values(contacts).map((c) => c.id);
  //     updateContactList(contactList.id, { contactIds: realContactIds } );
  //     console.log('Synchronized contact IDs for list', contactList.id, "contactList.contactIds: ", contactList.contactIds, " contacts: ", contacts);
  //   }
  // },[])

  const displayNameField = useMemo(() => schema?.fields.find(f => f.isDisplayName), [schema]);
  const phoneField = useMemo(() => schema?.fields.find(f => f.isPrimaryPhone), [schema]);

  const listContacts = useMemo(() => {
    if (!contactList) return [];
    return contactList.contactIds.map(contactId => contacts[contactId]).filter(Boolean);
  }, [contactList, contacts]);

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim() || !displayNameField || !phoneField) return listContacts;
    const query = searchQuery.toLowerCase();
    return listContacts.filter(c =>
      (c.data[displayNameField.id] || '').toLowerCase().includes(query) ||
      (c.data[phoneField.id] || '').toLowerCase().includes(query)
    );
  }, [listContacts, searchQuery, displayNameField, phoneField]);

  const totalPages = Math.ceil(filteredContacts.length / PAGE_SIZE);
  const paginatedContacts = useMemo(() => {
    return filteredContacts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  }, [filteredContacts, page]);

  const handleSaveContact = (data: Record<string, any>) => {
    if (editingContact) {
      // Editing existing contact
      updateContact(editingContact.id, { data });
    } else {
      // Adding new contact
      if (contactList && schema) {
        const newContactId = addContact({
          contactSchemaId: schema.id,
          data,
        });
        updateContactList(contactList.id, {
          contactIds: [...contactList.contactIds, newContactId],
        });
      }
    }
    setEditingContact(null);
    setIsFormVisible(false);
  };

  const handleDeleteContact = (contactId: string) => {
    showAlert(i18n.t('contactForm.deleteConfirmTitle'), i18n.t('contactForm.deleteConfirmMessage'), [
      { text: i18n.t('common.cancel'), style: 'cancel' },
      {
        text: i18n.t('common.delete'),
        style: 'destructive',
        onPress: () => {
          if (contactList) {
            updateContactList(contactList.id, {
              contactIds: contactList.contactIds.filter(id => id !== contactId),
            });
            // Note: This doesn't delete the contact from the global store,
            // only from this list. You might want to delete it globally if it's not in any other list.
            // deleteContact(contactId);
          }
        },
      },
    ]);
  };

  if (contactsLoading || schemasLoading || !contactList || !schema || !displayNameField || !phoneField) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  const renderItem = ({ item }: { item: Contact }) => (
    <View style={styles.itemContainer}>
      <View style={{ flex: 1 }}>
        <Text style={styles.itemName} numberOfLines={1}>{item.data[displayNameField.id] || 'N/A'}</Text>
        <Text style={styles.itemPhone}>{item.data[phoneField.id] || 'N/A'}</Text>
      </View>
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          onPress={() => {
            setSelectedContactForMenu(item);
            setIsMenuVisible(true);
          }}
          style={styles.actionButton}
        >
          <MoreVertical size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <Stack.Screen options={{ title: contactList.name, headerTitleStyle: { color: colors.text, fontWeight: '600' }, headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text }} />

      {listContacts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Users size={64} color={colors.textTertiary} />
          <Text style={styles.emptyTitle}>{i18n.t('contactsScreen.emptyTitle')}</Text>
          {/* <Text style={styles.emptyTitle}>{i18n.t('contactList.emptyContactsTitle')}</Text> */}
          <Text style={styles.emptyText}>{i18n.t('contactsScreen.emptyDefault')}</Text>
        </View>
      ) : (
        <Fragment>
          <View style={styles.header}>
            <View style={styles.searchContainer}>
              <Search size={20} color={colors.textSecondary} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder={i18n.t('contactsScreen.searchPlaceholder')}
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>
          <Text style={styles.subHeader}>
            {i18n.t('contactList.contactCount', { count: listContacts.length })}
          </Text>
          <FlatList
            data={paginatedContacts}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={<View style={styles.centered}><Text>{i18n.t('contactsScreen.emptySearch')}</Text></View>}
          />
        </Fragment>
      )}

      <TouchableOpacity style={styles.fab} onPress={() => { setEditingContact(null); setIsFormVisible(true); }}>
        <Plus size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {schema && (
        <ContactFormModal
          isVisible={isFormVisible}
          schemaFields={schema.fields}
          initialData={editingContact?.data}
          onClose={() => setIsFormVisible(false)}
          onSave={handleSaveContact}
        />
      )}

      <ContactActionModal
        isVisible={isMenuVisible}
        contactName={selectedContactForMenu && displayNameField ? selectedContactForMenu.data[displayNameField.id] : undefined}
        onClose={() => setIsMenuVisible(false)}
        onMessage={() => {
          if (selectedContactForMenu) {
            router.push(`/direct-chat/${selectedContactForMenu.id}` as any);
          }
        }}
        onEdit={() => {
          if (selectedContactForMenu) {
            setEditingContact(selectedContactForMenu);
            setIsFormVisible(true);
          }
        }}
        onDelete={() => {
          if (selectedContactForMenu) {
            handleDeleteContact(selectedContactForMenu.id);
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
  },
  subHeader: {
    fontSize: 14,
    color: colors.textSecondary,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  itemPhone: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});

