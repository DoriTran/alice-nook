import type { NodeViewProps } from '@tiptap/react';

import { NodeViewContent, NodeViewWrapper } from '@tiptap/react';
import { Check, Copy } from 'lucide-react';
import { useRef, useState } from 'react';

import AdIcon from '../../../AdIcon/AdIcon';
import AdTooltip from '../../../AdTooltip/AdTooltip';
import { serializeContentCopyNode } from './contentCopy.utils';
import styles from './ContentCopyMarkView.module.css';

const ContentCopyNodeView = ({ node, selected }: NodeViewProps) => {
  const resetTimerRef = useRef<number | null>(null);
  const [feedback, setFeedback] = useState<'idle' | 'copied' | 'failed'>(
    'idle',
  );
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(serializeContentCopyNode(node));
      setFeedback('copied');
    } catch {
      setFeedback('failed');
    }
    if (resetTimerRef.current !== null)
      window.clearTimeout(resetTimerRef.current);
    resetTimerRef.current = window.setTimeout(() => setFeedback('idle'), 1500);
  };
  const label =
    feedback === 'copied'
      ? 'Copied'
      : feedback === 'failed'
        ? 'Could not copy'
        : 'Copy content';
  const block = node.type.name === 'contentCopyBlock';
  return (
    <NodeViewWrapper
      as={block ? 'div' : 'span'}
      className={styles.root}
      data-content-copy=""
      data-copy-block={block || undefined}
      data-selected={selected || undefined}
    >
      {block ? (
        <NodeViewContent className={styles.content} />
      ) : (
        <NodeViewContent as={'span' as never} className={styles.content} />
      )}
      <AdTooltip label={label} position="top" withArrow={false}>
        <button
          type="button"
          className={styles.action}
          contentEditable={false}
          aria-label={label}
          data-feedback={feedback}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => void copy()}
        >
          <AdIcon
            icon={feedback === 'copied' ? Check : Copy}
            source="lucide"
            size={14}
          />
        </button>
      </AdTooltip>
      <span className={styles.status} aria-live="polite">
        {feedback === 'idle' ? '' : label}
      </span>
    </NodeViewWrapper>
  );
};

export default ContentCopyNodeView;
