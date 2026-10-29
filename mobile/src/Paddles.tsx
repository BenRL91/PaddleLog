import React, { useState } from "react";
import { Alert, FlatList, Pressable, View } from "react-native";
import { useLibrary } from "./LibraryProvider";
import { Button, Card, Chips, Field, Label, Row, Screen, Sheet } from "./ui";
import { PaddlePhoto, ProGate } from "./components";
import {
  activeMain,
  changeMain,
  sessionUsage,
  ownedPaddleLabel,
  componentWear,
  surfaceInfo,
  supportsSkin,
  availableSupplies,
  allocateSupply,
  usedUnits,
  roundMoney,
  gameRecords,
  summarizeGames,
} from "./domain";
import { ActionMenu } from "./actions";
import { useFormDraft } from "./useFormDraft";
import type { Paddle, Library, Maintenance, Expense } from "./types";
export function Paddles({
  onOpen,
  onAdd,
}: {
  onOpen: (p: Paddle) => void;
  onAdd: () => void;
}) {
  const { snapshot, catalog } = useLibrary();
  const [q, setQ] = useState(""),
    [filter, setFilter] = useState("all");
  const state = snapshot!.state;
  const rows = state.paddles.filter(
    (p) =>
      [p.brand, p.model, p.nickname]
        .join(" ")
        .toLowerCase()
        .includes(q.toLowerCase()) &&
      (filter === "all" ||
        (filter === "favorites" && p.favorite) ||
        p.status === filter),
  );
  return (
    <>
      <View style={{ padding: 18, gap: 10 }}>
        <Row>
          <View style={{ flex: 1 }}>
            <Label big>Your paddles</Label>
          </View>
          <Button title="＋ Add paddle" onPress={onAdd} />
        </Row>
        <Field label="Find a paddle" value={q} onChange={setQ} />
        <Chips
          value={filter}
          onChange={setFilter}
          items={["all", "active", "archived", "favorites"].map((id) => ({
            id,
            label: id[0].toUpperCase() + id.slice(1),
          }))}
        />
        <Label muted>{rows.length} paddles</Label>
      </View>
      <FlatList
        data={rows}
        keyExtractor={(p) => p.id}
        initialNumToRender={12}
        maxToRenderPerBatch={12}
        windowSize={7}
        contentContainerStyle={{ padding: 18, paddingTop: 0, gap: 12 }}
        renderItem={({ item: p }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={"Open " + ownedPaddleLabel(p, catalog).title}
            onPress={() => onOpen(p)}
          >
            <Card>
              <Row>
                <PaddlePhoto paddle={p} />
                <View style={{ flex: 1, gap: 7 }}>
                  <Label big>
                    {p.favorite ? "★ " : ""}
                    {ownedPaddleLabel(p, catalog).title}
                  </Label>
                  <Label muted>
                    {[
                      p.brand,
                      p.shape,
                      p.thickness ? `${p.thickness} mm` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </Label>
                  <Label>
                    {sessionUsage(p.id, state.sessions).toFixed(1)} h ·{" "}
                    {p.status}
                  </Label>
                  {state.settings.mainPaddleId === p.id && (
                    <Label>Main paddle</Label>
                  )}
                </View>
              </Row>
            </Card>
          </Pressable>
        )}
        ListEmptyComponent={
          <Card>
            <Label>No paddles match this view.</Label>
          </Card>
        }
      />
    </>
  );
}
export function PaddleEditor({
  paddle,
  onClose,
}: {
  paddle?: Paddle;
  onClose: () => void;
}) {
  const { snapshot, catalog, mutate, busy, id } = useLibrary();
  const [recordId, setRecordId] = useState(() => paddle?.id ?? id()),
    [name, setName] = useState(paddle?.nickname ?? ""),
    [brand, setBrand] = useState(paddle?.brand ?? ""),
    [model, setModel] = useState(paddle?.model ?? ""),
    [selected, setSelected] = useState<Paddle | null>(null),
    [search, setSearch] = useState(""),
    [finding, setFinding] = useState(!paddle),
    [error, setError] = useState("");
  const rows =
    search.trim().length > 1
      ? catalog
          .filter((r) =>
            (r.brand + " " + r.model)
              .toLowerCase()
              .includes(search.toLowerCase()),
          )
          .slice(0, 25)
      : [];
  const draft = useFormDraft(
    "paddle-" + (paddle?.id ?? "new"),
    { recordId, name, brand, model, selected },
    (v) => {
      setRecordId(v.recordId);
      setName(v.name);
      setBrand(v.brand);
      setModel(v.model);
      setSelected(v.selected);
    },
  );
  async function save() {
    try {
      await mutate((s) => ({
        ...s,
        paddles: s.paddles.some((p) => p.id === recordId)
          ? s.paddles.map((p) =>
              p.id === recordId
                ? { ...p, ...selected, nickname: name, brand, model }
                : p,
            )
          : [
              ...s.paddles,
              {
                id: recordId,
                ...selected,
                nickname: name,
                brand,
                model,
                status: "active",
                createdAt: new Date().toISOString(),
              },
            ],
      }));
      await draft.clear();
      onClose();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <Sheet
      title={paddle ? "Edit paddle" : "Add paddle"}
      onClose={() =>
        void draft
          .flush()
          .then(onClose)
          .catch((e) => Alert.alert("Keep this form open", e.message))
      }
    >
      <Screen>
        <Field label="Nickname (optional)" value={name} onChange={setName} />
        <Button
          title={
            finding ? "Hide catalog search" : "Find or change catalog model"
          }
          onPress={() => setFinding(!finding)}
        />
        {finding && (
          <>
            <Field
              label="Search catalog by brand or model"
              value={search}
              onChange={setSearch}
            />
            {rows.map((r) => (
              <Button
                key={r.referenceModelId}
                title={[
                  r.brand,
                  r.model,
                  r.shape,
                  r.thickness ? `${r.thickness} mm` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
                onPress={() => {
                  setBrand(r.brand);
                  setModel(r.model);
                  setSelected({
                    id: recordId,
                    brand: r.brand,
                    model: r.model,
                    shape: r.shape,
                    thickness: r.thickness,
                    modelId: r.referenceModelId,
                  });
                  setFinding(false);
                }}
              />
            ))}
          </>
        )}
        <Field label="Brand" value={brand} onChange={setBrand} />
        <Field label="Model" value={model} onChange={setModel} />
        {error && <Label>{error}</Label>}
        {draft.error && <Label>{draft.error}</Label>}
        <Button
          title={busy ? "Saving…" : "Save paddle"}
          primary
          disabled={
            !draft.ready ||
            !!draft.error ||
            busy ||
            !brand.trim() ||
            !model.trim() ||
            !snapshot
          }
          onPress={() => void save()}
        />
      </Screen>
    </Sheet>
  );
}
export function PaddleDetails({
  paddle,
  onClose,
  onEdit,
}: {
  paddle: Paddle;
  onClose: () => void;
  onEdit: () => void;
}) {
  const { snapshot, mutate, busy, catalog } = useLibrary();
  const [maintain, setMaintain] = useState(""),
    [insights, setInsights] = useState(false),
    [showMenu, setShowMenu] = useState(false);
  const s = snapshot!.state,
    p = s.paddles.find((r) => r.id === paddle.id) ?? paddle;
  const update = (fn: (state: Library) => Library) =>
    void mutate(fn).catch((e) => Alert.alert("Change not saved", e.message));
  const menu = () => setShowMenu(true);

  return (
    <Sheet title="Paddle details" onClose={onClose}>
      <Screen>
        <Row>
          <PaddlePhoto paddle={p} size={110} />
          <View style={{ flex: 1, gap: 10 }}>
            <Label big>{ownedPaddleLabel(p, catalog).title}</Label>
            <Label muted>
              {p.brand} · {p.status}
            </Label>
            <Label>
              {sessionUsage(p.id, s.sessions).toFixed(1)} total hours
            </Label>
          </View>
          <Button title="⋮" onPress={menu} />
        </Row>
        {p.status === "active" && s.settings.mainPaddleId !== p.id && (
          <Button
            title="Set as Main"
            disabled={busy}
            onPress={() =>
              update((s) => ({ ...s, settings: changeMain(s.settings, p.id) }))
            }
          />
        )}
        <Label big>Maintenance</Label>
        {["overgrip", "edgeTape", ...(supportsSkin(p) ? ["skin"] : [])].map(
          (kind) => {
            const wear = componentWear(p, s.sessions, kind, s.settings);
            return (
              <Card key={kind}>
                <Row>
                  <View style={{ flex: 1 }}>
                    <Label>
                      {kind === "overgrip"
                        ? "Overgrip"
                        : kind === "edgeTape"
                          ? "Edge tape"
                          : "Skin"}
                    </Label>
                    <Label muted>
                      {wear.installed || wear.legacy
                        ? `${wear.label} · ${wear.hours.toFixed(1)} h`
                        : "Not installed"}
                    </Label>
                  </View>
                  <Button
                    title={wear.installed ? "Replace" : "Install"}
                    onPress={() => setMaintain(kind)}
                  />
                </Row>
              </Card>
            );
          },
        )}
        <Card>
          <Label>Surface · {surfaceInfo(p, catalog).label}</Label>
          <Label muted>Wear data pending</Label>
        </Card>
        <Button
          title="Performance insights · PRO"
          onPress={() => setInsights(true)}
        />
        <Label big>Maintenance history</Label>
        {[...(p.maintenance ?? [])].reverse().map((e) => (
          <Card key={e.id}>
            <Row>
              <View style={{ flex: 1 }}>
                <Label>
                  {e.product || e.kind} · {e.action}
                </Label>
                <Label muted>{new Date(e.at).toLocaleString()}</Label>
              </View>
              <Button
                title="⋮"
                onPress={() =>
                  Alert.alert(
                    "Maintenance record",
                    "Deleting an erroneous installation restores the previous recorded consumable and its usage.",
                    [
                      {
                        text: "Delete record",
                        style: "destructive",
                        onPress: () =>
                          update((s) => ({
                            ...s,
                            paddles: s.paddles.map((r) =>
                              r.id === p.id
                                ? {
                                    ...r,
                                    maintenance: r.maintenance?.filter(
                                      (x) => x.id !== e.id,
                                    ),
                                    expenses: r.expenses?.filter(
                                      (x) => x.maintenanceEventId !== e.id,
                                    ),
                                  }
                                : r,
                            ),
                          })),
                      },
                      { text: "Cancel", style: "cancel" },
                    ],
                  )
                }
              />
            </Row>
          </Card>
        ))}
      </Screen>
      {showMenu && (
        <ActionMenu
          title="Paddle actions"
          onClose={() => setShowMenu(false)}
          actions={[
            { label: "Edit", run: onEdit },
            {
              label: p.favorite ? "Remove favorite" : "Favorite",
              run: () =>
                update((s) => ({
                  ...s,
                  paddles: s.paddles.map((r) =>
                    r.id === p.id ? { ...r, favorite: !r.favorite } : r,
                  ),
                })),
            },
            {
              label: p.status === "archived" ? "Make active" : "Archive",
              run: () =>
                update((s) => {
                  const archived = p.status !== "archived";
                  return {
                    ...s,
                    paddles: s.paddles.map((r) =>
                      r.id === p.id
                        ? { ...r, status: archived ? "archived" : "active" }
                        : r,
                    ),
                    settings:
                      archived && s.settings.mainPaddleId === p.id
                        ? changeMain(s.settings, null)
                        : s.settings,
                  };
                }),
            },
          ]}
        />
      )}{" "}
      {maintain && (
        <MaintenanceEditor
          paddle={p}
          kind={maintain}
          onClose={() => setMaintain("")}
        />
      )}{" "}
      {insights && (
        <Sheet title="Paddle insights" onClose={() => setInsights(false)}>
          <ProGate>
            <Screen>
              <Card>
                <Label big>{sessionUsage(p.id, s.sessions).toFixed(1)} h</Label>
                <Label>Total recorded and estimated use</Label>
              </Card>
              {(() => {
                const result = summarizeGames(
                  gameRecords(s).filter((r) => r.paddleId === p.id),
                );
                return (
                  <Card>
                    <Label big>
                      {result.wins} W · {result.losses} L
                    </Label>
                    <Label>
                      {result.knownResults} eligible games ·{" "}
                      {result.unknownResults} unknown outcomes
                    </Label>
                    <Label muted>
                      Results describe your recorded play, not proof of paddle
                      superiority. Mixed-paddle games remain separate.
                    </Label>
                  </Card>
                );
              })()}
            </Screen>
          </ProGate>
        </Sheet>
      )}
    </Sheet>
  );
}
export function MaintenanceEditor({
  paddle,
  kind,
  onClose,
}: {
  paddle: Paddle;
  kind: string;
  onClose: () => void;
}) {
  const { snapshot, mutate, busy, id } = useLibrary();
  const [eventId] = useState(id),
    [error, setError] = useState("");
  const supplies = availableSupplies(snapshot!.state, kind);
  async function install(supplyId: string) {
    try {
      await mutate((s) => {
        const p = s.paddles.find((r) => r.id === paddle.id)!;
        const pack = s.settings.collectionExpenses!.find(
          (e) => e.id === supplyId,
        )!;
        const event: Maintenance = {
          id: eventId,
          kind,
          action: "install",
          at: new Date().toISOString(),
          product: pack.product,
          interval: kind === "overgrip" ? 2 : 8,
        };
        const cost = allocateSupply(s, p, event, supplyId);
        return {
          ...s,
          paddles: s.paddles.map((r) =>
            r.id === p.id
              ? {
                  ...r,
                  maintenance: [
                    ...(r.maintenance ?? []).filter((e) => e.id !== eventId),
                    event,
                  ],
                  expenses: [
                    ...(r.expenses ?? []).filter(
                      (e) => e.maintenanceEventId !== eventId,
                    ),
                    cost,
                  ],
                }
              : r,
          ),
        };
      });
      onClose();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <Sheet
      title={
        kind === "edgeTape"
          ? "Install edge tape"
          : kind === "overgrip"
            ? "Replace overgrip"
            : "Replace skin"
      }
      onClose={onClose}
    >
      <Screen>
        <Label>Choose from your saved supplies.</Label>
        {supplies.map((pack: Expense) => (
          <Button
            key={pack.id}
            title={`${pack.product} · ${roundMoney(pack.quantity! - usedUnits(snapshot!.state, pack.id))} remaining`}
            disabled={busy}
            onPress={() => void install(pack.id)}
          />
        ))}
        {!supplies.length && (
          <Label muted>
            No matching supplies remain. Add a pack in Costs → Supplies first.
          </Label>
        )}
        {error && <Label>{error}</Label>}
      </Screen>
    </Sheet>
  );
}
