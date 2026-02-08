import MemberSelectorModal from '@/components/MemberSelectorModal';
import colors from '@/constants/colors';
import { useAlert } from '@/contexts/AlertContext';
import { useContactLists } from '@/contexts/ContactListContext';
import { useContactSchemas } from '@/contexts/ContactSchemaContext';
import { useContacts } from '@/contexts/ContactsContext';
import { useGroups } from '@/contexts/GroupsContext';
import i18n from '@/libs/i18n';
import { Contact } from '@/types';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Users } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EditGroupScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { groups, updateGroup, deleteGroup } = useGroups();
  const { contactLists } = useContactLists();
  const { contacts } = useContacts();
  const { getSchemaById } = useContactSchemas();
  const { showAlert } = useAlert();

  const group = groups.find((g) => g.id === id);

  const contactList = useMemo(() => {
    if (!group) return null;
    return contactLists.find(cl => cl.id === group.contactListId);
  }, [group, contactLists]);

  const schema = useMemo(() => {
    if (!contactList) return null;
    return getSchemaById(contactList.contactSchemaId);
  }, [contactList, getSchemaById]);

  const displayNameFieldId = schema?.fields.find(f => f.isDisplayName)?.id;
  const phoneFieldId = schema?.fields.find(f => f.isPrimaryPhone)?.id;

  const [groupName, setGroupName] = useState<string>('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isMemberModalVisible, setIsMemberModalVisible] = useState(false);

  useEffect(() => {
    if (group) {
      setGroupName(group.groupName);
      setSelectedMembers(group.memberIds);
    }
  }, [group]);

  const listContacts = useMemo<Contact[]>(() => {
    if (!contactList) return [];
    return contactList.contactIds.map(id => contacts[id]).filter(Boolean);
  }, [contactList, contacts]);

  if (!group) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{i18n.t('groupForm.groupNotFound')}</Text>
      </View>
    );
  }

  const handleSave = () => {
    if (!groupName.trim()) {
      showAlert(i18n.t('common.error'), i18n.t('groupForm.validationNameError'), [], 'error');
      return;
    }

    if (selectedMembers.length === 0) {
      showAlert(i18n.t('common.error'), i18n.t('groupForm.validationMemberError'), [], 'error');
      return;
    }

    updateGroup(id!, {
      groupName: groupName.trim(),
      memberIds: selectedMembers,
    });

    showAlert(i18n.t('common.success'), i18n.t('groupForm.updateSuccess'), [], 'success');
    router.back();
  };

  const handleDelete = () => {
    showAlert(
      i18n.t('groupForm.deleteConfirmTitle'),
      i18n.t('groupForm.deleteConfirmMessage'),
      [
        {
          text: i18n.t('common.delete'),
          style: 'destructive',
          onPress: () => {
            deleteGroup(id!);
            router.replace('/groups');
          },
        },
        { text: i18n.t('common.cancel'), style: 'cancel' },
      ],
      'error'
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: i18n.t('modals.editGroup'),
          headerTitleStyle: { color: colors.text, fontWeight: '600' },
          headerStyle: {backgroundColor: colors.backgroundSecondary},
          headerTintColor: colors.text,
        }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <SafeAreaView style={styles.scrollContent}>
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {i18n.t('groupForm.groupName')} <Text style={styles.required}>{i18n.t('common.required')}</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={groupName}
                onChangeText={setGroupName}
                placeholder={i18n.t('groupForm.groupNamePlaceholder')}
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{i18n.t('groupForm.basedOnList')}</Text>
              <Text style={styles.sublabel}>{contactList?.name || '...'}</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {i18n.t('groupForm.selectMembers')} <Text style={styles.required}>{i18n.t('common.required')}</Text>
              </Text>
              <TouchableOpacity
                style={styles.picker}
                onPress={() => setIsMemberModalVisible(true)}
              >
                <Users size={20} color={colors.textSecondary} />
                <Text style={styles.pickerText}>
                  {i18n.t(selectedMembers.length === 1 ? 'groupForm.member' : 'groupForm.members', { count: selectedMembers.length })}
                </Text>
                <View style={{ width: 20 }} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
              <Text style={styles.deleteButtonText}>{i18n.t('groupForm.deleteButton')}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
            <Text style={styles.cancelButtonText}>{i18n.t('common.cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>{i18n.t('common.save')}</Text>
          </TouchableOpacity>
        </View>

        {contactList && displayNameFieldId && phoneFieldId && (
          <MemberSelectorModal
            isVisible={isMemberModalVisible}
            contacts={listContacts}
            initialSelectedIds={selectedMembers}
            displayNameFieldId={displayNameFieldId}
            phoneFieldId={phoneFieldId}
            onClose={() => setIsMemberModalVisible(false)}
            onSave={setSelectedMembers}
          />
        )}
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  scrollContent: {
    flex: 1,
    paddingBottom: 0,
    padding: 20,
  },
  form: {
    gap: 20,
    flex: 1,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.text,
  },
  sublabel: {
    marginTop: -4,
    fontSize: 14,
    color: colors.textSecondary,
  },
  required: {
    color: colors.danger,
  },
  input: {
    height: 48,
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  picker: {
    height: 48,
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerText: { flex: 1, textAlign: 'center', fontSize: 16, color: colors.text, fontWeight: '500' },
  deleteButton: {
    height: 48,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.danger,
  },
  errorText: {
    fontSize: 18,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 50,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
  saveButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
});