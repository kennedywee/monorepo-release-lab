import { ActivityIndicator, Button, Text, View } from "react-native";

export function Loading({ label }: { label: string }) {
  return (
    <View style={{ padding: 16, flexDirection: "row", gap: 8 }}>
      <ActivityIndicator />
      <Text>{label}</Text>
    </View>
  );
}

export function ErrorMessage({ error, retry }: { error: Error; retry?: () => void }) {
  return (
    <View style={{ padding: 16, gap: 8 }}>
      <Text style={{ color: "#b00020" }}>Error: {error.message}</Text>
      {retry && <Button title="Retry" onPress={retry} />}
    </View>
  );
}
