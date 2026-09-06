import { useEffect, type FC, type RefObject } from 'react';

import { AdConfirmDialog } from '@/packages/base';
import LayoutCard from '@/packages/ui/LayoutCard/LayoutCard';

import { useMessageActions } from './.hooks/useMessageActions';
import { useMessageScroll } from './.hooks/useMessageScroll';
import DiaryInput from './DiaryInput';
import Header from './Header/Header';
import { useMessageHeaderData } from './Header/useMessageHeaderData';
import MessageFeed from './MessageFeed/MessageFeed';
import ForwardModal from './MessageFeed/MessageRow/HoverActions/ForwardModal';
import MoveModal from './MessageFeed/MessageRow/HoverActions/MoveModal';
import { useChatboxMessages } from './MessageFeed/useChatboxMessages';
import styles from './MessagePanel.module.css';

export type MessagePanelProps = {
  chatboxId: string;
  detailPanelCollapsed: boolean;
  onToggleDetailPanel: () => void;
  pendingScrollMessageId?: string | null;
  onPendingScrollHandled?: () => void;
  onNavigateToChatbox?: (chatboxId: string, messageId: string) => void;
  messageSearchQuery: string;
  timelineSearchActive: boolean;
  searchInputRef: RefObject<HTMLInputElement | null>;
  onMessageSearchQueryChange: (value: string) => void;
  onTimelineSearchActiveChange: (active: boolean) => void;
  forceVisibleMessageIds?: string[];
};

const MessagePanel: FC<MessagePanelProps> = ({
  chatboxId,
  detailPanelCollapsed,
  onToggleDetailPanel,
  pendingScrollMessageId,
  onPendingScrollHandled,
  onNavigateToChatbox,
  messageSearchQuery,
  timelineSearchActive,
  searchInputRef,
  onMessageSearchQueryChange,
  onTimelineSearchActiveChange,
  forceVisibleMessageIds = [],
}) => {
  const headerData = useMessageHeaderData(chatboxId);
  const { groups } = useChatboxMessages(chatboxId, {
    searchQuery: messageSearchQuery,
    forceVisibleMessageIds,
  });
  const scroll = useMessageScroll();
  const actions = useMessageActions({
    chatboxId,
    scroll,
    onNavigateToChatbox,
  });

  useEffect(() => {
    if (!timelineSearchActive) {
      return;
    }

    searchInputRef.current?.focus();
  }, [searchInputRef, timelineSearchActive]);

  useEffect(() => {
    if (!pendingScrollMessageId) {
      return;
    }

    const timer = window.setTimeout(() => {
      if (scroll.scrollToMessage(pendingScrollMessageId)) {
        onPendingScrollHandled?.();
      }
    }, 100);

    return () => window.clearTimeout(timer);
  }, [groups, onPendingScrollHandled, pendingScrollMessageId, scroll]);

  if (!headerData) {
    return null;
  }

  return (
    <LayoutCard tag="main" className={styles.root} aria-label={headerData.name}>
      <Header
        data={headerData}
        detailPanelCollapsed={detailPanelCollapsed}
        onToggleDetailPanel={onToggleDetailPanel}
        searchQuery={messageSearchQuery}
        searchActive={timelineSearchActive}
        searchInputRef={searchInputRef}
        onSearchQueryChange={onMessageSearchQueryChange}
        onSearchActiveChange={onTimelineSearchActiveChange}
      />
      <MessageFeed
        key={chatboxId}
        groups={groups}
        feedRef={scroll.feedRef}
        registerRef={scroll.registerRef}
        actions={actions}
      />
      <DiaryInput
        chatboxId={chatboxId}
        replyToMessageId={actions.replyToMessageId}
        onCancelReply={actions.cancelReply}
        editMessageId={actions.editTargetId}
        onCancelEdit={actions.cancelEdit}
        onDirtyChange={actions.setComposerDirty}
        onNavigateToMessage={actions.navigateToMessage}
        hasCopiedMessage={Boolean(actions.copiedMessage)}
        onClearCopiedMessage={actions.clearCopiedMessage}
        onPasteCopiedMessage={actions.pasteCopiedMessage}
      />
      <AdConfirmDialog
        opened={Boolean(actions.deleteTargetId)}
        onClose={actions.cancelDelete}
        onConfirm={actions.confirmDelete}
        title="Delete message?"
        message="This message will be permanently deleted and cannot be restored."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
      />
      <ForwardModal
        sourceMessageId={actions.forwardSourceId}
        currentChatboxId={chatboxId}
        onConfirm={actions.confirmForward}
        onClose={actions.cancelForward}
      />
      <MoveModal
        sourceMessageId={actions.moveSourceId}
        currentChatboxId={chatboxId}
        onClone={actions.confirmClone}
        onMove={actions.confirmMove}
        onClose={actions.cancelMove}
      />
    </LayoutCard>
  );
};

export default MessagePanel;
