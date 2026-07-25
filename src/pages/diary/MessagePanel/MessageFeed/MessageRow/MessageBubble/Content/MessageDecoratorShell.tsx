import type { FC, ReactNode } from 'react';

import type { MessageDecorator } from '@/store/diary/type';

import { useDiaryStore } from '@/store';

import { decorator, input } from '../../../../DiaryInput';

const { DecoratedSurface } = decorator;

export type MessageDecoratorShellProps = {
  messageId: string;
  decorators: MessageDecorator[];
  attached?: boolean;
  /** When false, jump-to highlight targets attachments instead of an empty shell. */
  messageSurface?: boolean;
  children: ReactNode;
};

const MessageDecoratorShell: FC<MessageDecoratorShellProps> = ({
  messageId,
  decorators,
  attached = false,
  messageSurface = true,
  children,
}) => {
  const patchMessage = useDiaryStore('patchMessage');

  const updateDecorator = (index: number, decoration: MessageDecorator) => {
    patchMessage(messageId, {
      decorators: decorators.map((item, itemIndex) =>
        itemIndex === index ? decoration : item,
      ),
    });
  };

  const updateDraft = (
    updater: (
      draft: ReturnType<typeof input.createInitialDraft>,
    ) => ReturnType<typeof input.createInitialDraft>,
  ) => {
    const next = updater({
      ...input.createInitialDraft(),
      decorators,
    });

    if (next.decorators !== decorators) {
      patchMessage(messageId, { decorators: next.decorators });
    }
  };

  if (decorators.length === 0) {
    return <>{children}</>;
  }

  return (
    <DecoratedSurface
      draft={{ ...input.createInitialDraft(), decorators }}
      composing={false}
      attached={attached}
      messageSurface={messageSurface}
      updateDecorator={updateDecorator}
      updateDraft={updateDraft}
    >
      {children}
    </DecoratedSurface>
  );
};

export default MessageDecoratorShell;
