import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import { findGate, type Gate } from "../../constants/domain";

/**
 * Which gate the guard is standing at right now.
 *
 * Their role names a home post, but posts get covered — someone goes home ill
 * and the exit gate's operator works the entry gate for an afternoon. That used
 * to need an admin editing the user record, so this is the guard's own choice.
 *
 * It is stored, and stored per user, for one reason each:
 *
 *  - **Stored**, because the drawer unmounts this screen. A guard who checks
 *    their profile and comes back would otherwise land on their *home* post,
 *    and the next bus would be recorded going the wrong way through a gate it
 *    never used.
 *  - **Per user**, because a phone gets handed over at shift change, and the
 *    incoming guard's own post is the right thing to start from.
 *
 * `gates` now comes from GateMaster rather than a constant, so it starts empty.
 * Until it fills there is genuinely no post to show, and `ready` stays false —
 * the screen renders nothing rather than guessing a gate and letting a guard
 * record a bus through the wrong one.
 */
export function useGatePost(userId: number | null, home: Gate | null, gates: Gate[]) {
  const fallback = home ?? gates[0] ?? null;
  const [gate, setGate] = useState<Gate | null>(fallback);
  /** False until both the gates and storage have answered — see GateScreen. */
  const [ready, setReady] = useState(false);

  const key = `gate.post.${userId ?? "anon"}`;

  useEffect(() => {
    if (gates.length === 0) {
      setReady(false);
      return;
    }

    let live = true;
    setReady(false);

    AsyncStorage.getItem(key)
      .then((id) => {
        if (!live) return;
        // A stored id that no longer exists — a retired gate, or the ids from
        // before these came from the database — falls back to the home post
        // rather than to whatever happens to sit first in the list.
        setGate(findGate(gates, id) ?? fallback);
      })
      // A storage failure is not worth blocking a dispersal over; the home post
      // is a safe place to start.
      .catch(() => {})
      .finally(() => live && setReady(true));

    return () => {
      live = false;
    };
  }, [key, fallback?.id, gates]);

  const choose = useCallback(
    (next: Gate) => {
      setGate(next);
      AsyncStorage.setItem(key, next.id).catch(() => {});
    },
    [key],
  );

  return { gate, choose, ready };
}

/** The gates a guard can be posted to in a given direction. */
export const gatesFacing = (gates: Gate[], kind: Gate["kind"]) =>
  gates.filter((g) => g.kind === kind);
