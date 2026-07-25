import type { FC } from 'react';

import type { Message } from '@/store/diary/type';

import { AdModal } from '@/packages/base';

import DetailMessagePreviewRow from './DetailMessagePreviewRow';
import styles from './MessageListDialog.module.css';

export type MessageListDialogProps = {
  opened: boolean;
  onClose: () => void;
  title: string;
  messages: Message[];
  showPin?: boolean;
  emptyLabel?: string;
  onJumpToMessage: (messageId: string) => void;
};

const MessageListDialog: FC<MessageListDialogProps> = ({
  opened,
  onClose,
  title,
  messages,
  showPin = false,
  emptyLabel = 'No messages',
  onJumpToMessage,
}) => {
  return (
    <AdModal opened={opened} onClose={onClose} title={title} size="md">
      <div className={styles.list}>
        {messages.length > 0 ? (
          messages.map((message) => (
            <DetailMessagePreviewRow
              key={message.id}
              message={message}
              showPin={showPin}
              onClick={() => {
                onJumpToMessage(message.id);
                onClose();
              }}
            />
          ))
        ) : (
          <p className={styles.empty}>{emptyLabel}</p>
        )}
      </div>
    </AdModal>
  );
};

export default MessageListDialog;
