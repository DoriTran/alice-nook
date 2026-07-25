import type { FC, MouseEvent } from 'react';

import type { DetailPanelTag } from '../detailPanel.utils';

import { AdChip, AdIcon } from '@/packages/base';

import styles from './OverviewTab.module.css';
import TagFormRow from './TagFormRow';

export type TagPillRowProps = {
  tag: DetailPanelTag;
  editing: boolean;
  onPillClick: (tagId: string) => void;
  onEdit: (tagId: string) => void;
  onCancelEdit: () => void;
  onSaved: () => void;
  onDelete: (tagId: string) => void;
};

const stop = (event: MouseEvent) => {
  event.preventDefault();
  event.stopPropagation();
};

const TagPillRow: FC<TagPillRowProps> = ({
  tag,
  editing,
  onPillClick,
  onEdit,
  onCancelEdit,
  onSaved,
  onDelete,
}) => {
  if (editing) {
    return (
      <TagFormRow
        mode="edit"
        tagId={tag.tagId}
        initialLabel={tag.label}
        initialColorId={tag.colorId}
        onCancel={onCancelEdit}
        onSaved={onSaved}
      />
    );
  }

  return (
    <li className={styles.tagRow}>
      <span className={styles.tagCountBadge}>{tag.count}</span>
      <button
        type="button"
        className={styles.tagPillButton}
        onClick={() => onPillClick(tag.tagId)}
        aria-label={`View messages tagged ${tag.label}`}
      >
        <AdChip label={tag.label} colorId={tag.colorId} size="small" />
      </button>
      <div className={styles.tagActions}>
        <button
          type="button"
          className={styles.tagActionBtn}
          aria-label={`Edit ${tag.label}`}
          onMouseDown={stop}
          onClick={(event) => {
            stop(event);
            onEdit(tag.tagId);
          }}
        >
          <AdIcon icon="Pen" source="lucide" size={12} strokeWidth={1.75} />
        </button>
        <button
          type="button"
          className={styles.tagActionBtn}
          aria-label={`Remove ${tag.label} from this chat`}
          onMouseDown={stop}
          onClick={(event) => {
            stop(event);
            onDelete(tag.tagId);
          }}
        >
          <AdIcon icon="Trash2" source="lucide" size={12} strokeWidth={1.75} />
        </button>
      </div>
    </li>
  );
};

export default TagPillRow;
