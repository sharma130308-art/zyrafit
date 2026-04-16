import { motion } from "framer-motion";

function Shimmer({ className }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-muted/50 ${className ?? ""}`}>
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, var(--color-muted) 50%, transparent 100%)",
        }}
        animate={{ x: ["-100%", "200%"] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="px-6 pt-14 pb-2">
        <Shimmer className="h-4 w-16 mb-2 rounded-lg" />
        <Shimmer className="h-7 w-32 rounded-xl" />
      </div>

      {/* Calorie Ring */}
      <div className="flex justify-center py-6">
        <div className="relative w-52 h-52 flex items-center justify-center">
          <Shimmer className="w-full h-full rounded-full" />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <Shimmer className="h-10 w-24 rounded-xl" />
            <Shimmer className="h-3 w-16 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Eaten / Goal */}
      <div className="flex justify-center gap-8 mb-6">
        <div className="flex flex-col items-center gap-1">
          <Shimmer className="h-6 w-10 rounded-lg" />
          <Shimmer className="h-3 w-12 rounded-lg" />
        </div>
        <div className="h-10 w-px bg-border" />
        <div className="flex flex-col items-center gap-1">
          <Shimmer className="h-6 w-12 rounded-lg" />
          <Shimmer className="h-3 w-10 rounded-lg" />
        </div>
      </div>

      {/* Macros Card */}
      <div className="px-6 mb-6">
        <div className="rounded-2xl bg-card p-4 shadow-sm border border-border/50 flex gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <Shimmer className="h-5 w-10 rounded-lg" />
              <Shimmer className="h-2 w-full rounded-full" />
              <Shimmer className="h-3 w-14 rounded-lg" />
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Chart */}
      <div className="px-6 mb-6">
        <Shimmer className="h-40 w-full" />
      </div>

      {/* Meal Sections */}
      <div className="px-6 space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <div className="rounded-2xl bg-card p-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] border border-border/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Shimmer className="w-6 h-6 rounded-lg" />
                  <Shimmer className="h-4 w-20 rounded-lg" />
                </div>
                <Shimmer className="w-7 h-7 rounded-xl" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
