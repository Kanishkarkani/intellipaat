import { router, Stack } from 'expo-router';
import { useCallback } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Banner } from '@/components/Banner';
import { OfflineBanner } from '@/components/OfflineBanner';
import { StateView } from '@/components/StateView';
import { userMessage } from '@/core/errors';
import { colors, spacing } from '@/core/theme';
import type { Course } from '@/domain/models';
import { useSession } from '@/features/auth/SessionProvider';
import { CourseCard } from '@/features/courses/CourseCard';
import { useCoursesViewModel } from '@/features/courses/useCoursesViewModel';

export default function DashboardScreen() {
  const { state, isRefreshing, refresh, retry } = useCoursesViewModel();
  const { signOut } = useSession();
  const insets = useSafeAreaInsets();

  const openCourse = useCallback((course: Course) => {
    router.push({ pathname: '/course/[id]', params: { id: String(course.id) } });
  }, []);

  return (
    <View style={styles.flex}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable onPress={signOut} hitSlop={8} accessibilityRole="button">
              <Text style={styles.logout}>Log out</Text>
            </Pressable>
          ),
        }}
      />
      <OfflineBanner />
      {state.status === 'loading' && <StateView loading message="Loading your courses…" />}
      {state.status === 'error' && (
        <StateView
          title="Couldn't load courses"
          message={userMessage(state.error)}
          actionTitle="Try again"
          onAction={retry}
        />
      )}
      {state.status === 'empty' && (
        <StateView
          title="No courses yet"
          message="Courses you enrol in will appear here."
          actionTitle="Refresh"
          onAction={retry}
        />
      )}
      {state.status === 'success' && (
        <>
          {state.refreshError && state.refreshError.kind !== 'offline' && (
            <Banner message="Couldn't refresh — showing saved courses." />
          )}
          <FlatList
            data={state.courses}
            keyExtractor={(c) => String(c.id)}
            renderItem={({ item }) => <CourseCard course={item} onContinue={openCourse} />}
            contentContainerStyle={[styles.list, { paddingBottom: spacing.lg + insets.bottom }]}
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} />}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg, gap: spacing.md },
  logout: { color: colors.primary, fontSize: 16 },
});
