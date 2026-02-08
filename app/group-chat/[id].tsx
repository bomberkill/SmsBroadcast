import MessageDetailsModal from '@/components/MessageDetailsModal';
import colors from '@/constants/colors';
import { useAlert } from '@/contexts/AlertContext';
import { useContactLists } from '@/contexts/ContactListContext';
import { useContactSchemas } from '@/contexts/ContactSchemaContext';
import { useContacts } from '@/contexts/ContactsContext';
import { useGroups } from '@/contexts/GroupsContext';
import { useMessages } from '@/contexts/MessagesContext';
import { useMonetization } from '@/contexts/MonetizationContext';
import { getDateLabel, getRelativeCountdown } from '@/libs/date';
import i18n from '@/libs/i18n';
import { ensureAllPermissions } from '@/libs/permissions';
import { getAvailableSimsAsync, scheduleSms, sendSms, SimInfo, smsEventEmitter, SmsStatusUpdateEvent } from '@/modules/expo-sms-manager';
import { Message, MessageRecipient } from '@/types';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { CalendarClock, Check, CheckCheck, Clock, MessageCircle, Pencil, Send, Settings, Trash2, X } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertButton,
  FlatList,
  KeyboardAvoidingView,
  PermissionsAndroid,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

export default function GroupChatScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getGroupById } = useGroups();
  const { contactLists } = useContactLists();
  const { contacts } = useContacts();
  const { getSchemaById } = useContactSchemas();
  const { addMessage, updateMessageStatus, updateMessageRecipientStatus, getMessagesByGroupId, deleteMessage, messages } = useMessages();
  const { showAlert } = useAlert();
  const { limits, canSendSms } = useMonetization();

  // Tick for countdown refresh
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 5000); // refresh every 5s
    return () => clearInterval(timer);
  }, []);

  const group = getGroupById(id!);
  const groupMessages = useMemo(() => getMessagesByGroupId(id!), [id, getMessagesByGroupId]);

  const contactList = useMemo(() => {
    if (!group) return null;
    return contactLists.find(cl => cl.id === group.contactListId);
  }, [group, contactLists]);

  const schema = useMemo(() => {
    if (!contactList) return null;
    return getSchemaById(contactList.contactSchemaId);
  }, [contactList, getSchemaById]);

  const memberContacts = useMemo(() => {
    if (!group) return [];
    return group.memberIds.map((id) => contacts[id]);
  }, [group, contacts]);

  const displayNameFieldId = schema?.fields.find(f => f.isDisplayName)?.id;
  const phoneFieldId = schema?.fields.find(f => f.isPrimaryPhone)?.id;

  const [messageText, setMessageText] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);
  const [selection, setSelection] = useState({ start: 0, end: 0 });

  // Scheduling states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const [pendingSubId, setPendingSubId] = useState<number | null>(null);
  const flatListRef = React.useRef<FlatList>(null);

  const handleMessageChange = (newText: string) => {
    // If text increased or stayed same, just accept it
    if (newText.length >= messageText.length) {
      setMessageText(newText);
      return;
    }

    // Deletion detection
    const tagRegex = /\{\{([^}]+)\}\}/g;
    let match;
    const tagsInOldText: { text: string, start: number, end: number }[] = [];
    while ((match = tagRegex.exec(messageText)) !== null) {
      tagsInOldText.push({ text: match[0], start: match.index, end: match.index + match[0].length });
    }

    // Find where the change happened
    let i = 0;
    while (i < newText.length && i < messageText.length && newText[i] === messageText[i]) {
      i++;
    }
    // i is the index where the deletion started in the old text

    // Check if i is within any tag
    const brokenTag = tagsInOldText.find(tag => i >= tag.start && i < tag.end);

    if (brokenTag) {
      // Remove the entire tag from the original text
      const beforeTag = messageText.substring(0, brokenTag.start);
      const afterTag = messageText.substring(brokenTag.end);
      setMessageText(beforeTag + afterTag);
    } else {
      setMessageText(newText);
    }
  };

  const insertProperty = (fieldLabel: string) => {
    const tag = `{{${fieldLabel}}}`;
    const { start, end } = selection;
    const before = messageText.substring(0, start);
    const after = messageText.substring(end);
    setMessageText(before + tag + after);
  };

  React.useEffect(() => {
    const statusSubscription = smsEventEmitter.addListener('onSmsStatusUpdate', (event: SmsStatusUpdateEvent) => {
      console.log("Rcvd SMS update:", event);
      if (event.status === 'sent') {
        updateMessageRecipientStatus(event.messageId, event.phoneNumber, 'sent');
      } else if (event.status === 'failed') {
        updateMessageRecipientStatus(event.messageId, event.phoneNumber, 'failed', event.errorCode);
      }
    });

    const deliverySubscription = smsEventEmitter.addListener('onSmsDeliveryUpdate', (event: SmsStatusUpdateEvent) => {
      console.log("Rcvd SMS delivery:", event);
      if (event.status === 'delivered') {
        updateMessageRecipientStatus(event.messageId, event.phoneNumber, 'delivered');
      } else if (event.status === 'failed') {
        updateMessageRecipientStatus(event.messageId, event.phoneNumber, 'failed', event.errorCode);
      }
    });

    return () => {
      statusSubscription.remove();
      deliverySubscription.remove();
    };
  }, [updateMessageRecipientStatus]);

  const displayItems = useMemo(() => {
    // Separate scheduled and non-scheduled messages
    const history = groupMessages.filter(m => m.status !== 'scheduled')
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const scheduled = groupMessages.filter(m => m.status === 'scheduled')
      .sort((a, b) => {
        const dateA = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0;
        const dateB = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0;
        return dateA - dateB;
      });

    const items: any[] = [];
    let lastDateLabel: string | null = null;

    // Process history with date headers
    history.forEach(msg => {
      const date = new Date(msg.timestamp);
      const dateLabel = getDateLabel(date);
      if (dateLabel !== lastDateLabel) {
        items.push({ itemType: 'header', label: dateLabel });
        lastDateLabel = dateLabel;
      }
      items.push({ itemType: 'message', ...msg });
    });

    // Add scheduled messages at the end
    if (scheduled.length > 0) {
      items.push({ itemType: 'header', label: i18n.t('groupChat.scheduledMessages') || 'Messages Planifiés' });
      scheduled.forEach(msg => {
        items.push({ itemType: 'message', ...msg });
      });
    }

    return items;
  }, [groupMessages, i18n.locale]);

  if (!group || !contactList || !schema || !displayNameFieldId || !phoneFieldId) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{i18n.t('groupChat.groupNotFound')}</Text>
      </View>
    );
  }

  const selectSim = async (onCompleted: (subId: number | null) => void) => {
    if (Platform.OS === 'android') {
      const phoneStateGranted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
        {
          title: i18n.t('groupChat.simSelectTitle'),
          message: i18n.t('groupChat.simSelectMessage'),
          buttonPositive: i18n.t('common.allow'),
          buttonNegative: i18n.t('common.deny'),
        }
      );

      if (phoneStateGranted !== PermissionsAndroid.RESULTS.GRANTED) {
        console.warn('READ_PHONE_STATE permission denied. Using default SIM.');
      }

      try {
        const availableSims = await getAvailableSimsAsync();
        if (availableSims.length > 1) {
          const simButtons: AlertButton[] = availableSims.map((sim: SimInfo) => ({
            text: sim.carrierName,
            onPress: () => onCompleted(sim.subscriptionId),
          }));

          simButtons.push({ text: i18n.t('common.cancel'), style: 'cancel', onPress: () => setIsSending(false) });
          showAlert(i18n.t('groupChat.simSelectTitle'), i18n.t('groupChat.simSelectMessage'), simButtons, 'info');
          return;
        }
      } catch (e) {
        console.warn("Could not get SIM info, will use default.", e);
      }
    }
    onCompleted(null);
  };

  const sendSMS = async () => {
    if (!messageText.trim()) {
      showAlert(i18n.t('common.error'), i18n.t('groupChat.smsError'), [], 'error');
      return;
    }

    setIsSending(true);

    const phoneNumbers = memberContacts.map((c) => c.data[phoneFieldId]).filter(Boolean);
    if (phoneNumbers.length === 0) {
      showAlert(i18n.t('common.error'), i18n.t('groupChat.noValidNumbers'), [], 'error');
      setIsSending(false); // Reset sending state if no valid numbers
      return;
    }
    const message = messageText.trim();

    // Unified permission check
    const hasPermission = await ensureAllPermissions('SEND', showAlert);
    if (!hasPermission) {
      setIsSending(false); // Reset sending state if permissions not granted
      return;
    }

    await selectSim((subId) => triggerSend(phoneNumbers, message, subId));
  };

  const scheduleSMS = async () => {
    if (!messageText.trim()) {
      showAlert(i18n.t('common.error'), i18n.t('groupChat.smsError'), [], 'error');
      return;
    }

    setIsSending(true);

    // Unified permission check
    const hasPermission = await ensureAllPermissions('SCHEDULE', showAlert);
    if (!hasPermission) {
      setIsSending(false); // Reset sending state if permissions not granted
      return;
    }

    await selectSim((subId) => {
      setPendingSubId(subId);
      setShowDatePicker(true);
    });
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (event.type === 'dismissed') {
      setIsSending(false);
      return;
    }
    if (selectedDate) {
      setScheduledDate(selectedDate);
      setShowTimePicker(true);
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (event.type === 'dismissed') {
      setIsSending(false);
      return;
    }
    if (selectedTime && scheduledDate) {
      const finalDate = new Date(scheduledDate);
      finalDate.setHours(selectedTime.getHours());
      finalDate.setMinutes(selectedTime.getMinutes());
      finalDate.setSeconds(0);

      if (finalDate.getTime() <= Date.now()) {
        showAlert(i18n.t('common.error'), i18n.t('groupChat.futureDateError'), [], 'error');
        setIsSending(false);
        return;
      }

      const phoneNumbers = memberContacts.map((c) => c.data[phoneFieldId]).filter(Boolean);
      triggerSchedule(phoneNumbers, messageText.trim(), pendingSubId, finalDate);
    } else {
      setIsSending(false);
    }
  };

  // Fonction séparée pour être appelée après la sélection de la SIM
  const triggerSend = async (phoneNumbers: string[], baseMessage: string, subscriptionId: number | null) => {
    // Check SMS limit
    const totalSent = messages.filter(m => (m.status as string) === 'sent' || (m.status as string) === 'delivered').length;
    if (!canSendSms(totalSent, phoneNumbers.length)) {
      showAlert(
        i18n.t('premium.limitReachedTitle'),
        i18n.t('premium.smsLimitReached'),
        [
          { text: i18n.t('common.cancel'), style: 'cancel' },
          { text: i18n.t('premium.subscribe'), onPress: () => router.push('/premium' as any) }
        ],
        'info'
      );
      setIsSending(false);
      return;
    }

    // 1. Prepare personalized recipients
    const recipients: (MessageRecipient)[] = memberContacts.map(c => {
      let personalized = baseMessage;
      schema.fields.forEach(field => {
        const placeholder = `{{${field.name}}}`;
        const value = c.data[field.id] || '';
        // Use a simple global replacement
        personalized = personalized.split(placeholder).join(value);
      });

      return {
        phoneNumber: c.data[phoneFieldId],
        status: 'pending' as const,
        personalizedMessage: personalized
      };
    }).filter(r => r.phoneNumber);

    if (recipients.length === 0) {
      showAlert(i18n.t('common.error'), i18n.t('groupChat.noValidNumbers'), [], 'error');
      setIsSending(false);
      return;
    }

    const newMessage = addMessage({
      groupId: id!,
      message: baseMessage, // Keep template as the main message
      status: 'sending',
      type: 'SMS',
      recipients,
      senderId: 'me',
    });

    console.log(`Attempting personalized send to ${recipients.length} recipients`);

    try {
      // Send each one individually to support personalization
      const sendPromises = recipients.map(async (recipient) => {
        try {
          return await sendSms(newMessage.id, [recipient.phoneNumber], recipient.personalizedMessage || baseMessage, subscriptionId);
        } catch (e: any) {
          console.error(`Failed to initiate for ${recipient.phoneNumber}:`, e);
          updateMessageRecipientStatus(newMessage.id, recipient.phoneNumber, 'failed', 'INIT_ERROR');
          return { status: 'failed', message: e.message };
        }
      });

      const results = await Promise.all(sendPromises);

      // Check if all failed to initiate
      const allFailed = results.every(r => r.status === 'failed');
      if (allFailed) {
        updateMessageStatus(newMessage.id, 'failed');
        showAlert(i18n.t('common.error'), i18n.t('groupChat.sendFailed'), [], 'error');
      }
    } catch (error: any) {
      console.error('Error in send loop:', error);
      updateMessageStatus(newMessage.id, 'failed');
      showAlert(i18n.t('common.error'), i18n.t('groupChat.sendError'), [], 'error');
    } finally {
      setIsSending(false);
      setMessageText('');
    }
  };

  const triggerSchedule = async (phoneNumbers: string[], baseMessage: string, subscriptionId: number | null, date: Date) => {
    const tempId = Date.now().toString();

    // 1. Prepare personalized messages (map of phone -> message)
    const personalizedMessages: Record<string, string> = {};
    const recipientStates: MessageRecipient[] = [];

    memberContacts.forEach(c => {
      const phoneNumber = c.data[phoneFieldId!];
      if (!phoneNumber) return;

      let personalized = baseMessage;
      schema.fields.forEach(field => {
        const placeholder = `{{${field.name}}}`;
        const value = c.data[field.id] || '';
        personalized = personalized.split(placeholder).join(value);
      });

      personalizedMessages[phoneNumber] = personalized;
      recipientStates.push({
        phoneNumber,
        status: 'scheduled',
        timestamp: new Date().toISOString(),
        personalizedMessage: personalized
      });
    });

    if (recipientStates.length === 0) {
      showAlert(i18n.t('common.error'), i18n.t('groupChat.noValidNumbers'), [], 'error');
      setIsSending(false);
      return;
    }

    // Check SMS limit
    const totalSent = messages.filter(m => (m.status as string) === 'sent' || (m.status as string) === 'delivered').length;
    if (!canSendSms(totalSent, recipientStates.length)) {
      showAlert(
        i18n.t('premium.limitReachedTitle'),
        i18n.t('premium.smsLimitReached'),
        [
          { text: i18n.t('common.cancel'), style: 'cancel' },
          { text: i18n.t('premium.subscribe'), onPress: () => router.push('/premium' as any) }
        ],
        'info'
      );
      setIsSending(false);
      return;
    }

    try {
      // 2. Try to schedule natively FIRST (Atomic approach)
      await scheduleSms(
        tempId,
        id!,
        group.groupName, // Pass group name
        baseMessage,     // Pass base message
        personalizedMessages,
        date.getTime(),
        subscriptionId
      );

      // 3. If native scheduling succeeds, commit to local database
      addMessage({
        id: tempId,
        groupId: id!,
        message: baseMessage,
        type: 'SMS',
        status: 'scheduled',
        recipients: recipientStates,
        scheduledAt: date.toISOString(),
        subscriptionId,
        senderId: 'me',
      });

    } catch (error) {
      console.error('Error in schedule:', error);
      showAlert(i18n.t('common.error'), i18n.t('groupChat.scheduleError'), [], 'error');
    } finally {
      setIsSending(false);
      setMessageText('');
    }
  };

  const handleRetryRecipient = async (phoneNumber: string) => {
    if (!selectedMessage) return;

    const recipient = selectedMessage.recipients.find(r => r.phoneNumber === phoneNumber);
    if (!recipient) return;

    // Unified permission check
    const hasPermission = await ensureAllPermissions('SEND', showAlert);
    if (!hasPermission) return;

    setIsSending(true);
    // Use selectSim if you want to allow changing SIM on retry, or just reuse the original subId
    // I'll reuse the original subId from the message if available
    const subId = selectedMessage.subscriptionId || null;

    try {
      updateMessageRecipientStatus(selectedMessage.id, phoneNumber, 'pending');
      const result = await sendSms(selectedMessage.id, [phoneNumber], recipient.personalizedMessage || selectedMessage.message, subId);
      if (result.status === 'failed') {
        updateMessageRecipientStatus(selectedMessage.id, phoneNumber, 'failed', result.errorCode);
      }
    } catch (error) {
      updateMessageRecipientStatus(selectedMessage.id, phoneNumber, 'failed', 'INIT_ERROR');
    } finally {
      setIsSending(false);
    }
  };

  const handleEditScheduled = (item: Message) => {
    setMessageText(item.message);
    deleteMessage(item.id);
  };

  const handleDeleteScheduled = (item: Message) => {
    showAlert(
      i18n.t('common.confirm'),
      i18n.t('groupChat.deleteScheduledConfirm'),
      [
        { text: i18n.t('common.cancel'), style: 'cancel' },
        {
          text: i18n.t('common.delete'),
          style: 'destructive',
          onPress: () => deleteMessage(item.id)
        }
      ],
      'info'
    );
  };

  const getContactName = (phoneNumber: string) => {
    const contact = Object.values(contacts).find(c =>
      schema && c.data[phoneFieldId!] === phoneNumber
    );
    if (contact && displayNameFieldId) {
      return contact.data[displayNameFieldId];
    }
    return null;
  };

  const renderItem = ({ item }: { item: any }) => {
    if (item.itemType === 'header') {
      return (
        <View style={styles.dateHeader}>
          <View style={styles.dateBadge}>
            <Text style={styles.dateText}>{item.label}</Text>
          </View>
        </View>
      );
    }
    return renderMessage(item);
  };

  const renderMessage = (item: Message) => {
    const isMe = item.senderId === 'me';

    // Calculate stats
    const total = item.recipients ? item.recipients.length : 0;
    const successes = item.recipients ? item.recipients.filter(r => r.status === 'sent' || r.status === 'delivered').length : 0;
    const allDelivered = total > 0 && item.recipients.every(r => r.status === 'delivered');

    return (
      <View style={[styles.messageContainer, isMe ? styles.sentContainer : styles.receivedContainer]}>
        <TouchableOpacity
          style={[styles.messageBubble, isMe ? styles.sentBubble : styles.receivedBubble]}
          onPress={() => {
            setSelectedMessage(item);
            setIsDetailsVisible(true);
          }}
          activeOpacity={0.8}
        >
          <Text style={[styles.messageText, isMe ? styles.sentText : styles.receivedText]}>{item.message}</Text>
          {item.status === 'scheduled' && item.scheduledAt && (
            <View style={styles.scheduledStatusRow}>
              <View style={styles.scheduledLabel}>
                <CalendarClock size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.scheduledText}>
                  {getRelativeCountdown(new Date(item.scheduledAt))}
                </Text>
              </View>
              <View style={styles.scheduledActions}>
                <TouchableOpacity onPress={() => handleEditScheduled(item)} style={styles.actionBtn}>
                  <Pencil size={12} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteScheduled(item)} style={styles.actionBtn}>
                  <Trash2 size={12} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          )}
          <View style={styles.messageFooter}>
            <Text style={[styles.messageTime, isMe ? styles.sentTime : styles.receivedTime]}>
              {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            {isMe && item.recipients && (
              <View style={styles.statsContainer}>
                <Text style={styles.statsText}>
                  {successes}/{total}
                </Text>
                {allDelivered ? (
                  <CheckCheck size={12} color="#FFFFFF" />
                ) : (
                  <>
                    {item.status === 'sent' && <Check size={12} color="#FFFFFF" />}
                    {item.status === 'failed' && <X size={12} color={colors.danger} />}
                    {item.status === 'partial' && <Clock size={12} color={colors.warning} />}
                    {item.status === 'sending' && <Clock size={12} color="#FFFFFF" />}
                    {item.status === 'scheduled' && <Clock size={12} color="#FFFFFF" opacity={0.7} />}
                  </>
                )}
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: group.groupName,
          headerTitleStyle: { color: colors.text, fontWeight: '600' },
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push(`/edit-group/${id}` as any)}
              style={styles.headerButton}
            >
              <Settings size={24} color={colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.membersInfo}>
        <Text style={styles.membersText} numberOfLines={2}>
          {i18n.t(memberContacts.length === 1 ? 'groupChat.member' : 'groupChat.members', { count: memberContacts.length })}:{' '}
          {memberContacts.map((c) => c.data[displayNameFieldId]).join(', ')}
        </Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={displayItems}
        renderItem={renderItem}
        keyExtractor={(item, index) => item.itemType === 'header' ? `header-${index}` : item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MessageCircle size={64} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>{i18n.t('groupChat.emptyTitle')}</Text>
            <Text style={styles.emptyText}>
              {i18n.t('groupChat.emptyText')}
            </Text>
          </View>
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.propertyPickerContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.propertyPicker} contentContainerStyle={styles.propertyPickerContent}>
            {schema.fields.map(field => (
              <TouchableOpacity
                key={field.id}
                style={styles.propertyBtn}
                onPress={() => insertProperty(field.name)}
                activeOpacity={0.7}
              >
                <Text style={styles.propertyBtnText}>{field.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={messageText}
            onChangeText={handleMessageChange}
            onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
            placeholder={i18n.t('groupChat.inputPlaceholder')}
            placeholderTextColor={colors.textSecondary}
            multiline
            maxLength={160}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!messageText.trim() || isSending) && styles.sendButtonDisabled, { marginRight: 8, backgroundColor: colors.backgroundSecondary }]}
            onPress={scheduleSMS}
            disabled={!messageText.trim() || isSending}
            activeOpacity={0.7}
          >
            <CalendarClock size={20} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sendButton, (!messageText.trim() || isSending) && styles.sendButtonDisabled]}
            onPress={sendSMS}
            disabled={!messageText.trim() || isSending}
            activeOpacity={0.7}
          >
            <Send size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>


      {showDatePicker && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display="default"
          onChange={onDateChange}
          minimumDate={new Date()}
        />
      )}
      {showTimePicker && (
        <DateTimePicker
          value={new Date()}
          mode="time"
          display="default"
          onChange={onTimeChange}
        />
      )}

      <MessageDetailsModal
        isVisible={isDetailsVisible}
        message={selectedMessage}
        onClose={() => setIsDetailsVisible(false)}
        getContactName={getContactName}
        onRetryRecipient={handleRetryRecipient}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  headerButton: {
    padding: 8,
  },
  membersInfo: {
    // backgroundColor: colors.background,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  membersText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  messagesList: {
    padding: 16,
    paddingBottom: 20,
  },
  dateHeader: {
    alignItems: 'center',
    marginVertical: 12,
  },
  dateBadge: {
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  dateText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  dateHeaderContainer: {
    display: 'none', // Removed old header styles
  },
  messageContainer: {
    marginBottom: 8,
    width: '100%',
  },
  sentContainer: {
    alignItems: 'flex-end',
  },
  receivedContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 10,
    borderRadius: 16,
  },
  sentBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  receivedBubble: {
    backgroundColor: colors.background,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
  },
  sentText: {
    color: '#FFFFFF',
  },
  receivedText: {
    color: colors.text,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statsText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  messageTime: {
    fontSize: 10,
  },
  sentTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  receivedTime: {
    color: colors.textSecondary,
  },
  messageStatus: {
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: 8,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: colors.inputBackground,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 15,
    color: colors.text,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  errorText: {
    fontSize: 16,
    color: colors.danger,
    textAlign: 'center',
    marginTop: 20,
  },
  scheduledActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionBtn: {
    padding: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
  },
  scheduledStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 4,
    gap: 8,
  },
  scheduledLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  scheduledText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  propertyPickerContainer: {
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  propertyPicker: {
    paddingVertical: 10,
  },
  propertyPickerContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  propertyBtn: {
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  propertyBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  }
});
