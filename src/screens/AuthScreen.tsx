import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Button, Field } from "../components/Controls";
import type { Theme } from "../theme/theme";
export type AuthMode = "login" | "register" | "forgot" | "reset";
export type AuthValues = {
  email: string;
  name: string;
  password: string;
  confirm: string;
  resetToken: string;
};
export function AuthScreen({
  theme,
  mode,
  setMode,
  values,
  setValues,
  onSubmit,
  busy,
  message,
  onGoogle,
}: {
  theme: Theme;
  mode: AuthMode;
  setMode: (m: AuthMode) => void;
  values: AuthValues;
  setValues: (v: AuthValues) => void;
  onSubmit: () => void;
  busy: boolean;
  message: string;
  onGoogle: () => void;
}) {
  const update = (key: keyof AuthValues, value: string) =>
    setValues({ ...values, [key]: value });
  const title =
    mode === "login"
      ? "Your private notes, everywhere."
      : mode === "register"
        ? "Create your secure workspace."
        : mode === "forgot"
          ? "Recover access to your account."
          : "Choose a new password.";
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          paddingHorizontal: 25,
          paddingVertical: 30,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={{
            alignSelf: "center",
            width: 60,
            height: 60,
            borderRadius: 20,
            backgroundColor: theme.brand,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 15,
            elevation: 5,
          }}
        >
          <Text style={{ fontSize: 32, fontWeight: "900", color: "#fff" }}>
            K
          </Text>
        </View>
        <Text
          style={{
            fontSize: 30,
            fontWeight: "900",
            letterSpacing: -0.8,
            textAlign: "center",
            color: theme.text,
          }}
        >
          KeepSecret
        </Text>
        <Text
          style={{
            fontSize: 13,
            lineHeight: 20,
            textAlign: "center",
            color: theme.muted,
            marginTop: 7,
            marginBottom: 15,
          }}
        >
          {title}
        </Text>
        {mode === "register" && (
          <Field
            label="Full name"
            value={values.name}
            onChangeText={(v) => update("name", v)}
            theme={theme}
            autoCapitalize="words"
          />
        )}
        {mode !== "reset" && (
          <Field
            label="Email"
            value={values.email}
            onChangeText={(v) => update("email", v)}
            theme={theme}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
        )}
        {mode === "reset" && (
          <Field
            label="Reset token"
            value={values.resetToken}
            onChangeText={(v) => update("resetToken", v)}
            theme={theme}
            autoCapitalize="none"
          />
        )}
        {(["login", "register", "reset"] as AuthMode[]).includes(mode) && (
          <Field
            label={mode === "reset" ? "New password" : "Password"}
            value={values.password}
            onChangeText={(v) => update("password", v)}
            theme={theme}
            secureTextEntry
            autoCapitalize="none"
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
          />
        )}
        {mode === "register" && (
          <Field
            label="Confirm password"
            value={values.confirm}
            onChangeText={(v) => update("confirm", v)}
            theme={theme}
            secureTextEntry
            autoCapitalize="none"
          />
        )}
        {!!message && (
          <Text
            accessibilityRole="alert"
            style={{
              fontSize: 13,
              lineHeight: 19,
              color: theme.text,
              marginTop: 12,
            }}
          >
            {message}
          </Text>
        )}
        <Button
          title={
            mode === "login"
              ? "Sign in"
              : mode === "register"
                ? "Create account"
                : mode === "forgot"
                  ? "Send reset email"
                  : "Reset password"
          }
          onPress={onSubmit}
          theme={theme}
          loading={busy}
        />
        {mode === "login" && (
          <>
            <Button
              title="Continue with Google"
              onPress={onGoogle}
              theme={theme}
              secondary
            />
            <Text
              style={{
                fontSize: 11,
                lineHeight: 17,
                color: theme.muted,
                textAlign: "center",
                marginTop: 9,
              }}
            >
              Secure Google sign-in verifies the Google ID token on KeepSecret's
              backend.
            </Text>
            <Text
              onPress={() => setMode("forgot")}
              style={{
                textAlign: "center",
                color: theme.brand,
                fontWeight: "700",
                marginTop: 17,
              }}
            >
              Forgot password?
            </Text>
            <Text
              onPress={() => setMode("register")}
              style={{ textAlign: "center", color: theme.muted, marginTop: 15 }}
            >
              New to KeepSecret?{" "}
              <Text style={{ color: theme.brand, fontWeight: "800" }}>
                Create account
              </Text>
            </Text>
          </>
        )}
        {mode === "register" && (
          <Text
            onPress={() => setMode("login")}
            style={{
              textAlign: "center",
              color: theme.brand,
              fontWeight: "800",
              marginTop: 18,
            }}
          >
            Already have an account? Sign in
          </Text>
        )}
        {mode === "forgot" && (
          <Text
            onPress={() => setMode("login")}
            style={{
              textAlign: "center",
              color: theme.brand,
              fontWeight: "800",
              marginTop: 18,
            }}
          >
            Back to sign in
          </Text>
        )}
        {mode === "reset" && (
          <Text
            onPress={() => setMode("login")}
            style={{
              textAlign: "center",
              color: theme.brand,
              fontWeight: "800",
              marginTop: 18,
            }}
          >
            Back to sign in
          </Text>
        )}
        <Text
          style={{
            fontSize: 11,
            lineHeight: 17,
            color: theme.muted,
            textAlign: "center",
            marginTop: 25,
          }}
        >
          Your authentication tokens are never stored in AsyncStorage. Offline
          notes are encrypted locally.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
