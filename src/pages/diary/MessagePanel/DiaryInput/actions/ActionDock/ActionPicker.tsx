import { Check, ChevronUp, type LucideIcon } from 'lucide-react';
import { useEffect, useId, useRef, type FC, type KeyboardEvent } from 'react';

import { AdIcon, AdPopover, AdTooltip } from '@/packages/base';

import styles from './ActionDock.module.css';

export type ActionPickerOption = {
  value: string;
  label: string;
  description: string;
  icon: LucideIcon;
  selected: boolean;
};

export type ActionPickerProps = {
  label: string;
  description: string;
  icon: LucideIcon;
  showIcon: boolean;
  options: ActionPickerOption[];
  active: boolean;
  multiple?: boolean;
  opened: boolean;
  onOpenChange: (opened: boolean) => void;
  onSelect: (value: string) => void;
};

const RichTooltip: FC<{ name: string; description: string }> = ({
  name,
  description,
}) => (
  <div className={styles.tooltipContent}>
    <span className={styles.tooltipName}>{name}</span>
    <span className={styles.tooltipDescription}>{description}</span>
  </div>
);

const ActionPicker: FC<ActionPickerProps> = ({
  label,
  description,
  icon,
  showIcon,
  options,
  active,
  multiple = false,
  opened,
  onOpenChange,
  onSelect,
}) => {
  const listboxId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!opened) return;
    const frame = window.requestAnimationFrame(() => {
      optionsRef.current
        ?.querySelector<HTMLButtonElement>('[role="option"]')
        ?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [opened]);

  const handleOptionsKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const optionButtons = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>(
        '[role="option"]',
      ),
    );
    const currentIndex = optionButtons.indexOf(
      document.activeElement as HTMLButtonElement,
    );
    let nextIndex: number | null = null;

    if (event.key === 'ArrowDown') {
      nextIndex = (currentIndex + 1) % optionButtons.length;
    } else if (event.key === 'ArrowUp') {
      nextIndex =
        (currentIndex - 1 + optionButtons.length) % optionButtons.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = optionButtons.length - 1;
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onOpenChange(false);
      triggerRef.current?.focus();
      return;
    }

    if (nextIndex != null && optionButtons[nextIndex]) {
      event.preventDefault();
      optionButtons[nextIndex].focus();
    }
  };

  return (
    <AdPopover
      opened={opened}
      onChange={onOpenChange}
      position="top"
      width={160}
      offset={6}
      withinPortal
      closeOnEscape
      targetPopupType="listbox"
      classNames={{ dropdown: styles.pickerDropdown }}
      anchor={
        <AdTooltip
          label={<RichTooltip name={label} description={description} />}
          position="top"
          withArrow={false}
          multiline
          disabled={opened}
          classNames={{ tooltip: styles.tooltip }}
        >
          <button
            ref={triggerRef}
            type="button"
            className={`${styles.compactTrigger} ${active ? styles.compactTriggerActive : ''}`}
            data-active={active || undefined}
            aria-label={label}
            aria-controls={listboxId}
            aria-expanded={opened}
            aria-haspopup="listbox"
            onClick={() => onOpenChange(!opened)}
          >
            <span
              className={`${styles.pickerTriggerIcon} ${showIcon ? styles.pickerTriggerIconVisible : ''}`}
              aria-hidden
            >
              <AdIcon icon={icon} source="lucide" size={16} />
            </span>
            <span className={styles.pickerTriggerLabel}>{label}</span>
            <span className={styles.pickerChevron} aria-hidden>
              <AdIcon icon={ChevronUp} source="lucide" size={13} />
            </span>
          </button>
        </AdTooltip>
      }
    >
      <div
        ref={optionsRef}
        id={listboxId}
        className={styles.pickerOptions}
        role="listbox"
        tabIndex={-1}
        aria-label={`${label} options`}
        aria-multiselectable={multiple || undefined}
        onKeyDown={handleOptionsKeyDown}
      >
        {options.map((option) => (
          <AdTooltip
            key={option.value}
            label={
              <RichTooltip
                name={option.label}
                description={option.description}
              />
            }
            position="left"
            withArrow={false}
            multiline
            classNames={{ tooltip: styles.tooltip }}
          >
            <button
              type="button"
              role="option"
              aria-selected={option.selected}
              className={styles.pickerOption}
              data-selected={option.selected || undefined}
              onClick={() => {
                onSelect(option.value);
                if (!multiple) onOpenChange(false);
              }}
            >
              <span className={styles.pickerOptionIcon} aria-hidden>
                <AdIcon icon={option.icon} source="lucide" size={16} />
              </span>
              <span className={styles.pickerOptionLabel}>{option.label}</span>
              <span className={styles.pickerOptionCheck} aria-hidden>
                {option.selected ? (
                  <AdIcon icon={Check} source="lucide" size={14} />
                ) : null}
              </span>
            </button>
          </AdTooltip>
        ))}
      </div>
    </AdPopover>
  );
};

export default ActionPicker;
