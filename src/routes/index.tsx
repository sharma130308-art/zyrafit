import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Camera,
  Barcode,
  Sparkles,
  WifiOff,
  ShieldCheck,
  Zap,
  Check,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import zyrafitIcon from "@/assets/zyrafit-icon.png";
import heroPhone from "@/assets/landing-hero-phone.jpg";
import scanPhone from "@/assets/landing-feature-scan.jpg";

export const Route = createFileRoute("/")({
  component: LandingPage,
  head: () => ({
    meta: [
      { title: "ZyraFit — Snap your food. Skip the search bar." },
      {
        name: "description",
        content:
          "ZyraFit logs your calories and macros from a single photo. AI food recognition, barcode scanner, offline-first. Free to start.",
      },
      { property: "og:title", content: "ZyraFit — Snap your food. Skip the search bar." },
      {
        property: "og:description",
        content:
          "The calorie tracker that actually feels like 2026. AI photo logging, barcode scanning, and macros that match your goal.",
      },
    ],
  }),
});

function LandingPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [checkingProfile, setCheckingProfile] = useState(true);

  // If user is signed in AND has finished onboarding, send them straight to /app.
  useEffect(() => {
    if (loading) return;
    if (!user) {
      setCheckingProfile(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("user_profiles")
        .select("onboarding_completed")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (data?.onboarding_completed) {
        navigate({ to: "/app", replace: true });
      } else {
        setCheckingProfile(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, loading, navigate]);

  // Show a minimal splash while we decide whether to redirect signed-in users.
  if (loading || (user && checkingProfile)) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <motion.div
          className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-foreground antialiased">
      {/* ───── Top nav ───── */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-white/80 border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={zyrafitIcon} alt="" className="w-8 h-8 rounded-lg" />
            <span className="font-bold text-lg tracking-tight">ZyraFit</span>
          </Link>
          <nav className="hidden sm:flex items-center gap-7 text-sm text-muted-foreground">
            <a href="#how" className="hover:text-foreground transition-colors">How it works</a>
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
          </nav>
          <Link
            to="/login"
            className="text-sm font-medium px-4 py-2 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            Sign in
          </Link>
        </div>
      </header>

      {/* ───── Hero ───── */}
      <section className="relative overflow-hidden">
        {/* Glow */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-primary/10 blur-[120px]" />
        </div>

        <div className="max-w-6xl mx-auto px-6 pt-16 pb-20 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary border border-border text-xs text-muted-foreground mb-6">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              AI-powered food tracking
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
              Snap your food.<br />
              <span className="bg-gradient-to-r from-primary to-cyan-500 bg-clip-text text-transparent">
                Skip the search bar.
              </span>
            </h1>

            <p className="mt-5 text-lg text-muted-foreground max-w-xl leading-relaxed">
              ZyraFit logs your calories and macros from a single photo — no scrolling through
              200 chicken breasts, no $80/year paywall. Built for people who hate tracking but
              want results.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                to="/onboarding"
                className="group inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow"
              >
                Start free — no card, no spam
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#how"
                className="inline-flex items-center justify-center px-6 py-3.5 rounded-full bg-secondary border border-border text-foreground font-medium hover:bg-secondary/70 transition-colors"
              >
                See how it works
              </a>
            </div>

            <p className="mt-5 text-xs text-muted-foreground">
              Free forever core · iOS & Android coming soon · Works offline
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative"
          >
            <img
              src={heroPhone}
              alt="ZyraFit dashboard showing daily calorie ring and macros"
              width={1024}
              height={1024}
              className="w-full max-w-[480px] mx-auto drop-shadow-2xl"
            />
          </motion.div>
        </div>
      </section>

      {/* ───── Benefits strip ───── */}
      <section className="border-y border-border bg-muted/40">
        <div className="max-w-6xl mx-auto px-6 py-12 grid sm:grid-cols-3 gap-8">
          <Benefit
            icon={<Camera className="w-5 h-5" />}
            title="AI photo logging"
            body="Point, shoot, logged in 2 seconds. No typing."
          />
          <Benefit
            icon={<Zap className="w-5 h-5" />}
            title="Macros that match your goal"
            body="Personalized targets in under a minute."
          />
          <Benefit
            icon={<WifiOff className="w-5 h-5" />}
            title="Streaks that stick"
            body="Works offline, syncs everywhere, never nags."
          />
        </div>
      </section>

      {/* ───── How it works ───── */}
      <section id="how" className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-xs uppercase tracking-[0.18em] text-primary mb-3">How it works</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Three taps. Zero spreadsheets.
            </h2>
            <p className="mt-4 text-muted-foreground">
              We built ZyraFit for the 90% of people who give up on calorie tracking by week two.
              No more guessing portions, no more searching databases.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Step
              n="01"
              title="Snap a photo"
              body="Open the camera, take a shot of your meal. Works for restaurants, home-cooked, takeout — anything."
            />
            <Step
              n="02"
              title="Confirm in one tap"
              body="Our AI breaks the meal into items and estimates portions. Edit if you want, or just hit add."
            />
            <Step
              n="03"
              title="See your day"
              body="Calories and macros update in real time. A 7-day chart shows your trend at a glance."
            />
          </div>
        </div>
      </section>

      {/* ───── Feature spotlight ───── */}
      <section id="features" className="py-24 bg-muted/40 border-y border-border">
        <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-14 items-center">
          <div className="order-2 lg:order-1">
            <p className="text-xs uppercase tracking-[0.18em] text-primary mb-3">
              The killer feature
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Photo recognition that actually works.
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Most apps make you type, search, scroll, pick a portion size, then manually add each
              ingredient. ZyraFit looks at the plate and figures it out. Salmon, rice, avocado —
              one tap and it's logged.
            </p>
            <ul className="mt-6 space-y-3 text-foreground/85">
              {[
                "Detects multiple foods in a single photo",
                "Estimates portions from visual cues",
                "Falls back to barcode + manual when you need it",
                "Caches results so repeated scans are instant",
              ].map((line) => (
                <li key={line} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="order-1 lg:order-2">
            <img
              src={scanPhone}
              alt="ZyraFit scanning a bowl of salmon, rice and avocado"
              width={1024}
              height={1024}
              loading="lazy"
              className="w-full max-w-[460px] mx-auto rounded-3xl shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* ───── Comparison ───── */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-[0.18em] text-primary mb-3">
              Why ZyraFit
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Built different on purpose.
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <ComparisonCard
              kind="them"
              title="Other trackers"
              points={[
                "Search 8 entries before finding the right one",
                "Ads between every meal",
                "$80–$120/year for basics",
                "Useless without internet",
              ]}
            />
            <ComparisonCard
              kind="us"
              title="ZyraFit"
              points={[
                "One photo, multi-item recognition",
                "Zero ads — ever",
                "Free forever core, no surprise paywalls",
                "Offline-first, syncs when you're back",
              ]}
            />
          </div>
        </div>
      </section>

      {/* ───── FAQ ───── */}
      <section id="faq" className="py-24 bg-muted/40 border-t border-border">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-[0.18em] text-primary mb-3">
              Frequently asked
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Quick answers</h2>
          </div>

          <div className="space-y-3">
            <Faq
              q="Is it really free?"
              a="Yes — the core experience (photo logging, barcode, macros, streaks, offline) is free forever. We may add an optional pro tier later, but it will never lock you out of the basics."
            />
            <Faq
              q="How accurate is the photo scan?"
              a="It's not magic — it's a calibrated estimate. For most everyday meals it lands within 10–15% of the truth. You can always tap an item to fine-tune the portion."
            />
            <Faq
              q="What about my data?"
              a="Your meals, photos, and weight history are yours. We don't sell them, we don't share them. See our Privacy Policy for the full breakdown."
            />
            <Faq
              q="Does it work on iPhone and Android?"
              a="Today ZyraFit runs as a web app you can install to your home screen on any phone. Native iOS and Android apps are coming to the App Store and Play Store shortly."
            />
            <Faq
              q="What if I forget to log?"
              a="We send a gentle reminder once a day if you haven't logged. No nags, no guilt-tripping notifications."
            />
          </div>
        </div>
      </section>

      {/* ───── Final CTA ───── */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary mb-6">
            <ShieldCheck className="w-3.5 h-3.5" />
            Free forever core
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight">
            Stop tracking. Start logging.
          </h2>
          <p className="mt-5 text-lg text-muted-foreground">
            Two minutes to set up. One photo per meal. That's the whole job.
          </p>
          <Link
            to="/onboarding"
            className="mt-8 inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow"
          >
            Start free — no card, no spam
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ───── Footer ───── */}
      <footer className="border-t border-border py-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <img src={zyrafitIcon} alt="" className="w-7 h-7 rounded-md" />
            <span className="font-semibold">ZyraFit</span>
            <span className="text-muted-foreground text-sm">© {new Date().getFullYear()}</span>
          </div>
          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/privacy-policy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
            <a
              href="mailto:hello@zyrafit.app"
              className="hover:text-foreground transition-colors"
            >
              Contact
            </a>
            <Link to="/login" className="hover:text-foreground transition-colors">
              Sign in
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

function Benefit({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground mt-1">{body}</p>
      </div>
    </div>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="rounded-3xl bg-card border border-border p-7 shadow-sm hover:shadow-md transition-shadow">
      <div className="text-primary font-mono text-sm tracking-widest">{n}</div>
      <h3 className="mt-3 text-xl font-semibold">{title}</h3>
      <p className="mt-2 text-muted-foreground text-sm leading-relaxed">{body}</p>
    </div>
  );
}

function ComparisonCard({
  kind,
  title,
  points,
}: {
  kind: "us" | "them";
  title: string;
  points: string[];
}) {
  const isUs = kind === "us";
  return (
    <div
      className={`rounded-3xl p-7 border ${
        isUs
          ? "bg-primary/5 border-primary/30"
          : "bg-card border-border"
      }`}
    >
      <h3 className={`font-semibold ${isUs ? "text-primary" : "text-muted-foreground"}`}>{title}</h3>
      <ul className="mt-4 space-y-2.5">
        {points.map((p) => (
          <li key={p} className="flex items-start gap-2.5 text-sm">
            <span
              className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                isUs ? "bg-primary" : "bg-muted-foreground/40"
              }`}
            />
            <span className={isUs ? "text-foreground" : "text-muted-foreground"}>{p}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <details className="group rounded-2xl bg-card border border-border px-5 py-4 open:shadow-sm transition-shadow">
      <summary className="flex items-center justify-between cursor-pointer list-none">
        <span className="font-medium">{q}</span>
        <span className="text-primary text-xl leading-none transition-transform group-open:rotate-45">
          +
        </span>
      </summary>
      <p className="mt-3 text-muted-foreground text-sm leading-relaxed">{a}</p>
    </details>
  );
}
