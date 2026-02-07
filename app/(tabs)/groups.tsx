import AdPlaceholder from '@/components/AdPlaceholder';
import ContactActionModal from '@/components/ContactActionModal';
import colors from '@/constants/colors';
import { useAlert } from '@/contexts/AlertContext';
import { useContactLists } from '@/contexts/ContactListContext';
import { useContactSchemas } from '@/contexts/ContactSchemaContext';
import { useContacts } from '@/contexts/ContactsContext';
import { useGroups } from '@/contexts/GroupsContext';
import { useMessages } from '@/contexts/MessagesContext';
import { useMonetization } from '@/contexts/MonetizationContext';
import { getDateLabel } from '@/libs/date';
import i18n from '@/libs/i18n';
import { Group, Message } from '@/types';
import { useRouter } from 'expo-router';
import { CalendarClock, MoreVertical, Plus, Users } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function GroupsScreen() {
  const router = useRouter();
  const { groups, isLoading, deleteGroup } = useGroups();
  const { contactLists } = useContactLists();
  const { showAlert } = useAlert();
  const { contacts } = useContacts();
  const { getSchemaById } = useContactSchemas();
  const { messages } = useMessages();
  const { limits, canCreateGroup } = useMonetization();

  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  const sortedGroups = useMemo(() => {
    return [...groups].sort((a, b) => {
      const msgsA = messages.filter((m: Message) => m.groupId === a.id);
      const msgsB = messages.filter((m: Message) => m.groupId === b.id);

      const lastA = msgsA.length > 0 ? new Date(msgsA[msgsA.length - 1].timestamp).getTime() : 0;
      const lastB = msgsB.length > 0 ? new Date(msgsB[msgsB.length - 1].timestamp).getTime() : 0;

      return lastB - lastA; // Recents first
    });
  }, [groups, messages]);

  const handleDeleteGroup = (group: Group) => {
    showAlert(
      i18n.t('groupForm.deleteConfirmTitle'),
      i18n.t('groupForm.deleteConfirmMessage'),
      [
        { text: i18n.t('common.cancel'), style: 'cancel' },
        {
          text: i18n.t('common.delete'),
          style: 'destructive',
          onPress: () => deleteGroup(group.id),
        },
      ],
      'error'
    );
  };

  const renderGroupItem = ({ item }: { item: Group }) => {
    const contactList = contactLists.find(cl => cl.id === item.contactListId);
    const schema = contactList ? getSchemaById(contactList.contactSchemaId) : undefined;
    const displayNameFieldId = schema?.fields.find(f => f.isDisplayName)?.id;

    const memberNames = item.memberIds
      .map((memberId) => {
        const contact = contacts[memberId];
        if (contact && displayNameFieldId) {
          return contact.data[displayNameFieldId] || 'Unknown';
        }
        return null;
      })
      .filter(Boolean)
      .slice(0, 3) // Show max 3 names
      .join(', ');

    const groupMessages = messages.filter((m: Message) => m.groupId === item.id);
    const lastMessage = groupMessages.length > 0 ? groupMessages[groupMessages.length - 1] : null;

    return (
      <TouchableOpacity
        style={styles.itemContainer}
        onPress={() => router.push(`/group-chat/${item.id}` as any)}
        activeOpacity={0.7}
      >
        <Users size={24} color={colors.primary} />
        <View style={styles.itemTextContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.groupName} numberOfLines={1}>{item.groupName}</Text>
            {lastMessage && (
              <Text style={styles.lastMessageDate}>
                {getDateLabel(new Date(lastMessage.timestamp))}
              </Text>
            )}
          </View>

          <View style={styles.bottomRow}>
            <View style={{ flex: 1 }}>
              {lastMessage ? (
                <Text style={styles.lastMessageText} numberOfLines={1}>
                  {lastMessage.message}
                </Text>
              ) : (
                <Text style={styles.groupMembers} numberOfLines={1}>
                  {item.memberIds.length} {item.memberIds.length === 1 ? i18n.t('groupsScreen.member') : i18n.t('groupsScreen.members')}
                  {memberNames ? ` · ${memberNames}` : ''}
                </Text>
              )}
            </View>

            {lastMessage?.status === 'scheduled' && (
              <View style={styles.scheduledBadge}>
                <CalendarClock size={10} color={colors.primary} style={{ marginRight: 4 }} />
                <Text style={styles.scheduledBadgeText}>{i18n.t('groupsScreen.scheduledBadge')}</Text>
              </View>
            )}

            <TouchableOpacity
              onPress={() => {
                setSelectedGroup(item);
                setIsMenuVisible(true);
              }}
              style={styles.actionButton}
            >
              <MoreVertical size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={sortedGroups}
        renderItem={renderGroupItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={<AdPlaceholder />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Users size={64} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>{i18n.t('groupsScreen.emptyTitle')}</Text>
            <Text style={styles.emptyText}>{i18n.t('groupsScreen.emptyText')}</Text>
            <AdPlaceholder />
          </View>
        }
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
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
          router.push('/create-group' as any);
        }}
        activeOpacity={0.8}
      >
        <Plus size={28} color="#FFFFFF" />
      </TouchableOpacity>
      <ContactActionModal
        isVisible={isMenuVisible}
        contactName={selectedGroup?.groupName}
        onClose={() => setIsMenuVisible(false)}
        onEdit={() => {
          if (selectedGroup) {
            router.push(`/edit-group/${selectedGroup.id}` as any);
          }
        }}
        onDelete={() => {
          if (selectedGroup) {
            handleDeleteGroup(selectedGroup);
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: { justifyContent: 'center', alignItems: 'center' },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  itemTextContainer: { marginLeft: 16, flex: 1 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  lastMessageDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  lastMessageText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  groupMembers: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  scheduledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundTertiary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  scheduledBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.primary,
  },
  actionsContainer: { flexDirection: 'row' },
  actionButton: { paddingLeft: 8, paddingVertical: 4 },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600' as const,
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
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
