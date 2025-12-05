import colors from '@/constants/colors';
import { useAlert } from '@/contexts/AlertContext';
import { useContacts } from '@/contexts/ContactsContext';
import { useGroups } from '@/contexts/GroupsContext';
import { Contact } from '@/types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle, Circle, Search } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const PAGE_SIZE = 15;

export default function EditGroupScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { groups, updateGroup, deleteGroup } = useGroups();
  const { contacts: allContacts } = useContacts();
  const { showAlert } = useAlert();

  const group = groups.find((g) => g.id === id);

  const [groupName, setGroupName] = useState<string>('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (group) {
      setGroupName(group.groupName);
      setSelectedMembers(group.members);
    }
  }, [group]);

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return allContacts;
    const query = searchQuery.toLowerCase();
    return allContacts.filter(
      (c) => c.fullName.toLowerCase().includes(query) || c.phoneNumber.includes(query)
    );
  }, [allContacts, searchQuery]);

  const totalPages = Math.ceil(filteredContacts.length / PAGE_SIZE);

  const paginatedContacts = useMemo(() => {
    return filteredContacts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  }, [filteredContacts, page]);

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const toggleMember = (contactId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(contactId)
        ? prev.filter((memberId) => memberId !== contactId)
        : [...prev, contactId]
    );
  };

  if (!group) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Group not found</Text>
      </View>
    );
  }

  const handleSave = () => {
    if (!groupName.trim()) {
      showAlert('Error', 'Please enter a group name', [], 'error');
      return;
    }

    if (selectedMembers.length === 0) {
      showAlert('Error', 'Please select at least one member', [], 'error');
      return;
    }

    updateGroup(id!, {
      groupName: groupName.trim(),
      members: selectedMembers,
    });

    showAlert('Success', 'Group updated successfully!', [], 'success');
    router.back();
  };

  const handleDelete = () => {
    showAlert(
      'Delete Group',
      'Are you sure you want to delete this group?',
      [
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteGroup(id!);
            router.replace('/groups');
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ],
      'error'
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.scrollContent}>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Group Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={groupName}
              onChangeText={setGroupName}
              placeholder="Team Project, Family, etc."
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Select Members <Text style={styles.required}>*</Text>
            </Text>
            <Text style={styles.sublabel}>
              {selectedMembers.length} {selectedMembers.length === 1 ? 'member' : 'members'} selected
            </Text>
          </View>

          <View style={styles.searchContainer}>
            <Search size={20} color={colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search contacts to add..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {filteredContacts.length > PAGE_SIZE && (
            <View style={styles.paginationContainer}>
              <TouchableOpacity
                style={[styles.paginationButton, page === 1 && styles.paginationButtonDisabled]}
                onPress={handlePrevPage}
                disabled={page === 1}>
                <Text style={styles.paginationButtonText}>Prev</Text>
              </TouchableOpacity>
              <Text style={styles.paginationText}>
                Page {page} of {totalPages}
              </Text>
              <TouchableOpacity
                style={[styles.paginationButton, page === totalPages && styles.paginationButtonDisabled]}
                onPress={handleNextPage}
                disabled={page === totalPages}>
                <Text style={styles.paginationButtonText}>Next</Text>
              </TouchableOpacity>
            </View>
          )}

          <FlatList
            data={paginatedContacts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const isSelected = selectedMembers.includes(item.id);
              return (
                <MemberItem item={item} isSelected={isSelected} onToggle={toggleMember} />
              );
            }}
            style={styles.membersList}
            ListEmptyComponent={
              <Text style={styles.emptyListText}>No contacts found.</Text>
            }
          />

          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteButtonText}>Delete Group</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const MemberItem = React.memo(
  ({ item, isSelected, onToggle }: { item: Contact; isSelected: boolean; onToggle: (id: string) => void }) => {
    return (
      <TouchableOpacity
        style={[styles.memberItem, isSelected && styles.memberItemSelected]}
        onPress={() => onToggle(item.id)}
        activeOpacity={0.7}>
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{item.fullName}</Text>
          <Text style={styles.memberPhone}>{item.phoneNumber}</Text>
        </View>
        {isSelected ? (
          <CheckCircle size={24} color={colors.primary} />
        ) : (
          <Circle size={24} color={colors.textSecondary} />
        )}
      </TouchableOpacity>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  scrollContent: {
    flex: 1,
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
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  paginationButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  paginationButtonDisabled: {
    backgroundColor: colors.textTertiary,
  },
  paginationButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  paginationText: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  membersList: {
    flex: 1,
  },
  emptyListText: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: 20,
    fontSize: 16,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    marginBottom: 8,
  },
  memberItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.backgroundSecondary,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 4,
  },
  memberPhone: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  deleteButton: {
    height: 48,
    borderRadius: 10,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
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