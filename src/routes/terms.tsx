import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — ZyraFit" },
      {
        name: "description",
        content: "The terms and conditions for using ZyraFit.",
      },
      { property: "og:title", content: "Terms of Service — ZyraFit" },
      {
        property: "og:description",
        content: "The terms and conditions for using ZyraFit.",
      },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0f1020] text-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <h1 className="text-4xl font-bold tracking-tight">Terms of Service</h1>
        <p className="mt-2 text-white/50 text-sm">
          Last updated:{" "}
          {new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>

        <div className="mt-10 space-y-8 text-white/80 leading-relaxed">
          <Section title="1. Acceptance of terms">
            By creating an account or using ZyraFit ("the Service"), you agree to these Terms of
            Service. If you do not agree, please do not use the Service.
          </Section>

          <Section title="2. The service">
            ZyraFit is a mobile and web application that helps you log meals, track calories and
            macronutrients, and monitor body composition over time. The Service may include
            AI-assisted features such as food photo recognition, which provide estimates and not
            medical advice.
          </Section>

          <Section title="3. Your account">
            You are responsible for maintaining the security of your account credentials and for
            all activity that occurs under your account. Notify us immediately of any unauthorized
            use.
          </Section>

          <Section title="4. Acceptable use">
            You agree not to misuse the Service, including but not limited to: reverse engineering,
            scraping, attempting to bypass security, uploading unlawful content, or using the
            Service to harass others.
          </Section>

          <Section title="5. Health disclaimer">
            ZyraFit is not a medical device or healthcare provider. Calorie and macro estimates,
            including AI photo recognition results, are approximate. Always consult a qualified
            healthcare professional before making significant changes to your diet, exercise, or
            health regimen.
          </Section>

          <Section title="6. Intellectual property">
            The Service, including its design, code, and trademarks, is owned by ZyraFit. You retain
            ownership of the content you upload (meals, photos, weight history). You grant us a
            limited license to store and process your content solely to provide the Service.
          </Section>

          <Section title="7. Subscriptions and pricing">
            The core ZyraFit experience is provided free of charge. Optional paid features, if
            offered, will be clearly disclosed before purchase. Refunds are handled in accordance
            with the App Store or Google Play policies where applicable.
          </Section>

          <Section title="8. Termination">
            You may delete your account at any time from within the app. We may suspend or terminate
            accounts that violate these Terms or engage in abusive behavior.
          </Section>

          <Section title="9. Limitation of liability">
            To the maximum extent permitted by law, ZyraFit is provided "as is" without warranties
            of any kind. We are not liable for any indirect, incidental, or consequential damages
            arising from your use of the Service.
          </Section>

          <Section title="10. Changes to these terms">
            We may update these Terms from time to time. Material changes will be communicated
            through the app or by email. Continued use of the Service after changes constitutes
            acceptance.
          </Section>

          <Section title="11. Contact">
            Questions about these Terms? Reach us at{" "}
            <a className="text-primary hover:underline" href="mailto:hello@zyrafit.app">
              hello@zyrafit.app
            </a>
            .
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <div className="mt-3 text-white/70">{children}</div>
    </section>
  );
}
