import type { Editor, JSONContent } from '@tiptap/core';

import { create } from 'zustand';

export type SecretHydration = Record<string, JSONContent>;

type SecretRuntimeState = {
  hydrations: SecretHydration;
  cloudEnabled: boolean;
  source: 'local' | 'cloud';
  activeNestedEditor: {
    editor: Editor;
    parentEditor: Editor;
    secretId: string;
  } | null;
};

export const useSecretRuntime = create<SecretRuntimeState>()(() => ({
  hydrations: {},
  cloudEnabled: false,
  source: 'local',
  activeNestedEditor: null,
}));

export const mergeSecretHydrations = (hydrations?: SecretHydration) => {
  if (!hydrations) return;
  useSecretRuntime.setState((state) => ({
    hydrations: { ...state.hydrations, ...hydrations },
  }));
};

export const setSecretHydration = (secretId: string, fragment: JSONContent) =>
  useSecretRuntime.setState((state) => ({
    hydrations: { ...state.hydrations, [secretId]: fragment },
  }));

export const removeSecretHydration = (secretId: string) =>
  useSecretRuntime.setState((state) => {
    const { [secretId]: _removed, ...hydrations } = state.hydrations;
    return { hydrations };
  });

export const clearSecretHydrations = () =>
  useSecretRuntime.setState({ hydrations: {}, activeNestedEditor: null });

export const setActiveSecretEditor = (
  value: SecretRuntimeState['activeNestedEditor'],
) => useSecretRuntime.setState({ activeNestedEditor: value });

export const setCloudSecretEnabled = (cloudEnabled: boolean) =>
  useSecretRuntime.setState({ cloudEnabled });

export const setSecretRuntimeSource = (source: 'local' | 'cloud') =>
  useSecretRuntime.setState({ source });
