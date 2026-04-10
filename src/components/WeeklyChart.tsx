import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";
import type { DaySummary } from "@/lib/food-store";

interface WeeklyChartProps {
  data: DaySummary[];
  goal: number;
}

export function WeeklyChart({ data, goal }: WeeklyChartProps) {
  const maxVal = Math.max(goal, ...data.map((d) => d.calories));

  return (
    <motion.div
      className="rounded-2xl bg-card p-5 shadow-sm border border-border/50"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-card-foreground">This Week</h2>
        <span className="text-xs text-muted-foreground">Goal: {goal} cal</span>
      </div>

      <div className="h-36">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap="20%">
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
            />
            <YAxis hide domain={[0, maxVal * 1.1]} />
            <Bar dataKey="calories" radius={[6, 6, 0, 0]} maxBarSize={28}>
              {data.map((entry, index) => {
                const isToday = index === data.length - 1;
                const overGoal = entry.calories > goal;
                return (
                  <Cell
                    key={entry.date}
                    fill={
                      isToday
                        ? "var(--color-primary)"
                        : overGoal
                          ? "var(--color-destructive)"
                          : "var(--color-muted)"
                    }
                    opacity={isToday ? 1 : 0.7}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center gap-4 mt-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-primary" /> Today
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-muted" /> Under goal
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-destructive" /> Over goal
        </span>
      </div>
    </motion.div>
  );
}
