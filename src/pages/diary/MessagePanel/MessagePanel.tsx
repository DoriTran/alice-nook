import {
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type FC,
  type RefObject,
} from 'react';

import { AdConfirmDialog } from '@/packages/base';
import LayoutCard from '@/packages/ui/LayoutCard/LayoutCard';

import { useMessageActions } from './.hooks/useMessageActions';
import { useMessageScroll } from './.hooks/useMessageScroll';
import DiaryInput, { type DiaryInputHandle } from './DiaryInput';
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
  onBack?: () => void;
  onOpenDetails?: () => void;
  compactHeader?: boolean;
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
  onBack,
  onOpenDetails,
  compactHeader = false,
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
  const diaryInputRef = useRef<DiaryInputHandle>(null);
  const fileDragDepthRef = useRef(0);
  const [fileDragActive, setFileDragActive] = useState(false);
  const headerData = useMessageHeaderData(chatboxId);
  const { groups } = useChatboxMessages(chatboxId, {
    searchQuery: messageSearchQuery,
    forceVisibleMessageIds,
  });
  const scroll = useMessageScroll(chatboxId);
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

  const hasDraggedFiles = (event: DragEvent<HTMLElement>) =>
    Array.from(event.dataTransfer.types).includes('Files');

  const handleDragEnter = (event: DragEvent<HTMLElement>) => {
    if (!hasDraggedFiles(event)) return;
    event.preventDefault();
    fileDragDepthRef.current += 1;
    setFileDragActive(true);
  };

  const handleDragOver = (event: DragEvent<HTMLElement>) => {
    if (!hasDraggedFiles(event)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  };

  const handleDragLeave = (event: DragEvent<HTMLElement>) => {
    if (!hasDraggedFiles(event)) return;
    fileDragDepthRef.current = Math.max(0, fileDragDepthRef.current - 1);
    if (fileDragDepthRef.current === 0) setFileDragActive(false);
  };

  const handleDrop = (event: DragEvent<HTMLElement>) => {
    if (!hasDraggedFiles(event)) return;
    event.preventDefault();
    fileDragDepthRef.current = 0;
    setFileDragActive(false);
    if (event.dataTransfer.files.length > 0) {
      diaryInputRef.current?.addDroppedFiles(event.dataTransfer.files);
    }
  };

  if (!headerData) {
    return null;
  }

  return (
    <LayoutCard
      tag="main"
      className={styles.root}
      aria-label={headerData.name}
      data-file-drag-active={fileDragActive || undefined}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Header
        data={headerData}
        detailPanelCollapsed={detailPanelCollapsed}
        onToggleDetailPanel={onToggleDetailPanel}
        onBack={onBack}
        onOpenDetails={onOpenDetails}
        compact={compactHeader}
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
        ref={diaryInputRef}
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
