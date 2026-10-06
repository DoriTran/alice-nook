import type { MouseEvent } from 'react';

import { NodeSelection } from '@tiptap/pm/state';
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { MessageSquare, MessagesSquare } from 'lucide-react';

import AdIcon from '@/packages/base/AdIcon/AdIcon';

import styles from './ContentReferenceNodeView.module.css';
import { useContentTagRuntime } from './ContentTagRuntime';

const ContentReferenceNodeView = ({ editor, getPos, node }: NodeViewProps) => {
  const { references, navigateReference } = useContentTagRuntime();
  const targetType =
    node.attrs.targetType === 'message' ? 'message' : 'chatbox';
  const targetId =
    typeof node.attrs.targetId === 'string' ? node.attrs.targetId : '';
  const fallback =
    typeof node.attrs.fallbackLabel === 'string'
      ? node.attrs.fallbackLabel
      : '';
  const live = references[targetType][targetId];
  const label = live?.label ?? fallback;
  const activate = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (editor.isEditable) {
      const pos = getPos();
      if (typeof pos === 'number')
        editor.view.dispatch(
          editor.state.tr.setSelection(
            NodeSelection.create(editor.state.doc, pos),
          ),
        );
      editor.commands.focus();
    } else if (live) navigateReference(targetType, targetId, live.chatboxId);
  };
  return (
    <NodeViewWrapper
      as="span"
      className={styles.root}
      data-content-reference=""
    >
      <button
        type="button"
        className={styles.chip}
        data-unavailable={!live || undefined}
        onMouseDown={(event) => event.preventDefault()}
        onClick={activate}
        aria-label={`${targetType === 'message' ? 'Message' : 'Chatbox'} reference: ${label}${live ? '' : ' (unavailable)'}`}
      >
        <AdIcon
          icon={targetType === 'message' ? MessageSquare : MessagesSquare}
          source="lucide"
          size={12}
        />
        <span>@{label}</span>
      </button>
    </NodeViewWrapper>
  );
};
export default ContentReferenceNodeView;
