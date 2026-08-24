import { createElement, type FC } from 'react';

import cardStyles from './AuthCard/AuthCard.module.css';
import leftStyles from './AuthLeftPanel/AuthLeftPanel.module.css';
import pageStyles from './AuthPage.module.css';

/** Live, editable auth layout config. Narrower height and width rules win. */
export type AuthCssDeclarations = Readonly<Record<string, string>>;
export type AuthSelectorRules = Readonly<Record<string, AuthCssDeclarations>>;
export type AuthWidthKey = `w<${number}` | 'w<';
export type AuthHeightKey = `h<${number}` | 'h<';
export type AuthResponsiveConfig = Readonly<
  Partial<
    Record<
      AuthHeightKey,
      Readonly<Partial<Record<AuthWidthKey, AuthSelectorRules>>>
    >
  >
>;

export const authResponsiveConfig = {
  'h<': {
    'w<': {
      page: {
        position: 'relative',
        'min-height': '100vh',
        width: '100%',
        overflow: 'hidden',
        'background-position': 'center',
        'background-repeat': 'no-repeat',
        'background-size': 'cover',
      },
      adriftBand: {
        position: 'absolute',
        inset: '0',
        'z-index': '1',
        overflow: 'hidden',
        'pointer-events': 'none',
      },
      content: {
        position: 'relative',
        'z-index': '2',
        width: '100%',
        'min-height': '100vh',
      },
      panel: {
        position: 'absolute',
        inset: '0',
        'z-index': '2',
        'pointer-events': 'none',
        overflow: 'visible',
      },
      leftStage: {
        position: 'absolute',
        top: '0',
        left: '0',
        bottom: '0',
        overflow: 'visible',
        width: 'calc(100% - 700px)',
      },
      logoBlock: {
        position: 'absolute',
        'z-index': '4',
        display: 'flex',
        'flex-direction': 'column',
        'align-items': 'center',
        transform: 'translateX(-50%)',
        'text-align': 'center',
        top: '8%',
        left: '50%',
        width: '600px',
        gap: '1.5rem',
      },
      logoImg: {
        display: 'block',
        height: 'auto',
        width: '100%',
      },
      helpImg: {
        display: 'block',
        height: 'auto',
        width: '400px',
      },
      dividerImg: {
        display: 'block',
        height: 'auto',
        width: '140px',
        margin: '0.05rem 0',
      },
      sloganImg: {
        display: 'block',
        height: 'auto',
        width: '350px',
      },
      shelvesWrap: {
        position: 'absolute',
        'z-index': '3',
        top: '6%',
        left: '-2%',
        width: '350px',
        '--decor-opacity': '0.75',
        '--decor-blur': '1px',
      },
      windowWrap: {
        position: 'absolute',
        'z-index': '2',
        top: '15%',
        left: '86%',
        width: '320px',
        '--decor-opacity': '0.75',
        '--decor-blur': '1px',
      },
      lampWrap: {
        position: 'absolute',
        'z-index': '6',
        left: 'max(2%, calc(50% - 480px))',
        bottom: '280px',
        width: '150px',
      },
      decorImg: {
        display: 'block',
        width: '100%',
        height: 'auto',
        opacity: 'var(--decor-opacity, 1)',
        filter: 'blur(var(--decor-blur, 0px))',
        transform: 'rotate(var(--decor-rotate, 0deg))',
      },
      desk: {
        position: 'absolute',
        bottom: '0',
        'z-index': '3',
        width: 'auto',
        height: '28vh',
        'min-height': '28vh',
        left: '-4%',
        right: '-4%',
        'background-position': 'center bottom',
        'background-repeat': 'no-repeat',
        'background-size': 'cover',
      },
      deskDecor: {
        position: 'absolute',
        left: '0',
        right: '0',
        bottom: '0',
        'z-index': '5',
        overflow: 'visible',
        height: '640px',
        'min-height': '42vh',
      },
      mascot: {
        position: 'absolute',
        opacity: 'var(--decor-opacity, 1)',
        filter: 'blur(var(--decor-blur, 0px))',
        left: '47.5%',
        bottom: '25%',
        width: '47.5vh',
        transform: 'translateX(-50%) rotate(0deg)',
      },
      bookstackWrap: {
        position: 'absolute',
        left: 'max(2%, calc(50% - 470px))',
        bottom: '20px',
        width: '250px',
      },
      cupWrap: {
        position: 'absolute',
        left: 'max(2%, calc(50% - 650px))',
        bottom: '200px',
        width: '125px',
      },
      linedHeartWrap: {
        position: 'absolute',
        left: 'calc(50% - 275px)',
        bottom: '85%',
        width: 'min(12%, 86px)',
        '--decor-rotate': '-8deg',
      },
      vaseWrap: {
        position: 'absolute',
        left: 'min(75%, calc(50% + 210px))',
        bottom: '250px',
        width: '150px',
      },
      diaryWrap: {
        position: 'absolute',
        left: '50%',
        bottom: '40px',
        width: '150px',
        '--decor-rotate': '-6deg',
      },
      noteOpenWrap: {
        position: 'absolute',
        left: 'min(88%, calc(50% + 180px))',
        bottom: '12%',
        width: '200px',
        '--decor-rotate': '4deg',
      },
      washiTapeWrap: {
        position: 'absolute',
        left: 'min(88%, calc(50% + 400px))',
        bottom: '180px',
        width: '100px',
        '--decor-rotate': '18deg',
      },
      signinContainer: {
        position: 'absolute',
        inset: '0',
        'z-index': '4',
        display: 'flex',
        'flex-direction': 'column',
        'align-items': 'flex-end',
        'box-sizing': 'border-box',
        'overflow-x': 'hidden',
        'overflow-y': 'auto',
        padding: '1vh 8vw',
      },
      signupContainer: {
        position: 'absolute',
        inset: '0',
        'z-index': '4',
        display: 'flex',
        'flex-direction': 'column',
        'align-items': 'flex-end',
        'box-sizing': 'border-box',
        'overflow-x': 'hidden',
        'overflow-y': 'auto',
        padding: '1vh 8vw',
      },
      wrap: {
        '--auth-tabs-mb': '0.75rem',
        '--auth-tabs-pad': '4px',
        '--auth-tabs-fs': '0.875rem',
        '--auth-header-mb': '1.25rem',
        '--auth-heading-fs': '1.75rem',
        '--auth-caption-fs': '0.9rem',
        '--auth-heading-m': '0.35rem 0',
        '--auth-flower-mb': '0.25rem',
        '--auth-divider-mt': '0.65rem',
        '--auth-form-gap': '0.9rem',
        '--auth-field-gap': '0.35rem',
        '--auth-label-fs': '0.8rem',
        '--auth-footer-fs': '0.85rem',
        '--auth-footer-mt': '0.35rem',
        '--auth-link-fs': '0.8rem',
        '--auth-or-fs': '0.8rem',
        '--auth-or-gap': '0.75rem',
        '--auth-error-fs': '0.78rem',
        '--auth-icon-size': '16px',
        '--auth-input-min-h': '2.75rem',
        '--auth-input-fs': '0.9rem',
        '--auth-input-radius': '14px',
        '--auth-input-py': '0.65rem',
        '--auth-input-pis': '2.55rem',
        '--auth-input-pie': '0.85rem',
        '--auth-input-pie-toggle': '2.75rem',
        '--auth-input-icon-offset': '0.85rem',
        '--auth-input-toggle-size': '2rem',
        '--auth-primary-min-h': '2.9rem',
        '--auth-primary-fs': '0.95rem',
        '--auth-primary-radius': '16px',
        '--auth-primary-pad': '0.75rem 1rem',
        '--auth-google-min-h': '2.75rem',
        '--auth-google-fs': '0.9rem',
        '--auth-google-radius': '14px',
        '--auth-google-pad': '0.65rem 1rem',
        '--auth-google-gap': '0.55rem',
        position: 'relative',
        top: 'auto',
        right: 'auto',
        bottom: 'auto',
        left: 'auto',
        'z-index': '4',
        'flex-shrink': '0',
        width: '560px',
        'margin-block': 'auto',
        transform: 'none',
      },
      "wrap[data-mode='signin']": {
        '--auth-forgot-mt': '-0.35rem',
        '--auth-primary-mt': '0px',
        'margin-top': 'auto',
      },
      "wrap[data-mode='signup']": {
        '--auth-primary-mt': '0.85rem',
        'margin-top': 'auto',
      },
      card: {
        position: 'relative',
        'z-index': '2',
        display: 'flex',
        'flex-direction': 'column',
        width: '100%',
        'max-height': 'none',
        overflow: 'visible',
        padding: '1.75rem 2rem 1.5rem',
        'border-radius': '28px',
        'background-position': 'center',
        'background-repeat': 'no-repeat',
        'background-size': '100% 100%',
      },
      formBody: {
        flex: '0 0 auto',
        'min-height': 'auto',
        overflow: 'visible',
      },
      formBodyInner: {
        display: 'flex',
        'flex-direction': 'column',
      },
      tabs: {
        'flex-shrink': '0',
        'margin-bottom': 'var(--auth-tabs-mb, 0.75rem)',
        'border-radius': '999px',
        padding: 'var(--auth-tabs-pad, 4px)',
      },
      "tabs button[role='radio']": {
        'border-radius': '999px',
        'font-size': 'var(--auth-tabs-fs, 0.875rem)',
      },
      header: {
        display: 'flex',
        'flex-shrink': '0',
        'flex-direction': 'column',
        'align-items': 'center',
        'text-align': 'center',
        'margin-bottom': 'var(--auth-header-mb, 1.25rem)',
      },
      flowerPotWrap: {
        display: 'block',
        'margin-bottom': 'var(--auth-flower-mb, 0.25rem)',
      },
      flowerPot: {
        display: 'block',
        width: '115px',
        height: 'auto',
      },
      heading: {
        margin: 'var(--auth-heading-m, 0.35rem 0)',
        'font-size': 'var(--auth-heading-fs, 1.75rem)',
      },
      caption: {
        margin: '0',
        'font-size': 'var(--auth-caption-fs, 0.9rem)',
      },
      panelDivider: {
        display: 'block',
        width: '100%',
        'max-width': '200px',
        height: 'auto',
        margin: 'var(--auth-divider-mt, 0.65rem) auto 0',
      },
      pinnedStickerWrap: {
        position: 'absolute',
        top: '-70px',
        right: '-80px',
        'z-index': '6',
        width: '200px',
        'pointer-events': 'none',
      },
      pinnedSticker: {
        display: 'block',
        width: '100%',
        height: 'auto',
        transform: 'rotate(8deg)',
      },
      peekWrap: {
        position: 'absolute',
        right: '100%',
        bottom: '50px',
        'z-index': '5',
        width: '150px',
        'margin-right': '-10px',
        'pointer-events': 'none',
      },
      peekMascot: {
        display: 'block',
        width: '100%',
        height: 'auto',
      },
      peekMascotOverlay: {
        position: 'absolute',
        top: '0',
        left: '0',
      },
      peekUpWrap: {
        position: 'absolute',
        left: '50%',
        bottom: 'calc(100% - var(--peek-up-overlap) + 6px)',
        width: '0',
        '--peek-up-overlap': '0px',
        'pointer-events': 'none',
        'transform-origin': 'bottom center',
      },
      peekUpMascot: {
        display: 'block',
        width: '100%',
        height: 'auto',
      },
      form: {
        display: 'flex',
        'flex-direction': 'column',
        gap: 'var(--auth-form-gap, 0.9rem)',
      },
      field: {
        display: 'flex',
        'flex-direction': 'column',
        gap: 'var(--auth-field-gap, 0.35rem)',
      },
      label: {
        'font-size': 'var(--auth-label-fs, 0.8rem)',
      },
      inputShell: {
        position: 'relative',
        display: 'flex',
        'align-items': 'center',
      },
      inputIcon: {
        position: 'absolute',
        left: 'var(--auth-input-icon-offset, 0.85rem)',
        'pointer-events': 'none',
        width: 'var(--auth-icon-size, 16px)',
        height: 'var(--auth-icon-size, 16px)',
      },
      'togglePassword svg': {
        width: 'var(--auth-icon-size, 16px)',
        height: 'var(--auth-icon-size, 16px)',
      },
      'googleBtn svg': {
        width: 'var(--auth-icon-size, 16px)',
        height: 'var(--auth-icon-size, 16px)',
      },
      input: {
        width: '100%',
        'min-height': 'var(--auth-input-min-h, 2.75rem)',
        padding:
          'var(--auth-input-py, 0.65rem) var(--auth-input-pie, 0.85rem) var(--auth-input-py, 0.65rem) var(--auth-input-pis, 2.55rem)',
        'border-radius': 'var(--auth-input-radius, 14px)',
        'font-size': 'var(--auth-input-fs, 0.9rem)',
      },
      inputWithToggle: {
        'padding-right': 'var(--auth-input-pie-toggle, 2.75rem)',
      },
      togglePassword: {
        position: 'absolute',
        right: '0.45rem',
        display: 'inline-flex',
        'align-items': 'center',
        'justify-content': 'center',
        width: 'var(--auth-input-toggle-size, 2rem)',
        height: 'var(--auth-input-toggle-size, 2rem)',
        padding: '0',
        'border-radius': '999px',
      },
      forgotRow: {
        display: 'flex',
        'justify-content': 'flex-end',
        'margin-top': 'var(--auth-forgot-mt, -0.35rem)',
      },
      forgotLink: {
        padding: '0',
        'font-size': 'var(--auth-link-fs, 0.8rem)',
      },
      footerLink: {
        padding: '0',
        'font-size': 'var(--auth-link-fs, 0.8rem)',
      },
      errorText: {
        margin: '-0.25rem 0 0',
        'font-size': 'var(--auth-error-fs, 0.78rem)',
      },
      primaryBtn: {
        display: 'inline-flex',
        'align-items': 'center',
        'justify-content': 'center',
        gap: '0.4rem',
        width: '100%',
        'min-height': 'var(--auth-primary-min-h, 2.9rem)',
        'margin-top': 'var(--auth-primary-mt, 0px)',
        padding: 'var(--auth-primary-pad, 0.75rem 1rem)',
        'border-radius': 'var(--auth-primary-radius, 16px)',
        'font-size': 'var(--auth-primary-fs, 0.95rem)',
      },
      orRow: {
        display: 'flex',
        'align-items': 'center',
        gap: 'var(--auth-or-gap, 0.75rem)',
        'font-size': 'var(--auth-or-fs, 0.8rem)',
      },
      orLine: {
        flex: '1',
      },
      googleBtn: {
        display: 'inline-flex',
        'align-items': 'center',
        'justify-content': 'center',
        gap: 'var(--auth-google-gap, 0.55rem)',
        width: '100%',
        'min-height': 'var(--auth-google-min-h, 2.75rem)',
        padding: 'var(--auth-google-pad, 0.65rem 1rem)',
        'border-radius': 'var(--auth-google-radius, 14px)',
        'font-size': 'var(--auth-google-fs, 0.9rem)',
      },
      footer: {
        'margin-top': 'var(--auth-footer-mt, 0.35rem)',
        'text-align': 'center',
        'font-size': 'var(--auth-footer-fs, 0.85rem)',
      },
    },
    'w<2000': {
      cupWrap: {
        left: 'max(10%, calc(50% - 400px))',
        bottom: '600px',
      },
      washiTapeWrap: {
        left: 'calc(50% + 210px)',
        bottom: '600px',
      },
    },
    'w<1550': {
      signinContainer: {
        'padding-right': '5vw',
      },
      signupContainer: {
        'padding-right': '5vw',
      },
      leftStage: {
        width: 'calc(100% - 650px)',
      },
      pinnedStickerWrap: {
        right: '-60px',
      },
    },
    'w<1500': {
      logoBlock: {
        top: '10%',
        width: '450px',
      },
      helpImg: {
        width: '300px',
      },
      dividerImg: {
        width: '110px',
      },
      sloganImg: {
        width: '280px',
      },
      shelvesWrap: {
        width: '250px',
      },
      windowWrap: {
        width: '280px',
      },
      lampWrap: {
        width: '120px',
      },
      mascot: {
        width: '40vh',
      },
      bookstackWrap: {
        width: '200px',
      },
      cupWrap: {
        bottom: '85%',
        width: '100px',
      },
      linedHeartWrap: {
        left: 'calc(50% - 230px)',
        bottom: '70%',
      },
      vaseWrap: {
        width: '100px',
      },
      diaryWrap: {
        width: '120px',
      },
      noteOpenWrap: {
        width: '150px',
      },
      washiTapeWrap: {
        left: 'calc(50% + 150px)',
        bottom: '500px',
        width: '80px',
      },
    },
    'w<1350': {
      signinContainer: {
        'padding-right': '4vw',
      },
      signupContainer: {
        'padding-right': '4vw',
      },
      leftStage: {
        width: 'calc(100% - 600px)',
      },
      logoBlock: {
        top: '12.5%',
      },
      shelvesWrap: {
        width: '200px',
      },
      windowWrap: {
        width: '240px',
      },
      lampWrap: {
        width: '100px',
      },
      mascot: {
        width: '35vh',
      },
      bookstackWrap: {
        left: 'max(2%, calc(50% - 280px))',
        bottom: '35px',
        width: '160px',
      },
      cupWrap: {
        width: '80px',
      },
      linedHeartWrap: {
        left: 'calc(50% - 200px)',
        bottom: '75%',
      },
      vaseWrap: {
        width: '75px',
      },
      diaryWrap: {
        left: '45%',
        bottom: '50px',
        width: '100px',
      },
      noteOpenWrap: {
        left: 'calc(50% + 140px)',
        bottom: '100px',
        width: '120px',
      },
      washiTapeWrap: {
        width: '50px',
      },
      pinnedStickerWrap: {
        right: '-30px',
        width: '150px',
      },
    },
    'w<1200': {
      signinContainer: {
        'padding-right': '2vw',
      },
      signupContainer: {
        'padding-right': '2vw',
      },
      leftStage: {
        width: 'calc(100% - 480px)',
      },
      logoBlock: {
        top: '17.5%',
      },
      lampWrap: {
        width: '0',
      },
      bookstackWrap: {
        width: '0',
        height: '0',
      },
      cupWrap: {
        left: 'max(2%, calc(50% - 290px))',
        bottom: '43%',
      },
      diaryWrap: {
        width: '0',
        height: '0',
      },
      noteOpenWrap: {
        width: '0',
        height: '0',
      },
      flowerPot: {
        width: '90px',
      },
      peekWrap: {
        width: '100px',
      },
    },
    'w<1024': {
      signinContainer: {
        'align-items': 'center',
        padding: '1.25rem 30px 30px',
      },
      signupContainer: {
        'align-items': 'center',
        padding: '1.25rem 30px 30px',
      },
      leftStage: {
        width: '100%',
      },
      logoBlock: {
        top: '5%',
        width: '300px',
        gap: '0.5rem',
      },
      helpImg: {
        width: '250px',
      },
      sloganImg: {
        width: '0',
      },
      shelvesWrap: {
        width: '150px',
      },
      windowWrap: {
        left: '80%',
        width: '150px',
      },
      lampWrap: {
        left: 'calc(50% - 340px)',
        bottom: '62.5vh',
        width: '100px',
      },
      desk: {
        height: '65vh',
      },
      deskDecor: {
        height: '720px',
      },
      mascot: {
        bottom: 'calc(65vh - 65px)',
        width: '250px',
      },
      bookstackWrap: {
        left: 'calc(50% + 200px)',
        bottom: '67vh',
        width: '100px',
      },
      cupWrap: {
        left: 'calc(50% - 230px)',
        bottom: '100%',
      },
      linedHeartWrap: {
        left: 'calc(50% - 210px)',
        bottom: '70vh',
        width: '70px',
      },
      vaseWrap: {
        left: 'calc(50% + 100px)',
        bottom: 'calc(100% + 40px)',
      },
      washiTapeWrap: {
        left: 'calc(50% + 220px)',
        bottom: '70vh',
      },
      wrap: {
        width: '100%',
        'max-width': '530px',
        'margin-top': 'auto',
        'margin-bottom': '0',
      },
      pinnedStickerWrap: {
        top: '0',
        right: '0',
        width: '0',
      },
      peekWrap: {
        width: '0',
        'margin-right': '0',
      },
      peekUpWrap: {
        width: '300px',
        '--peek-up-overlap': '35px',
      },
    },
    'w<960': {
      adriftBand: {
        bottom: 'auto',
        height: '35vh',
      },
      flowerPot: {
        width: '72px',
      },
      panelDivider: {
        'max-width': '180px',
      },
    },
    'w<700': {
      content: {
        display: 'flex',
        'justify-content': 'center',
        'align-items': 'center',
        padding: '1.25rem 0',
      },
    },
    // 'w<660': {
    //   '.cupWrap': {
    //     bottom: '105%',
    //   },
    // },
    'w<600': {
      bookstackWrap: {
        width: '0',
      },
      lampWrap: {
        width: '0',
      },
      vaseWrap: {
        left: 'calc(50% + 125px)',
        bottom: '58.5vh',
      },
      washiTapeWrap: {
        left: 'calc(50% + 120px)',
        bottom: '72vh',
      },
    },
    'w<540': {
      vaseWrap: {
        left: 'calc(50% + 125px)',
      },
    },
    'w<460': {
      cupWrap: {
        width: '0',
      },
      linedHeartWrap: {
        width: '0',
      },
      vaseWrap: {
        width: '0',
      },
      washiTapeWrap: {
        width: '0',
      },
    },
  },
  'h<1240': {
    'w<': {
      sloganImg: {
        width: '0',
      },
    },
    'w<1500': {
      sloganImg: {
        width: '280px',
      },
    },
    'w<1024': {
      sloganImg: {
        width: '0',
      },
    },
  },
  'h<1150': {
    'w<1024': {
      "wrap[data-mode='signin']": {
        'margin-top': '34.85vh',
      },
      "wrap[data-mode='signup']": {
        'margin-top': '13.2vh',
      },
    },
  },
  'h<1100': {
    'w<': {
      shelvesWrap: {
        width: '250px',
      },
      windowWrap: {
        width: '280px',
      },
    },
    'w<1350': {
      shelvesWrap: {
        width: '200px',
      },
      windowWrap: {
        width: '240px',
      },
    },
    'w<1024': {
      logoBlock: {
        top: '4%',
      },
      sloganImg: {
        width: '0',
      },
      dividerImg: {
        width: '0',
      },
      shelvesWrap: {
        width: '150px',
      },
      windowWrap: {
        width: '150px',
      },
      peekUpWrap: {
        width: '200px',
        '--peek-up-overlap': '25px',
      },
      lampWrap: {
        bottom: ' 67.5vh',
      },
      cupWrap: {
        bottom: ' 67vh',
      },
      linedHeartWrap: {
        bottom: ' 75vh',
      },
      bookstackWrap: {
        bottom: ' 75vh',
      },
      washiTapeWrap: {
        bottom: ' 78vh',
      },
      vaseWrap: {
        bottom: ' 67vh',
      },
    },
  },
  'h<1050': {
    'w<2000': {
      linedHeartWrap: {
        width: '0',
      },
      washiTapeWrap: {
        width: '0',
      },
    },
  },
  'h<1000': {
    'w<': {
      logoBlock: {
        width: '500px',
      },
      helpImg: {
        width: '350px',
      },
      dividerImg: {
        width: '0',
      },
      lampWrap: {
        left: 'max(2%, calc(50% - 350px))',
        bottom: '23vh',
        width: '140px',
      },
      vaseWrap: {
        left: 'min(75%, calc(50% + 180px))',
        bottom: '23vh',
        width: '120px',
      },
      pinnedStickerWrap: {
        top: '0',
        right: '0',
        width: '0',
      },
    },
    'w<1550': {
      pinnedStickerWrap: {
        right: '-60px',
      },
    },
    'w<1500': {
      logoBlock: {
        width: '450px',
      },
      helpImg: {
        width: '300px',
      },
      dividerImg: {
        width: '110px',
      },
    },
    'w<1350': {
      pinnedStickerWrap: {
        right: '-30px',
        width: '150px',
      },
    },
    'w<1200': {
      lampWrap: {
        width: '0',
      },
    },
    'w<1024': {
      logoBlock: {
        width: '300px',
      },
      helpImg: {
        width: '250px',
      },
      lampWrap: {
        left: 'calc(50% - 340px)',
        bottom: '62.5vh',
        width: '100px',
      },
      vaseWrap: {
        left: 'calc(50% + 100px)',
        bottom: '62.5vh',
        width: '75px',
      },
      pinnedStickerWrap: {
        right: '0',
        width: '0',
      },
      peekUpWrap: {
        width: '150px',
        '--peek-up-overlap': '20px',
      },
    },
    'w<540': {
      vaseWrap: {
        left: 'calc(50% + 125px)',
      },
    },
    'w<460': {
      vaseWrap: {
        width: '0',
      },
    },
  },
  'h<900': {
    'w<': {
      shelvesWrap: {
        width: '200px',
      },
      windowWrap: {
        width: '240px',
      },
      bookstackWrap: {
        left: 'max(2%, calc(50% - 350px))',
        width: '170px',
      },
      diaryWrap: {
        left: '45%',
        bottom: '20px',
        width: '120px',
      },
      noteOpenWrap: {
        bottom: '50px',
        width: '150px',
      },
      wrap: {
        '--auth-tabs-mb': '0.55rem',
        '--auth-tabs-pad': '3px',
        '--auth-tabs-fs': '0.65rem',
        '--auth-header-mb': '0.95rem',
        '--auth-heading-fs': '1.3rem',
        '--auth-caption-fs': '0.68rem',
        '--auth-heading-m': '0.25rem 0',
        '--auth-flower-mb': '0.2rem',
        '--auth-divider-mt': '0.5rem',
        '--auth-form-gap': '0.65rem',
        '--auth-field-gap': '0.25rem',
        '--auth-label-fs': '0.6rem',
        '--auth-footer-fs': '0.64rem',
        '--auth-footer-mt': '0.25rem',
        '--auth-link-fs': '0.6rem',
        '--auth-or-fs': '0.6rem',
        '--auth-or-gap': '0.55rem',
        '--auth-error-fs': '0.58rem',
        '--auth-icon-size': '12px',
        '--auth-input-min-h': '2.05rem',
        '--auth-input-fs': '0.68rem',
        '--auth-input-radius': '10px',
        '--auth-input-py': '0.5rem',
        '--auth-input-pis': '1.9rem',
        '--auth-input-pie': '0.65rem',
        '--auth-input-pie-toggle': '2.05rem',
        '--auth-input-icon-offset': '0.65rem',
        '--auth-input-toggle-size': '1.5rem',
        '--auth-primary-min-h': '2.15rem',
        '--auth-primary-fs': '0.7rem',
        '--auth-primary-radius': '12px',
        '--auth-primary-pad': '0.55rem 0.75rem',
        '--auth-google-min-h': '2.05rem',
        '--auth-google-fs': '0.68rem',
        '--auth-google-radius': '10px',
        '--auth-google-pad': '0.5rem 0.75rem',
        '--auth-google-gap': '0.4rem',
      },
      "wrap[data-mode='signin']": {
        '--auth-forgot-mt': '-0.25rem',
      },
      "wrap[data-mode='signup']": {
        '--auth-primary-mt': '0.65rem',
      },
      card: {
        padding: '1.3rem 1.5rem 1.1rem',
        'border-radius': '21px',
      },
      flowerPot: {
        width: '86px',
      },
      panelDivider: {
        'max-width': '150px',
      },
    },
    'w<1500': {
      shelvesWrap: {
        width: '250px',
      },
      windowWrap: {
        width: '280px',
      },
    },
    'w<1350': {
      shelvesWrap: {
        width: '200px',
      },
      windowWrap: {
        width: '240px',
      },
      diaryWrap: {
        bottom: '50px',
        width: '100px',
      },
      noteOpenWrap: {
        bottom: '100px',
        width: '120px',
      },
    },
    'w<1200': {
      bookstackWrap: {
        width: '0',
      },
      diaryWrap: {
        width: '0',
      },
      noteOpenWrap: {
        width: '0',
      },
      flowerPot: {
        width: '68px',
      },
    },
    'w<1024': {
      shelvesWrap: {
        width: '150px',
      },
      windowWrap: {
        width: '150px',
      },
      bookstackWrap: {
        left: 'calc(50% + 200px)',
        width: '100px',
      },
      "wrap[data-mode='signup']": {
        'margin-top': '22vh',
      },
    },
    'w<960': {
      flowerPot: {
        width: '54px',
      },
      panelDivider: {
        'max-width': '135px',
      },
    },
    'w<600': {
      bookstackWrap: {
        width: '0',
      },
    },
  },
  'h<750': {
    'w<': {
      logoBlock: {
        width: '350px',
      },
      helpImg: {
        width: '250px',
      },
      diaryWrap: {
        width: '0',
      },
    },
    'w<1500': {
      logoBlock: {
        width: '450px',
      },
      helpImg: {
        width: '300px',
      },
      diaryWrap: {
        width: '120px',
      },
    },
    'w<1350': {
      diaryWrap: {
        width: '100px',
      },
    },
    'w<1200': {
      diaryWrap: {
        width: '0',
      },
    },
    'w<1024': {
      logoBlock: {
        width: '300px',
      },
      helpImg: {
        width: '250px',
      },
    },
  },
  'h<700': {
    'w<': {
      wrap: {
        '--auth-tabs-mb': '0.4rem',
        '--auth-tabs-pad': '2px',
        '--auth-tabs-fs': '0.5rem',
        '--auth-header-mb': '0.7rem',
        '--auth-heading-fs': '1rem',
        '--auth-caption-fs': '0.5rem',
        '--auth-heading-m': '0.2rem 0',
        '--auth-flower-mb': '0.15rem',
        '--auth-divider-mt': '0.4rem',
        '--auth-form-gap': '0.5rem',
        '--auth-field-gap': '0.2rem',
        '--auth-label-fs': '0.45rem',
        '--auth-footer-fs': '0.48rem',
        '--auth-footer-mt': '0.2rem',
        '--auth-link-fs': '0.45rem',
        '--auth-or-fs': '0.45rem',
        '--auth-or-gap': '0.4rem',
        '--auth-error-fs': '0.45rem',
        '--auth-icon-size': '9px',
        '--auth-input-min-h': '1.55rem',
        '--auth-input-fs': '0.5rem',
        '--auth-input-radius': '8px',
        '--auth-input-py': '0.4rem',
        '--auth-input-pis': '1.4rem',
        '--auth-input-pie': '0.5rem',
        '--auth-input-pie-toggle': '1.55rem',
        '--auth-input-icon-offset': '0.5rem',
        '--auth-input-toggle-size': '1.15rem',
        '--auth-primary-min-h': '1.6rem',
        '--auth-primary-fs': '0.55rem',
        '--auth-primary-radius': '9px',
        '--auth-primary-pad': '0.4rem 0.55rem',
        '--auth-google-min-h': '1.55rem',
        '--auth-google-fs': '0.5rem',
        '--auth-google-radius': '8px',
        '--auth-google-pad': '0.4rem 0.55rem',
        '--auth-google-gap': '0.3rem',
      },
      "wrap[data-mode='signin']": {
        '--auth-forgot-mt': '-0.2rem',
      },
      "wrap[data-mode='signup']": {
        '--auth-primary-mt': '0.5rem',
      },
      card: {
        padding: '1rem 1.15rem 0.85rem',
        'border-radius': '16px',
      },
      flowerPot: {
        width: '65px',
      },
      panelDivider: {
        'max-width': '113px',
      },
    },
    'w<1200': {
      flowerPot: {
        width: '51px',
      },
    },
    'w<960': {
      flowerPot: {
        width: '40px',
      },
      panelDivider: {
        'max-width': '101px',
      },
    },
  },
  'h<675': {
    // 'w<1024': {
    //   lampWrap: {
    //     left: 'max(2%, calc(50% - 480px))',
    //     bottom: '280px',
    //     width: '0',
    //   },
    //   bookstackWrap: {
    //     width: '0',
    //   },
    //   vaseWrap: {
    //     width: '0',
    //   },
    // },
  },
  'h<550': {
    'w<': {
      wrap: {
        '--auth-tabs-mb': '0.3rem',
        '--auth-tabs-fs': '0.4rem',
        '--auth-header-mb': '0.5rem',
        '--auth-heading-fs': '0.75rem',
        '--auth-caption-fs': '0.4rem',
        '--auth-heading-m': '0.15rem 0',
        '--auth-flower-mb': '0.1rem',
        '--auth-divider-mt': '0.3rem',
        '--auth-form-gap': '0.4rem',
        '--auth-field-gap': '0.15rem',
        '--auth-label-fs': '0.35rem',
        '--auth-footer-fs': '0.36rem',
        '--auth-footer-mt': '0.15rem',
        '--auth-link-fs': '0.35rem',
        '--auth-or-fs': '0.35rem',
        '--auth-or-gap': '0.3rem',
        '--auth-error-fs': '0.35rem',
        '--auth-icon-size': '7px',
        '--auth-input-min-h': '1.15rem',
        '--auth-input-fs': '0.4rem',
        '--auth-input-radius': '6px',
        '--auth-input-py': '0.3rem',
        '--auth-input-pis': '1.05rem',
        '--auth-input-pie': '0.4rem',
        '--auth-input-pie-toggle': '1.15rem',
        '--auth-input-icon-offset': '0.4rem',
        '--auth-input-toggle-size': '0.85rem',
        '--auth-primary-min-h': '1.2rem',
        '--auth-primary-fs': '0.4rem',
        '--auth-primary-radius': '7px',
        '--auth-primary-pad': '0.3rem 0.4rem',
        '--auth-google-min-h': '1.15rem',
        '--auth-google-fs': '0.4rem',
        '--auth-google-radius': '6px',
        '--auth-google-pad': '0.3rem 0.4rem',
        '--auth-google-gap': '0.25rem',
      },
      "wrap[data-mode='signin']": {
        '--auth-forgot-mt': '-0.15rem',
      },
      "wrap[data-mode='signup']": {
        '--auth-primary-mt': '0.4rem',
      },
      card: {
        padding: '0.75rem 0.85rem 0.65rem',
        'border-radius': '12px',
      },
      flowerPot: {
        width: '49px',
      },
      panelDivider: {
        'max-width': '85px',
      },
    },
    'w<1200': {
      flowerPot: {
        width: '38px',
      },
    },
    'w<960': {
      flowerPot: {
        width: '30px',
      },
      panelDivider: {
        'max-width': '76px',
      },
    },
  },
} as const satisfies AuthResponsiveConfig;

