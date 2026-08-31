import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useAuth } from '@/lib/authContext';
import { useGoogleSignIn } from '@/lib/googleAuth';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const { request, promptAsync, isConfigured } = useGoogleSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
    } catch (e) {
      setError('로그인에 실패했습니다. 이메일/비밀번호를 확인해주세요.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleSignIn() {
    setError(null);
    try {
      await promptAsync();
    } catch (e) {
      setError('Google 로그인에 실패했습니다.');
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Text style={styles.title}>다이어트 어시스턴트</Text>
      <Text style={styles.subtitle}>Firebase 콘솔에서 만든 계정으로 로그인해주세요.</Text>

      {isConfigured && (
        <>
          <Pressable
            style={[styles.googleButton, !request && styles.buttonDisabled]}
            onPress={handleGoogleSignIn}
            disabled={!request}>
            <Text style={styles.googleButtonText}>G  Google로 로그인</Text>
          </Pressable>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>또는</Text>
            <View style={styles.dividerLine} />
          </View>
        </>
      )}

      <TextInput
        style={styles.input}
        placeholder="이메일"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="비밀번호"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable
        style={[styles.button, submitting && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={submitting}>
        <Text style={styles.buttonText}>{submitting ? '로그인 중...' : '로그인'}</Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#6C7263',
    textAlign: 'center',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2DFCF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  error: {
    color: '#B4791A',
    fontSize: 13,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#E1611F',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  googleButton: {
    borderWidth: 1,
    borderColor: '#E2DFCF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  googleButtonText: {
    fontWeight: '700',
    fontSize: 15,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2DFCF',
  },
  dividerText: {
    fontSize: 12,
    color: '#6C7263',
  },
});
