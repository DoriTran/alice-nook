import {
  createContext,
  useContext,
  type CSSProperties,
  type FC,
  type PropsWithChildren,
} from 'react';

import type { ColorId } from '@/packages/color/types';

export type ContentTagRecord = { id: string; label: string; colorId: ColorId };
export type ContentReferenceRecord = {
  id: string;
  label: string;
  chatboxId?: string;
  context?: string;
  description?: string;
  archived?: boolean;
};

export type ContentTagRuntimeValue = {
  tags: Record<string, ContentTagRecord>;
  createTag: (data: Partial<ContentTagRecord>) => Promise<string>;
  updateTag: (id: string, data: Partial<ContentTagRecord>) => Promise<void>;
  openTagPalette: (id: string, anchor: HTMLElement) => void;
  resolveTagStyle: (colorId: ColorId) => CSSProperties | undefined;
  references: {
    chatbox: Record<string, ContentReferenceRecord>;
    message: Record<string, ContentReferenceRecord>;
  };
  navigateReference: (
    targetType: 'chatbox' | 'message',
    targetId: string,
    chatboxId?: string,
  ) => void;
};

const EMPTY_RUNTIME: ContentTagRuntimeValue = {
  tags: {},
  createTag: () =>
    Promise.reject(new Error('Tag Content is not available here')),
  updateTag: () => Promise.resolve(),
  openTagPalette: () => undefined,
  resolveTagStyle: () => undefined,
  references: { chatbox: {}, message: {} },
  navigateReference: () => undefined,
};

const ContentTagRuntimeContext = createContext(EMPTY_RUNTIME);

export const ContentTagRuntimeProvider: FC<
  PropsWithChildren<{ value: ContentTagRuntimeValue }>
> = ({ value, children }) => (
  <ContentTagRuntimeContext.Provider value={value}>
    {children}
  </ContentTagRuntimeContext.Provider>
);

export const useContentTagRuntime = () => useContext(ContentTagRuntimeContext);
