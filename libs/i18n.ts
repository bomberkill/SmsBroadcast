import * as Localization from 'expo-localization';
import { I18n } from 'i18n-js';

// Import all translation files
import en from '../locales/en.json';
import fr from '../locales/fr.json';

const i18n = new I18n();

// Set the supported locales
i18n.translations = { en, fr };

// Set the locale once at the beginning of your app.
i18n.locale = Localization.getLocales()[0].languageCode || 'en';
i18n.enableFallback = true;

export default i18n;