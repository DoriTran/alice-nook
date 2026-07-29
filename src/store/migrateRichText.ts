import { migratePlainTextToRichText } from '@/packages/base/AdRichText/richtext';

type LegacyTextContent = { text: string };
type MigratedContent = ReturnType<typeof migratePlainTextToRichText>;

type MessageLike = {
  variant?: string;
  content?:
    | LegacyTextContent
    | MigratedContent
    | {
        items?: Array<{
          content?: LegacyTextContent | MigratedContent;
          [key: string]: unknown;
        }>;
      };
  [key: string]: unknown;
};

const migrateContentField = (
  content: LegacyTextContent | MigratedContent | null | undefined,
): MigratedContent => migratePlainTextToRichText(content);

const migrateMessage = <T extends MessageLike>(message: T): T => {
  if (!message?.content) {
    return message;
  }

  if (message.variant === 'todo') {
    const todoContent = message.content as {
      items?: Array<{ content?: LegacyTextContent | MigratedContent }>;
    };

    if (!todoContent.items) {
      return message;
    }

    return {
      ...message,
      content: {
        ...todoContent,
        items: todoContent.items.map((item) => ({
          ...item,
          content: migrateContentField(item.content),
        })),
      },
    };
  }

  return {
    ...message,
    content: migrateContentField(
      message.content as LegacyTextContent | MigratedContent,
    ),
  };
};

/** Migrate legacy `{ text }` message content to TipTap `{ json, preview }`. */
export const migrateDiaryRichTextState = <
  T extends { messages?: Record<string, MessageLike> },
>(
  state: T,
): T => {
  if (!state.messages) {
    return state;
  }

  const messages: Record<string, MessageLike> = {};

  for (const [id, message] of Object.entries(state.messages)) {
    messages[id] = migrateMessage(message);
  }

  return {
    ...state,
    messages,
  };
};