const authClassNames: Readonly<Record<string, string>> = {
  ...pageStyles,
  ...leftStyles,
  ...cardStyles,
};

function breakpointValue(key: string): number | null {
  if (key === 'h<' || key === 'w<') return null;
  const value = Number(key.slice(2));
  if (!Number.isFinite(value)) {
    throw new Error(`Invalid auth responsive breakpoint: ${key}`);
  }
  return value;
}

function sortedBuckets<T>(entries: readonly [string, T][]) {
  return [...entries].sort(([left], [right]) => {
    const leftValue = breakpointValue(left);
    const rightValue = breakpointValue(right);
    if (leftValue == null) return rightValue == null ? 0 : -1;
    if (rightValue == null) return 1;
    return rightValue - leftValue;
  });
}

function scopeSelector(selector: string): string {
  const scopeClassName = (className: string) => {
    const scopedClassName = authClassNames[className];
    if (!scopedClassName) {
      throw new Error(
        `Unknown auth CSS-module class "${className}" in responsive config`,
      );
    }
    return scopedClassName;
  };

  const firstClass = /^([A-Za-z_][\w-]*)/.exec(selector);
  if (!firstClass) {
    return selector.replace(
      /\.([A-Za-z_][\w-]*)/g,
      (_, className: string) => `.${scopeClassName(className)}`,
    );
  }

  const remainder = selector
    .slice(firstClass[0].length)
    .replace(
      /\.([A-Za-z_][\w-]*)/g,
      (_, className: string) => `.${scopeClassName(className)}`,
    );
  return `.${scopeClassName(firstClass[1])}${remainder}`;
}

