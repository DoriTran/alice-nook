import type { CSSProperties, FC } from 'react';

import { faEllipsisVertical, faUser } from '@fortawesome/free-solid-svg-icons';

import type { Chatbox } from '@/store/diary/type';
import type { Workspace, WorkspaceSource } from '@/store/workspace/type';

import { AdActionButton, AdIcon } from '@/packages/base';
import { ColorMainSwatch, getAppMode } from '@/packages/color';

import {
  formatWorkspaceUpdatedLabel,
  resolveWorkspaceCardPills,
  resolveWorkspaceCoverStyle,
  WORKSPACE_TYPE_META,
} from '../../workspace.utils';
import styles from './WorkspaceCard.module.css';

export type WorkspaceCardProps = {
  workspace: Workspace;
  sources: Record<string, WorkspaceSource>;
  chatboxes: Record<string, Chatbox>;
  onSelect: (workspaceId: string) => void;
};

const WorkspaceCard: FC<WorkspaceCardProps> = ({
  workspace,
  sources,
  chatboxes,
  onSelect,
}) => {
  const meta = WORKSPACE_TYPE_META[workspace.type];
  const coverStyle = resolveWorkspaceCoverStyle(workspace, getAppMode());
  const pills = resolveWorkspaceCardPills(
    workspace,
    sources,
    chatboxes,
    getAppMode(),
  ).slice(0, 4);

  return (
    <div className={styles.root}>
      <button
        type="button"
        className={styles.selectBtn}
        onClick={() => onSelect(workspace.id)}
        aria-label={`Open ${workspace.name}`}
      >
        <div
          className={styles.cover}
          style={coverStyle as CSSProperties}
          aria-hidden
        >
          <ColorMainSwatch className={styles.coverIcon} colorId={meta.colorId}>
            <AdIcon icon={meta.icon} source="lucide" size={14} />
          </ColorMainSwatch>
        </div>

        <div className={styles.body}>
          <h3 className={styles.name}>{workspace.name}</h3>
          {workspace.description ? (
            <p className={styles.description}>{workspace.description}</p>
          ) : null}

          {pills.length > 0 ? (
            <div className={styles.pills}>
              {pills.map((pill) => (
                <span
                  key={`${pill.kind}-${pill.label}`}
                  className={styles.pill}
                  style={{
                    background: `color-mix(in srgb, ${pill.color} 26%, var(--surface))`,
                  }}
                >
                  {pill.label}
                </span>
              ))}
            </div>
          ) : null}

          <div className={styles.footer}>
            <span className={styles.updated}>
              {formatWorkspaceUpdatedLabel(workspace)}
            </span>
            <span className={styles.members}>
              <AdIcon icon={faUser} size={11} />
              {Math.max(1, workspace.sourceIds.length)}
            </span>
          </div>
        </div>
      </button>

      <div className={styles.coverMenu}>
        <AdActionButton icon={faEllipsisVertical} label="Workspace options" />
      </div>
    </div>
  );
};

export default WorkspaceCard;
