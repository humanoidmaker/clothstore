import { Breadcrumbs } from "@/components/shared/Breadcrumbs";

const sections = [
  {
    title: "1. Information We Collect",
    content: `We collect the following types of information when you use our Platform:

Personal Information: When you create an account, place an order, or contact us, we collect information such as your name, email address, phone number, shipping address, and billing address.

Payment Information: When you make a purchase, payment details are collected and processed by our payment gateway partner (Razorpay). We do not store your full credit card number, CVV, or banking credentials on our servers.

Usage Data: We automatically collect information about how you interact with our Platform, including your IP address, browser type, device information, pages visited, time spent on pages, and referring URLs.

Cookies & Tracking Technologies: We use cookies, web beacons, and similar technologies to enhance your experience, remember your preferences, and analyze Platform usage. You can manage cookie preferences through your browser settings.`,
  },
  {
    title: "2. How We Use Your Information",
    content: `We use the information we collect for the following purposes:

- To process and fulfill your orders, including shipping and payment processing.
- To create and manage your account on our Platform.
- To communicate with you about your orders, account, and customer support inquiries.
- To send promotional emails, newsletters, and marketing communications (you can opt out at any time).
- To personalize your experience and show relevant product recommendations.
- To improve our Platform, products, and services through analytics and research.
- To detect, prevent, and address fraud, security issues, and technical problems.
- To comply with legal obligations and enforce our Terms and Conditions.`,
  },
  {
    title: "3. Information Sharing",
    content: `We do not sell your personal information to third parties. We may share your information with:

Service Providers: We share information with trusted third-party service providers who assist us in operating our Platform, processing payments (Razorpay), shipping orders (Delhivery, Blue Dart, DTDC), sending communications, and analyzing data. These providers are contractually obligated to protect your information and use it only for the purposes we specify.

Legal Requirements: We may disclose your information if required by law, court order, or government regulation, or if we believe disclosure is necessary to protect our rights, safety, or the safety of others.

Business Transfers: In the event of a merger, acquisition, or sale of assets, your information may be transferred to the acquiring entity.`,
  },
  {
    title: "4. Cookies",
    content: `We use the following types of cookies:

Essential Cookies: Required for the Platform to function properly (e.g., authentication, shopping cart).

Functional Cookies: Remember your preferences such as language and display settings.

Analytics Cookies: Help us understand how visitors use our Platform through services like Google Analytics.

Marketing Cookies: Used to track visitors across websites and display relevant advertisements.

You can control cookie settings through your browser. Please note that disabling certain cookies may affect the functionality of our Platform.`,
  },
  {
    title: "5. Data Security",
    content: `We implement industry-standard security measures to protect your personal information, including:

- SSL/TLS encryption for all data transmitted between your browser and our servers.
- PCI-DSS compliant payment processing through Razorpay.
- Regular security audits and vulnerability assessments.
- Access controls and authentication mechanisms for our internal systems.
- Secure data storage with encryption at rest.

While we take reasonable measures to protect your information, no method of transmission over the Internet or electronic storage is 100% secure. We cannot guarantee absolute security but will notify you of any data breach that may affect your personal information.`,
  },
  {
    title: "6. Your Rights",
    content: `You have the following rights regarding your personal information:

Access: You can request a copy of the personal information we hold about you.
Correction: You can update or correct your personal information through your account settings or by contacting us.
Deletion: You can request deletion of your account and personal data by contacting our support team. Please note that we may retain certain information as required by law or for legitimate business purposes.
Opt-Out: You can unsubscribe from marketing communications at any time using the "Unsubscribe" link in our emails or by updating your communication preferences in your account settings.
Data Portability: You can request a copy of your data in a structured, machine-readable format.

To exercise any of these rights, please contact us at privacy@clothstore.com.`,
  },
  {
    title: "7. Children's Privacy",
    content: `Our Platform is not intended for children under the age of 18. We do not knowingly collect personal information from children under 18. If we become aware that we have collected personal information from a child under 18 without parental consent, we will take steps to delete that information promptly. If you believe we have inadvertently collected information from a child, please contact us at privacy@clothstore.com.`,
  },
  {
    title: "8. Changes to This Policy",
    content: `We may update this Privacy Policy from time to time to reflect changes in our practices, technologies, legal requirements, or other factors. We will notify you of any material changes by posting the updated policy on our Platform and, where appropriate, sending you a notification via email. Your continued use of the Platform after any changes constitutes your acceptance of the updated policy. We encourage you to review this policy periodically.`,
  },
  {
    title: "9. Contact Us",
    content: `If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:

ClothStore - Data Protection Team
123 Fashion Street, Andheri West
Mumbai 400058, Maharashtra, India
Email: privacy@clothstore.com
Phone: +91 98765 43210`,
  },
];

export default function Privacy() {
  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="border-b border-gray-100 bg-gray-50/50">
        <div className="mx-auto max-w-4xl px-4 py-3 sm:px-6">
          <Breadcrumbs items={[{ label: "Privacy Policy" }]} />
        </div>
      </div>

      {/* Header */}
      <section className="bg-gradient-to-br from-[#1a1f36] via-[#1a1f36] to-[#2d3436]">
        <div className="mx-auto max-w-4xl px-4 py-12 text-center sm:px-6 md:py-16">
          <h1 className="text-3xl font-extrabold text-white md:text-4xl">
            Privacy Policy
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-gray-300">
            Your privacy matters to us. Learn how we collect, use, and protect
            your information.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 md:py-16">
        <div className="space-y-8">
          {sections.map((section) => (
            <div key={section.title}>
              <h2 className="mb-3 text-lg font-bold text-[#1a1f36]">
                {section.title}
              </h2>
              <div className="whitespace-pre-line text-sm leading-relaxed text-gray-600">
                {section.content}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-xl border border-gray-100 bg-gray-50/50 p-6">
          <p className="text-xs text-gray-400">
            Effective Date: January 1, 2025 | Last Updated: January 2025
          </p>
        </div>
      </section>
    </div>
  );
}
