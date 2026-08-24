import type { FC, ReactNode } from 'react';

import { AdAnimation } from '@/packages/base';

import { authAssets } from '../auth.assets';
import { authDecorAnim, type AuthDecorAnim } from './authDecor.anim';
import styles from './AuthLeftPanel.module.css';

/**
 * Floating decorations wrap their img in AdAnimation for a gentle, staggered
 * float/drift/wobble. Pass `anim` from authDecorAnim; omit for stationary.
 */
function FloatingDecor({
  anim,
  children,
}: {
  anim?: AuthDecorAnim;
  children: ReactNode;
}) {
  if (!anim) return children;

  return (
    <AdAnimation style={{ display: 'block', width: '100%' }} {...anim}>
      {children}
    </AdAnimation>
  );
}

const AuthLeftPanel: FC = () => {
  return (
    <aside aria-label="Alice Nook branding" className={styles.panel}>
      {/* Stage is the left illustration zone (space left of the form). */}
      <div className={styles.leftStage}>
        <div className={styles.logoBlock}>
          <img
            alt="Alice Nook"
            className={styles.logoImg}
            src={authAssets.authLogo}
          />
          <img
            alt="your little corner of life"
            className={styles.helpImg}
            src={authAssets.helpText}
          />
          <img
            alt=""
            className={styles.dividerImg}
            src={authAssets.logoDivider}
          />
          <img
            alt="A cozy little place for everything that matters"
            className={styles.sloganImg}
            src={authAssets.slogan}
          />
        </div>

        <div className={styles.shelvesWrap}>
          <FloatingDecor anim={authDecorAnim.shelves}>
            <img alt="" className={styles.decorImg} src={authAssets.shelves} />
          </FloatingDecor>
        </div>

        <div className={styles.windowWrap}>
          <FloatingDecor anim={authDecorAnim.window}>
            <img alt="" className={styles.decorImg} src={authAssets.window} />
          </FloatingDecor>
        </div>

        <div className={styles.lampWrap}>
          <FloatingDecor anim={authDecorAnim.lamp}>
            <img alt="" className={styles.decorImg} src={authAssets.lamp} />
          </FloatingDecor>
        </div>

        <div
          aria-hidden
          className={styles.desk}
          style={{
            backgroundImage: `url(${authAssets.authDesk})`,
          }}
        />

        <div className={styles.deskDecor}>
          <img
            alt="Alice writing in her diary"
            className={styles.mascot}
            src={authAssets.writingMascot}
          />

          <div className={styles.bookstackWrap}>
            <FloatingDecor anim={authDecorAnim.bookstack}>
              <img
                alt=""
                className={styles.decorImg}
                src={authAssets.bookstack}
              />
            </FloatingDecor>
          </div>

          <div className={styles.cupWrap}>
            <FloatingDecor anim={authDecorAnim.cup}>
              <img alt="" className={styles.decorImg} src={authAssets.cup} />
            </FloatingDecor>
          </div>

          <div className={styles.linedHeartWrap}>
            <FloatingDecor anim={authDecorAnim.linedHeart}>
              <img
                alt=""
                className={styles.decorImg}
                src={authAssets.linedHeart}
              />
            </FloatingDecor>
          </div>

          <div className={styles.vaseWrap}>
            <FloatingDecor anim={authDecorAnim.vase}>
              <img alt="" className={styles.decorImg} src={authAssets.vase} />
            </FloatingDecor>
          </div>

          <div className={styles.diaryWrap}>
            <FloatingDecor anim={authDecorAnim.diary}>
              <img alt="" className={styles.decorImg} src={authAssets.diary} />
            </FloatingDecor>
          </div>

          <div className={styles.noteOpenWrap}>
            <FloatingDecor anim={authDecorAnim.noteOpen}>
              <img
                alt=""
                className={styles.decorImg}
                src={authAssets.noteOpen}
              />
            </FloatingDecor>
          </div>

          <div className={styles.washiTapeWrap}>
            <FloatingDecor anim={authDecorAnim.washiTape}>
              <img
                alt=""
                className={styles.decorImg}
                src={authAssets.washiTape}
              />
            </FloatingDecor>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default AuthLeftPanel;
