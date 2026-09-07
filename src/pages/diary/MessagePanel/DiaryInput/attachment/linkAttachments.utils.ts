import type { Attachment, LinkAttachment } from '@/store/diary/type';

export const isLinkAttachment = (
  attachment: Attachment,
): attachment is LinkAttachment => attachment.type === 'link';
