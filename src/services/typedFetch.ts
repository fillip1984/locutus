/**
 * A simple wrapper around fetch that provides typed responses and throws errors for non-ok responses
 *
 * @example
 * Usage in a component:
 * ```ts
 * const user = await typedFetch<User>("/api/user");
 * ```
 *
 * @remarks
 * May be worthwhile to borrow some ideas from https://github.com/kiliman/remix-typedjson/blob/main/src/typedjson.ts
 */
export default async function typedFetch<T>(
  url: string,
  config?: RequestInit,
): Promise<T> {
  const response = await fetch(url, config);
  if (!response.ok) throw new Error(response.statusText);
  return response.json();
}