function renderSelectorRules(rules: AuthSelectorRules): string {
  return Object.entries(rules)
    .map(([selector, declarations]) => {
      const body = Object.entries(declarations)
        .map(([property, value]) => `${property}:${value};`)
        .join('');
      return `${scopeSelector(selector)}{${body}}`;
    })
    .join('');
}

/** Convert the editable config to scoped CSS in deterministic cascade order. */
export function buildAuthResponsiveCss(
  config: AuthResponsiveConfig = authResponsiveConfig,
): string {
  const output: string[] = [];
  for (const [heightKey, widthBuckets] of sortedBuckets(
    Object.entries(config),
  )) {
    if (!widthBuckets) continue;
    const height = breakpointValue(heightKey);
    for (const [widthKey, rules] of sortedBuckets(
      Object.entries(widthBuckets),
    )) {
      if (!rules) continue;
      const width = breakpointValue(widthKey);
      const css = renderSelectorRules(rules);
      if (height == null && width == null) output.push(css);
      else {
        const conditions = [
          height == null ? null : `(height < ${height}px)`,
          width == null ? null : `(width < ${width}px)`,
        ].filter(Boolean);
        output.push(`@media ${conditions.join(' and ')}{${css}}`);
      }
    }
  }
  return output.join('\n');
}

/** Mount once on the auth page; native media queries handle viewport changes. */
export const AuthResponsiveStyles: FC = () =>
  createElement(
    'style',
    { 'data-auth-responsive-config': true },
    buildAuthResponsiveCss(),
  );
