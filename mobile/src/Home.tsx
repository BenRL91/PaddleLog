import React, { useState } from "react";
import { Alert, ImageBackground, View } from "react-native";
import { useLibrary } from "./LibraryProvider";
import { Button, Card, Label, Row, Screen, useTheme } from "./ui";
import { PaddlePicker, PaddlePhoto } from "./components";
import {
  activeMain,
  componentWear,
  sessionUsage,
  ownedPaddleLabel,
  surfaceInfo,
} from "./domain";
import { MaintenanceEditor } from "./Paddles";
import type { Paddle } from "./types";
export function Home({
  onStart,
  onAdd,
  onDetails,
  onEdit,
  onInsights,
}: {
  onStart: (id: string) => void;
  onAdd: (p: Paddle) => void;
  onDetails: (p: Paddle) => void;
  onEdit: (p: Paddle) => void;
  onInsights: (p: Paddle) => void;
}) {
  const { snapshot, catalog, timer } = useLibrary();
  const s = snapshot!.state,
    [selected, setSelected] = useState<string>(),
    [picker, setPicker] = useState(false),
    [kind, setKind] = useState("");
  const p =
    s.paddles.find((p) => p.id === selected && p.status === "active") ??
    s.paddles.find((p) => p.id === activeMain(s.paddles, s.settings));
  if (!p)
    return (
      <Screen>
        <Card>
          <Label big>Your paddle journey starts here</Label>
          <Label>
            Add your first paddle from the Paddles tab. Then log a session
            whenever you play.
          </Label>
        </Card>
      </Screen>
    );
  const wear = componentWear(p, s.sessions, "overgrip", s.settings),
    edge = componentWear(p, s.sessions, "edgeTape", s.settings);
  return (
    <Screen>
      <View style={{ gap: 18 }}>
        <PaddlePhoto paddle={p} background />
        <Row>
          <View style={{ flex: 1 }}>
            <Button
              title={ownedPaddleLabel(p, catalog).title + " ⌄"}
              onPress={() => setPicker(true)}
            />
          </View>
        </Row>
        <Row>
          <View style={{ flex: 1 }}>
            <Label muted>
              {[p.brand, p.shape, p.thickness ? `${p.thickness} mm` : null]
                .filter(Boolean)
                .join(" · ")}
            </Label>
            {s.settings.mainPaddleId === p.id && <Label>Main paddle</Label>}
          </View>
          <Button title="Edit" small onPress={() => onEdit(p)} />
        </Row>
        <Button
          title={timer ? "Return to session" : "Start session"}
          primary
          onPress={() => onStart(p.id)}
        />
        <Row>
          <View style={{ flex: 1 }}>
            <Button title="Add past session" onPress={() => onAdd(p)} />
          </View>
          <View style={{ flex: 1 }}>
            <Button title="View full details" onPress={() => onDetails(p)} />
          </View>
        </Row>
        <Button title="Insights · PRO" onPress={() => onInsights(p)} />
        <Label big>Maintenance</Label>
        <Row>
          {[
            {
              id: "overgrip",
              name: "Grip",
              value:
                wear.installed || wear.legacy
                  ? `${wear.label} · ${wear.hours.toFixed(1)} h`
                  : "Not installed",
            },
            {
              id: "edgeTape",
              name: "Edge tape",
              value: edge.installed ? edge.label : "None",
            },
            {
              id: "surface",
              name: "Surface",
              value: surfaceInfo(p, catalog).label,
            },
          ].map((item) => (
            <View key={item.id} style={{ flex: 1 }}>
              <Button
                title={item.name + "\n" + item.value}
                onPress={() =>
                  item.id === "surface"
                    ? Alert.alert(
                        "Surface",
                        surfaceInfo(p, catalog).label + " · Wear data pending",
                      )
                    : setKind(item.id)
                }
              />
            </View>
          ))}
        </Row>
        <Card>
          <Label>
            {sessionUsage(p.id, s.sessions).toFixed(1)} h lifetime ·{" "}
            {
              s.sessions.filter(
                (x) => Date.parse(x.start) > Date.now() - 7 * 86400000,
              ).length
            }{" "}
            sessions this week
          </Label>
        </Card>
      </View>
      {picker && (
        <PaddlePicker
          value={p.id}
          onSelect={setSelected}
          onClose={() => setPicker(false)}
        />
      )}{" "}
      {kind && (
        <MaintenanceEditor paddle={p} kind={kind} onClose={() => setKind("")} />
      )}
    </Screen>
  );
}
