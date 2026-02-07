import colors from '@/constants/colors';
import i18n from '@/libs/i18n';
import { Contact, ContactSchema } from '@/types';
import { ListPlus, X } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PAGE_SIZE = 10;

interface ExtractionPreviewModalProps {
  isVisible: boolean;
  contacts: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>[];
  schema: ContactSchema;
  onClose: () => void;
  onSave: () => void;
  isSaving: boolean;
}

export default function ExtractionPreviewModal({
  isVisible,
  contacts,
  schema,
  onClose,
  onSave,
  isSaving,
}: ExtractionPreviewModalProps) {
  const [page, setPage] = useState(1);

  const displayNameField = useMemo(() => schema.fields.find(f => f.isDisplayName), [schema]);
  const phoneField = useMemo(() => schema.fields.find(f => f.isPrimaryPhone), [schema]);

  const totalPages = Math.ceil(contacts.length / PAGE_SIZE);
  const paginatedContacts = useMemo(() => {
    return contacts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  }, [contacts, page]);

  const handleNextPage = () => {
    if (page < totalPages) setPage(page + 1);
  };

  const handlePrevPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const renderItem = ({ item }: { item: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'> }) => {
    if (!displayNameField || !phoneField) return null;
    return (
      <View style={styles.itemContainer}>
        <Text style={styles.itemName}>{item.data[displayNameField.id] || 'N/A'}</Text>
        <Text style={styles.itemPhone}>{item.data[phoneField.id] || 'N/A'}</Text>
      </View>
    );
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{i18n.t('extractionPreview.title')}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <Text style={styles.subHeader}>
          {i18n.t('extractionPreview.subHeader', { count: contacts.length, contact: contacts.length})}
        </Text>

        {contacts.length > PAGE_SIZE && (
          <View style={styles.paginationContainer}>
            <TouchableOpacity
              style={[styles.paginationButton, page === 1 && styles.paginationButtonDisabled]}
              onPress={handlePrevPage}
              disabled={page === 1}>
              <Text style={styles.paginationButtonText}>{i18n.t('common.previous')}</Text>
            </TouchableOpacity>
            <Text style={styles.paginationText}>
              {i18n.t('common.page', { page, totalPages })}
            </Text>
            <TouchableOpacity
              style={[styles.paginationButton, page === totalPages && styles.paginationButtonDisabled]}
              onPress={handleNextPage}
              disabled={page === totalPages}>
              <Text style={styles.paginationButtonText}>{i18n.t('common.next')}</Text>
            </TouchableOpacity>
          </View>
        )}

        <FlatList
          data={paginatedContacts}
          renderItem={renderItem}
          keyExtractor={(item, index) => `${index}`}
          contentContainerStyle={styles.listContent}
        />

        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>{i18n.t('common.cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} onPress={onSave} disabled={isSaving}>
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <ListPlus size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.saveButtonText}>{i18n.t('extractionPreview.saveButton')}</Text>
              </>
            )}
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
  subHeader: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', paddingVertical: 12, paddingHorizontal: 16, backgroundColor: colors.backgroundSecondary },
  listContent: { padding: 16 },
  itemContainer: { backgroundColor: colors.backgroundSecondary, padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  itemName: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 4 },
  itemPhone: { fontSize: 14, color: colors.textSecondary },
  paginationContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  paginationButton: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: colors.primary, borderRadius: 8 },
  paginationButtonDisabled: { backgroundColor: colors.textTertiary },
  paginationButtonText: { color: '#FFFFFF', fontWeight: '600' },
  paginationText: { color: colors.textSecondary, fontWeight: '600' },
  footer: { flexDirection: 'row', padding: 20, backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.borderLight, gap: 12 },
  cancelButton: { flex: 1, height: 50, borderRadius: 12, backgroundColor: colors.backgroundSecondary, alignItems: 'center', justifyContent: 'center' },
  cancelButtonText: { fontSize: 16, fontWeight: '600', color: colors.text },
  saveButton: { flex: 1, height: 50, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  saveButtonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  saveButtonDisabled: { opacity: 0.7 },
});