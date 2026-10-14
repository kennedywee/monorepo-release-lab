import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Screen name="index" options={{ title: "Release Lab" }} />
        <Stack.Screen name="posts/[id]" options={{ title: "Post" }} />
      </Stack>
    </QueryClientProvider>
  );
}
