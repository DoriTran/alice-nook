import { faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';
import { forwardRef } from 'react';

import type { EnterKeyBehavior } from '@/store/settings/type';

import {
  AdIcon,
  AdRichText,
  type RichTextContent,
} from '@/packages/base';

import type { ComposerEditorRef } from '../../input/composer.types';

import styles from './TextEditor.module.css';

export type TextEditorProps = {
  value: RichTextContent;
  placeholder?: string;
  onChange: (value: RichTextContent) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  /** Called when Enter (or Shift+Enter) should send, per enterKeyBehavior. */
  onSubmit?: () => void;
  enterKeyBehavior?: EnterKeyBehavior;
  showAiIcon?: boolean;
  /** Kept for API compatibility; growth is CSS-driven on AdRichText. */
  rows?: number;
  /** Auto-grow height up to this many lines. */
  maxRows?: number;
};

const TextEditor = forwardRef<ComposerEditorRef, TextEditorProps>(
  (
    {
      value,
      placeholder = 'Write something...',
      onChange,
      onFocus,
      onBlur,
      onSubmit,
      enterKeyBehavior = 'enter-sends',
      showAiIcon = false,
      maxRows,
    },
    ref,
  ) => {
    return (
      <div className={showAiIcon ? styles.aiWrap : styles.root}>
        <AdRichText
          ref={ref}
          value={value}
          placeholder={placeholder}
          grow={maxRows != null}
          className={showAiIcon ? styles.inputAi : undefined}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          onSubmit={onSubmit}
          enterSubmits={enterKeyBehavior === 'enter-sends'}
        />
        {showAiIcon ? (
          <span className={styles.aiIcon} aria-hidden>
            <AdIcon icon={faWandMagicSparkles} size={12} />
          </span>
        ) : null}
      </div>
    );
  },
);

TextEditor.displayName = 'TextEditor';

export default TextEditor;
