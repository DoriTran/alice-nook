import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useState, type FC, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import { sleep } from '../auth.utils';
import styles from './AuthCard.module.css';
import GoogleIcon from './GoogleIcon';

export type SignInFormProps = {
  onSwitchToSignup: () => void;
};

const SignInForm: FC<SignInFormProps> = ({ onSwitchToSignup }) => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const runStub = () => {
    if (loading) return;
    setLoading(true);
    void sleep(700).then(() => {
      void navigate('/diary');
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    runStub();
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
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

      <div className={styles.forgotRow}>
        <button className={styles.forgotLink} type="button">
          Forgot password?
        </button>
      </div>

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
        onClick={runStub}
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
