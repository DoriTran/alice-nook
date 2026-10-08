import {
  getMarkRange,
  type AnyExtension,
  type Editor,
  type JSONContent,
} from '@tiptap/core';
import TextAlign from '@tiptap/extension-text-align';
import { Fragment, type Node as ProseMirrorNode } from '@tiptap/pm/model';
import { NodeSelection } from '@tiptap/pm/state';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  AtSign,
  Bold,
  Copy,
  Eraser,
  Hash,
  Italic,
  Link2,
  Lock,
  Mail,
  Phone,
  Strikethrough,
  Underline,
  type LucideIcon,
} from 'lucide-react';

import type { ContentFeatureAnchor, ContentFeatureInvocation } from '../types';

import {
  ContentContactControlsExtension,
  ContentContactSuppressionExtension,
  ContentEmailExtension,
  ContentPhoneExtension,
  canToggleContentContact,
  contentContactSuppressionKey,
  createContentContactSuppressionMeta,
  getContentContactTarget,
  toggleContentContact,
  type ContentContactKind,
  type ContentContactMatch,
} from '../extensions/contentContact';
import {
  ContentCopyExtensions,
  serializeVisibleContentNode,
} from '../extensions/contentCopy';
import {
  ContentLinkControlsExtension,
  ContentLinkExtension,
} from '../extensions/contentLink';
import { secretPreviewText } from '../extensions/contentSecret/contentSecret.utils';
import { ContentSecretExtensions } from '../extensions/contentSecret/ContentSecretExtension';
import { useSecretRuntime } from '../extensions/contentSecret/secretRuntime';
import {
  ContentReferenceExtension,
  ContentTagExtension,
} from '../extensions/contentTag';
import {
  normalizeSpecialSelection,
  resolveContentSelection,
  type ContentEntityKind,
} from './contentSelectionResolver';

export type ContentFeatureId =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strike'
  | 'alignment'
  | 'tag'
  | 'reference'
  | 'link'
  | 'phone'
  | 'email'
  | 'secret'
  | 'copy'
  | 'clear-content';

export type ContentFeatureGroup =
  | 'formatting'
  | 'entities'
  | 'special'
  | 'clear';
export type ContentFeatureStatus = 'enabled' | 'planned';
export type ContentFeatureScope = 'inline' | 'block';
export type ContentFeatureControlBehavior = 'toggle' | 'action' | 'choice';
export type ContentFeaturePresentationGroup = ContentFeatureGroup | 'alignment';

export type ContentFeatureChoice = {
  value: string;
  label: string;
  icon: LucideIcon;
};

export type ContentFeatureContext = {
  variant: 'text' | 'todo' | 'column' | 'table' | 'ai';
};

export type ContentTriggerSpec = {
  character: '#' | '@';
  /** Phase-specific providers can reject contexts such as the @ in an email. */
  isAllowed?: (textBeforeCursor: string) => boolean;
};

export type ContentFeature = {
  id: ContentFeatureId;
  group: ContentFeatureGroup;
  label: string;
  description: string;
  icon: LucideIcon;
  status: ContentFeatureStatus;
  scope?: ContentFeatureScope;
  controlBehavior: ContentFeatureControlBehavior;
  presentationGroup?: ContentFeaturePresentationGroup;
  choices?: readonly ContentFeatureChoice[];
  quickAction?: boolean;
  isAvailable?: (context: ContentFeatureContext) => boolean;
  run?: (editor: Editor, invocation?: ContentFeatureInvocation) => boolean;
  isActive?: (editor: Editor) => boolean;
  extensions?: () => AnyExtension[];
  trigger?: ContentTriggerSpec;
  /** Semantic nodes can provide safe preview text in a later phase. */
  previewText?: (node: JSONContent) => string | undefined;
  clearToPlainText?: (node: JSONContent) => string | undefined;
  clearableMark?: string;
  requiresApplicableState?: boolean;
  getState?: (editor: Editor) => ContentFeatureActionState;
};

export type AlignmentValue = 'left' | 'center' | 'right';
export type ContentFeatureValue = string;

const ALIGNMENT_VALUES = ['left', 'center', 'right'] as const;

