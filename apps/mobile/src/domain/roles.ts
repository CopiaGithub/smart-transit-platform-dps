import { ROLES, type Gate, type Role } from "../../constants/domain";

/** Just enough of the session to decide what a person may see. */
export type Viewer = { role: Role; gate: Gate | null };

/**
 * The shape `toGates` needs out of a GateMaster row. Declared structurally rather
 * than imported from src/api so this file stays runnable on its own — it has a
 * self-check at the bottom and pulling in the api client would drag axios and
 * expo-constants along with it.
 */
export type GateRow = {
  Id: number;
  GateCode: string;
  GateName: string;
  GateType: string;
  SortOrder?: number;
  IsActive: boolean;
};

/** GateType values that describe a gate a bus drives through. */
const BUS_GATE_KIND: Record<string, Gate["kind"] | undefined> = {
  busentry: "in",
  busexit: "out",
};

/**
 * "Gate No. 6 (Bus Entry)" -> "Gate No. 6".
 *
 * The parenthetical repeats what the colour of the screen already says, and the
 * full string does not fit the picker chip a guard taps with a thumb.
 */
const shortLabel = (name: string) => name.replace(/\s*\([^)]*\)\s*$/, "").trim() || name;

/** First run of digits, unpadded: "G6" -> "6", "G06" -> "6", "EXIT1" -> "1". */
function digits(text: string | null | undefined): string | null {
  const match = /\d+/.exec(text ?? "");
  return match ? String(Number(match[0])) : null;
}

/**
 * The gate number a role name refers to: "Gate 6 Operator" -> "6",
 * "Gate No. 1 Operator" -> "1".
 *
 * Anchored on the word "gate" rather than on any digit in the string, so a role
 * like "Shift 2 Supervisor" is not read as naming a gate.
 */
function roleGateNumber(roleName: string): string | null {
  const match = /gate\D{0,8}(\d+)/i.exec(roleName);
  return match ? String(Number(match[1])) : null;
}

/**
 * GateMaster rows -> the gates a guard can be posted to.
 *
 * Student exits are dropped: they are doors children walk out of, which platforms
 * and displays care about and a guard on a bus gate does not. Inactive rows go
 * too — a gate closed for building work is not a post anyone can take.
 */
export function toGates(rows: GateRow[]): Gate[] {
  return rows
    .filter((r) => r.IsActive)
    .map((r) => {
      const kind = BUS_GATE_KIND[(r.GateType ?? "").trim().toLowerCase()];
      return kind ? { row: r, gate: { id: String(r.Id), label: shortLabel(r.GateName), kind } } : null;
    })
    .filter((x): x is { row: GateRow; gate: Gate } => x !== null)
    .sort((a, z) => (a.row.SortOrder ?? 0) - (z.row.SortOrder ?? 0) || a.row.Id - z.row.Id)
    .map((x) => x.gate);
}

/**
 * Server role name -> what the app lets a person see.
 *
 * The live roles are `Admin`, `Teacher`, `Parent`, `Gate 6 Operator` and
 * `Gate 1 Operator`. A guard's post is part of their role name — there is no gate
 * field on the user, and the manual (§6) keeps entry and exit deliberately apart.
 *
 * The two questions are answered from different places on purpose:
 *
 *  - **Is this person a guard** comes from the role name alone, so it is known
 *    before any request finishes. The drawer is built from this and picks the
 *    screen a person lands on; if it had to wait for GateMaster, a guard would
 *    open the app on a parent's menu every time the network was slow, and on a
 *    dead network would never get their gate screen at all.
 *  - **Which gate** comes from the rows, matched on the number in the gate's
 *    code. It is null until they arrive, which the Gate screen already handles —
 *    it waits on its own `ready` flag before rendering a post.
 *
 * The cost of that split is that a role naming a gate which does not exist —
 * "Gate 99 Operator" — is treated as a guard with no home post. That is safe: the
 * server authorises every gate action against its own fixed role list, so the
 * screen renders and each action comes back refused with the server's wording.
 * A role that does not name a numbered gate at all still degrades to `parent`,
 * the smallest menu there is.
 *
 * Lives here rather than in navigation/menu.ts so it can be run and checked
 * without pulling in React Native.
 */
export function toViewer(roleName: string | null | undefined, rows: GateRow[] = []): Viewer {
  const r = (roleName ?? "").trim().toLowerCase();
  if (!r) return { role: ROLES.parent, gate: null };

  if (r.includes("admin")) return { role: ROLES.admin, gate: null };
  if (r.includes("teacher")) return { role: ROLES.teacher, gate: null };
  if (r.includes("parent")) return { role: ROLES.parent, gate: null };

  if (roleGateNumber(r) === null) return { role: ROLES.parent, gate: null };
  return { role: ROLES.security, gate: homeGate(r, rows) };
}

/**
 * The gate a role names, or null.
 *
 * Matched on the number inside the gate's *code*, because the two strings share
 * nothing else: the role reads "Gate 6 Operator" and the row reads
 * "Gate No. 6 (Bus Entry)". Compared whole, so "Gate 16" never settles for
 * Gate 1.
 */
