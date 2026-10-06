import {
  useEffect,
  useMemo,
  useState,
  type FC,
  type PropsWithChildren,
} from 'react';
import { createPortal } from 'react-dom';

import type { ColorId } from '@/packages/color';

import { ContentTagRuntimeProvider } from '@/packages/base';
import { resolveColor, tagStyles } from '@/packages/color';
import PalettePickerPopover from '@/packages/ui/PalettePicker/PalettePickerPopover';
import { useDiaryStore, useSettingsStore } from '@/store';

import styles from './ContentTagDiaryProvider.module.css';
import { getMessagePreviewText } from './MessagePanel/messagePanel.utils';

type Props = PropsWithChildren<{
  onNavigateChatbox?: (id: string) => void;
  onNavigateMessage?: (chatboxId: string, messageId: string) => void;
}>;
const ContentTagDiaryProvider: FC<Props> = ({
  children,
  onNavigateChatbox,
  onNavigateMessage,
}) => {
  const tags = useDiaryStore('tags');
  const chatboxes = useDiaryStore('chatboxes');
  const messages = useDiaryStore('messages');
  const customPalettes = useDiaryStore('customPalettes');
  const createTag = useDiaryStore('createTag');
  const updateTag = useDiaryStore('updateTag');
  const mode = useSettingsStore('mode');
  const [palette, setPalette] = useState<{
    tagId: string;
    left: number;
    top: number;
  } | null>(null);

  useEffect(() => {
    if (!palette) return;
    const close = () => setPalette(null);
    window.addEventListener('resize', close);
    window.addEventListener('scroll', close, true);
    return () => {
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [palette]);

  const value = useMemo(
    () => ({
      tags,
      createTag,
      updateTag,
      openTagPalette: (tagId: string, anchor: HTMLElement) => {
        const rect = anchor.getBoundingClientRect();
        setPalette({ tagId, left: rect.left, top: rect.top - 6 });
      },
      resolveTagStyle: (colorId: ColorId) =>
        tagStyles(resolveColor(colorId, mode, customPalettes)),
      references: {
        chatbox: Object.fromEntries(
          Object.values(chatboxes).map((chatbox) => [
            chatbox.id,
            {
              id: chatbox.id,
              label: chatbox.name,
              description: chatbox.description,
              archived: chatbox.archived,
            },
          ]),
        ),
        message: Object.fromEntries(
          Object.values(messages).map((message) => [
            message.id,
            {
              id: message.id,
              label: getMessagePreviewText(message),
              chatboxId: message.chatboxId,
              context:
                chatboxes[message.chatboxId]?.name ?? 'Chatbox unavailable',
              archived: message.archived,
            },
          ]),
        ),
      },
      navigateReference: (
        targetType: 'chatbox' | 'message',
        targetId: string,
        chatboxId?: string,
      ) => {
        if (targetType === 'chatbox') onNavigateChatbox?.(targetId);
        else if (chatboxId) onNavigateMessage?.(chatboxId, targetId);
      },
    }),
    [
      chatboxes,
      createTag,
      customPalettes,
      messages,
      mode,
      onNavigateChatbox,
      onNavigateMessage,
      tags,
      updateTag,
    ],
  );

  const activeTag = palette ? tags[palette.tagId] : undefined;

  return (
    <ContentTagRuntimeProvider value={value}>
      {children}
      {palette && activeTag && typeof document !== 'undefined'
        ? createPortal(
            <div
              className={styles.palette}
              style={{ left: palette.left, top: palette.top }}
              role="dialog"
              aria-label={`Color for #${activeTag.label}`}
            >
              <PalettePickerPopover
                value={activeTag.colorId}
                shades={['strong', 'soft']}
                stacked
                onChange={(colorId) =>
                  void updateTag(activeTag.id, { colorId })
                }
                onValueChange={() => undefined}
                onClose={() => setPalette(null)}
              />
            </div>,
            document.body,
          )
        : null}
    </ContentTagRuntimeProvider>
  );
};

export default ContentTagDiaryProvider;
