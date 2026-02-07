import ContactActionModal from '@/components/ContactActionModal';
import colors from '@/constants/colors';
import { useAlert } from '@/contexts/AlertContext';
import { useContactSchemas } from '@/contexts/ContactSchemaContext';
import i18n from '@/libs/i18n';
import { ContactSchema } from '@/types';
import { useRouter } from 'expo-router';
import { LayoutTemplate, MoreVertical, Plus } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function SchemasScreen() {
  const router = useRouter();
  const { schemas, loading, deleteSchema } = useContactSchemas();
  const { showAlert } = useAlert();

  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [selectedSchema, setSelectedSchema] = useState<ContactSchema | null>(null);

  const handleDeleteSchema = (schema: ContactSchema) => {
    showAlert(
      i18n.t('common.delete'), // Using generic delete title or add specific translation
      i18n.t('common.deleteConfirm'), // Using generic message
      [
        { text: i18n.t('common.cancel'), style: 'cancel' },
        {
          text: i18n.t('common.delete'),
          style: 'destructive',
          onPress: () => deleteSchema(schema.id),
        },
      ],
      'error'
    );
  };

  const renderItem = ({ item }: { item: ContactSchema }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => router.push(`/create-schema?id=${item.id}`)}
    >
      <LayoutTemplate size={24} color={colors.primary} />
      <View style={styles.itemTextContainer}>
        <Text style={styles.itemTitle}>{item.name}</Text>
        <Text style={styles.itemSubtitle}>{i18n.t('schemasScreen.fieldCount', { count: item.fields.length })}</Text>
      </View>
      <TouchableOpacity
        onPress={() => {
          setSelectedSchema(item);
          setIsMenuVisible(true);
        }}
        style={{ padding: 8 }}
      >
        <MoreVertical size={20} color={colors.textSecondary} />
      </TouchableOpacity>
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
        data={schemas}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <LayoutTemplate size={64} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>{i18n.t('schemasScreen.emptyTitle')}</Text>
            <Text style={styles.emptyText}>
              {i18n.t('schemasScreen.emptyText')}
            </Text>
          </View>
        }
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/create-schema')}
        activeOpacity={0.8}
      >
        <Plus size={28} color="#FFFFFF" />
      </TouchableOpacity>
      <ContactActionModal
        isVisible={isMenuVisible}
        contactName={selectedSchema?.name}
        onClose={() => setIsMenuVisible(false)}
        onEdit={() => {
          if (selectedSchema) {
            router.push(`/create-schema?id=${selectedSchema.id}`);
          }
        }}
        onDelete={() => {
          if (selectedSchema) {
            handleDeleteSchema(selectedSchema);
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { justifyContent: 'center', alignItems: 'center' },
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
  emptyText: { fontSize: 16, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
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