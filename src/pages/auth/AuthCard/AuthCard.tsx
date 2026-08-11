import { motion, useReducedMotion } from 'framer-motion';
import { useLayoutEffect, useRef, useState, type FC } from 'react';

import { AdAnimation, AdSegmentedControl } from '@/packages/base';

import { authAssets } from '../auth.assets';
import { resolveResponsive, useViewportSize } from '../resolveResponsive';
import { authCard } from './authCard.config';
import styles from './AuthCard.module.css';
import FlowerPot from './FlowerPot';
import SignInForm from './SignInForm';
import SignUpForm from './SignUpForm';

export type AuthMode = 'signin' | 'signup';

export type AuthCardProps = {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
};

/** Slide distance for peek-up enter/exit (px). */
const PEEK_UP_SLIDE_Y = 56;
/** Bring in front of the card once appear progress reaches this (0–1). */
const PEEK_UP_Z_INDEX_AT = 0.8;

const AuthCard: FC<AuthCardProps> = ({ mode, onModeChange }) => {
  const isSignIn = mode === 'signin';
  const formInnerRef = useRef<HTMLDivElement>(null);
  const [formHeight, setFormHeight] = useState<number | undefined>();
  const vp = useViewportSize();
  const reduceMotion = useReducedMotion();

  const panel = resolveResponsive(authCard.panel, vp);
  const pinnedSticker = resolveResponsive(authCard.pinnedSticker, vp);
  const peek = resolveResponsive(authCard.peek, vp);
  const peekUp = resolveResponsive(authCard.peekUp, vp);
  const panelDivider = resolveResponsive(authCard.panelDivider, vp);

  // Hidden when width resolves to 0 / 0px (desktop base); shown on tall mobile.
  const peekUpAllowed = Number.parseFloat(peekUp.width) > 0;
  const showPeekUp = !isSignIn && peekUpAllowed;
  const [peekUpInFront, setPeekUpInFront] = useState(false);
  const peekUpInFrontRef = useRef(false);

  useLayoutEffect(() => {
    // Hide: drop behind the card instantly. Appear: start behind until progress hits 80%.
    peekUpInFrontRef.current = false;
    setPeekUpInFront(false);
    if (showPeekUp && reduceMotion) {
      peekUpInFrontRef.current = true;
      setPeekUpInFront(true);
    }
  }, [showPeekUp, reduceMotion]);

  useLayoutEffect(() => {
    const node = formInnerRef.current;
    if (!node) return;

    const updateHeight = () => {
      setFormHeight(node.scrollHeight);
    };

    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(node);
    return () => observer.disconnect();
  }, [mode]);

  const peekUpMotion = reduceMotion
    ? {
        hidden: { opacity: 0, x: '-50%' as const },
        visible: { opacity: 1, x: '-50%' as const },
      }
    : {
        hidden: {
          opacity: 0,
          x: '-50%' as const,
          y: PEEK_UP_SLIDE_Y,
          scale: 0.72,
        },
        visible: { opacity: 1, x: '-50%' as const, y: 0, scale: 1 },
      };

  return (
    <div
      className={styles.wrap}
      style={{
        width: panel.width,
        right: panel.right === 'auto' ? undefined : panel.right,
        bottom: panel.bottom,
        left: panel.left,
        // Bottom / centered layouts must clear the CSS vertical-center transform.
        ...(panel.bottom != null || panel.centered
          ? {
              top: panel.top ?? 'auto',
              transform: panel.centered ? 'translateX(-50%)' : 'none',
            }
          : panel.top != null
            ? { top: panel.top }
            : {}),
      }}
    >
      <AdAnimation
        className={styles.pinnedStickerWrap}
        duration={pinnedSticker.anim.duration}
        float={pinnedSticker.anim.float}
        rotate={pinnedSticker.anim.rotate}
        style={{
          top: pinnedSticker.top,
          right: pinnedSticker.right,
          width: pinnedSticker.width,
        }}
      >
        <img
          alt="Your space, your pace."
          className={styles.pinnedSticker}
          src={authAssets.pinnedSticker}
          style={{ transform: `rotate(${pinnedSticker.rotate})` }}
        />
      </AdAnimation>

      <div
        aria-hidden
        className={styles.peekWrap}
        style={{
          width: peek.width,
          bottom: peek.bottom,
          marginRight: peek.overlap,
        }}
      >
        <img
          alt=""
          className={styles.peekMascot}
          src={authAssets.peekSide}
          style={{ opacity: isSignIn ? 1 : 0 }}
        />
        <img
          alt=""
          className={`${styles.peekMascot} ${styles.peekMascotOverlay}`}
          src={authAssets.peekSideWaving}
          style={{ opacity: isSignIn ? 0 : 1 }}
        />
      </div>

      {peekUpAllowed ? (
        <motion.div
          aria-hidden
          className={styles.peekUpWrap}
          initial={peekUpMotion.hidden}
          animate={showPeekUp ? peekUpMotion.visible : peekUpMotion.hidden}
          onUpdate={(latest) => {
            if (!showPeekUp || peekUpInFrontRef.current || reduceMotion) return;
            const y =
              typeof latest.y === 'number' ? latest.y : PEEK_UP_SLIDE_Y;
            const progress = 1 - y / PEEK_UP_SLIDE_Y;
            if (progress >= PEEK_UP_Z_INDEX_AT) {
              peekUpInFrontRef.current = true;
              setPeekUpInFront(true);
            }
          }}
          style={{
            width: peekUp.width,
            bottom: `calc(100% - ${peekUp.overlap} + 6px)`,
            zIndex: peekUpInFront ? 3 : 1,
          }}
          transition={{
            duration: reduceMotion ? 0.01 : peekUp.duration,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <img alt="" className={styles.peekUpMascot} src={authAssets.peekUp} />
        </motion.div>
      ) : null}

      <section
        aria-label="Sign in or create a nook"
        className={styles.card}
        style={{
          backgroundImage: `url(${authAssets.cardBg})`,
          padding: panel.padding,
          borderRadius: panel.borderRadius,
          maxHeight: panel.maxHeight,
        }}
      >
        <AdSegmentedControl
          aria-label="Authentication mode"
          className={styles.tabs}
          fullWidth
          onChange={onModeChange}
          options={[
            { value: 'signin', label: 'Sign in' },
            { value: 'signup', label: 'Create a nook' },
          ]}
          value={mode}
        />

        <header className={styles.header}>
          <FlowerPot />
          {isSignIn ? (
            <>
              <h1 className={styles.heading}>Welcome back ♡</h1>
              <p className={styles.caption}>
                Your nook has been waiting for you.
              </p>
            </>
          ) : (
            <>
              <h1 className={styles.heading}>Create your nook ♡</h1>
              <p className={styles.caption}>
                A cozy little corner made just for you.
              </p>
            </>
          )}
          <img
            alt=""
            className={styles.panelDivider}
            src={authAssets.panelDivider}
            style={{ maxWidth: panelDivider.maxWidth }}
          />
        </header>

        <div
          className={styles.formBody}
          style={formHeight != null ? { height: formHeight } : undefined}
        >
          <div className={styles.formBodyInner} ref={formInnerRef}>
            {isSignIn ? (
              <SignInForm onSwitchToSignup={() => onModeChange('signup')} />
            ) : (
              <SignUpForm onSwitchToSignin={() => onModeChange('signin')} />
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AuthCard;
