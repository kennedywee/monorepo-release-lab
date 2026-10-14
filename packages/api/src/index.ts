// Typed API client shared by web, store, mobile, and (through web) desktop.
// Every type here comes from schema.d.ts, which is generated from
// apps/server/openapi.yaml. Do not write API types by hand.
import createClient from "openapi-fetch";
import { queryOptions } from "@tanstack/react-query";
import type { components, paths } from "./schema";

export type Post = components["schemas"]["Post"];
export type PostInput = components["schemas"]["PostInput"];
export type Comment = components["schemas"]["Comment"];
export type CommentInput = components["schemas"]["CommentInput"];

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly fieldErrors: Record<string, string[]> = {},
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type Result<T> = Promise<{ data?: T; error?: unknown; response: Response }>;

async function unwrap<T>(call: Result<T>, baseUrl: string): Promise<T> {
  let result: Awaited<Result<T>>;
  try {
    result = await call;
  } catch {
    throw new ApiError(`Could not reach the API at ${baseUrl}.`, 0);
  }

  if (result.response.ok && result.data !== undefined) return result.data;

  const { status } = result.response;
  const error = (result.error ?? {}) as { error?: string; errors?: Record<string, string[]> };
  if (error.errors) {
    const messages = Object.entries(error.errors).map(([field, list]) => `${field} ${list.join(", ")}`);
    throw new ApiError(messages.join("; "), status, error.errors);
  }
  throw new ApiError(error.error ?? `Request failed with status ${status}.`, status);
}

export function createApi(baseUrl: string) {
  const client = createClient<paths>({ baseUrl });

  return {
    baseUrl,

    postsQuery: () =>
      queryOptions({
        queryKey: ["posts"],
        queryFn: () => unwrap(client.GET("/posts"), baseUrl),
      }),

    postQuery: (id: number) =>
      queryOptions({
        queryKey: ["posts", id],
        queryFn: () => unwrap(client.GET("/posts/{id}", { params: { path: { id } } }), baseUrl),
      }),

    commentsQuery: (postId: number) =>
      queryOptions({
        queryKey: ["posts", postId, "comments"],
        queryFn: () =>
          unwrap(client.GET("/posts/{post_id}/comments", { params: { path: { post_id: postId } } }), baseUrl),
      }),

    createPost: (input: PostInput) => unwrap(client.POST("/posts", { body: input }), baseUrl),

    updatePost: (id: number, input: PostInput) =>
      unwrap(client.PATCH("/posts/{id}", { params: { path: { id } }, body: input }), baseUrl),

    createComment: (postId: number, input: CommentInput) =>
      unwrap(
        client.POST("/posts/{post_id}/comments", { params: { path: { post_id: postId } }, body: input }),
        baseUrl,
      ),
  };
}

export type Api = ReturnType<typeof createApi>;
