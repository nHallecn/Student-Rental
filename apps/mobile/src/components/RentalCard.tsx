import type { RentalUnitSummary } from '@student-rental/contracts';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { availabilityColor, formatMoney, titleCase } from '@/lib/format';
import { Badge } from './Badge';
import { colors, radius, spacing } from '@/theme';

export function RentalCard({ unit }: { unit: RentalUnitSummary }) {
  return <Pressable style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]} onPress={() => router.push(`/property/${unit.propertyId}`)}>
    <Image source={unit.thumbnailUrl} style={styles.image} contentFit="cover" recyclingKey={unit.id} transition={0} />
    <View style={styles.body}>
      <View style={styles.row}><Text style={styles.price}>{formatMoney(unit.monthlyRent)}<Text style={styles.month}> / month</Text></Text>{unit.verificationStatus === 'PROPERTY_VERIFIED' ? <Badge label="VERIFIED" /> : null}</View>
      <Text style={styles.name}>{unit.propertyName} · {unit.name}</Text>
      <Text style={styles.meta}>{unit.neighbourhood} · {unit.distanceKm.toFixed(1)} km from campus</Text>
      <View style={styles.row}><Text style={styles.source}>{titleCase(unit.source)}</Text><Badge label={titleCase(unit.availabilityStatus)} color={availabilityColor(unit.availabilityStatus)} /></View>
    </View>
  </Pressable>;
}
const styles = StyleSheet.create({ card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }, image: { width: '100%', height: 180, backgroundColor: colors.border }, body: { padding: spacing.md, gap: spacing.sm }, row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm }, price: { color: colors.primaryDark, fontSize: 18, fontWeight: '900', flexShrink: 1 }, month: { color: colors.muted, fontSize: 12, fontWeight: '500' }, name: { color: colors.ink, fontSize: 16, fontWeight: '800' }, meta: { color: colors.muted }, source: { color: colors.muted, fontWeight: '700' } });

