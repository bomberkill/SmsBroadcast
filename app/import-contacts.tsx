import ExtractionPreviewModal from '@/components/ExtractionPreviewModal';
import LoadingModal from '@/components/LoadingModal';
import SchemaSelectorModal from '@/components/SchemaSelectorModal';
import colors from '@/constants/colors';
import { useAlert } from '@/contexts/AlertContext';
import { useContactLists } from '@/contexts/ContactListContext';
import { useContactSchemas } from '@/contexts/ContactSchemaContext';
import { useContacts } from '@/contexts/ContactsContext';
import i18n from '@/libs/i18n';
import { extractContactsFromCsv, mapGeminiResultToType } from '@/services/geminiService';
import { Contact } from '@/types';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Network from 'expo-network';
import { Stack, useRouter } from 'expo-router';
import { ChevronDown, File, FileSpreadsheet, FileText, FileUp, ListPlus } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

export default function ImportContactsScreen() {
  const router = useRouter();
  const { schemas, loading: schemasLoading } = useContactSchemas();
  const { addContact } = useContacts();
  const { addContactList } = useContactLists();
  const { showAlert } = useAlert();

  const [listName, setListName] = useState('');
  const [selectedSchemaId, setSelectedSchemaId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [isSchemaModalVisible, setIsSchemaModalVisible] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [extractedContacts, setExtractedContacts] = useState<Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>[]>([]);

  const selectedSchema = schemas.find(s => s.id === selectedSchemaId);

  const getFileIcon = (mimeType: string | undefined) => {
    if (!mimeType) return <File size={32} color={colors.textSecondary} />;

    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
      return <FileSpreadsheet size={32} color="#1D6F42" />; // Excel green
    }
    if (mimeType.includes('csv')) {
      return <FileText size={32} color="#005A9E" />; // A blue for CSV
    }
    if (mimeType.includes('pdf')) {
      return <File size={32} color="#D90000" />; // Adobe Red
    }
    if (mimeType.includes('word')) {
      return <FileText size={32} color="#2B579A" />; // Word Blue
    }

    return <File size={32} color={colors.textSecondary} />;
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'text/csv', // .csv
          'text/comma-separated-values', // .csv
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
          'application/vnd.ms-excel', // .xls
          // 'application/pdf', // .pdf
          // 'application/msword', // .doc
          // 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        ],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedFile(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      showAlert(i18n.t('common.error'), i18n.t('importContactsScreen.filePickerError'));
    }
  };

  const handleImport = async () => {
    if (!listName.trim()) {
      showAlert(i18n.t('common.error'), i18n.t('importContactsScreen.validation.listName'), [], 'error');
      return;
    }
    if (!selectedSchemaId) {
      showAlert(i18n.t('common.error'), i18n.t('importContactsScreen.validation.schema'), [], 'error');
      return;
    }
    if (!selectedFile) {
      showAlert(i18n.t('common.error'), i18n.t('importContactsScreen.validation.file'), [], 'error');
      return;
    }

    // Vérifier la connexion Internet avant de continuer
    const networkState = await Network.getNetworkStateAsync();
    if (!networkState.isConnected || !networkState.isInternetReachable) {
      showAlert(i18n.t('common.error'), i18n.t('importContactsScreen.validation.noInternet'), [], 'error');
      return;
    }

    setIsImporting(true);

    try {
      // 1. Lire le contenu du fichier
      console.log("debut lecture du contenu du fichier")
      const fileContent = await FileSystem.readAsStringAsync(selectedFile.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      console.log("fin de la lecture du contenu du fichier:", fileContent.substring(0, 100), "...")

      // 2. Appeler le service Gemini pour extraire les contacts
      console.log("debut de l'extraction du fichier")
      const extractedContactsFromCsv = await extractContactsFromCsv(fileContent, selectedSchema!);
      console.log("fin de l'extraction du fichier");

      if (extractedContactsFromCsv.length > 0 && selectedSchema) {
        // 1. Mapping strict selon le schéma
        const mapped = extractedContactsFromCsv.map(raw =>
          mapGeminiResultToType(raw, selectedSchema)
        );

        // 2. IDs fiables
        const contactsWithIds: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>[] = mapped.map(item => ({
          // id: nanoid(),
          contactSchemaId: selectedSchemaId!,   // <-- on ajoute le lien avec le schéma
          data: item,                           // <-- ici on met toutes les données retournées par Gemini
          // createdAt: new Date().toISOString(),  // <-- bonne pratique
          // updatedAt: new Date().toISOString(),
        }));
        setExtractedContacts(contactsWithIds);
        setIsPreviewVisible(true);
      } else {
        showAlert(i18n.t('common.info'), i18n.t('importContactsScreen.noContactsFound'), [], 'info');
      }

    } catch (error) {
      console.error("Erreur lors de l'importation :", error);
      const errorMessage = error instanceof Error ? error.message : i18n.t('importContactsScreen.createError');
      showAlert(i18n.t('common.error'), errorMessage, [], 'error');
    } finally {
      setIsImporting(false);
    }
  };

  const handleSaveFromPreview = async () => {
    setIsImporting(true);
    try {
      // 1. Enregistrer les contacts
      console.log("debut de l'enregistrement des contacts")
      const contactIds = await Promise.all(
        extractedContacts.map(contact => addContact(contact))
      );

      // 2. Ensuite enregistrer la liste avec les IDs
      console.log("debut de l'enregistrement de la liste de contacts")
      addContactList({
        name: listName,
        contactSchemaId: selectedSchemaId!,
        contactIds
      });
      console.log("fin de l'enregistrement de la liste de contacts")

      showAlert(
        i18n.t('common.success'),
        i18n.t('importContactsScreen.createSuccess', { listName, count: extractedContacts.length }),
        [], 'success'
      );
      setIsPreviewVisible(false);
      router.back();
    } catch (error) {
      showAlert(i18n.t('common.error'), i18n.t('importContactsScreen.createError'), [], 'error');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Stack.Screen options={{ title: i18n.t('importContactsScreen.title'), headerTitleStyle: { color: colors.text, fontWeight: '600' }, headerStyle: {backgroundColor: colors.background}, headerTintColor: colors.text }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{i18n.t('importContactsScreen.listNameLabel')}</Text>
          <TextInput
            style={styles.input}
            value={listName}
            onChangeText={setListName}
            placeholder={i18n.t('importContactsScreen.listNamePlaceholder')}
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{i18n.t('importContactsScreen.schemaLabel')}</Text>
          <TouchableOpacity style={styles.picker} onPress={() => setIsSchemaModalVisible(true)}>
            <Text style={selectedSchema ? styles.pickerText : styles.pickerPlaceholder}>
              {selectedSchema?.name || i18n.t('importContactsScreen.schemaPlaceholder')}
            </Text>
            <ChevronDown size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          {selectedFile && (
            <View style={styles.selectedFileContainer}>
              {getFileIcon(selectedFile.mimeType)}
              <View style={styles.selectedFileInfo}>
                <Text style={styles.selectedFileName} numberOfLines={1}>
                  {selectedFile.name}
                </Text>
                <Text style={styles.selectedFileSize}>{((selectedFile.size || 0) / 1024).toFixed(2)} KB</Text>
              </View>
            </View>
          )}
          <Text style={styles.label}>{i18n.t('importContactsScreen.fileLabel')}</Text>
          <TouchableOpacity style={styles.fileButton} onPress={handlePickDocument}>
            <FileUp size={20} color={colors.primary} />
            <Text style={styles.fileButtonText}>
              {i18n.t('importContactsScreen.filePlaceholder')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()} >
          <Text style={styles.cancelButtonText}>{i18n.t('common.cancel')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.saveButton, isImporting && styles.saveButtonDisabled]} onPress={handleImport} disabled={isImporting}>
          <ListPlus size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.saveButtonText}>{i18n.t('importContactsScreen.createButton')}</Text>
        </TouchableOpacity>
      </View>

      <SchemaSelectorModal
        isVisible={isSchemaModalVisible}
        schemas={schemas}
        onClose={() => setIsSchemaModalVisible(false)}
        onSelect={(schema) => {
          setSelectedSchemaId(schema.id);
        }}
      />

      {selectedSchema && (
        <ExtractionPreviewModal
          isVisible={isPreviewVisible}
          contacts={extractedContacts}
          schema={selectedSchema}
          onClose={() => setIsPreviewVisible(false)}
          onSave={handleSaveFromPreview}
          isSaving={isImporting}
        />
      )}

      <LoadingModal
        isVisible={isImporting}
        message={i18n.t('importContactsScreen.extractionInProgress')}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: 20, gap: 24 },
  inputGroup: { gap: 8 },
  label: { fontSize: 16, fontWeight: '600', color: colors.text },
  input: {
    height: 48,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  picker: {
    height: 48,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerText: { fontSize: 16, color: colors.text },
  pickerPlaceholder: { fontSize: 16, color: colors.textSecondary },
  fileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  fileButtonText: { color: colors.primary, fontSize: 16, fontWeight: '600', marginLeft: 8 },
  selectedFileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedFileInfo: {
    marginLeft: 12,
    flex: 1,
  },
  selectedFileName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  selectedFileSize: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 20,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: 12,
  },
  cancelButton: { flex: 1, height: 50, borderRadius: 12, backgroundColor: colors.backgroundSecondary, alignItems: 'center', justifyContent: 'center' },
  cancelButtonText: { fontSize: 16, fontWeight: '600', color: colors.text },
  saveButton: { flex: 1, height: 50, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  saveButtonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  saveButtonDisabled: {
    backgroundColor: colors.primary,
    opacity: 0.7,
  },
});