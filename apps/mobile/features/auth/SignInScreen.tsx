import { useCallback, useEffect, useState } from "react";
import SplashScreen from "../splash/SplashScreen";
import LoginScreen from "./LoginScreen";
import UnlockScreen from "./UnlockScreen";
import { getUnlockState, type UnlockState } from "./unlock";

/**
 * The one signed-out route: the MPIN pad for somebody who has enrolled, the
 * password form for everybody else.
 *
 * Kept here rather than in the navigator so auth still decides exactly one
 * thing — token or no token — and this decides how the token is obtained.
 *
 * Signing out deliberately leaves an enrolment in place: coming back tomorrow
 * to four digits is the entire point. "Sign in with a password instead" on the
 * unlock screen erases it, for a phone that changes hands.
 */
export default function SignInScreen() {
  const [state, setState] = useState<UnlockState | null>(null);

  const read = useCallback(() => {
    getUnlockState()
      .then(setState)
      // Unreadable storage means the password form, never a stuck screen.
      .catch(() => setState(null));
  }, []);

  useEffect(read, [read]);

  // Storage answers in a frame or two; the splash is already the app's face for
  // that moment, so it does not flash a second style of loading.
  if (!state) return <SplashScreen />;

  return state.enrolled ? (
    <UnlockScreen state={state} onForget={() => setState({ ...state, enrolled: false })} />
  ) : (
    <LoginScreen />
  );
}
