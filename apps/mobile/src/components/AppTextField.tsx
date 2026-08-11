import { forwardRef } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { colors, radius, spacing } from '@/theme';

interface Props extends TextInputProps { label: string; error?: string; }
export const AppTextField = forwardRef<TextInput, Props>(({ label, error, style, ...props }, ref) => (
  <View style={styles.wrap}>
    <Text style={styles.label}>{label}</Text>
    <TextInput ref={ref} placeholderTextColor={colors.muted} style={[styles.input, error && styles.invalid, style]} {...props} />
    {error ? <Text style={styles.error}>{error}</Text> : null}
  </View>
));
AppTextField.displayName = 'AppTextField';

const styles = StyleSheet.create({ wrap: { gap: spacing.xs }, label: { color: colors.ink, fontSize: 14, fontWeight: '700' }, input: { minHeight: 48, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface, color: colors.ink, paddingHorizontal: spacing.md, fontSize: 16 }, invalid: { borderColor: colors.danger }, error: { color: colors.danger, fontSize: 12 } });

