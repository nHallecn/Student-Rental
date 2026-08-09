import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { AppButton } from './AppButton';
import { colors, spacing } from '@/theme';

export function LoadingView({ label = 'Loading...' }: { label?: string }) { return <View style={styles.wrap}><ActivityIndicator size="large" color={colors.primary} /><Text style={styles.text}>{label}</Text></View>; }
export function EmptyView({ title, message, actionLabel, onAction }: { title: string; message: string; actionLabel?: string; onAction?: () => void }) { return <View style={styles.wrap}><Text style={styles.title}>{title}</Text><Text style={styles.text}>{message}</Text>{actionLabel && onAction ? <AppButton label={actionLabel} onPress={onAction} /> : null}</View>; }
const styles = StyleSheet.create({ wrap: { flex: 1, minHeight: 240, justifyContent: 'center', alignItems: 'center', gap: spacing.md, padding: spacing.lg }, title: { color: colors.ink, fontWeight: '900', fontSize: 21, textAlign: 'center' }, text: { color: colors.muted, textAlign: 'center', lineHeight: 21 } });

