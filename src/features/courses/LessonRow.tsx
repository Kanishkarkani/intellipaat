import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/core/theme';
import type { Lesson } from '@/domain/models';

interface Props {
  lesson: Lesson;
  onMarkCompleted: (lessonId: string) => void;
}

export const LessonRow = memo(function LessonRow({ lesson, onMarkCompleted }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.title} numberOfLines={2}>
        {lesson.position}. {lesson.title}
      </Text>
      {lesson.completed ? (
        <Text style={[styles.status, { color: colors.success }]}>✓ Completed</Text>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Mark ${lesson.title} as completed`}
          hitSlop={8}
          onPress={() => onMarkCompleted(lesson.id)}
          style={({ pressed }) => [styles.pending, pressed && { opacity: 0.6 }]}>
          <Text style={[styles.status, { color: colors.textMuted }]}>○ Pending</Text>
          <Text style={styles.action}>Mark done</Text>
        </Pressable>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    gap: spacing.md,
    minHeight: 56,
  },
  title: { flex: 1, fontSize: 15, color: colors.text },
  status: { fontSize: 14, fontWeight: '500' },
  pending: { alignItems: 'flex-end' },
  action: { fontSize: 12, color: colors.primary, marginTop: 2 },
});
