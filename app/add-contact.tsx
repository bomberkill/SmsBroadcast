// import colors from '@/constants/colors';
// import { useAlert } from '@/contexts/AlertContext';
// import { useContacts } from '@/contexts/ContactsContext';
// import i18n from '@/libs/i18n';
// import { useRouter } from 'expo-router';
// import React, { useState } from 'react';
// import {
//   KeyboardAvoidingView,
//   Platform,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
// } from 'react-native';

// export default function AddContactScreen() {
//   const router = useRouter();
//   const { addContact } = useContacts();
//   const { showAlert } = useAlert();
//   const t = i18n.t;

//   const [fullName, setFullName] = useState<string>('');
//   const [phoneNumber, setPhoneNumber] = useState<string>('');
//   const [profession, setProfession] = useState<string>('');
//   const [city, setCity] = useState<string>('');
//   const [email, setEmail] = useState<string>('');
//   const [gender, setGender] = useState<string>('');
//   const [country, setCountry] = useState<string>('');
//   const [region, setRegion] = useState<string>('');
//   const [healthDistrict, setHealthDistrict] = useState<string>('');
//   const [status, setStatus] = useState<string>('');
//   const [tmsSpecialty, setTmsSpecialty] = useState<string>('');
//   const [otherProfession, setOtherProfession] = useState<string>('');

//   const handleSave = () => {
//     if (!fullName.trim() || !phoneNumber.trim()) {
//       showAlert(t('common.error'), t('contactForm.validationError'), [], 'error');
//       return;
//     }

//     addContact({
//       fullName: fullName.trim(),
//       phoneNumber: phoneNumber.trim(),
//       profession: profession.trim(),
//       city: city.trim(),
//       email: email.trim(),
//       gender: gender.trim(),
//       country: country.trim(),
//       region: region.trim(),
//       healthDistrict: healthDistrict.trim(),
//       status: status.trim(),
//       tmsSpecialty: tmsSpecialty.trim(),
//       otherProfession: otherProfession.trim(),
//     });

//     showAlert(t('common.success'), t('contactForm.addSuccess'), [], 'success');
//     router.back();
//   };

//   return (
//     <KeyboardAvoidingView
//       behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//       style={styles.container}
//     >
//       <ScrollView contentContainerStyle={styles.scrollContent}>
//         <View style={styles.form}>
//           <View style={styles.inputGroup}>
//             <Text style={styles.label}>
//               {t('contactForm.fullName')} <Text style={styles.required}>{t('common.required')}</Text>
//             </Text>
//             <TextInput
//               style={styles.input}
//               value={fullName}
//               onChangeText={setFullName}
//               placeholder={t('contactForm.fullNamePlaceholder')}
//               placeholderTextColor={colors.textSecondary}
//               autoCapitalize="words"
//             />
//           </View>

//           <View style={styles.inputGroup}>
//             <Text style={styles.label}>
//               {t('contactForm.phoneNumber')} <Text style={styles.required}>{t('common.required')}</Text>
//             </Text>
//             <TextInput
//               style={styles.input}
//               value={phoneNumber}
//               onChangeText={setPhoneNumber}
//               placeholder={t('contactForm.phoneNumberPlaceholder')}
//               placeholderTextColor={colors.textSecondary}
//               keyboardType="phone-pad"
//             />
//           </View>

//           <View style={styles.inputGroup}>
//             <Text style={styles.label}>{t('contactForm.profession')}</Text>
//             <TextInput
//               style={styles.input}
//               value={profession}
//               onChangeText={setProfession}
//               placeholder={t('contactForm.professionPlaceholder')}
//               placeholderTextColor={colors.textSecondary}
//               autoCapitalize="words"
//             />
//           </View>

//           <View style={styles.inputGroup}>
//             <Text style={styles.label}>{t('contactForm.city')}</Text>
//             <TextInput
//               style={styles.input}
//               value={city}
//               onChangeText={setCity}
//               placeholder={t('contactForm.cityPlaceholder')}
//               placeholderTextColor={colors.textSecondary}
//               autoCapitalize="words"
//             />
//           </View>

//           <View style={styles.inputGroup}>
//             <Text style={styles.label}>{t('contactForm.email')}</Text>
//             <TextInput
//               style={styles.input}
//               value={email}
//               onChangeText={setEmail}
//               placeholder={t('contactForm.emailPlaceholder')}
//               placeholderTextColor={colors.textSecondary}
//               keyboardType="email-address"
//               autoCapitalize="none"
//               autoCorrect={false}
//             />
//           </View>

