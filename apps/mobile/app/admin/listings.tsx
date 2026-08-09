import type { PropertyDetails } from '@student-rental/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '@/components/AppButton';
import { Badge } from '@/components/Badge';
import { Screen } from '@/components/Screen';
import { EmptyView, LoadingView } from '@/components/StateView';
import { apiRequest, jsonBody } from '@/lib/api';
import { formatMoney, titleCase } from '@/lib/format';
import { colors, radius, spacing } from '@/theme';

export default function AdminListings() {
  const client = useQueryClient();
  const listings = useQuery({ queryKey: ['admin-listings'], queryFn: () => apiRequest<{ items: PropertyDetails[] }>('/admin/properties', {}, true) });
  const refresh = () => { void client.invalidateQueries({ queryKey: ['admin-listings'] }); void client.invalidateQueries({ queryKey: ['admin-stats'] }); };
  const review = useMutation({ mutationFn: ({ id, decision }: { id: string; decision: string }) => apiRequest(`/admin/properties/${id}/review`, { method: 'PATCH', ...jsonBody({ decision }) }, true), onSuccess: refresh, onError: (error) => Alert.alert('Review failed', error instanceof Error ? error.message : 'Try again.') });
  const verify = useMutation({ mutationFn: (id: string) => apiRequest(`/admin/properties/${id}/verify`, { method: 'PATCH', ...jsonBody({ verificationStatus: 'PROPERTY_VERIFIED' }) }, true), onSuccess: refresh });
  if (listings.isLoading) return <LoadingView />;
  const items = listings.data?.items ?? [];
  return <Screen><Text style={styles.title}>Listing moderation</Text>{items.length ? items.map((item) => <View key={item.id} style={styles.card}>
    <View style={styles.row}><Text style={styles.name}>{item.name}</Text><Badge label={titleCase(item.status)} /></View>
    <Text style={styles.meta}>{item.ownerName} · {titleCase(item.source)} · {item.neighbourhood}</Text>
    <Text style={styles.meta}>{item.images.length} photos · {item.units.length} units · {item.units[0] ? formatMoney(item.units[0].monthlyRent) : 'no price'}</Text>
    <View style={styles.actions}>
      {item.status !== 'ACTIVE' ? <AppButton label="Approve" onPress={() => review.mutate({ id: item.id, decision: 'APPROVE' })} /> : <AppButton label="Suspend / hide" variant="danger" onPress={() => review.mutate({ id: item.id, decision: 'SUSPEND' })} />}
      <AppButton label="Verify property" variant="secondary" onPress={() => verify.mutate(item.id)} />
      <AppButton label="Edit listing details" variant="secondary" onPress={() => router.push(`/owner/property-form?id=${item.id}`)} />
      {item.status !== 'ACTIVE' ? <><AppButton label="Needs changes" variant="secondary" onPress={() => review.mutate({ id: item.id, decision: 'NEEDS_CHANGES' })} /><AppButton label="Reject" variant="danger" onPress={() => review.mutate({ id: item.id, decision: 'REJECT' })} /></> : null}
    </View>
  </View>) : <EmptyView title="No listings" message="Listings will appear here as supply is added." />}</Screen>;
}

const styles = StyleSheet.create({ title: { color: colors.ink, fontSize: 28, fontWeight: '900' }, card: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: spacing.sm }, row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm }, name: { color: colors.ink, fontWeight: '900', fontSize: 18, flex: 1 }, meta: { color: colors.muted }, actions: { gap: spacing.sm, marginTop: spacing.sm } });

