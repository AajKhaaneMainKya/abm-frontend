# Auth setup (Clerk) — Sahayak

Clerk OAuth across both repos. **Auth is deploy-safe**: the backend only
enforces it when `CLERK_SECRET_KEY` is set, so nothing breaks before you add
keys. Do these steps to turn it on.

## 1. Create a Clerk application
1. clerk.com → create an application.
2. Enable the providers you want under **User & Authentication → Social
   Connections** (e.g. **Google**) and **Email**.
3. **API Keys** → copy the **Publishable key** (`pk_live_…` / `pk_test_…`) and
   the **Secret key** (`sk_live_…` / `sk_test_…`).

## 2. Frontend keys (`abm-frontend`)
Put real values in `.env.local` (gitignored — never committed). Template is
`.env.example`:
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/welcome
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/welcome
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL=/onboarding
```
On Vercel, add the same vars to the project (Publishable key is public;
Secret key is a server var).

## 3. Backend key (`abm-system` / Railway)
Add **one** var to the `abm-api` service (and any worker that serves the API):
```
CLERK_SECRET_KEY=sk_live_...
```
- **Unset** → auth OFF: the API runs as the seeded admin (single-tenant, no
  401s). Safe default; nothing breaks.
- **Set** → auth ON: every request needs a valid Clerk JWT and all data is
  scoped to the authenticated user.

## 4. (Recommended) JWT email claim
Clerk session tokens don't include email/name by default. The backend falls
back to the Clerk Backend API to fetch them, but you can avoid that round-trip:
Clerk Dashboard → **Sessions → Customize session token**, add:
```json
{ "email": "{{user.primary_email_address}}",
  "first_name": "{{user.first_name}}",
  "last_name": "{{user.last_name}}" }
```

## 5. First sign-in reconciles your existing data
The migration seeded a placeholder admin owning the 3 existing clients. On your
first real sign-in, `api/auth.py` matches by **email** and rewrites that row's
`clerk_user_id` to your real Clerk id — so your clients stay yours instead of a
fresh empty account being created. Sign in with **rshivs.1295@gmail.com**.

## Framework notes (why this isn't the stock Clerk quickstart)
- **Next 16 renamed `middleware` → `proxy`.** Auth lives in **`proxy.ts`**
  (not `middleware.ts`) using `clerkMiddleware()` + `createRouteMatcher` (Clerk
  v7; the old `authMiddleware` was removed).
- The root layout wraps everything in the XP `Shell`; `Shell` bare-renders on
  `/welcome`, `/sign-in`, `/sign-up`, `/onboarding` so the splash is full-screen.
- The splash embeds Clerk's prebuilt `<SignIn/>` (hash routing). To use custom
  "Continue with Google/Email" buttons instead, swap it for `useSignIn()
  .authenticateWithRedirect({ strategy: "oauth_google", … })`.
- API auth: an axios interceptor in `lib/api.ts` attaches the Clerk token
  (`window.Clerk.session.getToken()`) to every request.

## Verify
1. Backend, key unset: `GET /api/health` → `"auth":"off"`; dashboard works
   tokenless.
2. Backend, key set: `GET /api/clients` with no token → **401**; `/api/health`
   still 200.
3. Frontend with keys: visiting `/` while signed out → redirect to `/welcome`;
   sign in → land on `/` with the `UserButton` top-right.
