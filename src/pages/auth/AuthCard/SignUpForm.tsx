import { Eye, EyeOff, Lock, Mail, UserRound } from 'lucide-react';
import { useState, type FC, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import { authClient } from '@/auth';
import { getSignUpError } from '@/auth/errors';
import { startGoogleSignIn } from '@/auth/google';

import styles from './AuthCard.module.css';
import GoogleIcon from './GoogleIcon';

export type SignUpFormProps = {
  initialError?: string | null;
  onSwitchToSignin: () => void;
  returnTo: string;
};

const SignUpForm: FC<SignUpFormProps> = ({
  initialError,
  onSwitchToSignin,
  returnTo,
}) => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
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
    setError(null);

    const form = event.currentTarget;
    const data = new FormData(form);
    const nameValue = data.get('nookName');
    const emailValue = data.get('email');
    const passwordValue = data.get('password');
    const confirmValue = data.get('confirmPassword');
    const name = (typeof nameValue === 'string' ? nameValue : '').trim();
    const email = (typeof emailValue === 'string' ? emailValue : '')
      .trim()
      .toLowerCase();
    const password = typeof passwordValue === 'string' ? passwordValue : '';
    const confirm = typeof confirmValue === 'string' ? confirmValue : '';

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    if (!name) {
      setError('Please enter a name for your nook.');
      return;
    }

    setLoading(true);
    try {
      const result = await authClient.signUp.email({ name, email, password });
      if (result.error) {
        setError(getSignUpError(result.error));
        return;
      }
      void navigate(returnTo, { replace: true });
    } catch (requestError) {
      setError(getSignUpError(requestError));
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
        <label className={styles.label} htmlFor="auth-signup-name">
          Nook name
        </label>
        <div className={styles.inputShell}>
          <UserRound aria-hidden className={styles.inputIcon} />
          <input
            autoComplete="nickname"
            className={styles.input}
            id="auth-signup-name"
            name="nookName"
            placeholder="What should we call your nook?"
            required
            type="text"
          />
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="auth-signup-email">
          Email
        </label>
        <div className={styles.inputShell}>
          <Mail aria-hidden className={styles.inputIcon} />
          <input
            autoComplete="email"
            className={styles.input}
            id="auth-signup-email"
            name="email"
            placeholder="you@example.com"
            required
            type="email"
          />
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="auth-signup-password">
          Password
        </label>
        <div className={styles.inputShell}>
          <Lock aria-hidden className={styles.inputIcon} />
          <input
            autoComplete="new-password"
            className={`${styles.input} ${styles.inputWithToggle}`}
            id="auth-signup-password"
            name="password"
            placeholder="Create a password"
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

      <div className={styles.field}>
        <label className={styles.label} htmlFor="auth-signup-confirm">
          Confirm password
        </label>
        <div className={styles.inputShell}>
          <Lock aria-hidden className={styles.inputIcon} />
          <input
            autoComplete="new-password"
            className={`${styles.input} ${styles.inputWithToggle}`}
            id="auth-signup-confirm"
            name="confirmPassword"
            placeholder="Type it once more"
            required
            type={showConfirm ? 'text' : 'password'}
          />
          <button
            aria-label={
              showConfirm ? 'Hide confirm password' : 'Show confirm password'
            }
            className={styles.togglePassword}
            onClick={() => setShowConfirm((prev) => !prev)}
            type="button"
          >
            {showConfirm ? <EyeOff /> : <Eye />}
          </button>
        </div>
      </div>

      {error ? (
        <p aria-live="polite" className={styles.errorText} role="alert">
          {error}
        </p>
      ) : null}

      <button className={styles.primaryBtn} disabled={loading} type="submit">
        {loading ? 'Creating…' : 'Create my nook ✨'}
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
        Already have a nook?{' '}
        <button
          className={styles.footerLink}
          onClick={onSwitchToSignin}
          type="button"
        >
          Sign in →
        </button>
      </p>
    </form>
  );
};

export default SignUpForm;
