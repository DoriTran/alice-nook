import { faEllipsis } from '@fortawesome/free-solid-svg-icons';
import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';

import { AdIcon } from '@/packages/base';

import LeftPanel from '../LeftPanel/LeftPanel';
import {
  mainNavigationPages,
  navigationIcons,
  navigationLabels,
  navigationRoutes,
} from '../LeftPanel/nav.constants';
import styles from './MobileNavigation.module.css';

type MobileNavigationProps = {
  hidden?: boolean;
};

const FOCUSABLE =
  'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';

const MobileNavigation = ({ hidden = false }: MobileNavigationProps) => {
  const [opened, setOpened] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const dragStartRef = useRef<number | null>(null);
  const navDragStartRef = useRef<number | null>(null);
  const navDraggedRef = useRef(false);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const close = () => setOpened(false);

  useEffect(() => {
    if (!opened) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      moreButtonRef.current?.focus();
    };
  }, [opened]);

  useEffect(() => {
    if (hidden) close();
  }, [hidden]);

  useEffect(() => {
    const query = window.matchMedia('(max-width: 639px)');
    const closeOnDesktop = () => {
      if (!query.matches) close();
    };
    query.addEventListener('change', closeOnDesktop);
    return () => query.removeEventListener('change', closeOnDesktop);
  }, []);

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    dragStartRef.current = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    if (dragStartRef.current === null) return;
    setDragOffset(Math.max(0, event.clientY - dragStartRef.current));
  };

  const onPointerUp = () => {
    if (dragOffset > 72) close();
    dragStartRef.current = null;
    setDragOffset(0);
  };

  return (
    <>
      <nav
        className={styles.bottomNav}
        data-hidden={hidden || undefined}
        aria-label="Primary navigation"
        onPointerDown={(event) => {
          navDragStartRef.current = event.clientY;
          navDraggedRef.current = false;
        }}
        onPointerMove={(event) => {
          if (
            navDragStartRef.current !== null &&
            navDragStartRef.current - event.clientY > 12
          )
            navDraggedRef.current = true;
        }}
        onPointerUp={(event) => {
          if (
            navDragStartRef.current !== null &&
            navDragStartRef.current - event.clientY > 40
          ) {
            setOpened(true);
          }
          navDragStartRef.current = null;
        }}
        onClickCapture={(event) => {
          if (!navDraggedRef.current) return;
          event.preventDefault();
          event.stopPropagation();
          navDraggedRef.current = false;
        }}
      >
        {mainNavigationPages.map((page) => {
          const active =
            page === 'diary'
              ? location.pathname.startsWith('/diary')
              : location.pathname === navigationRoutes[page];
          return (
            <button
              key={page}
              type="button"
              className={styles.navButton}
              data-active={active || undefined}
              data-module={page}
              onClick={() => void navigate(navigationRoutes[page])}
            >
              <AdIcon icon={navigationIcons[page]} size={18} />
              <span>{navigationLabels[page]}</span>
            </button>
          );
        })}
        <button
          ref={moreButtonRef}
          type="button"
          className={styles.navButton}
          aria-haspopup="dialog"
          aria-expanded={opened}
          onClick={() => setOpened(true)}
        >
          <AdIcon icon={faEllipsis} size={18} />
          <span>More</span>
        </button>
      </nav>

      {opened
        ? createPortal(
            <div className={styles.layer}>
              <button
                type="button"
                className={styles.backdrop}
                aria-label="Close navigation"
                onClick={close}
              />
              <div
                ref={dialogRef}
                className={styles.drawer}
                style={{ transform: `translateY(${dragOffset}px)` }}
                role="dialog"
                aria-modal="true"
                aria-label="App navigation"
              >
                <button
                  type="button"
                  className={styles.handle}
                  aria-label="Drag down to close navigation"
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                >
                  <span />
                </button>
                <LeftPanel presentation="drawer" onNavigate={close} />
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
};

export default MobileNavigation;
