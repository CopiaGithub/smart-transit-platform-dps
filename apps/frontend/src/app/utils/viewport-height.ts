/**
 * Keeps --app-height in sync with the real visible viewport.
 * Needed on mobile Chrome, where 100vh/100dvh often overshoot the
 * address bar / bottom toolbar and clip fixed shells (logout, page actions).
 */
export function bindAppViewportHeight(): () => void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return () => undefined;
  }

  const root = document.documentElement;

  const update = () => {
    // Use the smaller of visualViewport/innerHeight so Chrome's toolbar
    // never leaves the shell taller than what the user can see.
    const visual = window.visualViewport?.height;
    const inner = window.innerHeight;
    const fallback = root.clientHeight;
    const height = Math.round(
      visual && inner ? Math.min(visual, inner) : visual || inner || fallback,
    );
    if (height > 0) {
      root.style.setProperty('--app-height', `${height}px`);
    }
  };

  update();

  window.addEventListener('resize', update);
  window.addEventListener('orientationchange', update);
  window.visualViewport?.addEventListener('resize', update);
  window.visualViewport?.addEventListener('scroll', update);

  // Chrome can settle the toolbar after the first paint / focus changes.
  window.setTimeout(update, 0);
  window.setTimeout(update, 250);

  return () => {
    window.removeEventListener('resize', update);
    window.removeEventListener('orientationchange', update);
    window.visualViewport?.removeEventListener('resize', update);
    window.visualViewport?.removeEventListener('scroll', update);
  };
}
