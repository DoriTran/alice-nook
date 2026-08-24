import { Eye, EyeOff, Lock, Mail, UserRound } from 'lucide-react';
import { useState, type FC, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import { sleep } from '../auth.utils';
import styles from './AuthCard.module.css';
import GoogleIcon from './GoogleIcon';

export type SignUpFormProps = {
  onSwitchToSignin: () => void;
};

const SignUpForm: FC<SignUpFormProps> = ({ onSwitchToSignin }) => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runStub = () => {
    if (loading) return;
    setLoading(true);
    void sleep(700).then(() => {
      void navigate('/diary');
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const form = event.currentTarget;
    const password = new FormData(form).get('password');
    const confirm = new FormData(form).get('confirmPassword');

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    runStub();
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
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

      {error ? <p className={styles.errorText}>{error}</p> : null}

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
        onClick={runStub}
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
