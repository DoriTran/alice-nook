import { Fragment, type FC, type MouseEvent } from 'react';

import {
  AdIcon,
  AdTooltip,
  CONTENT_FEATURES,
  type ContentFeatureGroup,
  type ContentFeatureId,
  type ContentFeatureAnchor,
  type ContentFeatureState,
} from '@/packages/base';

import styles from './ContentShelf.module.css';

const GROUPS: readonly {
  id: ContentFeatureGroup;
  label: string;
}[] = [
  { id: 'formatting', label: 'Formatting' },
  { id: 'entities', label: 'Entities' },
  { id: 'special', label: 'Special' },
  { id: 'clear', label: 'Clear' },
];

export type ContentShelfProps = {
  activeFeatures: ContentFeatureState;
  onRunFeature: (id: ContentFeatureId, anchor: ContentFeatureAnchor) => void;
  suppressTooltipFor?: ContentFeatureId;
};

const ContentShelf: FC<ContentShelfProps> = ({
  activeFeatures,
  onRunFeature,
  suppressTooltipFor,
}) => {
  const preserveEditorSelection = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  return (
    <section
      className={styles.root}
      aria-label="Content tools"
      data-content-shelf=""
    >
      {GROUPS.map((group, groupIndex) => (
        <Fragment key={group.id}>
          <div className={styles.group}>
            <span className={styles.groupLabel}>{group.label}</span>
            <div className={styles.actions}>
              {CONTENT_FEATURES.filter(
                (feature) => feature.group === group.id,
              ).map((feature) => {
                const enabled = feature.status === 'enabled';
                const state = activeFeatures[feature.id];
                const active = enabled && Boolean(state?.active);
                const runnable = enabled && (state?.enabled ?? true);

                return (
                  <AdTooltip
                    key={feature.id}
                    disabled={feature.id === suppressTooltipFor}
                    label={
                      <span className={styles.helpText}>
                        <strong>{feature.label}</strong>
                        <span>{feature.description}</span>
                      </span>
                    }
                    position="top"
                    withArrow={false}
                    multiline
                    classNames={{ tooltip: styles.tooltip }}
                  >
                    <button
                      type="button"
                      className={styles.action}
                      data-active={active || undefined}
                      data-planned={!runnable || undefined}
                      aria-label={feature.label}
                      data-content-feature={feature.id}
                      aria-pressed={enabled ? active : undefined}
                      aria-disabled={!runnable}
                      disabled={!runnable}
                      onMouseDown={preserveEditorSelection}
                      onClick={(event) => {
                        if (runnable) {
                          const { top, right, bottom, left } =
                            event.currentTarget.getBoundingClientRect();
                          onRunFeature(feature.id, {
                            top,
                            right,
                            bottom,
                            left,
                          });
                        }
                      }}
                    >
                      <AdIcon icon={feature.icon} source="lucide" size={16} />
                    </button>
                  </AdTooltip>
                );
              })}
            </div>
          </div>
          {groupIndex < GROUPS.length - 1 ? (
            <span className={styles.divider} aria-hidden />
          ) : null}
        </Fragment>
      ))}
    </section>
  );
};

export default ContentShelf;
