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

  return () => {
    // Name and role only. Whoever is holding the phone already knows what
    // signing out costs them; spelling it out only buries the one line that
    // tells them whose session they are about to end.
    const who = viewer.name ? `${viewer.name} · ${viewer.roleLabel}` : "";

    Alert.alert("Sign Out?", who, [
      { text: "Stay Signed In", style: "cancel" },
      {
        // Deliberately does not close the drawer first. react-native-drawer-layout
        // wraps the screens in `<View aria-hidden={isOpen}>`; closing flips that
        // to false, which makes the view flattenable, and Fabric answers by
        // deleting the wrapper and re-parenting RNSScreenContainer up into it —
        // in the same frame the navigator is being destroyed:
        //
        //   addViewAt: failed to insert view [370] into parent [378] at index 0
        //   Caused by: The specified child already has a parent.
        //
        // Dropping the token unmounts the whole drawer regardless, so closing it
        // on the way out was only ever busywork.
        text: "Sign Out",
        style: "destructive",
        onPress: () => dispatch(logout()),
      },
    ]);
  };
}