const getTargetParagraphAlignments = (editor: Editor): AlignmentValue[] => {
  const { doc, selection } = editor.state;
  const values: AlignmentValue[] = [];
  const addParagraph = (node: ProseMirrorNode) => {
    if (node.type.name !== 'paragraph') return;
    const alignment: unknown = node.attrs.textAlign;
    values.push(
      ALIGNMENT_VALUES.includes(alignment as AlignmentValue)
        ? (alignment as AlignmentValue)
        : 'left',
    );
  };

  if (selection.empty) {
    for (let depth = selection.$from.depth; depth >= 0; depth -= 1) {
      const node = selection.$from.node(depth);
      if (node.type.name === 'paragraph') {
        addParagraph(node);
        break;
      }
    }
    return values;
  }

  doc.nodesBetween(selection.from, selection.to, addParagraph);
  return values;
};

const getAlignmentState = (editor: Editor): ContentFeatureActionState => {
  const values = getTargetParagraphAlignments(editor);
  if (!values.length) return { enabled: false, active: false };
  const value = values.every((candidate) => candidate === values[0])
    ? values[0]
    : 'mixed';
  return { enabled: true, active: value !== 'left', value };
};

const setAlignment = (editor: Editor, value: string | undefined): boolean => {
  if (!ALIGNMENT_VALUES.includes(value as AlignmentValue)) return false;
  const state = getAlignmentState(editor);
  if (!state.enabled || (state.value === value && value !== 'left')) {
    return true;
  }
  return editor
    .chain()
    .focus()
    .setTextAlign(value as AlignmentValue)
    .run();
};

const FORMATTING_MARKS = [
  'bold',
  'italic',
  'underline',
  'strike',
  'code',
] as const;

const segmentHasMark = (
  editor: Editor,
  markName: string,
  from: number,
  to: number,
) => {
  let sawText = false;
  let allMarked = true;
  editor.state.doc.nodesBetween(from, to, (node) => {
    if (!node.isText) return;
    sawText = true;
    if (!node.marks.some((mark) => mark.type.name === markName))
      allMarked = false;
  });
  return sawText && allMarked;
};

const getFormattingState = (
  editor: Editor,
  markName: 'bold' | 'italic' | 'underline' | 'strike',
): ContentFeatureActionState => {
  const resolved = resolveContentSelection(editor.state);
  if (editor.state.selection.empty) {
    if (resolved.entities.length > 0) return { enabled: false, active: false };
    return { enabled: true, active: editor.isActive(markName) };
  }
  const eligible = resolved.eligibleFormattingSegments;
  return {
    enabled: eligible.length > 0,
    active:
      eligible.length > 0 &&
      eligible.every((segment) =>
        segmentHasMark(editor, markName, segment.from, segment.to),
      ),
  };
};

const toggleFormatting = (
  editor: Editor,
  markName: 'bold' | 'italic' | 'underline' | 'strike',
) => {
  const state = getFormattingState(editor, markName);
  if (!state.enabled) return false;
  if (editor.state.selection.empty)
    return editor
      .chain()
      .focus()
      [
        markName === 'bold'
          ? 'toggleBold'
          : markName === 'italic'
            ? 'toggleItalic'
            : markName === 'underline'
              ? 'toggleUnderline'
              : 'toggleStrike'
      ]()
      .run();
  const mark = editor.state.schema.marks[markName];
  if (!mark) return false;
  const resolved = resolveContentSelection(editor.state);
  const tr = editor.state.tr;
  resolved.eligibleFormattingSegments.forEach((segment) => {
    if (state.active) tr.removeMark(segment.from, segment.to, mark);
    else tr.addMark(segment.from, segment.to, mark.create());
  });
  editor.view.dispatch(tr.scrollIntoView());
  editor.view.focus();
  return true;
};

const stripFormatting = (editor: Editor, from: number, to: number) => {
  const tr = editor.state.tr;
  FORMATTING_MARKS.forEach((name) => {
    const mark = editor.state.schema.marks[name];
    if (mark) tr.removeMark(from, to, mark);
  });
  if (tr.steps.length) editor.view.dispatch(tr);
};

const entityPlainText = (editor: Editor, kind: ContentEntityKind) => {
  const resolved = resolveContentSelection(editor.state);
  const entity = resolved.exactEntity ?? resolved.entities[0];
  if (!entity || entity.kind !== kind) return false;
  if (kind === 'phone' || kind === 'email')
    return toggleContentContact(editor, kind);
  if (kind === 'link') {
    const mark = editor.state.schema.marks.link;
    if (!mark) return false;
    editor.view.dispatch(
      editor.state.tr.removeMark(entity.from, entity.to, mark).scrollIntoView(),
    );
    editor.view.focus();
    return true;
  }
  const node = editor.state.doc.nodeAt(entity.from);
  if (!node) return false;
  const text =
    kind === 'tag'
      ? `#${String(node.attrs.label ?? '')}`
      : `@${String(node.attrs.fallbackLabel ?? '')}`;
  editor.view.dispatch(
    editor.state.tr
      .replaceWith(entity.from, entity.to, editor.state.schema.text(text))
      .scrollIntoView(),
  );
  editor.view.focus();
  return true;
};

