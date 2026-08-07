import { GATES, ROLES, type Gate, type Role } from "../../constants/domain";

/** Just enough of the session to decide what a person may see. */
export type Viewer = { role: Role; gate: Gate | null };

/**
 * Server role name -> what the app lets a person see.
 *
 * The live roles are `Admin`, `Teacher`, `Parent`, `Gate 6 Operator` and
 * `Gate 1 Operator`. A guard's post is part of their role name — there is no
 * gate field on the user, and the manual (§6) keeps entry and exit deliberately
 * apart — so the gate is matched by looking for a GATES label inside the role
 * name. That stays exact if a Gate 3 is ever added; keyword guessing would not.
 *
 * An unrecognised role falls through to `parent`, the smallest menu there is.
 * A new role on the server must never accidentally hand someone the gate screens.
 *
 * Lives here rather than in navigation/menu.ts so it can be run and checked
 * without pulling in React Native.
 */
export function toViewer(roleName: string | null | undefined): Viewer {
  const r = (roleName ?? "").trim().toLowerCase();
  if (!r) return { role: ROLES.parent, gate: null };

  if (r.includes("admin")) return { role: ROLES.admin, gate: null };
  if (r.includes("teacher")) return { role: ROLES.teacher, gate: null };
  if (r.includes("parent")) return { role: ROLES.parent, gate: null };

  const gate = GATES.find((g) => r.includes(g.label.toLowerCase())) ?? null;
  if (gate) return { role: ROLES.security, gate };

  return { role: ROLES.parent, gate: null };
}

/** A guard only ever works the one direction their gate is for; admin does both. */
export const worksGate = (v: Viewer, kind: "in" | "out") =>
  v.role === ROLES.admin || (v.role === ROLES.security && v.gate?.kind === kind);

// ponytail: run with `npx tsx src/domain/roles.ts` — no test framework.
export function selfCheck() {
  const assert = (cond: boolean, msg: string) => {
    if (!cond) throw new Error("roles: " + msg);
  };

  // The five roles that actually exist on the server today.
  assert(toViewer("Admin").role === ROLES.admin, "Admin");
  assert(toViewer("Teacher").role === ROLES.teacher, "Teacher");
  assert(toViewer("Parent").role === ROLES.parent, "Parent");
  assert(toViewer("Gate 6 Operator").role === ROLES.security, "a gate operator is security");
  assert(toViewer("Gate 6 Operator").gate?.kind === "in", "Gate 6 Operator is the entry gate");
  assert(toViewer("Gate 1 Operator").gate?.kind === "out", "Gate 1 Operator is the exit gate");

  // Case and spacing are the server's to choose, not ours to depend on.
  assert(toViewer("  gate 6 operator  ").gate?.id === "g6", "trimmed and lowercased");

  // Entry and exit stay apart — that separation is the point of the two roles.
  const g6 = toViewer("Gate 6 Operator");
  const g1 = toViewer("Gate 1 Operator");
  assert(worksGate(g6, "in") && !worksGate(g6, "out"), "Gate 6 cannot record departures");
  assert(worksGate(g1, "out") && !worksGate(g1, "in"), "Gate 1 cannot record arrivals");

  const admin = toViewer("Admin");
  assert(worksGate(admin, "in") && worksGate(admin, "out"), "an admin works both gates");

  // Anything unknown degrades to the smallest menu, never to a gate.
  for (const unknown of ["", "   ", "Librarian", "Gate", "Operator", "Gate 99 Operator"]) {
    const v = toViewer(unknown);
    assert(v.role === ROLES.parent, `"${unknown}" degrades to parent`);
    assert(v.gate === null, `"${unknown}" gets no gate`);
    assert(!worksGate(v, "in") && !worksGate(v, "out"), `"${unknown}" works no gate`);
  }

  return "roles: all checks passed";
}

if (typeof require !== "undefined" && require.main === module) console.log(selfCheck());
