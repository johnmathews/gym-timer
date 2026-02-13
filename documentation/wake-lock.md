# Wake Lock (Screen-On Lock)

## Overview

The app uses the Screen Wake Lock API to prevent the screen from dimming or locking while the timer is running. This is essential for gym use where you need to glance at the timer without touching the phone.

## Behavior

Wake lock is **always-on** when the timer is active — there is no toggle button. It activates automatically when the timer starts and releases when the timer is reset or finishes.

### Lifecycle

1. **Timer starts** (`isActive` becomes true) → wake lock is acquired
2. **Timer runs** → wake lock held continuously
3. **Timer paused** → wake lock is still held (user may resume soon)
4. **Timer reset/finished** (`isActive` becomes false) → wake lock is released

### Visibility Handling

If the page is backgrounded, the browser may release the wake lock. When the page becomes visible again, the wake lock is re-acquired via a `visibilitychange` event listener.

## Implementation

The wake lock logic is inlined in `src/routes/+page.svelte` using a Svelte 5 `$effect`:

```typescript
$effect(() => {
  if (isActive && canWakeLock) {
    acquireWakeLock();
  } else {
    releaseWakeLock();
  }
});
```

- `canWakeLock` is set to `true` on mount if `navigator.wakeLock` is available
- `acquireWakeLock()` calls `navigator.wakeLock.request("screen")` and attaches a release listener
- `releaseWakeLock()` calls `sentinel.release()` on the stored `WakeLockSentinel`

## Browser Support

The Screen Wake Lock API is supported in:
- Chrome 84+
- Safari 16.4+ (iOS 16.4+)
- Firefox 126+

The app gracefully degrades — if the API isn't available, `canWakeLock` stays `false` and no lock is attempted.

## History

Previously, wake lock was controlled by a toggle button (`WakeLockButton` component) that persisted its state in localStorage. This was removed in favor of always-on behavior since there's no practical reason to want the screen to lock during an active timer.
