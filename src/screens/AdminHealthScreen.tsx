import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { HealthReport } from "../api/dataService";
import type { Theme } from "../theme/theme";

const countLabels: Record<string, string> = {
  totalUsers: "Total users",
  newUsersToday: "New users today",
  newUsersLast7Days: "New users (7 days)",
  activeNotes: "Active notes",
  trashedNotes: "Trashed notes",
  activeNotebooks: "Active notebooks",
  trashedNotebooks: "Trashed notebooks",
  auditEventsLast7Days: "Audit events (7 days)",
};

export function AdminHealthScreen({
  theme,
  report,
  loading,
  error,
  onRefresh,
}: {
  theme: Theme;
  report: HealthReport | null;
  loading: boolean;
  error: string;
  onRefresh: () => void;
}) {
  const metricCards = [
    { label: "Requests (24h)", value: report?.api.totalRequests ?? 0 },
    {
      label: "Avg response",
      value: `${report?.api.averageResponseTimeMs ?? 0} ms`,
    },
    { label: "Error requests", value: report?.api.errorRequests ?? 0 },
    { label: "Error rate", value: `${report?.api.errorRatePercent ?? 0}%` },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 28, gap: 12 }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: theme.muted,
              fontSize: 11,
              fontWeight: "900",
              letterSpacing: 1.3,
            }}
          >
            ADMINISTRATION
          </Text>
          <Text
            style={{
              color: theme.text,
              fontSize: 26,
              fontWeight: "900",
              marginTop: 4,
            }}
          >
            Application Health
          </Text>
          <Text style={{ color: theme.muted, fontSize: 12, marginTop: 4 }}>
            Server metrics and workspace counts
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Refresh health report"
          onPress={onRefresh}
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: theme.border,
            backgroundColor: theme.card,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="refresh-outline" size={21} color={theme.brand} />
        </Pressable>
      </View>

      {loading && !report ? (
        <View style={{ padding: 24, alignItems: "center" }}>
          <ActivityIndicator color={theme.brand} size="large" />
          <Text style={{ color: theme.muted, marginTop: 10 }}>
            Loading health report…
          </Text>
        </View>
      ) : null}

      {!!error && (
        <View
          style={{
            padding: 14,
            borderWidth: 1,
            borderColor: theme.danger,
            borderRadius: 14,
            backgroundColor: theme.card,
          }}
        >
          <Text style={{ color: theme.danger, fontWeight: "800" }}>
            Could not load Application Health
          </Text>
          <Text style={{ color: theme.text, marginTop: 5, lineHeight: 20 }}>
            {error}
          </Text>
        </View>
      )}

      {report ? (
        <>
          <Text
            style={{
              color: theme.text,
              fontSize: 16,
              fontWeight: "900",
              marginTop: 5,
            }}
          >
            API performance (24 hours)
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {metricCards.map((metric) => (
              <View
                key={metric.label}
                style={{
                  width: "48%",
                  flexGrow: 1,
                  minWidth: 135,
                  padding: 15,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: theme.border,
                  backgroundColor: theme.card,
                }}
              >
                <Text style={{ color: theme.muted, fontSize: 12 }}>
                  {metric.label}
                </Text>
                <Text
                  style={{
                    color: theme.text,
                    fontSize: 22,
                    fontWeight: "900",
                    marginTop: 7,
                  }}
                >
                  {metric.value}
                </Text>
              </View>
            ))}
          </View>

          <Text
            style={{
              color: theme.text,
              fontSize: 16,
              fontWeight: "900",
              marginTop: 8,
            }}
          >
            Workspace counts
          </Text>
          <View
            style={{
              borderWidth: 1,
              borderColor: theme.border,
              backgroundColor: theme.card,
              borderRadius: 16,
              paddingHorizontal: 15,
            }}
          >
            {Object.entries(report.counts).map(([key, value], index, all) => (
              <View
                key={key}
                style={{
                  minHeight: 48,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  borderBottomWidth: index === all.length - 1 ? 0 : 1,
                  borderBottomColor: theme.border,
                }}
              >
                <Text style={{ color: theme.muted, flex: 1, fontSize: 13 }}>
                  {countLabels[key] ?? key}
                </Text>
                <Text
                  style={{ color: theme.text, fontSize: 15, fontWeight: "900" }}
                >
                  {value}
                </Text>
              </View>
            ))}
          </View>

          <Text
            style={{
              color: theme.text,
              fontSize: 16,
              fontWeight: "900",
              marginTop: 8,
            }}
          >
            Top API endpoints
          </Text>
          {report.api.endpoints.length ? (
            report.api.endpoints.map((endpoint) => (
              <View
                key={endpoint.endpoint}
                style={{
                  padding: 14,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: theme.border,
                  backgroundColor: theme.card,
                  gap: 6,
                }}
              >
                <Text style={{ color: theme.text, fontWeight: "800" }}>
                  {endpoint.endpoint}
                </Text>
                <Text style={{ color: theme.muted, fontSize: 12 }}>
                  {endpoint.requests} requests ·{" "}
                  {endpoint.averageResponseTimeMs} ms average ·{" "}
                  {endpoint.errors} errors
                </Text>
              </View>
            ))
          ) : (
            <Text style={{ color: theme.muted, fontSize: 13 }}>
              No endpoint samples available yet.
            </Text>
          )}
          <Text style={{ color: theme.muted, fontSize: 11, marginTop: 4 }}>
            Updated: {new Date(report.generatedAt).toLocaleString()}
          </Text>
        </>
      ) : null}

      {loading && report ? (
        <Text style={{ color: theme.muted, textAlign: "center" }}>
          Refreshing…
        </Text>
      ) : null}
    </ScrollView>
  );
}
