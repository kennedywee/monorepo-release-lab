import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Button, ScrollView, Text, TextInput, View } from "react-native";
import { ApiError } from "@release-lab/api";
import { api } from "../../src/api";
import { ErrorMessage, Loading } from "../../src/ui";

function CommentForm({ postId }: { postId: number }) {
  const queryClient = useQueryClient();
  const [body, setBody] = useState("");
  const mutation = useMutation({
    mutationFn: () => api.createComment(postId, { body }),
    onSuccess: async () => {
      setBody("");
      await queryClient.invalidateQueries({ queryKey: ["posts", postId, "comments"] });
    },
  });

  return (
    <View style={{ gap: 8, marginTop: 16 }}>
      <TextInput
        placeholder="Add a comment"
        value={body}
        onChangeText={setBody}
        multiline
        style={{ borderWidth: 1, borderColor: "#999", padding: 8, minHeight: 60 }}
      />
      {mutation.isError && (
        <Text style={{ color: "#b00020" }}>
          {mutation.error instanceof ApiError && mutation.error.fieldErrors.body
            ? `Comment ${mutation.error.fieldErrors.body.join(", ")}`
            : `Error: ${mutation.error.message}`}
        </Text>
      )}
      <Button
        title={mutation.isPending ? "Sending…" : "Post comment"}
        disabled={mutation.isPending}
        onPress={() => mutation.mutate()}
      />
    </View>
  );
}

export default function PostScreen() {
  const postId = Number(useLocalSearchParams<{ id: string }>().id);
  const post = useQuery(api.postQuery(postId));
  const comments = useQuery(api.commentsQuery(postId));

  if (post.isPending) return <Loading label="Loading post…" />;
  if (post.isError) return <ErrorMessage error={post.error} retry={() => post.refetch()} />;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 8 }}>
      <Stack.Screen options={{ title: post.data.title }} />
      <Text style={{ fontSize: 22, fontWeight: "bold" }}>{post.data.title}</Text>
      <Text>{post.data.body}</Text>

      <Text style={{ fontSize: 18, fontWeight: "bold", marginTop: 16 }}>Comments</Text>
      {comments.isPending && <Loading label="Loading comments…" />}
      {comments.isError && <ErrorMessage error={comments.error} retry={() => comments.refetch()} />}
      {comments.isSuccess && comments.data.length === 0 && <Text>No comments yet.</Text>}
      {comments.isSuccess &&
        comments.data.map((comment) => (
          <View key={comment.id} style={{ borderBottomWidth: 1, borderColor: "#eee", paddingVertical: 8 }}>
            <Text>{comment.body}</Text>
            <Text style={{ color: "#666" }}>{new Date(comment.created_at).toLocaleString()}</Text>
          </View>
        ))}

      <CommentForm postId={postId} />
    </ScrollView>
  );
}
