import { faCheck, faXmark } from '@fortawesome/free-solid-svg-icons';
import {
  CircleSlash,
  Columns3,
  ChevronUp,
  ClipboardPaste,
  ClipboardX,
  FolderPlus,
  ImageUp,
  MessageCirclePlus,
  SendHorizontal,
  Sparkles,
  SquareCheckBig,
  StarPlus,
  Tickets,
  TimerReset,
  TextInitial,
  TextCursorInput,
  Table2,
  Video,
  type LucideIcon,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FC,
  type ReactNode,
} from 'react';

import type { MessageDecorator, MessageVariant } from '@/store/diary/type';

import {
  AdIcon,
  AdTooltip,
  CONTENT_FEATURES,
  type ContentFeatureId,
  type ContentFeatureState,
} from '@/packages/base';

import styles from './ActionDock.module.css';
import ActionPicker, { type ActionPickerOption } from './ActionPicker';

export type ActionDockProps = {
  variant: MessageVariant;
  decorators: MessageDecorator[];
  canSend: boolean;
  canClear: boolean;
  editing?: boolean;
  onClear: () => void;
  onAddFiles: (
    files: FileList | File[],
    kind: 'file' | 'image' | 'video',
  ) => void;
  onToggleDecorator: (type: MessageDecorator['type']) => void;
  onVariantSwitch: (variant: MessageVariant) => void;
  contentShelfOpen: boolean;
  contentAvailable: boolean;
  contentFeatureState: ContentFeatureState;
  onContentShelfOpenChange: (opened: boolean) => void;
  onRunContentFeature: (id: ContentFeatureId) => void;
  reactionPicker?: ReactNode;
  onSend: () => void;
  onCancelEdit?: () => void;
  onConfirmEdit?: () => void;
  hasCopiedMessage?: boolean;
  onClearCopiedMessage?: () => void;
  onPasteCopiedMessage?: () => void;
};

type ActionButtonProps = {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  activeClassName?: string;
  disabled?: boolean;
  send?: boolean;
  onClick: () => void;
};

const ActionButton: FC<ActionButtonProps> = ({
  icon,
  label,
  active = false,
  activeClassName = '',
  disabled = false,
  send = false,
  onClick,
}) => (
  <AdTooltip
    label={label}
    position="top"
    withArrow={false}
    classNames={{ tooltip: styles.tooltip }}
  >
    <button
      type="button"
      className={`${styles.btn} ${active ? activeClassName : ''} ${send ? styles.sendBtn : ''}`}
      aria-label={label}
      aria-pressed={active || undefined}
      disabled={disabled}
      onClick={onClick}
    >
      <AdIcon icon={icon} source="lucide" size={16} />
    </button>
  </AdTooltip>
);

type RichTooltipProps = {
  name: string;
  description: string;
};

const RichTooltip: FC<RichTooltipProps> = ({ name, description }) => (
  <div className={styles.tooltipContent}>
    <span className={styles.tooltipName}>{name}</span>
    <span className={styles.tooltipDescription}>{description}</span>
  </div>
);

type ActionDockLayout = 'expanded' | 'compact' | 'compact-text';
type CharmId = MessageDecorator['type'];

const CHARM_DESCRIPTION =
  'Add optional behavior or decoration. You can select more than one.';
const VARIANT_DESCRIPTION =
  'Change the main structure and editor used by this message.';

const getSelectedCharmIds = (decorators: MessageDecorator[]): CharmId[] =>
  decorators.map((decorator) => decorator.type);

