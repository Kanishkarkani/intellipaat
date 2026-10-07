import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/core/theme';

import { Button } from './Button';

/** Full-screen placeholder for loading / empty / error states. */
export function StateView({
  title,
  message,
  loading,
  actionTitle,
  onAction,
}: {
  title?: string;
  message?: string;
  loading?: boolean;
  actionTitle?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.container}>
      {loading && <ActivityIndicator size="large" color={colors.primary} />}
      {title && <Text style={styles.title}>{title}</Text>}
      {message && <Text style={styles.message}>{message}</Text>}
      {actionTitle && onAction && <Button title={actionTitle} onPress={onAction} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  title: { fontSize: 18, fontWeight: '600', color: colors.text, textAlign: 'center' },
  message: { fontSize: 15, color: colors.textMuted, textAlign: 'center' },
});
