import React, { useEffect, useState } from "react";
import { FlatList, Image, View } from "react-native";
import { auth, apiOrigin } from "./auth";
import { Button, Field, Label, Screen, Sheet, useTheme } from "./ui";
import { useLibrary } from "./LibraryProvider";
import { paddleImage, ownedPaddleLabel } from "./domain";
import type { Paddle } from "./types";
export function PaddlePhoto({
  paddle,
  size = 90,
  background = false,
}: {
  paddle: Paddle;
  size?: number;
  background?: boolean;
}) {
  const { catalog } = useLibrary();
  const [token, setToken] = useState<string>();
  const t = useTheme();
  const image = paddleImage(paddle, catalog);
  useEffect(() => {
    let alive = true;
    void auth!.auth.getSession().then((r) => {
      if (alive) setToken(r.data.session?.access_token);
    });
    return () => {
      alive = false;
    };
  }, [paddle.photoId]);
  const uri = image.src.startsWith("/") ? apiOrigin + image.src : image.src;
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [uri]);
  if (
    (failed ||
      image.kind === "placeholder" ||
      (image.kind === "uploaded" && !token)) &&
    background
  )
    return null;
  if (
    failed ||
    image.kind === "placeholder" ||
    (image.kind === "uploaded" && !token)
  )
    return (
      <View
        style={{
          width: size,
          height: size * 1.2,
          borderRadius: 14,
          backgroundColor: t.inset,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Label>▰</Label>
      </View>
    );
  return (
    <Image
      accessibilityLabel={image.alt}
      source={{
        uri,
        headers:
          image.kind === "uploaded"
            ? { Authorization: "Bearer " + token }
            : undefined,
        cache: "reload",
      }}
      onError={() => setFailed(true)}
      resizeMode={background ? "cover" : "contain"}
      style={
        background
          ? {
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              opacity: 0.13,
            }
          : { width: size, height: size * 1.2, borderRadius: 14 }
      }
    />
  );
}
export function PaddlePicker({
  value,
  onSelect,
  onClose,
  includeArchived = false,
}: {
  value?: string;
  onSelect: (id: string) => void;
  onClose: () => void;
  includeArchived?: boolean;
}) {
  const { snapshot, catalog } = useLibrary();
  const [q, setQ] = useState("");
  const rows = (snapshot?.state.paddles ?? []).filter(
    (p) =>
      (includeArchived || p.status === "active") &&
      [p.nickname, p.brand, p.model]
        .join(" ")
        .toLowerCase()
        .includes(q.toLowerCase()),
  );
  return (
    <Sheet title="Choose a paddle" onClose={onClose}>
      <View style={{ padding: 18 }}>
        <Field label="Search paddles" value={q} onChange={setQ} />
      </View>
      <FlatList
        data={rows}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: 18, gap: 10 }}
        renderItem={({ item: p }) => (
          <Button
            title={
              (p.id === value ? "✓ " : "") + ownedPaddleLabel(p, catalog).title
            }
            onPress={() => {
              onSelect(p.id);
              onClose();
            }}
          />
        )}
        ListEmptyComponent={<Label muted>No matching paddles.</Label>}
      />
    </Sheet>
  );
}
export function ErrorNotice() {
  const { error, pending, busy, retry, discard, reload } = useLibrary();
  if (!error && !pending) return null;
  return (
    <View accessibilityLiveRegion="polite" style={{ padding: 14, gap: 10 }}>
      <Label>{error || "An unsaved change is kept on this device."}</Label>
      {pending ? (
        <>
          <Button
            title="Retry saved change"
            disabled={busy}
            onPress={() => void retry().catch(() => {})}
          />
          <Button
            title="Discard saved change"
            danger
            disabled={busy}
            onPress={() =>
              import("react-native").then(({ Alert }) =>
                Alert.alert(
                  "Discard this change?",
                  "Your confirmed records remain unchanged.",
                  [
                    { text: "Keep draft", style: "cancel" },
                    {
                      text: "Discard",
                      style: "destructive",
                      onPress: () => void discard().catch(() => {}),
                    },
                  ],
                ),
              )
            }
          />
        </>
      ) : (
        <Button title="Reload library" onPress={() => void reload()} />
      )}
    </View>
  );
}
export function ProGate({ children }: { children: React.ReactNode }) {
  const { entitlements } = useLibrary();
  if (entitlements?.pro) return <>{children}</>;
  return (
    <Screen>
      <Label big>PaddleLog Pro</Label>
      <Label>
        Deeper results, equipment and cost insights are available with Pro.
      </Label>
      <Label muted>
        Purchases are unavailable in this development build. Your current plan
        is checked securely by PaddleLog.
      </Label>
    </Screen>
  );
}