export function homeGate(roleName: string | null | undefined, rows: GateRow[]): Gate | null {
  const wanted = roleGateNumber(roleName ?? "");
  if (wanted === null) return null;

  const match = rows.find((r) => r.IsActive && digits(r.GateCode) === wanted);
  if (!match) return null;

  return toGates(rows).find((g) => g.id === String(match.Id)) ?? null;
}

// ponytail: run with `npx tsx src/domain/roles.ts` — no test framework.
export function selfCheck() {
  const assert = (cond: boolean, msg: string) => {
    if (!cond) throw new Error("roles: " + msg);
  };

  // The rows GateMaster actually holds today, verbatim — including the fact that
  // the gate's name shares no substring with the role that works it.
  const rows: GateRow[] = [
    { Id: 1, GateCode: "G6", GateName: "Gate No. 6 (Bus Entry)", GateType: "BusEntry", SortOrder: 1, IsActive: true },
    { Id: 2, GateCode: "G1", GateName: "Gate No. 1 (Bus Exit)", GateType: "BusExit", SortOrder: 2, IsActive: true },
    { Id: 3, GateCode: "EXIT1", GateName: "School Building Exit 1", GateType: "StudentExit", SortOrder: 3, IsActive: true },
    { Id: 4, GateCode: "EXIT2", GateName: "School Building Exit 2", GateType: "StudentExit", SortOrder: 4, IsActive: true },
  ];

  const gates = toGates(rows);
  assert(gates.length === 2, "only the two bus gates are posts");
  assert(gates[0].kind === "in" && gates[1].kind === "out", "entry first, in SortOrder");
  assert(gates[0].label === "Gate No. 6", "the trailing parenthetical is dropped");
  assert(gates[0].id === "1", "the row id is the gate id");
  assert(!gates.some((g) => g.label.includes("Exit 1")), "student doors are not posts");

  // An inactive gate is not a post.
  const closed = toGates(rows.map((r) => (r.Id === 1 ? { ...r, IsActive: false } : r)));
  assert(closed.length === 1 && closed[0].kind === "out", "a closed gate drops out");

  // The five roles that actually exist on the server today.
  assert(toViewer("Admin").role === ROLES.admin, "Admin");
  assert(toViewer("Teacher").role === ROLES.teacher, "Teacher");
  assert(toViewer("Parent").role === ROLES.parent, "Parent");
  assert(toViewer("Gate 6 Operator").role === ROLES.security, "a gate operator is security");
  assert(toViewer("Gate 1 Operator").role === ROLES.security, "so is the other one");

  // The role is known with no rows at all — this is what keeps the drawer right
  // while GateMaster is still in flight.
  assert(toViewer("Gate 6 Operator", []).role === ROLES.security, "role needs no rows");

  // Home post, matched on the code's number across two unrelated strings.
  assert(homeGate("Gate 6 Operator", rows)?.kind === "in", "Gate 6 Operator is the entry gate");
  assert(homeGate("Gate 1 Operator", rows)?.kind === "out", "Gate 1 Operator is the exit gate");
  assert(homeGate("  gate 6 operator  ", rows)?.id === "1", "trimmed and lowercased");
  assert(homeGate("Gate No. 6 Operator", rows)?.id === "1", "a wordier role still matches");

  // The number is compared whole. "Gate 16" must not settle for Gate 1.
  assert(homeGate("Gate 16 Operator", rows) === null, "16 does not match 1");
  assert(homeGate("Gate 61 Operator", rows) === null, "61 does not match 6");

  // A digit that is not a gate number must not be read as one.
  assert(homeGate("Shift 2 Supervisor", rows) === null, "a shift number is not a gate");
  assert(homeGate("Admin", rows) === null, "an admin is posted nowhere");
  assert(toViewer("Admin", rows).gate === null, "an admin is posted nowhere");

  // The whole viewer, wired the way the app wires it.
  assert(toViewer("Gate 6 Operator", rows).gate?.kind === "in", "entry operator, entry gate");
  assert(toViewer("Gate 1 Operator", rows).gate?.kind === "out", "exit operator, exit gate");
  assert(toViewer("Gate 6 Operator", rows).gate?.label === "Gate No. 6", "label comes from the row");

  // Anything that does not name a numbered gate degrades to the smallest menu.
  for (const unknown of ["", "   ", "Librarian", "Gate", "Operator", "Gate Supervisor"]) {
    const v = toViewer(unknown, rows);
    assert(v.role === ROLES.parent, `"${unknown}" degrades to parent`);
    assert(v.gate === null, `"${unknown}" gets no gate`);
    assert(v.role !== ROLES.security, `"${unknown}" is never handed a gate screen`);
  }

  // A role naming a gate that is not in the table is still a guard — the server
  // refuses the actions, so the screen is harmless and a real guard is never
  // locked out by a row someone forgot to add.
  assert(toViewer("Gate 99 Operator", rows).role === ROLES.security, "unknown gate, still a guard");
  assert(toViewer("Gate 99 Operator", rows).gate === null, "but with no home post");

  // Both operators are the same kind of user, starting on opposite posts.
  const g6 = toViewer("Gate 6 Operator", rows);
  const g1 = toViewer("Gate 1 Operator", rows);
  assert(g6.role === g1.role, "both operators are the same kind of user");
  assert(g6.gate?.id !== g1.gate?.id, "but not the same post");

  return "roles: all checks passed";
}

if (typeof require !== "undefined" && require.main === module) console.log(selfCheck());