const runEntityAction = (
  editor: Editor,
  kind: ContentEntityKind,
  anchor?: ContentFeatureAnchor,
) => {
  const resolved = resolveContentSelection(editor.state);
  const current =
    resolved.exactEntity ??
    (editor.state.selection.empty && resolved.entities.length === 1
      ? resolved.entities[0]
      : undefined);
  if (current) return current.kind === kind && entityPlainText(editor, kind);
  if (resolved.entities.length > 0 || resolved.containsLineBreak) return false;
  if (!editor.state.selection.empty)
    stripFormatting(
      editor,
      editor.state.selection.from,
      editor.state.selection.to,
    );
  if (kind === 'tag') return editor.commands.openContentTagPicker();
  if (kind === 'reference')
    return editor.commands.openContentEntityPicker('reference');
  if (kind === 'link') return editor.commands.openContentLinkEditor(anchor);
  return toggleContentContact(editor, kind, anchor);
};

export const CONTENT_FEATURES: readonly ContentFeature[] = [
  {
    id: 'bold',
    group: 'formatting',
    scope: 'inline',
    controlBehavior: 'toggle',
    label: 'Bold',
    description: 'Make the selected text bold.',
    icon: Bold,
    status: 'enabled',
    run: (editor) => toggleFormatting(editor, 'bold'),
    getState: (editor) => getFormattingState(editor, 'bold'),
  },
  {
    id: 'italic',
    group: 'formatting',
    scope: 'inline',
    controlBehavior: 'toggle',
    label: 'Italic',
    description: 'Italicize the selected text.',
    icon: Italic,
    status: 'enabled',
    run: (editor) => toggleFormatting(editor, 'italic'),
    getState: (editor) => getFormattingState(editor, 'italic'),
  },
  {
    id: 'underline',
    group: 'formatting',
    scope: 'inline',
    controlBehavior: 'toggle',
    label: 'Underline',
    description: 'Underline the selected text.',
    icon: Underline,
    status: 'enabled',
    run: (editor) => toggleFormatting(editor, 'underline'),
    getState: (editor) => getFormattingState(editor, 'underline'),
  },
  {
    id: 'strike',
    group: 'formatting',
    scope: 'inline',
    controlBehavior: 'toggle',
    label: 'Strikethrough',
    description: 'Strike through the selected text.',
    icon: Strikethrough,
    status: 'enabled',
    run: (editor) => toggleFormatting(editor, 'strike'),
    getState: (editor) => getFormattingState(editor, 'strike'),
  },
  {
    id: 'alignment',
    group: 'formatting',
    presentationGroup: 'alignment',
    scope: 'block',
    controlBehavior: 'choice',
    label: 'Alignment',
    description: 'Align the current or selected paragraphs.',
    icon: AlignLeft,
    status: 'enabled',
    choices: [
      { value: 'left', label: 'Align Left', icon: AlignLeft },
      { value: 'center', label: 'Align Center', icon: AlignCenter },
      { value: 'right', label: 'Align Right', icon: AlignRight },
    ],
    run: (editor, invocation) => setAlignment(editor, invocation?.value),
    extensions: () => [
      TextAlign.configure({
        types: ['paragraph'],
        alignments: [...ALIGNMENT_VALUES],
      }),
    ],
    getState: getAlignmentState,
  },
  {
    id: 'tag',
    group: 'entities',
    controlBehavior: 'toggle',
    label: 'Tag',
    description: 'Insert a tag into your message.',
    icon: Hash,
    status: 'enabled',
    run: (editor) => runEntityAction(editor, 'tag'),
    extensions: () => [ContentTagExtension],
    trigger: { character: '#' },
    previewText: (node) =>
      node.type === 'contentTag' && typeof node.attrs?.label === 'string'
        ? `#${node.attrs.label}`
        : undefined,
    clearToPlainText: (node) =>
      node.type === 'contentTag' && typeof node.attrs?.label === 'string'
        ? `#${node.attrs.label}`
        : undefined,
  },
  {
    id: 'reference',
    group: 'entities',
    controlBehavior: 'toggle',
    label: 'Reference',
    description: 'Reference a Chatbox or Message.',
    icon: AtSign,
    status: 'enabled',
    run: (editor) => runEntityAction(editor, 'reference'),
    extensions: () => [ContentReferenceExtension],
    trigger: { character: '@' },
    previewText: (node) =>
      node.type === 'contentReference' &&
      typeof node.attrs?.fallbackLabel === 'string'
        ? `@${node.attrs.fallbackLabel}`
        : undefined,
    clearToPlainText: (node) =>
      node.type === 'contentReference' &&
      typeof node.attrs?.fallbackLabel === 'string'
        ? `@${node.attrs.fallbackLabel}`
        : undefined,
  },
  {
    id: 'link',
    group: 'entities',
    controlBehavior: 'toggle',
    label: 'Link',
    description: 'Create or edit a named link and its rich preview.',
    icon: Link2,
    status: 'enabled',
    run: (editor, invocation) =>
      runEntityAction(editor, 'link', invocation?.anchor),
    isActive: (editor) => editor.isActive('link'),
    extensions: () => [ContentLinkExtension, ContentLinkControlsExtension],
    clearableMark: 'link',
  },
  {
    id: 'phone',
    group: 'entities',
    controlBehavior: 'toggle',
    label: 'Phone',
    description: 'Convert a selected phone number to Phone Content.',
    icon: Phone,
    status: 'enabled',
    requiresApplicableState: true,
    run: (editor, invocation) =>
      runEntityAction(editor, 'phone', invocation?.anchor),
    isActive: (editor) => editor.isActive('contentPhone'),
    extensions: () => [
      ContentPhoneExtension,
      ContentContactSuppressionExtension,
      ContentContactControlsExtension,
    ],
    clearableMark: 'contentPhone',
  },
  {
    id: 'email',
    group: 'entities',
    controlBehavior: 'toggle',
    label: 'Email',
    description: 'Convert a selected email address to Email Content.',
    icon: Mail,
    status: 'enabled',
    requiresApplicableState: true,
    run: (editor, invocation) =>
      runEntityAction(editor, 'email', invocation?.anchor),
    isActive: (editor) => editor.isActive('contentEmail'),
    extensions: () => [ContentEmailExtension],
    clearableMark: 'contentEmail',
  },
  {
    id: 'secret',
    group: 'special',
    controlBehavior: 'toggle',
    label: 'Secret',
    description: 'Protect the selected content as an encrypted Secret.',
    icon: Lock,
    status: 'enabled',
    requiresApplicableState: true,
    run: (editor) => editor.commands.applyContentSecret(),
    extensions: () => ContentSecretExtensions,
    previewText: (node) =>
      node.type === 'secretContentInline' || node.type === 'secretContentBlock'
        ? secretPreviewText()
        : undefined,
    getState: (editor) => {
      const runtime = useSecretRuntime.getState();
      const sourceAvailable =
        runtime.source === 'local' || runtime.cloudEnabled;
      const resolved = resolveContentSelection(editor.state);
      if (resolved.explicitSpecial?.kind === 'secret') {
        const node = editor.state.doc.nodeAt(resolved.explicitSpecial.from);
        const available = Boolean(
          node && runtime.hydrations[String(node.attrs.secretId ?? '')],
        );
        return { enabled: available, active: true };
      }
      const normalized = normalizeSpecialSelection(editor.state);
      if (!sourceAvailable || normalized.from === normalized.to)
        return { enabled: false, active: false };
      const unavailableSecret = resolved.intersectingSpecials.some((range) => {
        if (range.kind !== 'secret') return false;
        const node = editor.state.doc.nodeAt(range.from);
        return !node || !runtime.hydrations[String(node.attrs.secretId ?? '')];
      });
      return {
        enabled:
          !unavailableSecret &&
          Boolean(
            editor.state.doc
              .textBetween(
                normalized.from,
                normalized.to,
                '\n',
                serializeVisibleContentNode,
              )
              .trim(),
          ),
        active: false,
      };
    },
  },
  {
    id: 'copy',
    group: 'special',
    controlBehavior: 'toggle',
    label: 'Copy',
    description: 'Make the selected content directly copyable.',
    icon: Copy,
    status: 'enabled',
    requiresApplicableState: true,
    run: (editor) => editor.commands.applyContentCopy(),
    extensions: () => ContentCopyExtensions,
    getState: (editor) => {
      const resolved = resolveContentSelection(editor.state);
      const active = resolved.specialAncestors.some(
        (range) => range.kind === 'copy',
      );
      const normalized = normalizeSpecialSelection(editor.state);
      return {
        active,
        enabled:
          active ||
          (normalized.from !== normalized.to &&
            Boolean(
              editor.state.doc
                .textBetween(
                  normalized.from,
                  normalized.to,
                  '\n',
                  serializeVisibleContentNode,
                )
                .trim(),
            )),
      };
    },
  },
  {
    id: 'clear-content',
    group: 'clear',
    controlBehavior: 'action',
    label: 'Clear content',
    description: 'Remove formatting and turn selected Content into plain text.',
    icon: Eraser,
    status: 'enabled',
    requiresApplicableState: true,
    run: (editor) => clearContent(editor),
    isActive: (editor) => canClearContent(editor),
  },
] as const;

