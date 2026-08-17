import { useFocusEffect } from "@react-navigation/native";
import NetInfo from "@react-native-community/netinfo";
import { useCallback, useEffect, useRef } from "react";

/** There is no push channel yet (Appendix A), so screens ask repeatedly. */
export const POLL_MS = 5000;

/**
 * Runs `tick` while the screen is focused, and stops when it is not.
 *
 * Two rules keep this honest: never poll a screen the user cannot see, and
 * never poll while the device is offline — a gate phone on a weak school
 * Wi-Fi would otherwise spend the whole dispersal timing out and draining
 * itself instead of waiting for the network to come back.
 */
export function usePolling(tick: () => void, intervalMs: number = POLL_MS) {
  // Kept in a ref so a new closure each render does not restart the timer.
  const latest = useRef(tick);
  const started = useRef(false);
  useEffect(() => {
    latest.current = tick;
    // A *changed* tick asks a different question — the live board's wall chip
    // rebuilds it around a new display code. Without this the screen kept
    // showing the previous wall's rows until the next interval, up to a full
    // POLL_MS after the tap. Callers must memoise their tick (they all do);
    // an inline arrow would re-fetch on every render.
    if (started.current) tick();
    started.current = true;
  }, [tick]);

  useFocusEffect(
    useCallback(() => {
      let timer: ReturnType<typeof setInterval> | null = null;
      let online = true;

      const start = () => {
        if (timer) return;
        timer = setInterval(() => {
          if (online) latest.current();
        }, intervalMs);
      };
      const stop = () => {
        if (!timer) return;
        clearInterval(timer);
        timer = null;
      };

      latest.current();
      start();

      const unsubscribe = NetInfo.addEventListener((state) => {
        const nowOnline = state.isConnected !== false;
        // Coming back from a drop: refresh at once rather than waiting a tick.
        if (nowOnline && !online) latest.current();
        online = nowOnline;
      });

      return () => {
        stop();
        unsubscribe();
      };
    }, [intervalMs]),
  );
}
