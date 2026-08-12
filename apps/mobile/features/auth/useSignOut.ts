import { Alert } from "react-native";
import { logout } from "../../src/store/auth.slice";
import { useAppDispatch } from "../../src/store";
import { useViewer } from "./useViewer";

/**
 * One way out of the app, used by every Sign out button. Always confirms —
 * a guard mid-shift who fat-fingers the drawer should not lose their gate.
 */
export function useSignOut() {
  const dispatch = useAppDispatch();
  const viewer = useViewer();

  return (onDone?: () => void) => {
    // Name and role only. Whoever is holding the phone already knows what
    // signing out costs them; spelling it out only buries the one line that
    // tells them whose session they are about to end.
    const who = viewer.name ? `${viewer.name} · ${viewer.roleLabel}` : "";

    Alert.alert("Sign Out?", who, [
      { text: "Stay Signed In", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => {
          onDone?.();
          dispatch(logout());
        },
      },
    ]);
  };
}
