import { motion, useReducedMotion } from 'framer-motion';
import { useLayoutEffect, useRef, useState, type FC } from 'react';

import { AdAnimation, AdSegmentedControl } from '@/packages/base';

import { authAssets } from '../auth.assets';
import styles from './AuthCard.module.css';
import FlowerPot from './FlowerPot';
import SignInForm from './SignInForm';
import SignUpForm from './SignUpForm';

export type AuthMode = 'signin' | 'signup';

export type AuthCardProps = {
  initialError?: string | null;
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  returnTo: string;
};

/** Slide distance for peek-up enter/exit (px). */
const PEEK_UP_SLIDE_Y = 56;
/** Bring in front of the card once appear progress reaches this (0–1). */
const PEEK_UP_Z_INDEX_AT = 0.8;
const PEEK_UP_DURATION = 0.45;
const MANUAL_SCROLLBAR_IDLE_MS = 700;

const AuthCard: FC<AuthCardProps> = ({
  initialError,
  mode,
  onModeChange,
  returnTo,
}) => {
  const isSignIn = mode === 'signin';
  const showPeekUp = !isSignIn;
  const manualScrollbarTimeoutRef = useRef<number | undefined>(undefined);
  const [showManualScrollbar, setShowManualScrollbar] = useState(false);
  const formInnerRef = useRef<HTMLDivElement>(null);
  const [formHeight, setFormHeight] = useState<number | undefined>();
  const reduceMotion = useReducedMotion();
  const [peekUpInFront, setPeekUpInFront] = useState(false);
  const peekUpInFrontRef = useRef(false);

  useLayoutEffect(
    () => () => {
      if (manualScrollbarTimeoutRef.current != null) {
        window.clearTimeout(manualScrollbarTimeoutRef.current);
      }
    },
    [],
  );

  const revealManualScrollbar = () => {
    setShowManualScrollbar(true);
    if (manualScrollbarTimeoutRef.current != null) {
      window.clearTimeout(manualScrollbarTimeoutRef.current);
    }
    manualScrollbarTimeoutRef.current = window.setTimeout(() => {
      setShowManualScrollbar(false);
    }, MANUAL_SCROLLBAR_IDLE_MS);
  };

  const handleContainerScroll = () => {
    revealManualScrollbar();
  };

  const handleManualScrollIntent = () => {
    revealManualScrollbar();
  };

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
      className={isSignIn ? styles.signinContainer : styles.signupContainer}
      data-manual-scrollbar={showManualScrollbar || undefined}
      onScroll={handleContainerScroll}
      onTouchMove={handleManualScrollIntent}
      onWheel={handleManualScrollIntent}
    >
      <div className={styles.wrap} data-mode={mode}>
        <AdAnimation
          className={styles.pinnedStickerWrap}
          duration={5}
          float={6}
          rotate={3}
        >
          <img
            alt="Your space, your pace."
            className={styles.pinnedSticker}
            src={authAssets.pinnedSticker}
          />
        </AdAnimation>

        <div aria-hidden className={styles.peekWrap}>
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

        <motion.div
          aria-hidden
          className={styles.peekUpWrap}
          initial={peekUpMotion.hidden}
          animate={showPeekUp ? peekUpMotion.visible : peekUpMotion.hidden}
          onUpdate={(latest) => {
            if (!showPeekUp || peekUpInFrontRef.current || reduceMotion) return;
            const y = typeof latest.y === 'number' ? latest.y : PEEK_UP_SLIDE_Y;
            const progress = 1 - y / PEEK_UP_SLIDE_Y;
            if (progress >= PEEK_UP_Z_INDEX_AT) {
              peekUpInFrontRef.current = true;
              setPeekUpInFront(true);
            }
          }}
          style={{ zIndex: peekUpInFront ? 3 : 1 }}
          transition={{
            duration: reduceMotion ? 0.01 : PEEK_UP_DURATION,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <img alt="" className={styles.peekUpMascot} src={authAssets.peekUp} />
        </motion.div>

        <section
          aria-label="Sign in or create a nook"
          className={styles.card}
          style={{ backgroundImage: `url(${authAssets.cardBg})` }}
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
            />
          </header>

          <div
            className={styles.formBody}
            style={formHeight != null ? { height: formHeight } : undefined}
          >
            <div className={styles.formBodyInner} ref={formInnerRef}>
              {isSignIn ? (
                <SignInForm
                  initialError={initialError}
                  onSwitchToSignup={() => onModeChange('signup')}
                  returnTo={returnTo}
                />
              ) : (
                <SignUpForm
                  initialError={initialError}
                  onSwitchToSignin={() => onModeChange('signin')}
                  returnTo={returnTo}
                />
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AuthCard;
