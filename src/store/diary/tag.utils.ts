import type { Chatbox, Message, Tag } from './type';

export type TagStatistics = {
  tagId: string;
  messageCount: number;
  chatboxCount: number;
};

export const computeTagStatistics = (
  tags: Record<string, Tag>,
  messages: Record<string, Message>,
  _chatboxes: Record<string, Chatbox>,
): Record<string, TagStatistics> => {
  const stats: Record<string, TagStatistics> = {};

  Object.keys(tags).forEach((tagId) => {
    stats[tagId] = {
      tagId,
      messageCount: 0,
      chatboxCount: 0,
    };
  });

  const chatboxesByTag = new Map<string, Set<string>>();

  Object.values(messages).forEach((message) => {
    message.tagIds.forEach((tagId) => {
      const entry = stats[tagId];

      if (!entry) {
        return;
      }

      entry.messageCount += 1;

      let chatboxSet = chatboxesByTag.get(tagId);

      if (!chatboxSet) {
        chatboxSet = new Set();
        chatboxesByTag.set(tagId, chatboxSet);
      }

      chatboxSet.add(message.chatboxId);
    });
  });

  chatboxesByTag.forEach((chatboxSet, tagId) => {
    const entry = stats[tagId];

    if (entry) {
      entry.chatboxCount = chatboxSet.size;
    }
  });

  return stats;
};
