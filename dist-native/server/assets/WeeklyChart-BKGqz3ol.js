import { jsxs, jsx } from "react/jsx-runtime";
import { motion } from "framer-motion";
import { ResponsiveContainer, BarChart, XAxis, YAxis, Bar, Cell } from "recharts";
function WeeklyChart({ data, goal }) {
  const maxVal = Math.max(goal, ...data.map((d) => d.calories));
  return /* @__PURE__ */ jsxs(
    motion.div,
    {
      className: "rounded-2xl bg-card p-5 shadow-sm border border-border/50",
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { delay: 0.25 },
      children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-sm font-semibold text-card-foreground", children: "This Week" }),
          /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground", children: [
            "Goal: ",
            goal,
            " cal"
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "h-36", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(BarChart, { data, barCategoryGap: "20%", children: [
          /* @__PURE__ */ jsx(
            XAxis,
            {
              dataKey: "label",
              axisLine: false,
              tickLine: false,
              tick: { fontSize: 11, fill: "var(--color-muted-foreground)" }
            }
          ),
          /* @__PURE__ */ jsx(YAxis, { hide: true, domain: [0, maxVal * 1.1] }),
          /* @__PURE__ */ jsx(Bar, { dataKey: "calories", radius: [6, 6, 0, 0], maxBarSize: 28, children: data.map((entry, index) => {
            const isToday = index === data.length - 1;
            const overGoal = entry.calories > goal;
            return /* @__PURE__ */ jsx(
              Cell,
              {
                fill: isToday ? "var(--color-primary)" : overGoal ? "var(--color-destructive)" : "var(--color-muted)",
                opacity: isToday ? 1 : 0.7
              },
              entry.date
            );
          }) })
        ] }) }) }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 mt-3 text-[11px] text-muted-foreground", children: [
          /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
            /* @__PURE__ */ jsx("span", { className: "w-2 h-2 rounded-full bg-primary" }),
            " Today"
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
            /* @__PURE__ */ jsx("span", { className: "w-2 h-2 rounded-full bg-muted" }),
            " Under goal"
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
            /* @__PURE__ */ jsx("span", { className: "w-2 h-2 rounded-full bg-destructive" }),
            " Over goal"
          ] })
        ] })
      ]
    }
  );
}
export {
  WeeklyChart
};
