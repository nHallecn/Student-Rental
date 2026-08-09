import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme';
export function LocationPreview({ latitude, longitude }: { latitude: number; longitude: number }) { return <View style={styles.map}><Text style={styles.text}>Approximate location: {latitude.toFixed(4)}, {longitude.toFixed(4)}</Text></View>; }
const styles = StyleSheet.create({ map: { height: 160, width: '100%', backgroundColor: '#E3F1E8', alignItems: 'center', justifyContent: 'center', borderRadius: 14 }, text: { color: colors.primary, fontWeight: '800' } });

