import { List, X } from 'lucide-react-native';
import React from 'react';
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import colors from '@/constants/colors';
import i18n from '@/libs/i18n';
import { ContactList } from '@/types';

interface ContactListSelectorModalProps {
  isVisible: boolean;
  contactLists: ContactList[];
  onClose: () => void;
  onSelect: (list: ContactList) => void;
}

export default function ContactListSelectorModal({
  isVisible,
  contactLists,
  onClose,
  onSelect,
}: ContactListSelectorModalProps) {

  const renderItem = ({ item }: { item: ContactList }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => {
        onSelect(item);
        onClose();
      }}
    >
      <List size={24} color={colors.primary} />
      <View style={styles.itemTextContainer}>
        <Text style={styles.itemTitle}>{item.name}</Text>
        <Text style={styles.itemSubtitle}>{i18n.t('contactList.contactCount', { count: item.contactIds.length })}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal visible={isVisible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{i18n.t('groupForm.selectListTitle')}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <FlatList
          data={contactLists}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{i18n.t('contactList.emptyTitle')}</Text>
            </View>
          }
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerTitle: { fontSize: 20, fontWeight: '600', color: colors.text },
  closeButton: { padding: 4 },
  listContent: { padding: 16 },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  itemTextContainer: { marginLeft: 16, flex: 1 },
  itemTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  itemSubtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
  emptyText: { fontSize: 18, color: colors.textSecondary, textAlign: 'center' },
});