import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps } from 'react-native';
import { colors, radius, spacing } from '@/theme';

interface AppButtonProps extends PressableProps {
  label: string;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}

export function AppButton({ label, loading, variant = 'primary', disabled, style, ...props }: AppButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      style={(state) => [styles.base, styles[variant], state.pressed && styles.pressed, disabled && styles.disabled, typeof style === 'function' ? style(state) : style]}
      {...props}
    >
      {loading ? <ActivityIndicator color={variant === 'secondary' ? colors.primary : colors.surface} /> : <Text style={[styles.label, variant === 'secondary' && styles.secondaryLabel]}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { minHeight: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.md },
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.primary },
  danger: { backgroundColor: colors.danger },
  pressed: { opacity: 0.84 },
  disabled: { opacity: 0.5 },
  label: { color: colors.surface, fontSize: 16, fontWeight: '700' },
  secondaryLabel: { color: colors.primary },
});
