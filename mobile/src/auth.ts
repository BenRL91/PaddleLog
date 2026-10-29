import { AppState } from "react-native";
import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import * as WebBrowser from "expo-web-browser";
import { createSecureAuthStorage } from "./native-store.js";
export const apiOrigin =
  process.env.EXPO_PUBLIC_API_ORIGIN || "https://paddlelog.leewaypb.com";
const url = process.env.EXPO_PUBLIC_SUPABASE_URL,
  key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
export const auth =
  url && key
    ? createClient(url, key, {
        auth: {
          storage: createSecureAuthStorage(SecureStore, Crypto.randomUUID),
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
          flowType: "pkce",
        },
      })
    : null;
export function watchRefresh() {
  if (!auth) return () => {};
  const apply = (state: string) => {
    if (state === "active") auth!.auth.startAutoRefresh();
    else auth!.auth.stopAutoRefresh();
  };
  apply(AppState.currentState);
  const sub = AppState.addEventListener("change", apply);
  return () => {
    sub.remove();
    auth!.auth.stopAutoRefresh();
  };
}
export async function signInProvider(provider: "google" | "apple") {
  if (!auth) throw Error("Configure the public sign-in settings first.");
  const callback = "paddlelog://auth/return";
  const { data, error } = await auth.auth.signInWithOAuth({
    provider,
    options: { redirectTo: callback, skipBrowserRedirect: true },
  });
  if (error) throw error;
  const result = await WebBrowser.openAuthSessionAsync(data.url, callback);
  if (result.type !== "success") return;
  const returned = new URL(result.url);
  if (
    returned.protocol !== "paddlelog:" ||
    returned.host !== "auth" ||
    returned.pathname !== "/return"
  )
    throw Error("Unexpected sign-in callback.");
  if (returned.searchParams.has("error"))
    throw Error("Sign-in was not completed.");
  const code = returned.searchParams.get("code");
  if (!code) throw Error("Sign-in did not return a code.");
  const exchanged = await auth.auth.exchangeCodeForSession(code);
  if (exchanged.error) throw exchanged.error;
}