const CLEARABLE_MARKS: readonly string[] = [
  'bold',
  'italic',
  'underline',
  'strike',
  'code',
  ...CONTENT_FEATURES.flatMap((feature) => feature.clearableMark ?? []),
];
const clearTextForNode = (node: JSONContent) => {
  for (const feature of CONTENT_FEATURES) {
    const text = feature.clearToPlainText?.(node);
    if (text !== undefined) return text;
  }
  return undefined;
};

export const canClearContent = (editor: Editor): boolean => {
  const { selection, doc, storedMarks } = editor.state;
  if (
    selection instanceof NodeSelection &&
    (selection.node.type.name === 'secretContentInline' ||
      selection.node.type.name === 'secretContentBlock')
  )
    return Boolean(
      useSecretRuntime.getState().hydrations[
        String(selection.node.attrs.secretId ?? '')
      ],
    );
  const resolved = resolveContentSelection(editor.state);
  if (
    (selection.empty
      ? resolved.specialAncestors
      : resolved.intersectingSpecials
    ).some((range) => range.kind === 'copy')
  )
    return true;
  if (selection.empty)
    return Boolean(
      storedMarks?.some((mark) =>
        CLEARABLE_MARKS.includes(mark.type.name as never),
      ) ||
      CLEARABLE_MARKS.some((mark) => editor.isActive(mark)) ||
      clearTextForNode(selection.$from.nodeAfter?.toJSON() ?? {}) !== undefined,
    );
  let applicable = false;
  doc.nodesBetween(selection.from, selection.to, (node) => {
    if (
      node.marks.some((mark) =>
        CLEARABLE_MARKS.includes(mark.type.name as never),
      ) ||
      clearTextForNode(node.toJSON()) !== undefined
    )
      applicable = true;
  });
  return applicable;
};

