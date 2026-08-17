import { useRef, useSyncExternalStore } from "react";
import ConfirmSheet from "./ConfirmSheet";

type Ask = Omit<
  React.ComponentProps<typeof ConfirmSheet>,
  "visible" | "onConfirm" | "onCancel"
> & { onConfirm: () => void };

/**
 * `askConfirm` — the app's own Alert.alert.
 *
 * Kept imperative on purpose. A dialog is asked for from inside an event
 * handler, and the eight delete prompts in MasterForm already read that way;
 * making each of them hold a piece of state and render a sheet would have been
 * eight new state variables to say one thing. The shape mirrors Alert.alert so
 * a call site changes by its name and nothing else.
 *
 * The pending question lives in a module singleton rather than in React state
 * because the caller is not always a component — the same reason navigationRef
 * and apiClient's unauthorized handler live outside the tree. One <ConfirmHost/>
 * at the root renders whatever was last asked.
 */
let pending: Ask | null = null;
const listeners = new Set<() => void>();

const emit = () => {
  for (const listener of listeners) listener();
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export function askConfirm(ask: Ask) {
  pending = ask;
  emit();
}

const close = () => {
  pending = null;
  emit();
};

/** Mounted once, at the root. Renders nothing until something is asked. */
export default function ConfirmHost() {
  const ask = useSyncExternalStore(
    subscribe,
    () => pending,
    // Never asked on the server, and the app has no SSR — but the third
    // argument is required, and returning the live singleton here would be a
    // hydration mismatch waiting to happen.
    () => null,
  );

  // The modal fades out rather than vanishing, so the question has to outlive
  // the answer by the length of that fade — dropping it on the same frame
  // emptied the card and left a blank white sheet fading off the screen.
  const last = useRef<Ask | null>(null);
  if (ask) last.current = ask;
  const shown = ask ?? last.current;

  return (
    <ConfirmSheet
      {...(shown ?? { title: "", message: "", confirmText: "" })}
      visible={!!ask}
      onCancel={close}
      onConfirm={() => {
        const run = ask?.onConfirm;
        // Closed first: the handler may open the next question, and clearing
        // afterwards would throw that one away as it arrived.
        close();
        run?.();
      }}
    />
  );
}
