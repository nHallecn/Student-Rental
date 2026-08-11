import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton } from '@/components/AppButton';
import { Screen } from '@/components/Screen';
import { colors, radius, spacing } from '@/theme';

export default function WelcomeScreen() {
  return (
    <Screen contentStyle={styles.container}>
      <View style={styles.mark}><Text style={styles.markText}>CH</Text></View>
      <View style={styles.copy}>
        <Text style={styles.eyebrow}>CAMPUS HOMES CAMEROON</Text>
        <Text style={styles.title}>Find a real room near your university.</Text>
        <Text style={styles.subtitle}>Compare current availability, complete rental costs, distance and verified contact details before spending money on a visit.</Text>
      </View>
      <View style={styles.actions}>
        <AppButton label="Choose my university" onPress={() => router.push('/universities')} />
        <AppButton label="I list student rentals" variant="secondary" onPress={() => router.push('/auth/sign-in')} />
      </View>
      <Text style={styles.note}>Browse freely. Sign in only when you save, publish or manage a listing.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  mark: { width: 64, height: 64, borderRadius: radius.lg, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  markText: { color: colors.surface, fontWeight: '900', fontSize: 22 },
  copy: { gap: spacing.md, marginVertical: spacing.xl },
  eyebrow: { color: colors.primary, fontWeight: '800', letterSpacing: 1.5, fontSize: 12 },
  title: { color: colors.ink, fontSize: 38, lineHeight: 44, fontWeight: '900' },
  subtitle: { color: colors.muted, fontSize: 17, lineHeight: 26 },
  actions: { gap: spacing.sm },
  note: { color: colors.muted, fontSize: 13, textAlign: 'center', marginTop: spacing.md },
});

