import OptionSelectorModal from '@/components/OptionSelectorModal';
import { SchemaField } from '@/types';
import { ChevronDown, Save, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../constants/colors';
import i18n from '../libs/i18n';

interface ContactFormModalProps {
  isVisible: boolean;
  schemaFields: SchemaField[];
  initialData?: Record<string, any>;
  onClose: () => void;
  onSave: (data: Record<string, any>) => void;
}

export default function ContactFormModal({
  isVisible,
  schemaFields,
  initialData,
  onClose,
  onSave,
}: ContactFormModalProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [editingSelectField, setEditingSelectField] = useState<SchemaField | null>(null);

  useEffect(() => {
    if (isVisible) {
      setFormData(initialData || {});
    }
  }, [isVisible, initialData]);

  const handleInputChange = (fieldId: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleSaveClick = () => {
    // TODO: Add validation based on schema (e.g., isRequired)
    onSave(formData);
    onClose();
  };

  const title = initialData ? i18n.t('modals.editContact') : i18n.t('modals.addContact');

  return (
    <Modal visible={isVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            {schemaFields.map(field => {
              if (field.type === 'select') {
                return (
                  <View key={field.id} style={styles.inputGroup}>
                    <Text style={styles.label}>{field.name}</Text>
                    <TouchableOpacity
                      style={styles.picker}
                      onPress={() => setEditingSelectField(field)}
                    >
                      <Text style={formData[field.id] ? styles.pickerText : styles.pickerPlaceholder}>
                        {formData[field.id] || i18n.t('contactForm.selectOption')}
                      </Text>
                      <ChevronDown size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                );
              }

              return (
                <View key={field.id} style={styles.inputGroup}>
                  <Text style={styles.label}>{field.name}</Text>
                  <TextInput
                    style={styles.input}
                    value={formData[field.id] || ''}
                    onChangeText={text => handleInputChange(field.id, text)}
                    placeholder={field.name}
                    placeholderTextColor={colors.textSecondary}
                    keyboardType={field.type === 'phoneNumber' ? 'phone-pad' : field.type === 'email' ? 'email-address' : 'default'}
                  />
                </View>
              );
            })}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>{i18n.t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveClick}>
              <Save size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.saveButtonText}>{i18n.t('common.save')}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {editingSelectField && (
          <OptionSelectorModal
            isVisible={!!editingSelectField}
            title={i18n.t('contactForm.selectOptionFor', { fieldName: editingSelectField.name })}
            options={editingSelectField.options || []}
            currentValue={formData[editingSelectField.id]}
            onClose={() => setEditingSelectField(null)}
            onSelect={(option) => {
              handleInputChange(editingSelectField.id, option);
              setEditingSelectField(null);
            }}
          />
        )}

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
  scrollContent: { padding: 20, gap: 20 },
  inputGroup: { gap: 8 },
  label: { fontSize: 15, fontWeight: '600', color: colors.text },
  input: {
    height: 48,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  picker: {
    height: 48,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerText: { fontSize: 16, color: colors.text },
  pickerPlaceholder: { fontSize: 16, color: colors.textSecondary },
  footer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: 12,
  },
  cancelButton: {
    flex: 1, height: 50, borderRadius: 12, backgroundColor: colors.backgroundSecondary, alignItems: 'center', justifyContent: 'center'
  },
  cancelButtonText: {
    fontSize: 16, fontWeight: '600', color: colors.text
  },
  saveButton: {
    flex: 1, height: 50, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', flexDirection: 'row'
  },
  saveButtonText: {
    fontSize: 16, fontWeight: '600', color: '#FFFFFF'
  },
});