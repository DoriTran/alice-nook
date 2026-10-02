import { faReply, faSmile, faTags } from '@fortawesome/free-solid-svg-icons';
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FC,
} from 'react';

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
  disabled?: boolean;
};

const HoverActions: FC<HoverActionsProps> = ({
  message,
  actions,
  side,
  className,
  disabled = false,
}) => {
  const [reactionOpen, setReactionOpen] = useState(false);
  const [fullPickerOpen, setFullPickerOpen] = useState(false);
  const [tagOpen, setTagOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [compactActions, setCompactActions] = useState(false);
  const [actionOffsetX, setActionOffsetX] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const expandedActionsWidthRef = useRef(0);
  const popupOpen = reactionOpen || tagOpen || menuOpen;

  const handleReactionSelect = (emoji: string) => {
    if (disabled) return;
    actions.toggleReaction(message.id, emoji);
    setReactionOpen(false);
    setFullPickerOpen(false);
  };

  const replyDisabled =
    actions.replyToMessageId === message.id ||
    actions.editTargetId === message.id;

  useEffect(() => {
    const root = rootRef.current;
    const row = root?.closest<HTMLElement>('[data-message-id]');
    const bubbleRow = root?.parentElement;
    const bubbleSlot = (
      side === 'right' ? root?.nextElementSibling : root?.previousElementSibling
    ) as HTMLElement | null;
    if (!root || !row || !bubbleRow || !bubbleSlot) return;

    const update = () => {
      if (!compactActions) {
        expandedActionsWidthRef.current = Math.max(
          expandedActionsWidthRef.current,
          root.scrollWidth,
        );
      }
      const rowRect = row.getBoundingClientRect();
      const bubbleRect = bubbleSlot.getBoundingClientRect();
      const available =
        side === 'right'
          ? bubbleRect.left - rowRect.left
          : rowRect.right - bubbleRect.right;
      setCompactActions(available < expandedActionsWidthRef.current + 8);

      const gap = Number.parseFloat(getComputedStyle(root).fontSize) * 0.35;
      const actionsWidth = root.scrollWidth;
      const nextOffset =
        side === 'right'
          ? Math.max(0, rowRect.left - (bubbleRect.left - gap - actionsWidth))
          : -Math.max(0, bubbleRect.right + gap + actionsWidth - rowRect.right);
      setActionOffsetX((current) =>
        Math.abs(current - nextOffset) < 0.5 ? current : nextOffset,
      );
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
      style={
        {
          '--hover-actions-offset-x': `${actionOffsetX}px`,
        } as CSSProperties
      }
    >
      <MoreMenu
        message={message}
        actions={actions}
        opened={menuOpen}
        onOpenChange={setMenuOpen}
        compactActions={compactActions}
        replyDisabled={replyDisabled}
        disabled={disabled}
      />
      {!compactActions ? (
        <AdActionButton
          icon={faReply}
          label="Reply"
          disabled={disabled || replyDisabled}
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
              disabled={disabled}
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
            disabled={disabled}
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
