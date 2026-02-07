import ContactListSelectorModal from '@/components/ContactListSelectorModal';
import MemberSelectorModal from '@/components/MemberSelectorModal';
import colors from '@/constants/colors';
import { useAlert } from '@/contexts/AlertContext';
import { useContactLists } from '@/contexts/ContactListContext';
import { useContactSchemas } from '@/contexts/ContactSchemaContext';
import { useContacts } from '@/contexts/ContactsContext';
import { useGroups } from '@/contexts/GroupsContext';
import { useMonetization } from '@/contexts/MonetizationContext';
import i18n from '@/libs/i18n';
import { Contact } from '@/types';
import { Stack, useRouter } from 'expo-router';
import { ChevronDown, Users } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
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

export default function CreateGroupScreen() {
  const router = useRouter();
  const { addGroup } = useGroups();
  const { contactLists, loading: contactListsLoading } = useContactLists();
  const { contacts } = useContacts();
  const { getSchemaById } = useContactSchemas();
  const { showAlert } = useAlert();
  const { limits, canCreateGroup } = useMonetization();
  const { groups } = useGroups();

  const [groupName, setGroupName] = useState<string>('');
  const [selectedContactListId, setSelectedContactListId] = useState<string | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isListModalVisible, setIsListModalVisible] = useState(false);
  const [isMemberModalVisible, setIsMemberModalVisible] = useState(false);

  const selectedContactList = useMemo(() => {
    return contactLists.find(cl => cl.id === selectedContactListId);
  }, [contactLists, selectedContactListId]);

  const schema = useMemo(() => {
    if (!selectedContactList) return null;
    return getSchemaById(selectedContactList.contactSchemaId);
  }, [selectedContactList, getSchemaById]);

  const displayNameFieldId = schema?.fields.find(f => f.isDisplayName)?.id;
  const phoneFieldId = schema?.fields.find(f => f.isPrimaryPhone)?.id;

  const listContacts = useMemo<Contact[]>(() => {
    if (!selectedContactList) return [];
    return selectedContactList.contactIds.map(id => contacts[id]).filter(Boolean);
  }, [selectedContactList, contacts]);

  const handleCreate = () => {
    if (!groupName.trim()) {
      showAlert(i18n.t('common.error'), i18n.t('groupForm.validationNameError'), [], 'error');
      return;
    }

    if (!selectedContactListId) {
      showAlert(i18n.t('common.error'), i18n.t('groupForm.validationListError'), [], 'error');
      return;
    }

    if (selectedMembers.length === 0) {
      showAlert(i18n.t('common.error'), i18n.t('groupForm.validationMemberError'), [], 'error');
      return;
    }

    if (!canCreateGroup(groups.length)) {
      showAlert(
        i18n.t('premium.limitReachedTitle'),
        i18n.t('premium.groupLimitReached'),
        [
          { text: i18n.t('common.cancel'), style: 'cancel' },
          { text: i18n.t('premium.subscribe'), onPress: () => router.push('/premium' as any) }
        ],
        'info'
      );
      return;
    }

    addGroup({
      groupName: groupName.trim(),
      contactListId: selectedContactListId,
      memberIds: selectedMembers,
    });

    showAlert(i18n.t('common.success'), i18n.t('groupForm.createSuccess'), [], 'success');
    router.back();
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: i18n.t('modals.createGroup'),
          headerTitleStyle: { color: colors.text, fontWeight: '600' },
          headerStyle: { backgroundColor: colors.background },
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
              <Text style={styles.label}>
                {i18n.t('groupForm.selectList')} <Text style={styles.required}>{i18n.t('common.required')}</Text>
              </Text>
              <TouchableOpacity style={styles.picker} onPress={() => setIsListModalVisible(true)}>
                <Text style={selectedContactList ? styles.pickerText : styles.pickerPlaceholder}>
                  {selectedContactList?.name || i18n.t('groupForm.selectListPlaceholder')}
                </Text>
                <ChevronDown size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {i18n.t('groupForm.selectMembers')} <Text style={styles.required}>{i18n.t('common.required')}</Text>
              </Text>
              <TouchableOpacity
                style={[styles.picker, !selectedContactListId && styles.pickerDisabled]}
                onPress={() => setIsMemberModalVisible(true)}
                disabled={!selectedContactListId}
              >
                <Users size={20} color={!selectedContactListId ? colors.textTertiary : colors.textSecondary} />
                <Text style={[styles.pickerText, !selectedContactListId && styles.pickerPlaceholder]}>
                  {selectedMembers.length > 0
                    ? i18n.t(selectedMembers.length === 1 ? 'groupForm.member' : 'groupForm.members', { count: selectedMembers.length })
                    : i18n.t('groupForm.selectMembers')}
                </Text>
                <View style={{ width: 20 }} />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
            <Text style={styles.cancelButtonText}>{i18n.t('common.cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.createButton} onPress={handleCreate}>
            <Text style={styles.createButtonText}>{i18n.t('common.create')}</Text>
          </TouchableOpacity>
        </View>

        <View>
          <ContactListSelectorModal
            isVisible={isListModalVisible}
            contactLists={contactLists}
            onClose={() => setIsListModalVisible(false)}
            onSelect={(list) => {
              // Si on change de liste, on réinitialise les membres sélectionnés
              if (list.id !== selectedContactListId) {
                setSelectedMembers([]);
              }
              setSelectedContactListId(list.id);
            }}
          />
          {selectedContactList && displayNameFieldId && phoneFieldId && (
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
        </View>
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
    padding: 20,
    paddingBottom: 0,
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
  pickerText: { fontSize: 16, color: colors.text },
  pickerPlaceholder: { fontSize: 16, color: colors.textSecondary },
  pickerDisabled: {
    backgroundColor: colors.borderLight,
  },
  centeredMessage: {
    flex: 1, alignItems: 'center', justifyContent: 'center'
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: 12,
    flex: 0.07,
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
  createButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
});