import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { format, parseISO } from "date-fns";

export interface WeightLog {
  id: string;
  weight_kg: number;
  logged_at: string;
  bmi: number | null;
  body_fat_percent: number | null;
  body_fat_mass_kg: number | null;
  height_m: number | null;
}

interface WeightChartProps {
  filteredLogs: WeightLog[];
  activeChart: "weight" | "bmi" | "bodyfat";
  profile: {
    target_weight_kg: number | null;
    target_bmi: number | null;
    target_body_fat_percent: number | null;
  } | null;
}

export function WeightChart({ filteredLogs, activeChart, profile }: WeightChartProps) {
  return (
    <div className="h-52 -mx-2 rounded-xl overflow-hidden">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={filteredLogs.map((l) => ({
            date: format(parseISO(l.logged_at), "MMM d"),
            weight: l.weight_kg,
            bmi: l.bmi,
            bodyfat: l.body_fat_percent,
          }))}
          margin={{ top: 12, right: 16, bottom: 4, left: -4 }}
        >
          <defs>
            <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="bmiGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(210, 80%, 55%)" stopOpacity={0.15} />
              <stop offset="100%" stopColor="hsl(210, 80%, 55%)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="fatGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(340, 80%, 55%)" stopOpacity={0.15} />
              <stop offset="100%" stopColor="hsl(340, 80%, 55%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={["dataMin - 2", "dataMax + 2"]}
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
            width={38}
            tickFormatter={(v: number) => {
              if (activeChart === "bodyfat") return `${v}%`;
              if (activeChart === "weight") return `${v}`;
              return `${v}`;
            }}
          />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "14px",
              fontSize: "12px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
              padding: "10px 14px",
            }}
            formatter={(value: number) => {
              if (activeChart === "weight") return [`${value} kg`, "Weight"];
              if (activeChart === "bmi") return [value.toFixed(1), "BMI"];
              return [`${value}%`, "Body Fat"];
            }}
            labelStyle={{ fontWeight: 700, marginBottom: 4, fontSize: 11 }}
            cursor={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1, strokeDasharray: "4 4" }}
          />
          {activeChart === "weight" && profile?.target_weight_kg && (
            <ReferenceLine
              y={Number(profile.target_weight_kg)}
              stroke="hsl(var(--primary))"
              strokeDasharray="8 4"
              strokeOpacity={0.5}
              label={{ value: `Target ${profile.target_weight_kg}kg`, position: "insideTopRight", fontSize: 9, fill: "hsl(var(--primary))" }}
            />
          )}
          {activeChart === "bmi" && (
            <>
              <ReferenceLine y={18.5} stroke="hsl(210, 70%, 60%)" strokeDasharray="4 4" strokeOpacity={0.25} label={{ value: "18.5", position: "insideBottomLeft", fontSize: 8, fill: "hsl(210, 70%, 60%)" }} />
              <ReferenceLine y={25} stroke="hsl(var(--destructive))" strokeDasharray="6 4" strokeOpacity={0.4} label={{ value: "25 Overweight", position: "insideTopRight", fontSize: 8, fill: "hsl(var(--destructive))" }} />
              <ReferenceLine y={30} stroke="hsl(0, 70%, 50%)" strokeDasharray="4 4" strokeOpacity={0.25} label={{ value: "30 Obese", position: "insideTopRight", fontSize: 8, fill: "hsl(0, 70%, 50%)" }} />
            </>
          )}
          {activeChart === "bmi" && profile?.target_bmi && (
            <ReferenceLine
              y={Number(profile.target_bmi)}
              stroke="hsl(210, 80%, 55%)"
              strokeDasharray="8 4"
              strokeOpacity={0.6}
              label={{ value: `🎯 ${profile.target_bmi}`, position: "insideTopLeft", fontSize: 9, fill: "hsl(210, 80%, 55%)" }}
            />
          )}
          {activeChart === "bodyfat" && profile?.target_body_fat_percent && (
            <ReferenceLine
              y={Number(profile.target_body_fat_percent)}
              stroke="hsl(340, 80%, 55%)"
              strokeDasharray="8 4"
              strokeOpacity={0.6}
              label={{ value: `🎯 ${profile.target_body_fat_percent}%`, position: "insideTopLeft", fontSize: 9, fill: "hsl(340, 80%, 55%)" }}
            />
          )}
          <Line
            type="monotone"
            dataKey={activeChart === "bodyfat" ? "bodyfat" : activeChart}
            stroke={activeChart === "weight" ? "hsl(var(--primary))" : activeChart === "bmi" ? "hsl(210, 80%, 55%)" : "hsl(340, 80%, 55%)"}
            strokeWidth={2.5}
            dot={(props: Record<string, unknown>) => {
              const { cx, cy, index } = props as { cx: number; cy: number; index: number };
              const isLast = index === filteredLogs.length - 1;
              const color = activeChart === "weight" ? "hsl(var(--primary))" : activeChart === "bmi" ? "hsl(210, 80%, 55%)" : "hsl(340, 80%, 55%)";
              return (
                <circle
                  key={index}
                  cx={cx}
                  cy={cy}
                  r={isLast ? 6 : 3.5}
                  fill={isLast ? color : "hsl(var(--card))"}
                  stroke={color}
                  strokeWidth={isLast ? 3 : 2}
                />
              );
            }}
            activeDot={{ r: 7, strokeWidth: 2.5 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default WeightChart;
