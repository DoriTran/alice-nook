import type { FC } from 'react';

import {
  faArrowUpRightFromSquare,
  faBoxArchive,
  faEllipsisVertical,
  faThumbtack,
} from '@fortawesome/free-solid-svg-icons';
import { Copy, Hand } from 'lucide-react';

import type { Message } from '@/store/diary/type';

import { AdActionButton, AdIcon, AdMenu, AdMenuItem } from '@/packages/base';

import type { MessageActionsAPI } from '../../../.hooks/useMessageActions';

import styles from './MoreMenu.module.css';

export type MoreMenuProps = {
  message: Message;
  actions: MessageActionsAPI;
  opened: boolean;
  onOpenChange: (opened: boolean) => void;
};

const MoreMenu: FC<MoreMenuProps> = ({
  message,
  actions,
  opened,
  onOpenChange,
}) => {
  const isUserMessage = (message.sender ?? 'user') === 'user';
  const isEditingThis = actions.editTargetId === message.id;
  const editDisabled = actions.editTargetId !== null || actions.composerDirty;
  const archiveDisabled = isEditingThis;

  return (
    <AdMenu
      opened={opened}
      onChange={onOpenChange}
      position="top"
      width={180}
      anchor={
        <AdActionButton
          icon={faEllipsisVertical}
          label="Message options"
          tooltip={false}
          onClick={() => onOpenChange(!opened)}
        />
      }
    >
      <li role="none" className={styles.quickActions}>
        <button
          type="button"
          className={`${styles.quickAction} ${styles.forwardAction}`}
          aria-label="Forward"
          onClick={() => {
            onOpenChange(false);
            actions.requestForward(message.id);
          }}
        >
          <span className={styles.quickIcon}>
            <AdIcon icon={faArrowUpRightFromSquare} size={12} />
          </span>
          Forward
        </button>
        <button
          type="button"
          className={`${styles.quickAction} ${styles.moveAction}`}
          aria-label="Move"
          onClick={() => {
            onOpenChange(false);
            actions.requestMove(message.id);
          }}
        >
          <span className={styles.quickIcon}>
            <AdIcon icon={Hand} source="lucide" size={14} />
          </span>
          Move
        </button>
        <button
          type="button"
          className={`${styles.quickAction} ${styles.copyAction}`}
          aria-label="Copy"
          onClick={() => {
            onOpenChange(false);
            actions.copyMessage(message.id);
          }}
        >
          <span className={styles.quickIcon}>
            <AdIcon icon={Copy} source="lucide" size={14} />
          </span>
          Copy
        </button>
        <button
          type="button"
          className={`${styles.quickAction} ${styles.pinAction}`}
          aria-label={message.pinned ? 'Unpin' : 'Pin'}
          data-active={message.pinned || undefined}
          onClick={() => {
            onOpenChange(false);
            actions.togglePin(message.id);
          }}
        >
          <span className={styles.quickIcon}>
            <AdIcon icon={faThumbtack} size={12} />
          </span>
          {message.pinned ? 'Unpin' : 'Pin'}
        </button>
        <button
          type="button"
          className={`${styles.quickAction} ${styles.archiveAction}`}
          aria-label={message.archived ? 'Unarchive' : 'Archive'}
          data-active={message.archived || undefined}
          disabled={archiveDisabled}
          onClick={() => {
            onOpenChange(false);
            actions.toggleArchive(message.id);
          }}
        >
          <span className={styles.quickIcon}>
            <AdIcon icon={faBoxArchive} size={12} />
          </span>
          {message.archived ? 'Unarchive' : 'Archive'}
        </button>
      </li>

      {isUserMessage ? (
        <>
          <li role="separator" className={styles.divider} />
          <AdMenuItem
            centered
            disabled={editDisabled}
            onClick={() => {
              onOpenChange(false);
              actions.startEdit(message.id);
            }}
          >
            Edit
          </AdMenuItem>
        </>
      ) : null}

      <li role="separator" className={styles.divider} />
      <AdMenuItem
        centered
        destructive
        onClick={() => {
          onOpenChange(false);
          actions.requestDelete(message.id);
        }}
      >
        Delete
      </AdMenuItem>
    </AdMenu>
  );
};

export default MoreMenu;
