import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { ProgressBar } from '@/components/ProgressBar';
import { colors, spacing } from '@/core/theme';
import type { Course } from '@/domain/models';

interface Props {
  course: Course;
  onContinue: (course: Course) => void;
}

export const CourseCard = memo(function CourseCard({ course, onContinue }: Props) {
  const done = course.progress >= 100;
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{course.title}</Text>
      <Text style={styles.meta}>by {course.instructor}</Text>
      <View style={styles.row}>
        <Text style={styles.meta}>{course.lessons} lessons</Text>
        <Text style={styles.progressText}>{course.progress}%</Text>
      </View>
      <ProgressBar progress={course.progress} />
      <Button
        title={done ? 'Review' : course.progress === 0 ? 'Start' : 'Continue'}
        onPress={() => onContinue(course)}
        accessibilityLabel={`Continue ${course.title}`}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  title: { fontSize: 18, fontWeight: '600', color: colors.text },
  meta: { fontSize: 14, color: colors.textMuted },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressText: { fontSize: 14, fontWeight: '600', color: colors.text },
});
