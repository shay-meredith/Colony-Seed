/**
 * Registers public/sw.js in production builds only, so dev never serves stale
 * cached modules. Scope is the Pages base path (/Colony-Seed/).
 */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  const base = import.meta.env.BASE_URL;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${base}sw.js`, { scope: base }).catch((err: unknown) => {
      console.warn('Service worker registration failed', err);
    });
  });
}
