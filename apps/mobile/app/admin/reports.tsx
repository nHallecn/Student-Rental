import type { PropertyReportSummary } from '@student-rental/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton } from '@/components/AppButton';
import { Badge } from '@/components/Badge';
import { Screen } from '@/components/Screen';
import { EmptyView, LoadingView } from '@/components/StateView';
import { apiRequest, jsonBody } from '@/lib/api';
import { titleCase } from '@/lib/format';
import { colors, radius, spacing } from '@/theme';

export default function AdminReports() { const client = useQueryClient(); const reports = useQuery({ queryKey: ['admin-reports'], queryFn: () => apiRequest<{ items: PropertyReportSummary[] }>('/admin/reports', {}, true) }); const update = useMutation({ mutationFn: ({ id, status }: { id: string; status: string }) => apiRequest(`/admin/reports/${id}`, { method: 'PATCH', ...jsonBody({ status }) }, true), onSuccess: () => { void client.invalidateQueries({ queryKey: ['admin-reports'] }); void client.invalidateQueries({ queryKey: ['admin-stats'] }); } }); if (reports.isLoading) return <LoadingView />; const open = reports.data?.items.filter((item) => item.status === 'OPEN' || item.status === 'IN_REVIEW') ?? []; return <Screen><Text style={styles.title}>Listing reports</Text>{open.length ? open.map((item) => <View key={item.id} style={styles.card}><View style={styles.row}><Text style={styles.name}>{item.propertyName}</Text><Badge label={titleCase(item.status)} color={colors.warning} /></View><Text style={styles.reason}>{titleCase(item.reason)}</Text><Text style={styles.meta}>{item.description || 'No additional description.'}</Text><View style={styles.actions}><AppButton label="Start review" variant="secondary" onPress={() => update.mutate({ id: item.id, status: 'IN_REVIEW' })} /><AppButton label="Resolve" onPress={() => update.mutate({ id: item.id, status: 'RESOLVED' })} /><AppButton label="Dismiss" variant="secondary" onPress={() => update.mutate({ id: item.id, status: 'DISMISSED' })} /></View></View>) : <EmptyView title="No open reports" message="Resolved and dismissed reports remain stored for audit." />}</Screen>; }
const styles = StyleSheet.create({ title: { color: colors.ink, fontSize: 28, fontWeight: '900' }, card: { backgroundColor: colors.surface, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, gap: spacing.sm }, row: { flexDirection: 'row', justifyContent: 'space-between' }, name: { color: colors.ink, fontWeight: '900', fontSize: 17 }, reason: { color: colors.danger, fontWeight: '800' }, meta: { color: colors.muted }, actions: { gap: spacing.sm } });

