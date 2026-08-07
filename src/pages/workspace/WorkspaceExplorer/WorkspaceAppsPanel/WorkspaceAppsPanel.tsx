import type { CSSProperties, FC } from 'react';

import type { ColorId } from '@/packages/color';
import type { IconId } from '@/packages/icon';
import type { WorkspaceType } from '@/store/workspace/type';

import { AdIcon } from '@/packages/base';
import { useResolvedPalette } from '@/packages/color';
import LayoutCard from '@/packages/ui/LayoutCard/LayoutCard';
import { useWorkspaceStore } from '@/store';

import { useWorkspacePageData } from '../../.hooks/useWorkspacePageData';
import {
  resolveWorkspaceForToolType,
  WORKSPACE_TYPE_META,
  WORKSPACE_TYPE_ORDER,
} from '../../workspace.utils';
import styles from './WorkspaceAppsPanel.module.css';

/** Mock UI counts until a real notification feed exists. */
const APP_NOTIFICATION_COUNTS: Partial<Record<WorkspaceType, number>> = {
  scheduler: 3,
  tracker: 2,
  analytics: 1,
  habit: 4,
  finance: 2,
  kanban: 5,
  custom: 1,
};

type AppIconProps = {
  colorId: ColorId;
  icon: IconId;
  notificationCount: number;
  selected?: boolean;
};

const AppIcon: FC<AppIconProps> = ({
  colorId,
  icon,
  notificationCount,
  selected = false,
}) => {
  const palette = useResolvedPalette(colorId);
  const showBadge = notificationCount > 0;
  const iconStyle = {
    background: selected ? palette.strong : palette.soft,
    color: selected ? palette.soft : palette.strong,
  } as CSSProperties;

  return (
    <span className={styles.iconWrap}>
      <span className={styles.icon} style={iconStyle} aria-hidden>
        <AdIcon icon={icon} source="lucide" size={30} />
      </span>
      {showBadge ? (
        <span className={styles.badge} aria-hidden>
          {notificationCount > 9 ? '9+' : notificationCount}
          <span
            className={styles.badgeDot}
            style={{ background: palette.strong }}
          />
        </span>
      ) : null}
    </span>
  );
};

type AppTileProps = {
  type: WorkspaceType;
  selected: boolean;
  notificationCount: number;
  onClick: () => void;
};

const AppTile: FC<AppTileProps> = ({
  type,
  selected,
  notificationCount,
  onClick,
}) => {
  const meta = WORKSPACE_TYPE_META[type];
  const palette = useResolvedPalette(meta.colorId);
  const tileStyle = {
    '--app-accent': palette.main,
    '--app-strong': palette.strong,
  } as CSSProperties;

  return (
    <button
      type="button"
      className={styles.tile}
      style={tileStyle}
      data-selected={selected || undefined}
      aria-pressed={selected}
      onClick={onClick}
    >
      <AppIcon
        colorId={meta.colorId}
        icon={meta.icon}
        notificationCount={notificationCount}
        selected={selected}
      />
      <span className={styles.label}>{meta.label}</span>
    </button>
  );
};

const WorkspaceAppsPanel: FC = () => {
  const selectWorkspace = useWorkspaceStore('selectWorkspace');
  const openToolHome = useWorkspaceStore('openToolHome');
  const { workspaces, orders, ui, selectedWorkspace } = useWorkspacePageData();

  const activeType = selectedWorkspace?.type ?? ui.activeToolHomeType ?? null;

  const handleAppClick = (type: WorkspaceType) => {
    const workspaceId = resolveWorkspaceForToolType(
      type,
      workspaces,
      orders.workspaceIds,
      ui.lastUsedWorkspaceByType,
    );

    if (workspaceId) {
      selectWorkspace(workspaceId);
      return;
    }

    openToolHome(type);
  };

  return (
    <LayoutCard
      tag="section"
      className={styles.root}
      aria-label="Workspace apps"
      data-module="workspace"
    >
      <header className={styles.header}>
        <h1 className={styles.title}>My Workspaces</h1>
      </header>

      <div className={styles.grid}>
        {WORKSPACE_TYPE_ORDER.map((type) => (
          <AppTile
            key={type}
            type={type}
            selected={activeType === type}
            notificationCount={APP_NOTIFICATION_COUNTS[type] ?? 0}
            onClick={() => handleAppClick(type)}
          />
        ))}
      </div>
    </LayoutCard>
  );
};

export default WorkspaceAppsPanel;
