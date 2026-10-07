import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/core/theme';

export function Banner({ message }: { message: string }) {
  return (
    <View style={styles.banner} accessibilityRole="alert">
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.warningBg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  text: { color: colors.warningText, fontSize: 13, textAlign: 'center' },
});