//           <View style={styles.inputGroup}>
//             <Text style={styles.label}>{t('contactForm.gender')}</Text>
//             <TextInput
//               style={styles.input}
//               value={gender}
//               onChangeText={setGender}
//               placeholder={t('contactForm.genderPlaceholder')}
//               placeholderTextColor={colors.textSecondary}
//               autoCapitalize="words"
//             />
//           </View>

//           <View style={styles.inputGroup}>
//             <Text style={styles.label}>{t('contactForm.country')}</Text>
//             <TextInput
//               style={styles.input}
//               value={country}
//               onChangeText={setCountry}
//               placeholder={t('contactForm.countryPlaceholder')}
//               placeholderTextColor={colors.textSecondary}
//               autoCapitalize="words"
//             />
//           </View>

//           <View style={styles.inputGroup}>
//             <Text style={styles.label}>{t('contactForm.region')}</Text>
//             <TextInput
//               style={styles.input}
//               value={region}
//               onChangeText={setRegion}
//               placeholder={t('contactForm.regionPlaceholder')}
//               placeholderTextColor={colors.textSecondary}
//               autoCapitalize="words"
//             />
//           </View>

//           <View style={styles.inputGroup}>
//             <Text style={styles.label}>{t('contactForm.healthDistrict')}</Text>
//             <TextInput
//               style={styles.input}
//               value={healthDistrict}
//               onChangeText={setHealthDistrict}
//               placeholder={t('contactForm.healthDistrictPlaceholder')}
//               placeholderTextColor={colors.textSecondary}
//               autoCapitalize="words"
//             />
//           </View>

//           <View style={styles.inputGroup}>
//             <Text style={styles.label}>{t('contactForm.status')}</Text>
//             <TextInput
//               style={styles.input}
//               value={status}
//               onChangeText={setStatus}
//               placeholder={t('contactForm.statusPlaceholder')}
//               placeholderTextColor={colors.textSecondary}
//               autoCapitalize="words"
//             />
//           </View>

//           <View style={styles.inputGroup}>
//             <Text style={styles.label}>{t('contactForm.specialty')}</Text>
//             <TextInput
//               style={styles.input}
//               value={tmsSpecialty}
//               onChangeText={setTmsSpecialty}
//               placeholder={t('contactForm.specialtyPlaceholder')}
//               placeholderTextColor={colors.textSecondary}
//               autoCapitalize="words"
//             />
//           </View>
//         </View>
//       </ScrollView>

//       <View style={styles.footer}>
//         <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
//           <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
//         </TouchableOpacity>
//         <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
//           <Text style={styles.saveButtonText}>{t('contactForm.saveButton')}</Text>
//         </TouchableOpacity>
//       </View>
//     </KeyboardAvoidingView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: colors.backgroundSecondary,
//   },
//   scrollContent: {
//     padding: 20,
//   },
//   form: {
//     gap: 20,
//   },
//   inputGroup: {
//     gap: 8,
//   },
//   label: {
//     fontSize: 15,
//     fontWeight: '600' as const,
//     color: colors.text,
//   },
//   required: {
//     color: colors.danger,
//   },
//   input: {
//     height: 48,
//     backgroundColor: colors.background,
//     borderRadius: 10,
//     paddingHorizontal: 16,
//     fontSize: 16,
//     color: colors.text,
//     borderWidth: 1,
//     borderColor: colors.inputBorder,
//   },
//   footer: {
//     flexDirection: 'row',
//     padding: 20,
//     backgroundColor: colors.background,
//     borderTopWidth: 1,
//     borderTopColor: colors.borderLight,
//     gap: 12,
//   },
//   cancelButton: {
//     flex: 1,
//     height: 50,
//     borderRadius: 12,
//     backgroundColor: colors.backgroundSecondary,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   cancelButtonText: {
//     fontSize: 16,
//     fontWeight: '600' as const,
//     color: colors.text,
//   },
//   saveButton: {
//     flex: 1,
//     height: 50,
//     borderRadius: 12,
//     backgroundColor: colors.primary,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   saveButtonText: {
//     fontSize: 16,
//     fontWeight: '600' as const,
//     color: '#FFFFFF',
//   },
// });