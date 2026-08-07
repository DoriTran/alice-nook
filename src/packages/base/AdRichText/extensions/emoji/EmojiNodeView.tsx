import type { FC } from 'react';

import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';

import AdEmojiGlyph from '../../../AdEmojiPicker/AdEmojiGlyph';
import styles from './EmojiNodeView.module.css';

const EmojiNodeView: FC<NodeViewProps> = ({ node }) => {
  const value = String(node.attrs.value ?? '');

  return (
    <NodeViewWrapper as="span" className={styles.wrap} data-emoji={value}>
      <AdEmojiGlyph value={value} imgClassName={styles.glyph} />
    </NodeViewWrapper>
  );
};

export default EmojiNodeView;
