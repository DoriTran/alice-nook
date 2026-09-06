import clsx from 'clsx';
import {
  createElement,
  useEffect,
  useState,
  type CSSProperties,
  type FC,
} from 'react';

import type { HeadingDecorator, HeadingLevel } from '@/store/diary/type';

import { AdInput, AdSelect } from '@/packages/base';

import type { ComposerContext } from '../charms/charm.types';

import styles from './HeadingCharm.module.css';

const HEADING_OPTIONS = [
  { value: 'h1', label: 'H1' },
  { value: 'h2', label: 'H2' },
  { value: 'h3', label: 'H3' },
  { value: 'h4', label: 'H4' },
  { value: 'h5', label: 'H5' },
  { value: 'h6', label: 'H6' },
  { value: 'custom', label: 'Custom' },
];

const PRESET_FONT_SIZES: Record<HeadingLevel, string> = {
  h1: '2rem',
  h2: '1.5rem',
  h3: '1.25rem',
  h4: '1.125rem',
  h5: '1rem',
  h6: '0.875rem',
};

const clampFontSize = (value: number): number =>
  Math.min(124, Math.max(1, Math.round(value)));

type CustomFontSizeInputProps = {
  value: number;
  onChange: (value: number) => void;
};

const CustomFontSizeInput: FC<CustomFontSizeInputProps> = ({
  value,
  onChange,
}) => {
  const [editValue, setEditValue] = useState(String(value));

  useEffect(() => {
    setEditValue(String(value));
  }, [value]);

  const commit = () => {
    const parsed = editValue.trim() ? Number(editValue) : Number.NaN;
    const nextValue = Number.isFinite(parsed) ? clampFontSize(parsed) : 24;

    setEditValue(String(nextValue));
    if (nextValue !== value) {
      onChange(nextValue);
    }
  };

  return (
    <AdInput
      type="number"
      min={1}
      max={124}
      step={1}
      value={editValue}
      suffix="px"
      aria-label="Custom heading font size"
      classNames={{
        root: styles.sizeControl,
        input: styles.sizeInput,
        suffix: styles.sizeSuffix,
      }}
      onChange={(event) => {
        const rawValue = event.currentTarget.value;
        const parsed = event.currentTarget.valueAsNumber;

        setEditValue(rawValue);
        if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 124) {
          onChange(parsed);
        }
      }}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.currentTarget.blur();
        }
      }}
    />
  );
};

type HeadingCharmProps = {
  decoratorIndex: number;
  ctx: ComposerContext;
};

const HeadingCharm: FC<HeadingCharmProps> = ({ decoratorIndex, ctx }) => {
  const decoration = ctx.decorators[decoratorIndex];
  if (!decoration || decoration.type !== 'heading') {
    return null;
  }

  const heading = decoration;
  const isCustom = heading.customFontSize !== null;
  const titleStyle = {
    '--heading-title-size': isCustom
      ? `${heading.customFontSize}px`
      : PRESET_FONT_SIZES[heading.headingLevel],
  } as CSSProperties;

  const update = (next: HeadingDecorator) => {
    ctx.updateDecorator(decoratorIndex, next);
  };

  if (!ctx.composing) {
    if (!heading.title.trim() && !heading.description.trim()) {
      return null;
    }

    const semanticLevel = isCustom ? 'h6' : heading.headingLevel;

    return (
      <div className={styles.readonly} style={titleStyle}>
        {heading.title.trim()
          ? createElement(
              semanticLevel,
              { className: styles.renderedTitle },
              heading.title,
            )
          : null}
        {heading.description.trim() ? (
          <p className={styles.renderedDescription}>{heading.description}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={clsx(
        styles.editor,
        ctx.decorators.some((item) => item.type === 'timer') &&
          styles.withPreviousCharm,
      )}
      style={titleStyle}
    >
      <input
        className={styles.titleInput}
        value={heading.title}
        placeholder="Title..."
        aria-label="Heading title"
        onChange={(event) => update({ ...heading, title: event.target.value })}
      />

      <div className={styles.headingControls}>
        <AdSelect
          data={HEADING_OPTIONS}
          value={isCustom ? 'custom' : heading.headingLevel}
          aria-label="Heading level"
          classNames={{ input: styles.headingSelect }}
          onChange={(value) => {
            if (!value) return;

            if (value === 'custom') {
              update({
                ...heading,
                headingLevel: 'h6',
                customFontSize: heading.customFontSize ?? 24,
              });
              return;
            }

            update({
              ...heading,
              headingLevel: value as HeadingLevel,
              customFontSize: null,
            });
          }}
        />

        {isCustom ? (
          <CustomFontSizeInput
            value={heading.customFontSize ?? 24}
            onChange={(value) => update({ ...heading, customFontSize: value })}
          />
        ) : null}
      </div>

      <input
        className={styles.descriptionInput}
        value={heading.description}
        placeholder="Description (optional)..."
        aria-label="Heading description"
        onChange={(event) =>
          update({ ...heading, description: event.target.value })
        }
      />
    </div>
  );
};

export default HeadingCharm;
