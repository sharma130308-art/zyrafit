/**
 * Route-level guard test.
 *
 * Mounts the actual protected route components (/app and /profile)
 * and verifies the no-flash contract:
 *
 *   - while the `user_profiles.onboarding_completed` query is pending,
 *     the route renders <DashboardSkeleton /> only — no real page chrome
 *   - when the user is missing, the route navigates to /welcome and keeps
 *     showing the skeleton (never the real page)
 *   - when onboarding is incomplete, the route navigates to /onboarding
 *     and keeps showing the skeleton
 *   - when the query resolves with onboarding_completed=true, the skeleton
 *     is removed and the real component tree takes over
 *
 * --- Stability notes ---
 *
 * Mocks are written to avoid module-import side effects:
 *
 *   1. All shared mock state lives in a single `vi.hoisted(() => …)` bag
 *      (`h`). Nothing relies on top-level `let` being captured by a mock
 *      factory at hoist time — that ordering is the #1 source of flakes
 *      when vitest/vite internals shift.
 *   2. The supabase mock is data-driven: each test installs a fresh
 *      controller via `h.installGuardQuery(...)` and the mock just reads
 *      from `h`. Builders are pure functions of `h` state, so importing
 *      the supabase client never schedules work or captures stale refs.
 *   3. Route modules are imported statically at the top of the file
 *      (after `vi.mock` calls, which are hoisted above them). No
 *      `import(path)` with `@vite-ignore` — that bypasses vite's static
 *      graph and breaks when the resolver/runner changes.
 *   4. `getRouteComponent()` validates the route export shape with a
 *      clear error, so a router-internal change surfaces as a readable
 *      assertion instead of a cryptic "X is not a function".
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup, act } from "@testing-library/react";
import React from "react";

// ---------------------------------------------------------------------------
// Hoisted mock state. Lives above every `vi.mock` factory and every import,
// so factories can reference it without TDZ races.
// ---------------------------------------------------------------------------

const h = vi.hoisted(() => {
  type Deferred<T> = { promise: Promise<T>; resolve: (v: T) => void };
  function deferred<T>(): Deferred<T> {
    let resolve!: (v: T) => void;
    const promise = new Promise<T>((r) => { resolve = r; });
    return { promise, resolve };
  }

  const state: {
    navigate: ReturnType<typeof vi.fn>;
    user: { id: string } | null;
    authLoading: boolean;
    guardQuery: Deferred<{ data: { onboarding_completed: boolean } | null }>;
    installGuardQuery: () => Deferred<{ data: { onboarding_completed: boolean } | null }>;
    reset: () => void;
  } = {
    navigate: vi.fn(),
    user: { id: "u1" },
    authLoading: false,
    guardQuery: deferred(),
    installGuardQuery() {
      state.guardQuery = deferred();
      return state.guardQuery;
    },
    reset() {
      state.navigate.mockReset();
      state.user = { id: "u1" };
      state.authLoading = false;
      state.installGuardQuery();
    },
  };
  return state;
});

// ---------------------------------------------------------------------------
// Router mock — pure, reads `h.navigate` lazily on each call.
// ---------------------------------------------------------------------------

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual<typeof import("@tanstack/react-router")>(
    "@tanstack/react-router",
  );
  return {
    ...actual,
    useNavigate: () => h.navigate,
    // createFileRoute("/x")({ ...options }) → { options }
    createFileRoute: () => (options: unknown) => ({ options }),
    Link: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  };
});

// ---------------------------------------------------------------------------
// Auth mock — reads from `h` on every render, no captured snapshots.
// ---------------------------------------------------------------------------

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ user: h.user, loading: h.authLoading, signOut: vi.fn() }),
}));

// ---------------------------------------------------------------------------
// Supabase mock — data-driven builder. Only `user_profiles.maybeSingle()`
// returns the live guard-query promise; every other terminal returns a
// resolved empty shape so unrelated effects don't crash.
// ---------------------------------------------------------------------------

vi.mock("@/integrations/supabase/client", () => {
  const empty = { data: null, error: null };
  const emptyList = { data: [], error: null };

  function builder(table: string) {
    const chain: Record<string, unknown> = {};
    const passthrough = () => chain;
    Object.assign(chain, {
      select: passthrough,
      eq: passthrough,
      order: passthrough,
      limit: passthrough,
      in: passthrough,
      gte: passthrough,
      lte: passthrough,
      update: passthrough,
      delete: passthrough,
      insert: () => Promise.resolve(empty),
      single: () => Promise.resolve(empty),
      maybeSingle: () =>
        table === "user_profiles"
          ? h.guardQuery.promise
          : Promise.resolve(empty),
      // Thenable for `await supabase.from(...).select(...)` shape.
      then: (cb: (v: typeof emptyList) => unknown) =>
        Promise.resolve(cb(emptyList)),
    });
    return chain;
  }

  return {
    supabase: {
      auth: {
        onAuthStateChange: () => ({
          data: { subscription: { unsubscribe: () => {} } },
        }),
        getSession: () => Promise.resolve({ data: { session: null } }),
        signOut: () => Promise.resolve({ error: null }),
      },
      from: (table: string) => builder(table),
    },
  };
});

// ---------------------------------------------------------------------------
// Heavy / browser-only child components — stubbed as no-ops so the route
// modules' static imports don't crash in jsdom. None of them render while
// `guardReady=false`, but they still need to evaluate at module load.
// ---------------------------------------------------------------------------

vi.mock("@/components/BottomNav", () => ({ BottomNav: () => null }));
vi.mock("@/components/CalorieRing", () => ({ CalorieRing: () => null }));
vi.mock("@/components/MacroCard", () => ({ MacroCard: () => null }));
vi.mock("@/components/MealSection", () => ({ MealSection: () => null }));
vi.mock("@/components/ReminderPrompt", () => ({ ReminderPrompt: () => null }));
vi.mock("@/components/PullToRefresh", () => ({
  PullToRefresh: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));
vi.mock("@/components/StreakBadge", () => ({ StreakBadge: () => null }));
vi.mock("@/components/UndoToast", () => ({ UndoToast: () => null }));
vi.mock("@/components/ScanStepper", () => ({ ScanStepper: () => null }));
vi.mock("@/components/RemindersToggle", () => ({ RemindersToggle: () => null }));
vi.mock("@/components/MealReminderTimes", () => ({ MealReminderTimes: () => null }));

vi.mock("@/lib/haptics", () => ({
  hapticLight: () => {},
  hapticMedium: () => {},
  hapticSuccess: () => {},
}));

vi.mock("sonner", () => ({
  toast: Object.assign(() => {}, { success: () => {}, error: () => {} }),
}));

// ---------------------------------------------------------------------------
// Static imports of the route modules. Must come AFTER vi.mock(...) calls,
// which are hoisted above them by vitest. Static imports keep the test in
// vite's regular module graph — no `@vite-ignore` dynamic-import escape
// hatch that breaks when vite/vitest internals change.
// ---------------------------------------------------------------------------

import * as appRoute from "./app";
import * as profileRoute from "./profile";

function getRouteComponent(mod: unknown): React.ComponentType {
  const route = (mod as { Route?: { options?: { component?: unknown } } }).Route;
  const component = route?.options?.component;
  if (typeof component !== "function") {
    throw new Error(
      "Route module did not export Route.options.component — check the " +
        "createFileRoute mock shape in this test file.",
    );
  }
  return component as React.ComponentType;
}

// ---------------------------------------------------------------------------

const routes: Array<[label: string, Component: React.ComponentType]> = [
  ["/app", getRouteComponent(appRoute)],
  ["/profile", getRouteComponent(profileRoute)],
];

describe.each(routes)("protected route %s", (label, Component) => {
  beforeEach(() => h.reset());
  afterEach(() => cleanup());

  it(`renders only DashboardSkeleton while the onboarding query is pending [${label}]`, () => {
    render(<Component />);
    expect(screen.getByTestId("dashboard-skeleton")).toBeTruthy();
    expect(h.navigate).not.toHaveBeenCalled();
  });

  it(`redirects to /welcome and keeps skeleton when user is missing [${label}]`, async () => {
    h.user = null;
    render(<Component />);
    await waitFor(() => {
      expect(h.navigate).toHaveBeenCalledWith({ to: "/welcome", replace: true });
    });
    expect(screen.getByTestId("dashboard-skeleton")).toBeTruthy();
  });

  it(`redirects to /onboarding once the query resolves with onboarding_completed=false [${label}]`, async () => {
    render(<Component />);
    expect(screen.getByTestId("dashboard-skeleton")).toBeTruthy();
    await act(async () => {
      h.guardQuery.resolve({ data: { onboarding_completed: false } });
      await h.guardQuery.promise;
    });
    await waitFor(() => {
      expect(h.navigate).toHaveBeenCalledWith({ to: "/onboarding", replace: true });
    });
  });

  it(`removes skeleton after the query resolves with onboarding_completed=true [${label}]`, async () => {
    render(<Component />);
    expect(screen.getByTestId("dashboard-skeleton")).toBeTruthy();
    await act(async () => {
      h.guardQuery.resolve({ data: { onboarding_completed: true } });
      await h.guardQuery.promise;
    });
    await waitFor(() => {
      expect(screen.queryByTestId("dashboard-skeleton")).toBeNull();
    });
    expect(h.navigate).not.toHaveBeenCalled();
  });
});
