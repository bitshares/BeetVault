import { powerMonitor, systemPreferences } from 'electron';

/**
 * Internal cleanup function that removes all power monitor listeners
 * and macOS notification subscriptions registered by {@link initPowerMonitor}.
 *
 * @type {function}
 * @private
 */
let _powerMonitorCleanup = () => {};

/**
 * Wires up Electron's powerMonitor to force a logout when the system
 * suspends, shuts down, or the screen is locked.
 *
 * On macOS, also subscribes to the `NSWorkspaceSessionDidResignActiveNotification`
 * notification to detect screen lock (since powerMonitor does not emit
 * `lock-screen` on macOS).
 *
 * Must be called after `app.whenReady()` resolves, as it uses
 * `powerMonitor` which requires the app to be ready.
 *
 * @param {function} forceLogoutFn - Callback to invoke when a system power
 *   event is detected. Typically calls the session manager's `forceLogout`.
 * @returns {void}
 */
export function initPowerMonitor(forceLogoutFn) {
    const cleanupFns = [];

    const onSystemEvent = () => forceLogoutFn();

    // suspend / shutdown / lock-screen -> forceLogout
    const events = ['suspend', 'shutdown', 'lock-screen'];
    events.forEach((evt) => {
        powerMonitor.on(evt, onSystemEvent);
        cleanupFns.push(() => powerMonitor.removeListener(evt, onSystemEvent));
    });

    // macOS does not emit "lock-screen" via powerMonitor. Fall back to the
    // workspace session-resigned-active notification so lock-screen is
    // detected here too. systemPreferences may be undefined on some
    // builds, hence the guard.
    if (process.platform === 'darwin' && systemPreferences) {
        const subscription = systemPreferences.subscribeNotification(
            'NSWorkspaceSessionDidResignActiveNotification',
            onSystemEvent
        );
        if (subscription) {
            cleanupFns.push(() => subscription.unsubscribe());
        }
    }

    _powerMonitorCleanup = () => cleanupFns.forEach((fn) => fn());
}

/**
 * Tears down all power-monitor listeners and macOS notification
 * subscriptions registered by {@link initPowerMonitor}.
 *
 * Should be called during `before-quit` to prevent power events from
 * re-firing during shutdown and causing a double forceLogout race.
 *
 * @returns {void}
 */
export function cleanupPowerMonitor() {
    _powerMonitorCleanup();
}
