import { useEffect, useRef, useState, type FC } from 'react';

import { AdDragDrop, useScrollOffset } from '@/packages/base';
import LayoutCard from '@/packages/ui/LayoutCard/LayoutCard';
import { useDiaryHydrated, useDiaryStore } from '@/store';

import type { DiaryFilterTab } from '../types';

import { chatboxListAssets } from './chatboxList.assets';
import styles from './ChatboxSidebar.module.css';
import Header from './Header/Header';
import Search from './Search/Search';
import {
  countChatboxesByFilterTab,
  hasActiveSidebarQuery,
} from './sidebarFilter.utils';
import SortableChatbox from './SortableChatbox';
import SortableGroupBlock from './SortableGroupBlock';
import { useFilteredSidebarRowViews } from './useFilteredSidebarRowViews';
import { useSidebarDnD } from './useSidebarDnD';

export type ChatboxSidebarProps = {
  selectedId?: string;
  onSelect?: (id: string) => void;
  onOpenCreate: (entity: 'chatbox' | 'group') => void;
  onEditChatbox: (id: string) => void;
  onEditGroup: (id: string) => void;
};

const ChatboxSidebar: FC<ChatboxSidebarProps> = ({
  selectedId,
  onSelect,
  onOpenCreate,
  onEditChatbox,
  onEditGroup,
}) => {
  const hydrated = useDiaryHydrated();
  const seedIfEmpty = useDiaryStore('seedIfEmpty');
  const chatboxes = useDiaryStore('chatboxes');
  const { rows, swap, add, remove } = useSidebarDnD();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<DiaryFilterTab>('all');
  const isListLocked = hasActiveSidebarQuery(searchQuery, filterTab);
  const dndEnabled = !isListLocked;
  const rowViews = useFilteredSidebarRowViews(rows, searchQuery, filterTab);
  const filterCounts = countChatboxesByFilterTab(Object.values(chatboxes));
  const scrollerRef = useRef<HTMLDivElement>(null);
  const scrollerOffset = useScrollOffset(scrollerRef);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    seedIfEmpty();
  }, [hydrated, seedIfEmpty]);

  return (
    <LayoutCard
      tag="aside"
      className={styles.root}
      aria-label="My Diary chatboxes"
    >
      <Header onOpenCreate={onOpenCreate} />

      <div className={styles.searchRow}>
        <Search
          value={searchQuery}
          onChange={setSearchQuery}
          filterTab={filterTab}
          onFilterChange={setFilterTab}
          filterCounts={filterCounts}
        />
      </div>

      <AdDragDrop
        {...(dndEnabled
          ? ({ droppable: true, sortable: true } as const)
          : ({ droppable: false } as const))}
        dropDeps={[dndEnabled]}
        group="diary-list"
        hostPreview
        autoScroll={dndEnabled}
        scrollRef={scrollerRef}
        extraScrollOffset={scrollerOffset}
        dropData={{ id: 'diary-list' }}
        onSortableChange={({ current, previous }) => {
          swap({ type: 'list' }, current, previous);
        }}
        onGroupChange={({ type, index, data }) => {
          if (type === 'enter') {
            add({ type: 'list' }, index, data);
          }
          if (type === 'leave') {
            remove({ type: 'list' }, index);
          }
        }}
      >
        <div className={styles.scroll}>
          {hydrated
            ? rowViews.map((view) =>
                view.type === 'group' ? (
                  <SortableGroupBlock
                    key={view.data.id}
                    data={view.data}
                    selectedId={selectedId}
                    onSelect={onSelect}
                    onEditGroup={onEditGroup}
                    onEditChatbox={onEditChatbox}
                    extraScrollOffset={scrollerOffset}
                    dndEnabled={dndEnabled}
                    listLocked={isListLocked}
                    swap={swap}
                    add={add}
                    remove={remove}
                  />
                ) : (
                  <SortableChatbox
                    key={view.data.id}
                    data={view.data}
                    itemOf="diary-list"
                    selectedId={selectedId}
                    onSelect={onSelect}
                    onEdit={onEditChatbox}
                    extraScrollOffset={scrollerOffset}
                    dndEnabled={dndEnabled}
                    listLocked={isListLocked}
                    onSortableChange={(current, previous) => {
                      swap({ type: 'list' }, current, previous);
                    }}
                  />
                ),
              )
            : null}
          <div className={styles.decorativeFooter} aria-hidden>
            <img className={styles.wish} src={chatboxListAssets.wish} alt="" />
            <img
              className={styles.signature}
              src={chatboxListAssets.signature}
              alt=""
            />
          </div>
        </div>
      </AdDragDrop>
    </LayoutCard>
  );
};

export default ChatboxSidebar;
