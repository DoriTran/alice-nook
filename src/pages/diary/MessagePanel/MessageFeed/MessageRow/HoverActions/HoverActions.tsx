import { faReply, faSmile, faTags } from '@fortawesome/free-solid-svg-icons';
import { useEffect, useRef, useState, type FC } from 'react';

import type { Message } from '@/store/diary/type';

import {
  AdActionButton,
  AdEmojiPickerPanel,
  AdPopover,
  AdQuickReactionBar,
} from '@/packages/base';
import { TagSelect } from '@/packages/ui';

import type { MessageActionsAPI } from '../../../.hooks/useMessageActions';

import styles from './HoverActions.module.css';
import MoreMenu from './MoreMenu';

const mergeClass = (...parts: Array<string | undefined>) =>
  parts.filter(Boolean).join(' ');

export type HoverActionsProps = {
  message: Message;
  actions: MessageActionsAPI;
  side: 'left' | 'right';
  className?: string;
};

const HoverActions: FC<HoverActionsProps> = ({
  message,
  actions,
  side,
  className,
}) => {
  const [reactionOpen, setReactionOpen] = useState(false);
  const [fullPickerOpen, setFullPickerOpen] = useState(false);
  const [tagOpen, setTagOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [compactActions, setCompactActions] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const expandedActionsWidthRef = useRef(0);
  const popupOpen = reactionOpen || tagOpen || menuOpen;

  const handleReactionSelect = (emoji: string) => {
    actions.toggleReaction(message.id, emoji);
    setReactionOpen(false);
    setFullPickerOpen(false);
  };

  const replyDisabled =
    actions.replyToMessageId === message.id ||
    actions.editTargetId === message.id;

  useEffect(() => {
    const row = rootRef.current?.closest<HTMLElement>('[data-message-id]');
    const bubbleRow = rootRef.current?.parentElement;
    const bubbleSlot = (
      side === 'right'
        ? rootRef.current?.nextElementSibling
        : rootRef.current?.previousElementSibling
    ) as HTMLElement | null;
    if (!row || !bubbleRow || !bubbleSlot || !rootRef.current) return;

    const update = () => {
      if (!compactActions) {
        expandedActionsWidthRef.current = Math.max(
          expandedActionsWidthRef.current,
          rootRef.current?.scrollWidth ?? 0,
        );
      }
      const rowRect = row.getBoundingClientRect();
      const bubbleRect = bubbleSlot.getBoundingClientRect();
      const available =
        side === 'right'
          ? bubbleRect.left - rowRect.left
          : rowRect.right - bubbleRect.right;
      setCompactActions(available < expandedActionsWidthRef.current + 8);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(row);
    observer.observe(bubbleSlot);
    return () => observer.disconnect();
  }, [compactActions, side]);

  return (
    <div
      ref={rootRef}
      className={mergeClass(styles.root, className)}
      data-side={side}
      data-compact={compactActions || undefined}
      data-open={popupOpen || undefined}
    >
      <MoreMenu
        message={message}
        actions={actions}
        opened={menuOpen}
        onOpenChange={setMenuOpen}
        compactActions={compactActions}
        replyDisabled={replyDisabled}
      />
      {!compactActions ? (
        <AdActionButton
          icon={faReply}
          label="Reply"
          disabled={replyDisabled}
          onClick={() => actions.startReply(message.id)}
        />
      ) : null}
      {!compactActions ? (
        <AdPopover
          opened={tagOpen}
          onChange={setTagOpen}
          position="top"
          width={450}
          classNames={{ dropdown: styles.tagDropdown }}
          anchor={
            <AdActionButton
              icon={faTags}
              label="Add tags"
              tooltip={false}
              active={message.tagIds.length > 0}
              onClick={() => setTagOpen((value) => !value)}
            />
          }
        >
          <div className={styles.tagPopover}>
            <TagSelect
              placeholder="Search or create tags..."
              emptyLabel="No tags found"
              value={message.tagIds}
              stackedPalette
              onChange={(tagIds) => {
                actions.setTags(message.id, tagIds);
              }}
            />
          </div>
        </AdPopover>
      ) : null}
      <AdPopover
        opened={reactionOpen}
        onChange={(opened) => {
          setReactionOpen(opened);

          if (!opened) {
            setFullPickerOpen(false);
          }
        }}
        position="top"
        width={fullPickerOpen ? 'auto' : undefined}
        classNames={{ dropdown: styles.reactionDropdown }}
        anchor={
          <AdActionButton
            icon={faSmile}
            label="React"
            tooltip={false}
            active={message.reactions.length > 0}
            onClick={() => setReactionOpen((value) => !value)}
          />
        }
      >
        <div
          className={
            fullPickerOpen ? styles.fullReactionPopover : styles.reactionPopover
          }
        >
          <AdQuickReactionBar
            onSelect={handleReactionSelect}
            onExpand={() => setFullPickerOpen(true)}
          />
          {fullPickerOpen ? (
            <div className={styles.fullPickerSlot}>
              <AdEmojiPickerPanel onSelect={handleReactionSelect} />
            </div>
          ) : null}
        </div>
      </AdPopover>
    </div>
  );
};

export default HoverActions;
