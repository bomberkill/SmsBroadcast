import colors from '@/constants/colors';
import i18n from '@/libs/i18n';
import { FieldType } from '@/types';
import { Check, X } from 'lucide-react-native';
import React from 'react';
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface FieldTypeSelectorModalProps {
  isVisible: boolean;
  currentType: FieldType;
  availableTypes: FieldType[];
  onClose: () => void;
  onSelect: (type: FieldType) => void;
}

export default function FieldTypeSelectorModal({
  isVisible,
  currentType,
  availableTypes,
  onClose,
  onSelect,
}: FieldTypeSelectorModalProps) {
  const renderItem = ({ item }: { item: FieldType }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => {
        onSelect(item);
        onClose();
      }}
    >
      <Text style={styles.itemTitle}>{item}</Text>
      {item === currentType && <Check size={24} color={colors.primary} />}
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet" // This helps with status bar issues on iOS
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{i18n.t('createSchema.selectFieldType')}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <FlatList
          data={availableTypes}
          renderItem={renderItem}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.listContent}
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
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundSecondary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    textTransform: 'capitalize',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});