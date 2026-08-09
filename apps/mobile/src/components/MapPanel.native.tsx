import type { RentalUnitSummary } from '@student-rental/contracts';
import MapView, { Marker } from 'react-native-maps';
import { StyleSheet, Text, View } from 'react-native';
import { formatMoney } from '@/lib/format';
import { colors, radius } from '@/theme';

export function MapPanel({ units, onSelect }: { units: RentalUnitSummary[]; onSelect: (unit: RentalUnitSummary) => void }) {
  const first = units[0]?.publicLocation ?? { latitude: 3.866, longitude: 11.516 };
  return <MapView style={styles.map} initialRegion={{ ...first, latitudeDelta: 0.06, longitudeDelta: 0.06 }}>
    {units.map((unit) => <Marker key={unit.id} coordinate={unit.publicLocation} onPress={() => onSelect(unit)}><View style={styles.marker}><Text style={styles.markerText}>{Math.round(unit.monthlyRent / 1000)}K</Text></View></Marker>)}
  </MapView>;
}
const styles = StyleSheet.create({ map: { flex: 1, minHeight: 420, borderRadius: radius.lg }, marker: { backgroundColor: colors.primary, borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 6, borderWidth: 2, borderColor: colors.surface }, markerText: { color: colors.surface, fontWeight: '900' } });

