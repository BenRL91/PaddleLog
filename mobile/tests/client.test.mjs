import { test } from "node:test";
import assert from "node:assert/strict";
import { createApi, matchesConfirmedChange } from "../src/api.js";
import { createSecureAuthStorage, recordKey } from "../src/native-store.js";
import {
  validate,
  sessionUsage,
  componentWear,
  pauseTimer,
  resumeTimer,
  switchTimerPaddle,
  finishTimer,
  allocateSupply,
  usedUnits,
  withPaddleReflections,
  gameRecords,
  summarizeGames,
} from "../src/domain.js";
import { applyChanges } from "../../public/record-sync.js";
const blank = () =>
  validate({
    version: 2,
    paddles: [
      { id: "a", brand: "Brand", model: "One" },
      { id: "b", brand: "Brand", model: "Two" },
    ],
    sessions: [],
    usagePeriods: [],
    catalog: [],
    settings: { collectionExpenses: [] },
  });
const response = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
test("secure auth storage handles large sessions, atomic replacement, failure and deletion", async () => {
  const data = new Map();
  let count = 0,
    fail = false;
  const vault = {
    getItemAsync: async (k) => data.get(k) ?? null,
    setItemAsync: async (k, v) => {
      if (fail && k.includes(".")) throw Error("Locked");
      data.set(k, v);
    },
    deleteItemAsync: async (k) => {
      data.delete(k);
    },
  };
  const store = createSecureAuthStorage(vault, () => String(++count));
  const first = "token".repeat(2000);
  await store.setItem("session", first);
  assert.equal(await store.getItem("session"), first);
  fail = true;
  await assert.rejects(store.setItem("session", "replacement"));
  assert.equal(await store.getItem("session"), first);
  fail = false;
  await store.setItem("session", "replacement");
  assert.equal(await store.getItem("session"), "replacement");
  await store.removeItem("session");
  assert.equal(await store.getItem("session"), null);
});
test("draft and timer keys isolate users, accounts, and storage kinds", () => {
  assert.notEqual(recordKey("u1", "a", "timer"), recordKey("u2", "a", "timer"));
  assert.notEqual(
    recordKey("u", "a1", "pending"),
    recordKey("u", "a2", "pending"),
  );
  assert.notEqual(recordKey("u", "a", "timer"), recordKey("u", "a", "pending"));
});
test("API uses bearer only, refreshes once, and preserves server conflict errors", async () => {
  let calls = [],
    token = "old";
  const api = createApi({
    origin: "https://example.test",
    getToken: async () => token,
    refreshToken: async () => {
      token = "fresh";
    },
    fetcher: async (url, opts) => {
      calls.push({ url, opts });
      return calls.length === 1
        ? response({ error: "Expired" }, 401)
        : response({ accountId: "mine", revision: 1, state: blank() });
    },
  });
  assert.equal((await api.load()).accountId, "mine");
  assert.equal(calls.length, 2);
  assert.equal(calls[1].opts.credentials, "omit");
  assert.equal(calls[1].opts.headers.Authorization, "Bearer fresh");
  assert.throws(() =>
    createApi({ origin: "http://example.test", getToken: async () => "" }),
  );
  const failed = createApi({
    origin: "https://example.test",
    getToken: async () => "token",
    refreshToken: async () => {},
    fetcher: async () => response({ error: "Records changed" }, 409),
  });
  await assert.rejects(failed.load(), (e) => e.status === 409);
});
test("minimal PATCH preserves provenance, unknown fields, usage, and stable record identity", async () => {
  const state = blank();
  state.sessions = [
    {
      id: "session",
      paddleId: "a",
      start: "2026-10-01T10:00:00Z",
      end: "2026-10-01T11:00:00Z",
    },
  ];
  state.futureField = { keep: true };
  const next = structuredClone(state);
  next.sessions[0].name = "Rec play";
  let body;
  const api = createApi({
    origin: "https://example.test",
    getToken: async () => "token",
    refreshToken: async () => {},
    fetcher: async (_, o) => {
      body = JSON.parse(o.body);
      return response({ revision: 8 });
    },
  });
  const result = await api.save(
    { accountId: "account", revision: 7, state },
    next,
  );
  assert.equal(result.revision, 8);
  assert.equal(body.accountId, "account");
  assert.equal(body.revision, 7);
  assert.deepEqual(body.changes.sessions.upsert, [
    { id: "session", fields: { name: "Rec play" }, unset: [] },
  ]);
  assert.equal(body.changes.paddles, undefined);
  const applied = applyChanges(state, body.changes);
  assert.deepEqual(applied, next);
  assert.equal(sessionUsage("a", applied.sessions), 1);
});
test("pause, resume and switching assign exactly recorded time and support restart", () => {
  let timer = {
    id: "timer",
    paddleId: "a",
    start: "2026-10-01T10:00:00Z",
    segments: [{ id: "one", paddleId: "a", start: "2026-10-01T10:00:00Z" }],
  };
  timer = pauseTimer(timer, "2026-10-01T10:30:00Z");
  timer = JSON.parse(JSON.stringify(timer));
  timer = resumeTimer(timer, "2026-10-01T11:00:00Z", "two");
  timer = switchTimerPaddle(timer, "b", "2026-10-01T11:15:00Z", "three");
  const session = finishTimer(timer, "2026-10-01T11:30:00Z");
  assert.equal(sessionUsage("a", [session]), 0.75);
  assert.equal(sessionUsage("b", [session]), 0.25);
  assert.deepEqual(finishTimer(session, "2026-10-01T12:00:00Z"), session);
});
test("maintenance allocates shared packs in integer cents; deleting error restores prior wear", () => {
  let s = blank();
  s.settings.collectionExpenses = [
    {
      id: "pack",
      kind: "overgrip",
      product: "Grip",
      amount: 10,
      currency: "USD",
      quantity: 3,
      date: "2026-10-01",
    },
  ];
  let p = s.paddles[0];
  p.maintenance = [
    {
      id: "old",
      kind: "overgrip",
      action: "install",
      at: "2026-10-01T00:00:00Z",
      interval: 2,
    },
  ];
  s.sessions = [
    {
      id: "s",
      paddleId: "a",
      start: "2026-10-01T10:00:00Z",
      end: "2026-10-01T11:00:00Z",
    },
  ];
  const event = {
    id: "new",
    kind: "overgrip",
    action: "install",
    at: "2026-10-02T00:00:00Z",
    interval: 2,
  };
  const cost = allocateSupply(s, p, event, "pack");
  assert.equal(cost.amount, 3.33);
  p.maintenance.push(event);
  p.expenses = [cost];
  assert.equal(usedUnits(s, "pack"), 1);
  assert.equal(componentWear(p, s.sessions, "overgrip", s.settings).hours, 0);
  p.maintenance = p.maintenance.filter((e) => e.id !== "new");
  p.expenses = [];
  assert.equal(componentWear(p, s.sessions, "overgrip", s.settings).hours, 1);
  assert.equal(usedUnits(s, "pack"), 0);
  assert.doesNotThrow(() => validate(s));
});
test("each used paddle has an independent reflection; manual scores never create usage", () => {
  let s = blank();
  const start = "2026-10-01T10:00:00Z",
    end = "2026-10-01T11:00:00Z";
  const session = withPaddleReflections(
    {
      id: "s",
      paddleId: "a",
      start,
      end,
      segments: [
        { id: "one", paddleId: "a", start, end: "2026-10-01T10:30:00Z" },
        { id: "two", paddleId: "b", start: "2026-10-01T10:30:00Z", end },
      ],
      manualGames: {
        version: 1,
        games: [
          {
            id: "g",
            discipline: "singles",
            format: "side-out",
            status: "completed",
            target: 11,
            winBy: 2,
            teams: [["You"], ["Guest"]],
            ownerTeam: 0,
            score: [11, 9],
            paddleId: "a",
          },
        ],
      },
    },
    [
      { paddleId: "a", control: 4 },
      { paddleId: "b", control: 2 },
    ],
  );
  s.sessions = [session];
  s = validate(s);
  assert.equal(s.sessions[0].paddleReflections.length, 2);
  assert.equal(sessionUsage("a", s.sessions), 0.5);
  assert.equal(summarizeGames(gameRecords(s)).wins, 1);
});

test("lost acknowledgment is recognized after server normalization without accepting unrelated changes", () => {
  const next = blank();
  next.paddles.push({ id: "new-paddle", brand: "Brand", model: "New" });
  const confirmed = validate(next);
  assert.equal(matchesConfirmedChange(next, confirmed), true);
  confirmed.paddles[0].nickname = "Changed on another device";
  assert.equal(matchesConfirmedChange(next, confirmed), false);
});
