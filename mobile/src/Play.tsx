import React, { useEffect, useState } from "react";
import { Alert, FlatList, Pressable, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useLibrary } from "./LibraryProvider";
import {
  Button,
  Card,
  Chips,
  Field,
  Label,
  Row,
  Screen,
  Sheet,
  useTheme,
} from "./ui";
import { PaddlePicker, ProGate } from "./components";
import {
  pauseTimer,
  resumeTimer,
  switchTimerPaddle,
  finishTimer,
  usageSegments,
  usesPaddle,
  withPaddleReflections,
  sessionReflections,
  gameRecords,
  summarizeGames,
  filterGameRecords,
  sessionUsage,
} from "./domain";
import { useFormDraft } from "./useFormDraft";
import type { Paddle, Session, Timer, Reflection, Game } from "./types";
export function SessionTimer({ onClose }: { onClose: () => void }) {
  const { snapshot, timer, setTimer, mutate, busy, id } = useLibrary();
  const [clock, setClock] = useState(Date.now()),
    [picker, setPicker] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    const interval = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);
  if (!timer) return null;
  const run = async (fn: () => Promise<void>) => {
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    }
  };
  const at = () => new Date().toISOString();
  const hours = (
    timer.segments ?? [{ start: timer.start, end: timer.end }]
  ).reduce(
    (n, s) =>
      n +
      Math.max(
        0,
        Date.parse(s.end ?? timer.end ?? new Date(clock).toISOString()) -
          Date.parse(s.start),
      ) /
        3600000,
    0,
  );
  const p = snapshot!.state.paddles.find((p) => p.id === timer.paddleId);
  async function finish() {
    const completed = finishTimer(timer, at()) as Session;
    await setTimer(completed as Timer);
    await mutate((s) =>
      s.sessions.some((x) => x.id === completed.id)
        ? s
        : { ...s, sessions: [...s.sessions, completed] },
    );
    await setTimer(null);
    onClose();
  }
  return (
    <Sheet title="Session timer" onClose={onClose}>
      <Screen>
        <Label muted>
          {timer.end
            ? "Ended · awaiting save"
            : timer.pausedAt
              ? "Paused"
              : "Playing"}
        </Label>
        <Label big>
          {Math.floor(hours * 60)} min {Math.floor(hours * 3600) % 60} sec
        </Label>
        <Button
          title={p?.nickname || p?.model || "Choose paddle"}
          disabled={!!timer.end}
          onPress={() => setPicker(true)}
        />
        {!timer.end && (
          <Button
            title={timer.pausedAt ? "Resume" : "Pause"}
            onPress={() =>
              void run(() =>
                setTimer(
                  timer.pausedAt
                    ? resumeTimer(timer, at(), id())
                    : pauseTimer(timer, at()),
                ),
              )
            }
          />
        )}
        <Button
          title={
            busy ? "Saving…" : timer.end ? "Retry save" : "End and save session"
          }
          disabled={busy}
          primary
          onPress={() => void run(finish)}
        />
        <Button
          title="Discard timer"
          danger
          disabled={busy}
          onPress={() =>
            Alert.alert("Discard session timer?", "No usage will be added.", [
              { text: "Keep timer", style: "cancel" },
              {
                text: "Discard",
                style: "destructive",
                onPress: () =>
                  void run(async () => {
                    await setTimer(null);
                    onClose();
                  }),
              },
            ])
          }
        />
        {error && <Label>{error}</Label>}
        <Label muted>
          Only recorded playing segments count toward paddle usage. Pauses are
          excluded. The timer is kept on this device until saved.
        </Label>
      </Screen>
      {picker && (
        <PaddlePicker
          value={timer.paddleId}
          onClose={() => setPicker(false)}
          onSelect={(paddleId) =>
            void run(() =>
              setTimer(switchTimerPaddle(timer, paddleId, at(), id())),
            )
          }
        />
      )}
    </Sheet>
  );
}
export function Play({
  onAdd,
  onEdit,
}: {
  onAdd: () => void;
  onEdit: (s: Session) => void;
}) {
  const { snapshot, mutate } = useLibrary();
  const [q, setQ] = useState(""),
    [tab, setTab] = useState("sessions"),
    [expanded, setExpanded] = useState<string | null>(null);
  const state = snapshot!.state;
  const rows = state.sessions
    .filter((s) =>
      [
        s.name,
        s.location,
        s.notes,
        state.paddles.find((p) => p.id === s.paddleId)?.model,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q.toLowerCase()),
    )
    .sort((a, b) => Date.parse(b.start) - Date.parse(a.start));
  return (
    <>
      <View style={{ padding: 18, gap: 12 }}>
        <Row>
          <View style={{ flex: 1 }}>
            <Label big>Play</Label>
          </View>
          <Button title="＋ Past session" onPress={onAdd} />
        </Row>
        <Chips
          value={tab}
          onChange={setTab}
          items={[
            { id: "sessions", label: "Sessions" },
            { id: "results", label: "Results · PRO" },
          ]}
        />
        {tab === "sessions" && (
          <Field label="Search sessions" value={q} onChange={setQ} />
        )}
      </View>
      {tab === "results" ? (
        <ProGate>
          <Results />
        </ProGate>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(s) => s.id}
          initialNumToRender={15}
          contentContainerStyle={{ padding: 18, paddingTop: 0, gap: 12 }}
          renderItem={({ item: s }) => {
            const minutes = state.paddles.reduce(
              (n, p) => n + sessionUsage(p.id, [s]) * 60,
              0,
            );
            return (
              <Card>
                <Row>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ expanded: expanded === s.id }}
                    style={{ flex: 1, gap: 6 }}
                    onPress={() => setExpanded(expanded === s.id ? null : s.id)}
                  >
                    <Label big>
                      {s.name ||
                        state.paddles.find((p) => p.id === s.paddleId)?.model ||
                        "Playing session"}
                    </Label>
                    <Label muted>
                      {new Date(s.start).toLocaleString()} ·{" "}
                      {Math.round(minutes)} min {expanded === s.id ? "⌃" : "⌄"}
                    </Label>
                  </Pressable>
                  <Button
                    title="⋮"
                    onPress={() =>
                      Alert.alert(
                        "Session actions",
                        s.name || "Playing session",
                        [
                          { text: "Edit", onPress: () => onEdit(s) },
                          {
                            text: "Delete",
                            style: "destructive",
                            onPress: () =>
                              Alert.alert(
                                "Delete this session?",
                                "This removes its attributed paddle usage from PaddleLog.",
                                [
                                  { text: "Cancel", style: "cancel" },
                                  {
                                    text: "Delete",
                                    style: "destructive",
                                    onPress: () =>
                                      void mutate((state) => ({
                                        ...state,
                                        sessions: state.sessions.filter(
                                          (x) => x.id !== s.id,
                                        ),
                                      })).catch((e) =>
                                        Alert.alert("Delete failed", e.message),
                                      ),
                                  },
                                ],
                              ),
                          },
                          { text: "Cancel", style: "cancel" },
                        ],
                      )
                    }
                  />
                </Row>
                {expanded === s.id && (
                  <>
                    <Label muted>
                      {s.picklePoint ? "Pickle Point" : "PaddleLog"}
                      {s.location ? " · " + s.location : ""}
                    </Label>
                    {state.paddles
                      .filter((p) => usesPaddle(s, p.id))
                      .map((p) => (
                        <Label key={p.id}>
                          {p.nickname || p.model} ·{" "}
                          {Math.round(sessionUsage(p.id, [s]) * 60)} min
                        </Label>
                      ))}
                    {s.notes && <Label>{s.notes}</Label>}
                    {gameRecords({ ...state, sessions: [s] }).map((r) => (
                      <Label key={r.game.id}>
                        {r.game.finalScore?.join(" – ") || "Unknown score"} ·{" "}
                        {r.won === null
                          ? "Outcome unknown"
                          : r.won
                            ? "Win"
                            : "Loss"}{" "}
                        · {r.discipline}
                      </Label>
                    ))}
                  </>
                )}
              </Card>
            );
          }}
          ListEmptyComponent={
            <Card>
              <Label>
                No sessions yet. Add a past session or start one from Home.
              </Label>
            </Card>
          }
        />
      )}
    </>
  );
}
export function Results({ paddleId }: { paddleId?: string } = {}) {
  const { snapshot } = useLibrary();
  const [range, setRange] = useState("30");
  const all = gameRecords(snapshot!.state),
    days = range === "all" ? null : Number(range),
    now = Date.now(),
    records = filterGameRecords(all, {
      start: days ? now - days * 86400000 : -Infinity,
    }),
    r = summarizeGames(
      paddleId
        ? records.filter(
            (row: { paddleId: string | null }) => row.paddleId === paddleId,
          )
        : records,
    );
  return (
    <Screen>
      <Chips
        value={range}
        onChange={setRange}
        items={[
          { id: "30", label: "30 days" },
          { id: "90", label: "90 days" },
          { id: "all", label: "All time" },
        ]}
      />
      <Card>
        <Label big>
          {r.wins} wins · {r.losses} losses
        </Label>
        <Label>
          {r.winRate === null ? "—" : (r.winRate as number).toFixed(1) + "%"}{" "}
          win rate · {r.knownResults} eligible results
        </Label>
        <Label muted>
          {r.unknownResults} unknown results · {r.knownScores} scored games
        </Label>
      </Card>
      <Card>
        <Label>
          Average score margin:{" "}
          {r.averageMargin === null
            ? "—"
            : (r.averageMargin as number).toFixed(1)}
        </Label>
        <Label>
          {r.mixed} mixed-paddle games · {r.unknownPaddle} unassigned games
        </Label>
      </Card>
      <Label muted>
        Game results never add usage time. Mixed and unknown paddle associations
        remain separate.
      </Label>
    </Screen>
  );
}
export function SessionEditor({
  session,
  paddle,
  onClose,
}: {
  session?: Session;
  paddle?: Paddle;
  onClose: () => void;
}) {
  const { snapshot, mutate, busy, id } = useLibrary();
  const [recordId, setRecordId] = useState(() => session?.id ?? id()),
    [name, setName] = useState(session?.name ?? ""),
    [location, setLocation] = useState(session?.location ?? ""),
    [notes, setNotes] = useState(session?.notes ?? ""),
    [start, setStart] = useState(
      new Date(session?.start ?? Date.now() - 3600000),
    ),
    [minutes, setMinutes] = useState(
      session
        ? String((Date.parse(session.end) - Date.parse(session.start)) / 60000)
        : "60",
    ),
    [paddleId, setPaddleId] = useState(
      session?.paddleId ??
        paddle?.id ??
        snapshot!.state.paddles.find((p) => p.status === "active")?.id ??
        "",
    ),
    [picker, setPicker] = useState(false),
    [dateMode, setDateMode] = useState<"date" | "time" | null>(null),
    [ratings, setRatings] = useState<Reflection[]>(
      session ? sessionReflections(session) : [],
    ),
    [games, setGames] = useState<Game[]>(session?.manualGames?.games ?? []),
    [gameEdit, setGameEdit] = useState(false),
    [error, setError] = useState("");
  const imported = !!session?.picklePoint,
    locked = imported || !!session?.segments?.length;
  const paddles = snapshot!.state.paddles.filter((p) =>
    session ? usesPaddle(session, p.id) : p.id === paddleId,
  );
  const draft = useFormDraft(
    "session-" + (session?.id ?? "new"),
    {
      recordId,
      name,
      location,
      notes,
      start: start.toISOString(),
      minutes,
      paddleId,
      ratings,
      games,
    },
    (v) => {
      setRecordId(v.recordId);
      setName(v.name);
      setLocation(v.location);
      setNotes(v.notes);
      setStart(new Date(v.start));
      setMinutes(v.minutes);
      setPaddleId(v.paddleId);
      setRatings(v.ratings);
      setGames(v.games);
    },
  );
  function close() {
    if (draft.error) {
      Alert.alert("Keep this form open", draft.error);
      return;
    }
    void draft
      .flush()
      .then(onClose)
      .catch((e) => Alert.alert("Keep this form open", e.message));
  }
  async function save() {
    try {
      const result = {
        ...(session ?? {}),
        id: recordId,
        paddleId,
        start: locked ? session!.start : start.toISOString(),
        end: locked
          ? session!.end
          : new Date(start.getTime() + Number(minutes) * 60000).toISOString(),
        name,
        location,
        notes,
        manualGames: { version: 1 as const, games },
      } as Session;
      const next = withPaddleReflections(
        result,
        ratings.filter((r) => paddles.some((p) => p.id === r.paddleId)),
      );
      await mutate((s) => ({
        ...s,
        sessions: s.sessions.some((x) => x.id === recordId)
          ? s.sessions.map((x) => (x.id === recordId ? { ...x, ...next } : x))
          : [...s.sessions, next],
      }));
      await draft.clear();
      onClose();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <Sheet
      title={session ? "Edit session" : "Add past session"}
      onClose={close}
    >
      <Screen>
        <Field
          label="Session name (optional)"
          value={name}
          onChange={setName}
        />
        {!locked && (
          <>
            <Button
              title={
                snapshot!.state.paddles.find((p) => p.id === paddleId)?.model ||
                "Choose paddle"
              }
              onPress={() => setPicker(true)}
            />
            <Button
              title={"Date: " + start.toLocaleDateString()}
              onPress={() => setDateMode("date")}
            />
            <Button
              title={"Time: " + start.toLocaleTimeString()}
              onPress={() => setDateMode("time")}
            />
            {dateMode && (
              <DateTimePicker
                value={start}
                mode={dateMode}
                onChange={(_, date) => {
                  setDateMode(null);
                  if (date) setStart(date);
                }}
              />
            )}
            <Field
              label="Recorded usage (minutes)"
              value={minutes}
              onChange={setMinutes}
              numeric
            />
          </>
        )}
        {locked && (
          <Label muted>
            Recorded source/segment times are preserved. Adding context or games
            will not change paddle usage.
          </Label>
        )}
        <Field
          label="Location (optional)"
          value={location}
          onChange={setLocation}
        />
        <Field
          label="Session reflection / notes"
          value={notes}
          onChange={setNotes}
          multiline
        />
        <Label big>Paddle reflections</Label>
        {paddles.map((p) => (
          <Card key={p.id}>
            <Label>{p.nickname || p.model}</Label>
            {(["control", "power", "comfort", "confidence"] as const).map(
              (field) => {
                const r = ratings.find((r) => r.paddleId === p.id);
                return (
                  <View key={field} style={{ gap: 6 }}>
                    <Label muted>
                      {field[0].toUpperCase() + field.slice(1)}
                    </Label>
                    <Chips
                      value={String(r?.[field] ?? "")}
                      onChange={(v) =>
                        setRatings((prev) => [
                          ...prev.filter((r) => r.paddleId !== p.id),
                          {
                            ...r,
                            paddleId: p.id,
                            [field]: v ? Number(v) : undefined,
                          },
                        ])
                      }
                      items={[
                        { id: "", label: "—" },
                        ...[1, 2, 3, 4, 5].map((n) => ({
                          id: String(n),
                          label: String(n),
                        })),
                      ]}
                    />
                  </View>
                );
              },
            )}
          </Card>
        ))}
        <Label big>Games & scores</Label>
        {Boolean(session?.picklePointScoring) && (
          <Label muted>
            Imported games remain owned by Pickle Point. You can add separate
            PaddleLog games here.
          </Label>
        )}
        {games.map((g) => (
          <Card key={g.id}>
            <Row>
              <View style={{ flex: 1 }}>
                <Label>
                  {g.teams[0].join(" / ")} vs {g.teams[1].join(" / ")}
                </Label>
                <Label muted>
                  {g.score?.join(" – ")} · {g.status}
                </Label>
              </View>
              <Button
                title="⋮"
                onPress={() =>
                  Alert.alert(
                    "Game actions",
                    "Remove this manually entered game?",
                    [
                      {
                        text: "Delete",
                        style: "destructive",
                        onPress: () =>
                          setGames(games.filter((x) => x.id !== g.id)),
                      },
                      { text: "Cancel", style: "cancel" },
                    ],
                  )
                }
              />
            </Row>
          </Card>
        ))}
        <Button title="＋ Add game" onPress={() => setGameEdit(true)} />
        {error && <Label>{error}</Label>}
        {draft.error && <Label>{draft.error}</Label>}
        <Label muted>Unsaved form kept on this device. Save to sync.</Label>
        <Button
          title={busy ? "Saving…" : "Save session"}
          primary
          disabled={!draft.ready || !!draft.error || busy || !paddleId}
          onPress={() => void save()}
        />
      </Screen>
      {picker && (
        <PaddlePicker
          value={paddleId}
          onSelect={(p) => {
            setPaddleId(p);
            setRatings([]);
          }}
          onClose={() => setPicker(false)}
        />
      )}{" "}
      {gameEdit && (
        <GameEditor
          paddleId={paddles.length === 1 ? paddles[0].id : null}
          onClose={() => setGameEdit(false)}
          onSave={(g) => {
            setGames([...games, g]);
            setGameEdit(false);
          }}
        />
      )}
    </Sheet>
  );
}
function GameEditor({
  paddleId,
  onClose,
  onSave,
}: {
  paddleId: string | null;
  onClose: () => void;
  onSave: (g: Game) => void;
}) {
  const { id } = useLibrary();
  const [recordId] = useState(id),
    [discipline, setDiscipline] = useState("doubles"),
    [format, setFormat] = useState("side-out"),
    [status, setStatus] = useState("completed"),
    [names, setNames] = useState(["You", "", "", ""]),
    [scores, setScores] = useState(["11", "9"]);
  return (
    <Sheet title="Add game" onClose={onClose}>
      <Screen>
        <Chips
          value={discipline}
          onChange={setDiscipline}
          items={[
            { id: "singles", label: "Singles" },
            { id: "doubles", label: "Doubles" },
          ]}
        />
        <Chips
          value={format}
          onChange={setFormat}
          items={["side-out", "rally", "simple"].map((id) => ({
            id,
            label: id,
          }))}
        />
        {(discipline === "singles" ? [0, 2] : [0, 1, 2, 3]).map((i) => (
          <Field
            key={i}
            label={
              ["Your name", "Your partner", "Opponent", "Other opponent"][i]
            }
            value={names[i]}
            onChange={(v) => setNames(names.map((n, j) => (j === i ? v : n)))}
          />
        ))}
        <Field
          label="Your team score"
          value={scores[0]}
          numeric
          onChange={(v) => setScores([v, scores[1]])}
        />
        <Field
          label="Opponent score"
          value={scores[1]}
          numeric
          onChange={(v) => setScores([scores[0], v])}
        />
        <Chips
          value={status}
          onChange={setStatus}
          items={[
            { id: "completed", label: "Completed" },
            { id: "unfinished", label: "Unfinished" },
          ]}
        />
        <Label muted>
          Default target 11, win by 2. Scores are validated when saving the
          session.
        </Label>
        <Button
          title="Add to session"
          primary
          onPress={() =>
            onSave({
              id: recordId,
              discipline: discipline as Game["discipline"],
              format: format as Game["format"],
              status: status as Game["status"],
              target: 11,
              winBy: 2,
              teams:
                discipline === "singles"
                  ? [[names[0]], [names[2]]]
                  : [names.slice(0, 2), names.slice(2)],
              ownerTeam: 0,
              score: scores.every((v) => v.trim() !== "")
                ? scores.map(Number)
                : null,
              paddleId,
            })
          }
        />
      </Screen>
    </Sheet>
  );
}
