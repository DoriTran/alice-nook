export type AdriftDecoration = {
  asset: string;
  /**
   * Vertical start as % of the layer height.
   * Negative values start slightly above the clip edge (drop in from the top).
   */
  top: number;
  /** Width in px. */
  size: number;
  /**
   * Downward travel angle from horizontal, in degrees (typically 5–35).
   * Path always goes left → right.
   */
  angle: number;
  /** Full-screen travel cycle duration in seconds (typically 30–80). */
  travelDuration: number;
  /** Negative delay starts the decoration mid-path on load. */
  travelDelay?: number;
  float?: number;
  drift?: number;
  rotate?: number;
  scale?: number;
  floatDuration?: number;
  opacity?: number;
  blur?: number;
};
