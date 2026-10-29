import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import { auth, apiOrigin } from "./auth";
import { createApi, matchesConfirmedChange } from "./api.js";
import { recordKey } from "./native-store.js";
import { validate, normalizeSharedCatalog } from "./domain.js";
import type {
  Snapshot,
  Library,
  Entitlements,
  Timer,
  CatalogRow,
} from "./types";
type Pending = { base: Snapshot; next: Library };
type Value = {
  snapshot: Snapshot | null;
  entitlements: Entitlements | null;
  catalog: CatalogRow[];
  busy: boolean;
  error: string;
  pending: Pending | null;
  timer: Timer | null;
  reload: () => Promise<void>;
  mutate: (change: (state: Library) => Library) => Promise<void>;
  retry: () => Promise<void>;
  discard: () => Promise<void>;
  setTimer: (timer: Timer | null) => Promise<void>;
  id: () => string;
};
const Context = createContext<Value | null>(null);
export const useLibrary = () => {
  const v = useContext(Context);
  if (!v) throw Error("Library provider missing");
  return v;
};
export function LibraryProvider({
  userId,
  children,
}: {
  userId: string;
  children: React.ReactNode;
}) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null),
    [entitlements, setEntitlements] = useState<Entitlements | null>(null),
    [catalog, setCatalog] = useState<Value["catalog"]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [pending, setPending] = useState<Pending | null>(null),
    [timer, setTimerState] = useState<Timer | null>(null);
  const current = useRef<Snapshot | null>(null),
    locked = useRef(false),
    alive = useRef(true);
  const api = useRef(
    createApi({
      origin: apiOrigin,
      getToken: async () => {
        const s = await auth!.auth.getSession();
        if (s.error) throw s.error;
        if (s.data.session?.user.id !== userId)
          throw Error("Account changed. Sign in again.");
        return s.data.session.access_token;
      },
      refreshToken: async () => {
        const r = await auth!.auth.refreshSession();
        if (r.error) throw r.error;
        if (r.data.user?.id !== userId) throw Error("Account changed.");
      },
    }),
  ).current;
  const key = (account: string, kind: string) =>
    recordKey(userId, account, kind);
  const reload = useCallback(async () => {
    setError("");
    try {
      const [raw, access] = await Promise.all([api.load(), api.entitlements()]);
      if (!alive.current) return;
      if (raw.accountId !== access.accountId)
        throw Error("Account changed during loading.");
      validate(raw.state);
      const loaded = {
        ...raw,
        state: {
          ...raw.state,
          settings: raw.state.settings ?? {},
          catalog: raw.state.catalog ?? [],
        },
      } as Snapshot;
      current.current = loaded;
      setSnapshot(loaded);
      setEntitlements(access);
      const [draft, savedTimer] = await Promise.all([
        AsyncStorage.getItem(recordKey(userId, raw.accountId, "pending")),
        AsyncStorage.getItem(recordKey(userId, raw.accountId, "timer")),
      ]);
      if (!alive.current) return;
      setPending(draft ? JSON.parse(draft) : null);
      setTimerState(savedTimer ? JSON.parse(savedTimer) : null);
    } catch (e) {
      if (alive.current)
        setError(
          e instanceof Error ? e.message : "Unable to load your library.",
        );
    }
  }, [api, userId]);
  useEffect(() => {
    alive.current = true;
    void reload();
    fetch(apiOrigin + "/reference-catalog.json")
      .then((r) => {
        if (!r.ok) throw Error("Catalog unavailable");
        return r.json();
      })
      .then((v) => {
        if (alive.current) setCatalog(normalizeSharedCatalog(v));
      })
      .catch(() => {});
    return () => {
      alive.current = false;
    };
  }, [reload]);
  async function commit(base: Snapshot, next: Library) {
    const draft = { base, next };
    await AsyncStorage.setItem(
      key(base.accountId, "pending"),
      JSON.stringify(draft),
    );
    if (alive.current) setPending(draft);
    const saved = (await api.save(base, next)) as Snapshot;
    if (!alive.current) return;
    current.current = saved;
    setSnapshot(saved);
    await AsyncStorage.removeItem(key(base.accountId, "pending"));
    setPending(null);
    setError("");
  }
  async function run(task: () => Promise<void>) {
    if (locked.current) throw Error("A save is already in progress.");
    locked.current = true;
    setBusy(true);
    try {
      await task();
    } catch (e) {
      if (alive.current)
        setError(
          e instanceof Error ? e.message : "Save failed. Your draft is kept.",
        );
      throw e;
    } finally {
      locked.current = false;
      if (alive.current) setBusy(false);
    }
  }
  async function mutate(change: (state: Library) => Library) {
    await run(async () => {
      if (pending)
        throw Error("Resolve the saved draft before making another change.");
      if (!current.current) throw Error("Load your library first.");
      const base = current.current,
        next = change(structuredClone(base.state));
      validate(next);
      await commit(base, next);
    });
  }
  async function retry() {
    if (!pending) return;
    await run(async () => {
      const latest = await api.load();
      if (!alive.current) return;
      if (latest.accountId !== pending.base.accountId)
        throw Error("Draft belongs to another account.");
      if (latest.revision !== pending.base.revision) {
        if (matchesConfirmedChange(pending.next, latest.state)) {
          current.current = latest;
          setSnapshot(latest);
          await AsyncStorage.removeItem(key(latest.accountId, "pending"));
          setPending(null);
          setError("");
          return;
        }
        throw Error(
          "Library changed elsewhere. Your draft is kept; use the web app to reconcile before discarding or retrying.",
        );
      }
      await commit(pending.base, pending.next);
    });
  }
  async function discard() {
    if (!snapshot) return;
    await AsyncStorage.removeItem(key(snapshot.accountId, "pending"));
    setPending(null);
    await reload();
  }
  async function setTimer(value: Timer | null) {
    if (!snapshot) throw Error("Library not loaded");
    if (value)
      await AsyncStorage.setItem(
        key(snapshot.accountId, "timer"),
        JSON.stringify(value),
      );
    else await AsyncStorage.removeItem(key(snapshot.accountId, "timer"));
    setTimerState(value);
  }
  return (
    <Context.Provider
      value={{
        snapshot,
        entitlements,
        catalog,
        busy,
        error,
        pending,
        timer,
        reload,
        mutate,
        retry,
        discard,
        setTimer,
        id: Crypto.randomUUID,
      }}
    >
      {children}
    </Context.Provider>
  );
}
