import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import { colors, spacing } from '@/core/theme';

interface Props extends Omit<PressableProps, 'children'> {
  title: string;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
}

export function Button({ title, loading, disabled, variant = 'primary', style, ...rest }: Props) {
  const isDisabled = disabled || loading;
  const primary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      disabled={isDisabled}
      style={(s) => [
        styles.base,
        primary ? styles.primary : styles.secondary,
        s.pressed && primary && { backgroundColor: colors.primaryPressed },
        isDisabled && styles.disabled,
        typeof style === 'function' ? style(s) : style,
      ]}
      {...rest}>
      {loading ? (
        <ActivityIndicator color={primary ? '#fff' : colors.primary} />
      ) : (
        <Text style={[styles.label, !primary && { color: colors.primary }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 44,
    borderRadius: 10,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.primary },
  disabled: { opacity: 0.6 },
  label: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
