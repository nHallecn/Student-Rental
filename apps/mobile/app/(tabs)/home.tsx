import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton } from '@/components/AppButton';
import { Screen } from '@/components/Screen';
import { colors, radius, spacing } from '@/theme';
import { useSession } from '@/store/session';

export default function HomeTab() {
  const user = useSession((state) => state.user);
  return <Screen contentStyle={styles.content}>
    <View><Text style={styles.eyebrow}>CAMPUS HOMES CAMEROON</Text><Text style={styles.title}>{user ? `Welcome, ${user.firstName}` : 'Find your next student home.'}</Text><Text style={styles.subtitle}>See current availability, complete costs and distance before you travel.</Text></View>
    <View style={styles.hero}><Text style={styles.heroTitle}>Where do you study?</Text><Text style={styles.heroText}>Choose a university to search verified rooms, studios and apartments around campus.</Text><AppButton label="Choose a university" onPress={() => router.push('/universities')} /></View>
    {(user?.role === 'LANDLORD' || user?.role === 'AGENT') ? <AppButton label="Manage my properties" variant="secondary" onPress={() => router.push('/(tabs)/properties')} /> : null}
    {user?.role === 'ADMIN' ? <AppButton label="Open moderation dashboard" variant="secondary" onPress={() => router.push('/(tabs)/admin')} /> : null}
  </Screen>;
}
const styles = StyleSheet.create({ content: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg }, eyebrow: { color: colors.primary, fontWeight: '900', letterSpacing: 1.5, fontSize: 12 }, title: { color: colors.ink, fontWeight: '900', fontSize: 35, lineHeight: 41, marginTop: spacing.sm }, subtitle: { color: colors.muted, fontSize: 17, lineHeight: 25, marginTop: spacing.md }, hero: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md, borderWidth: 1, borderColor: colors.border, marginTop: spacing.xl }, heroTitle: { color: colors.ink, fontWeight: '900', fontSize: 22 }, heroText: { color: colors.muted, lineHeight: 22 } });

