import colors from '@/constants/colors';
import i18n from '@/libs/i18n';
import { Contact } from '@/types';
import { CheckCircle, Circle, Save, Search, X } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PAGE_SIZE = 15;

interface MemberSelectorModalProps {
  isVisible: boolean;
  contacts: Contact[];
  initialSelectedIds: string[];
  displayNameFieldId: string;
  phoneFieldId: string;
  onClose: () => void;
  onSave: (selectedIds: string[]) => void;
}

export default function MemberSelectorModal({
  isVisible,
  contacts,
  initialSelectedIds,
  displayNameFieldId,
  phoneFieldId,
  onClose,
  onSave,
}: MemberSelectorModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (isVisible) {
      setSelectedIds(initialSelectedIds);
      setSearchQuery('');
      setPage(1);
    }
  }, [isVisible, initialSelectedIds]);

  const toggleMember = (contactId: string) => {
    setSelectedIds(prev =>
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleToggleSelectAll = () => {
    const allFilteredIds = filteredContacts.map(c => c.id);
    const areAllSelected = allFilteredIds.length > 0 && allFilteredIds.every(id => selectedIds.includes(id));

    if (areAllSelected) {
      // Deselect all filtered
      setSelectedIds(prev => prev.filter(id => !allFilteredIds.includes(id)));
    } else {
      // Select all filtered
      setSelectedIds(prev => [...new Set([...prev, ...allFilteredIds])]);
    }
  };

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    const query = searchQuery.toLowerCase();
    return contacts.filter(c =>
      (c.data[displayNameFieldId] || '').toLowerCase().includes(query) ||
      (c.data[phoneFieldId] || '').toLowerCase().includes(query)
    );
  }, [contacts, searchQuery, displayNameFieldId, phoneFieldId]);

  const totalPages = Math.ceil(filteredContacts.length / PAGE_SIZE);
  const paginatedContacts = useMemo(() => {
    return filteredContacts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  }, [filteredContacts, page]);

  const areAllFilteredSelected = useMemo(() => filteredContacts.length > 0 && filteredContacts.every(c => selectedIds.includes(c.id)), [filteredContacts, selectedIds]);

  const handleSave = () => {
    onSave(selectedIds);
    onClose();
  };

  const renderItem = ({ item }: { item: Contact }) => {
    const isSelected = selectedIds.includes(item.id);
    return (
      <TouchableOpacity
        style={[styles.memberItem, isSelected && styles.memberItemSelected]}
        onPress={() => toggleMember(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{item.data[displayNameFieldId]}</Text>
          <Text style={styles.memberPhone}>{item.data[phoneFieldId]}</Text>
        </View>
        {isSelected ? (
          <CheckCircle size={24} color={colors.primary} />
        ) : (
          <Circle size={24} color={colors.textSecondary} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={isVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{i18n.t('groupForm.selectMembers')}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.searchContainer}>
            <Search size={20} color={colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={i18n.t('groupForm.searchPlaceholder')}
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <View style={styles.toolbar}>
            <Text style={styles.selectionCount}>{i18n.t(selectedIds.length === 1 ? 'groupForm.member' : 'groupForm.members', { count: selectedIds.length })}</Text>
            <TouchableOpacity onPress={handleToggleSelectAll}>
              <Text style={styles.selectAllText}>
                {areAllFilteredSelected ? i18n.t('groupForm.deselectAll') : i18n.t('groupForm.selectAll')}
              </Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={paginatedContacts}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={<Text style={styles.emptyListText}>{i18n.t('groupForm.noContactsFound')}</Text>}
          />
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Save size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.saveButtonText}>
              {i18n.t('common.save')} ({i18n.t(selectedIds.length === 1 ? 'groupForm.member' : 'groupForm.members', { count: selectedIds.length })})
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  headerTitle: { fontSize: 20, fontWeight: '600', color: colors.text },
  closeButton: { padding: 4 },
  content: { flex: 1, padding: 16, gap: 16 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.backgroundSecondary, borderRadius: 10, paddingHorizontal: 12, height: 44, borderWidth: 1, borderColor: colors.border },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 16, color: colors.text },
  toolbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8 },
  selectionCount: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
  selectAllText: { fontSize: 14, color: colors.primary, fontWeight: '600' },
  listContent: { paddingBottom: 20 },
  emptyListText: { textAlign: 'center', color: colors.textSecondary, marginTop: 40, fontSize: 16 },
  memberItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.backgroundSecondary, borderRadius: 10, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 8 },
  memberItemSelected: { borderColor: colors.primary, backgroundColor: colors.background },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 4 },
  memberPhone: { fontSize: 14, color: colors.textSecondary },
  footer: { flexDirection: 'row', padding: 20, backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.borderLight, gap: 12 },
  saveButton: { flex: 1, height: 50, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  saveButtonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
});