import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useState, type FC, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import { authClient } from '@/auth';
import { getSignInError } from '@/auth/errors';
import { startGoogleSignIn } from '@/auth/google';

import styles from './AuthCard.module.css';
import GoogleIcon from './GoogleIcon';

export type SignInFormProps = {
  initialError?: string | null;
  onSwitchToSignup: () => void;
  returnTo: string;
};

const SignInForm: FC<SignInFormProps> = ({
  initialError,
  onSwitchToSignup,
  returnTo,
}) => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError ?? null);

  const handleGoogleSignIn = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const result = await startGoogleSignIn(returnTo);
      if (result.error) {
        setError('Google sign-in could not be started. Please try again.');
        setLoading(false);
      }
    } catch {
      setError('Google sign-in could not be started. Please try again.');
      setLoading(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;

    const data = new FormData(event.currentTarget);
    const emailValue = data.get('email');
    const passwordValue = data.get('password');
    const email = (typeof emailValue === 'string' ? emailValue : '')
      .trim()
      .toLowerCase();
    const password = typeof passwordValue === 'string' ? passwordValue : '';

    setLoading(true);
    setError(null);
    try {
      const result = await authClient.signIn.email({ email, password });
      if (result.error) {
        setError(getSignInError(result.error));
        return;
      }
      void navigate(returnTo, { replace: true });
    } catch (requestError) {
      setError(getSignInError(requestError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      className={styles.form}
      onSubmit={(event) => void handleSubmit(event)}
    >
      <div className={styles.field}>
        <label className={styles.label} htmlFor="auth-signin-email">
          Email
        </label>
        <div className={styles.inputShell}>
          <Mail aria-hidden className={styles.inputIcon} />
          <input
            autoComplete="email"
            className={styles.input}
            id="auth-signin-email"
            name="email"
            placeholder="you@example.com"
            required
            type="email"
          />
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="auth-signin-password">
          Password
        </label>
        <div className={styles.inputShell}>
          <Lock aria-hidden className={styles.inputIcon} />
          <input
            autoComplete="current-password"
            className={`${styles.input} ${styles.inputWithToggle}`}
            id="auth-signin-password"
            name="password"
            placeholder="Enter your password"
            required
            type={showPassword ? 'text' : 'password'}
          />
          <button
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className={styles.togglePassword}
            onClick={() => setShowPassword((prev) => !prev)}
            type="button"
          >
            {showPassword ? <EyeOff /> : <Eye />}
          </button>
        </div>
      </div>

      {error ? (
        <p aria-live="polite" className={styles.errorText} role="alert">
          {error}
        </p>
      ) : null}

      <button className={styles.primaryBtn} disabled={loading} type="submit">
        {loading ? 'Signing in…' : 'Sign in to my nook ♥'}
      </button>

      <div className={styles.orRow}>
        <hr className={styles.orLine} />
        <span>or</span>
        <hr className={styles.orLine} />
      </div>

      <button
        className={styles.googleBtn}
        disabled={loading}
        onClick={() => void handleGoogleSignIn()}
        type="button"
      >
        <GoogleIcon />
        Continue with Google
      </button>

      <p className={styles.footer}>
        New here?{' '}
        <button
          className={styles.footerLink}
          onClick={onSwitchToSignup}
          type="button"
        >
          Create your nook →
        </button>
      </p>
    </form>
  );
};

export default SignInForm;
