import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Theme } from "../theme/theme";

/** Mobile landing page updated to match the Web Homepage design and copy exactly. */
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
      icon: "eye-off-outline" as const,
      title: "Zero-Knowledge Core",
      body: "Data is locked on your browser before hitting our servers. We store ciphertexts, never plaintext.",
      borderColor: "rgba(99, 102, 241, 0.4)",
    },
    {
      icon: "layers-outline" as const,
      title: "Notebooks & Chapters",
      body: "Organize complex thoughts, project ideas, or journals into custom color-coded notebooks seamlessly.",
      borderColor: "rgba(139, 92, 246, 0.4)",
    },
    {
      icon: "hardware-chip-outline" as const,
      title: "Smart Trash Lifecycle",
      body: "Accidental deletions are safe with soft-delete trash bins, paired with automated cron purging.",
      borderColor: "rgba(236, 72, 153, 0.4)",
    },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.bg }}
      contentContainerStyle={{ padding: 22, paddingBottom: 48 }}
    >
      {/* Navbar */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 32,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: theme.brand,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="key-outline" size={20} color="#fff" />
          </View>
          <Text
            style={{
              color: theme.text,
              fontWeight: "800",
              fontSize: 20,
              letterSpacing: -0.5,
            }}
          >
            Keep<Text style={{ color: theme.brand }}>Secret</Text>
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            isDark ? "Switch to light theme" : "Switch to dark theme"
          }
          onPress={onToggleTheme}
          hitSlop={10}
          style={{
            padding: 8,
            borderRadius: 10,
            backgroundColor: theme.card,
            borderWidth: 1,
            borderColor: theme.border,
          }}
        >
          <Ionicons
            name={isDark ? "sunny-outline" : "moon-outline"}
            size={20}
            color={theme.text}
          />
        </Pressable>
      </View>

      {/* Hero Section */}
      <View style={{ paddingTop: 10, paddingBottom: 24, alignItems: "center" }}>
        {/* Badge */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            borderRadius: 30,
            backgroundColor: theme.soft,
            borderWidth: 1,
            borderColor: theme.border,
            paddingHorizontal: 14,
            paddingVertical: 7,
            marginBottom: 20,
          }}
        >
          <Ionicons name="sparkles" size={14} color={theme.brand} />
          <Text style={{ color: theme.brand, fontSize: 12, fontWeight: "700" }}>
            Database-Level Encryption
          </Text>
        </View>

        {/* Main Title */}
        <Text
          style={{
            color: theme.text,
            fontSize: 32,
            lineHeight: 38,
            fontWeight: "900",
            textAlign: "center",
            letterSpacing: -0.8,
          }}
        >
          Where your personal notes stay{"\n"}
          <Text style={{ color: theme.brand }}>truly confidential.</Text>
        </Text>

        {/* Subtitle */}
        <Text
          style={{
            color: theme.muted,
            fontSize: 15,
            lineHeight: 22,
            textAlign: "center",
            marginTop: 16,
            paddingHorizontal: 10,
          }}
        >
          Not even database administrators can read your thoughts. Pure privacy,
          encrypted client-side, stored securely.
        </Text>

        {/* Action Buttons */}
        <View style={{ width: "100%", marginTop: 28, gap: 12 }}>
          <Pressable
            accessibilityRole="button"
            onPress={onGetStarted}
            style={{
              minHeight: 52,
              borderRadius: 16,
              backgroundColor: theme.brand,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              shadowColor: theme.brand,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "800", fontSize: 15 }}>
              Create Encrypted Vault
            </Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={onSignIn}
            style={{
              minHeight: 52,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: theme.border,
              backgroundColor: theme.card,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{ color: theme.text, fontWeight: "700", fontSize: 15 }}
            >
              Access Vault
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Interactive Note App Simulation Box (Mobile Mock) */}
      <View
        style={{
          marginVertical: 24,
          borderRadius: 20,
          backgroundColor: "#0f172a",
          borderWidth: 1,
          borderColor: "#1e293b",
          padding: 16,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: "#ef4444",
              }}
            />
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: "#eab308",
              }}
            />
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: "#22c55e",
              }}
            />
          </View>
          <Text
            style={{ color: "#64748b", fontSize: 11, fontFamily: "monospace" }}
          >
            keepsecret/notes
          </Text>
        </View>

        <View
          style={{
            backgroundColor: "#020617",
            padding: 12,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "#1e293b",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <Text style={{ color: "#f8fafc", fontSize: 13, fontWeight: "700" }}>
              🔒 Secret Meeting Notes
            </Text>
            <View
              style={{
                backgroundColor: "rgba(16, 185, 129, 0.1)",
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 6,
              }}
            >
              <Text
                style={{ color: "#34d399", fontSize: 9, fontWeight: "600" }}
              >
                Encrypted
              </Text>
            </View>
          </View>
          <Text
            style={{
              color: "#94a3b8",
              fontSize: 12,
              fontFamily: "monospace",
              lineHeight: 18,
            }}
          >
            Project KeepSecret: Zero-knowledge architecture implementation in
            progress...
          </Text>
        </View>
      </View>

      {/* Feature Section Header */}
      <View style={{ marginTop: 20, marginBottom: 20, alignItems: "center" }}>
        <Text
          style={{
            color: theme.text,
            fontSize: 24,
            fontWeight: "900",
            textAlign: "center",
            letterSpacing: -0.5,
          }}
        >
          Built like a fortress
        </Text>
        <Text
          style={{
            color: theme.muted,
            fontSize: 13,
            textAlign: "center",
            marginTop: 4,
          }}
        >
          Designed for developers, writers, and privacy maximalists.
        </Text>
      </View>

      {/* Feature Cards Grid */}
      {features.map((feature) => (
        <View
          key={feature.title}
          style={{
            padding: 18,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: theme.border,
            backgroundColor: theme.card,
            marginBottom: 14,
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
              marginBottom: 14,
            }}
          >
            <Ionicons name={feature.icon} size={22} color={theme.brand} />
          </View>
          <Text
            style={{
              color: theme.text,
              fontSize: 16,
              fontWeight: "800",
              marginBottom: 6,
            }}
          >
            {feature.title}
          </Text>
          <Text
            style={{
              color: theme.muted,
              fontSize: 13,
              lineHeight: 20,
            }}
          >
            {feature.body}
          </Text>
        </View>
      ))}

      {/* Footer */}
      <Text
        style={{
          color: theme.muted,
          textAlign: "center",
          fontSize: 11,
          marginTop: 24,
        }}
      >
        © {new Date().getFullYear()} KeepSecret. All rights reserved.
      </Text>
    </ScrollView>
  );
}
