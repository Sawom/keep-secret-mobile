import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Theme } from "../theme/theme";
import type { User } from "../types";

export function ProfileScreen({
  theme,
  user,
  isDark,
  onToggleTheme,
  onLogout,
}: {
  theme: Theme;
  user: User;
  isDark: boolean;
  onToggleTheme: () => void;
  onLogout: () => void;
}) {
  const displayName =
    user.fullName || user.name || user.email.split("@")[0] || "KeepSecret user";
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 18,
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
        }}
      >
        <Text
          style={{
            color: theme.muted,
            fontSize: 11,
            fontWeight: "900",
            letterSpacing: 1.5,
          }}
        >
          ACCOUNT
        </Text>
        <Text
          style={{
            color: theme.text,
            fontSize: 27,
            fontWeight: "900",
            marginTop: 5,
          }}
        >
          Profile
        </Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 17, gap: 12 }}>
        <View
          style={{
            padding: 18,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: theme.border,
            backgroundColor: theme.card,
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: 70,
              height: 70,
              borderRadius: 25,
              backgroundColor: theme.brand,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "#fff", fontSize: 28, fontWeight: "900" }}>
              {displayName.slice(0, 1).toUpperCase()}
            </Text>
          </View>
          <Text
            style={{
              color: theme.text,
              fontSize: 19,
              fontWeight: "900",
              marginTop: 13,
              textAlign: "center",
            }}
          >
            {displayName}
          </Text>
          <Text
            style={{
              color: theme.muted,
              fontSize: 13,
              marginTop: 5,
              textAlign: "center",
            }}
          >
            {user.email}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={onToggleTheme}
          style={{
            minHeight: 62,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: theme.border,
            backgroundColor: theme.card,
            paddingHorizontal: 16,
            flexDirection: "row",
            alignItems: "center",
            gap: 13,
          }}
        >
          <Ionicons
            name={isDark ? "sunny-outline" : "moon-outline"}
            size={23}
            color={theme.brand}
          />
          <View style={{ flex: 1 }}>
            <Text
              style={{ color: theme.text, fontWeight: "800", fontSize: 14 }}
            >
              Appearance
            </Text>
            <Text style={{ color: theme.muted, fontSize: 12, marginTop: 3 }}>
              {isDark ? "Dark mode is on" : "Light mode is on"}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.muted} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={onLogout}
          style={{
            minHeight: 58,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: theme.danger,
            backgroundColor: theme.card,
            paddingHorizontal: 16,
            flexDirection: "row",
            alignItems: "center",
            gap: 13,
          }}
        >
          <Ionicons name="log-out-outline" size={23} color={theme.danger} />
          <Text
            style={{
              color: theme.danger,
              fontWeight: "900",
              fontSize: 14,
              flex: 1,
            }}
          >
            Log out
          </Text>
          <Ionicons name="chevron-forward" size={18} color={theme.danger} />
        </Pressable>
      </ScrollView>
    </View>
  );
}
