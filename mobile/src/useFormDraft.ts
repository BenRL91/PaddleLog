import { useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { recordKey } from "./native-store";
import { useLibrary } from "./LibraryProvider";
// Per-account forms keep stable record IDs across close/reopen and failed saves.
export function useFormDraft<T extends object>(
  kind: string,
  value: T,
  restore: (value: T) => void,
) {
  const { snapshot } = useLibrary();
  const key = recordKey(
    snapshot!.accountId,
    snapshot!.accountId,
    "form-" + kind,
  );
  const restoreRef = useRef(restore),
    queue = useRef(Promise.resolve());
  const [ready, setReady] = useState(false),
    [error, setError] = useState("");
  const encoded = JSON.stringify(value),
    cleared = useRef(false),
    failure = useRef("");
  useEffect(() => {
    let alive = true;
    void AsyncStorage.getItem(key)
      .then((raw) => {
        if (!alive) return;
        if (raw) {
          const parsed = JSON.parse(raw);
          if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
            throw Error("Invalid device draft");
          restoreRef.current(parsed);
        }
        setReady(true);
      })
      .catch(() => {
        if (alive)
          setError("Device draft could not be restored. Keep this form open.");
      });
    return () => {
      alive = false;
    };
  }, [key]);
  useEffect(() => {
    if (!ready || cleared.current) return;
    queue.current = queue.current
      .then(() => AsyncStorage.setItem(key, encoded))
      .then(() => {
        failure.current = "";
        setError("");
      })
      .catch(() => {
        failure.current =
          "Device draft could not be saved. Keep this form open.";
        setError(failure.current);
      });
  }, [key, encoded, ready]);
  return {
    ready,
    error,
    async flush() {
      if (!ready) throw Error("Your draft is still loading.");
      await queue.current;
      if (failure.current) throw Error(failure.current);
    },
    async clear() {
      cleared.current = true;
      await queue.current;
      await AsyncStorage.removeItem(key);
    },
  };
}
