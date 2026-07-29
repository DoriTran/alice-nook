import type { FC } from 'react';

import type { Message } from '@/store/diary/type';

import {
  AdCheckbox,
  AdEmojiText,
  AdRichTextViewer,
  isRichTextEmpty,
} from '@/packages/base';
import { useDiaryStore } from '@/store';

import { getMessagePreviewText } from '../../../../messagePanel.utils';
import AttachmentList from './AttachmentList/AttachmentList';
import styles from './MessageContent.module.css';

export type ContentRendererProps = {
  message: Message;
  mode?: 'feed' | 'preview';
};

const ContentRenderer: FC<ContentRendererProps> = ({
  message,
  mode = 'feed',
}) => {
  const patchMessage = useDiaryStore('patchMessage');
  const align = message.sender === 'assistant' ? 'start' : 'end';

  if (mode === 'preview') {
    return (
      <p className={styles.text}>
        <AdEmojiText text={getMessagePreviewText(message)} />
      </p>
    );
  }

  if (message.variant === 'todo') {
    return (
      <ul className={styles.todoList}>
        {message.content.items.map((item) => {
          const hasText = !isRichTextEmpty(item.content);
          const hasAttachments = item.attachments.length > 0;

          return (
            <li key={item.id} className={styles.todoItem}>
              <div className={styles.checkbox}>
                <AdCheckbox
                  checked={item.completed}
                  aria-label={
                    hasText
                      ? `Mark ${item.content.preview} complete`
                      : 'Mark todo complete'
                  }
                  onChange={() =>
                    patchMessage(message.id, {
                      content: {
                        items: message.content.items.map((entry) =>
                          entry.id === item.id
                            ? { ...entry, completed: !entry.completed }
                            : entry,
                        ),
                      },
                    })
                  }
                />
              </div>
              <div className={styles.todoBody}>
                {hasText ? (
                  <AdRichTextViewer
                    value={item.content}
                    className={`${styles.todoText} ${item.completed ? styles.todoTextDone : ''}`}
                  />
                ) : null}
                {hasAttachments ? (
                  <div
                    className={
                      item.completed ? styles.attachmentsDone : undefined
                    }
                  >
                    <AttachmentList
                      attachments={item.attachments}
                      align={align}
                      compact
                    />
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    );
  }

  if (isRichTextEmpty(message.content)) {
    return null;
  }

  return (
    <div className={styles.text}>
      <AdRichTextViewer value={message.content} />
    </div>
  );
};

export default ContentRenderer;
