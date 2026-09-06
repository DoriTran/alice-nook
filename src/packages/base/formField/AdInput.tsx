import clsx from 'clsx';
import { Eye, EyeOff } from 'lucide-react';
import {
  forwardRef,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';

import AdIcon from '../AdIcon/AdIcon';
import styles from './formField.module.css';

export type AdInputClassNames = {
  root?: string;
  input?: string;
  suffix?: string;
  passwordToggle?: string;
};

export type AdInputProps = InputHTMLAttributes<HTMLInputElement> & {
  suffix?: ReactNode;
  classNames?: AdInputClassNames;
};

/** Theme-aware text input. Use for all new form fields. */
const AdInput = forwardRef<HTMLInputElement, AdInputProps>(
  (
    { className, classNames, disabled, suffix, type = 'text', ...props },
    ref,
  ) => {
    const [passwordVisible, setPasswordVisible] = useState(false);
    const isPassword = type === 'password';
    const usesShell = suffix !== undefined || isPassword;

    if (!usesShell) {
      return (
        <input
          ref={ref}
          type={type}
          disabled={disabled}
          className={clsx(styles.control, className, classNames?.input)}
          {...props}
        />
      );
    }

    return (
      <div
        className={clsx(styles.inputShell, classNames?.root)}
        data-disabled={disabled || undefined}
      >
        <input
          ref={ref}
          type={isPassword && passwordVisible ? 'text' : type}
          disabled={disabled}
          className={clsx(styles.inputElement, className, classNames?.input)}
          {...props}
        />

        {suffix !== undefined ? (
          <span className={clsx(styles.inputSuffix, classNames?.suffix)}>
            {suffix}
          </span>
        ) : null}

        {isPassword ? (
          <button
            type="button"
            className={clsx(styles.passwordToggle, classNames?.passwordToggle)}
            aria-label={passwordVisible ? 'Hide password' : 'Show password'}
            aria-pressed={passwordVisible}
            disabled={disabled}
            onClick={() => setPasswordVisible((visible) => !visible)}
          >
            <AdIcon
              icon={passwordVisible ? EyeOff : Eye}
              source="lucide"
              size={16}
            />
          </button>
        ) : null}
      </div>
    );
  },
);

AdInput.displayName = 'AdInput';

export default AdInput;
