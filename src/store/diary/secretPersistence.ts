import type { JSONContent } from '@tiptap/core';

import {
  decryptLocalSecret,
  encryptLocalSecret,
  mergeSecretHydrations,
  useSecretRuntime,
  type SecretAttrs,
} from '@/packages/base/AdRichText/extensions/contentSecret';

import type { Message } from './type';

const SECRET_TYPES = new Set(['secretContentInline', 'secretContentBlock']);

const transform = async (
  node: JSONContent,
  visitSecret: (node: JSONContent) => Promise<JSONContent>,
): Promise<JSONContent> => {
  if (SECRET_TYPES.has(node.type ?? '')) return visitSecret(node);
  return {
    ...node,
    ...(node.content
      ? {
          content: await Promise.all(
            node.content.map((item) => transform(item, visitSecret)),
          ),
        }
      : {}),
  };
};

export const encryptPendingLocalSecrets = async <
  T extends { content?: Message['content'] },
>(
  message: T,
): Promise<T> => {
  if (!message.content || !('json' in message.content)) return message;
  const hydrations = useSecretRuntime.getState().hydrations;
  const json = await transform(message.content.json, async (node) => {
    if (node.attrs?.ciphertext) return node;
    const secretId = String(node.attrs?.secretId ?? '');
    const fragment = hydrations[secretId];
    if (!fragment) throw new Error('LOCAL_SECRET_UNAVAILABLE');
    const attrs = await encryptLocalSecret(fragment, {
      secretId,
      displayLength: Number(node.attrs?.displayLength) || 0,
    });
    return { ...node, attrs };
  });
  return { ...message, content: { ...message.content, json } } as T;
};

export const hydrateLocalSecrets = async (
  messages: Record<string, Message>,
) => {
  const hydrated: Record<string, JSONContent> = {};
  const jobs: Promise<void>[] = [];
  const visit = (node: JSONContent) => {
    if (SECRET_TYPES.has(node.type ?? '') && node.attrs?.ciphertext) {
      const attrs = node.attrs as SecretAttrs;
      jobs.push(
        decryptLocalSecret(attrs)
          .then((fragment) => {
            hydrated[attrs.secretId] = fragment;
          })
          .catch(() => undefined),
      );
      return;
    }
    node.content?.forEach(visit);
  };
  Object.values(messages).forEach((message) => {
    if (message.variant === 'text' && 'json' in message.content)
      visit(message.content.json);
  });
  await Promise.all(jobs);
  mergeSecretHydrations(hydrated);
};
