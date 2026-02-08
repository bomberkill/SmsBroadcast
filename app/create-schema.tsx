import FieldTypeSelectorModal from '@/components/FieldTypeSelectorModal';
import colors from '@/constants/colors';
import { useAlert } from '@/contexts/AlertContext';
import { useContactSchemas } from '@/contexts/ContactSchemaContext';
import i18n from '@/libs/i18n';
import { FieldType, SchemaField } from '@/types';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronDown, Plus, Trash } from 'lucide-react-native';
import { nanoid } from 'nanoid/non-secure';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import 'react-native-get-random-values';

// import { v4 as uuidv4 } from 'uuid';

const FIELD_TYPES: FieldType[] = ['text', 'phoneNumber', 'email', 'date', 'select'];

export default function CreateSchemaScreen() {
  const router = useRouter();
  const { id: schemaId } = useLocalSearchParams<{ id: string }>();
  const { addSchema, updateSchema, getSchemaById } = useContactSchemas();
  const { showAlert } = useAlert();

  const [name, setName] = useState('');
  const [fields, setFields] = useState<SchemaField[]>([]);
  const [isTypeModalVisible, setIsTypeModalVisible] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);


  const isEditing = !!schemaId;

  useEffect(() => {
    if (isEditing) {
      const existingSchema = getSchemaById(schemaId);
      if (existingSchema) {
        setName(existingSchema.name);
        setFields(existingSchema.fields);
      }
    } else {
      // Start with two default fields for a new schema
      setFields([
        { id: nanoid(), name: 'Nom Complet', type: 'text', isDisplayName: true },
        { id: nanoid(), name: 'Téléphone', type: 'phoneNumber', isPrimaryPhone: true },
      ]);
    }
  }, [schemaId]);

  const handleAddField = () => {
    setFields([...fields, { id: nanoid(), name: '', type: 'text' }]);
  };

  const handleRemoveField = (id: string) => {
    setFields(fields.filter((field) => field.id !== id));
  };

  const openTypeSelector = (fieldId: string) => {
    setEditingFieldId(fieldId);
    setIsTypeModalVisible(true);
  };

  const handleFieldChange = (id: string, key: keyof SchemaField, value: any) => {
    setFields(
      fields.map((field) => {
        if (field.id === id) {
          const newFieldState = { ...field, [key]: value };

          // If we're setting a unique property (isPrimaryPhone, isDisplayName),
          // unset it for all other fields.
          if ((key === 'isPrimaryPhone' || key === 'isDisplayName') && value === true) {
            fields.forEach(f => { if (f.id !== id) f[key] = false; });

            // Enforce the correct type for these special fields
            if (key === 'isDisplayName') {
              newFieldState.type = 'text';
            }
            if (key === 'isPrimaryPhone') {
              newFieldState.type = 'phoneNumber';
            }
          }
          // If type is changed from 'select', clear options
          if (key === 'type' && field.type === 'select' && value !== 'select') {
            const { options, ...rest } = field;
            return { ...rest, [key]: value };
          }
          return newFieldState;
        }
        return field;
      })
    );
  };

  const handleSave = () => {
    if (!name.trim()) {
      showAlert(i18n.t('common.error'), i18n.t('createSchema.validation.name'), [], 'error');
      return;
    }
    if (fields.some(f => !f.name.trim())) {
      showAlert(i18n.t('common.error'), i18n.t('createSchema.validation.fieldName'), [], 'error');
      return;
    }
    if (!fields.some(f => f.isPrimaryPhone)) {
      showAlert(i18n.t('common.error'), i18n.t('createSchema.validation.primaryPhone'), [], 'error');
      return;
    }
    if (!fields.some(f => f.isDisplayName)) {
      showAlert(i18n.t('common.error'), i18n.t('createSchema.validation.displayName'), [], 'error');
      return;
    }

    const schemaData = { name, fields };

    if (isEditing) {
      updateSchema(schemaId, schemaData);
      showAlert(i18n.t('common.success'), i18n.t('createSchema.updateSuccess'), [], 'success');
    } else {
      addSchema(schemaData);
      showAlert(i18n.t('common.success'), i18n.t('createSchema.createSuccess'), [], 'success');
    }

    router.back();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Stack.Screen options={{ title: isEditing ? i18n.t('createSchema.editTitle') : i18n.t('createSchema.createTitle'), headerTitleStyle: { color: colors.text, fontWeight: '600' }, headerStyle: {backgroundColor: colors.background}, headerTintColor: colors.text }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{i18n.t('createSchema.schemaNameLabel')}</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder={i18n.t('createSchema.schemaNamePlaceholder')}
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <Text style={[styles.label, { marginTop: 24, marginBottom: 8 }]}>{i18n.t('createSchema.fieldsHeader')}</Text>

        {fields.map((field, index) => {
          const isSpecialField = field.isDisplayName || field.isPrimaryPhone;
          return (
            <View key={field.id} style={styles.fieldContainer}>
            <TextInput
              style={[styles.input, styles.fieldNameInput]}
              value={field.name}
              onChangeText={(text) => handleFieldChange(field.id, 'name', text)}
              placeholder={i18n.t('createSchema.fieldNamePlaceholder', { index: index + 1 })}
              placeholderTextColor={colors.textSecondary}
            />
            <TouchableOpacity
              style={[styles.picker, isSpecialField && styles.pickerDisabled]}
              onPress={() => {
                if (isSpecialField) {
                  showAlert(i18n.t('common.info'), i18n.t('createSchema.cannotChangeSpecialFieldType'));
                } else {
                  openTypeSelector(field.id);
                }
              }}
            >
              <Text style={styles.pickerText}>
                {i18n.t('createSchema.typeLabel')}: <Text style={styles.pickerValue}>{field.type}</Text>
              </Text>
              <ChevronDown size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            {field.type === 'select' && (
              <View style={styles.optionsContainer}>
                <Text style={styles.optionsLabel}>{i18n.t('createSchema.optionsLabel')}</Text>
                <TextInput
                  style={[styles.input, styles.optionsInput]}
                  value={field.options?.join(', ') || ''}
                  onChangeText={(text) =>
                    handleFieldChange(field.id, 'options', text.split(',').map(opt => opt.trim()))
                  }
                  placeholder={i18n.t('createSchema.optionsPlaceholder')}
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            )}

            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>{i18n.t('createSchema.displayNameLabel')}</Text>
              <Switch
                value={field.isDisplayName}
                onValueChange={(val) => handleFieldChange(field.id, 'isDisplayName', val)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={'#FFFFFF'}
              />
            </View>

            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>{i18n.t('createSchema.primaryPhoneLabel')}</Text>
              <Switch
                value={field.isPrimaryPhone}
                onValueChange={(val) => handleFieldChange(field.id, 'isPrimaryPhone', val)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={'#FFFFFF'}
              />
            </View>

            <TouchableOpacity onPress={() => handleRemoveField(field.id)} style={styles.deleteButton}>
              <Trash size={10} color={colors.text} />
            </TouchableOpacity>
            </View>
          );
        })}

        <TouchableOpacity style={styles.addButton} onPress={handleAddField}>
          <Plus size={20} color={colors.primary} />
          <Text style={styles.addButtonText}>{i18n.t('createSchema.addFieldButton')}</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelButtonText}>{i18n.t('common.cancel')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>{i18n.t('common.save')}</Text>
        </TouchableOpacity>
      </View>

      <View>
        {editingFieldId && (
          <FieldTypeSelectorModal
            isVisible={isTypeModalVisible}
            availableTypes={FIELD_TYPES}
            currentType={fields.find(f => f.id === editingFieldId)?.type || 'text'}
            onClose={() => setIsTypeModalVisible(false)}
            onSelect={(type) => {
              handleFieldChange(editingFieldId, 'type', type);
            }}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: 20, paddingBottom: 100 },
  inputGroup: { gap: 8 },
  label: { fontSize: 16, fontWeight: '600', color: colors.text },
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
  fieldContainer: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  fieldNameInput: { backgroundColor: colors.background, marginBottom: 12 },
  picker: {
    height: 48,
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  pickerDisabled: {
    backgroundColor: colors.border,
  },
  pickerText: { fontSize: 15, color: colors.textSecondary },
  pickerValue: {
    color: colors.text, fontWeight: '600', textTransform: 'capitalize'
  },
  optionsContainer: {
    marginTop: 8,
  },
  optionsLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  optionsInput: {
    backgroundColor: colors.background,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchLabel: { fontSize: 15, color: colors.text },
  deleteButton: { position: 'absolute', display: 'flex', justifyContent: 'center', alignItems: 'center', top: -7, right: -7, width: 25, height: 25, borderRadius: 12.5, backgroundColor: colors.danger },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    marginTop: 16,
  },
  addButtonText: { color: colors.primary, fontSize: 16, fontWeight: '600', marginLeft: 8 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 20,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: 12,
  },
  cancelButton: { flex: 1, height: 50, borderRadius: 12, backgroundColor: colors.backgroundSecondary, alignItems: 'center', justifyContent: 'center' },
  cancelButtonText: { fontSize: 16, fontWeight: '600', color: colors.text },
  saveButton: { flex: 1, height: 50, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  saveButtonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
});