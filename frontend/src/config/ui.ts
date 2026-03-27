export const uiConfig = {
  overscroll: {
    thresholdPx: 90,
    holdMs: 220,
    cooldownMs: 1200,
  },
  gallery: {
    swipeThresholdPx: 45,
    transitionMs: 220,
  },
  shopPageLoader: {
    requestTimeoutMs: 4000,
    halfTimeoutMs: 2000,
    retryCount: 1,
    retryDelayMs: 300,
  },
} as const;
