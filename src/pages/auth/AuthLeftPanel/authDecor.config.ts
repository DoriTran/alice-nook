/**
 * Tunable layout knobs for the auth left-panel decorations.
 * Edit numbers here — AuthLeftPanel applies them as inline styles.
 *
 * Units are CSS strings so you can mix %, vh, px, rem, min(), etc.
 * - stage / logo / shelves / window / lamp → % of .leftStage (unless vh/px)
 * - mascot + desk props left/bottom → % of .deskDecor
 * - `anim` drives the floating motion (AdAnimation) for everything except
 *   the mascot and logo/text — omit `anim` to leave an item stationary.
 * - Optional on any décor item (incl. mascot): `opacity` (0–1) and
 *   `blur` (CSS length, e.g. '1px'). Omit both for full opacity / no blur.
 *
 * Responsive overrides (optional on any entry) — CSS paste-back map:
 *   '<900'              →  @media (width < 900px)   { … }   // width shorthand
 *   'w<900'             →  @media (width < 900px)   { … }
 *   'h<900'             →  @media (height < 900px)  { … }
 *   'w>=1200'           →  @media (width >= 1200px) { … }
 *   'h<960,w<1000'      →  @media (height < 960px) and (width < 1000px)
 *   'w<1200,w>=1024'    →  @media (width < 1200px) and (width >= 1024px)
 *   '1024<=w<1200'      →  same width band (range sugar)
 *   'h<960px,w<1000px'  →  same (optional `px`; spaces around `,` ok)
 * Nested keys shallow-merge over the base props. Narrower `<` breakpoints
 * win over wider ones when both match. Height merges before width so
 * `w<…` layouts win over `h<…` tweaks; combined AND keys apply last.
 */
