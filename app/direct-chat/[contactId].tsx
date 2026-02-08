import MessageDetailsModal from '@/components/MessageDetailsModal';
import colors from '@/constants/colors';
import { useAlert } from '@/contexts/AlertContext';
import { useContactSchemas } from '@/contexts/ContactSchemaContext';
import { useContacts } from '@/contexts/ContactsContext';
import { useGroups } from '@/contexts/GroupsContext';
import { useMessages } from '@/contexts/MessagesContext';
import { getDateLabel } from '@/libs/date';
import i18n from '@/libs/i18n';
import { ensureAllPermissions } from '@/libs/permissions';
import { getAvailableSimsAsync, scheduleSms, sendSms, SimInfo, smsEventEmitter, SmsStatusUpdateEvent } from '@/modules/expo-sms-manager';
import { Message } from '@/types';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { CalendarClock, Check, CheckCheck, Clock, MessageCircle, Send, X } from 'lucide-react-native';
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
    View,
} from 'react-native';

export default function DirectChatScreen() {
    const router = useRouter();
    const { contactId } = useLocalSearchParams<{ contactId: string }>();

    const { messages, addMessage, updateMessageRecipientStatus, updateMessageStatus } = useMessages();
    const { contacts } = useContacts();
    const { groups } = useGroups();
    const { getSchemaById } = useContactSchemas();
    const { showAlert } = useAlert();

    const phoneNumber = useMemo(() => {
        const contact = contacts[contactId];
        if (contact) {
            const schema = getSchemaById(contact.contactSchemaId);
            const phoneField = schema?.fields.find(f => f.isPrimaryPhone);
            return phoneField ? contact.data[phoneField.id] : '';
        }
        return contactId; // Fallback to raw ID as number
    }, [contactId, contacts, getSchemaById]);

    const [messageText, setMessageText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [isDetailsVisible, setIsDetailsVisible] = useState(false);
    const [selection, setSelection] = useState({ start: 0, end: 0 });

    // Scheduling states
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
    const [pendingSubId, setPendingSubId] = useState<number | null>(null);
    const flatListRef = React.useRef<FlatList>(null);

    const contact = useMemo(() => contacts[contactId], [contacts, contactId]);

    const contactName = useMemo(() => {
        if (!contact) return phoneNumber;
        const schema = getSchemaById(contact.contactSchemaId);
        const displayNameField = schema?.fields.find(f => f.isDisplayName);
        return (displayNameField ? contact.data[displayNameField.id] : null) || phoneNumber;
    }, [contact, phoneNumber, getSchemaById]);

    const schema = useMemo(() => {
        if (!contact) return null;
        return getSchemaById(contact.contactSchemaId);
    }, [contact, getSchemaById]);

    const handleMessageChange = (newText: string) => {
        if (newText.length >= messageText.length) {
            setMessageText(newText);
            return;
        }

        const tagRegex = /\{\{([^}]+)\}\}/g;
        let match;
        const tagsInOldText: { text: string, start: number, end: number }[] = [];
        while ((match = tagRegex.exec(messageText)) !== null) {
            tagsInOldText.push({ text: match[0], start: match.index, end: match.index + match[0].length });
        }

        let i = 0;
        while (i < newText.length && i < messageText.length && newText[i] === messageText[i]) {
            i++;
        }

        const brokenTag = tagsInOldText.find(tag => i >= tag.start && i < tag.end);

        if (brokenTag) {
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

    // Filter messages for this phone number
    const chatMessages: Message[] = useMemo(() => {
        return messages
            .filter(m => m.recipients?.some(r => r.phoneNumber === phoneNumber))
            .sort((a, b) => {
                if (a.status === 'scheduled' && b.status !== 'scheduled') return 1;
                if (a.status !== 'scheduled' && b.status === 'scheduled') return -1;
                return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
            });
    }, [messages, phoneNumber]);


    const displayItems: (Message & { itemType?: 'message' } | { itemType: 'header', label: string })[] = useMemo(() => {
        const items: (Message & { itemType?: 'message' } | { itemType: 'header', label: string })[] = [];
        let lastDateLabel: string | null = null;

        chatMessages.forEach(msg => {
            const date = new Date(msg.timestamp);
            const dateLabel = getDateLabel(date);
            if (dateLabel !== lastDateLabel) {
                items.push({ itemType: 'header', label: dateLabel });
                lastDateLabel = dateLabel;
            }
            items.push({ itemType: 'message', ...msg });
        });

        return items;
    }, [chatMessages, i18n.locale]);

    useEffect(() => {
        const statusSubscription = smsEventEmitter.addListener('onSmsStatusUpdate', (event: SmsStatusUpdateEvent) => {
            if (event.phoneNumber === phoneNumber) {
                updateMessageRecipientStatus(event.messageId, event.phoneNumber, 'sent');
            }
        });

        const deliverySubscription = smsEventEmitter.addListener('onSmsDeliveryUpdate', (event: SmsStatusUpdateEvent) => {
            if (event.phoneNumber === phoneNumber) {
                updateMessageRecipientStatus(event.messageId, event.phoneNumber, 'delivered');
            }
        });

        return () => {
            statusSubscription.remove();
            deliverySubscription.remove();
        };
    }, [phoneNumber, updateMessageRecipientStatus]);

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

            if (phoneStateGranted === PermissionsAndroid.RESULTS.GRANTED) {
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
                    console.warn("Could not get SIM info.", e);
                }
            }
        }
        onCompleted(null);
    };

    const handleSend = async () => {
        if (!messageText.trim() || isSending) return;

        const hasPermission = await ensureAllPermissions('SEND', showAlert);
        if (!hasPermission) return;

        setIsSending(true);
        await selectSim(async (subId) => {
            const baseMessage = messageText.trim();
            let personalized = baseMessage;
            if (contact && schema) {
                schema.fields.forEach(field => {
                    const placeholder = `{{${field.name}}}`;
                    const value = contact.data[field.id] || '';
                    personalized = personalized.split(placeholder).join(value);
                });
            }

            const newMessage = addMessage({
                groupId: '', // Individual chat
                message: baseMessage,
                status: 'sending',
                type: 'SMS',
                recipients: [{ phoneNumber, status: 'pending', personalizedMessage: personalized }],
                senderId: 'me',
            });

            try {
                const result = await sendSms(newMessage.id, [phoneNumber], personalized, subId);
                if (result.status === 'failed') {
                    updateMessageStatus(newMessage.id, 'failed');
                    updateMessageRecipientStatus(newMessage.id, phoneNumber, 'failed', result.errorCode);
                }
            } catch (error) {
                updateMessageStatus(newMessage.id, 'failed');
                updateMessageRecipientStatus(newMessage.id, phoneNumber, 'failed', 'INIT_ERROR');
            } finally {
                setIsSending(false);
                setMessageText('');
            }
        });
    };

    const handleSchedule = async () => {
        if (!messageText.trim() || isSending) return;

        const hasPermission = await ensureAllPermissions('SCHEDULE', showAlert);
        if (!hasPermission) return;

        setIsSending(true);
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
                showAlert(i18n.t('common.error'), "La date de planification doit être dans le futur", [], 'error');
                setIsSending(false);
                return;
            }

            triggerSchedule(finalDate);
        } else {
            setIsSending(false);
        }
    };

    const triggerSchedule = async (date: Date) => {
        const baseMessage = messageText.trim();
        const tempId = Date.now().toString();

        let personalized = baseMessage;
        if (contact && schema) {
            schema.fields.forEach(field => {
                const placeholder = `{{${field.name}}}`;
                const value = contact.data[field.id] || '';
                personalized = personalized.split(placeholder).join(value);
            });
        }

        const personalizedMessages: Record<string, string> = {
            [phoneNumber]: personalized
        };

        try {
            await scheduleSms(
                tempId,
                '', // No group
                contactName,
                baseMessage,
                personalizedMessages,
                date.getTime(),
                pendingSubId
            );

            addMessage({
                id: tempId,
                groupId: '',
                message: baseMessage,
                type: 'SMS',
                status: 'scheduled',
                recipients: [{
                    phoneNumber,
                    status: 'scheduled',
                    timestamp: new Date().toISOString(),
                    personalizedMessage: personalized
                }],
                scheduledAt: date.toISOString(),
                subscriptionId: pendingSubId,
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


    const handleRetryRecipient = async (targetPhone: string) => {
        if (!selectedMessage || isSending) return;

        const recipient = selectedMessage.recipients.find(r => r.phoneNumber === targetPhone);
        if (!recipient) return;

        const hasPermission = await ensureAllPermissions('SEND', showAlert);
        if (!hasPermission) return;

        setIsSending(true);
        const subId = selectedMessage.subscriptionId || null;

        try {
            updateMessageRecipientStatus(selectedMessage.id, targetPhone, 'pending');
            const result = await sendSms(selectedMessage.id, [targetPhone], recipient.personalizedMessage || selectedMessage.message, subId);
            if (result.status === 'failed') {
                updateMessageRecipientStatus(selectedMessage.id, targetPhone, 'failed', result.errorCode);
            }
        } catch (error) {
            updateMessageRecipientStatus(selectedMessage.id, targetPhone, 'failed', 'INIT_ERROR');
        } finally {
            setIsSending(false);
        }
    };

    const renderMessage = (item: Message) => {
        const isMe = item.senderId === 'me';
        const recipient = item.recipients.find(r => r.phoneNumber === phoneNumber);
        const status = recipient?.status || item.status;
        const group = item.groupId ? groups.find(g => g.id === item.groupId) : null;

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
                    {group && (
                        <Text style={[styles.groupMarker, isMe ? styles.sentGroupMarker : styles.receivedGroupMarker]}>
                            {i18n.t('messageDetails.sentViaGroup', { groupName: group.groupName })}
                        </Text>
                    )}
                    <Text style={[styles.messageText, isMe ? styles.sentText : styles.receivedText]}>
                        {recipient?.personalizedMessage || item.message}
                    </Text>
                    <View style={styles.messageFooter}>
                        <Text style={[styles.messageTime, isMe ? styles.sentTime : styles.receivedTime]}>
                            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                        {isMe && (
                            <View style={styles.statusIcon}>
                                {status === 'delivered' ? (
                                    <CheckCheck size={12} color="#FFFFFF" />
                                ) : status === 'sent' ? (
                                    <Check size={12} color="#FFFFFF" />
                                ) : status === 'failed' ? (
                                    <X size={12} color={colors.danger} />
                                ) : (
                                    <Clock size={12} color="#FFFFFF" opacity={0.7} />
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
                    title: contactName,
                    headerTitleStyle: { color: colors.text, fontWeight: '600' },
                    headerStyle: { backgroundColor: colors.background },
                    headerTintColor: colors.text,
                }}
            />

            <FlatList
                ref={flatListRef}
                data={displayItems}
                renderItem={({ item }) => {
                    if (item.itemType === 'header') {
                        return (
                            <View style={styles.dateHeader}>
                                <View style={styles.dateBadge}>
                                    <Text style={styles.dateText}>{item.label}</Text>
                                </View>
                            </View>
                        );
                    }
                    return renderMessage(item as Message);
                }}
                keyExtractor={(item, index) => item.itemType === 'header' ? `header-${index}` : item.id}
                contentContainerStyle={styles.listContent}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <MessageCircle size={64} color={colors.textTertiary} />
                        <Text style={styles.emptyTitle}>{i18n.t('groupChat.emptyTitle')}</Text>
                        <Text style={styles.emptyText}>{i18n.t('groupChat.emptyText')}</Text>
                    </View>
                }
            />

            {schema && (
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
            )}

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <View style={styles.inputArea}>
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
                        onPress={handleSchedule}
                        disabled={!messageText.trim() || isSending}
                    >
                        <CalendarClock size={20} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.sendButton, (!messageText.trim() || isSending) && styles.sendButtonDisabled]}
                        onPress={handleSend}
                        disabled={!messageText.trim() || isSending}
                    >
                        <Send size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            <MessageDetailsModal
                isVisible={isDetailsVisible}
                message={selectedMessage}
                onClose={() => setIsDetailsVisible(false)}
                getContactName={(num: string) => {
                    const foundContact = Object.values(contacts).find(c => {
                        const s = getSchemaById(c.contactSchemaId);
                        const pf = s?.fields.find(f => f.isPrimaryPhone);
                        return pf && c.data[pf.id] === num;
                    });
                    if (foundContact) {
                        const s = getSchemaById(foundContact.contactSchemaId);
                        const df = s?.fields.find(f => f.isDisplayName);
                        return (df ? foundContact.data[df.id] : null) || num;
                    }
                    return num === phoneNumber ? contactName : num;
                }}
                onRetryRecipient={handleRetryRecipient}
                highlightPhoneNumber={phoneNumber}
            />

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
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.backgroundSecondary,
    },
    listContent: {
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
    groupMarker: {
        fontSize: 10,
        fontStyle: 'italic',
        marginBottom: 4,
    },
    sentGroupMarker: {
        color: 'rgba(255, 255, 255, 0.8)',
    },
    receivedGroupMarker: {
        color: colors.textSecondary,
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
        marginTop: 4,
        gap: 4,
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
    statusIcon: {
        marginLeft: 2,
    },
    inputArea: {
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
    },
});
