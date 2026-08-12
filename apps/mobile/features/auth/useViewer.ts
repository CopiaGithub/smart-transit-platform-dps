import { useMemo, useRef } from "react";
import { ROLE_LABEL, type Gate, type Role } from "../../constants/domain";
import { toViewer } from "../../navigation/menu";
import { selectGateRows } from "../../src/store/masters.slice";
import { useAppSelector } from "../../src/store";

/**
 * The single place a screen asks "who is this and what may they do".
 *
 * The server has no gate field on a user — which post a guard is on is part of
 * their role name (§6 keeps entry and exit deliberately apart). Screens must
 * not re-derive that; they read it from here so the rule lives in one file.
 */
export type Viewer = {
  userId: number | null;
  name: string;
  role: Role;
  roleLabel: string;
  /** The gate this person works, or null for anyone who is not a guard. */
  gate: Gate | null;
};

export function useViewer(): Viewer {
  const user = useAppSelector((s) => s.auth.user);
  // Empty until GateMaster answers. The role is already right without it, so
  // only `gate` is briefly null — which every screen that reads it handles.
  const gateRows = useAppSelector(selectGateRows);

  // Signing out clears the user while every screen reading this is still
  // mounted, and each one re-derives from the emptied viewer: the drawer swaps
  // its menu, and useGatePost — whose fallback is `home ?? gates[0]` — re-points
  // an exit guard at the entry gate, tearing GateOutScreen out and mounting
  // GateInScreen in its place. Whole subtrees replaced in the frame the
  // navigator is being destroyed in, which Fabric does not survive:
  //
  //   IllegalStateException: The specified child already has a parent.
  //     at SurfaceMountingManager.addViewAt
  //
  // A viewer only ever changes across a sign-in, and all of this is unmounted
  // for that — so the last one seen stays right for the rest of its life.
  const held = useRef(user);
  if (user) held.current = user;
  const signedIn = held.current;

  return useMemo(() => {
    const { role, gate } = toViewer(signedIn?.roleName, gateRows);
    return {
      userId: signedIn?.userId ?? null,
      name: signedIn?.name ?? "",
      role,
      roleLabel: ROLE_LABEL[role],
      gate,
    };
  }, [signedIn, gateRows]);
}
