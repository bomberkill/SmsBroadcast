import colors from '@/constants/colors';
import { useAlert } from '@/contexts/AlertContext';
import { CheckCircle, Info, XCircle } from 'lucide-react-native';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const alertIcons = {
  success: <CheckCircle size={48} color={colors.success} />,
  error: <XCircle size={48} color={colors.danger} />,
  info: <Info size={48} color={colors.primary} />,
};

export default function CustomAlert() {
  const { alertState, hideAlert } = useAlert();
  const { isVisible, title, message, type, buttons } = alertState;

  if (!isVisible) {
    return null;
  }

  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={isVisible}
      onRequestClose={hideAlert}
    >
      <View style={styles.container}>
        <View style={styles.alertBox}>
          <View style={styles.iconContainer}>
            {alertIcons[type]}
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.buttonContainer}>
            {buttons && buttons.length > 0 ? (
              buttons.map((button, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    button.style === 'destructive' && styles.destructiveButton,
                    button.style === 'cancel' && styles.cancelButton,
                    buttons.length > 1 && styles.multiButton,
                  ]}
                  onPress={() => {
                    hideAlert();
                    button.onPress?.();
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.buttonText, button.style === 'cancel' && styles.cancelButtonText]}>{button.text}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <TouchableOpacity style={styles.button} onPress={hideAlert} activeOpacity={0.8}>
                <Text style={styles.buttonText}>OK</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertBox: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row', // To match native Alert order (OK on the right)
    flexWrap: 'wrap', // Allow buttons to wrap to the next line
    justifyContent: 'flex-end', // Align buttons to the right
    width: '100%',
    gap: 8,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24, // A bit less horizontal padding for more flexibility
    borderRadius: 25,
    // Remove flex: 1 to allow buttons to size based on content
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    marginVertical: 4, // Add vertical margin for wrapped buttons
  },
  multiButton: {
    alignSelf: 'auto',
  },
  destructiveButton: {
    backgroundColor: colors.danger,
  },
  cancelButton: {
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  cancelButtonText: {
    color: colors.text,
  },
});