export type AuthDecorAnim = {
  float?: number;
  drift?: number;
  rotate?: number;
  duration?: number;
  delay?: number;
};

export const authDecorAnim = {
  shelves: { float: 15, drift: 5, rotate: 0, duration: 20, delay: 0.4 },
  window: { float: 15, drift: 5, rotate: 0, duration: 20, delay: 0.4 },
  lamp: { float: 8, drift: 8, rotate: 3, duration: 10, delay: 0.8 },
  bookstack: { float: 10, drift: 3, rotate: 5, duration: 10, delay: 0.2 },
  cup: { float: 5, drift: 4, rotate: 10, duration: 10, delay: 1 },
  linedHeart: { float: 7, drift: 5, rotate: 3, duration: 4, delay: 0.6 },
  vase: { float: 5, drift: 3, rotate: 1.5, duration: 5.5, delay: 1.4 },
  diary: { float: 4, drift: 3, rotate: 1.5, duration: 6, delay: 0.3 },
  noteOpen: { float: 5, drift: 4, rotate: 2, duration: 5, delay: 1.8 },
  washiTape: { float: 16, drift: 4, rotate: 15, duration: 10, delay: 0.9 },
} as const;
