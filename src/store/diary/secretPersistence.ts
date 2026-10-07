import type { JSONContent } from '@tiptap/core';

import {
  decryptLocalSecret,
  encryptLocalSecret,
  mergeSecretHydrations,
  useSecretRuntime,
  type SecretAttrs,
} from '@/packages/base/AdRichText/extensions/contentSecret';

import type { Message, TableRow } from './type';

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
  if (!message.content) return message;
  const hydrations = useSecretRuntime.getState().hydrations;
  const encryptNode = async (node: JSONContent) => {
    if (node.attrs?.ciphertext) return node;
    const secretId = String(node.attrs?.secretId ?? '');
    const fragment = hydrations[secretId];
    if (!fragment) throw new Error('LOCAL_SECRET_UNAVAILABLE');
    const attrs = await encryptLocalSecret(fragment, {
      secretId,
      displayLength: Number(node.attrs?.displayLength) || 0,
    });
    return { ...node, attrs };
  };
  if ('json' in message.content) {
    const json = await transform(message.content.json, encryptNode);
    return { ...message, content: { ...message.content, json } } as T;
  }
  if ('items' in message.content) {
    const items = await Promise.all(
      message.content.items.map(async (item) => ({
        ...item,
        content: {
          ...item.content,
          json: await transform(item.content.json, encryptNode),
        },
      })),
    );
    return { ...message, content: { ...message.content, items } } as T;
  }
  if ('rows' in message.content) {
    const rows = await Promise.all(
      message.content.rows.map(async (row) => ({
        ...row,
        cells: Object.fromEntries(
          await Promise.all(
            Object.entries(row.cells).map(async ([id, cell]) => [
              id,
              cell?.kind === 'richText'
                ? {
                    ...cell,
                    content: {
                      ...cell.content,
                      json: await transform(cell.content.json, encryptNode),
                    },
                  }
                : cell,
            ]),
          ),
        ) as TableRow['cells'],
      })),
    );
    return { ...message, content: { ...message.content, rows } } as T;
  }
  {
    const columns = await Promise.all(
      message.content.columns.map(async (column) => ({
        ...column,
        content: {
          ...column.content,
          json: await transform(column.content.json, encryptNode),
        },
      })),
    );
    return { ...message, content: { ...message.content, columns } } as T;
  }
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
    if (message.variant === 'text' || message.variant === 'ai') {
      visit(message.content.json);
    } else if (message.variant === 'todo') {
      message.content.items.forEach((item) => visit(item.content.json));
    } else if (message.variant === 'column') {
      message.content.columns.forEach((column) => visit(column.content.json));
    } else {
      message.content.rows.forEach((row) =>
        Object.values(row.cells).forEach((cell) => {
          if (cell?.kind === 'richText') visit(cell.content.json);
        }),
      );
    }
  });
  await Promise.all(jobs);
  mergeSecretHydrations(hydrated);
};
