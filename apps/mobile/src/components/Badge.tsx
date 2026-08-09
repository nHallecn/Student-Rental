import { StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '@/theme';

export function Badge({ label, color = colors.primary }: { label: string; color?: string }) {
  return <View style={[styles.badge, { backgroundColor: `${color}18` }]}><Text style={[styles.text, { color }]}>{label}</Text></View>;
}
const styles = StyleSheet.create({ badge: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 5, borderRadius: radius.pill }, text: { fontSize: 11, fontWeight: '800' } });

