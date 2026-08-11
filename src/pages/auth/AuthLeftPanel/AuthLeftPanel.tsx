import type { CSSProperties, FC, ReactNode } from 'react';

import { AdAnimation } from '@/packages/base';

import { authAssets } from '../auth.assets';
import { resolveResponsive, useViewportSize } from '../resolveResponsive';
import { authDecor, type AuthDecorItem } from './authDecor.config';
import styles from './AuthLeftPanel.module.css';

/** Position/size only — goes on the absolutely-positioned wrapper div. */
function layoutStyle(item: AuthDecorItem): CSSProperties {
  const transforms: string[] = [];
  if (item.centered) transforms.push('translateX(-50%)');

  return {
    ...(item.top != null ? { top: item.top } : {}),
    ...(item.left != null ? { left: item.left } : {}),
    ...(item.bottom != null ? { bottom: item.bottom } : {}),
    ...(item.width != null ? { width: item.width } : {}),
    ...(transforms.length > 0 ? { transform: transforms.join(' ') } : {}),
  };
}

/** Static resting tilt + opacity/blur vars — goes on the img itself. */
function appearanceStyle(item: AuthDecorItem): CSSProperties {
  return {
    ...(item.rotate != null ? { transform: `rotate(${item.rotate})` } : {}),
    ...(item.opacity != null
      ? { ['--decor-opacity' as string]: String(item.opacity) }
      : {}),
    ...(item.blur != null ? { ['--decor-blur' as string]: item.blur } : {}),
  };
}

/** Layout + appearance for single positioned elements (mascot). */
function elementStyle(item: AuthDecorItem): CSSProperties {
  const transforms: string[] = [];
  if (item.centered) transforms.push('translateX(-50%)');
  if (item.rotate != null) transforms.push(`rotate(${item.rotate})`);

  return {
    ...layoutStyle({ ...item, centered: false }),
    ...(item.opacity != null
      ? { ['--decor-opacity' as string]: String(item.opacity) }
      : {}),
    ...(item.blur != null ? { ['--decor-blur' as string]: item.blur } : {}),
    ...(transforms.length > 0 ? { transform: transforms.join(' ') } : {}),
  };
}

/**
 * Floating decorations wrap their img in AdAnimation for a gentle, staggered
 * float/drift/wobble. Items without `anim` in config render statically.
 */
function FloatingDecor({
  item,
  children,
}: {
  item: AuthDecorItem;
  children: ReactNode;
}) {
  if (!item.anim) return children;

  return (
    <AdAnimation style={{ display: 'block', width: '100%' }} {...item.anim}>
      {children}
    </AdAnimation>
  );
}

