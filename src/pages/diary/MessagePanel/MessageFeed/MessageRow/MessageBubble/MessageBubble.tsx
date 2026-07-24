import type { CSSProperties, FC, ReactNode } from 'react';

import { faCheck, faThumbtack } from '@fortawesome/free-solid-svg-icons';
import clsx from 'clsx';

import type { Message } from '@/store/diary/type';

import { AdIcon } from '@/packages/base';
import { useDiaryStore } from '@/store';

import { formatMessageTime } from '../../message.utils';
import AttachmentList from './Content/AttachmentList/AttachmentList';
import ContentRenderer from './Content/ContentRenderer';
import ForwardCard from './Content/ForwardCard';
import MessageDecoratorShell from './Content/MessageDecoratorShell';
import MessageTagRow from './Content/MessageTagRow';
import ReactionBar from './Content/ReactionBar';
import ReplyPreview from './Content/ReplyPreview';
import assistantStyles from './styles/assistantBubble.module.css';
import userStyles from './styles/userBubble.module.css';

export type MessageBubbleProps = {
  message: Message;
  onNavigateToMessage: (messageId: string) => void;
  /** Centered on the message bubble only (not reply / reactions / tags). */
  hoverActions?: ReactNode;
};

const MessageBubble: FC<MessageBubbleProps> = ({
  message,
  onNavigateToMessage,
  hoverActions = null,
}) => {
  const toggleMessageReaction = useDiaryStore('toggleMessageReaction');
  const isAssistant = (message.sender ?? 'user') === 'assistant';
  const styles = isAssistant ? assistantStyles : userStyles;
  const time = formatMessageTime(message.createdAt);
  const captionText =
    message.variant === 'todo' ? '' : message.content.text.trim();
  // Only render a body bubble when there is real content (not attachment-only empties).
  const showBody = message.variant === 'todo' || captionText.length > 0;
  const hasAttachments =
    !message.sourceMessageId && message.attachments.length > 0;
  const hasDecorators =
    !message.sourceMessageId && message.decorators.length > 0;
  const hasReactions = message.reactions.length > 0;
  const surfaceBg = isAssistant ? 'var(--chat-text-bg)' : 'var(--chat-user-bg)';
  const reactionAlign = isAssistant ? 'start' : 'end';

  const pinnedBadge = message.pinned ? (
    <span className={styles.pinned}>
      <AdIcon icon={faThumbtack} size={9} />
      Pinned
    </span>
  ) : null;

  const reply = message.replyToMessageId ? (
    <ReplyPreview
      replyToMessageId={message.replyToMessageId}
      onJump={onNavigateToMessage}
    />
  ) : null;

  const forward = message.sourceMessageId ? (
    <ForwardCard
      sourceMessageId={message.sourceMessageId}
      onJump={onNavigateToMessage}
    />
  ) : null;

  let body: ReactNode = null;

  if (hasDecorators) {
    body = (
      <MessageDecoratorShell
        messageId={message.id}
        decorators={message.decorators}
        attached={hasAttachments}
      >
        {showBody ? <ContentRenderer message={message} /> : null}
      </MessageDecoratorShell>
    );
  } else if (showBody) {
    body = (
      <div
        className={clsx(styles.bubble, hasAttachments && styles.bubbleAttached)}
        data-message-surface
      >
        <ContentRenderer message={message} />
      </div>
    );
  }

  const reactionBar = hasReactions ? (
    <ReactionBar
      messageId={message.id}
      reactions={message.reactions}
      align={reactionAlign}
      onToggle={toggleMessageReaction}
    />
  ) : null;

  /** Prefer the text bubble; fall back to attachments so action-only rows don't leave a gap. */
  const actionsBesideAttachments = Boolean(hoverActions) && !body && hasAttachments;

  const withHoverActions = (slot: ReactNode) => (
    <div className={styles.bubbleRow}>
      {!isAssistant ? hoverActions : null}
      {slot ? <div className={styles.bubbleSlot}>{slot}</div> : null}
      {isAssistant ? hoverActions : null}
    </div>
  );

  const attachments = hasAttachments ? (
    actionsBesideAttachments ? (
      withHoverActions(
        <AttachmentList
          attachments={message.attachments}
          align={isAssistant ? 'start' : 'end'}
        />,
      )
    ) : (
      <AttachmentList
        attachments={message.attachments}
        align={isAssistant ? 'start' : 'end'}
      />
    )
  ) : null;

  /** Actions sit beside the bubble only so reply / reaction hang don't shift them. */
  const bubbleRow = body
    ? withHoverActions(body)
    : hoverActions && !hasAttachments
      ? withHoverActions(null)
      : null;

  const bodyStack =
    bubbleRow || hasReactions ? (
      <div className={hasReactions ? styles.bodyStack : undefined}>
        {bubbleRow}
        {reactionBar}
      </div>
    ) : null;

  const core = (
    <div
      className={styles.core}
      style={
        {
          '--message-surface-bg': surfaceBg,
        } as CSSProperties
      }
    >
      {pinnedBadge}
      {reply}
      {forward}
      {attachments}
      {bodyStack}
    </div>
  );

  const footer = (
    <div className={styles.footer}>
      <MessageTagRow tagIds={message.tagIds} />
      {isAssistant ? (
        <time className={assistantStyles.time}>{time}</time>
      ) : (
        <div className={userStyles.meta}>
          <time className={userStyles.time}>{time}</time>
          {message.edited ? (
            <span className={userStyles.time}> · edited</span>
          ) : null}
          <span className={userStyles.read} aria-label="Sent">
            <AdIcon icon={faCheck} size={10} />
          </span>
        </div>
      )}
    </div>
  );

  if (isAssistant) {
    return (
      <article className={assistantStyles.root}>
        <span className={assistantStyles.avatar} aria-hidden>
          🐱
        </span>
        <div className={assistantStyles.content}>
          <span className={assistantStyles.name}>AI Assistant</span>
          {core}
          {footer}
        </div>
      </article>
    );
  }

  return (
    <article className={userStyles.root}>
      <div className={userStyles.content}>
        {core}
        {footer}
      </div>
    </article>
  );
};

export default MessageBubble;
