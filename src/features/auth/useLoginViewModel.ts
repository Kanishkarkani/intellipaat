import { useState } from 'react';

import { toAppError, userMessage } from '@/core/errors';
import { validateLogin, type LoginFieldErrors } from '@/domain/validation';

import { useSession } from './SessionProvider';

export function useLoginViewModel() {
  const { signIn } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onEmailChange = (value: string) => {
    setEmail(value);
    setFieldErrors((e) => ({ ...e, email: undefined }));
    setSubmitError(null);
  };

  const onPasswordChange = (value: string) => {
    setPassword(value);
    setFieldErrors((e) => ({ ...e, password: undefined }));
    setSubmitError(null);
  };

  const submit = async () => {
    if (isSubmitting) return;
    const errors = validateLogin(email, password);
    setFieldErrors(errors);
    if (errors.email || errors.password) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      // Navigation happens declaratively: the protected route guard flips once the session is set.
      await signIn(email, password);
    } catch (e) {
      setSubmitError(userMessage(toAppError(e)));
      setIsSubmitting(false);
    }
  };

  return {
    email,
    password,
    fieldErrors,
    submitError,
    isSubmitting,
    onEmailChange,
    onPasswordChange,
    submit,
  };
}
