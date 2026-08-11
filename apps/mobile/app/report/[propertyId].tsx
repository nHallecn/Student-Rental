import { useMutation } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';
import type { ReportReason } from '@student-rental/contracts';
import { AppButton } from '@/components/AppButton';
import { AppTextField } from '@/components/AppTextField';
import { Screen } from '@/components/Screen';
import { apiRequest, jsonBody } from '@/lib/api';
import { titleCase } from '@/lib/format';
import { useSession } from '@/store/session';
import { colors, radius, spacing } from '@/theme';

const reasons: ReportReason[] = ['NO_LONGER_AVAILABLE', 'WRONG_PRICE', 'FALSE_LOCATION', 'FRAUD', 'UNDISCLOSED_FEE', 'DUPLICATE', 'INAPPROPRIATE', 'OTHER'];
export default function ReportScreen() { const { propertyId } = useLocalSearchParams<{ propertyId: string }>(); const user = useSession((state) => state.user); const [reason, setReason] = useState<ReportReason>('NO_LONGER_AVAILABLE'); const [description, setDescription] = useState(''); const report = useMutation({ mutationFn: () => apiRequest(`/properties/${propertyId}/report`, { method: 'POST', ...jsonBody({ reason, description }) }, Boolean(user)), onSuccess: () => { Alert.alert('Report received', 'An administrator will review it.'); router.back(); } }); return <Screen><Text style={styles.title}>Report this property</Text><Text style={styles.text}>Reports help keep availability and pricing trustworthy.</Text><View style={styles.options}>{reasons.map((item) => <Pressable key={item} style={[styles.option, reason === item && styles.active]} onPress={() => setReason(item)}><Text style={[styles.optionText, reason === item && styles.activeText]}>{titleCase(item)}</Text></Pressable>)}</View><AppTextField label="What happened? (optional)" value={description} onChangeText={setDescription} multiline numberOfLines={5} style={{ minHeight: 120, textAlignVertical: 'top', paddingTop: spacing.md }} /><AppButton label="Submit report" loading={report.isPending} onPress={() => report.mutate()} /></Screen>; }
const styles = StyleSheet.create({ title: { color: colors.ink, fontSize: 28, fontWeight: '900' }, text: { color: colors.muted, lineHeight: 21 }, options: { gap: spacing.sm }, option: { padding: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border }, active: { borderColor: colors.primary, backgroundColor: '#E3F1E8' }, optionText: { color: colors.ink, fontWeight: '700' }, activeText: { color: colors.primaryDark } });

