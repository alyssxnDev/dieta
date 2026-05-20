export function haptic(ms = 10) {
  if (typeof navigator === "undefined") return
  if (typeof navigator.vibrate !== "function") return
  try {
    navigator.vibrate(ms)
  } catch {
    // Safari iOS ignores; some browsers throw on user-gesture rules. Best effort.
  }
}
