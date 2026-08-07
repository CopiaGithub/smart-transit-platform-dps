import type { ComponentType } from "react";
import SessionGate from "./SessionGate";

/**
 * Wraps a screen so it only renders while a dispersal session is open.
 * Applied in the menu rather than inside each screen, so the list of screens
 * that write to the day is visible in one place.
 */
export const gated = (Screen: ComponentType<any>) => {
  const Gated = (props: any) => (
    <SessionGate>
      <Screen {...props} />
    </SessionGate>
  );
  Gated.displayName = `Gated(${Screen.displayName ?? Screen.name ?? "Screen"})`;
  return Gated;
};
