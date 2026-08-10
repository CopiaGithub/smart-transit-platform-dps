import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import { findGate, GATES, type Gate } from "../../constants/domain";

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
 */
export function useGatePost(userId: number | null, home: Gate | null) {
  const fallback = home ?? GATES[0];
  const [gate, setGate] = useState<Gate>(fallback);
  /** False until storage has answered — see the null render in GateScreen. */
  const [ready, setReady] = useState(false);

  const key = `gate.post.${userId ?? "anon"}`;

  useEffect(() => {
    let live = true;
    setReady(false);

    AsyncStorage.getItem(key)
      .then((id) => {
        if (!live) return;
        // An unreadable or retired gate id falls back to the home post rather
        // than to whatever happens to sit first in the list.
        setGate(findGate(id) ?? fallback);
      })
      // A storage failure is not worth blocking a dispersal over; the home post
      // is a safe place to start.
      .catch(() => {})
      .finally(() => live && setReady(true));

    return () => {
      live = false;
    };
  }, [key, fallback.id]);

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
export const gatesFacing = (kind: Gate["kind"]) => GATES.filter((g) => g.kind === kind);