export const authDecor = {
  stage: {
    width: 'calc(100% - 700px)',
    'w<1550': {
      width: 'calc(100% - 650px)',
    },
    'w<1350': {
      width: 'calc(100% - 600px)',
    },
    'w<1200': {
      width: 'calc(100% - 480px)',
    },
    'w<1024': {
      width: '100%',
    },
  },
  mascot: {
    left: '47.5%',
    bottom: '25%',
    width: '47.5vh',
    rotate: '0deg',
    centered: true,
    'w<1500': {
      width: '40vh',
    },
    'w<1350': {
      width: '35vh',
    },
    'w<1024': {
      width: '250px',
      bottom: 'calc(65vh - 65px)',
    },
    'w<1024,h<1200': {
      width: '18vh',
    },
    'w<1024,h<1100': {
      width: '0',
    },
  },
  logoBlock: {
    top: '8%',
    left: '50%',
    width: '600px',
    gap: '1.5rem',
    helpWidth: '400px',
    dividerWidth: '140px',
    sloganWidth: '350px',
    'w<1500': {
      top: '10%',
      width: '450px',
      helpWidth: '300px',
      dividerWidth: '110px',
      sloganWidth: '280px',
    },
    'w<1350': {
      top: '12.5%',
    },
    'h<1240': {
      sloganWidth: '0',
    },
    'w<1200': {
      top: '17.5%',
    },
    'w<1024': {
      top: '5%',
      width: '300px',
      helpWidth: '250px',
      gap: '0.5rem',
    },
    'w<1024,h>=1100': {
      sloganWidth: '0',
    },
    'h<1000': {
      dividerWidth: '0',
      width: '500px',
      helpWidth: '350px',
    },
    'h<750': {
      width: '350px',
      helpWidth: '250px',
    },
    'w<1024,h<1100': {
      top: '8%',
      sloganWidth: '200px',
    },
  },
  desk: {
    height: '28vh',
    minHeight: '28vh',
    sideBleed: '-4%',
    decorHeight: '640px',
    decorMinHeight: '42vh',
    'w<1024': {
      height: '65vh',
      decorHeight: '720px',
    },
  },
  shelves: {
    top: '6%',
    left: '-2%',
    width: '350px',
    opacity: 0.75 /** 0–1 */,
    blur: '1px' /** '1.5px' */,
    anim: { float: 15, drift: 5, rotate: 0, duration: 20, delay: 0.4 },
    'w<1500': {
      width: '250px',
    },
    'w<1350': {
      width: '200px',
    },
    'w<1024': {
      width: '150px',
    },
    'h<1100': {
      width: '250px',
    },
    'h<900': {
      width: '200px',
    },
  },
  window: {
    top: '15%',
    left: '86%',
    width: '320px',
    opacity: 0.75 /** 0–1 */,
    blur: '1px' /** '1.5px' */,
    anim: { float: 15, drift: 5, rotate: 0, duration: 20, delay: 0.4 },
    'w<1500': {
      width: '280px',
    },
    'w<1350': {
      width: '240px',
    },
    'w<1024': {
      width: '150px',
      left: '80%',
    },
    'h<1100': {
      width: '280px',
    },
    'h<900': {
      width: '240px',
    },
  },
  lamp: {
    left: 'max(2%, calc(50% - 480px))',
    bottom: '280px',
    width: '150px',
    anim: { float: 8, drift: 8, rotate: 3, duration: 10, delay: 0.8 },
    'w<1500': {
      width: '120px',
    },
    'w<1350': {
      width: '100px',
    },
    '1024<=w<1200': {
      width: '0px',
    },
    'w<1024,h>=675': {
      width: '100px',
      bottom: '62.5vh',
      left: 'calc(50% - 340px)',
    },
    'h<675,w<1024': {
      width: '0px',
    },
    'w<660': {
      width: '0px',
    },
    'h<1000,w>=1024': {
      bottom: '23vh',
      left: 'max(2%, calc(50% - 350px))',
      width: '140px',
    },
  },
  bookstack: {
    left: 'max(2%, calc(50% - 470px))',
    bottom: '20px',
    width: '250px',
    anim: { float: 10, drift: 3, rotate: 5, duration: 10, delay: 0.2 },
    'w<1500': {
      width: '200px',
    },
    'w<1350': {
      width: '160px',
      left: 'max(2%, calc(50% - 280px))',
      bottom: '35px',
    },
    '1024<=w<1200': {
      width: '0px',
      height: '0px',
    },
    'w<1024': {
      width: '100px',
      bottom: '60vh',
      left: 'calc(50% + 200px)',
    },
    'h<675,w<1024': {
      width: '0px',
    },
    'w<600': {
      width: '0px',
    },
    'h<900,w>=1024': {
      width: '170px',
      left: 'max(2%, calc(50% - 350px))',
    },
  },
  cup: {
    left: 'max(2%, calc(50% - 650px))',
    bottom: '200px',
    width: '125px',
    anim: { float: 5, drift: 4, rotate: 10, duration: 10, delay: 1 },
    'w<2000': {
      left: 'max(10%, calc(50% - 400px))',
      bottom: '600px',
    },
    'w<1500': {
      width: '100px',
      bottom: '85%',
    },
    'w<1350': {
      width: '80px',
    },
    'w<1200': {
      bottom: '43%',
      left: 'max(2%, calc(50% - 290px))',
    },
    'w<1024': {
      bottom: '100%',
      left: 'calc(50% - 230px)',
    },
    'w<660': {
      bottom: '105%',
    },
    'h<1050,w<2000': {
      width: '0px',
    },
    'w<460': {
      width: '0px',
    },
  },
  linedHeart: {
    left: 'calc(50% - 275px)',
    bottom: '85%',
    width: 'min(12%, 86px)',
    rotate: '-8deg',
    anim: { float: 7, drift: 5, rotate: 3, duration: 4, delay: 0.6 },
    'w<1500': {
      left: 'calc(50% - 230px)',
      bottom: '70%',
    },
    'w<1350': {
      left: 'calc(50% - 200px)',
      bottom: '75%',
    },
    'w<1024': {
      width: '70px',
      bottom: '70vh',
      left: 'calc(50% - 210px)',
    },
    'w<460': {
      width: '0px',
    },
    'h<1050,w<2000': {
      width: '0px',
    },
  },
  vase: {
    left: 'min(75%, calc(50% + 210px))',
    bottom: '250px',
    width: '150px',
    anim: { float: 5, drift: 3, rotate: 1.5, duration: 5.5, delay: 1.4 },
    'w<1500': {
      width: '100px',
    },
    'w<1350': {
      width: '75px',
    },
    'w<1200': {
      bottom: '250px',
    },
    'w<1024': {
      bottom: 'calc(100% + 40px)',
      left: 'calc(50% + 100px)',
    },
    'h<675,w<1024': {
      width: '0px',
    },
    'w<540': {
      left: 'calc(50% + 125px)',
    },
    'w<460': {
      width: '0px',
    },
    'h<1000,w>=1024': {
      bottom: '23vh',
      width: '120px',
      left: 'min(75%, calc(50% + 180px))',
    },
  },
  diary: {
    left: '50%',
    bottom: '40px',
    width: '150px',
    rotate: '-6deg',
    anim: { float: 4, drift: 3, rotate: 1.5, duration: 6, delay: 0.3 },
    'w<1500': {
      width: '120px',
    },
    'w<1350': {
      width: '100px',
      left: '45%',
      bottom: '50px',
    },
    'w<1200': {
      width: '0px',
      height: '0px',
    },
    'h<900': {
      width: '120px',
      left: '45%',
      bottom: '20px',
    },
    'h<750': {
      width: '0px',
    },
  },
  noteOpen: {
    left: 'min(88%, calc(50% + 180px))',
    bottom: '12%',
    width: '200px',
    rotate: '4deg',
    anim: { float: 5, drift: 4, rotate: 2, duration: 5, delay: 1.8 },
    'w<1500': {
      width: '150px',
    },
    'w<1350': {
      width: '120px',
      left: 'calc(50% + 140px)',
      bottom: '100px',
    },
    'w<1200': {
      width: '0px',
      height: '0px',
    },
    'h<900': {
      width: '150px',
      left: 'min(88%, calc(50% + 180px))',
      bottom: '50px',
    },
  },
  washiTape: {
    left: 'min(88%, calc(50% + 400px))',
    bottom: '180px',
    width: '100px',
    rotate: '18deg',
    anim: { float: 16, drift: 4, rotate: 15, duration: 10, delay: 0.9 },
    'w<2000': {
      left: 'calc(50% + 210px)',
      bottom: '600px',
    },
    'w<1500': {
      width: '80px',
      bottom: '500px',
      left: 'calc(50% + 150px)',
    },
    'w<1350': {
      width: '50px',
    },
    'w<1024': {
      width: '50px',
      bottom: '70vh',
      left: 'calc(50% + 220px)',
    },
    'w<540': {
      width: '0px',
    },
    'h<675,w<1024': {
      width: '0px',
    },
    'h<1050,w<2000': {
      width: '0px',
    },
  },
} as const;

export type AuthDecorAnim = {
  float?: number;
  drift?: number;
  rotate?: number;
  duration?: number;
  delay?: number;
};

export type AuthDecorItem = {
  left?: string;
  top?: string;
  bottom?: string;
  width?: string;
  /** Static resting tilt — unrelated to `anim.rotate` (the wobble amount). */
  rotate?: string;
  centered?: boolean;
  /** 0–1 */
  opacity?: number;
  /** CSS length, e.g. '1.5px' */
  blur?: string;
  anim?: AuthDecorAnim;
};
