/**
 * Checks the two rules that are easy to get wrong and impossible to see:
 * how a 200-wrapped failure is classified, and what may be retried.
 *
 * Kept separate from apiClient.ts so it can run in plain node — importing the
 * client itself would pull in expo-constants and AsyncStorage.
 *
 * ponytail: run with `npx tsx src/services/apiClient.selfcheck.ts`.
 */
import { ApiError, NetworkError } from "../api/types";

/** Mirrors the classification in apiClient.request. */
export function classify(envelope: { Success: boolean; StatusCode?: number; ErrorMessage?: string | null }) {
  if (envelope.Success) return null;
  return new ApiError(
    envelope.ErrorMessage ?? "The request could not be completed.",
    envelope.StatusCode ?? 400,
  );
}

/** Mirrors the retry rule in apiClient.send. */
export function mayRetry(method: string | undefined, gotAReply: boolean) {
  if (gotAReply) return false;
  return (method ?? "GET").toUpperCase() === "GET";
}

export function selfCheck() {
  const assert = (cond: boolean, msg: string) => {
    if (!cond) throw new Error("apiClient: " + msg);
  };

  // The whole point: HTTP was 200, but this is a failure.
  const expired = classify({ Success: false, StatusCode: 401, ErrorMessage: "Token expired." });
  assert(expired instanceof ApiError, "a 200-wrapped failure is an ApiError");
  assert(expired!.isSessionExpired, "401 ends the session");
  assert(!expired!.isForbidden, "401 is not a permission problem");

  // 403 must NOT sign the user out — they are signed in, just not allowed.
  const forbidden = classify({ Success: false, StatusCode: 403, ErrorMessage: "Not permitted." });
  assert(forbidden!.isForbidden, "403 is a permission problem");
  assert(!forbidden!.isSessionExpired, "403 must never sign the user out");

  // The server's own wording reaches the operator unchanged.
  const busy = classify({
    Success: false,
    StatusCode: 400,
    ErrorMessage: "Bus is already in the yard for this session.",
  });
  assert(
    busy!.message === "Bus is already in the yard for this session.",
    "the server's message is passed through verbatim",
  );
  assert(busy!.statusCode === 400, "status comes from the envelope, not the wire");

  assert(classify({ Success: true }) === null, "a success is not an error");
  assert(
    classify({ Success: false })!.message.length > 0,
    "a failure with no message still says something",
  );

  // Retry rule: reads that never got a reply, and nothing else.
  assert(mayRetry("GET", false), "a read with no reply is retried");
  assert(!mayRetry("GET", true), "a read the server answered is never retried");
  assert(!mayRetry("POST", false), "a write with no reply is NOT retried");
  assert(!mayRetry("PATCH", false), "a patch with no reply is NOT retried");
  assert(!mayRetry("DELETE", false), "a delete with no reply is NOT retried");
  assert(mayRetry(undefined, false), "the default method is a read");

  assert(new NetworkError().message.length > 0, "a transport failure says something useful");

  return "apiClient: all checks passed";
}

if (typeof require !== "undefined" && require.main === module) console.log(selfCheck());
