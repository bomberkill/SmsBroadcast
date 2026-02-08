import colors from '@/constants/colors';
import i18n from '@/libs/i18n';
import { ContactList, ContactSchema } from '@/types';
import { Save, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ContactListEditModalProps {
  isVisible: boolean;
  contactList: ContactList | null;
  schema: ContactSchema | undefined;
  onClose: () => void;
  onSave: (newName: string) => void;
}

export default function ContactListEditModal({
  isVisible,
  contactList,
  schema,
  onClose,
  onSave,
}: ContactListEditModalProps) {
  const [name, setName] = useState('');

  useEffect(() => {
    if (contactList) {
      setName(contactList.name);
    }
  }, [contactList]);

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim());
    }
  };

  return (
    <Modal visible={isVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{i18n.t('contactList.editTitle')}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{i18n.t('importContactsScreen.listNameLabel')}</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder={i18n.t('importContactsScreen.listNamePlaceholder')}
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{i18n.t('importContactsScreen.schemaLabel')}</Text>
              <View style={[styles.input, styles.disabledInput]}>
                <Text style={styles.disabledInputText}>{schema?.name || '...'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>{i18n.t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Save size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.saveButtonText}>{i18n.t('common.save')}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  headerTitle: { fontSize: 20, fontWeight: '600', color: colors.text },
  closeButton: { padding: 4 },
  content: { padding: 20, gap: 20, flex: 1 },
  inputGroup: { gap: 8 },
  label: { fontSize: 15, fontWeight: '600', color: colors.text },
  input: { height: 48, backgroundColor: colors.backgroundSecondary, borderRadius: 10, paddingHorizontal: 16, fontSize: 16, color: colors.text, borderWidth: 1, borderColor: colors.border, justifyContent: 'center' },
  disabledInput: { backgroundColor: colors.borderLight },
  disabledInputText: { fontSize: 16, color: colors.textSecondary },
  footer: { flexDirection: 'row', padding: 20, backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.borderLight, gap: 12 },
  cancelButton: { flex: 1, height: 50, borderRadius: 12, backgroundColor: colors.backgroundSecondary, alignItems: 'center', justifyContent: 'center' },
  cancelButtonText: { fontSize: 16, fontWeight: '600', color: colors.text },
  saveButton: { flex: 1, height: 50, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  saveButtonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
});