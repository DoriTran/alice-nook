import type { FC } from 'react';

import type { WorkspaceType } from '@/store/workspace/type';

import { AdCheckbox, AdIcon } from '@/packages/base';

import {
  WORKSPACE_TYPE_META,
  WORKSPACE_TYPE_ORDER,
} from '../../workspace.utils';
import styles from './WorkspaceTypeFilterMenu.module.css';

export type WorkspaceTypeFilterMenuProps = {
  selectedTypes: WorkspaceType[];
  counts: Record<WorkspaceType, number>;
  onChange: (types: WorkspaceType[]) => void;
};

const WorkspaceTypeFilterMenu: FC<WorkspaceTypeFilterMenuProps> = ({
  selectedTypes,
  counts,
  onChange,
}) => {
  const toggleType = (type: WorkspaceType) => {
    if (selectedTypes.includes(type)) {
      onChange(selectedTypes.filter((item) => item !== type));
      return;
    }

    onChange([...selectedTypes, type]);
  };

  return (
    <ul className={styles.menuList} role="menu">
      <li role="none" className={styles.headerRow}>
        <span className={styles.headerLabel}>Workspace types</span>
        {selectedTypes.length > 0 ? (
          <button
            type="button"
            className={styles.clearBtn}
            onClick={() => onChange([])}
          >
            Clear
          </button>
        ) : null}
      </li>
      {WORKSPACE_TYPE_ORDER.map((type) => {
        const meta = WORKSPACE_TYPE_META[type];
        const checked = selectedTypes.includes(type);

        return (
          <li key={type} role="none">
            <button
              type="button"
              role="menuitemcheckbox"
              className={styles.menuItem}
              aria-checked={checked}
              data-active={checked || undefined}
              onClick={() => toggleType(type)}
            >
              <AdCheckbox
                checked={checked}
                readOnly
                tabIndex={-1}
                aria-hidden
                size="xs"
              />
              <span className={styles.icon} aria-hidden>
                <AdIcon icon={meta.icon} source="lucide" size={13} />
              </span>
              <span className={styles.label}>{meta.label}</span>
              <span className={styles.count}>{counts[type]}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
};

export default WorkspaceTypeFilterMenu;
