import { GATES, ROLES, type Gate, type Role } from "../../constants/domain";

/** Just enough of the session to decide what a person may see. */
export type Viewer = { role: Role; gate: Gate | null };

/**
 * There is deliberately no `worksGate(viewer, kind)` here any more.
 *
 * It used to answer "may this guard record arrivals?" and the menu hid a screen
 * on the strength of it. That was wrong about the job: when the Gate 6 operator
 * goes home ill, whoever covers the post has to record arrivals, and a client
 * that says no simply stops the school. The server agrees now too — both
 * operator roles are accepted on both endpoints.
 *
 * So `gate` below is a *home post*, the sensible place to start the shift, and
 * nothing treats it as a limit.
 */

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

  // The gate is where a guard starts, not where they are stuck — both of these
  // people get the same screen, only pointing different ways to begin with.
  const g6 = toViewer("Gate 6 Operator");
  const g1 = toViewer("Gate 1 Operator");
  assert(g6.role === g1.role, "both operators are the same kind of user");
  assert(g6.gate?.kind === "in" && g1.gate?.kind === "out", "they start on opposite posts");

  // An admin has no post of their own, so the screen picks a starting one.
  assert(toViewer("Admin").gate === null, "an admin is posted nowhere");

  // Anything unknown degrades to the smallest menu, never to a gate.
  for (const unknown of ["", "   ", "Librarian", "Gate", "Operator", "Gate 99 Operator"]) {
    const v = toViewer(unknown);
    assert(v.role === ROLES.parent, `"${unknown}" degrades to parent`);
    assert(v.gate === null, `"${unknown}" gets no gate`);
    assert(v.role !== ROLES.security, `"${unknown}" is never handed a gate screen`);
  }

  return "roles: all checks passed";
}

if (typeof require !== "undefined" && require.main === module) console.log(selfCheck());
