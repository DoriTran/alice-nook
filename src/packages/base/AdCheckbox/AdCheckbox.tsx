import type { FC } from 'react';

import { Checkbox, type CheckboxProps } from '@mantine/core';

import styles from './AdCheckbox.module.css';

export type AdCheckboxProps = CheckboxProps;

type CheckboxVarsResult = {
  root?: Record<string, string>;
  [key: string]: Record<string, string> | undefined;
};

const AdCheckbox: FC<AdCheckboxProps> = ({
  classNames,
  size = 'sm',
  radius = 'sm',
  variant = 'filled',
  vars,
  ...props
}) => {
  return (
    <Checkbox
      size={size}
      radius={radius}
      variant={variant}
      vars={(theme, checkboxProps, ctx) => {
        const base: CheckboxVarsResult = {
          root: {
            '--checkbox-color': 'var(--primary)',
            '--checkbox-icon-color':
              checkboxProps.variant === 'outline'
                ? 'var(--primary)'
                : 'var(--surface)',
          },
        };

        if (typeof vars === 'function') {
          const extra = vars(theme, checkboxProps, ctx) as
            | CheckboxVarsResult
            | undefined;
          return {
            ...base,
            ...extra,
            root: { ...base.root, ...extra?.root },
          };
        }

        const staticVars = (vars ?? undefined) as
          | CheckboxVarsResult
          | undefined;

        return {
          ...base,
          ...staticVars,
          root: { ...base.root, ...staticVars?.root },
        };
      }}
      classNames={{
        root: styles.root,
        body: styles.body,
        inner: styles.inner,
        input: styles.input,
        icon: styles.icon,
        labelWrapper: styles.labelWrapper,
        label: styles.label,
        description: styles.description,
        error: styles.error,
        ...classNames,
      }}
      {...props}
    />
  );
};

export default AdCheckbox;
