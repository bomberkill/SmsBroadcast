import colors from '@/constants/colors';
import i18n from '@/libs/i18n';
import { X } from 'lucide-react-native';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

interface ContactActionModalProps {
    isVisible: boolean;
    onClose: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onMessage?: () => void;
    contactName?: string;
}

export default function ContactActionModal({
    isVisible,
    onClose,
    onEdit,
    onDelete,
    onMessage,
    contactName,
}: ContactActionModalProps) {
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
                                <Text style={styles.title}>
                                    {contactName || i18n.t('common.actions')}
                                </Text>
                                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                    <X size={24} color={colors.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.content}>
                                {onMessage && (
                                    <TouchableOpacity style={styles.actionItem} onPress={() => { onClose(); onMessage(); }}>
                                        <Text style={styles.actionText}>{i18n.t('common.message')}</Text>
                                    </TouchableOpacity>
                                )}

                                <TouchableOpacity style={styles.actionItem} onPress={() => { onClose(); onEdit(); }}>
                                    <Text style={styles.actionText}>{i18n.t('common.edit')}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.actionItem} onPress={() => { onClose(); onDelete(); }}>
                                    <Text style={[styles.actionText, { color: colors.danger }]}>{i18n.t('common.delete')}</Text>
                                </TouchableOpacity>
                            </View>
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
        backgroundColor: colors.backgroundSecondary,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        paddingBottom: 40,
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
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
        paddingBottom: 15,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.text,
    },
    closeButton: {
        padding: 4,
    },
    content: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    actionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        backgroundColor: colors.background,
    },
    actionText: {
        fontSize: 16,
        fontWeight: '500',
        color: colors.text,
    },
});
