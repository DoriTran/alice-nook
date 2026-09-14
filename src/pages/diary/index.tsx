import { useCallback, useEffect, useRef, useState, type FC } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useSession } from '@/auth';
import { createAuthURL } from '@/auth/redirects';
import {
  useAppStore,
  useDiaryHydrated,
  useDiaryStore,
  useSettingsStore,
} from '@/store';
import { hydrateCloudDiary, useDiarySourceRuntime } from '@/store/diary/source';

import ChatboxSidebar from './ChatboxSidebar/ChatboxSidebar';
import DiaryFormModal, {
  type DiaryFormModalState,
} from './ChatboxSidebar/Create/DiaryFormModal';
import DetailPanel from './DetailPanel/DetailPanel';
import styles from './index.module.css';
import MessagePanel from './MessagePanel/MessagePanel';
import { useDiaryResponsiveMode } from './useDiaryResponsiveMode';
import { useTimerNotificationCoordinator } from './useTimerNotificationCoordinator';

const DEFAULT_CHATBOX_ID = 'cb:study';
const FOCUSABLE =
  'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

const DiaryContent: FC = () => {
  const hydrated = useDiaryHydrated();
  const diaryPage = useAppStore('diaryPage');
  const selectChatbox = useAppStore('selectChatbox');
  const messages = useDiaryStore('messages');
  const chatboxes = useDiaryStore('chatboxes');
  const orders = useDiaryStore('orders');
  const deleteChatbox = useDiaryStore('deleteChatbox');
  const updateChatbox = useDiaryStore('updateChatbox');
  const location = useLocation();
  const navigate = useNavigate();
  const responsiveMode = useDiaryResponsiveMode();
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
  const [overlayMounted, setOverlayMounted] = useState(false);
  const [overlayClosing, setOverlayClosing] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const detailSlotRef = useRef<HTMLDivElement>(null);
  const detailReturnFocusRef = useRef<HTMLElement | null>(null);
  const routeParts = location.pathname.split('/').filter(Boolean);
  const routeChatboxId = routeParts[0] === 'diary' ? routeParts[1] : undefined;
  const routeView =
    routeParts[2] === 'details' ? 'details' : routeChatboxId ? 'chat' : 'list';
  const isWide = responsiveMode === 'wide';
  const overlayRequested =
    responsiveMode === 'overlay-detail' && routeView === 'details';
  const effectiveDetailCollapsed = isWide
    ? detailPanelCollapsed
    : responsiveMode === 'overlay-detail'
      ? !overlayMounted
      : routeView !== 'details';

  useTimerNotificationCoordinator(hydrated);

  useEffect(() => {
    if (overlayRequested) {
      setOverlayMounted(true);
      setOverlayClosing(false);
      return;
    }

    if (!overlayMounted) return;
    setOverlayClosing(true);
    const timer = window.setTimeout(() => {
      setOverlayMounted(false);
      setOverlayClosing(false);
    }, 260);
    return () => window.clearTimeout(timer);
  }, [overlayMounted, overlayRequested]);

  useEffect(() => {
    if (routeView !== 'details' || responsiveMode !== 'overlay-detail') return;
    const dialog = detailSlotRef.current;
    dialog?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    const handleDialogKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && selectedChatboxId) {
        void navigate(`/diary/${selectedChatboxId}`);
        return;
      }
      if (event.key !== 'Tab' || !dialog) return;
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(FOCUSABLE),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleDialogKey);
    return () => {
      document.removeEventListener('keydown', handleDialogKey);
      detailReturnFocusRef.current?.focus();
    };
  }, [navigate, responsiveMode, routeView, selectedChatboxId]);

  useEffect(() => {
    if (!hydrated || !routeChatboxId) return;
    if (!chatboxes[routeChatboxId]) {
      void navigate('/diary', { replace: true });
      return;
    }
    if (selectedChatboxId !== routeChatboxId) selectChatbox(routeChatboxId);
  }, [
    chatboxes,
    hydrated,
    navigate,
    routeChatboxId,
    selectChatbox,
    selectedChatboxId,
  ]);

  const handleSelectChatbox = useCallback(
    (chatboxId: string | null) => {
      if (chatboxId) {
        const chatbox = chatboxes[chatboxId];
        if (chatbox && (chatbox.hasUnread || chatbox.notificationRinging)) {
          void updateChatbox(chatboxId, {
            hasUnread: false,
            notificationRinging: false,
          }).catch(() => undefined);
        }
      }
      selectChatbox(chatboxId);
      if (chatboxId) void navigate(`/diary/${chatboxId}`);
    },
    [chatboxes, navigate, selectChatbox, updateChatbox],
  );

  useEffect(() => {
    if (!hydrated || selectedChatboxId) return;
    if (chatboxes[DEFAULT_CHATBOX_ID]) selectChatbox(DEFAULT_CHATBOX_ID);
  }, [chatboxes, hydrated, selectChatbox, selectedChatboxId]);

  useEffect(() => {
    setMessageSearchQuery('');
    setTimelineSearchActive(false);
    setForceVisibleMessageIds([]);
  }, [selectedChatboxId]);

  useEffect(() => {
    if (!pendingScrollMessageId || !selectedChatboxId) return;
    const message = messages[pendingScrollMessageId];
    if (!message?.archived || message.chatboxId !== selectedChatboxId) return;
    setForceVisibleMessageIds((current) =>
      current.includes(pendingScrollMessageId)
        ? current
        : [...current, pendingScrollMessageId],
    );
  }, [messages, pendingScrollMessageId, selectedChatboxId]);

  const openChat = useCallback(() => {
    if (selectedChatboxId) void navigate(`/diary/${selectedChatboxId}`);
  }, [navigate, selectedChatboxId]);
  const openList = useCallback(() => void navigate('/diary'), [navigate]);
  const openDetails = useCallback(() => {
    if (!selectedChatboxId) return;
    if (isWide) setDetailPanelCollapsed((value) => !value);
    else {
      detailReturnFocusRef.current =
        document.activeElement as HTMLElement | null;
      void navigate(`/diary/${selectedChatboxId}/details`);
    }
  }, [isWide, navigate, selectedChatboxId]);

  const handleJumpToMessage = useCallback(
    (messageId: string) => {
      setPendingScrollMessageId(messageId);
      openChat();
      if (isWide) setDetailPanelCollapsed(false);
    },
    [isWide, openChat],
  );

  const handleFocusTimelineSearch = useCallback(() => {
    setTimelineSearchActive(true);
    openChat();
    if (isWide) setDetailPanelCollapsed(false);
    window.requestAnimationFrame(() => searchInputRef.current?.focus());
  }, [isWide, openChat]);

  const handleDeleteChatbox = useCallback(
    async (chatboxId: string) => {
      const nextId =
        orders.rootOrders.find(
          (id) => id !== chatboxId && Boolean(chatboxes[id]),
        ) ??
        Object.keys(chatboxes).find((id) => id !== chatboxId) ??
        null;
      try {
        await deleteChatbox(chatboxId);
      } catch {
        return;
      }
      if (
        nextId &&
        responsiveMode !== 'mobile' &&
        responsiveMode !== 'single-pane'
      )
        handleSelectChatbox(nextId);
      else {
        selectChatbox(nextId);
        void navigate('/diary', { replace: true });
      }
    },
    [
      chatboxes,
      deleteChatbox,
      handleSelectChatbox,
      navigate,
      orders.rootOrders,
      responsiveMode,
      selectChatbox,
    ],
  );

  return (
    <div
      className={styles.rootPage}
      data-mode={responsiveMode}
      data-view={routeView}
      data-overlay-mounted={overlayMounted || undefined}
      data-overlay-closing={overlayClosing || undefined}
    >
      <div className={styles.listSlot}>
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
      </div>
      <div className={styles.messageColumn}>
        <MessagePanel
          chatboxId={selectedChatboxId ?? ''}
          detailPanelCollapsed={effectiveDetailCollapsed}
          onToggleDetailPanel={openDetails}
          onBack={openList}
          onOpenDetails={openDetails}
          compactHeader={!isWide}
          pendingScrollMessageId={pendingScrollMessageId}
          onPendingScrollHandled={() => setPendingScrollMessageId(null)}
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
      <button
        className={styles.detailBackdrop}
        type="button"
        aria-label="Close details"
        onClick={openChat}
      />
      <div
        ref={detailSlotRef}
        className={styles.detailSlot}
        role={
          responsiveMode === 'overlay-detail' && routeView === 'details'
            ? 'dialog'
            : undefined
        }
        aria-modal={
          responsiveMode === 'overlay-detail' && routeView === 'details'
            ? true
            : undefined
        }
        aria-label={
          responsiveMode === 'overlay-detail' && routeView === 'details'
            ? 'Chatbox details'
            : undefined
        }
      >
        <DetailPanel
          chatboxId={selectedChatboxId ?? ''}
          collapsed={effectiveDetailCollapsed}
          presentation={
            responsiveMode === 'overlay-detail'
              ? 'overlay'
              : isWide
                ? 'desktop'
                : 'screen'
          }
          onBack={openChat}
          onJumpToMessage={handleJumpToMessage}
          onFocusTimelineSearch={handleFocusTimelineSearch}
          onEditChatbox={(id) =>
            setFormModal({ action: 'edit', entity: 'chatbox', id })
          }
          onDeleteChatbox={(id) => void handleDeleteChatbox(id)}
        />
      </div>
      <DiaryFormModal state={formModal} onClose={() => setFormModal(null)} />
    </div>
  );
};

