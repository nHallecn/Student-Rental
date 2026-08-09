import type { UniversitySummary } from '@student-rental/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '@/components/AppButton';
import { Badge } from '@/components/Badge';
import { Screen } from '@/components/Screen';
import { LoadingView } from '@/components/StateView';
import { apiRequest, jsonBody } from '@/lib/api';
import { colors, radius, spacing } from '@/theme';

export default function AdminUniversities() { const client = useQueryClient(); const universities = useQuery({ queryKey: ['admin-universities'], queryFn: () => apiRequest<{ items: UniversitySummary[] }>('/admin/universities', {}, true) }); const toggle = useMutation({ mutationFn: (item: UniversitySummary) => apiRequest(`/admin/universities/${item.id}`, { method: 'PATCH', ...jsonBody({ active: !item.active }) }, true), onSuccess: () => void client.invalidateQueries({ queryKey: ['admin-universities'] }) }); if (universities.isLoading) return <LoadingView />; return <Screen><View style={styles.header}><Text style={styles.title}>Universities</Text><AppButton label="Add" onPress={() => router.push('/admin/university-form')} /></View>{universities.data?.items.map((item) => <View key={item.id} style={styles.card}><Pressable style={{ flex: 1 }} onPress={() => router.push(`/admin/university-form?id=${item.id}`)}><Text style={styles.name}>{item.name}</Text><Text style={styles.meta}>{item.shortName} · {item.city} · {item.defaultRadiusKm} km</Text></Pressable><Pressable onPress={() => toggle.mutate(item)}><Badge label={item.active ? 'ACTIVE' : 'DISABLED'} color={item.active ? colors.success : colors.danger} /></Pressable></View>)}</Screen>; }
const styles = StyleSheet.create({ header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, title: { color: colors.ink, fontSize: 28, fontWeight: '900' }, card: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md }, name: { color: colors.ink, fontWeight: '900' }, meta: { color: colors.muted, marginTop: 4 } });

