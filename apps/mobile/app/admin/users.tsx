import type { PublicUser } from '@student-rental/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '@/components/AppButton';
import { Badge } from '@/components/Badge';
import { Screen } from '@/components/Screen';
import { LoadingView } from '@/components/StateView';
import { apiRequest, jsonBody } from '@/lib/api';
import { titleCase } from '@/lib/format';
import { useSession } from '@/store/session';
import { colors, radius, spacing } from '@/theme';

export default function AdminUsers() { const me = useSession((state) => state.user); const client = useQueryClient(); const users = useQuery({ queryKey: ['admin-users'], queryFn: () => apiRequest<{ items: PublicUser[] }>('/admin/users', {}, true) }); const suspension = useMutation({ mutationFn: (user: PublicUser) => apiRequest(`/admin/users/${user.id}/suspension`, { method: 'PATCH', ...jsonBody({ suspended: !user.suspendedAt }) }, true), onSuccess: () => void client.invalidateQueries({ queryKey: ['admin-users'] }), onError: (error) => Alert.alert('Action failed', error instanceof Error ? error.message : 'Try again.') }); if (users.isLoading) return <LoadingView />; return <Screen><Text style={styles.title}>Users</Text>{users.data?.items.map((user) => <View key={user.id} style={styles.card}><View style={{ flex: 1 }}><Text style={styles.name}>{user.firstName} {user.lastName}</Text><Text style={styles.meta}>{user.email ?? user.phone}</Text><Badge label={titleCase(user.role)} color={user.suspendedAt ? colors.danger : colors.primary} /></View>{user.id !== me?.id ? <AppButton label={user.suspendedAt ? 'Restore' : 'Suspend'} variant={user.suspendedAt ? 'secondary' : 'danger'} onPress={() => suspension.mutate(user)} /> : null}</View>)}</Screen>; }
const styles = StyleSheet.create({ title: { color: colors.ink, fontSize: 28, fontWeight: '900' }, card: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md }, name: { color: colors.ink, fontWeight: '900' }, meta: { color: colors.muted, marginVertical: 4 } });

