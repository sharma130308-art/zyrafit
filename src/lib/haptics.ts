/**
 * Haptic feedback that uses native @capacitor/haptics on iOS/Android
 * (when running inside the Capacitor shell) and falls back to the
 * Web Vibration API on browsers. Silently no-ops on unsupported devices
 * (e.g. iOS Safari, which doesn't expose navigator.vibrate).
 */
import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";

const isNative = () => {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
};

function webVibrate(pattern: number | number[]) {
  try {
    navigator?.vibrate?.(pattern);
  } catch {
    // silently ignore
  }
}

/** Light tap — button press, selection */
export function hapticLight() {
  if (isNative()) {
    Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
    return;
  }
  webVibrate(10);
}

/** Medium tap — confirm action, toggle */
export function hapticMedium() {
  if (isNative()) {
    Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
    return;
  }
  webVibrate(20);
}

/** Heavy tap — delete, error, important action */
export function hapticHeavy() {
  if (isNative()) {
    Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});
    return;
  }
  webVibrate([30, 10, 30]);
}

/** Success — completed action */
export function hapticSuccess() {
  if (isNative()) {
    Haptics.notification({ type: NotificationType.Success }).catch(() => {});
    return;
  }
  webVibrate([10, 30, 10]);
}
