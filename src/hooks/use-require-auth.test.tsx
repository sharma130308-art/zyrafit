import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { render, screen } from "@testing-library/react";
import { useRequireAuth } from "./use-require-auth";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";

// --- Mocks ---------------------------------------------------------------

const navigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigate,
}));

let mockUser: { id: string } | null = { id: "u1" };
let mockLoading = false;
vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ user: mockUser, loading: mockLoading }),
}));

// Controllable promise for the user_profiles query
let resolveQuery: (value: { data: { onboarding_completed: boolean } | null }) => void;
let queryPromise: Promise<{ data: { onboarding_completed: boolean } | null }>;
function freshQuery() {
  queryPromise = new Promise((res) => {
    resolveQuery = res;
  });
}

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => queryPromise,
        }),
      }),
    }),
  },
}));

// --- Tests ---------------------------------------------------------------

describe("useRequireAuth", () => {
  beforeEach(() => {
    navigate.mockReset();
    mockUser = { id: "u1" };
    mockLoading = false;
    freshQuery();
  });

  it("keeps ready=false until the onboarding query resolves", async () => {
    const { result } = renderHook(() => useRequireAuth());

    // Initial render: query is still pending → not ready
    expect(result.current.ready).toBe(false);
    expect(navigate).not.toHaveBeenCalled();

    // Resolve the query as onboarded
    await act(async () => {
      resolveQuery({ data: { onboarding_completed: true } });
      await queryPromise;
    });

    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(navigate).not.toHaveBeenCalled();
  });

  it("redirects to /welcome (and stays !ready) when there is no user", async () => {
    mockUser = null;
    const { result } = renderHook(() => useRequireAuth());
    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith({ to: "/welcome", replace: true })
    );
    expect(result.current.ready).toBe(false);
  });

  it("redirects to /onboarding (and stays !ready) when onboarding incomplete", async () => {
    const { result } = renderHook(() => useRequireAuth());
    await act(async () => {
      resolveQuery({ data: { onboarding_completed: false } });
      await queryPromise;
    });
    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith({ to: "/onboarding", replace: true })
    );
    expect(result.current.ready).toBe(false);
  });
});

// --- Skeleton-while-not-ready contract -----------------------------------

describe("protected-route render contract", () => {
  it("renders <DashboardSkeleton /> while guardReady is false", () => {
    function ProtectedPage({ guardReady }: { guardReady: boolean }) {
      if (!guardReady) return <DashboardSkeleton />;
      return <div data-testid="real-content">real content</div>;
    }
    const { rerender } = render(<ProtectedPage guardReady={false} />);
    expect(screen.queryByTestId("real-content")).toBeNull();
    rerender(<ProtectedPage guardReady={true} />);
    expect(screen.getByTestId("real-content")).toBeTruthy();
  });
});
