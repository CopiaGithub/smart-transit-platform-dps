/**
 * The login endpoint returns a token and nothing else — every user detail
 * (name, role, employee code) lives in the token's claims. So the app has to
 * read the payload itself.
 *
 * This does NOT verify the signature, and must not pretend to: the server
 * validates every request, and a client that trusts its own decode is trusting
 * whatever is in its own storage. Treat the result as a display hint that the
 * server will overrule.
 */

export type JwtClaims = {
  userId: number;
  name: string;
  emailId: string | null;
  employeeCode: string | null;
  roleId: number | null;
  roleName: string;
  /** Seconds since epoch, from the standard `exp` claim. */
  exp: number | null;
};

/** base64url -> string, without pulling in a Buffer polyfill. */
function decodeSegment(segment: string): string | null {
  const padded = segment.replace(/-/g, "+").replace(/_/g, "/");
  // atob needs a length that is a multiple of 4; base64url strips the padding.
  const full = padded + "=".repeat((4 - (padded.length % 4)) % 4);
  try {
    return globalThis.atob(full);
  } catch {
    return null;
  }
}

const asNumber = (v: unknown): number | null => {
  const n = Number(v);
  return Number.isFinite(n) && v !== "" && v !== null ? n : null;
};

const asString = (v: unknown): string | null =>
  typeof v === "string" && v.trim() !== "" ? v : null;

export function decodeToken(token: string | null | undefined): JwtClaims | null {
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const json = decodeSegment(parts[1]);
  if (!json) return null;

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(json);
  } catch {
    return null;
  }

  // userId is the one claim nothing works without.
  const userId = asNumber(payload.userId);
  if (userId === null) return null;

  return {
    userId,
    name: asString(payload.name) ?? "",
    emailId: asString(payload.emailId),
    employeeCode: asString(payload.employeeCode),
    roleId: asNumber(payload.roleId),
    roleName: asString(payload.roleName) ?? "",
    exp: asNumber(payload.exp),
  };
}

/** True when the token has expired, with a small skew so we log out just before. */
export function isExpired(claims: JwtClaims | null, skewSeconds = 30): boolean {
  if (!claims?.exp) return false; // no exp claim => let the server decide
  return Date.now() / 1000 >= claims.exp - skewSeconds;
}

// ponytail: run with `npx tsx src/services/jwt.ts` — no test framework.
export function selfCheck() {
  const assert = (cond: boolean, msg: string) => {
    if (!cond) throw new Error("jwt: " + msg);
  };

  const b64url = (obj: unknown) =>
    globalThis
      .btoa(JSON.stringify(obj))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  const make = (payload: unknown) => `h.${b64url(payload)}.sig`;

  const full = decodeToken(
    make({
      userId: "7",
      name: "R. Kamble",
      emailId: "gate6@dpsnerul.edu",
      employeeCode: "EMP001",
      roleId: "2",
      roleName: "Gate 6 Security",
      exp: 4102444800,
    }),
  );
  assert(full?.userId === 7, "userId is coerced to a number");
  assert(full?.roleName === "Gate 6 Security", "roleName survives spaces");
  assert(full?.roleId === 2, "roleId is coerced to a number");

  // The server sends empty strings for claims a user does not have.
  const sparse = decodeToken(make({ userId: 1, name: "X", emailId: "", employeeCode: "", roleId: "" }));
  assert(sparse !== null, "a sparse token still decodes");
  assert(sparse!.emailId === null, "empty string claim becomes null");
  assert(sparse!.roleId === null, "empty roleId becomes null");
  assert(sparse!.exp === null, "missing exp becomes null");

  assert(decodeToken(null) === null, "null token");
  assert(decodeToken("") === null, "empty token");
  assert(decodeToken("not-a-jwt") === null, "token without three parts");
  assert(decodeToken("h.!!!not-base64!!!.s") === null, "undecodable payload");
  assert(decodeToken(make({ name: "no id" })) === null, "payload without userId");

  // Payload lengths that need 1 and 2 '=' of padding restored.
  for (const pad of ["a", "ab", "abc", "abcd"]) {
    const t = decodeToken(make({ userId: 1, name: pad }));
    assert(t?.name === pad, `base64url padding restored for "${pad}"`);
  }

  assert(isExpired({ ...full!, exp: 1 }), "past exp is expired");
  assert(!isExpired({ ...full!, exp: 4102444800 }), "far future exp is not expired");
  assert(!isExpired({ ...full!, exp: null }), "no exp is not expired");
  assert(!isExpired(null), "no claims is not expired");

  return "jwt: all checks passed";
}

if (typeof require !== "undefined" && require.main === module) console.log(selfCheck());
