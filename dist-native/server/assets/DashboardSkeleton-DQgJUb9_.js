import { jsx, jsxs } from "react/jsx-runtime";
import { useLocation, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Home, PlusCircle, User } from "lucide-react";
import { h as hapticLight, c as hapticMedium } from "./router-L3bJVu16.js";
function BottomNav({ onAddClick }) {
  const location = useLocation();
  const path = location.pathname;
  const isHome = path === "/app" || path === "/";
  const isProfile = path === "/profile";
  return /* @__PURE__ */ jsx("div", { className: "fixed bottom-0 inset-x-0 z-30 bg-nav/80 backdrop-blur-2xl backdrop-saturate-150 border-t border-border/20", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-around py-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]", children: [
    /* @__PURE__ */ jsx(motion.div, { whileTap: { scale: 0.85 }, transition: { type: "spring", stiffness: 500, damping: 30 }, children: /* @__PURE__ */ jsxs(
      Link,
      {
        to: "/app",
        onClick: () => hapticLight(),
        className: `relative flex flex-col items-center gap-0.5 px-3 py-1.5 transition-colors ${isHome ? "text-nav-active" : "text-nav-foreground"}`,
        children: [
          /* @__PURE__ */ jsx(Home, { className: "w-6 h-6", strokeWidth: isHome ? 2.5 : 1.5 }),
          /* @__PURE__ */ jsx("span", { className: "text-[10px] font-semibold", children: "Home" }),
          isHome && /* @__PURE__ */ jsx("span", { className: "absolute bottom-1.5 w-1 h-1 rounded-full bg-nav-active" })
        ]
      }
    ) }),
    /* @__PURE__ */ jsx(
      motion.button,
      {
        whileTap: { scale: 0.85, rotate: -8 },
        transition: { type: "spring", stiffness: 500, damping: 25 },
        onClick: () => {
          hapticMedium();
          onAddClick();
        },
        className: "relative -mt-7",
        children: /* @__PURE__ */ jsx("div", { className: "w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xl shadow-primary/30", children: /* @__PURE__ */ jsx(PlusCircle, { className: "w-7 h-7" }) })
      }
    ),
    /* @__PURE__ */ jsx(motion.div, { whileTap: { scale: 0.85 }, transition: { type: "spring", stiffness: 500, damping: 30 }, children: /* @__PURE__ */ jsxs(
      Link,
      {
        to: "/profile",
        onClick: () => hapticLight(),
        className: `relative flex flex-col items-center gap-0.5 px-3 py-1.5 transition-colors ${isProfile ? "text-nav-active" : "text-nav-foreground"}`,
        children: [
          /* @__PURE__ */ jsx(User, { className: "w-6 h-6", strokeWidth: isProfile ? 2.5 : 1.5 }),
          /* @__PURE__ */ jsx("span", { className: "text-[10px] font-semibold", children: "Profile" }),
          isProfile && /* @__PURE__ */ jsx("span", { className: "absolute bottom-1.5 w-1 h-1 rounded-full bg-nav-active" })
        ]
      }
    ) })
  ] }) });
}
function Shimmer({ className }) {
  return /* @__PURE__ */ jsx("div", { className: `relative overflow-hidden rounded-2xl bg-muted/50 ${className ?? ""}`, children: /* @__PURE__ */ jsx(
    motion.div,
    {
      className: "absolute inset-0",
      style: {
        background: "linear-gradient(90deg, transparent 0%, var(--color-muted) 50%, transparent 100%)"
      },
      animate: { x: ["-100%", "200%"] },
      transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
    }
  ) });
}
function DashboardSkeleton() {
  return /* @__PURE__ */ jsxs("div", { "data-testid": "dashboard-skeleton", className: "min-h-screen bg-background pb-28", children: [
    /* @__PURE__ */ jsxs("div", { className: "px-6 pt-14 pb-2", children: [
      /* @__PURE__ */ jsx(Shimmer, { className: "h-4 w-16 mb-2 rounded-lg" }),
      /* @__PURE__ */ jsx(Shimmer, { className: "h-7 w-32 rounded-xl" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex justify-center py-6", children: /* @__PURE__ */ jsxs("div", { className: "relative w-52 h-52 flex items-center justify-center", children: [
      /* @__PURE__ */ jsx(Shimmer, { className: "w-full h-full rounded-full" }),
      /* @__PURE__ */ jsxs("div", { className: "absolute inset-0 flex flex-col items-center justify-center gap-1", children: [
        /* @__PURE__ */ jsx(Shimmer, { className: "h-10 w-24 rounded-xl" }),
        /* @__PURE__ */ jsx(Shimmer, { className: "h-3 w-16 rounded-lg" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "flex justify-center gap-8 mb-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-1", children: [
        /* @__PURE__ */ jsx(Shimmer, { className: "h-6 w-10 rounded-lg" }),
        /* @__PURE__ */ jsx(Shimmer, { className: "h-3 w-12 rounded-lg" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "h-10 w-px bg-border" }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-1", children: [
        /* @__PURE__ */ jsx(Shimmer, { className: "h-6 w-12 rounded-lg" }),
        /* @__PURE__ */ jsx(Shimmer, { className: "h-3 w-10 rounded-lg" })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "px-6 mb-6", children: /* @__PURE__ */ jsx("div", { className: "rounded-2xl bg-card p-4 shadow-sm border border-border/50 flex gap-4", children: [1, 2, 3].map((i) => /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col items-center gap-2", children: [
      /* @__PURE__ */ jsx(Shimmer, { className: "h-5 w-10 rounded-lg" }),
      /* @__PURE__ */ jsx(Shimmer, { className: "h-2 w-full rounded-full" }),
      /* @__PURE__ */ jsx(Shimmer, { className: "h-3 w-14 rounded-lg" })
    ] }, i)) }) }),
    /* @__PURE__ */ jsx("div", { className: "px-6 mb-6", children: /* @__PURE__ */ jsx(Shimmer, { className: "h-40 w-full" }) }),
    /* @__PURE__ */ jsx("div", { className: "px-6 space-y-3", children: [1, 2, 3, 4].map((i) => /* @__PURE__ */ jsx(
      motion.div,
      {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        transition: { delay: i * 0.06 },
        children: /* @__PURE__ */ jsx("div", { className: "rounded-2xl bg-card p-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] border border-border/40", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5", children: [
            /* @__PURE__ */ jsx(Shimmer, { className: "w-6 h-6 rounded-lg" }),
            /* @__PURE__ */ jsx(Shimmer, { className: "h-4 w-20 rounded-lg" })
          ] }),
          /* @__PURE__ */ jsx(Shimmer, { className: "w-7 h-7 rounded-xl" })
        ] }) })
      },
      i
    )) })
  ] });
}
export {
  BottomNav as B,
  DashboardSkeleton as D
};
