import { useEffect, useRef, useState, type FC, type RefObject } from 'react';

import endOfScroll from '@/assets/v2/diary/chat-panel/end of scroll.png';

import type { MessageActionsAPI } from '../.hooks/useMessageActions';
import type { MessageDayGroup } from './message.utils';

import DateSeparator from './DateSeparator/DateSeparator';
import styles from './MessageFeed.module.css';
import MessageRow from './MessageRow/MessageRow';

export type MessageFeedProps = {
  groups: MessageDayGroup[];
  feedRef: RefObject<HTMLDivElement | null>;
  registerRef: (messageId: string, element: HTMLElement | null) => void;
  actions: MessageActionsAPI;
};

const MessageFeed: FC<MessageFeedProps> = ({
  groups,
  feedRef,
  registerRef,
  actions,
}) => {
  const innerRef = useRef<HTMLDivElement>(null);
  const messageGroupsRef = useRef<HTMLDivElement>(null);
  const [showEndMarker, setShowEndMarker] = useState(false);

  useEffect(() => {
    const feed = feedRef.current;
    const inner = innerRef.current;
    const messageGroups = messageGroupsRef.current;
    if (!feed || !inner || !messageGroups) return;

    const updateEndMarkerVisibility = () => {
      const innerStyles = window.getComputedStyle(inner);
      const verticalPadding =
        Number.parseFloat(innerStyles.paddingTop) +
        Number.parseFloat(innerStyles.paddingBottom);
      const baseScrollRange =
        messageGroups.scrollHeight + verticalPadding - feed.clientHeight;

      setShowEndMarker(baseScrollRange > 100);
    };

    updateEndMarkerVisibility();

    const resizeObserver = new ResizeObserver(updateEndMarkerVisibility);
    resizeObserver.observe(feed);
    resizeObserver.observe(messageGroups);

    return () => resizeObserver.disconnect();
  }, [feedRef, groups]);

  return (
    <div ref={feedRef} className={styles.root}>
      <div ref={innerRef} className={styles.inner}>
        {showEndMarker ? (
          <div className={styles.endMarker} aria-hidden>
            <img className={styles.endMarkerImage} src={endOfScroll} alt="" />
          </div>
        ) : null}

        <div ref={messageGroupsRef} className={styles.messageGroups}>
          {groups.map((group) => (
            <section key={group.date} className={styles.dayGroup}>
              <DateSeparator label={group.date} />
              <div className={styles.messages}>
                {group.messages.map((message) => (
                  <MessageRow
                    key={message.id}
                    message={message}
                    registerRef={registerRef}
                    actions={actions}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MessageFeed;
