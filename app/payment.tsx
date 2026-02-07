import colors from '@/constants/colors';
import { useAlert } from '@/contexts/AlertContext';
import { useMonetization } from '@/contexts/MonetizationContext';
import i18n from '@/libs/i18n';
import { paymentService } from '@/services';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { ArrowLeft, CheckCircle2, Landmark, SmartphoneNfc as MobilePhone, Smartphone } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

type PaymentMethod = 'bank' | 'mtn' | 'orange';

const PaymentScreen = () => {
    const router = useRouter();
    const { plan, price } = useLocalSearchParams<{ plan: 'premium' | 'pro', price: string }>();
    const { refreshSnapshot } = useMonetization();
    const { showAlert } = useAlert();

    const [method, setMethod] = useState<PaymentMethod>('mtn');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handlePay = async () => {
        if ((method === 'mtn' || method === 'orange') && !phoneNumber) {
            showAlert(i18n.t('common.error'), i18n.t('premium.checkout.phoneNumber'), [], 'error');
            return;
        }

        setIsProcessing(true);
        try {
            // Use paymentService instead of direct API call
            const { authorization_url } = await paymentService.initialize(plan!);

            // Open Notch Pay checkout in browser
            const result = await WebBrowser.openBrowserAsync(authorization_url);

            // After browser closes, refresh subscription snapshot
            if (result.type === 'cancel' || result.type === 'dismiss') {
                // User closed the browser, check if payment was completed
                await refreshSnapshot();
                setIsSuccess(true);

                setTimeout(() => {
                    router.dismissAll();
                    router.replace('/(tabs)/account');
                }, 2000);
            }
        } catch (error: any) {
            console.error('Payment initialization failed:', error);
            const errorMsg = error.response?.data?.message || i18n.t('premium.checkout.error');
            showAlert(i18n.t('common.error'), errorMsg, [], 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    if (isSuccess) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.successContainer}>
                    <CheckCircle2 size={80} color={colors.success} />
                    <Text style={styles.successTitle}>{i18n.t('premium.checkout.success')}</Text>
                    <Text style={styles.successSubtitle}>{i18n.t('premium.checkout.successSubtitle', { plan: i18n.t(`premium.${plan}`) })}</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{
                headerShown: true,
                title: i18n.t('premium.checkout.title'),
                headerTransparent: true,
                headerTintColor: '#FFF',
                headerLeft: () => (
                    <TouchableOpacity onPress={() => router.back()}>
                        <ArrowLeft color="#FFF" />
                    </TouchableOpacity>
                )
            }} />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>{i18n.t('premium.checkout.plan')}</Text>
                    <Text style={styles.summaryValue}>{i18n.t(`premium.${plan}`)}</Text>
                    <View style={styles.summaryDivider} />
                    <Text style={styles.summaryLabel}>{i18n.t('premium.checkout.amount')}</Text>
                    <Text style={styles.summaryAmount}>{price}</Text>
                </View>

                <Text style={styles.sectionTitle}>{i18n.t('premium.checkout.selectPayment')}</Text>

                <View style={styles.methodGrid}>
                    <TouchableOpacity
                        style={[styles.methodItem, method === 'mtn' && styles.activeMethod]}
                        onPress={() => setMethod('mtn')}
                    >
                        <MobilePhone size={32} color={method === 'mtn' ? colors.primary : '#rgba(255,255,255,0.4)'} />
                        <Text style={[styles.methodText, method === 'mtn' && styles.activeMethodText]}>MTN Money</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.methodItem, method === 'orange' && styles.activeMethod]}
                        onPress={() => setMethod('orange')}
                    >
                        <Smartphone size={32} color={method === 'orange' ? '#FF6600' : '#rgba(255,255,255,0.4)'} />
                        <Text style={[styles.methodText, method === 'orange' && styles.activeMethodText]}>Orange Money</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.methodItem, method === 'bank' && styles.activeMethod]}
                        onPress={() => setMethod('bank')}
                    >
                        <Landmark size={32} color={method === 'bank' ? '#4CAF50' : '#rgba(255,255,255,0.4)'} />
                        <Text style={[styles.methodText, method === 'bank' && styles.activeMethodText]}>{i18n.t('premium.checkout.bankTransfer')}</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.instructionsCard}>
                    {method === 'bank' ? (
                        <View>
                            <Text style={styles.instrTitle}>{i18n.t('premium.checkout.bankInstructions')}</Text>
                            <View style={styles.bankDetail}>
                                <Text style={styles.bankLabel}>{i18n.t('premium.checkout.bankName')}</Text>
                                <Text style={styles.bankValue}>{i18n.t('premium.checkout.bankNameValue')}</Text>
                            </View>
                            <View style={styles.bankDetail}>
                                <Text style={styles.bankLabel}>{i18n.t('premium.checkout.accountNumber')}</Text>
                                <Text style={styles.bankValue}>{i18n.t('premium.checkout.accountNumberValue')}</Text>
                            </View>
                            <View style={styles.bankDetail}>
                                <Text style={styles.bankLabel}>{i18n.t('premium.checkout.accountHolder')}</Text>
                                <Text style={styles.bankValue}>{i18n.t('premium.checkout.accountHolderValue')}</Text>
                            </View>
                        </View>
                    ) : (
                        <View>
                            <Text style={styles.instrTitle}>{i18n.t('premium.checkout.mobileInstructions')}</Text>
                            <TextInput
                                style={styles.input}
                                placeholder={i18n.t('premium.checkout.phoneNumberPlaceholder')}
                                placeholderTextColor="rgba(255,255,255,0.3)"
                                keyboardType="phone-pad"
                                value={phoneNumber}
                                onChangeText={setPhoneNumber}
                            />
                        </View>
                    )}
                </View>

                <TouchableOpacity
                    style={[styles.payBtn, isProcessing && styles.payBtnDisabled]}
                    onPress={handlePay}
                    disabled={isProcessing}
                >
                    {isProcessing ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.payBtnText}>{i18n.t('premium.checkout.payNow')}</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    scrollContent: {
        padding: 20,
        paddingTop: 100,
    },
    summaryCard: {
        backgroundColor: '#1a1a2e',
        borderRadius: 20,
        padding: 20,
        marginBottom: 30,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    summaryLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.5)',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    summaryValue: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFF',
    },
    summaryDivider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginVertical: 12,
    },
    summaryAmount: {
        fontSize: 28,
        fontWeight: '800',
        color: colors.primary,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFF',
        marginBottom: 16,
    },
    methodGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 30,
    },
    methodItem: {
        flex: 1,
        backgroundColor: '#111',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    activeMethod: {
        borderColor: colors.primary,
        backgroundColor: 'rgba(255, 61, 113, 0.05)',
    },
    methodText: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.4)',
        marginTop: 8,
        textAlign: 'center',
    },
    activeMethodText: {
        color: '#FFF',
        fontWeight: '600',
    },
    instructionsCard: {
        backgroundColor: '#0a0a0a',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        marginBottom: 40,
    },
    instrTitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
        marginBottom: 16,
    },
    bankDetail: {
        marginBottom: 12,
    },
    bankLabel: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.3)',
        textTransform: 'uppercase',
    },
    bankValue: {
        fontSize: 15,
        color: '#FFF',
        fontWeight: '600',
    },
    input: {
        backgroundColor: '#1a1a2e',
        borderRadius: 12,
        padding: 16,
        color: '#FFF',
        fontSize: 18,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    payBtn: {
        backgroundColor: colors.primary,
        borderRadius: 16,
        paddingVertical: 18,
        alignItems: 'center',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    payBtnDisabled: {
        opacity: 0.7,
    },
    payBtnText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '700',
    },
    successContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#FFF',
        marginTop: 24,
        textAlign: 'center',
    },
    successSubtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.6)',
        marginTop: 8,
        textAlign: 'center',
    }
});

export default PaymentScreen;
