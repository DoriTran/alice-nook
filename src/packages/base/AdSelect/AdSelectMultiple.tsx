import {
  Combobox,
  Input,
  useCombobox,
  type ComboboxLikeRenderOptionInput,
} from '@mantine/core';
import clsx from 'clsx';
import {
  useCallback,
  useMemo,
  useState,
  type FC,
  type KeyboardEvent,
} from 'react';

import AdChip from '../AdChip/AdChip';
import fieldStyles from '../formField/formField.module.css';
import styles from './AdSelect.module.css';
import {
  CREATE_OPTION_VALUE,
  type AdSelectMultipleProps,
  type AdSelectOption,
  type AdSelectRenderPillInput,
} from './types';

const defaultCreateLabel = (input: string) => `Create new "${input}"`;

const hasExactLabelMatch = (data: AdSelectOption[], input: string) => {
  const normalized = input.trim().toLowerCase();

  return data.some((item) => item.label.toLowerCase() === normalized);
};

const resolveCreateLabel = (
  input: string,
  createLabel: AdSelectMultipleProps['createLabel'],
) => {
  if (typeof createLabel === 'function') {
    return createLabel(input);
  }

  if (typeof createLabel === 'string') {
    return createLabel;
  }

  return defaultCreateLabel(input);
};

const AdSelectMultiple: FC<AdSelectMultipleProps> = ({
  label,
  placeholder,
  data,
  value,
  onChange,
  disabled,
  required,
  classNames,
  searchable = true,
  emptyLabel = 'No options',
  create = false,
  createLabel,
  onCreate,
  renderPill,
  hidePickedOptions = true,
}) => {
  const [searchValue, setSearchValue] = useState('');

  const combobox = useCombobox({
    onDropdownClose: () => {
      combobox.resetSelectedOption();
      setSearchValue('');
    },
  });

  const trimmedSearch = searchValue.trim();

  const optionsByValue = useMemo(
    () => new Map(data.map((item) => [item.value, item])),
    [data],
  );

  const filteredOptions = useMemo(() => {
    const normalized = trimmedSearch.toLowerCase();

    return data.filter((item) => {
      if (hidePickedOptions && value.includes(item.value)) {
        return false;
      }

      if (!searchable || !normalized) {
        return true;
      }

      return item.label.toLowerCase().includes(normalized);
    });
  }, [data, hidePickedOptions, searchable, trimmedSearch, value]);

  const shouldShowCreate =
    create &&
    Boolean(trimmedSearch) &&
    Boolean(onCreate) &&
    !hasExactLabelMatch(data, trimmedSearch);

  const handleCreate = useCallback(() => {
    if (!trimmedSearch || !onCreate) {
      return;
    }

    onCreate(trimmedSearch);
    setSearchValue('');
    combobox.closeDropdown();
  }, [combobox, onCreate, trimmedSearch]);

  const handleOptionSubmit = useCallback(
    (optionValue: string) => {
      if (optionValue === CREATE_OPTION_VALUE) {
        handleCreate();
        return;
      }

      if (!value.includes(optionValue)) {
        onChange([...value, optionValue]);
      }

      setSearchValue('');
      combobox.closeDropdown();
    },
    [combobox, handleCreate, onChange, value],
  );

  const handleRemove = useCallback(
    (optionValue: string) => {
      onChange(value.filter((item) => item !== optionValue));
    },
    [onChange, value],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Backspace' && !searchValue && value.length > 0) {
        onChange(value.slice(0, -1));
        return;
      }

      if (event.key === 'Enter' && shouldShowCreate) {
        event.preventDefault();
        handleCreate();
      }
    },
    [handleCreate, onChange, searchValue, shouldShowCreate, value],
  );

  const defaultRenderPill = useCallback(
    (input: AdSelectRenderPillInput) => (
      <AdChip
        label={input.option.label}
        colorId={input.option.colorId}
        onRemove={input.onRemove}
      />
    ),
    [],
  );

  const renderOptionContent = useCallback(
    (item: ComboboxLikeRenderOptionInput<AdSelectOption>) => {
      if (item.option.value === CREATE_OPTION_VALUE) {
        return (
          <span className={styles.createOptionLabel}>{item.option.label}</span>
        );
      }

      return <AdChip label={item.option.label} colorId={item.option.colorId} />;
    },
    [],
  );

  const showEmpty =
    filteredOptions.length === 0 &&
    !shouldShowCreate &&
    trimmedSearch.length > 0;

  return (
    <Combobox
      store={combobox}
      onOptionSubmit={handleOptionSubmit}
      disabled={disabled}
      withinPortal
      offset={0}
    >
      <Combobox.DropdownTarget>
        <Input.Wrapper
          label={label}
          required={required}
          classNames={{
            label: clsx(fieldStyles.label, styles.label, classNames?.label),
          }}
        >
          <div
            className={clsx(fieldStyles.controlMulti, classNames?.input)}
            onClick={() => combobox.openDropdown()}
            onKeyDown={() => undefined}
            role="presentation"
          >
            <div className={styles.pillsRow}>
              {value.map((optionValue) => {
                const option = optionsByValue.get(optionValue);

                if (!option) {
                  return null;
                }

                const pillInput: AdSelectRenderPillInput = {
                  option,
                  value: optionValue,
                  onRemove: () => handleRemove(optionValue),
                };

                return (
                  <span key={optionValue} className={styles.pillWrap}>
                    {(renderPill ?? defaultRenderPill)(pillInput)}
                  </span>
                );
              })}
              <Combobox.EventsTarget>
                <input
                  className={styles.multiInput}
                  value={searchValue}
                  onChange={(event) => {
                    combobox.openDropdown();
                    setSearchValue(event.currentTarget.value);
                  }}
                  onFocus={() => combobox.openDropdown()}
                  onKeyDown={handleKeyDown}
                  placeholder={value.length === 0 ? placeholder : undefined}
                  disabled={disabled}
                  aria-autocomplete="list"
                />
              </Combobox.EventsTarget>
            </div>
          </div>
        </Input.Wrapper>
      </Combobox.DropdownTarget>

      <Combobox.Dropdown className={classNames?.dropdown ?? styles.dropdown}>
        <Combobox.Options className={styles.options}>
          {filteredOptions.map((option) => (
            <Combobox.Option
              key={option.value}
              value={option.value}
              className={clsx(
                styles.option,
                option.colorId && styles.optionPill,
                classNames?.option,
              )}
            >
              {renderOptionContent({
                option,
                checked: value.includes(option.value),
              } as ComboboxLikeRenderOptionInput<AdSelectOption>)}
            </Combobox.Option>
          ))}
          {shouldShowCreate ? (
            <Combobox.Option
              value={CREATE_OPTION_VALUE}
              className={classNames?.option ?? styles.option}
            >
              <span className={styles.createOptionLabel}>
                {resolveCreateLabel(trimmedSearch, createLabel)}
              </span>
            </Combobox.Option>
          ) : null}
        </Combobox.Options>
        {showEmpty ? (
          <Combobox.Empty className={styles.empty}>{emptyLabel}</Combobox.Empty>
        ) : null}
      </Combobox.Dropdown>
    </Combobox>
  );
};

export default AdSelectMultiple;
