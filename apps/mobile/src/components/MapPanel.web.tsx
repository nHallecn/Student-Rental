import type { RentalUnitSummary } from '@student-rental/contracts';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@/theme';

export function MapPanel({ units }: { units: RentalUnitSummary[]; onSelect: (unit: RentalUnitSummary) => void }) {
  return <View style={styles.wrap}><Text style={styles.title}>Map view is available in the Android and iOS app.</Text><Text style={styles.text}>{units.length} matching homes are shown in the list view.</Text></View>;
}
const styles = StyleSheet.create({ wrap: { flex: 1, minHeight: 360, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, backgroundColor: colors.surface }, title: { color: colors.ink, fontWeight: '800', textAlign: 'center' }, text: { color: colors.muted, marginTop: spacing.sm } });

