import { Link, Outlet, createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ApiError } from "@release-lab/api";
import { api } from "./api";

function Layout() {
  return (
    <>
      <header>
        <strong>Release Lab Blog</strong> · <Link to="/">All posts</Link>
      </header>
      <hr />
      <Outlet />
    </>
  );
}

function ErrorMessage({ error, retry }: { error: Error; retry?: () => void }) {
  return (
    <p role="alert">
      Error: {error.message} {retry && <button onClick={retry}>Retry</button>}
    </p>
  );
}

function PostsPage() {
  const posts = useQuery(api.postsQuery());

  if (posts.isPending) return <p>Loading posts…</p>;
  if (posts.isError) return <ErrorMessage error={posts.error} retry={() => posts.refetch()} />;
  if (posts.data.length === 0) return <p>No posts yet.</p>;

  return (
    <>
      {posts.data.map((post) => (
        <article key={post.id}>
          <h2>
            <Link to="/posts/$postId" params={{ postId: String(post.id) }}>
              {post.title}
            </Link>
          </h2>
          <small>{new Date(post.created_at).toLocaleDateString()}</small>
        </article>
      ))}
    </>
  );
}

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
    <form
      onSubmit={(event) => {
        event.preventDefault();
        mutation.mutate();
      }}
    >
      <label>
        Add a comment
        <textarea rows={3} value={body} onChange={(event) => setBody(event.target.value)} />
      </label>
      {mutation.isError && (
        <p role="alert">
          {mutation.error instanceof ApiError && mutation.error.fieldErrors.body
            ? `Comment ${mutation.error.fieldErrors.body.join(", ")}`
            : `Error: ${mutation.error.message}`}
        </p>
      )}
      <p>
        <button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Sending…" : "Post comment"}
        </button>
      </p>
    </form>
  );
}

function PostPage() {
  const postId = Number(postRoute.useParams().postId);
  const post = useQuery(api.postQuery(postId));
  const comments = useQuery(api.commentsQuery(postId));

  if (post.isPending) return <p>Loading post…</p>;
  if (post.isError) return <ErrorMessage error={post.error} retry={() => post.refetch()} />;

  return (
    <article>
      <h1>{post.data.title}</h1>
      <small>{new Date(post.data.created_at).toLocaleDateString()}</small>
      <p style={{ whiteSpace: "pre-wrap" }}>{post.data.body}</p>

      <h2>Comments</h2>
      {comments.isPending && <p>Loading comments…</p>}
      {comments.isError && <ErrorMessage error={comments.error} retry={() => comments.refetch()} />}
      {comments.isSuccess && comments.data.length === 0 && <p>No comments yet. Be the first.</p>}
      {comments.isSuccess &&
        comments.data.map((comment) => (
          <p key={comment.id}>
            {comment.body}
            <br />
            <small>{new Date(comment.created_at).toLocaleString()}</small>
          </p>
        ))}
      <CommentForm postId={postId} />
    </article>
  );
}

const rootRoute = createRootRoute({ component: Layout });
const postsRoute = createRoute({ getParentRoute: () => rootRoute, path: "/", component: PostsPage });
const postRoute = createRoute({ getParentRoute: () => rootRoute, path: "/posts/$postId", component: PostPage });

export const router = createRouter({ routeTree: rootRoute.addChildren([postsRoute, postRoute]) });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