const ActionDock: FC<ActionDockProps> = ({
  variant,
  decorators,
  canSend,
  canClear,
  editing = false,
  onClear,
  onAddFiles,
  onToggleDecorator,
  onVariantSwitch,
  contentShelfOpen,
  contentAvailable,
  contentFeatureState,
  onContentShelfOpenChange,
  onRunContentFeature,
  reactionPicker,
  onSend,
  onCancelEdit,
  onConfirmEdit,
  hasCopiedMessage = false,
  onClearCopiedMessage,
  onPasteCopiedMessage,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const rightActionsRef = useRef<HTMLDivElement>(null);
  const expandedMeasureRef = useRef<HTMLDivElement>(null);
  const compactMeasureRef = useRef<HTMLDivElement>(null);
  const compactTextMeasureRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<ActionDockLayout>('expanded');
  const [charmPickerOpen, setCharmPickerOpen] = useState(false);
  const [variantPickerOpen, setVariantPickerOpen] = useState(false);
  const [charmHistory, setCharmHistory] = useState<CharmId[]>([]);

  const hasTicket = decorators.some((d) => d.type === 'ticket');
  const hasTimer = decorators.some((d) => d.type === 'timer');
  const hasHeading = decorators.some((d) => d.type === 'heading');

  const selectedCharmIds = useMemo(
    () => getSelectedCharmIds(decorators),
    [decorators],
  );

  useEffect(() => {
    setCharmHistory((current) => {
      const retained = current.filter((id) => selectedCharmIds.includes(id));
      const missing = selectedCharmIds.filter((id) => !retained.includes(id));
      const next = [...retained, ...missing];
      return next.length === current.length &&
        next.every((id, index) => id === current[index])
        ? current
        : next;
    });
  }, [selectedCharmIds]);

  useEffect(() => {
    setCharmPickerOpen(false);
    setVariantPickerOpen(false);
  }, [layout]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const right = rightActionsRef.current;
    const expanded = expandedMeasureRef.current;
    const compact = compactMeasureRef.current;
    const compactText = compactTextMeasureRef.current;
    if (!root || !right || !expanded || !compact || !compactText) return;

    let frame = 0;
    const measure = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const gap = Number.parseFloat(getComputedStyle(root).columnGap) || 0;
        const available = root.clientWidth - right.offsetWidth - gap - 8;
        const nextLayout: ActionDockLayout =
          expanded.offsetWidth <= available
            ? 'expanded'
            : compact.offsetWidth <= available
              ? 'compact'
              : 'compact-text';
        setLayout((current) => (current === nextLayout ? current : nextLayout));
      });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    observer.observe(right);
    observer.observe(expanded);
    observer.observe(compact);
    observer.observe(compactText);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  const handleCharmToggle = useCallback(
    (id: CharmId) => {
      const selected = selectedCharmIds.includes(id);
      setCharmHistory((current) =>
        selected
          ? current.filter((item) => item !== id)
          : [...current.filter((item) => item !== id), id],
      );
      onToggleDecorator(id);
    },
    [onToggleDecorator, selectedCharmIds],
  );

  const charmOptions = useMemo<ActionPickerOption[]>(
    () => [
      {
        value: 'heading',
        label: 'Heading',
        description: 'Add a title and optional description.',
        icon: TextInitial,
        selected: hasHeading,
      },
      {
        value: 'ticket',
        label: 'Ticket',
        description: 'Turn your message into a ticket.',
        icon: Tickets,
        selected: hasTicket,
      },
      {
        value: 'timer',
        label: 'Timer',
        description: 'Add timing controls to your message.',
        icon: TimerReset,
        selected: hasTimer,
      },
    ],
    [hasHeading, hasTicket, hasTimer],
  );

  const variantOptions = useMemo<ActionPickerOption[]>(
    () => [
      {
        value: 'todo',
        label: 'Todo',
        description: 'Write your message as a checklist.',
        icon: SquareCheckBig,
        selected: variant === 'todo',
      },
      {
        value: 'ai',
        label: 'AI',
        description: 'Ask AI to help write your message.',
        icon: Sparkles,
        selected: variant === 'ai',
      },
      {
        value: 'column',
        label: 'Column',
        description: 'Arrange rich content in responsive columns.',
        icon: Columns3,
        selected: variant === 'column',
      },
      {
        value: 'table',
        label: 'Table',
        description: 'Organize rich content and attachments in a table.',
        icon: Table2,
        selected: variant === 'table',
      },
    ],
    [variant],
  );

  const activeCharmId = [...charmHistory]
    .reverse()
    .find((id) => selectedCharmIds.includes(id));
  const activeCharmIcon =
    charmOptions.find((option) => option.value === activeCharmId)?.icon ??
    StarPlus;
  const activeVariantIcon =
    variantOptions.find((option) => option.value === variant)?.icon ??
    MessageCirclePlus;

  const handleVariantSelect = (nextVariant: MessageVariant) => {
    onVariantSwitch(nextVariant === variant ? 'text' : nextVariant);
  };

  const handleContentShelfToggle = () => {
    if (!contentAvailable) return;
    const nextOpened = !contentShelfOpen;
    setCharmPickerOpen(false);
    setVariantPickerOpen(false);
    onContentShelfOpenChange(nextOpened);
  };

  const contentTooltip = contentAvailable
    ? 'Open Content tools for formatting and inline content.'
    : 'Content tools are available for Normal messages in Phase 1.';
  const contentQuickActions = CONTENT_FEATURES.filter(
    (feature) => feature.status === 'enabled' && feature.quickAction,
  );

  return (
    <div ref={rootRef} className={styles.root} data-layout={layout}>
      {layout === 'expanded' ? (
        <div className={styles.leftActions}>
          <div className={styles.group}>
            <ActionButton
              icon={FolderPlus}
              label="Upload attachment"
              onClick={() => fileInputRef.current?.click()}
            />
            <ActionButton
              icon={ImageUp}
              label="Upload image"
              onClick={() => imageInputRef.current?.click()}
            />
            <ActionButton
              icon={Video}
              label="Upload video"
              onClick={() => videoInputRef.current?.click()}
            />
          </div>

          <span className={styles.divider} aria-hidden />

          <div className={styles.group}>
            <AdTooltip
              label={
                <RichTooltip
                  name="Todo"
                  description="Write your message as a checklist."
                />
              }
              position="top"
              withArrow={false}
              multiline
              classNames={{ tooltip: styles.tooltip }}
            >
              <button
                type="button"
                className={`${styles.btn} ${variant === 'todo' ? styles.btnActive : ''}`}
                aria-label="Todo variant"
                aria-pressed={variant === 'todo'}
                onClick={() => handleVariantSelect('todo')}
              >
                <AdIcon icon={SquareCheckBig} source="lucide" size={16} />
              </button>
            </AdTooltip>
            <AdTooltip
              label={
                <RichTooltip
                  name="AI"
                  description="Ask AI to help write your message."
                />
              }
              position="top"
              withArrow={false}
              multiline
              classNames={{ tooltip: styles.tooltip }}
            >
              <button
                type="button"
                className={`${styles.btn} ${variant === 'ai' ? styles.btnActive : ''}`}
                aria-label="AI variant"
                aria-pressed={variant === 'ai'}
                onClick={() => handleVariantSelect('ai')}
              >
                <AdIcon icon={Sparkles} source="lucide" size={16} />
              </button>
            </AdTooltip>
            <AdTooltip
              label={
                <RichTooltip
                  name="Column"
                  description="Arrange rich content in responsive columns."
                />
              }
              position="top"
              withArrow={false}
              multiline
              classNames={{ tooltip: styles.tooltip }}
            >
              <button
                type="button"
                className={`${styles.btn} ${variant === 'column' ? styles.btnActive : ''}`}
                aria-label="Column variant"
                aria-pressed={variant === 'column'}
                onClick={() => handleVariantSelect('column')}
              >
                <AdIcon icon={Columns3} source="lucide" size={16} />
              </button>
            </AdTooltip>
            <AdTooltip
              label={
                <RichTooltip
                  name="Table"
                  description="Organize rich content and attachments in a table."
                />
              }
              position="top"
              withArrow={false}
              multiline
              classNames={{ tooltip: styles.tooltip }}
            >
              <button
                type="button"
                className={`${styles.btn} ${variant === 'table' ? styles.btnActive : ''}`}
                aria-label="Table variant"
                aria-pressed={variant === 'table'}
                onClick={() => handleVariantSelect('table')}
              >
                <AdIcon icon={Table2} source="lucide" size={16} />
              </button>
            </AdTooltip>
          </div>

          <span className={styles.divider} aria-hidden />

          <div className={styles.group}>
            <AdTooltip
              label={
                <RichTooltip
                  name="Heading"
                  description="Add a title and optional description."
                />
              }
              position="top"
              withArrow={false}
              multiline
              classNames={{ tooltip: styles.tooltip }}
            >
              <button
                type="button"
                className={`${styles.btn} ${hasHeading ? styles.btnActive : ''}`}
                aria-label="Heading charm"
                aria-pressed={hasHeading}
                onClick={() => handleCharmToggle('heading')}
              >
                <AdIcon icon={TextInitial} source="lucide" size={16} />
              </button>
            </AdTooltip>
            <AdTooltip
              label={
                <RichTooltip
                  name="Ticket"
                  description="Turn your message into a ticket."
                />
              }
              position="top"
              withArrow={false}
              multiline
              classNames={{ tooltip: styles.tooltip }}
            >
              <button
                type="button"
                className={`${styles.btn} ${hasTicket ? styles.btnActive : ''}`}
                aria-label="Ticket charm"
                aria-pressed={hasTicket}
                onClick={() => handleCharmToggle('ticket')}
              >
                <AdIcon icon={Tickets} source="lucide" size={16} />
              </button>
            </AdTooltip>
            <AdTooltip
              label={
                <RichTooltip
                  name="Timer"
                  description="Add timing controls to your message."
                />
              }
              position="top"
              withArrow={false}
              multiline
              classNames={{ tooltip: styles.tooltip }}
            >
              <button
                type="button"
                className={`${styles.btn} ${hasTimer ? styles.btnActive : ''}`}
                aria-label="Timer charm"
                aria-pressed={hasTimer}
                onClick={() => handleCharmToggle('timer')}
              >
                <AdIcon icon={TimerReset} source="lucide" size={16} />
              </button>
            </AdTooltip>
          </div>

          <span className={styles.divider} aria-hidden />

          <div className={styles.group}>
            <AdTooltip
              label={
                <RichTooltip name="Content" description={contentTooltip} />
              }
              position="top"
              withArrow={false}
              multiline
              classNames={{ tooltip: styles.tooltip }}
            >
              <button
                type="button"
                className={`${styles.btn} ${contentShelfOpen ? styles.btnActive : ''}`}
                aria-label="Content"
                aria-expanded={contentShelfOpen}
                aria-disabled={!contentAvailable}
                data-unavailable={!contentAvailable || undefined}
                onClick={handleContentShelfToggle}
              >
                <AdIcon icon={TextCursorInput} source="lucide" size={16} />
              </button>
            </AdTooltip>
            {contentQuickActions.map((feature) => (
              <ActionButton
                key={feature.id}
                icon={feature.icon}
                label={feature.description}
                active={Boolean(contentFeatureState[feature.id]?.active)}
                activeClassName={styles.btnActive}
                disabled={
                  !contentAvailable ||
                  contentFeatureState[feature.id]?.enabled === false
                }
                onClick={() => onRunContentFeature(feature.id)}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className={styles.compactActions}>
          <ActionButton
            icon={FolderPlus}
            label="Upload attachment"
            onClick={() => fileInputRef.current?.click()}
          />
          <ActionPicker
            label="Variant"
            description={VARIANT_DESCRIPTION}
            icon={activeVariantIcon}
            showIcon={layout === 'compact'}
            options={variantOptions}
            active={variant !== 'text'}
            opened={variantPickerOpen}
            onOpenChange={(opened) => {
              setVariantPickerOpen(opened);
              if (opened) {
                setCharmPickerOpen(false);
                onContentShelfOpenChange(false);
              }
            }}
            onSelect={(value) => handleVariantSelect(value as MessageVariant)}
          />
          <ActionPicker
            label="Charm"
            description={CHARM_DESCRIPTION}
            icon={activeCharmIcon}
            showIcon={layout === 'compact'}
            options={charmOptions}
            active={selectedCharmIds.length > 0}
            multiple
            opened={charmPickerOpen}
            onOpenChange={(opened) => {
              setCharmPickerOpen(opened);
              if (opened) {
                setVariantPickerOpen(false);
                onContentShelfOpenChange(false);
              }
            }}
            onSelect={(value) => handleCharmToggle(value as CharmId)}
          />
          <AdTooltip
            label={<RichTooltip name="Content" description={contentTooltip} />}
            position="top"
            withArrow={false}
            multiline
            classNames={{ tooltip: styles.tooltip }}
          >
            <button
              type="button"
              className={`${styles.btn} ${contentShelfOpen ? styles.btnActive : ''}`}
              aria-label="Content"
              aria-expanded={contentShelfOpen}
              aria-disabled={!contentAvailable}
              data-unavailable={!contentAvailable || undefined}
              onClick={handleContentShelfToggle}
            >
              <AdIcon icon={TextCursorInput} source="lucide" size={16} />
            </button>
          </AdTooltip>
          {contentQuickActions.map((feature) => (
            <ActionButton
              key={feature.id}
              icon={feature.icon}
              label={feature.description}
              active={Boolean(contentFeatureState[feature.id]?.active)}
              activeClassName={styles.btnActive}
              disabled={
                !contentAvailable ||
                contentFeatureState[feature.id]?.enabled === false
              }
              onClick={() => onRunContentFeature(feature.id)}
            />
          ))}
        </div>
      )}

      <div ref={rightActionsRef} className={styles.rightActions}>
        <ActionButton
          icon={CircleSlash}
          label="Clear message"
          disabled={!canClear}
          onClick={onClear}
        />

        <span className={styles.divider} aria-hidden />

        <div className={styles.group}>{reactionPicker}</div>

        <span className={styles.divider} aria-hidden />

        {editing ? (
          <div className={styles.editActions}>
            <span className={styles.editLabel}>Edit Message</span>
            <AdTooltip
              label="Cancel edit"
              position="top"
              withArrow={false}
              classNames={{ tooltip: styles.tooltip }}
            >
              <button
                type="button"
                className={styles.btn}
                aria-label="Cancel edit"
                onClick={onCancelEdit}
              >
                <AdIcon icon={faXmark} size={14} />
              </button>
            </AdTooltip>
            <AdTooltip
              label="Save changes"
              position="top"
              withArrow={false}
              classNames={{ tooltip: styles.tooltip }}
            >
              <button
                type="button"
                className={`${styles.btn} ${styles.sendBtn}`}
                aria-label="Save changes"
                disabled={!canSend}
                onClick={onConfirmEdit}
              >
                <AdIcon icon={faCheck} size={14} />
              </button>
            </AdTooltip>
          </div>
        ) : (
          <>
            {hasCopiedMessage ? (
              <>
                <ActionButton
                  icon={ClipboardX}
                  label="Clear paste"
                  onClick={() => onClearCopiedMessage?.()}
                />
                <ActionButton
                  icon={ClipboardPaste}
                  label="Paste copied message"
                  onClick={() => onPasteCopiedMessage?.()}
                />
                <span className={styles.divider} aria-hidden />
              </>
            ) : null}
            <ActionButton
              icon={SendHorizontal}
              label="Send message"
              disabled={!canSend}
              send
              onClick={onSend}
            />
          </>
        )}
      </div>

      <div className={styles.measureLayer} aria-hidden>
        <div ref={expandedMeasureRef} className={styles.measureCandidate}>
          <span className={styles.group}>
            <span className={styles.btn} />
            <span className={styles.btn} />
            <span className={styles.btn} />
          </span>
          <span className={styles.divider} />
          <span className={styles.group}>
            <span className={styles.btn} />
            <span className={styles.btn} />
          </span>
          <span className={styles.divider} />
          <span className={styles.group}>
            {charmOptions.map((option) => (
              <span key={option.value} className={styles.btn} />
            ))}
          </span>
          <span className={styles.divider} />
          <span className={styles.group}>
            <span className={styles.btn} />
            {contentQuickActions.map((feature) => (
              <span key={feature.id} className={styles.btn} />
            ))}
          </span>
        </div>
        <div
          ref={compactMeasureRef}
          className={styles.measureCandidate}
          data-compact
        >
          <span className={styles.btn} />
          <span className={styles.compactTrigger}>
            <AdIcon icon={MessageCirclePlus} source="lucide" size={16} />
            <span>Variant</span>
            <AdIcon icon={ChevronUp} source="lucide" size={13} />
          </span>
          <span className={styles.compactTrigger}>
            <AdIcon icon={StarPlus} source="lucide" size={16} />
            <span>Charm</span>
            <AdIcon icon={ChevronUp} source="lucide" size={13} />
          </span>
          <span className={styles.btn} />
          {contentQuickActions.map((feature) => (
            <span key={feature.id} className={styles.btn} />
          ))}
        </div>
        <div
          ref={compactTextMeasureRef}
          className={styles.measureCandidate}
          data-compact
        >
          <span className={styles.btn} />
          <span className={styles.compactTrigger}>
            <span>Variant</span>
            <AdIcon icon={ChevronUp} source="lucide" size={13} />
          </span>
          <span className={styles.compactTrigger}>
            <span>Charm</span>
            <AdIcon icon={ChevronUp} source="lucide" size={13} />
          </span>
          <span className={styles.btn} />
          {contentQuickActions.map((feature) => (
            <span key={feature.id} className={styles.btn} />
          ))}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className={styles.hiddenInput}
        multiple
        onChange={(event) => {
          if (event.target.files?.length) {
            onAddFiles(event.target.files, 'file');
            event.target.value = '';
          }
        }}
      />
      <input
        ref={imageInputRef}
        type="file"
        className={styles.hiddenInput}
        accept="image/*"
        multiple
        onChange={(event) => {
          if (event.target.files?.length) {
            onAddFiles(event.target.files, 'image');
            event.target.value = '';
          }
        }}
      />
      <input
        ref={videoInputRef}
        type="file"
        className={styles.hiddenInput}
        accept="video/*"
        multiple
        onChange={(event) => {
          if (event.target.files?.length) {
            onAddFiles(event.target.files, 'video');
            event.target.value = '';
          }
        }}
      />
    </div>
  );
};

export default ActionDock;
