import i18n from './i18n';

/**
 * Returns a human-readable date label like "Today", "Yesterday", "Monday", or "DD MMM YYYY".
 * Based on WhatsApp-style chat grouping.
 */
export const getDateLabel = (date: Date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (msgDate.getTime() === today.getTime()) {
        return i18n.t('common.today');
    }
    if (msgDate.getTime() === yesterday.getTime()) {
        return i18n.t('common.yesterday');
    }
    const diffTime = today.getTime() - msgDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 7) {
        return date.toLocaleDateString(i18n.locale, { weekday: 'long' });
    }
    return date.toLocaleDateString(i18n.locale, { day: '2-digit', month: 'short', year: 'numeric' });
};

/**
 * Returns a simple countdown label e.g., "In 5 min" or "In 2h".
 */
export const getRelativeCountdown = (date: Date) => {
    const diffMs = date.getTime() - Date.now();
    if (diffMs <= 0) return i18n.t('common.now') || 'Maintenant';

    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHrs = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHrs / 24);

    if (diffDays > 0) {
        return i18n.t('date.inDays', { count: diffDays }) || `Dans ${diffDays}j`;
    }
    if (diffHrs > 0) {
        return i18n.t('date.inHours', { count: diffHrs }) || `Dans ${diffHrs}h`;
    }
    if (diffMin > 0) {
        return i18n.t('date.inMinutes', { count: diffMin }) || `Dans ${diffMin} min`;
    }
    return i18n.t('date.inSeconds', { count: diffSec }) || `Dans ${diffSec} s`;
};
