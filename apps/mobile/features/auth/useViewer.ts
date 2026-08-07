import { useMemo } from "react";
import { ROLE_LABEL, type Gate, type Role } from "../../constants/domain";
import { toViewer } from "../../navigation/menu";
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

  return useMemo(() => {
    const { role, gate } = toViewer(user?.roleName);
    return {
      userId: user?.userId ?? null,
      name: user?.name ?? "",
      role,
      roleLabel: ROLE_LABEL[role],
      gate,
    };
  }, [user]);
}
