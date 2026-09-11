import { jsx, jsxs } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import * as React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { ArrowLeft } from "lucide-react";
function cn(...inputs) {
  return twMerge(clsx(inputs));
}
const Card = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  "div",
  {
    ref,
    className: cn(
      "rounded-xl border bg-card text-card-foreground shadow",
      className
    ),
    ...props
  }
));
Card.displayName = "Card";
const CardHeader = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  "div",
  {
    ref,
    className: cn("flex flex-col space-y-1.5 p-6", className),
    ...props
  }
));
CardHeader.displayName = "CardHeader";
const CardTitle = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  "div",
  {
    ref,
    className: cn("font-semibold leading-none tracking-tight", className),
    ...props
  }
));
CardTitle.displayName = "CardTitle";
const CardDescription = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  "div",
  {
    ref,
    className: cn("text-sm text-muted-foreground", className),
    ...props
  }
));
CardDescription.displayName = "CardDescription";
const CardContent = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx("div", { ref, className: cn("p-6 pt-0", className), ...props }));
CardContent.displayName = "CardContent";
const CardFooter = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  "div",
  {
    ref,
    className: cn("flex items-center p-6 pt-0", className),
    ...props
  }
));
CardFooter.displayName = "CardFooter";
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline"
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);
const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return /* @__PURE__ */ jsx(
      Comp,
      {
        className: cn(buttonVariants({ variant, size, className })),
        ref,
        ...props
      }
    );
  }
);
Button.displayName = "Button";
function PrivacyPolicyPage() {
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-background", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-4xl px-4 py-8 pb-safe", children: [
    /* @__PURE__ */ jsxs(Link, { to: "/", className: "inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6", children: [
      /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
      "Back to Home"
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mb-8", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold tracking-tight mb-2", children: "Privacy Policy" }),
      /* @__PURE__ */ jsxs("p", { className: "text-muted-foreground", children: [
        "Last updated: ",
        (/* @__PURE__ */ new Date()).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric"
        })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "Introduction" }) }),
        /* @__PURE__ */ jsxs(CardContent, { className: "prose prose-sm max-w-none", children: [
          /* @__PURE__ */ jsx("p", { children: 'ZyraFit ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and services.' }),
          /* @__PURE__ */ jsx("p", { children: "By using ZyraFit, you agree to the collection and use of information in accordance with this policy." })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "Information We Collect" }) }),
        /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h3", { className: "font-semibold mb-2", children: "Personal Information" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mb-2", children: "When you create an account, we collect:" }),
            /* @__PURE__ */ jsxs("ul", { className: "list-disc list-inside text-sm text-muted-foreground space-y-1", children: [
              /* @__PURE__ */ jsx("li", { children: "Email address" }),
              /* @__PURE__ */ jsx("li", { children: "Name (if provided via social login)" }),
              /* @__PURE__ */ jsx("li", { children: "Profile picture (if provided via social login)" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h3", { className: "font-semibold mb-2", children: "Health & Fitness Data" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mb-2", children: "To provide personalized nutrition tracking, we collect:" }),
            /* @__PURE__ */ jsxs("ul", { className: "list-disc list-inside text-sm text-muted-foreground space-y-1", children: [
              /* @__PURE__ */ jsx("li", { children: "Age, gender, weight, and height" }),
              /* @__PURE__ */ jsx("li", { children: "Fitness goals and dietary preferences" }),
              /* @__PURE__ */ jsx("li", { children: "Daily food intake and nutritional information" }),
              /* @__PURE__ */ jsx("li", { children: "Body composition metrics (BMI, body fat percentage)" }),
              /* @__PURE__ */ jsx("li", { children: "Weight tracking history" }),
              /* @__PURE__ */ jsx("li", { children: "Photos of food (when using AI recognition feature)" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h3", { className: "font-semibold mb-2", children: "Usage Data" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mb-2", children: "We automatically collect:" }),
            /* @__PURE__ */ jsxs("ul", { className: "list-disc list-inside text-sm text-muted-foreground space-y-1", children: [
              /* @__PURE__ */ jsx("li", { children: "Device information (type, operating system, unique identifiers)" }),
              /* @__PURE__ */ jsx("li", { children: "App usage statistics and interactions" }),
              /* @__PURE__ */ jsx("li", { children: "Log data (IP address, browser type, pages visited, time spent)" })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "How We Use Your Information" }) }),
        /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs("ul", { className: "list-disc list-inside text-sm text-muted-foreground space-y-2", children: [
          /* @__PURE__ */ jsx("li", { children: "To provide and maintain our service" }),
          /* @__PURE__ */ jsx("li", { children: "To calculate personalized calorie and macro goals" }),
          /* @__PURE__ */ jsx("li", { children: "To enable AI-powered food recognition from photos" }),
          /* @__PURE__ */ jsx("li", { children: "To track your progress and display analytics" }),
          /* @__PURE__ */ jsx("li", { children: "To send you notifications about your goals and achievements" }),
          /* @__PURE__ */ jsx("li", { children: "To improve our app and develop new features" }),
          /* @__PURE__ */ jsx("li", { children: "To provide customer support" }),
          /* @__PURE__ */ jsx("li", { children: "To detect and prevent fraud or abuse" })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "Third-Party Services" }) }),
        /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h3", { className: "font-semibold mb-2", children: "Authentication" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "We use authentication services for secure sign-in:" }),
            /* @__PURE__ */ jsxs("ul", { className: "list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1", children: [
              /* @__PURE__ */ jsx("li", { children: "Google Sign-In (Google Privacy Policy)" }),
              /* @__PURE__ */ jsx("li", { children: "Apple Sign-In (Apple Privacy Policy)" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h3", { className: "font-semibold mb-2", children: "AI Services" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Food photos are processed using AI services to recognize nutritional content. Images are analyzed securely and are not stored permanently by third-party AI providers." })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h3", { className: "font-semibold mb-2", children: "Barcode Database" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "We use third-party barcode databases to retrieve nutritional information for scanned products." })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "Data Storage & Security" }) }),
        /* @__PURE__ */ jsxs(CardContent, { className: "space-y-3", children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Your data is stored securely using industry-standard encryption. We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction." }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your data, we cannot guarantee its absolute security." })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "Data Retention" }) }),
        /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "We retain your personal information only for as long as necessary to provide our services and fulfill the purposes outlined in this Privacy Policy. When you delete your account, we will delete or anonymize your personal data, except where we are required to retain it for legal compliance." }) })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "Your Rights" }) }),
        /* @__PURE__ */ jsxs(CardContent, { children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mb-2", children: "You have the right to:" }),
          /* @__PURE__ */ jsxs("ul", { className: "list-disc list-inside text-sm text-muted-foreground space-y-1", children: [
            /* @__PURE__ */ jsx("li", { children: "Access, update, or delete your personal information" }),
            /* @__PURE__ */ jsx("li", { children: "Export your data in a portable format" }),
            /* @__PURE__ */ jsx("li", { children: "Withdraw consent for data processing" }),
            /* @__PURE__ */ jsx("li", { children: "Object to processing of your personal data" }),
            /* @__PURE__ */ jsx("li", { children: "Request restriction of processing" }),
            /* @__PURE__ */ jsx("li", { children: "Lodge a complaint with a data protection authority" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mt-3", children: "To exercise these rights, please contact us using the information provided below." })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "Children's Privacy" }) }),
        /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us so we can delete it." }) })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "International Data Transfers" }) }),
        /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Your information may be transferred to and maintained on servers located outside of your state, province, country, or other governmental jurisdiction where data protection laws may differ. By using ZyraFit, you consent to such transfers." }) })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "California Privacy Rights (CCPA)" }) }),
        /* @__PURE__ */ jsxs(CardContent, { children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mb-2", children: "If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA):" }),
          /* @__PURE__ */ jsxs("ul", { className: "list-disc list-inside text-sm text-muted-foreground space-y-1", children: [
            /* @__PURE__ */ jsx("li", { children: "Right to know what personal information is collected" }),
            /* @__PURE__ */ jsx("li", { children: "Right to delete personal information" }),
            /* @__PURE__ */ jsx("li", { children: "Right to opt-out of the sale of personal information (we do not sell your data)" }),
            /* @__PURE__ */ jsx("li", { children: "Right to non-discrimination for exercising your rights" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "GDPR Compliance (European Users)" }) }),
        /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "If you are located in the European Economic Area (EEA), we process your data based on legitimate interests, contractual necessity, or your consent. You have the right to access, rectify, erase, restrict processing, data portability, and to object to processing under the General Data Protection Regulation (GDPR)." }) })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "Changes to This Privacy Policy" }) }),
        /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: 'We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.' }) })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "Contact Us" }) }),
        /* @__PURE__ */ jsxs(CardContent, { children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mb-3", children: "If you have any questions about this Privacy Policy or wish to exercise your privacy rights, please contact us:" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2 text-sm", children: [
            /* @__PURE__ */ jsxs("p", { children: [
              /* @__PURE__ */ jsx("strong", { children: "Email:" }),
              " ",
              /* @__PURE__ */ jsx("a", { href: "mailto:privacy@zyrafit.com", className: "text-primary hover:underline", children: "privacy@zyrafit.com" })
            ] }),
            /* @__PURE__ */ jsxs("p", { children: [
              /* @__PURE__ */ jsx("strong", { children: "Website:" }),
              " ",
              /* @__PURE__ */ jsx("a", { href: "https://somfitapp.com", className: "text-primary hover:underline", children: "somfitapp.com" })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "pt-4 pb-8", children: /* @__PURE__ */ jsx(Link, { to: "/", children: /* @__PURE__ */ jsxs(Button, { variant: "outline", className: "w-full", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4 mr-2" }),
        "Return to App"
      ] }) }) })
    ] })
  ] }) });
}
export {
  PrivacyPolicyPage as component
};
