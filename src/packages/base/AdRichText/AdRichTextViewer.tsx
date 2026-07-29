import { EditorContent } from '@tiptap/react';
import type { FC } from 'react';

import { useAdRichTextEditor } from './AdRichTextEngine';
import styles from './AdRichText.module.css';
import type { RichTextContent } from './types';

export type AdRichTextViewerProps = {
  value: RichTextContent;
  className?: string;
};

const AdRichTextViewer: FC<AdRichTextViewerProps> = ({ value, className }) => {
  const editor = useAdRichTextEditor({
    content: value.json,
    editable: false,
  });

  const rootClass = [styles.viewer, className ?? ''].filter(Boolean).join(' ');

  return (
    <div className={rootClass}>
      <EditorContent editor={editor} />
    </div>
  );
};

export default AdRichTextViewer;
