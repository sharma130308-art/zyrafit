import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, LogIn } from "lucide-react";

export const Route = createFileRoute("/welcome")({
  component: WelcomePage,
  head: () => ({
    meta: [
      { title: "ZyraFit — Welcome" },
      { name: "description", content: "Track your calories and macros effortlessly. Get started or sign in." },
    ],
  }),
});

function WelcomePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <motion.div
        className="w-full max-w-sm text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >

        <div className="space-y-3">
          <Link to="/onboarding">
            <motion.div
              whileTap={{ scale: 0.97 }}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/25"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </motion.div>
          </Link>

          <Link to="/login">
            <motion.div
              whileTap={{ scale: 0.97 }}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-card border border-border/50 text-foreground font-medium hover:bg-accent transition-colors mt-3"
            >
              <LogIn className="w-4 h-4" />
              I already have an account
            </motion.div>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
