import type { FC, RefObject } from 'react';

import type { EnterKeyBehavior } from '@/store/settings/type';

import type { RichTextContent } from '@/packages/base/AdRichText/types';

import type { ComposerEditorRef } from '../../input/composer.types';

import TextEditor from './TextEditor';

export type AIEditorProps = {
  value: RichTextContent;
  onChange: (value: RichTextContent) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onSubmit?: () => void;
  enterKeyBehavior?: EnterKeyBehavior;
  editorRef?: RefObject<ComposerEditorRef | null>;
};

const AIEditor: FC<AIEditorProps> = ({
  value,
  onChange,
  onFocus,
  onBlur,
  onSubmit,
  enterKeyBehavior,
  editorRef,
}) => {
  return (
    <TextEditor
      ref={editorRef}
      value={value}
      placeholder="Ask AI something..."
      showAiIcon
      maxRows={8}
      onChange={onChange}
      onFocus={onFocus}
      onBlur={onBlur}
      onSubmit={onSubmit}
      enterKeyBehavior={enterKeyBehavior}
    />
  );
};

export default AIEditor;
