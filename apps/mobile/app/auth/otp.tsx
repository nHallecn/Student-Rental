import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { AppButton } from '@/components/AppButton';
import { AppTextField } from '@/components/AppTextField';
import { Screen } from '@/components/Screen';
import { apiRequest, jsonBody } from '@/lib/api';
import { useSession } from '@/store/session';
import { colors, spacing } from '@/theme';

export default function OtpScreen() { const signInWithOtp = useSession((state) => state.signInWithOtp); const [identity, setIdentity] = useState('+237670000001'); const [code, setCode] = useState(''); const [sent, setSent] = useState(false); const [loading, setLoading] = useState(false); const requestCode = async () => { try { setLoading(true); const result = await apiRequest<{ debugCode?: string }>('/auth/request-otp', { method: 'POST', ...jsonBody({ identity, purpose: 'SIGN_IN' }) }); setSent(true); if (result.debugCode) setCode(result.debugCode); } catch (error) { Alert.alert('Could not send code', error instanceof Error ? error.message : 'Try again.'); } finally { setLoading(false); } }; const verify = async () => { try { setLoading(true); const user = await signInWithOtp(identity, code); router.dismissAll(); router.replace(user.role === 'ADMIN' ? '/(tabs)/admin' : user.role === 'STUDENT' ? '/(tabs)/home' : '/(tabs)/properties'); } catch (error) { Alert.alert('Invalid code', error instanceof Error ? error.message : 'Try again.'); } finally { setLoading(false); } }; return <Screen contentStyle={styles.content}><Text style={styles.title}>One-time code</Text><Text style={styles.text}>Enter the phone number or email linked to your account. In demo mode, the code is filled automatically.</Text><AppTextField label="Phone or email" value={identity} onChangeText={setIdentity} autoCapitalize="none" />{sent ? <AppTextField label="6-digit code" value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={6} /> : null}<AppButton label={sent ? 'Verify and sign in' : 'Send code'} loading={loading} onPress={() => void (sent ? verify() : requestCode())} /></Screen>; }
const styles = StyleSheet.create({ content: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg }, title: { color: colors.ink, fontSize: 29, fontWeight: '900' }, text: { color: colors.muted, lineHeight: 22 } });