export const clearContent = (editor: Editor): boolean => {
  if (!canClearContent(editor)) return false;
  if (
    editor.state.selection instanceof NodeSelection &&
    (editor.state.selection.node.type.name === 'secretContentInline' ||
      editor.state.selection.node.type.name === 'secretContentBlock')
  ) {
    const { selection, schema } = editor.state;
    const secretId = String(selection.node.attrs.secretId ?? '');
    const fragment = useSecretRuntime.getState().hydrations[secretId];
    if (!fragment?.content) return false;
    const nodes = Fragment.fromJSON(schema, fragment.content);
    editor.view.dispatch(
      editor.state.tr
        .replaceWith(selection.from, selection.to, nodes)
        .scrollIntoView(),
    );
    editor.view.focus();
    return true;
  }
  const resolved = resolveContentSelection(editor.state);
  if (
    (editor.state.selection.empty
      ? resolved.specialAncestors
      : resolved.intersectingSpecials
    ).some((range) => range.kind === 'copy')
  ) {
    const cleared = editor.commands.removeContentCopy();
    if (cleared) editor.view.focus();
    return cleared;
  }
  const { selection } = editor.state;
  const originalDoc = editor.state.doc;
  const originalFrom = selection.from;
  const originalTo = selection.to;
  const { schema } = editor.state;
  let tr = editor.state.tr;
  tr = tr.setMeta('preventAutolink', true);
  const suppressedContacts: ContentContactMatch[] = [];
  const addSuppression = (
    kind: ContentContactKind,
    from: number,
    to: number,
  ) => {
    const text = originalDoc.textBetween(from, to, ' ');
    const normalized = getContentContactTarget(kind, text);
    if (normalized)
      suppressedContacts.push({ kind, from, to, text, normalized });
  };
  if (selection.empty) {
    tr = tr.setStoredMarks([]);
    for (const [kind, markName] of [
      ['phone', 'contentPhone'],
      ['email', 'contentEmail'],
    ] as const) {
      const mark = schema.marks[markName];
      const range = mark ? getMarkRange(selection.$from, mark) : undefined;
      if (range) {
        tr = tr.removeMark(range.from, range.to, mark);
        addSuppression(kind, range.from, range.to);
      }
    }
  } else {
    for (const name of CLEARABLE_MARKS) {
      const mark = schema.marks[name];
      if (mark) tr = tr.removeMark(originalFrom, originalTo, mark);
    }
    const replacements: Array<{ from: number; to: number; text: string }> = [];
    originalDoc.nodesBetween(originalFrom, originalTo, (node, pos) => {
      if (node.isText) {
        for (const [kind, markName] of [
          ['phone', 'contentPhone'],
          ['email', 'contentEmail'],
        ] as const) {
          if (node.marks.some((mark) => mark.type.name === markName)) {
            const from = Math.max(pos, originalFrom);
            const to = Math.min(pos + node.nodeSize, originalTo);
            if (from < to) addSuppression(kind, from, to);
          }
        }
      }
      const text = clearTextForNode(node.toJSON());
      if (
        text !== undefined &&
        pos >= originalFrom &&
        pos + node.nodeSize <= originalTo
      )
        replacements.push({ from: pos, to: pos + node.nodeSize, text });
      else if (
        node.isText &&
        node.marks.some((mark) => mark.type.name === 'link') &&
        pos >= originalFrom &&
        pos + node.nodeSize <= originalTo
      )
        replacements.push({
          from: pos,
          to: pos + node.nodeSize,
          text: node.text ?? '',
        });
    });
    replacements
      .sort((a, b) => b.from - a.from)
      .forEach(({ from, to, text }) => {
        tr = tr.replaceWith(from, to, schema.text(text));
      });
  }
  if (suppressedContacts.length)
    tr = tr.setMeta(
      contentContactSuppressionKey,
      createContentContactSuppressionMeta(suppressedContacts),
    );
  editor.view.dispatch(tr.scrollIntoView());
  editor.view.focus();
  return true;
};

