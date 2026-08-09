import type { AmenitySummary, Paginated, RentalUnitSummary, SortOption, UnitType } from '@student-rental/contracts';
import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppButton } from '@/components/AppButton';
import { MapPanel } from '@/components/MapPanel';
import { RentalCard } from '@/components/RentalCard';
import { Screen } from '@/components/Screen';
import { EmptyView, LoadingView } from '@/components/StateView';
import { apiRequest } from '@/lib/api';
import { titleCase } from '@/lib/format';
import { colors, radius, spacing } from '@/theme';

interface Filters { maxPrice: string; distance: string; type?: UnitType; source?: 'LANDLORD' | 'AGENT'; sort: SortOption; amenityIds: string[]; }
const defaults: Filters = { maxPrice: '', distance: '5', sort: 'RECENTLY_CONFIRMED', amenityIds: [] };

export default function ResultsScreen() {
  const { universityId, name } = useLocalSearchParams<{ universityId: string; name?: string }>();
  const [mode, setMode] = useState<'list' | 'map'>('list'); const [filtersOpen, setFiltersOpen] = useState(false); const [filters, setFilters] = useState(defaults);
  const amenities = useQuery({ queryKey: ['amenities'], queryFn: () => apiRequest<{ items: AmenitySummary[] }>('/amenities') });
  const queryString = useMemo(() => { const value = new URLSearchParams({ distance: filters.distance || '5', sort: filters.sort }); if (filters.maxPrice) value.set('maxPrice', filters.maxPrice); if (filters.type) value.set('type', filters.type); if (filters.source) value.set('source', filters.source); if (filters.amenityIds.length) value.set('amenities', filters.amenityIds.join(',')); return value.toString(); }, [filters]);
  const rentals = useQuery({ queryKey: ['rentals', universityId, queryString], queryFn: () => apiRequest<Paginated<RentalUnitSummary>>(`/universities/${universityId}/rentals?${queryString}`) });
  if (rentals.isLoading) return <LoadingView label="Finding available homes..." />;
  const units = rentals.data?.items ?? [];
  return <Screen scroll={mode === 'list'} contentStyle={mode === 'map' ? styles.mapScreen : undefined}>
    <View style={styles.header}><View><Text style={styles.eyebrow}>{name ?? 'CAMPUS'} AREA</Text><Text style={styles.title}>{rentals.data?.total ?? 0} available homes</Text></View><Pressable style={styles.filterButton} onPress={() => setFiltersOpen(true)}><Text style={styles.filterText}>Filters</Text></Pressable></View>
    <View style={styles.toggle}><Pressable style={[styles.toggleButton, mode === 'list' && styles.toggleActive]} onPress={() => setMode('list')}><Text style={[styles.toggleText, mode === 'list' && styles.toggleTextActive]}>List</Text></Pressable><Pressable style={[styles.toggleButton, mode === 'map' && styles.toggleActive]} onPress={() => setMode('map')}><Text style={[styles.toggleText, mode === 'map' && styles.toggleTextActive]}>Map</Text></Pressable></View>
    {mode === 'list' ? (units.length ? units.map((unit) => <RentalCard key={unit.id} unit={unit} />) : <EmptyView title="No matching homes" message="Increase the distance or remove a filter." actionLabel="Reset filters" onAction={() => setFilters(defaults)} />) : <MapPanel units={units} onSelect={(unit) => router.push(`/property/${unit.propertyId}`)} />}
    <Modal visible={filtersOpen} transparent animationType="slide" onRequestClose={() => setFiltersOpen(false)}><View style={styles.overlay}><View style={styles.sheet}><ScrollView contentContainerStyle={{ gap: spacing.md }}>
      <Text style={styles.sheetTitle}>Filter rentals</Text><Text style={styles.label}>Maximum monthly rent (FCFA)</Text><TextInput value={filters.maxPrice} onChangeText={(maxPrice) => setFilters({ ...filters, maxPrice })} keyboardType="number-pad" style={styles.input} placeholder="e.g. 60000" />
      <Text style={styles.label}>Distance from campus (km)</Text><View style={styles.chips}>{['1', '2', '5', '10'].map((distance) => <Chip key={distance} label={`${distance} km`} active={filters.distance === distance} onPress={() => setFilters({ ...filters, distance })} />)}</View>
      <Text style={styles.label}>Unit type</Text><View style={styles.chips}>{(['ROOM', 'MODERN_ROOM', 'STUDIO', 'APARTMENT', 'HOUSE'] as UnitType[]).map((type) => <Chip key={type} label={titleCase(type)} active={filters.type === type} onPress={() => setFilters({ ...filters, type: filters.type === type ? undefined : type })} />)}</View>
      <Text style={styles.label}>Source</Text><View style={styles.chips}>{(['LANDLORD', 'AGENT'] as const).map((source) => <Chip key={source} label={titleCase(source)} active={filters.source === source} onPress={() => setFilters({ ...filters, source: filters.source === source ? undefined : source })} />)}</View>
      <Text style={styles.label}>Amenities</Text><View style={styles.chips}>{amenities.data?.items.map((amenity) => <Chip key={amenity.id} label={amenity.name} active={filters.amenityIds.includes(amenity.id)} onPress={() => setFilters({ ...filters, amenityIds: filters.amenityIds.includes(amenity.id) ? filters.amenityIds.filter((id) => id !== amenity.id) : [...filters.amenityIds, amenity.id] })} />)}</View>
      <Text style={styles.label}>Sort by</Text><View style={styles.chips}>{(['CLOSEST', 'PRICE_LOW', 'PRICE_HIGH', 'NEWEST', 'RECENTLY_CONFIRMED'] as SortOption[]).map((sort) => <Chip key={sort} label={titleCase(sort)} active={filters.sort === sort} onPress={() => setFilters({ ...filters, sort })} />)}</View>
      <View style={{ gap: spacing.sm }}><AppButton label="Show results" onPress={() => setFiltersOpen(false)} /><AppButton label="Reset" variant="secondary" onPress={() => setFilters(defaults)} /></View>
    </ScrollView></View></View></Modal>
  </Screen>;
}
function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) { return <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}><Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text></Pressable>; }
const styles = StyleSheet.create({ mapScreen: { flex: 1 }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, eyebrow: { color: colors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 1 }, title: { color: colors.ink, fontSize: 24, fontWeight: '900', marginTop: 3 }, filterButton: { borderWidth: 1, borderColor: colors.primary, borderRadius: radius.pill, paddingHorizontal: 15, paddingVertical: 9 }, filterText: { color: colors.primary, fontWeight: '800' }, toggle: { flexDirection: 'row', backgroundColor: colors.border, padding: 3, borderRadius: radius.md }, toggleButton: { flex: 1, alignItems: 'center', padding: 10, borderRadius: radius.sm }, toggleActive: { backgroundColor: colors.surface }, toggleText: { color: colors.muted, fontWeight: '700' }, toggleTextActive: { color: colors.ink }, overlay: { flex: 1, backgroundColor: '#0008', justifyContent: 'flex-end' }, sheet: { maxHeight: '88%', backgroundColor: colors.canvas, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.lg }, sheetTitle: { color: colors.ink, fontWeight: '900', fontSize: 24 }, label: { color: colors.ink, fontWeight: '800' }, input: { height: 48, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, color: colors.ink }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }, chip: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 8 }, chipActive: { backgroundColor: colors.primary, borderColor: colors.primary }, chipText: { color: colors.ink, fontWeight: '700', fontSize: 13 }, chipTextActive: { color: colors.surface } });
