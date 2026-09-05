import { useCallback, useEffect, useRef, useState, type FC } from 'react';

import { useAppStore, useDiaryHydrated, useDiaryStore } from '@/store';

import ChatboxSidebar from './ChatboxSidebar/ChatboxSidebar';
import DiaryFormModal, {
  type DiaryFormModalState,
} from './ChatboxSidebar/Create/DiaryFormModal';
import DetailPanel from './DetailPanel/DetailPanel';
import styles from './index.module.css';
import MessagePanel from './MessagePanel/MessagePanel';
import { useTimerNotificationCoordinator } from './useTimerNotificationCoordinator';

const DEFAULT_CHATBOX_ID = 'cb:study';

const Diary: FC = () => {
  const hydrated = useDiaryHydrated();
  const diaryPage = useAppStore('diaryPage');
  const selectChatbox = useAppStore('selectChatbox');
  const messages = useDiaryStore('messages');
  const chatboxes = useDiaryStore('chatboxes');
  const orders = useDiaryStore('orders');
  const deleteChatbox = useDiaryStore('deleteChatbox');
  const updateChatbox = useDiaryStore('updateChatbox');
  const selectedChatboxId = diaryPage.selectedChatboxId;
  const [detailPanelCollapsed, setDetailPanelCollapsed] = useState(false);
  const [formModal, setFormModal] = useState<DiaryFormModalState>(null);
  const [pendingScrollMessageId, setPendingScrollMessageId] = useState<
    string | null
  >(null);
  const [messageSearchQuery, setMessageSearchQuery] = useState('');
  const [timelineSearchActive, setTimelineSearchActive] = useState(false);
  const [forceVisibleMessageIds, setForceVisibleMessageIds] = useState<
    string[]
  >([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useTimerNotificationCoordinator(hydrated);

  const handleSelectChatbox = useCallback(
    (chatboxId: string | null) => {
      if (chatboxId) {
        const chatbox = chatboxes[chatboxId];
        if (chatbox && (chatbox.hasUnread || chatbox.notificationRinging)) {
          updateChatbox(chatboxId, {
            hasUnread: false,
            notificationRinging: false,
          });
        }
      }

      selectChatbox(chatboxId);
    },
    [chatboxes, selectChatbox, updateChatbox],
  );

  useEffect(() => {
    if (!hydrated || selectedChatboxId) {
      return;
    }

    handleSelectChatbox(DEFAULT_CHATBOX_ID);
  }, [handleSelectChatbox, hydrated, selectedChatboxId]);

  useEffect(() => {
    setMessageSearchQuery('');
    setTimelineSearchActive(false);
    setForceVisibleMessageIds([]);
  }, [selectedChatboxId]);

  // Keep archived jump targets visible for the rest of this chat session
  // (cleared only when selectedChatboxId changes above).
  useEffect(() => {
    if (!pendingScrollMessageId || !selectedChatboxId) {
      return;
    }

    const message = messages[pendingScrollMessageId];

    if (!message?.archived || message.chatboxId !== selectedChatboxId) {
      return;
    }

    setForceVisibleMessageIds((current) =>
      current.includes(pendingScrollMessageId)
        ? current
        : [...current, pendingScrollMessageId],
    );
  }, [messages, pendingScrollMessageId, selectedChatboxId]);

  const handleJumpToMessage = useCallback(
    (messageId: string) => {
      setPendingScrollMessageId(messageId);

      if (detailPanelCollapsed) {
        setDetailPanelCollapsed(false);
      }
    },
    [detailPanelCollapsed],
  );

  const handlePendingScrollHandled = useCallback(() => {
    setPendingScrollMessageId(null);
  }, []);

  const handleFocusTimelineSearch = useCallback(() => {
    setTimelineSearchActive(true);

    if (detailPanelCollapsed) {
      setDetailPanelCollapsed(false);
    }

    window.requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });
  }, [detailPanelCollapsed]);

  const handleDeleteChatbox = useCallback(
    (chatboxId: string) => {
      const nextId =
        orders.rootOrders.find(
          (id) => id !== chatboxId && Boolean(chatboxes[id]),
        ) ??
        Object.keys(chatboxes).find((id) => id !== chatboxId) ??
        null;

      deleteChatbox(chatboxId);
      handleSelectChatbox(nextId);
    },
    [chatboxes, deleteChatbox, handleSelectChatbox, orders.rootOrders],
  );

  return (
    <div className={styles.rootPage}>
      <ChatboxSidebar
        selectedId={selectedChatboxId ?? undefined}
        onSelect={handleSelectChatbox}
        onOpenCreate={(entity) => setFormModal({ action: 'create', entity })}
        onEditChatbox={(id) =>
          setFormModal({ action: 'edit', entity: 'chatbox', id })
        }
        onEditGroup={(id) =>
          setFormModal({ action: 'edit', entity: 'group', id })
        }
      />
      <div className={styles.messageColumn}>
        <MessagePanel
          chatboxId={selectedChatboxId ?? ''}
          detailPanelCollapsed={detailPanelCollapsed}
          onToggleDetailPanel={() => setDetailPanelCollapsed((value) => !value)}
          pendingScrollMessageId={pendingScrollMessageId}
          onPendingScrollHandled={handlePendingScrollHandled}
          onNavigateToChatbox={(targetChatboxId, messageId) => {
            setPendingScrollMessageId(messageId);
            handleSelectChatbox(targetChatboxId);
          }}
          messageSearchQuery={messageSearchQuery}
          timelineSearchActive={timelineSearchActive}
          searchInputRef={searchInputRef}
          onMessageSearchQueryChange={setMessageSearchQuery}
          onTimelineSearchActiveChange={setTimelineSearchActive}
          forceVisibleMessageIds={forceVisibleMessageIds}
        />
      </div>
      <DetailPanel
        chatboxId={selectedChatboxId ?? ''}
        collapsed={detailPanelCollapsed}
        onJumpToMessage={handleJumpToMessage}
        onFocusTimelineSearch={handleFocusTimelineSearch}
        onEditChatbox={(id) =>
          setFormModal({ action: 'edit', entity: 'chatbox', id })
        }
        onDeleteChatbox={handleDeleteChatbox}
      />
      <DiaryFormModal state={formModal} onClose={() => setFormModal(null)} />
    </div>
  );
};

export default Diary;
