import type { UniversitySummary } from '@student-rental/contracts';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { EmptyView, LoadingView } from '@/components/StateView';
import { apiRequest } from '@/lib/api';
import { colors, radius, spacing } from '@/theme';

export default function UniversitiesScreen() {
  const [query, setQuery] = useState('');
  const universities = useQuery({ queryKey: ['universities'], queryFn: () => apiRequest<{ items: UniversitySummary[] }>('/universities') });
  if (universities.isLoading) return <LoadingView label="Loading universities..." />;
  const items = (universities.data?.items ?? []).filter((item) => `${item.name} ${item.shortName} ${item.city}`.toLowerCase().includes(query.toLowerCase()));
  return <Screen>
    <View><Text style={styles.title}>Choose your university</Text><Text style={styles.subtitle}>We will show active rental units inside its configured search area.</Text></View>
    <TextInput value={query} onChangeText={setQuery} placeholder="Search university, abbreviation or city" placeholderTextColor={colors.muted} style={styles.search} autoFocus />
    {items.length ? items.map((university) => <Pressable key={university.id} style={({ pressed }) => [styles.card, pressed && { opacity: 0.8 }]} onPress={() => router.push(`/results/${university.id}?name=${encodeURIComponent(university.shortName)}`)}>
      <View style={styles.logo}><Text style={styles.logoText}>{university.shortName.slice(0, 3)}</Text></View><View style={{ flex: 1 }}><Text style={styles.name}>{university.name}</Text><Text style={styles.meta}>{university.city} · search within {university.defaultRadiusKm} km</Text></View><Text style={styles.arrow}>›</Text>
    </Pressable>) : <EmptyView title="No university found" message="Try the full name, abbreviation or city." />}
  </Screen>;
}
const styles = StyleSheet.create({ title: { fontSize: 29, color: colors.ink, fontWeight: '900' }, subtitle: { color: colors.muted, marginTop: spacing.sm, lineHeight: 21 }, search: { height: 50, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: spacing.md, color: colors.ink }, card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border }, logo: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: '#E3F1E8', justifyContent: 'center', alignItems: 'center' }, logoText: { color: colors.primary, fontWeight: '900' }, name: { color: colors.ink, fontWeight: '800', fontSize: 16 }, meta: { color: colors.muted, marginTop: 4 }, arrow: { color: colors.primary, fontSize: 30 } });