const AuthLeftPanel: FC = () => {
  const vp = useViewportSize();

  const stage = resolveResponsive(authDecor.stage, vp);
  const logoBlock = resolveResponsive(authDecor.logoBlock, vp);
  const shelves = resolveResponsive(authDecor.shelves, vp);
  const windowDecor = resolveResponsive(authDecor.window, vp);
  const lamp = resolveResponsive(authDecor.lamp, vp);
  const desk = resolveResponsive(authDecor.desk, vp);
  const mascot = resolveResponsive(authDecor.mascot, vp);
  const bookstack = resolveResponsive(authDecor.bookstack, vp);
  const cup = resolveResponsive(authDecor.cup, vp);
  const linedHeart = resolveResponsive(authDecor.linedHeart, vp);
  const vase = resolveResponsive(authDecor.vase, vp);
  const diary = resolveResponsive(authDecor.diary, vp);
  const noteOpen = resolveResponsive(authDecor.noteOpen, vp);
  const washiTape = resolveResponsive(authDecor.washiTape, vp);

  return (
    <aside aria-label="Alice Nook branding" className={styles.panel}>
      {/* Stage is the left illustration zone (space left of the form). */}
      <div
        className={styles.leftStage}
        style={{
          width: stage.width,
        }}
      >
        <div
          className={styles.logoBlock}
          style={{
            top: logoBlock.top,
            left: logoBlock.left,
            width: logoBlock.width,
            gap: logoBlock.gap,
          }}
        >
          <img
            alt="Alice Nook"
            className={styles.logoImg}
            src={authAssets.authLogo}
          />
          <img
            alt="your little corner of life"
            className={styles.helpImg}
            src={authAssets.helpText}
            style={{
              width: logoBlock.helpWidth,
            }}
          />
          <img
            alt=""
            className={styles.dividerImg}
            src={authAssets.logoDivider}
            style={{
              width: logoBlock.dividerWidth,
            }}
          />
          <img
            alt="A cozy little place for everything that matters"
            className={styles.sloganImg}
            src={authAssets.slogan}
            style={{
              width: logoBlock.sloganWidth,
            }}
          />
        </div>

        <div className={styles.shelvesWrap} style={layoutStyle(shelves)}>
          <FloatingDecor item={shelves}>
            <img
              alt=""
              className={styles.decorImg}
              src={authAssets.shelves}
              style={appearanceStyle(shelves)}
            />
          </FloatingDecor>
        </div>

        <div className={styles.windowWrap} style={layoutStyle(windowDecor)}>
          <FloatingDecor item={windowDecor}>
            <img
              alt=""
              className={styles.decorImg}
              src={authAssets.window}
              style={appearanceStyle(windowDecor)}
            />
          </FloatingDecor>
        </div>

        <div className={styles.lampWrap} style={layoutStyle(lamp)}>
          <FloatingDecor item={lamp}>
            <img
              alt=""
              className={styles.decorImg}
              src={authAssets.lamp}
              style={appearanceStyle(lamp)}
            />
          </FloatingDecor>
        </div>

        <div
          aria-hidden
          className={styles.desk}
          style={{
            backgroundImage: `url(${authAssets.authDesk})`,
            height: desk.height,
            minHeight: desk.minHeight,
            left: desk.sideBleed,
            right: desk.sideBleed,
          }}
        />

        <div
          className={styles.deskDecor}
          style={{
            height: desk.decorHeight,
            minHeight: desk.decorMinHeight,
          }}
        >
          <img
            alt="Alice writing in her diary"
            className={styles.mascot}
            src={authAssets.writingMascot}
            style={elementStyle(mascot)}
          />

          <div className={styles.bookstackWrap} style={layoutStyle(bookstack)}>
            <FloatingDecor item={bookstack}>
              <img
                alt=""
                className={styles.decorImg}
                src={authAssets.bookstack}
                style={appearanceStyle(bookstack)}
              />
            </FloatingDecor>
          </div>

          <div className={styles.cupWrap} style={layoutStyle(cup)}>
            <FloatingDecor item={cup}>
              <img
                alt=""
                className={styles.decorImg}
                src={authAssets.cup}
                style={appearanceStyle(cup)}
              />
            </FloatingDecor>
          </div>

          <div
            className={styles.linedHeartWrap}
            style={layoutStyle(linedHeart)}
          >
            <FloatingDecor item={linedHeart}>
              <img
                alt=""
                className={styles.decorImg}
                src={authAssets.linedHeart}
                style={appearanceStyle(linedHeart)}
              />
            </FloatingDecor>
          </div>

          <div className={styles.vaseWrap} style={layoutStyle(vase)}>
            <FloatingDecor item={vase}>
              <img
                alt=""
                className={styles.decorImg}
                src={authAssets.vase}
                style={appearanceStyle(vase)}
              />
            </FloatingDecor>
          </div>

          <div className={styles.diaryWrap} style={layoutStyle(diary)}>
            <FloatingDecor item={diary}>
              <img
                alt=""
                className={styles.decorImg}
                src={authAssets.diary}
                style={appearanceStyle(diary)}
              />
            </FloatingDecor>
          </div>

          <div className={styles.noteOpenWrap} style={layoutStyle(noteOpen)}>
            <FloatingDecor item={noteOpen}>
              <img
                alt=""
                className={styles.decorImg}
                src={authAssets.noteOpen}
                style={appearanceStyle(noteOpen)}
              />
            </FloatingDecor>
          </div>

          <div className={styles.washiTapeWrap} style={layoutStyle(washiTape)}>
            <FloatingDecor item={washiTape}>
              <img
                alt=""
                className={styles.decorImg}
                src={authAssets.washiTape}
                style={appearanceStyle(washiTape)}
              />
            </FloatingDecor>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default AuthLeftPanel;
