import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Alert,
  Linking,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import Ionicons from "@expo/vector-icons/Ionicons";
import type { Session as AuthSession } from "@supabase/supabase-js";
import { auth, signInProvider, watchRefresh } from "./auth";
import { LibraryProvider, useLibrary } from "./LibraryProvider";
import {
  ThemeProvider,
  useTheme,
  Button,
  Card,
  Field,
  Label,
  Screen,
  Sheet,
} from "./ui";
import { ErrorNotice, ProGate } from "./components";
import { Home } from "./Home";
import { Paddles, PaddleDetails, PaddleEditor } from "./Paddles";
import { Play, SessionEditor, SessionTimer, Results } from "./Play";
import { Costs, ExpenseEditor } from "./Costs";
import type { Paddle, Session } from "./types";
export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthRoot />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
function AuthRoot() {
  const [session, setSession] = useState<AuthSession | null>(null),
    [loaded, setLoaded] = useState(false),
    [error, setError] = useState("");
  const t = useTheme();
  useEffect(() => {
    if (!auth) {
      setLoaded(true);
      return;
    }
    const stop = watchRefresh();
    const { data } = auth.auth.onAuthStateChange((_, value) => {
      setSession(value);
      setLoaded(true);
    });
    void auth.auth
      .getSession()
      .then((r) => {
        if (r.error) setError(r.error.message);
        setSession(r.data.session);
        setLoaded(true);
      })
      .catch((e) => {
        setError(e.message);
        setLoaded(true);
      });
    return () => {
      stop();
      data.subscription.unsubscribe();
    };
  }, []);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <StatusBar style={t.bg === "#111111" ? "light" : "dark"} />
      {!loaded ? (
        <ActivityIndicator color={t.gold} />
      ) : session ? (
        <LibraryProvider key={session.user.id} userId={session.user.id}>
          <Workspace />
        </LibraryProvider>
      ) : (
        <SignIn initialError={error} />
      )}
    </SafeAreaView>
  );
}
function SignIn({ initialError }: { initialError: string }) {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(initialError);
  async function run(task: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    try {
      await task();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Screen>
      <View style={{ height: 50 }} />
      <Label big>PaddleLog</Label>
      <Label muted>TRACK · LOG · IMPROVE</Label>
      <Label>Sign in with your existing LeewayPB account.</Label>
      {!auth ? (
        <Card>
          <Label>Development configuration needed</Label>
          <Label muted>
            Copy mobile/.env.example to mobile/.env and set the public
            authentication values before starting Metro.
          </Label>
        </Card>
      ) : (
        <>
          <Field label="Email" value={email} onChange={setEmail} />
          <Field
            label="Password"
            value={password}
            onChange={setPassword}
            secure
          />
          <Button
            title={busy ? "Signing in…" : "Sign in"}
            primary
            disabled={busy || !email || !password}
            onPress={() =>
              void run(async () => {
                const r = await auth!.auth.signInWithPassword({
                  email: email.trim(),
                  password,
                });
                if (r.error) throw r.error;
              })
            }
          />
          <Button
            title="Continue with Apple"
            disabled={busy}
            onPress={() => void run(() => signInProvider("apple"))}
          />
          <Button
            title="Continue with Google"
            disabled={busy}
            onPress={() => void run(() => signInProvider("google"))}
          />
        </>
      )}
      {error && <Label>{error}</Label>}
      <Button
        title="Manage your LeewayPB account"
        onPress={() =>
          void Linking.openURL("https://paddlelog.leewaypb.com/leeway-account")
        }
      />
    </Screen>
  );
}
type ModalState =
  | { kind: "paddle"; paddle?: Paddle }
  | { kind: "details"; paddle: Paddle }
  | { kind: "session"; session?: Session; paddle?: Paddle }
  | { kind: "timer" }
  | { kind: "expense" }
  | { kind: "insights"; paddle?: Paddle }
  | null;
function Workspace() {
  const { snapshot, busy, timer, setTimer, id, reload, pending } = useLibrary();
  const [tab, setTab] = useState("Home"),
    [modal, setModal] = useState<ModalState>(null);
  const t = useTheme();
  async function start(paddleId: string) {
    try {
      if (!timer) {
        const at = new Date().toISOString(),
          timerId = id();
        await setTimer({
          id: timerId,
          paddleId,
          start: at,
          segments: [{ id: id(), paddleId, start: at }],
        });
      }
      setModal({ kind: "timer" });
    } catch (e) {
      Alert.alert("Timer not started", (e as Error).message);
    }
  }
  if (!snapshot)
    return (
      <>
        <ErrorNotice />
        <ActivityIndicator color={t.gold} />
      </>
    );
  return (
    <>
      <View
        style={{
          paddingHorizontal: 18,
          paddingVertical: 12,
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Image
          source={require("../assets/icon.png")}
          accessibilityLabel="PaddleLog"
          style={{ width: 42, height: 42 }}
        />
        <Text style={{ fontWeight: "800", fontSize: 28, color: t.text }}>
          Paddle<Text style={{ color: t.gold }}>Log</Text>
        </Text>
        {busy && <ActivityIndicator color={t.gold} />}
      </View>
      <ErrorNotice />
      <View style={{ flex: 1 }}>
        {tab === "Home" ? (
          <Home
            onStart={(p) => void start(p)}
            onAdd={(p) => setModal({ kind: "session", paddle: p })}
            onDetails={(p) => setModal({ kind: "details", paddle: p })}
            onEdit={(p) => setModal({ kind: "paddle", paddle: p })}
            onInsights={(p) => setModal({ kind: "insights", paddle: p })}
          />
        ) : tab === "Paddles" ? (
          <Paddles
            onOpen={(p) => setModal({ kind: "details", paddle: p })}
            onAdd={() => setModal({ kind: "paddle" })}
          />
        ) : tab === "Play" ? (
          <Play
            onAdd={() => setModal({ kind: "session" })}
            onEdit={(s) => setModal({ kind: "session", session: s })}
          />
        ) : tab === "Costs" ? (
          <Costs onAdd={() => setModal({ kind: "expense" })} />
        ) : (
          <Settings />
        )}
      </View>
      <View
        style={{
          flexDirection: "row",
          borderTopWidth: 1,
          borderColor: t.border,
          paddingTop: 8,
          paddingBottom: 4,
        }}
      >
        {(
          [
            { name: "Home", icon: "home-outline" },
            { name: "Paddles", icon: "albums-outline" },
            { name: "Play", icon: "play-circle-outline" },
            { name: "Costs", icon: "wallet-outline" },
            { name: "Settings", icon: "settings-outline" },
          ] as const
        ).map((item) => (
          <Pressable
            key={item.name}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === item.name }}
            onPress={() => setTab(item.name)}
            style={{
              flex: 1,
              alignItems: "center",
              paddingVertical: 10,
              gap: 4,
              borderBottomWidth: 3,
              borderColor: tab === item.name ? t.gold : "transparent",
            }}
          >
            <Ionicons
              name={item.icon}
              size={23}
              color={tab === item.name ? t.gold : t.secondary}
            />
            <Text
              style={{
                color: tab === item.name ? t.gold : t.secondary,
                fontSize: 12,
              }}
            >
              {item.name}
            </Text>
          </Pressable>
        ))}
      </View>
      {modal?.kind === "paddle" && (
        <PaddleEditor paddle={modal.paddle} onClose={() => setModal(null)} />
      )}{" "}
      {modal?.kind === "details" && (
        <PaddleDetails
          paddle={modal.paddle}
          onClose={() => setModal(null)}
          onEdit={() => setModal({ kind: "paddle", paddle: modal.paddle })}
        />
      )}{" "}
      {modal?.kind === "session" && (
        <SessionEditor
          session={modal.session}
          paddle={modal.paddle}
          onClose={() => setModal(null)}
        />
      )}{" "}
      {modal?.kind === "timer" && (
        <SessionTimer onClose={() => setModal(null)} />
      )}{" "}
      {modal?.kind === "expense" && (
        <ExpenseEditor onClose={() => setModal(null)} />
      )}{" "}
      {modal?.kind === "insights" && (
        <Sheet title="Results insights" onClose={() => setModal(null)}>
          <ProGate>
            <Results paddleId={modal.paddle?.id} />
          </ProGate>
        </Sheet>
      )}
    </>
  );
}
function Settings() {
  const { snapshot, entitlements, reload } = useLibrary();
  return (
    <Screen>
      <Label big>Settings</Label>
      <Card>
        <Label>{entitlements?.pro ? "PaddleLog Pro" : "PaddleLog Free"}</Label>
        <Label muted>
          {entitlements?.freePaddles ?? 5} paddles included in Free, including
          archived paddles.
        </Label>
      </Card>
      <Button title="Refresh library & plan" onPress={() => void reload()} />
      <Button
        title="Open Pickle Point"
        onPress={() => void Linking.openURL("https://picklepoint.leewaypb.com")}
      />
      <Button
        title="Backup, file import & advanced tools on web"
        onPress={() => void Linking.openURL("https://paddlelog.leewaypb.com")}
      />
      <Label muted>
        Pickle Point sync uses your existing account and physical paddle IDs.
        Native purchases, Watch workouts and push notifications are not enabled
        in this build.
      </Label>
      <Button
        title="Sign out"
        danger
        onPress={() =>
          Alert.alert(
            "Sign out?",
            "Device drafts and timers stay scoped to this account.",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Sign out",
                onPress: () =>
                  void auth!.auth.signOut({ scope: "local" }).then((r) => {
                    if (r.error)
                      Alert.alert("Sign out failed", r.error.message);
                  }),
              },
            ],
          )
        }
      />
    </Screen>
  );
}
