import { Combobox, Input, useCombobox } from '@mantine/core';
import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';
import { useId, useMemo, useState, type FC } from 'react';

import { resolvePalette } from '@/packages/color';
import { useDiaryStore, useSettingsStore } from '@/store';

import type { AdSelectSingleProps } from './types';

import fieldStyles from '../formField/formField.module.css';
import styles from './AdSelect.module.css';
import { adSelectOptionColorVars } from './adSelectOptionColorVars';
import AdSelectOptionRow from './AdSelectOptionRow';

const AdSelectSingle: FC<AdSelectSingleProps> = ({
  label,
  placeholder,
  data,
  value,
  onChange,
  disabled,
  required,
  classNames,
  searchable = false,
  emptyLabel = 'No options',
  ...rest
}) => {
  void rest;

  const listboxId = useId();
  const mode = useSettingsStore('mode');
  const customPalettes = useDiaryStore('customPalettes');
  const [searchValue, setSearchValue] = useState('');

  const combobox = useCombobox({
    onDropdownClose: () => {
      combobox.resetSelectedOption();
      setSearchValue('');
    },
  });

  const trimmedSearch = searchValue.trim().toLowerCase();

  const filteredData = useMemo(() => {
    if (!searchable || !trimmedSearch) {
      return data;
    }

    return data.filter((item) =>
      item.label.toLowerCase().includes(trimmedSearch),
    );
  }, [data, searchable, trimmedSearch]);

  const selectedOption = useMemo(
    () => data.find((item) => item.value === value) ?? null,
    [data, value],
  );

  const showEmpty =
    searchable && filteredData.length === 0 && trimmedSearch.length > 0;

  const resolveOptionStyle = (
    colorId?: AdSelectSingleProps['data'][number]['colorId'],
  ) => {
    if (!colorId) {
      return undefined;
    }

    return adSelectOptionColorVars(
      resolvePalette(colorId, mode, customPalettes),
    );
  };

  return (
    <Combobox
      store={combobox}
      onOptionSubmit={(optionValue) => {
        onChange(optionValue);
        combobox.closeDropdown();
      }}
      disabled={disabled}
      withinPortal
      offset={0}
    >
      <Combobox.Target>
        <Input.Wrapper
          label={label}
          required={required}
          classNames={{
            label: clsx(fieldStyles.label, styles.label, classNames?.label),
          }}
        >
          <div
            className={clsx(
              fieldStyles.control,
              styles.input,
              styles.singleTrigger,
              classNames?.input,
            )}
            aria-controls={listboxId}
            aria-expanded={combobox.dropdownOpened}
            aria-haspopup="listbox"
            role="combobox"
            tabIndex={disabled ? -1 : 0}
            onClick={() => {
              if (!disabled) {
                combobox.toggleDropdown();
              }
            }}
            onKeyDown={(event) => {
              if (disabled) {
                return;
              }

              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                combobox.toggleDropdown();
              }
            }}
          >
            <span className={styles.singleValue}>
              {selectedOption ? (
                <AdSelectOptionRow
                  label={selectedOption.label}
                  iconId={selectedOption.iconId}
                  colorId={selectedOption.colorId}
                />
              ) : (
                <span className={styles.placeholder}>{placeholder}</span>
              )}
            </span>
            <ChevronDown
              size={16}
              strokeWidth={2}
              className={styles.chevron}
              aria-hidden
            />
          </div>
        </Input.Wrapper>
      </Combobox.Target>

      <Combobox.Dropdown className={classNames?.dropdown ?? styles.dropdown}>
        {searchable ? (
          <Combobox.Search
            value={searchValue}
            onChange={(event) => setSearchValue(event.currentTarget.value)}
            placeholder={placeholder}
            className={styles.search}
            classNames={{ input: styles.searchInput }}
          />
        ) : null}
        <Combobox.Options id={listboxId} className={styles.options}>
          {filteredData.map((option) => (
            <Combobox.Option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              className={clsx(
                styles.option,
                option.colorId && styles.optionColorHover,
                classNames?.option,
              )}
              style={resolveOptionStyle(option.colorId)}
            >
              <AdSelectOptionRow
                label={option.label}
                iconId={option.iconId}
                colorId={option.colorId}
              />
            </Combobox.Option>
          ))}
        </Combobox.Options>
        {showEmpty ? (
          <Combobox.Empty className={styles.empty}>{emptyLabel}</Combobox.Empty>
        ) : null}
      </Combobox.Dropdown>
    </Combobox>
  );
};

export default AdSelectSingle;
