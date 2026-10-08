import { Fragment, type FC, type MouseEvent } from 'react';

import {
  AdIcon,
  AdTooltip,
  CONTENT_FEATURES,
  type ContentFeature,
  type ContentFeatureId,
  type ContentFeatureInvocation,
  type ContentFeaturePresentationGroup,
  type ContentFeatureState,
} from '@/packages/base';

import styles from './ContentShelf.module.css';

const GROUPS: readonly {
  id: ContentFeaturePresentationGroup;
  label: string;
}[] = [
  { id: 'formatting', label: 'Formatting' },
  { id: 'alignment', label: 'Alignment' },
  { id: 'entities', label: 'Entities' },
  { id: 'special', label: 'Special' },
  { id: 'clear', label: 'Clear' },
];

export type ContentShelfProps = {
  activeFeatures: ContentFeatureState;
  onRunFeature: (
    id: ContentFeatureId,
    invocation: ContentFeatureInvocation,
  ) => void;
  suppressTooltipFor?: ContentFeatureId;
};

const getAnchor = (event: MouseEvent<HTMLButtonElement>) => {
  const { top, right, bottom, left } =
    event.currentTarget.getBoundingClientRect();
  return { top, right, bottom, left };
};

const ChoiceFeature: FC<{
  feature: ContentFeature;
  state: ContentFeatureState[ContentFeatureId];
  runnable: boolean;
  suppressTooltip: boolean;
  onRunFeature: ContentShelfProps['onRunFeature'];
}> = ({ feature, state, runnable, suppressTooltip, onRunFeature }) => (
  <>
    {feature.choices?.map((choice) => {
      const active = state?.value === choice.value;
      return (
        <AdTooltip
          key={choice.value}
          disabled={suppressTooltip}
          label={
            <span className={styles.helpText}>
              <strong>{choice.label}</strong>
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
            data-mixed={state?.value === 'mixed' || undefined}
            data-planned={!runnable || undefined}
            data-content-feature={feature.id}
            data-content-value={choice.value}
            aria-label={choice.label}
            aria-pressed={active}
            aria-disabled={!runnable}
            disabled={!runnable}
            onMouseDown={(event) => event.preventDefault()}
            onClick={(event) => {
              if (runnable) {
                onRunFeature(feature.id, {
                  anchor: getAnchor(event),
                  value: choice.value,
                });
              }
            }}
          >
            <AdIcon icon={choice.icon} source="lucide" size={16} />
          </button>
        </AdTooltip>
      );
    })}
  </>
);

const ContentShelf: FC<ContentShelfProps> = ({
  activeFeatures,
  onRunFeature,
  suppressTooltipFor,
}) => (
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
              (feature) =>
                (feature.presentationGroup ?? feature.group) === group.id,
            ).map((feature) => {
              const enabled = feature.status === 'enabled';
              const state = activeFeatures[feature.id];
              const active = enabled && Boolean(state?.active);
              const runnable = enabled && (state?.enabled ?? true);

              if (feature.controlBehavior === 'choice') {
                return (
                  <ChoiceFeature
                    key={feature.id}
                    feature={feature}
                    state={state}
                    runnable={runnable}
                    suppressTooltip={feature.id === suppressTooltipFor}
                    onRunFeature={onRunFeature}
                  />
                );
              }

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
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={(event) => {
                      if (runnable) {
                        onRunFeature(feature.id, { anchor: getAnchor(event) });
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

export default ContentShelf;
