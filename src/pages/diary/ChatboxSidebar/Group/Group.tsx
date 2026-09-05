import {
  faChevronRight,
  faEllipsis,
  faGripVertical,
  faPen,
} from '@fortawesome/free-solid-svg-icons';
import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type FC,
  type ReactNode,
} from 'react';

import { useColorBrightness } from '@/hooks';
import { AdIcon, AdMenu, AdMenuItem } from '@/packages/base';
import { BrushHighlight } from '@/packages/ui';
import LayoutCard from '@/packages/ui/LayoutCard/LayoutCard';
import { useAppStore } from '@/store';

import type { GroupData } from '../../types';

import Chatbox from '../Chatbox/Chatbox';
import styles from './Group.module.css';
import { GROUP_BRUSH_SIZE } from './group.utils';

export type GroupProps = {
  data: GroupData;
  selectedId?: string;
  onSelect?: (id: string) => void;
  onEditGroup?: (id: string) => void;
  onEditChatbox?: (id: string) => void;
  renderChatbox?: (chatbox: GroupData['chatboxes'][number]) => ReactNode;
};

const Group: FC<GroupProps> = ({
  data,
  selectedId,
  onSelect,
  onEditGroup,
  onEditChatbox,
  renderChatbox,
}) => {
  const titleId = useId();
  const listId = useId();
  const { id, title, brushColor, groupIcon, chatboxes } = data;
  const [menuOpen, setMenuOpen] = useState(false);

  const { diaryPage, toggleGroup, collapseGroup } = useAppStore([
    'diaryPage',
    'toggleGroup',
    'collapseGroup',
  ]);
  const isEmpty = chatboxes.length === 0;
  const isExpanded = !isEmpty && diaryPage.expandedGroupIds.has(id);
  const { textColor: brushTextColor } = useColorBrightness(brushColor);

  useLayoutEffect(() => {
    if (isEmpty && diaryPage.expandedGroupIds.has(id)) {
      collapseGroup(id);
    }
  }, [collapseGroup, diaryPage.expandedGroupIds, id, isEmpty]);

  const rootRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const hasMeasured = useRef(false);

  useLayoutEffect(() => {
    const list = listRef.current;
    const root = rootRef.current;

    if (!list || !root) {
      return;
    }

    const updateHeight = () => {
      root.style.setProperty('--list-height', `${list.scrollHeight}px`);
    };

    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(list);

    if (!hasMeasured.current) {
      const frame = requestAnimationFrame(() => {
        hasMeasured.current = true;
        root.dataset.ready = 'true';
        root.dataset.mounted = 'true';
      });

      return () => {
        cancelAnimationFrame(frame);
        observer.disconnect();
      };
    }

    return () => observer.disconnect();
  }, [chatboxes.length]);

  return (
    <section
      ref={rootRef}
      className={styles.root}
      style={{ '--group-color': brushColor } as CSSProperties}
      data-expanded={isExpanded || undefined}
      data-empty={isEmpty || undefined}
      aria-labelledby={titleId}
    >
      <header className={styles.header}>
        <BrushHighlight
          color={brushColor}
          height={GROUP_BRUSH_SIZE}
          shadow={false}
          paintOpacity={0.82}
          className={styles.brush}
          spacing={{ left: 12, right: 30 }}
          id={titleId}
        >
          <div
            data-handle
            className={styles.brushInner}
            style={{ color: brushTextColor }}
          >
            {isEmpty ? (
              <span className={styles.grip} aria-hidden>
                <AdIcon icon={faGripVertical} size={10} color="currentColor" />
              </span>
            ) : (
              <button
                type="button"
                className={styles.caretBtn}
                aria-expanded={isExpanded}
                aria-controls={listId}
                aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${title}`}
                onClick={() => toggleGroup(id)}
                onPointerDown={(event) => event.stopPropagation()}
              >
                <span className={styles.caret} aria-hidden>
                  <AdIcon
                    icon={faChevronRight}
                    size={10}
                    color="currentColor"
                  />
                </span>
              </button>
            )}
            <span className={styles.groupIcon} aria-hidden>
              <AdIcon icon={groupIcon} source="lucide" size={14} />
            </span>
            <span className={styles.titleText}>{title}</span>
          </div>
        </BrushHighlight>
        {!isExpanded ? (
          <LayoutCard className={styles.countCard}>
            <span className={styles.count}>{chatboxes.length}</span>
          </LayoutCard>
        ) : null}
      </header>
      <AdMenu
        offset={4}
        onChange={setMenuOpen}
        opened={menuOpen}
        position="bottom"
        width={160}
        anchor={
          <button
            className={styles.menuBtn}
            type="button"
            aria-label={`${title} group options`}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            onClick={(event) => {
              event.stopPropagation();
              setMenuOpen((value) => !value);
            }}
          >
            <AdIcon icon={faEllipsis} size={14} />
          </button>
        }
      >
        <AdMenuItem
          onClick={(event) => {
            event.stopPropagation();
            setMenuOpen(false);
            onEditGroup?.(id);
          }}
        >
          <AdIcon icon={faPen} size={12} />
          Edit
        </AdMenuItem>
      </AdMenu>
      <span className={styles.groupDecoration} aria-hidden>
        <AdIcon icon="heart" source="lucide" size={20} />
      </span>
      <div
        className={styles.listShell}
        id={listId}
        aria-hidden={!isExpanded || undefined}
      >
        <div className={styles.list} ref={listRef}>
          {chatboxes.map((chatbox) => (
            <div key={chatbox.id} className={styles.listItem}>
              {renderChatbox ? (
                renderChatbox(chatbox)
              ) : (
                <Chatbox
                  data={chatbox}
                  selected={chatbox.id === selectedId}
                  onSelect={onSelect}
                  onEdit={onEditChatbox}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Group;
