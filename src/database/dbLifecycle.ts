/**
 * Lightweight DB lifecycle logging for diagnosing connection close/reopen races.
 * Logs are gated to __DEV__ to avoid production noise.
 */

type DbLifecycleContext = Record<string, unknown>;

export function logDbLifecycle(event: string, context?: DbLifecycleContext): void {
  if (!__DEV__) {
    return;
  }

  if (context) {
    console.log(`[db] ${event}`, context);
  } else {
    console.log(`[db] ${event}`);
  }
}
