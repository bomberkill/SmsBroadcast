import colors from '@/constants/colors';
import { useAlert } from '@/contexts/AlertContext';
import { useContacts } from '@/contexts/ContactsContext';
import { Contact } from '@/types';
import { useRouter } from 'expo-router';
import { ChevronRight, Plus, RefreshCw, Search, UserCircle } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  NativeModules,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
console.log('native modules logs',NativeModules.ExpoSmsManager);


const PAGE_SIZE = 20;

export default function ContactsScreen() {
  const router = useRouter();
  const { filteredContacts, searchQuery, setSearchQuery, syncWithGoogleSheets, isSyncing } = useContacts();
  const { showAlert } = useAlert();
  const [googleSheetUrl, setGoogleSheetUrl] = useState<string>('');
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const [page, setPage] = useState(1);

  // Calculer le nombre total de pages
  const totalPages = Math.ceil(filteredContacts.length / PAGE_SIZE);

  // Afficher seulement la tranche de contacts pour la page actuelle
  const paginatedContacts = useMemo(() => {
    return filteredContacts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  }, [filteredContacts, page]);

  const handleSync = async () => {
    if (!googleSheetUrl.trim()) {
      showAlert('Error', 'Please enter a Google Sheets URL', [], 'error');
      return;
    }

    try {
      await syncWithGoogleSheets(googleSheetUrl);
      showAlert('Success', 'Contacts synced successfully!', [], 'success');
    } catch {
      showAlert('Error', 'Failed to sync contacts. Please check the URL and try again.', [], 'error');
    }
  };

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

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

  const handleContactPress = useCallback((item: Contact) => {
    router.push(`/edit-contact/${item.id}` as any);
  }, [router]);

  const renderContactItem = useCallback(({ item }: { item: Contact }) => (
    <ContactItem item={item} onPress={handleContactPress} />
  ), [handleContactPress]);

  // const renderContactItem = ({ item }: { item: typeof filteredContacts[0] }) => (
  //   <TouchableOpacity
  //     style={styles.contactCard}
  //     onPress={() => router.push(`/edit-contact/${item.id}` as any)}
  //     activeOpacity={0.7}
  //   >
  //     <View style={styles.avatar}>
  //       <UserCircle size={48} color={colors.primary} />
  //     </View>
  //     <View style={styles.contactInfo}>
  //       <Text style={styles.contactName}>{item.fullName}</Text>
  //       <Text style={styles.contactDetails}>{item.profession}</Text>
  //       <Text style={styles.contactPhone}>{item.phoneNumber}</Text>
  //     </View>
  //     <ChevronRight size={20} color={colors.textSecondary} />
  //   </TouchableOpacity>
  // );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search contacts..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.syncContainer}>
        <TextInput
          style={styles.syncInput}
          placeholder="Google Sheets URL (optional)"
          placeholderTextColor={colors.textSecondary}
          value={googleSheetUrl}
          onChangeText={setGoogleSheetUrl}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          style={styles.syncButton}
          onPress={handleSync}
          disabled={isSyncing}
          activeOpacity={0.7}
        >
          {isSyncing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <RefreshCw size={20} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>

      {filteredContacts.length > 0 && (
        <View style={styles.paginationContainer}>
          <TouchableOpacity
            style={[styles.paginationButton, page === 1 && styles.paginationButtonDisabled]}
            onPress={handlePrevPage}
            disabled={page === 1}
          >
            <Text style={styles.paginationButtonText}>Précédent</Text>
          </TouchableOpacity>
          <Text style={styles.paginationText}>
            Page {page} sur {totalPages}
          </Text>
          <TouchableOpacity
            style={[styles.paginationButton, page === totalPages && styles.paginationButtonDisabled]}
            onPress={handleNextPage}
            disabled={page === totalPages}
          >
            <Text style={styles.paginationButtonText}>Suivant</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={paginatedContacts}
        renderItem={renderContactItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <UserCircle size={64} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>No Contacts Found</Text>
            <Text style={styles.emptyText}>
              {searchQuery ? 'Try a different search term' : 'Add your first contact to get started'}
            </Text>
          </View>
        }
      />

      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/add-contact' as any)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.9}
        >
          <Plus size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const ContactItem = React.memo(({ item, onPress }: { item: Contact, onPress: (item: Contact) => void }) => {
  return (
    <TouchableOpacity
      style={styles.contactCard}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.avatar}>
        <UserCircle size={48} color={colors.primary} />
      </View>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.fullName}</Text>
        <Text style={styles.contactDetails} numberOfLines={1}>{item.profession}</Text>
        <Text style={styles.contactPhone}>{item.phoneNumber}</Text>
      </View>
      <ChevronRight size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  syncContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background,
    gap: 8,
  },
  syncInput: {
    flex: 1,
    height: 40,
    backgroundColor: colors.inputBackground,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: colors.text,
  },
  syncButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
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
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 4,
  },
  contactDetails: {
    fontSize: 14,
    color: colors.textSecondary,
    flexShrink: 1,
    marginBottom: 2,
  },
  contactPhone: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
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
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});