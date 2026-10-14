import {
  Link,
  Outlet,
  createHashHistory,
  createRootRoute,
  createRoute,
  createRouter,
  useNavigate,
} from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ApiError, type PostInput } from "@release-lab/api";
import { api } from "./api";

function Layout() {
  return (
    <>
      <header>
        <strong>Release Lab Staff</strong> · <Link to="/">Posts</Link> · <Link to="/posts/new">New post</Link>
      </header>
      <hr />
      <Outlet />
      <hr />
      <footer>
        <small>API: {api.baseUrl}</small>
      </footer>
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

  return (
    <>
      <h1>Posts</h1>
      {posts.data.length === 0 && <p>No posts yet.</p>}
      <ul>
        {posts.data.map((post) => (
          <li key={post.id}>
            <Link to="/posts/$postId" params={{ postId: String(post.id) }}>
              {post.title}
            </Link>{" "}
            <small>updated {new Date(post.updated_at).toLocaleString()}</small>
          </li>
        ))}
      </ul>
    </>
  );
}

function PostForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial: PostInput;
  submitLabel: string;
  onSubmit: (input: PostInput) => Promise<unknown>;
}) {
  const [title, setTitle] = useState(initial.title);
  const [body, setBody] = useState(initial.body);
  const mutation = useMutation({ mutationFn: onSubmit });
  const fieldErrors = mutation.error instanceof ApiError ? mutation.error.fieldErrors : {};

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        mutation.mutate({ title, body });
      }}
    >
      <label>
        Title
        <input value={title} onChange={(event) => setTitle(event.target.value)} />
      </label>
      {fieldErrors.title && <p role="alert">Title {fieldErrors.title.join(", ")}</p>}
      <label>
        Body
        <textarea rows={8} value={body} onChange={(event) => setBody(event.target.value)} />
      </label>
      {fieldErrors.body && <p role="alert">Body {fieldErrors.body.join(", ")}</p>}
      {mutation.isError && !(mutation.error instanceof ApiError && mutation.error.status === 422) && (
        <ErrorMessage error={mutation.error} />
      )}
      {mutation.isSuccess && <p>Saved.</p>}
      <p>
        <button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Saving…" : submitLabel}
        </button>
      </p>
    </form>
  );
}

function NewPostPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return (
    <>
      <h1>New post</h1>
      <PostForm
        initial={{ title: "", body: "" }}
        submitLabel="Create post"
        onSubmit={async (input) => {
          const post = await api.createPost(input);
          await queryClient.invalidateQueries({ queryKey: ["posts"] });
          await navigate({ to: "/posts/$postId", params: { postId: String(post.id) } });
        }}
      />
    </>
  );
}

function EditPostPage() {
  const postId = Number(editPostRoute.useParams().postId);
  const queryClient = useQueryClient();
  const post = useQuery(api.postQuery(postId));
  const comments = useQuery(api.commentsQuery(postId));

  if (post.isPending) return <p>Loading post…</p>;
  if (post.isError) return <ErrorMessage error={post.error} retry={() => post.refetch()} />;

  return (
    <>
      <h1>Edit post #{post.data.id}</h1>
      <PostForm
        key={post.data.id}
        initial={{ title: post.data.title, body: post.data.body }}
        submitLabel="Save changes"
        onSubmit={async (input) => {
          await api.updatePost(postId, input);
          await queryClient.invalidateQueries({ queryKey: ["posts"] });
        }}
      />

      <h2>Comments</h2>
      {comments.isPending && <p>Loading comments…</p>}
      {comments.isError && <ErrorMessage error={comments.error} retry={() => comments.refetch()} />}
      {comments.isSuccess && comments.data.length === 0 && <p>No comments yet.</p>}
      {comments.isSuccess && (
        <ul>
          {comments.data.map((comment) => (
            <li key={comment.id}>
              {comment.body} <small>{new Date(comment.created_at).toLocaleString()}</small>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

const rootRoute = createRootRoute({ component: Layout });
const postsRoute = createRoute({ getParentRoute: () => rootRoute, path: "/", component: PostsPage });
const newPostRoute = createRoute({ getParentRoute: () => rootRoute, path: "/posts/new", component: NewPostPage });
const editPostRoute = createRoute({ getParentRoute: () => rootRoute, path: "/posts/$postId", component: EditPostPage });

// Hash history keeps routing inside index.html, so the same build works on a
// static host and inside Electron (file://) without server rewrites.
export const router = createRouter({
  routeTree: rootRoute.addChildren([postsRoute, newPostRoute, editPostRoute]),
  history: createHashHistory(),
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
