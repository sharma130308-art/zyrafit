# Auth Guard — No-Flash Verification Checklist

Goal: confirm that `/app`, `/workouts`, and `/profile` never render their
real content for a frame before redirecting unauthenticated or
not-yet-onboarded users.

The contract: while `guardReady` is `false`, each protected route returns
`<DashboardSkeleton />` — never the real page tree.

## Static checks (do these on every change to a protected route)

For each of `src/routes/app.tsx`, `src/routes/workouts.tsx`,
`src/routes/profile.tsx`:

- [ ] Component declares `const [guardReady, setGuardReady] = useState(false)`.
- [ ] Initial value is `false` (never `true`, never derived from `user`).
- [ ] `setGuardReady(true)` is called **only** after the
      `user_profiles.onboarding_completed` query resolves to `true`.
- [ ] An early return `if (!guardReady) return <DashboardSkeleton />;`
      exists **before** any JSX that touches `user`, entries, profile data,
      or other protected state.
- [ ] No conditional like `{user && <Real/>}` above that early return —
      the skeleton must be the sole rendered output until the guard clears.
- [ ] Unauthenticated branch calls `navigate({ to: "/welcome", replace: true })`
      and returns **without** calling `setGuardReady(true)`.
- [ ] Not-onboarded branch calls `navigate({ to: "/onboarding", replace: true })`
      and returns **without** calling `setGuardReady(true)`.

Quick grep to spot regressions:

```bash
rg -n "guardReady" src/routes/{app,workouts,profile}.tsx
rg -n "DashboardSkeleton" src/routes/{app,workouts,profile}.tsx
```

Each file should show: the `useState(false)`, at least one
`setGuardReady(true)` inside the onboarded-success branch, and one
`if (!guardReady) return <DashboardSkeleton`.

## Manual smoke test (run before shipping guard changes)

Test in a private window so the session is clean.

1. **Signed out → /app**
   - Visit `/app` directly.
   - Expected: skeleton flashes (or nothing), then `/welcome`.
   - Fail: any real dashboard chrome (calorie ring numbers, meal cards,
     bottom nav with active route) visible for even one frame.

2. **Signed out → /workouts**
   - Visit `/workouts` directly.
   - Expected: skeleton, then `/welcome`.
   - Fail: exercise list, "Log workout" sheet, or filter chips appear.

3. **Signed out → /profile**
   - Visit `/profile` directly.
   - Expected: skeleton, then `/welcome`.
   - Fail: profile fields, weight chart, or sign-out button appear.

4. **Signed in but `onboarding_completed = false` → /app**
   - Manually flip the row in `user_profiles` or use a fresh signup.
   - Expected: skeleton, then `/onboarding`.
   - Fail: dashboard renders before redirect.

5. **Throttled network repeat**
   - DevTools → Network → throttle to "Slow 3G".
   - Repeat steps 1–4. The skeleton should be visible for longer, but the
     real page must still never appear before the redirect lands.

6. **Happy path**
   - Signed in + onboarded → `/app`, `/workouts`, `/profile` each render
     skeleton briefly, then the real page. No redirect.

## When something fails

- Real content flashes before redirect → the `if (!guardReady) return …`
  early return is missing or placed below other JSX. Move it to the top of
  the component body, right after hooks.
- Page stays on skeleton forever → `setGuardReady(true)` is gated behind a
  branch that never runs (e.g. inside an `if (data?.onboarding_completed)`
  whose `else` also returns without setting it). Make sure the success
  branch is the only path that calls `setGuardReady(true)`.
- Skeleton never shows (page goes straight to redirect) → fine. The guard
  is doing its job; the skeleton is only a fallback for slow guard
  resolution.
