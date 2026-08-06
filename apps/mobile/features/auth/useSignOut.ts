import { Alert } from "react-native";
import { findGate, ROLE_LABEL } from "../../constants/domain";
import { logout } from "../../src/store/auth.slice";
import { useAppDispatch, useAppSelector } from "../../src/store";

/**
 * One way out of the app, used by every Sign out button. Always confirms —
 * a guard mid-shift who fat-fingers the drawer should not lose their gate.
 */
export function useSignOut() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);

  return (onDone?: () => void) => {
    const gate = findGate(user?.gateId);
    const who = user
      ? `${user.name} · ${ROLE_LABEL[user.role]}${gate ? ` · ${gate.label}` : ""}`
      : "";

    Alert.alert(
      "Sign out?",
      `${who}\n\nYou will need to sign in again to mark buses. Today's board is not affected.`,
      [
        { text: "Stay signed in", style: "cancel" },
        {
          text: "Sign out",
          style: "destructive",
          onPress: () => {
            onDone?.();
            dispatch(logout());
          },
        },
      ],
    );
  };
}
