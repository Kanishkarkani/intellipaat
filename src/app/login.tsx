import { useEffect, useRef } from 'react';
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { colors, spacing } from '@/core/theme';
import { DEMO_PASSWORD } from '@/data/remote/mockServer';
import { useLoginViewModel } from '@/features/auth/useLoginViewModel';

export default function LoginScreen() {
  const vm = useLoginViewModel();
  const passwordRef = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);

  // Once the keyboard is up, scroll so the fields and the Log in button sit just above it.
  useEffect(() => {
    const sub = Keyboard.addListener('keyboardDidShow', () => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
    return () => sub.remove();
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        // Android is edge-to-edge, so the window no longer resizes for the keyboard; pad on both platforms.
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : spacing.lg}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}>
          <Image
            source={require('@/assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
            accessible
            accessibilityLabel="Intellipaat"
          />
          <Text style={styles.heading}>Welcome back</Text>
          <Text style={styles.subheading}>Sign in to continue learning</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, vm.fieldErrors.email && styles.inputError]}
              value={vm.email}
              onChangeText={vm.onEmailChange}
              placeholder="you@example.com"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              editable={!vm.isSubmitting}
              accessibilityLabel="Email"
            />
            {vm.fieldErrors.email && <Text style={styles.error}>{vm.fieldErrors.email}</Text>}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              ref={passwordRef}
              style={[styles.input, vm.fieldErrors.password && styles.inputError]}
              value={vm.password}
              onChangeText={vm.onPasswordChange}
              placeholder="••••••"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              autoComplete="password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={vm.submit}
              editable={!vm.isSubmitting}
              accessibilityLabel="Password"
            />
            {vm.fieldErrors.password && (
              <Text style={styles.error}>{vm.fieldErrors.password}</Text>
            )}
          </View>

          {vm.submitError && (
            <Text style={[styles.error, styles.submitError]} accessibilityRole="alert">
              {vm.submitError}
            </Text>
          )}

          <Button title="Log in" onPress={vm.submit} loading={vm.isSubmitting} />

          {/* Login is mocked; reviewers installing the APK need the demo credentials. */}
          <Text style={styles.hint}>Demo: any valid email, password “{DEMO_PASSWORD}”</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    gap: spacing.lg,
  },
  logo: { width: 112, height: 112, alignSelf: 'center' },
  heading: { fontSize: 28, fontWeight: '700', color: colors.text },
  subheading: { fontSize: 16, color: colors.textMuted, marginBottom: spacing.sm },
  field: { gap: spacing.xs },
  label: { fontSize: 15, fontWeight: '600', color: colors.text },
  input: {
    minHeight: 52,
    borderWidth: 1.5,
    borderColor: colors.inputBorder,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    fontSize: 17,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  inputError: { borderColor: colors.danger },
  error: { color: colors.danger, fontSize: 13 },
  submitError: { textAlign: 'center' },
  hint: { fontSize: 12, color: colors.textMuted, textAlign: 'center' },
});
