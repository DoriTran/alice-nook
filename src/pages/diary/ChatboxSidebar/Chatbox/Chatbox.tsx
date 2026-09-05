import {
  faBell,
  faBoxArchive,
  faEllipsis,
  faPen,
  faThumbtack,
} from '@fortawesome/free-solid-svg-icons';
import clsx from 'clsx';
import { useState, type CSSProperties, type FC } from 'react';

import { AdIcon, AdMenu, AdMenuItem, AdTooltip } from '@/packages/base';
import LayoutCard from '@/packages/ui/LayoutCard/LayoutCard';

import type { ChatboxData } from '../../types';

import styles from './Chatbox.module.css';
import { formatChatboxTime, formatTotalMessages } from './chatbox.utils';
import ChatboxTagRow from './ChatboxTagRow';

export type ChatboxProps = {
  data: ChatboxData;
  selected?: boolean;
  onSelect?: (id: string) => void;
  onEdit?: (id: string) => void;
  /** Suppress hover tooltip (e.g. while dragging). */
  suppressTooltip?: boolean;
};

const Chatbox: FC<ChatboxProps> = ({
  data,
  selected,
  onSelect,
  onEdit,
  suppressTooltip = false,
}) => {
  const {
    id,
    name,
    description,
    preview,
    tags,
    icon,
    paletteSoft,
    paletteMain,
    paletteStrong,
    pinned,
    archived,
    hasUnread,
    notificationEnabled,
    totalMessage,
    lastMessageAt,
  } = data;

  const [menuOpen, setMenuOpen] = useState(false);
  const formattedTime = formatChatboxTime(lastMessageAt);

  const tooltipLabel = (
    <div className={styles.tooltipContent}>
      <p className={styles.tooltipName}>{name}</p>
      {description ? (
        <p className={styles.tooltipDescription}>{description}</p>
      ) : null}
    </div>
  );

  return (
    <AdTooltip
      label={tooltipLabel}
      openDelay={500}
      position="right"
      withArrow={false}
      multiline
      withinPortal
      floatingStrategy="fixed"
      disabled={suppressTooltip}
      classNames={{
        tooltip: styles.tooltip,
      }}
    >
      <LayoutCard
        tag="div"
        className={styles.root}
        style={
          {
            '--chatbox-soft': paletteSoft,
            '--chatbox-main': paletteMain,
            '--chatbox-strong': paletteStrong,
          } as CSSProperties
        }
        data-active={selected || undefined}
      >
        <button
          type="button"
          className={styles.selectBtn}
          aria-current={selected ? 'true' : undefined}
          onClick={() => onSelect?.(id)}
        >
          <div className={styles.mainRow}>
            <div className={styles.leftZone}>
              <div className={styles.iconArea}>
                <span className={styles.iconWrap} aria-hidden>
                  <AdIcon icon={icon} source="lucide" size={16} />
                </span>
                {pinned ? (
                  <span className={styles.overlayPin} aria-label="Pinned">
                    <AdIcon icon={faThumbtack} size={8} />
                  </span>
                ) : null}
                {archived ? (
                  <span className={styles.overlayArchive} aria-label="Archived">
                    <AdIcon icon={faBoxArchive} size={8} />
                  </span>
                ) : null}
              </div>

              <div className={styles.textColumn}>
                <h3 className={styles.name}>{name}</h3>
                {preview ? <p className={styles.preview}>{preview}</p> : null}
              </div>
            </div>

            <div className={styles.rightZone}>
              {formattedTime ? (
                <time
                  className={styles.time}
                  dateTime={lastMessageAt ?? undefined}
                >
                  {formattedTime}
                </time>
              ) : null}
              {totalMessage > 0 ? (
                <span
                  className={clsx(
                    styles.messageBadge,
                    hasUnread && styles.messageBadgeUnread,
                  )}
                  aria-label={hasUnread ? 'Unread messages' : undefined}
                >
                  {notificationEnabled ? (
                    <span className={styles.bell} aria-hidden>
                      <AdIcon icon={faBell} size={7} />
                    </span>
                  ) : null}
                  {formatTotalMessages(totalMessage)}
                </span>
              ) : null}
            </div>
          </div>

          <ChatboxTagRow tags={tags} className={styles.tagsContainer} />
        </button>

        <AdMenu
          offset={4}
          onChange={setMenuOpen}
          opened={menuOpen}
          position="bottom"
          width={160}
          anchor={
            <button
              type="button"
              className={styles.menuBtn}
              aria-label={`${name} options`}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              onClick={(event) => {
                event.stopPropagation();
                setMenuOpen((value) => !value);
              }}
            >
              <AdIcon icon={faEllipsis} size={12} />
            </button>
          }
        >
          <AdMenuItem
            onClick={(event) => {
              event.stopPropagation();
              setMenuOpen(false);
              onEdit?.(id);
            }}
          >
            <AdIcon icon={faPen} size={12} />
            Edit
          </AdMenuItem>
        </AdMenu>
      </LayoutCard>
    </AdTooltip>
  );
};

export default Chatbox;
