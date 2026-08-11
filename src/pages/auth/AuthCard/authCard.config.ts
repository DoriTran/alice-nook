/**
 * Tunable layout knobs for the auth sign-in / sign-up card.
 * Edit numbers here — AuthCard applies them as inline styles.
 *
 * When you widen `panel.width`, also bump
 * `authDecor.stage.width` (left panel) so the illustration zone
 * does not collide with the card. Rule of thumb:
 *   stage reserve ≈ panel max width + peek width + right inset + ~100px gap
 *   e.g. 560 + 132 + 40 + ~90 ≈ 820 → calc(100% - 820px)
 *
 * Panel position knobs (optional):
 *   right / left / top / bottom — absolute insets
 *   centered: true — translateX(-50%); use with left: '50%'
 *   Setting bottom (or centered) clears the default vertical-center.
 *
 * Responsive overrides (optional on any entry) — CSS paste-back map:
 *   '<900'              →  @media (width < 900px)   { … }
 *   'w<900'             →  @media (width < 900px)   { … }
 *   'h<900'             →  @media (height < 900px)  { … }
 *   'h<960,w<1000'      →  @media (height < 960px) and (width < 1000px)
 *   'w<1200,w>=1024'    →  @media (width < 1200px) and (width >= 1024px)
 *   '1024<=w<1200'      →  same width band (range sugar)
 *   'h<960px,w<1000px'  →  same (optional `px`; spaces around `,` ok)
 * Nested keys shallow-merge over the base props. Height merges before width;
 * combined AND keys apply last.
 */
export const authCard = {
  panel: {
    width: '560px',
    right: '8vw',
    padding: '1.75rem 2rem 1.5rem',
    borderRadius: '28px',
    maxHeight: '98vh',
    'w<1550': {
      width: '530px',
      right: '5vw',
    },
    'w<1350': {
      width: '480px',
      right: '4vw',
    },
    'w<1200': {
      width: '420px',
      right: '2vw',
    },
    'w<1024': {
      width: '600px',
      left: '50%',
      right: 'auto',
      top: 'auto',
      bottom: '30px',
      centered: true,
    },
    'w<700': {
      width: 'calc(100% - 60px)',
    },
  },

  pinnedSticker: {
    top: '-70px',
    right: '-80px',
    width: '200px',
    rotate: '8deg',
    anim: { float: 6, rotate: 3, duration: 5 },
    'w<1550': {
      right: '-60px',
    },
    'w<1350': {
      right: '-30px',
      width: '150px',
    },
    'w<1024': {
      width: '0px',
      top: '0px',
      right: '0px',
    },
    'h<1000': {
      width: '0px',
      top: '0px',
      right: '0px',
    },
  },

  peek: {
    width: '150px',
    bottom: '50px',
    overlap: '-10px',
    '<1200': { width: '120px' },
    'w<1024': { width: '0px', overlap: '0px' },
  },

  /** Top-peek mascot — signup only; AuthCard also gates on mode === 'signup'. */
  peekUp: {
    width: '0px',
    duration: 0.45,
    'w<1024,h>1100': {
      overlap: '35px',
      width: '300px',
    },
    'w<1024,h>1024': {
      overlap: '25px',
      width: '200px',
    },
    'w<1024,h>990': {
      overlap: '20px',
      width: '150px',
    },
  },

  flowerPot: {
    width: '115px',
    '<1200': { width: '90px' },
    '<960': { width: '72px' },
  },
  panelDivider: {
    maxWidth: '200px',
    '<960': { maxWidth: '180px' },
  },
} as const;