export type ContentFeatureActionState = {
  enabled: boolean;
  active: boolean;
  value?: ContentFeatureValue;
};

export type ContentFeatureState = Partial<
  Record<ContentFeatureId, ContentFeatureActionState>
>;

export const getContentFeature = (
  id: ContentFeatureId,
): ContentFeature | undefined =>
  CONTENT_FEATURES.find((feature) => feature.id === id);

export const getContentExtensions = (): AnyExtension[] =>
  CONTENT_FEATURES.flatMap((feature) => feature.extensions?.() ?? []);

export const getContentPreviewText = (
  node: JSONContent,
): string | undefined => {
  for (const feature of CONTENT_FEATURES) {
    const preview = feature.previewText?.(node);
    if (preview !== undefined) return preview;
  }

  return undefined;
};

const getEntityState = (
  editor: Editor,
  id: ContentEntityKind,
): ContentFeatureActionState => {
  const resolved = resolveContentSelection(editor.state);
  const current =
    resolved.exactEntity ??
    (editor.state.selection.empty && resolved.entities.length === 1
      ? resolved.entities[0]
      : undefined);
  if (current)
    return { active: current.kind === id, enabled: current.kind === id };
  if (resolved.entities.length > 0 || resolved.containsLineBreak)
    return { active: false, enabled: false };
  const enabled =
    id === 'phone' || id === 'email'
      ? editor.state.selection.empty || canToggleContentContact(editor, id)
      : true;
  return {
    active: false,
    enabled,
  };
};

export const getContentFeatureState = (editor: Editor): ContentFeatureState =>
  Object.fromEntries(
    CONTENT_FEATURES.filter((feature) => feature.status === 'enabled').map(
      (feature) => {
        if (feature.getState) return [feature.id, feature.getState(editor)];
        if (['tag', 'reference', 'link', 'phone', 'email'].includes(feature.id))
          return [
            feature.id,
            getEntityState(editor, feature.id as ContentEntityKind),
          ];
        const active = feature.isActive?.(editor) ?? false;
        return [
          feature.id,
          {
            active: feature.requiresApplicableState ? false : active,
            enabled: feature.requiresApplicableState ? active : true,
          },
        ];
      },
    ),
  );

export const runContentFeature = (
  editor: Editor,
  id: ContentFeatureId,
  invocation?: ContentFeatureInvocation,
): boolean => {
  const feature = getContentFeature(id);
  if (!feature || feature.status !== 'enabled' || !feature.run) {
    return false;
  }

  return feature.run(editor, invocation);
};
