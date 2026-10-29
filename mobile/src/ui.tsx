import React, { createContext, useContext } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
export const dark = {
  bg: "#111111",
  card: "#202020",
  inset: "#171717",
  border: "#454545",
  text: "#F4F4F0",
  secondary: "#C6C6C3",
  red: "#B51F2D",
  gold: "#D2B779",
  danger: "#FF8888",
  success: "#91DCB2",
};
export const light = {
  bg: "#F4F4F0",
  card: "#FFFFFF",
  inset: "#E7E7E1",
  border: "#C6C6C2",
  text: "#111111",
  secondary: "#555555",
  red: "#B51F2D",
  gold: "#8C5C16",
  danger: "#A51925",
  success: "#17653D",
};
const Theme = createContext(dark);
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <Theme.Provider value={useColorScheme() === "light" ? light : dark}>
      {children}
    </Theme.Provider>
  );
}
export const useTheme = () => useContext(Theme);
export function Label({
  children,
  muted = false,
  big = false,
}: {
  children: React.ReactNode;
  muted?: boolean;
  big?: boolean;
}) {
  const t = useTheme();
  return (
    <Text
      style={{
        color: muted ? t.secondary : t.text,
        fontSize: big ? 24 : 16,
        fontWeight: big ? "700" : "400",
        lineHeight: big ? 31 : 23,
      }}
    >
      {children}
    </Text>
  );
}
export function Button({
  title,
  onPress,
  primary = false,
  danger = false,
  disabled = false,
  small = false,
}: {
  title: string;
  onPress: () => void;
  primary?: boolean;
  danger?: boolean;
  disabled?: boolean;
  small?: boolean;
}) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 44,
        paddingVertical: small ? 9 : 13,
        paddingHorizontal: 16,
        backgroundColor: primary ? t.red : t.inset,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: primary ? t.red : t.border,
        alignItems: "center",
        justifyContent: "center",
        opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
      })}
    >
      <Text
        style={{
          color: primary ? "white" : danger ? t.danger : t.text,
          fontSize: 16,
          fontWeight: "600",
          textAlign: "center",
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
export function Card({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  return (
    <View
      style={{
        padding: 16,
        backgroundColor: t.card,
        borderWidth: 1,
        borderColor: t.border,
        borderRadius: 20,
        gap: 12,
      }}
    >
      {children}
    </View>
  );
}
export function Field({
  label,
  value,
  onChange,
  numeric = false,
  multiline = false,
  secure = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  numeric?: boolean;
  multiline?: boolean;
  secure?: boolean;
}) {
  const t = useTheme();
  return (
    <View style={{ gap: 6 }}>
      <Label muted>{label}</Label>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChange}
        secureTextEntry={secure}
        keyboardType={numeric ? "decimal-pad" : "default"}
        autoCapitalize={secure ? "none" : "sentences"}
        multiline={multiline}
        style={{
          color: t.text,
          borderColor: t.border,
          borderWidth: 1,
          borderRadius: 12,
          padding: 13,
          minHeight: 48,
          backgroundColor: t.inset,
          fontSize: 16,
          textAlignVertical: "top",
        }}
      />
    </View>
  );
}
export function Row({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 10,
      }}
    >
      {children}
    </View>
  );
}
export function Screen({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ padding: 18, gap: 18, paddingBottom: 30 }}
    >
      {children}
    </ScrollView>
  );
}
export function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const t = useTheme();
  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View
            style={{
              padding: 18,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            }}
          >
            <View style={{ flex: 1 }}>
              <Label big>{title}</Label>
            </View>
            <Button title="Close" onPress={onClose} small />
          </View>
          {children}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
export function Chips({
  items,
  value,
  onChange,
}: {
  items: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  const t = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
    >
      {items.map((i) => (
        <Pressable
          key={i.id}
          accessibilityRole="tab"
          accessibilityState={{ selected: value === i.id }}
          onPress={() => onChange(i.id)}
          style={{
            paddingHorizontal: 14,
            paddingVertical: 12,
            minHeight: 44,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: value === i.id ? t.gold : t.border,
            backgroundColor: t.inset,
          }}
        >
          <Text
            style={{
              color: value === i.id ? t.gold : t.text,
              fontSize: 16,
              fontWeight: "600",
            }}
          >
            {i.label}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
export const styles = StyleSheet.create({
  gap: { gap: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  flex: { flex: 1 },
});
