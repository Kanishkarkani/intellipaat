import { Stack, useLocalSearchParams } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Banner } from '@/components/Banner';
import { OfflineBanner } from '@/components/OfflineBanner';
import { ProgressBar } from '@/components/ProgressBar';
import { StateView } from '@/components/StateView';
import { userMessage } from '@/core/errors';
import { colors, spacing } from '@/core/theme';
import { calculateProgress } from '@/domain/progress';
import { LessonRow } from '@/features/courses/LessonRow';
import { useCourseDetailViewModel } from '@/features/courses/useCourseDetailViewModel';

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { state, pendingSyncCount, actionError, markCompleted, retry } =
    useCourseDetailViewModel(Number(id));

  if (state.status === 'loading') return <StateView loading message="Loading lessons…" />;
  if (state.status === 'error') {
    return (
      <StateView
        title="Couldn't load this course"
        message={userMessage(state.error)}
        actionTitle="Try again"
        onAction={retry}
      />
    );
  }

  const { course, lessons } = state.detail;
  const progress = calculateProgress(lessons);
  const completed = lessons.filter((l) => l.completed).length;

  return (
    <View style={styles.flex}>
      <Stack.Screen options={{ title: course.title }} />
      <OfflineBanner />
      {pendingSyncCount > 0 && <Banner message="Progress saved on this device. It will sync when you're back online." />}
      {actionError && <Banner message={actionError} />}
      <FlatList
        data={lessons}
        keyExtractor={(l) => l.id}
        contentContainerStyle={{ paddingBottom: spacing.lg + insets.bottom }}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>{course.title}</Text>
            <Text style={styles.meta}>by {course.instructor}</Text>
            <View style={styles.progressRow}>
              <Text style={styles.meta}>
                {completed} of {lessons.length} lessons completed
              </Text>
              <Text style={styles.progress}>{progress}%</Text>
            </View>
            <ProgressBar progress={progress} />
          </View>
        }
        renderItem={({ item }) => <LessonRow lesson={item} onMarkCompleted={markCompleted} />}
        ItemSeparatorComponent={Separator}
      />
    </View>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.lg, gap: spacing.sm },
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
  meta: { fontSize: 14, color: colors.textMuted },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between' },
  progress: { fontSize: 16, fontWeight: '600', color: colors.text },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
});
