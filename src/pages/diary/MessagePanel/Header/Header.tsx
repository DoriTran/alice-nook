import {
  faClock,
  faColumns,
  faComment,
  faFolder,
  faMagnifyingGlass,
  faPaperclip,
  faRectangleList,
  faThumbtack,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import {
  Fragment,
  type FC,
  type CSSProperties,
  type JSX,
  type RefObject,
} from 'react';

import { AdIcon } from '@/packages/base';

import type { MessageHeaderData } from './useMessageHeaderData';

import { formatTotalMessages } from '../../ChatboxSidebar/Chatbox/chatbox.utils';
import styles from './Header.module.css';

export type HeaderProps = {
  data: MessageHeaderData;
  detailPanelCollapsed: boolean;
  onToggleDetailPanel: () => void;
  searchQuery: string;
  searchActive: boolean;
  searchInputRef: RefObject<HTMLInputElement | null>;
  onSearchQueryChange: (value: string) => void;
  onSearchActiveChange: (active: boolean) => void;
};

const Header: FC<HeaderProps> = ({
  data,
  detailPanelCollapsed,
  onToggleDetailPanel,
  searchQuery,
  searchActive,
  searchInputRef,
  onSearchQueryChange,
  onSearchActiveChange,
}) => {
  const {
    name,
    description,
    icon,
    paletteSoft,
    paletteMain,
    paletteStrong,
    iconBg,
    pinned,
    groupName,
    totalMessage,
    totalAttachments,
    updatedLabel,
    updatedAt,
  } = data;

  const messageLabel =
    totalMessage === 1
      ? '1 message'
      : `${formatTotalMessages(totalMessage)} messages`;

  const attachmentLabel =
    totalAttachments === 1
      ? '1 attachment'
      : `${formatTotalMessages(totalAttachments)} attachments`;

  const metaItems = [
    groupName
      ? {
          key: 'group',
          node: (
            <span className={styles.metaItem}>
              <AdIcon icon={faFolder} size={10} />
              {groupName}
            </span>
          ),
        }
      : null,
    totalMessage > 0
      ? {
          key: 'messages',
          node: (
            <span className={styles.metaItem}>
              <AdIcon icon={faComment} size={10} />
              {messageLabel}
            </span>
          ),
        }
      : null,
    totalAttachments > 0
      ? {
          key: 'attachments',
          node: (
            <span className={styles.metaItem}>
              <AdIcon icon={faPaperclip} size={10} />
              {attachmentLabel}
            </span>
          ),
        }
      : null,
    updatedLabel
      ? {
          key: 'activity',
          node: (
            <span className={styles.metaItem}>
              <AdIcon icon={faClock} size={10} />
              <time dateTime={updatedAt ?? undefined}>{updatedLabel}</time>
            </span>
          ),
        }
      : null,
  ].filter((item): item is { key: string; node: JSX.Element } => item != null);

  return (
    <header
      className={styles.root}
      style={
        {
          '--header-soft': paletteSoft,
          '--header-main': paletteMain,
          '--header-strong': paletteStrong,
        } as CSSProperties
      }
    >
      <div className={styles.topRow}>
        <div className={styles.identityBlock}>
          <div className={styles.iconArea}>
            <span
              className={styles.iconWrap}
              style={{ background: iconBg }}
              aria-hidden
            >
              <AdIcon icon={icon} source="lucide" size={36} />
            </span>
            {pinned ? (
              <span className={styles.overlayPin} aria-label="Pinned">
                <AdIcon icon={faThumbtack} size={12} />
              </span>
            ) : null}
          </div>

          <div className={styles.textBlock}>
            <h1 className={styles.name}>{name}</h1>

            {description ? (
              <p className={styles.description}>{description}</p>
            ) : null}

            {metaItems.length > 0 ? (
              <div className={styles.metadataRow}>
                {metaItems.map((item, index) => (
                  <Fragment key={item.key}>
                    {index > 0 ? (
                      <span className={styles.metaDot} aria-hidden>
                        •
                      </span>
                    ) : null}
                    {item.node}
                  </Fragment>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <button
          type="button"
          className={styles.toggleBtn}
          aria-label={
            detailPanelCollapsed ? 'Show detail panel' : 'Hide detail panel'
          }
          aria-pressed={!detailPanelCollapsed}
          onClick={onToggleDetailPanel}
        >
          <AdIcon
            icon={detailPanelCollapsed ? faRectangleList : faColumns}
            size={15}
          />
        </button>
      </div>

      {searchActive || searchQuery ? (
        <div className={styles.searchRow}>
          <span className={styles.searchIcon}>
            <AdIcon icon={faMagnifyingGlass} size={12} />
          </span>
          <input
            ref={searchInputRef}
            type="search"
            className={styles.searchInput}
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            aria-label="Search messages in this chatbox"
          />
          <button
            type="button"
            className={styles.searchCloseBtn}
            aria-label="Close search"
            onClick={() => {
              onSearchQueryChange('');
              onSearchActiveChange(false);
            }}
          >
            <AdIcon icon={faXmark} size={12} />
          </button>
        </div>
      ) : null}
    </header>
  );
};

export default Header;
