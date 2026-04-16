import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — ZyraFit" },
      { name: "description", content: "ZyraFit's privacy policy outlining data collection, usage, and user rights." },
      { property: "og:title", content: "Privacy Policy — ZyraFit" },
      { property: "og:description", content: "Learn how ZyraFit protects your data and privacy." },
    ],
  }),
  component: PrivacyPolicyPage,
});

function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8 pb-safe">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Introduction</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>
                ZyraFit ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and services.
              </p>
              <p>
                By using ZyraFit, you agree to the collection and use of information in accordance with this policy.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Information We Collect</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Personal Information</h3>
                <p className="text-sm text-muted-foreground mb-2">When you create an account, we collect:</p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Email address</li>
                  <li>Name (if provided via social login)</li>
                  <li>Profile picture (if provided via social login)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Health & Fitness Data</h3>
                <p className="text-sm text-muted-foreground mb-2">To provide personalized nutrition tracking, we collect:</p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Age, gender, weight, and height</li>
                  <li>Fitness goals and dietary preferences</li>
                  <li>Daily food intake and nutritional information</li>
                  <li>Body composition metrics (BMI, body fat percentage)</li>
                  <li>Weight tracking history</li>
                  <li>Photos of food (when using AI recognition feature)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Usage Data</h3>
                <p className="text-sm text-muted-foreground mb-2">We automatically collect:</p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Device information (type, operating system, unique identifiers)</li>
                  <li>App usage statistics and interactions</li>
                  <li>Log data (IP address, browser type, pages visited, time spent)</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How We Use Your Information</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
                <li>To provide and maintain our service</li>
                <li>To calculate personalized calorie and macro goals</li>
                <li>To enable AI-powered food recognition from photos</li>
                <li>To track your progress and display analytics</li>
                <li>To send you notifications about your goals and achievements</li>
                <li>To improve our app and develop new features</li>
                <li>To provide customer support</li>
                <li>To detect and prevent fraud or abuse</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Third-Party Services</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Authentication</h3>
                <p className="text-sm text-muted-foreground">
                  We use authentication services for secure sign-in:
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                  <li>Google Sign-In (Google Privacy Policy)</li>
                  <li>Apple Sign-In (Apple Privacy Policy)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">AI Services</h3>
                <p className="text-sm text-muted-foreground">
                  Food photos are processed using AI services to recognize nutritional content. Images are analyzed securely and are not stored permanently by third-party AI providers.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Barcode Database</h3>
                <p className="text-sm text-muted-foreground">
                  We use third-party barcode databases to retrieve nutritional information for scanned products.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Storage & Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Your data is stored securely using industry-standard encryption. We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
              </p>
              <p className="text-sm text-muted-foreground">
                However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your data, we cannot guarantee its absolute security.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Retention</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                We retain your personal information only for as long as necessary to provide our services and fulfill the purposes outlined in this Privacy Policy. When you delete your account, we will delete or anonymize your personal data, except where we are required to retain it for legal compliance.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Rights</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">You have the right to:</p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Access, update, or delete your personal information</li>
                <li>Export your data in a portable format</li>
                <li>Withdraw consent for data processing</li>
                <li>Object to processing of your personal data</li>
                <li>Request restriction of processing</li>
                <li>Lodge a complaint with a data protection authority</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-3">
                To exercise these rights, please contact us using the information provided below.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Children's Privacy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us so we can delete it.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>International Data Transfers</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Your information may be transferred to and maintained on servers located outside of your state, province, country, or other governmental jurisdiction where data protection laws may differ. By using ZyraFit, you consent to such transfers.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>California Privacy Rights (CCPA)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">
                If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA):
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Right to know what personal information is collected</li>
                <li>Right to delete personal information</li>
                <li>Right to opt-out of the sale of personal information (we do not sell your data)</li>
                <li>Right to non-discrimination for exercising your rights</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>GDPR Compliance (European Users)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                If you are located in the European Economic Area (EEA), we process your data based on legitimate interests, contractual necessity, or your consent. You have the right to access, rectify, erase, restrict processing, data portability, and to object to processing under the General Data Protection Regulation (GDPR).
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Changes to This Privacy Policy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Us</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                If you have any questions about this Privacy Policy or wish to exercise your privacy rights, please contact us:
              </p>
              <div className="space-y-2 text-sm">
                <p><strong>Email:</strong> <a href="mailto:privacy@zyrafit.com" className="text-primary hover:underline">privacy@zyrafit.com</a></p>
                <p><strong>Website:</strong> <a href="https://somfitapp.com" className="text-primary hover:underline">somfitapp.com</a></p>
              </div>
            </CardContent>
          </Card>

          <div className="pt-4 pb-8">
            <Link to="/">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Return to App
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
