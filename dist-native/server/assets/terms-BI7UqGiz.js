import { jsx, jsxs } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
function TermsPage() {
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-[#0f1020] text-white", children: /* @__PURE__ */ jsxs("div", { className: "max-w-3xl mx-auto px-6 py-12", children: [
    /* @__PURE__ */ jsxs(Link, { to: "/", className: "inline-flex items-center gap-2 text-sm text-white/60 hover:text-white mb-8", children: [
      /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
      "Back to home"
    ] }),
    /* @__PURE__ */ jsx("h1", { className: "text-4xl font-bold tracking-tight", children: "Terms of Service" }),
    /* @__PURE__ */ jsxs("p", { className: "mt-2 text-white/50 text-sm", children: [
      "Last updated:",
      " ",
      (/* @__PURE__ */ new Date()).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
      })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-10 space-y-8 text-white/80 leading-relaxed", children: [
      /* @__PURE__ */ jsx(Section, { title: "1. Acceptance of terms", children: 'By creating an account or using ZyraFit ("the Service"), you agree to these Terms of Service. If you do not agree, please do not use the Service.' }),
      /* @__PURE__ */ jsx(Section, { title: "2. The service", children: "ZyraFit is a mobile and web application that helps you log meals, track calories and macronutrients, and monitor body composition over time. The Service may include AI-assisted features such as food photo recognition, which provide estimates and not medical advice." }),
      /* @__PURE__ */ jsx(Section, { title: "3. Your account", children: "You are responsible for maintaining the security of your account credentials and for all activity that occurs under your account. Notify us immediately of any unauthorized use." }),
      /* @__PURE__ */ jsx(Section, { title: "4. Acceptable use", children: "You agree not to misuse the Service, including but not limited to: reverse engineering, scraping, attempting to bypass security, uploading unlawful content, or using the Service to harass others." }),
      /* @__PURE__ */ jsx(Section, { title: "5. Health disclaimer", children: "ZyraFit is not a medical device or healthcare provider. Calorie and macro estimates, including AI photo recognition results, are approximate. Always consult a qualified healthcare professional before making significant changes to your diet, exercise, or health regimen." }),
      /* @__PURE__ */ jsx(Section, { title: "6. Intellectual property", children: "The Service, including its design, code, and trademarks, is owned by ZyraFit. You retain ownership of the content you upload (meals, photos, weight history). You grant us a limited license to store and process your content solely to provide the Service." }),
      /* @__PURE__ */ jsx(Section, { title: "7. Subscriptions and pricing", children: "The core ZyraFit experience is provided free of charge. Optional paid features, if offered, will be clearly disclosed before purchase. Refunds are handled in accordance with the App Store or Google Play policies where applicable." }),
      /* @__PURE__ */ jsx(Section, { title: "8. Termination", children: "You may delete your account at any time from within the app. We may suspend or terminate accounts that violate these Terms or engage in abusive behavior." }),
      /* @__PURE__ */ jsx(Section, { title: "9. Limitation of liability", children: 'To the maximum extent permitted by law, ZyraFit is provided "as is" without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages arising from your use of the Service.' }),
      /* @__PURE__ */ jsx(Section, { title: "10. Changes to these terms", children: "We may update these Terms from time to time. Material changes will be communicated through the app or by email. Continued use of the Service after changes constitutes acceptance." }),
      /* @__PURE__ */ jsxs(Section, { title: "11. Contact", children: [
        "Questions about these Terms? Reach us at",
        " ",
        /* @__PURE__ */ jsx("a", { className: "text-primary hover:underline", href: "mailto:hello@zyrafit.app", children: "hello@zyrafit.app" }),
        "."
      ] })
    ] })
  ] }) });
}
function Section({
  title,
  children
}) {
  return /* @__PURE__ */ jsxs("section", { children: [
    /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-white", children: title }),
    /* @__PURE__ */ jsx("div", { className: "mt-3 text-white/70", children })
  ] });
}
export {
  TermsPage as component
};
