/**
 * Lightweight haptic feedback using the Vibration API.
 * Falls back silently on devices/browsers that don't support it.
 */

function vibrate(pattern: number | number[]) {
  try {
    navigator?.vibrate?.(pattern);
  } catch {
    // silently ignore
  }
}

/** Light tap — button press, selection */
export function hapticLight() {
  vibrate(10);
}

/** Medium tap — confirm action, toggle */
export function hapticMedium() {
  vibrate(20);
}

/** Heavy tap — delete, error, important action */
export function hapticHeavy() {
  vibrate([30, 10, 30]);
}

/** Success — completed action */
export function hapticSuccess() {
  vibrate([10, 30, 10]);
}
