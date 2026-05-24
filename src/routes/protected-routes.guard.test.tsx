/**
 * Route-level guard test.
 *
 * Mounts the actual protected route components (/app, /workouts, /profile)
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
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup, act } from "@testing-library/react";
import React from "react";

// --- Router mocks --------------------------------------------------------

const navigate = vi.fn();

vi.mock("@tanstack/react-router", async () => {
  const actual: any = await vi.importActual("@tanstack/react-router");
  return {
    ...actual,
    useNavigate: () => navigate,
    // createFileRoute("/x")({ component, ... }) → { options }
    createFileRoute: () => (options: any) => ({ options }),
    Link: ({ children }: any) => <>{children}</>,
  };
});

// --- Auth mock -----------------------------------------------------------

let mockUser: { id: string } | null = { id: "u1" };
let mockAuthLoading = false;
vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ user: mockUser, loading: mockAuthLoading, signOut: vi.fn() }),
}));

// --- Supabase mock -------------------------------------------------------
//
// Each route calls:
//   supabase.from("user_profiles").select(...).eq(...).maybeSingle().then(...)
// Other tables (workouts, weight_logs, …) are called from effects that only
// run after `user` exists and they aren't part of the guard contract — we
// stub them with a resolved no-op shape so they don't blow up.

let resolveGuardQuery: (value: any) => void = () => {};
let guardQueryPromise: Promise<any>;
function freshGuardQuery() {
  guardQueryPromise = new Promise((res) => {
    resolveGuardQuery = res;
  });
}

const noopThenable = {
  then: (cb: any) => Promise.resolve(cb({ data: [], error: null })),
};

function makeBuilder(table: string): any {
  const builder: any = {
    select: () => builder,
    eq: () => builder,
    order: () => builder,
    limit: () => builder,
    in: () => builder,
    gte: () => builder,
    lte: () => builder,
    insert: () => Promise.resolve({ data: null, error: null }),
    update: () => builder,
    delete: () => builder,
    maybeSingle: () => {
      if (table === "user_profiles") return guardQueryPromise;
      return Promise.resolve({ data: null, error: null });
    },
    single: () => Promise.resolve({ data: null, error: null }),
    then: noopThenable.then,
  };
  return builder;
}

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      getSession: () => Promise.resolve({ data: { session: null } }),
      signOut: () => Promise.resolve({ error: null }),
    },
    from: (table: string) => makeBuilder(table),
  },
}));

// --- Heavy / browser-only side imports the routes pull in ---------------
// These just need to be safe to import + render as no-ops. They aren't
// touched while guardReady=false (skeleton is the only render path), but
// their module evaluation must not crash in jsdom.

vi.mock("@/components/BottomNav", () => ({ BottomNav: () => null }));
vi.mock("@/components/CalorieRing", () => ({ CalorieRing: () => null }));
vi.mock("@/components/MacroCard", () => ({ MacroCard: () => null }));
vi.mock("@/components/MealSection", () => ({ MealSection: () => null }));
vi.mock("@/components/ReminderPrompt", () => ({ ReminderPrompt: () => null }));
vi.mock("@/components/PullToRefresh", () => ({ PullToRefresh: ({ children }: any) => <>{children}</> }));
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

vi.mock("sonner", () => ({ toast: Object.assign(() => {}, { success: () => {}, error: () => {} }) }));

// --- Helpers -------------------------------------------------------------

async function loadRouteComponent(path: string): Promise<React.ComponentType> {
  const mod = await import(/* @vite-ignore */ path);
  return mod.Route.options.component as React.ComponentType;
}

// --- Tests ---------------------------------------------------------------

describe.each([
  ["/app", "../routes/app.tsx"],
  ["/workouts", "../routes/workouts.tsx"],
  ["/profile", "../routes/profile.tsx"],
])("protected route %s", (label, modPath) => {
  beforeEach(() => {
    navigate.mockReset();
    mockUser = { id: "u1" };
    mockAuthLoading = false;
    freshGuardQuery();
  });
  afterEach(() => cleanup());

  it(`renders only DashboardSkeleton while the onboarding query is pending [${label}]`, async () => {
    const Comp = await loadRouteComponent(modPath);
    render(<Comp />);
    // Skeleton must be present, and no navigation yet.
    expect(screen.getByTestId("dashboard-skeleton")).toBeTruthy();
    expect(navigate).not.toHaveBeenCalled();
  });

  it(`redirects to /welcome and keeps skeleton when user is missing [${label}]`, async () => {
    mockUser = null;
    const Comp = await loadRouteComponent(modPath);
    render(<Comp />);
    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith({ to: "/welcome", replace: true });
    });
    expect(screen.getByTestId("dashboard-skeleton")).toBeTruthy();
  });

  it(`redirects to /onboarding and keeps skeleton when onboarding incomplete [${label}]`, async () => {
    const Comp = await loadRouteComponent(modPath);
    render(<Comp />);
    await act(async () => {
      resolveGuardQuery({ data: { onboarding_completed: false } });
      await guardQueryPromise;
    });
    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith({ to: "/onboarding", replace: true });
    });
    expect(screen.getByTestId("dashboard-skeleton")).toBeTruthy();
  });

  it(`removes skeleton after the query resolves with onboarding_completed=true [${label}]`, async () => {
    const Comp = await loadRouteComponent(modPath);
    render(<Comp />);
    expect(screen.getByTestId("dashboard-skeleton")).toBeTruthy();
    await act(async () => {
      resolveGuardQuery({ data: { onboarding_completed: true } });
      await guardQueryPromise;
    });
    await waitFor(() => {
      expect(screen.queryByTestId("dashboard-skeleton")).toBeNull();
    });
    expect(navigate).not.toHaveBeenCalled();
  });
});