const Diary: FC = () => {
  const source = useSettingsStore('diaryDataSource');
  const { data: session, isPending } = useSession();
  const { cloudStatus, error } = useDiarySourceRuntime();
  const effectiveCloudStatus = isPending ? 'loading' : cloudStatus;
  const cloudReady = source === 'local' || effectiveCloudStatus === 'ready';

  return (
    <div className={styles.sourceFrame}>
      {cloudReady ? (
        <DiaryContent />
      ) : (
        <main
          className={styles.sourceGate}
          aria-busy={effectiveCloudStatus === 'loading'}
        >
          <div className={styles.sourceGateCard}>
            <span className={styles.sourceGateEyebrow}>Cloud Diary</span>
            <h1>
              {effectiveCloudStatus === 'auth-required'
                ? 'Sign in to open your cloud'
                : effectiveCloudStatus === 'error'
                  ? 'Your cloud is taking a little nap'
                  : 'Opening your cloud…'}
            </h1>
            <p>
              {effectiveCloudStatus === 'auth-required'
                ? 'Your Local Diary is still safe on this device. Sign in, or change the active source in Settings.'
                : effectiveCloudStatus === 'error'
                  ? error ||
                    'Cloud Diary could not be loaded. Your Local Diary was not changed.'
                  : 'Fetching the Diary saved with your Alice Nook account.'}
            </p>
            <div className={styles.sourceGateActions}>
              {effectiveCloudStatus === 'auth-required' && !session ? (
                <Link
                  className={styles.sourceGatePrimary}
                  to={createAuthURL('/diary')}
                >
                  Sign in
                </Link>
              ) : null}
              {effectiveCloudStatus === 'error' ? (
                <button
                  type="button"
                  className={styles.sourceGatePrimary}
                  onClick={() => void hydrateCloudDiary()}
                >
                  Try again
                </button>
              ) : null}
            </div>
          </div>
        </main>
      )}
    </div>
  );
};

export default Diary;
