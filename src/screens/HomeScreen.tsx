import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Theme } from "../theme/theme";

/** Mobile landing page. For exact word-for-word parity, replace copy with the web homepage copy. */
export function HomeScreen({
  theme,
  isDark,
  onToggleTheme,
  onSignIn,
  onGetStarted,
}: {
  theme: Theme;
  isDark: boolean;
  onToggleTheme: () => void;
  onSignIn: () => void;
  onGetStarted: () => void;
}) {
  const features = [
    {
      icon: "lock-closed-outline" as const,
      title: "Private by design",
      body: "Keep your personal notes protected in your KeepSecret account.",
    },
    {
      icon: "book-outline" as const,
      title: "Notes and notebooks",
      body: "Keep quick notes separate or organize them into notebooks and chapters.",
    },
    {
      icon: "search-outline" as const,
      title: "Find things quickly",
      body: "Search note titles, note content, and notebook names in one place.",
    },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.bg }}
      contentContainerStyle={{ padding: 22, paddingBottom: 36 }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 38,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View
            style={{
              width: 42,
              height: 42,
              borderRadius: 14,
              backgroundColor: theme.brand,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="lock-closed" size={22} color="#fff" />
          </View>
          <Text style={{ color: theme.text, fontWeight: "900", fontSize: 20 }}>
            KeepSecret
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            isDark ? "Switch to light theme" : "Switch to dark theme"
          }
          onPress={onToggleTheme}
          hitSlop={10}
          style={{ padding: 10 }}
        >
          <Ionicons
            name={isDark ? "sunny-outline" : "moon-outline"}
            size={22}
            color={theme.text}
          />
        </Pressable>
      </View>

      <View style={{ paddingTop: 8, paddingBottom: 30 }}>
        <View
          style={{
            alignSelf: "flex-start",
            flexDirection: "row",
            alignItems: "center",
            gap: 7,
            borderRadius: 30,
            backgroundColor: theme.soft,
            paddingHorizontal: 12,
            paddingVertical: 8,
            marginBottom: 18,
          }}
        >
          <Ionicons
            name="shield-checkmark-outline"
            size={16}
            color={theme.brand}
          />
          <Text style={{ color: theme.brand, fontSize: 12, fontWeight: "800" }}>
            Your personal space
          </Text>
        </View>
        <Text
          style={{
            color: theme.text,
            fontSize: 37,
            lineHeight: 44,
            fontWeight: "900",
            letterSpacing: -1.1,
          }}
        >
          Your private notes, everywhere.
        </Text>
        <Text
          style={{
            color: theme.muted,
            fontSize: 15,
            lineHeight: 24,
            marginTop: 15,
          }}
        >
          Capture ideas, organize your thoughts, and keep the important things
          in one secure place with KeepSecret.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={onGetStarted}
          style={{
            minHeight: 52,
            borderRadius: 15,
            backgroundColor: theme.brand,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 9,
            marginTop: 25,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "900", fontSize: 15 }}>
            Get started
          </Text>
          <Ionicons name="arrow-forward" size={19} color="#fff" />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={onSignIn}
          style={{
            minHeight: 50,
            borderRadius: 15,
            borderWidth: 1,
            borderColor: theme.border,
            backgroundColor: theme.card,
            alignItems: "center",
            justifyContent: "center",
            marginTop: 10,
          }}
        >
          <Text style={{ color: theme.text, fontWeight: "800" }}>
            I already have an account
          </Text>
        </Pressable>
      </View>

      <Text
        style={{
          color: theme.text,
          fontSize: 22,
          fontWeight: "900",
          marginBottom: 14,
        }}
      >
        Everything you need to stay organized
      </Text>
      {features.map((feature) => (
        <View
          key={feature.title}
          style={{
            flexDirection: "row",
            gap: 14,
            padding: 16,
            borderRadius: 17,
            borderWidth: 1,
            borderColor: theme.border,
            backgroundColor: theme.card,
            marginBottom: 11,
          }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              backgroundColor: theme.soft,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name={feature.icon} size={22} color={theme.brand} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{ color: theme.text, fontSize: 15, fontWeight: "900" }}
            >
              {feature.title}
            </Text>
            <Text
              style={{
                color: theme.muted,
                fontSize: 13,
                lineHeight: 20,
                marginTop: 5,
              }}
            >
              {feature.body}
            </Text>
          </View>
        </View>
      ))}
      <Text
        style={{
          color: theme.muted,
          textAlign: "center",
          fontSize: 11,
          marginTop: 16,
        }}
      >
        Keep your thoughts together with KeepSecret.
      </Text>
    </ScrollView>
  );
}
