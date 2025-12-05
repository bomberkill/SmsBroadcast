import colors from '@/constants/colors';
import { useAlert } from '@/contexts/AlertContext';
import { useContacts } from '@/contexts/ContactsContext';
import { useGroups } from '@/contexts/GroupsContext';
import { useMessages } from '@/contexts/MessagesContext';
import * as ExpoSmsManager from '@/modules/expo-sms-manager';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { MessageCircle, Send, Settings } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
  AlertButton,
  FlatList,
  KeyboardAvoidingView,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function GroupChatScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getGroupById } = useGroups();
  const { contacts } = useContacts();
  const { addMessage, updateMessageStatus, getMessagesByGroupId } = useMessages();
  const { showAlert } = useAlert();

  const group = getGroupById(id!);
  const groupMessages = useMemo(() => getMessagesByGroupId(id!), [id, getMessagesByGroupId]);

  const [messageText, setMessageText] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);

  if (!group) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Group not found</Text>
      </View>
    );
  }

  const memberContacts = group.members
    .map((memberId) => contacts.find((c) => c.id === memberId))
    .filter(Boolean);

  const selectSimAndSend = async (phoneNumbers: string[], message: string) => {
    let subscriptionId: number | null = null;

    if (Platform.OS === 'android') {
      // Demander la permission de lire l'état du téléphone pour choisir la SIM
      const phoneStateGranted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
        {
          title: 'SIM Card Permission',
          message: 'This app needs permission to access SIM card information to let you choose which one to use.',
          buttonPositive: 'Allow',
          buttonNegative: 'Deny',
        }
      );
      // Si la permission n'est pas accordée, on continue avec la SIM par défaut.
      // L'application ne sera pas bloquée, mais la sélection de SIM ne sera pas possible.
      if (phoneStateGranted !== PermissionsAndroid.RESULTS.GRANTED) {
        console.warn('READ_PHONE_STATE permission denied. Using default SIM.');
      }

      try {
        const availableSims = await ExpoSmsManager.getAvailableSimsAsync();

        if (availableSims.length > 1) {
          const simButtons: AlertButton[] = availableSims.map(sim => ({
            text: `${sim.displayName} (SIM ${sim.simSlotIndex + 1})`,
            onPress: () => {
              subscriptionId = sim.subscriptionId;
              // On doit rappeler la fonction d'envoi après la sélection
              triggerSend(phoneNumbers, message, subscriptionId);
            },
          }));

          // Ajoute un bouton Annuler
          simButtons.push({ text: 'Cancel', style: 'cancel', onPress: () => setIsSending(false) });          

          showAlert('Choose a SIM card', 'Which SIM card do you want to use?', simButtons, 'info');
          // On arrête ici, l'envoi sera déclenché par le onPress du bouton
          return;
        }
      } catch (e) {
        console.warn("Could not get SIM info, will use default.", e);
      }
    }

    // Si une seule SIM ou si on n'est pas sur Android, on envoie directement
    triggerSend(phoneNumbers, message, null);
  };

  const sendSMS = async () => {
    if (!messageText.trim()) {
      showAlert('Error', 'Please enter a message', [], 'error');
      return;
    }

    setIsSending(true);

    const phoneNumbers = memberContacts.map((c) => c!.phoneNumber);
    const message = messageText.trim();

    // Demande de permission SMS
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.SEND_SMS,
        {
          title: 'Permission to send SMS',
          message: 'This app needs permission to send SMS messages automatically.',
          buttonPositive: 'Allow',
          buttonNegative: 'Deny',
        }
      );

      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        showAlert('Permission denied', 'Cannot send SMS without permission.', [], 'error');
        setIsSending(false);
        return;
      }
    }

    // Démarre le processus de sélection de SIM et d'envoi
    await selectSimAndSend(phoneNumbers, message);
  };

  // Fonction séparée pour être appelée après la sélection de la SIM
  const triggerSend = async (phoneNumbers: string[], message: string, subscriptionId: number | null) => {
    const newMessage = addMessage({
      groupId: id!,
      message: message,
      status: 'sending',
    });

    console.log(`Attempting to send SMS to: [${phoneNumbers.join(', ')}] with SIM ID: ${subscriptionId}`);
    console.log('Message:', message);

    try {
      // Appel de notre nouveau module natif
      const result = await ExpoSmsManager.sendSms(phoneNumbers, message, subscriptionId);

      // Le reste de la logique est identique
      if (result.status === 'sent') {
        updateMessageStatus(newMessage.id, 'sent');
        showAlert('Success', result.message || 'SMS has been queued for sending.', [], 'success');
      } else if (result.status === 'cancelled') {
        updateMessageStatus(newMessage.id, 'failed');
        showAlert('Cancelled', 'SMS sending was cancelled by the user.', [], 'info');
      } else {
        // Gère les cas 'failed' et 'unknown'
        updateMessageStatus(newMessage.id, 'failed');
        showAlert('Failed', result.message || 'An unknown error occurred while sending SMS.', [], 'error');
      }
    } catch (error: any) {
      console.error('Error sending SMS:', error);
      updateMessageStatus(newMessage.id, 'failed');
      showAlert('Error', error.message || 'An unexpected error occurred.', [], 'error');
    } finally {
      setIsSending(false);
      setMessageText('');
    }
  };

  const renderMessage = ({ item }: { item: typeof groupMessages[0] }) => (
    <View style={[styles.messageContainer, styles.sentMessage]}>
      <Text style={styles.messageText}>{item.message}</Text>
      <View style={styles.messageFooter}>
        <Text style={styles.messageTime}>
          {new Date(item.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
        <Text
          style={[
            styles.messageStatus,
            item.status === 'sent' && styles.statusSent,
            item.status === 'failed' && styles.statusFailed,
          ]}
        >
          {item.status === 'sending' && '⏱️'}
          {item.status === 'sent' && '✓'}
          {item.status === 'failed' && '✗'}
        </Text>
      </View>
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: group.groupName,
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
        style={styles.container}
      >
        <View style={styles.membersInfo}>
          <Text style={styles.membersText} numberOfLines={2}>
            {memberContacts.length} {memberContacts.length === 1 ? 'member' : 'members'}:{' '}
            {memberContacts.map((c) => c!.fullName).join(', ')}
          </Text>
        </View>

        <FlatList
          data={groupMessages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MessageCircle size={64} color={colors.textTertiary} />
              <Text style={styles.emptyTitle}>No Messages Yet</Text>
              <Text style={styles.emptyText}>
                Send your first message to this group. It will be sent via SMS to all members.
              </Text>
            </View>
          }
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={messageText}
            onChangeText={setMessageText}
            placeholder="Type a message..."
            placeholderTextColor={colors.textSecondary}
            multiline
            maxLength={160}
          />
          <TouchableOpacity
            style={[styles.sendButton, isSending && styles.sendButtonDisabled]}
            onPress={sendSMS}
            disabled={isSending}
            activeOpacity={0.7}
          >
            <Send size={20} color="#FFFFFF" />
          </TouchableOpacity>
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
  headerButton: {
    padding: 8,
  },
  membersInfo: {
    backgroundColor: colors.background,
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
  messageContainer: {
    maxWidth: '80%',
    marginBottom: 12,
    borderRadius: 16,
    padding: 12,
  },
  sentMessage: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
  },
  messageText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  messageTime: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  messageStatus: {
    fontSize: 12,
  },
  statusSent: {
    color: '#FFFFFF',
  },
  statusFailed: {
    color: colors.danger,
  },
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
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    backgroundColor: colors.inputBackground,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 16,
    color: colors.text,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  errorText: {
    fontSize: 18,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 50,
  },
});
