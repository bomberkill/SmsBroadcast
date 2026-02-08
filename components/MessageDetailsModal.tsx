import colors from '@/constants/colors';
import { getDateLabel } from '@/libs/date';
import i18n from '@/libs/i18n';
import { Message, MessageRecipient } from '@/types';
import { Check, CheckCheck, Clock, RotateCw, X } from 'lucide-react-native';
import React from 'react';
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

interface MessageDetailsModalProps {
    isVisible: boolean;
    message: Message | null;
    onClose: () => void;
    getContactName: (phoneNumber: string) => string | null;
    onRetryRecipient?: (phoneNumber: string) => void;
    highlightPhoneNumber?: string;
}

export default function MessageDetailsModal({
    isVisible,
    message,
    onClose,
    getContactName,
    onRetryRecipient,
    highlightPhoneNumber,
}: MessageDetailsModalProps) {
    if (!message) return null;

    const renderRecipient = ({ item }: { item: MessageRecipient }) => {
        const contactName = getContactName(item.phoneNumber);

        let Icon = Clock;
        let color = colors.textSecondary;
        let statusText = i18n.t('common.pending');

        if (item.status === 'sent') {
            Icon = Check;
            color = colors.success;
            statusText = i18n.t('common.sent');
        } else if (item.status === 'delivered') {
            Icon = CheckCheck;
            color = colors.success;
            statusText = i18n.t('common.delivered');
        } else if (item.status === 'failed') {
            Icon = X;
            color = colors.danger;
            statusText = i18n.t('common.failed');
        } else if (item.status === 'scheduled') {
            Icon = Clock;
            color = colors.textSecondary;
            statusText = i18n.t('common.scheduled');
        }

        return (
            <View style={[styles.recipientItem, item.phoneNumber === highlightPhoneNumber && styles.highlightedRecipient]}>
                <View style={styles.recipientInfo}>
                    <Text style={styles.recipientName}>{contactName || item.phoneNumber}</Text>
                    {contactName && <Text style={styles.recipientPhone}>{item.phoneNumber}</Text>}
                </View>
                <View style={styles.statusContainer}>
                    <View style={{ alignItems: 'flex-end' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={[styles.statusText, { color }]}>{statusText}</Text>
                            <Icon size={16} color={color} style={{ marginLeft: 4 }} />
                        </View>
                        {item.timestamp && (
                            <Text style={styles.recipientTime}>
                                {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                        )}
                        {item.status === 'failed' && item.errorCode && (
                            <Text style={styles.errorReasonText}>
                                {item.errorCode.startsWith('UNKNOWN_ERROR')
                                    ? i18n.t('smsErrors.UNKNOWN_ERROR', { code: item.errorCode.split(' ')[1]?.replace(/[()]/g, '') || '?' })
                                    : (i18n.t(`smsErrors.${item.errorCode}`) !== `smsErrors.${item.errorCode}`
                                        ? i18n.t(`smsErrors.${item.errorCode}`)
                                        : item.errorCode)}
                            </Text>
                        )}
                    </View>
                    {item.status === 'failed' && onRetryRecipient && (
                        <TouchableOpacity
                            onPress={() => onRetryRecipient(item.phoneNumber)}
                            style={styles.retryButton}
                        >
                            <RotateCw size={18} color={colors.primary} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    const successCount = message.recipients.filter(r => r.status === 'sent' || r.status === 'delivered').length;
    const totalCount = message.recipients.length;
    const successRate = totalCount > 0 ? Math.round((successCount / totalCount) * 100) : 0;

    return (
        <Modal
            visible={isVisible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={styles.container}>
                            <View style={styles.header}>
                                <View>
                                    <Text style={styles.title}>{i18n.t('messageDetails.title')}</Text>
                                    <Text style={styles.subtitle}>
                                        {i18n.t('messageDetails.successRate', { rate: successRate, sent: successCount, total: totalCount })}
                                    </Text>
                                </View>
                                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                    <X size={24} color={colors.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.messageContent}>
                                <Text style={styles.messageText}>{message.message}</Text>
                                <View style={styles.timestampContainer}>
                                    <Text style={styles.timestamp}>
                                        {getDateLabel(new Date(message.timestamp))} - {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                    {message.status === 'scheduled' && message.scheduledAt && (
                                        <View style={styles.scheduledHeader}>
                                            <Clock size={12} color={colors.primary} style={{ marginRight: 4 }} />
                                            <Text style={styles.scheduledHeaderText}>
                                                {i18n.t('common.scheduled')} : {new Date(message.scheduledAt).toLocaleString(i18n.locale, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>

                            <FlatList
                                data={message.recipients}
                                renderItem={renderRecipient}
                                keyExtractor={(item) => item.phoneNumber}
                                contentContainerStyle={styles.listContent}
                            />
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: colors.background,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        height: '80%',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: -2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.text,
    },
    subtitle: {
        fontSize: 14,
        color: colors.textSecondary,
        marginTop: 4,
    },
    closeButton: {
        padding: 4,
    },
    messageContent: {
        padding: 20,
        backgroundColor: colors.backgroundSecondary,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
    },
    messageText: {
        fontSize: 16,
        color: colors.text,
        marginBottom: 8,
    },
    timestamp: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    timestampContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 8,
    },
    scheduledHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.backgroundSecondary,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: colors.borderLight,
    },
    scheduledHeaderText: {
        fontSize: 11,
        fontWeight: '600',
        color: colors.primary,
    },
    listContent: {
        padding: 20,
    },
    recipientItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
    },
    recipientInfo: {
        flex: 1,
    },
    recipientName: {
        fontSize: 16,
        fontWeight: '500',
        color: colors.text,
    },
    recipientPhone: {
        fontSize: 14,
        color: colors.textSecondary,
        marginTop: 2,
    },
    recipientTime: {
        fontSize: 11,
        color: colors.textSecondary,
        marginTop: 2,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusText: {
        fontSize: 14,
        fontWeight: '500',
    },
    errorReasonText: {
        fontSize: 11,
        color: colors.danger,
        marginTop: 2,
    },
    retryButton: {
        marginLeft: 12,
        padding: 8,
        backgroundColor: colors.backgroundSecondary,
        borderRadius: 20,
    },
    highlightedRecipient: {
        backgroundColor: colors.primary + '10', // 10% opacity primary
        borderLeftWidth: 4,
        borderLeftColor: colors.primary,
        paddingLeft: 12,
    },
});
