import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "@tanstack/react-router";
import { Phone, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { isValidPhoneNumber, phoneToEmail, normalizePhone } from "@/lib/phone-auth";
import { StepContainer } from "./StepContainer";

export function SignupStep({
  onAccountCreated,
  onComplete,
}: {
  onAccountCreated: (userId: string) => Promise<void>;
  onComplete?: () => void;
}) {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // If user returns from OAuth flow already authenticated, advance immediately.
  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (active && data.user && onComplete) {
        // Profile is saved by parent on subsequent flow; proceed to notifications.
        onComplete();
      }
    });
    return () => {
      active = false;
    };
  }, [onComplete]);

  const canSubmit = isValidPhoneNumber(phone) && password.length >= 6;

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    if (!isValidPhoneNumber(phone)) {
      setAuthError("Enter a valid phone number.");
      setAuthLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: phoneToEmail(phone),
      password,
    });

    if (error) {
      setAuthError(
        error.message.toLowerCase().includes("already")
          ? "That number already has an account. Sign in instead."
          : error.message,
      );
      setAuthLoading(false);
      return;
    }

    if (data.user) {
      await onAccountCreated(data.user.id);
      await supabase
        .from("user_profiles")
        .update({ phone: `+${normalizePhone(phone)}` })
        .eq("user_id", data.user.id);
      setAuthLoading(false);
      if (onComplete) {
        onComplete();
      } else {
        navigate({ to: "/app" });
      }
    } else {
      setAuthLoading(false);
      setAuthError("Could not create your account. Please try again.");
    }
  };

  const handleGoogleSignUp = async () => {
    setAuthError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setAuthError(result.error instanceof Error ? result.error.message : "Google sign-in failed");
    }
  };

  const handleAppleSignUp = async () => {
    setAuthError(null);
    const result = await lovable.auth.signInWithOAuth("apple", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setAuthError(result.error instanceof Error ? result.error.message : "Apple sign-in failed");
    }
  };

  return (
    <StepContainer
      icon={<Phone className="w-6 h-6" />}
      title="Create your account"
      subtitle="Sign up with your phone number"
    >
      <form onSubmit={handleSignUp} className="space-y-4">
        <div className="relative">
          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="Phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-card border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full pl-11 pr-11 py-3.5 rounded-2xl bg-card border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>


        {authError && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-destructive text-center bg-destructive/10 rounded-xl px-4 py-2"
          >
            {authError}
          </motion.p>
        )}

        <motion.button
          type="submit"
          disabled={authLoading || !canSubmit}
          whileTap={{ scale: 0.97 }}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/25 disabled:opacity-40"
        >
          {authLoading ? (
            <motion.div
              className="w-5 h-5 rounded-full border-2 border-primary-foreground border-t-transparent"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          ) : (
            <>
              Create Account
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </motion.button>
      </form>

      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">or continue with</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <div className="flex gap-3">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleGoogleSignUp}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-card border border-border/50 text-foreground font-medium hover:bg-accent transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Google
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleAppleSignUp}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-card border border-border/50 text-foreground font-medium hover:bg-accent transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
          Apple
        </motion.button>
      </div>

      <p className="text-center text-sm text-muted-foreground mt-5">
        Already have an account?{" "}
        <Link to="/login" className="text-primary font-medium">
          Sign In
        </Link>
      </p>
    </StepContainer>
  );
}
