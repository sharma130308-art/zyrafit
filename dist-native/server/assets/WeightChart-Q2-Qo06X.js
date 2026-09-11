import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { ResponsiveContainer, LineChart, XAxis, YAxis, Tooltip, ReferenceLine, Line } from "recharts";
import { format, parseISO } from "date-fns";
function WeightChart({ filteredLogs, activeChart, profile }) {
  return /* @__PURE__ */ jsx("div", { className: "h-52 -mx-2 rounded-xl overflow-hidden", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(
    LineChart,
    {
      data: filteredLogs.map((l) => ({
        date: format(parseISO(l.logged_at), "MMM d"),
        weight: l.weight_kg,
        bmi: l.bmi,
        bodyfat: l.body_fat_percent
      })),
      margin: { top: 12, right: 16, bottom: 4, left: -4 },
      children: [
        /* @__PURE__ */ jsxs("defs", { children: [
          /* @__PURE__ */ jsxs("linearGradient", { id: "weightGrad", x1: "0", y1: "0", x2: "0", y2: "1", children: [
            /* @__PURE__ */ jsx("stop", { offset: "0%", stopColor: "hsl(var(--primary))", stopOpacity: 0.15 }),
            /* @__PURE__ */ jsx("stop", { offset: "100%", stopColor: "hsl(var(--primary))", stopOpacity: 0 })
          ] }),
          /* @__PURE__ */ jsxs("linearGradient", { id: "bmiGrad", x1: "0", y1: "0", x2: "0", y2: "1", children: [
            /* @__PURE__ */ jsx("stop", { offset: "0%", stopColor: "hsl(210, 80%, 55%)", stopOpacity: 0.15 }),
            /* @__PURE__ */ jsx("stop", { offset: "100%", stopColor: "hsl(210, 80%, 55%)", stopOpacity: 0 })
          ] }),
          /* @__PURE__ */ jsxs("linearGradient", { id: "fatGrad", x1: "0", y1: "0", x2: "0", y2: "1", children: [
            /* @__PURE__ */ jsx("stop", { offset: "0%", stopColor: "hsl(340, 80%, 55%)", stopOpacity: 0.15 }),
            /* @__PURE__ */ jsx("stop", { offset: "100%", stopColor: "hsl(340, 80%, 55%)", stopOpacity: 0 })
          ] })
        ] }),
        /* @__PURE__ */ jsx(
          XAxis,
          {
            dataKey: "date",
            tick: { fontSize: 10, fill: "hsl(var(--muted-foreground))" },
            axisLine: false,
            tickLine: false,
            interval: "preserveStartEnd"
          }
        ),
        /* @__PURE__ */ jsx(
          YAxis,
          {
            domain: ["dataMin - 2", "dataMax + 2"],
            tick: { fontSize: 10, fill: "hsl(var(--muted-foreground))" },
            axisLine: false,
            tickLine: false,
            width: 38,
            tickFormatter: (v) => {
              if (activeChart === "bodyfat") return `${v}%`;
              if (activeChart === "weight") return `${v}`;
              return `${v}`;
            }
          }
        ),
        /* @__PURE__ */ jsx(
          Tooltip,
          {
            contentStyle: {
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "14px",
              fontSize: "12px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
              padding: "10px 14px"
            },
            formatter: (value) => {
              if (activeChart === "weight") return [`${value} kg`, "Weight"];
              if (activeChart === "bmi") return [value.toFixed(1), "BMI"];
              return [`${value}%`, "Body Fat"];
            },
            labelStyle: { fontWeight: 700, marginBottom: 4, fontSize: 11 },
            cursor: { stroke: "hsl(var(--muted-foreground))", strokeWidth: 1, strokeDasharray: "4 4" }
          }
        ),
        activeChart === "weight" && profile?.target_weight_kg && /* @__PURE__ */ jsx(
          ReferenceLine,
          {
            y: Number(profile.target_weight_kg),
            stroke: "hsl(var(--primary))",
            strokeDasharray: "8 4",
            strokeOpacity: 0.5,
            label: { value: `Target ${profile.target_weight_kg}kg`, position: "insideTopRight", fontSize: 9, fill: "hsl(var(--primary))" }
          }
        ),
        activeChart === "bmi" && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(ReferenceLine, { y: 18.5, stroke: "hsl(210, 70%, 60%)", strokeDasharray: "4 4", strokeOpacity: 0.25, label: { value: "18.5", position: "insideBottomLeft", fontSize: 8, fill: "hsl(210, 70%, 60%)" } }),
          /* @__PURE__ */ jsx(ReferenceLine, { y: 25, stroke: "hsl(var(--destructive))", strokeDasharray: "6 4", strokeOpacity: 0.4, label: { value: "25 Overweight", position: "insideTopRight", fontSize: 8, fill: "hsl(var(--destructive))" } }),
          /* @__PURE__ */ jsx(ReferenceLine, { y: 30, stroke: "hsl(0, 70%, 50%)", strokeDasharray: "4 4", strokeOpacity: 0.25, label: { value: "30 Obese", position: "insideTopRight", fontSize: 8, fill: "hsl(0, 70%, 50%)" } })
        ] }),
        activeChart === "bmi" && profile?.target_bmi && /* @__PURE__ */ jsx(
          ReferenceLine,
          {
            y: Number(profile.target_bmi),
            stroke: "hsl(210, 80%, 55%)",
            strokeDasharray: "8 4",
            strokeOpacity: 0.6,
            label: { value: `🎯 ${profile.target_bmi}`, position: "insideTopLeft", fontSize: 9, fill: "hsl(210, 80%, 55%)" }
          }
        ),
        activeChart === "bodyfat" && profile?.target_body_fat_percent && /* @__PURE__ */ jsx(
          ReferenceLine,
          {
            y: Number(profile.target_body_fat_percent),
            stroke: "hsl(340, 80%, 55%)",
            strokeDasharray: "8 4",
            strokeOpacity: 0.6,
            label: { value: `🎯 ${profile.target_body_fat_percent}%`, position: "insideTopLeft", fontSize: 9, fill: "hsl(340, 80%, 55%)" }
          }
        ),
        /* @__PURE__ */ jsx(
          Line,
          {
            type: "monotone",
            dataKey: activeChart === "bodyfat" ? "bodyfat" : activeChart,
            stroke: activeChart === "weight" ? "hsl(var(--primary))" : activeChart === "bmi" ? "hsl(210, 80%, 55%)" : "hsl(340, 80%, 55%)",
            strokeWidth: 2.5,
            dot: (props) => {
              const { cx, cy, index } = props;
              const isLast = index === filteredLogs.length - 1;
              const color = activeChart === "weight" ? "hsl(var(--primary))" : activeChart === "bmi" ? "hsl(210, 80%, 55%)" : "hsl(340, 80%, 55%)";
              return /* @__PURE__ */ jsx(
                "circle",
                {
                  cx,
                  cy,
                  r: isLast ? 6 : 3.5,
                  fill: isLast ? color : "hsl(var(--card))",
                  stroke: color,
                  strokeWidth: isLast ? 3 : 2
                },
                index
              );
            },
            activeDot: { r: 7, strokeWidth: 2.5 },
            connectNulls: true
          }
        )
      ]
    }
  ) }) });
}
export {
  WeightChart,
  WeightChart as default
};
