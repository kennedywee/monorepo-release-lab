import { useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { FlatList, Pressable, Text, View } from "react-native";
import { api } from "../src/api";
import { ErrorMessage, Loading } from "../src/ui";

export default function PostsScreen() {
  const posts = useQuery(api.postsQuery());

  if (posts.isPending) return <Loading label="Loading posts…" />;
  if (posts.isError) return <ErrorMessage error={posts.error} retry={() => posts.refetch()} />;

  return (
    <FlatList
      data={posts.data}
      keyExtractor={(post) => String(post.id)}
      refreshing={posts.isRefetching}
      onRefresh={() => posts.refetch()}
      ListEmptyComponent={<Text style={{ padding: 16 }}>No posts yet.</Text>}
      ListFooterComponent={<Text style={{ padding: 16, color: "#666" }}>API: {api.baseUrl}</Text>}
      renderItem={({ item: post }) => (
        <Link href={{ pathname: "/posts/[id]", params: { id: String(post.id) } }} asChild>
          <Pressable style={{ padding: 16, borderBottomWidth: 1, borderColor: "#ddd" }}>
            <Text style={{ fontSize: 18 }}>{post.title}</Text>
            <View>
              <Text style={{ color: "#666" }}>{new Date(post.created_at).toLocaleDateString()}</Text>
            </View>
          </Pressable>
        </Link>
      )}
    />
  );
}
