import { useCallback, useEffect, useState, type FC } from 'react';

import bottomLeftDecoration from '@/assets/v2/diary/detail-panel/bottom left.png';
import bottomRightDecoration from '@/assets/v2/diary/detail-panel/bottom right.png';
import LayoutCard from '@/packages/ui/LayoutCard/LayoutCard';
import { useDiaryStore } from '@/store';

import type { DetailPanelTab, MediaFilter } from '../types';

import DetailDecoration from './components/DetailDecoration';
import styles from './DetailPanel.module.css';
import Header from './Header/Header';
import MediaTab from './MediaTab/MediaTab';
import OverviewTab from './OverviewTab/OverviewTab';
import SettingsTab from './SettingsTab/SettingsTab';
import Tabs from './Tabs/Tabs';
import { useDetailPanelData } from './useDetailPanelData';

export type DetailPanelProps = {
  chatboxId: string;
  collapsed: boolean;
  onJumpToMessage: (messageId: string) => void;
  onFocusTimelineSearch: () => void;
  onEditChatbox: (chatboxId: string) => void;
  onDeleteChatbox: (chatboxId: string) => void;
};

const DetailPanel: FC<DetailPanelProps> = ({
  chatboxId,
  collapsed,
  onJumpToMessage,
  onFocusTimelineSearch,
  onEditChatbox,
  onDeleteChatbox,
}) => {
  const updateChatbox = useDiaryStore('updateChatbox');
  const data = useDetailPanelData(chatboxId);

  const [activeTab, setActiveTab] = useState<DetailPanelTab>('overview');
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>('all');

  useEffect(() => {
    setActiveTab('overview');
    setMediaFilter('all');
  }, [chatboxId]);

  const handleToggleNotification = useCallback(() => {
    if (!data.identity) {
      return;
    }

    updateChatbox(chatboxId, {
      notificationEnabled: !data.identity.notificationEnabled,
    });
  }, [chatboxId, data.identity, updateChatbox]);

  const handleOpenMedia = useCallback((filter: MediaFilter) => {
    setMediaFilter(filter);
    setActiveTab('media');
  }, []);

  if (!data.identity || !data.stats) {
    return null;
  }

  return (
    <LayoutCard
      tag="aside"
      className={styles.root}
      data-collapsed={collapsed || undefined}
      aria-label={`${data.identity.name} details`}
      aria-hidden={collapsed}
    >
      <Header
        identity={data.identity}
        onSearch={onFocusTimelineSearch}
        onEdit={() => onEditChatbox(chatboxId)}
        onToggleNotification={handleToggleNotification}
      />
      <Tabs activeTab={activeTab} onTabChange={setActiveTab} />
      <div className={styles.scroll}>
        {activeTab === 'overview' ? (
          <OverviewTab
            chatboxId={chatboxId}
            stats={data.stats}
            tags={data.tags}
            pinnedMessages={data.pinnedMessages}
            archivedMessages={data.archivedMessages}
            allMessages={data.allMessages}
            onJumpToMessage={onJumpToMessage}
            onOpenMedia={handleOpenMedia}
          />
        ) : null}
        {activeTab === 'media' ? (
          <MediaTab
            mediaItems={data.mediaItems}
            filter={mediaFilter}
            onFilterChange={setMediaFilter}
            onJumpToMessage={onJumpToMessage}
          />
        ) : null}
        {activeTab === 'settings' ? (
          <SettingsTab
            chatboxName={data.identity.name}
            onDeleteChatbox={() => onDeleteChatbox(chatboxId)}
          />
        ) : null}
      </div>
      <div className={styles.footerDecoration} aria-hidden>
        <DetailDecoration
          src={bottomLeftDecoration}
          className={styles.bottomLeftDecoration}
        />
        <DetailDecoration
          src={bottomRightDecoration}
          className={styles.bottomRightDecoration}
        />
      </div>
    </LayoutCard>
  );
};

export default DetailPanel;
