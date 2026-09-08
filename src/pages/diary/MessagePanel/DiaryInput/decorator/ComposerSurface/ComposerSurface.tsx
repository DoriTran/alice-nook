import clsx from 'clsx';
import { Fragment, useEffect, useRef, type FC, type ReactNode } from 'react';

import type {
  CharmRegion,
  ComposerContext,
  MergedPipeline,
} from '../charms/charm.types';

import styles from './ComposerSurface.module.css';

export type ComposerSurfaceProps = {
  pipeline: MergedPipeline;
  ctx: ComposerContext;
  children: ReactNode;
  borderless?: boolean;
};

const renderRegionElements = (
  pipeline: MergedPipeline,
  region: CharmRegion,
  ctx: ComposerContext,
  flat = false,
) => {
  const elements = pipeline.regionElements[region];
  if (!elements?.length) {
    return null;
  }

  if (flat) {
    return elements.map((element) => (
      <Fragment key={`${region}-${element.order}`}>
        {element.render(ctx)}
      </Fragment>
    ));
  }

  return elements.map((element) => (
    <div key={`${region}-${element.order}`}>{element.render(ctx)}</div>
  ));
};

const ComposerSurface: FC<ComposerSurfaceProps> = ({
  pipeline,
  ctx,
  children,
  borderless = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const hasDecorators = ctx.decorators.length > 0;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const cleanups = pipeline.interactions.map((interaction) => {
      if (interaction.target !== 'container') {
        return undefined;
      }

      return interaction.mount(ctx, container);
    });

    return () => {
      cleanups.forEach((cleanup) => cleanup?.());
    };
  }, [ctx, pipeline.interactions]);

  const shellClass = clsx(
    styles.root,
    !hasDecorators && (borderless ? styles.plainBorderless : styles.plain),
  );

  const containerStyle = {
    ...pipeline.containerStyles,
  };

  const topStyle = pipeline.regionStyles.top;
  const leftStyle = pipeline.regionStyles.left;
  const rightStyle = pipeline.regionStyles.right;

  const hasTop = Boolean(pipeline.regionElements.top?.length);
  const hasLeft = Boolean(pipeline.regionElements.left?.length);
  const hasRight = Boolean(pipeline.regionElements.right?.length);
  const hasTimer = ctx.decorators.some(
    (decorator) => decorator.type === 'timer',
  );

  return (
    <div
      ref={containerRef}
      className={shellClass}
      style={containerStyle}
      data-composer-surface
      data-has-timer={hasTimer || undefined}
    >
      {renderRegionElements(pipeline, 'header', ctx) ? (
        <div
          className={styles.headerRegion}
          style={pipeline.regionStyles.header}
        >
          {renderRegionElements(pipeline, 'header', ctx)}
        </div>
      ) : null}

      <div className={styles.body} data-composer-body>
        {hasLeft ? (
          <div className={styles.leftRegion} style={leftStyle}>
            {renderRegionElements(pipeline, 'left', ctx, true)}
          </div>
        ) : null}

        <div className={styles.center}>
          {hasTop ? (
            <div className={styles.topRegion} style={topStyle}>
              {renderRegionElements(pipeline, 'top', ctx, true)}
            </div>
          ) : null}

          <div className={styles.variantEditor} data-composer-variant-editor>
            {children}
            {renderRegionElements(pipeline, 'bottom', ctx)}
          </div>
        </div>

        {hasRight ? (
          <div className={styles.rightRegion} style={rightStyle}>
            {renderRegionElements(pipeline, 'right', ctx)}
          </div>
        ) : null}
      </div>

      {renderRegionElements(pipeline, 'footer', ctx) ? (
        <div
          className={styles.footerRegion}
          style={pipeline.regionStyles.footer}
        >
          {renderRegionElements(pipeline, 'footer', ctx)}
        </div>
      ) : null}

      {renderRegionElements(pipeline, 'overlay', ctx) ? (
        <div
          className={styles.overlayRegion}
          style={pipeline.regionStyles.overlay}
        >
          {renderRegionElements(pipeline, 'overlay', ctx)}
        </div>
      ) : null}
    </div>
  );
};

export default ComposerSurface;
