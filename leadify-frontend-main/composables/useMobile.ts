import { useWindowSize } from '@vueuse/core';

interface SwipeState {
  direction: Ref<'left' | 'right' | 'up' | 'down' | null>;
  distance: Ref<number>;
  isSwiping: Ref<boolean>;
}

interface SwipeDetection {
  onTouchStart: (e: TouchEvent) => void;
  onTouchMove: (e: TouchEvent) => void;
  onTouchEnd: () => void;
}

export function useMobile() {
  const { width } = useWindowSize();

  /** True when viewport width is below 768px (mobile phones) */
  const isMobile = computed(() => width.value < 768);

  /** True when viewport width is between 768px and 1024px (tablets) */
  const isTablet = computed(() => width.value >= 768 && width.value <= 1024);

  /** True when viewport width is above 1024px (desktop) */
  const isDesktop = computed(() => width.value > 1024);

  /**
   * Create swipe detection handlers for a touch target.
   * Returns reactive direction and distance plus touch event handlers.
   *
   * Usage:
   * ```ts
   * const { direction, distance, isSwiping, onTouchStart, onTouchMove, onTouchEnd } = useSwipe();
   * ```
   */
  function useSwipe(minDistance = 30): SwipeState & SwipeDetection {
    const direction = ref<'left' | 'right' | 'up' | 'down' | null>(null);
    const distance = ref(0);
    const isSwiping = ref(false);

    let startX = 0;
    let startY = 0;
    let startTime = 0;

    function onTouchStart(e: TouchEvent) {
      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      startTime = Date.now();
      direction.value = null;
      distance.value = 0;
      isSwiping.value = true;
    }

    function onTouchMove(e: TouchEvent) {
      if (!isSwiping.value) return;

      const touch = e.touches[0];
      const diffX = touch.clientX - startX;
      const diffY = touch.clientY - startY;
      const absDiffX = Math.abs(diffX);
      const absDiffY = Math.abs(diffY);

      distance.value = Math.sqrt(diffX * diffX + diffY * diffY);

      if (absDiffX > absDiffY) {
        direction.value = diffX > 0 ? 'right' : 'left';
      } else {
        direction.value = diffY > 0 ? 'down' : 'up';
      }
    }

    function onTouchEnd() {
      const elapsed = Date.now() - startTime;

      // Only count as a swipe if distance exceeds minimum and it was fast enough
      if (distance.value < minDistance || elapsed > 800) {
        direction.value = null;
        distance.value = 0;
      }

      isSwiping.value = false;
    }

    return {
      direction,
      distance,
      isSwiping,
      onTouchStart,
      onTouchMove,
      onTouchEnd
    };
  }

  /**
   * Trigger haptic feedback if the device supports the Vibration API.
   * @param pattern - Vibration pattern in milliseconds. Default: single short pulse.
   *
   * Usage:
   * ```ts
   * vibrate();         // single 10ms tap
   * vibrate([50]);     // 50ms pulse
   * vibrate([50, 30, 50]); // pattern: vibrate-pause-vibrate
   * ```
   */
  function vibrate(pattern: number | number[] = 10): boolean {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        return navigator.vibrate(pattern);
      } catch {
        return false;
      }
    }
    return false;
  }

  /**
   * Check if the device supports touch input.
   */
  const hasTouch = computed(() => {
    if (typeof window === 'undefined') return false;
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  });

  /**
   * Orientation: 'portrait' or 'landscape'
   */
  const orientation = computed(() => {
    if (typeof window === 'undefined') return 'portrait';
    return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
  });

  return {
    isMobile,
    isTablet,
    isDesktop,
    hasTouch,
    orientation,
    useSwipe,
    vibrate
  };
}
