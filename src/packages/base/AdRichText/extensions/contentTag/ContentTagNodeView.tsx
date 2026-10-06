import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { type MouseEvent } from 'react';

import type { ColorId } from '@/packages/color';

import ContentTagChip from './ContentTagChip';
import styles from './ContentTagNodeView.module.css';
import { useContentTagRuntime } from './ContentTagRuntime';

const ContentTagNodeView = ({ node }: NodeViewProps) => {
  const { tags, openTagPalette, resolveTagStyle } = useContentTagRuntime();
  const attrs = node.attrs as Record<string, unknown>;
  const tagId = typeof attrs.tagId === 'string' ? attrs.tagId : '';
  const fallbackLabel = typeof attrs.label === 'string' ? attrs.label : '';
  const live = tags[tagId];
  const label = live?.label ?? fallbackLabel;
  const fallbackColorId =
    typeof attrs.colorId === 'string' ? (attrs.colorId as ColorId) : 'lavender';
  const colorId = live?.colorId ?? fallbackColorId;

  const stopSelection = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const chip = (
    <button
      type="button"
      className={styles.trigger}
      aria-label={`Change color for #${label}`}
      onMouseDown={stopSelection}
      onClick={(event) => {
        event.stopPropagation();
        if (live) openTagPalette(live.id, event.currentTarget);
      }}
    >
      <ContentTagChip label={label} style={resolveTagStyle(colorId)} />
    </button>
  );

  return (
    <NodeViewWrapper as="span" className={styles.root} data-content-tag="">
      {chip}
    </NodeViewWrapper>
  );
};

export default ContentTagNodeView;
