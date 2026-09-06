import { faCheck, faXmark } from '@fortawesome/free-solid-svg-icons';
import {
  CircleSlash,
  ClipboardPaste,
  ClipboardX,
  FolderPlus,
  ImageUp,
  SendHorizontal,
  Sparkles,
  SquareCheckBig,
  Tickets,
  TimerReset,
  TextInitial,
  Video,
  type LucideIcon,
} from 'lucide-react';
import { useRef, type FC, type ReactNode } from 'react';

import type { MessageDecorator, MessageVariant } from '@/store/diary/type';

import { AdIcon, AdTooltip } from '@/packages/base';

import styles from './ActionDock.module.css';

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

  const hasTicket = decorators.some((d) => d.type === 'ticket');
  const hasTimer = decorators.some((d) => d.type === 'timer');
  const hasHeading = decorators.some((d) => d.type === 'heading');

  return (
    <div className={styles.root}>
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
              onClick={() => onToggleDecorator('heading')}
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
              onClick={() => onToggleDecorator('ticket')}
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
              onClick={() => onToggleDecorator('timer')}
            >
              <AdIcon icon={TimerReset} source="lucide" size={16} />
            </button>
          </AdTooltip>
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
              onClick={() => onVariantSwitch('todo')}
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
              onClick={() => onVariantSwitch('ai')}
            >
              <AdIcon icon={Sparkles} source="lucide" size={16} />
            </button>
          </AdTooltip>
        </div>
      </div>

      <div className={styles.rightActions}>
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
