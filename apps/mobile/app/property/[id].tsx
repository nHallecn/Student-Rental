import type { PropertyDetails, RentalUnitDetails } from '@student-rental/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Linking, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '@/components/AppButton';
import { Badge } from '@/components/Badge';
import { LocationPreview } from '@/components/LocationPreview';
import { Screen } from '@/components/Screen';
import { LoadingView } from '@/components/StateView';
import { apiRequest, jsonBody } from '@/lib/api';
import { availabilityColor, formatMoney, titleCase } from '@/lib/format';
import { useSession } from '@/store/session';
import { colors, radius, spacing } from '@/theme';

export default function PropertyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>(); const user = useSession((state) => state.user); const queryClient = useQueryClient();
  const propertyQuery = useQuery({ queryKey: ['property', id], queryFn: () => apiRequest<{ property: PropertyDetails }>(`/properties/${id}`, {}, Boolean(user)) });
  const save = useMutation({ mutationFn: (unitId: string) => apiRequest(`/favourites/${unitId}`, { method: 'POST' }, true), onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ['favourites'] }); Alert.alert('Saved', 'This rental is now in your shortlist.'); } });
  if (propertyQuery.isLoading || !propertyQuery.data) return <LoadingView label="Loading property..." />;
  const property = propertyQuery.data.property; const selected = property.units.find((unit) => unit.availabilityStatus === 'AVAILABLE') ?? property.units[0];
  const contact = async (unit: RentalUnitDetails, method: 'WHATSAPP' | 'PHONE') => { const result = await apiRequest<{ contact: { phone?: string } }>(`/units/${unit.id}/contact`, { method: 'POST', ...jsonBody({ method }) }, Boolean(user)); const phone = result.contact.phone?.replace(/\s/g, ''); if (!phone) return Alert.alert('Contact unavailable', 'The listing contact is not currently available.'); const url = method === 'WHATSAPP' ? `https://wa.me/${phone.replace('+', '')}?text=${encodeURIComponent(`Hello, I am interested in ${property.name} - ${unit.name}.`)}` : `tel:${phone}`; await Linking.openURL(url); };
  return <Screen contentStyle={{ padding: 0, paddingBottom: spacing.xl }}>
    <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.gallery}>{property.images.length ? property.images.map((image) => <Image key={image.id} source={image.imageUrl} style={styles.photo} contentFit="cover" recyclingKey={image.id} transition={0} />) : <View style={[styles.photo, styles.placeholder]}><Text style={styles.placeholderText}>Photos coming soon</Text></View>}</ScrollView>
    <View style={styles.content}>
      <View style={styles.row}><Badge label={titleCase(selected?.availabilityStatus ?? 'UNCONFIRMED')} color={availabilityColor(selected?.availabilityStatus ?? '')} />{property.verificationStatus === 'PROPERTY_VERIFIED' ? <Badge label="PROPERTY VERIFIED" /> : null}</View>
      <Text style={styles.title}>{property.name}</Text><Text style={styles.location}>{property.neighbourhood} · {property.landmark}</Text>
      {selected ? <View style={styles.priceBox}><Text style={styles.price}>{formatMoney(selected.monthlyRent)}</Text><Text style={styles.muted}>per month · {titleCase(selected.unitType)}</Text></View> : null}
      <Section title="Rental conditions">{selected ? <View style={styles.grid}><Cost label="Advance" value={`${selected.advanceMonths} months`} /><Cost label="Caution" value={formatMoney(selected.cautionAmount)} /><Cost label="Visit fee" value={formatMoney(selected.visitFee)} /><Cost label="Commission" value={formatMoney(selected.agentCommission)} /></View> : <Text>No rental unit is available.</Text>}</Section>
      <Section title="Available units">{property.units.map((unit) => <View key={unit.id} style={styles.unit}><View style={{ flex: 1 }}><Text style={styles.unitName}>{unit.name} · {titleCase(unit.unitType)}</Text><Text style={styles.muted}>{formatMoney(unit.monthlyRent)} · {titleCase(unit.availabilityStatus)}</Text></View>{unit.availabilityStatus !== 'OCCUPIED' ? <Pressable onPress={() => void contact(unit, 'WHATSAPP')}><Text style={styles.inlineAction}>Contact</Text></Pressable> : null}</View>)}</Section>
      <Section title="About"><Text style={styles.body}>{property.description || 'No description supplied.'}</Text></Section>
      <Section title="Amenities"><View style={styles.chips}>{property.amenities.map((amenity) => <Badge key={amenity.id} label={amenity.name} color={colors.primaryDark} />)}</View></Section>
      <Section title="Location"><LocationPreview latitude={property.latitude} longitude={property.longitude} /><Text style={styles.muted}>{property.locationVisibility === 'APPROXIMATE' ? 'The public marker is approximate for owner privacy.' : 'Exact location shared by the owner.'}</Text><Text style={styles.body}>{property.accessDetails}</Text></Section>
      <Section title="Listing source"><Text style={styles.body}>{titleCase(property.source)} · {property.ownerName}</Text>{selected?.lastAvailabilityConfirmedAt ? <Text style={styles.muted}>Availability confirmed {new Date(selected.lastAvailabilityConfirmedAt).toLocaleDateString()}</Text> : null}</Section>
      <View style={styles.actions}>{selected ? <><AppButton label="WhatsApp" onPress={() => void contact(selected, 'WHATSAPP')} /><AppButton label="Call" variant="secondary" onPress={() => void contact(selected, 'PHONE')} /></> : null}
        <AppButton label="Save rental" variant="secondary" onPress={() => user ? selected && save.mutate(selected.id) : router.push('/auth/sign-in')} disabled={!selected} />
        <AppButton label="Share listing" variant="secondary" onPress={() => void Share.share({ title: property.name, message: `${property.name} - ${selected ? formatMoney(selected.monthlyRent) : ''}\ncampushomes://property/${property.id}` })} />
        <Pressable onPress={() => router.push(`/report/${property.id}`)}><Text style={styles.report}>Report inaccurate or fraudulent listing</Text></Pressable>
      </View>
    </View>
  </Screen>;
}
function Section({ title, children }: React.PropsWithChildren<{ title: string }>) { return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{children}</View>; }
function Cost({ label, value }: { label: string; value: string }) { return <View style={styles.cost}><Text style={styles.muted}>{label}</Text><Text style={styles.costValue}>{value}</Text></View>; }
const styles = StyleSheet.create({ gallery: { flexGrow: 0 }, photo: { width: 390, height: 280, backgroundColor: colors.border }, placeholder: { alignItems: 'center', justifyContent: 'center' }, placeholderText: { color: colors.muted, fontWeight: '800' }, content: { padding: spacing.md, gap: spacing.md }, row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm }, title: { fontSize: 29, lineHeight: 34, color: colors.ink, fontWeight: '900' }, location: { color: colors.muted, fontSize: 16 }, priceBox: { backgroundColor: '#E3F1E8', padding: spacing.md, borderRadius: radius.md }, price: { color: colors.primaryDark, fontSize: 24, fontWeight: '900' }, muted: { color: colors.muted, lineHeight: 20 }, section: { gap: spacing.sm, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border }, sectionTitle: { color: colors.ink, fontWeight: '900', fontSize: 19 }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }, cost: { width: '48%', backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md }, costValue: { color: colors.ink, fontWeight: '800', marginTop: 4 }, unit: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border }, unitName: { color: colors.ink, fontWeight: '800' }, inlineAction: { color: colors.primary, fontWeight: '900' }, body: { color: colors.ink, lineHeight: 22 }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }, actions: { gap: spacing.sm }, report: { color: colors.danger, textAlign: 'center', padding: spacing.md, fontWeight: '700' } });

