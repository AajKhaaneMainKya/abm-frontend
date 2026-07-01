/**
 * Clerk token access for the API layer.
 *
 * lib/api.ts functions run inside React Query (client-side, but outside React
 * render), so we can't use the useAuth() hook there. Clerk exposes the active
 * session on `window.Clerk` once ClerkProvider has loaded — that's the
 * supported escape hatch for imperative token access. (Note: it's
 * `window.Clerk`, capital C — not the `window.__clerk` internal.)
 */

type ClerkGlobal = {
  session?: { getToken: () => Promise<string | null> };
};

function clerk(): ClerkGlobal | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as { Clerk?: ClerkGlobal }).Clerk;
}

/** The current session JWT, or null when unauthenticated / not yet loaded. */
export async function getClerkToken(): Promise<string | null> {
  try {
    return (await clerk()?.session?.getToken()) ?? null;
  } catch {
    return null;
  }
}

/** Authorization header for manual fetch() calls. Empty when signed out. */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await getClerkToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
