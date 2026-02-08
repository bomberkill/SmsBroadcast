import ContactActionModal from '@/components/ContactActionModal';
import ContactListEditModal from '@/components/ContactListEditModal';
import { List, MoreVertical, Plus, Users } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import AdPlaceholder from '@/components/AdPlaceholder';
import colors from '@/constants/colors';
import { useAlert } from '@/contexts/AlertContext';
import { useContactLists } from '@/contexts/ContactListContext';
import { useContactSchemas } from '@/contexts/ContactSchemaContext';
import i18n from '@/libs/i18n';
import { ContactList } from '@/types';
import { useRouter } from 'expo-router';

export default function ContactListsScreen() {
  const router = useRouter();
  const { contactLists, loading, deleteContactList, updateContactList } = useContactLists();
  const { getSchemaById } = useContactSchemas();
  const { showAlert } = useAlert();
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingList, setEditingList] = useState<ContactList | null>(null);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [selectedList, setSelectedList] = useState<ContactList | null>(null);

  const handleDeleteList = (list: ContactList) => {
    showAlert(
      i18n.t('contactList.deleteConfirmTitle'),
      i18n.t('contactList.deleteConfirmMessage', { listName: list.name }),
      [
        { text: i18n.t('common.cancel'), style: 'cancel' },
        {
          text: i18n.t('common.delete'),
          style: 'destructive',
          onPress: () => deleteContactList(list.id),
        },
      ],
      'error'
    );
  };

  const handleOpenEditModal = (list: ContactList) => {
    setEditingList(list);
    setIsEditModalVisible(true);
  };

  const handleSaveList = (newName: string) => {
    if (editingList) {
      updateContactList(editingList.id, { name: newName });
    }
    setIsEditModalVisible(false);
    setEditingList(null);
  };

  const editingListSchema = useMemo(() => editingList ? getSchemaById(editingList.contactSchemaId) : undefined, [editingList, getSchemaById]);

  const renderItem = ({ item }: { item: ContactList }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => router.push(`/contact-list/${item.id}`)}
    >
      <List size={24} color={colors.primary} />
      <View style={styles.itemTextContainer}>
        <Text style={styles.itemTitle}>{item.name}</Text>
        <Text style={styles.itemSubtitle}>{i18n.t('contactList.contactCount', { count: item.contactIds.length })}</Text>
      </View>
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          onPress={() => {
            setSelectedList(item);
            setIsMenuVisible(true);
          }}
          style={styles.actionButton}
        >
          <MoreVertical size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={contactLists}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={<AdPlaceholder />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Users size={64} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>{i18n.t('contactsScreen.emptyTitle')}</Text>
            <Text style={styles.emptyText}>{i18n.t('contactsScreen.emptyText')}</Text>
            <AdPlaceholder />
          </View>
        }
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/import-contacts')}
        activeOpacity={0.8}
      >
        <Plus size={28} color="#FFFFFF" />
      </TouchableOpacity>
      <ContactListEditModal
        isVisible={isEditModalVisible}
        contactList={editingList}
        schema={editingListSchema}
        onClose={() => setIsEditModalVisible(false)}
        onSave={handleSaveList}
      />
      <ContactActionModal
        isVisible={isMenuVisible}
        contactName={selectedList?.name}
        onClose={() => setIsMenuVisible(false)}
        onEdit={() => {
          if (selectedList) {
            handleOpenEditModal(selectedList);
          }
        }}
        onDelete={() => {
          if (selectedList) {
            handleDeleteList(selectedList);
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { justifyContent: 'center', alignItems: 'center' },
  listContent: {
    padding: 16,
  },
  separator: {
    height: 12,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
  },
  itemTextContainer: { marginLeft: 16, flex: 1 },
  itemTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  itemSubtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  actionsContainer: {
    flexDirection: 'row',
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
    fontSize: 22,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
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