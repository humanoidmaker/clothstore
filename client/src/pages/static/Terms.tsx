import { Breadcrumbs } from "@/components/shared/Breadcrumbs";

const sections = [
  {
    title: "1. Introduction",
    content: `Welcome to ClothStore ("we," "us," or "our"). These Terms and Conditions ("Terms") govern your use of our website at clothstore.com and our mobile applications (collectively, the "Platform"), as well as any purchases you make through the Platform. By accessing or using our Platform, you agree to be bound by these Terms. If you do not agree with any part of these Terms, please do not use our Platform.`,
  },
  {
    title: "2. Account Terms",
    content: `To make purchases on our Platform, you must create an account. You must provide accurate, complete, and up-to-date information during registration. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must be at least 18 years of age to create an account. If you are under 18, you may use the Platform only with the involvement of a parent or guardian. We reserve the right to suspend or terminate your account if we suspect any unauthorized use, fraudulent activity, or violation of these Terms.`,
  },
  {
    title: "3. Products & Pricing",
    content: `We strive to display product information, descriptions, and images as accurately as possible. However, we do not guarantee that product descriptions, colors, or other content on the Platform are accurate, complete, or error-free. Actual product colors may vary slightly due to screen settings. All prices displayed on the Platform are in Indian Rupees (INR) and are inclusive of applicable taxes unless stated otherwise. We reserve the right to modify prices at any time without prior notice. Prices applicable at the time of placing your order will be honored for that transaction. In the event of a pricing error, we reserve the right to cancel the order and issue a full refund.`,
  },
  {
    title: "4. Orders & Payments",
    content: `Placing an order on our Platform constitutes an offer to purchase. We reserve the right to accept or decline your order for any reason, including stock unavailability, pricing errors, or suspected fraudulent activity. Upon successful payment, you will receive an order confirmation email. This confirmation does not guarantee delivery; it confirms that we have received your order. We accept payments through credit cards, debit cards, UPI, net banking, digital wallets, and Cash on Delivery (where available). All online payments are processed through secure, PCI-DSS compliant payment gateways. We do not store your card details on our servers.`,
  },
  {
    title: "5. Shipping & Delivery",
    content: `We aim to deliver your orders within the estimated timeframes provided at checkout. Delivery times are estimates and may vary based on your location, product availability, and other factors. Risk of loss and title for items pass to you upon delivery to the shipping carrier. For detailed information about shipping methods, timeframes, and charges, please refer to our Shipping Policy page. We are not responsible for delays caused by courier partners, natural disasters, strikes, or other force majeure events.`,
  },
  {
    title: "6. Returns & Refunds",
    content: `We offer returns within 7 days of delivery, subject to the conditions outlined in our Return Policy. Refunds for eligible returns are processed within 5-7 business days of receiving the returned item. Certain items, including innerwear, swimwear, and customized products, are non-returnable. For complete details, please refer to our Return Policy page. We reserve the right to refuse returns that do not meet our return conditions.`,
  },
  {
    title: "7. Privacy",
    content: `Your privacy is important to us. Our collection, use, and handling of your personal information is governed by our Privacy Policy, which is incorporated into these Terms by reference. By using our Platform, you consent to the data practices described in our Privacy Policy.`,
  },
  {
    title: "8. Intellectual Property",
    content: `All content on the Platform, including but not limited to text, graphics, logos, images, product descriptions, software, and the compilation thereof, is the property of ClothStore or its content suppliers and is protected by Indian and international copyright, trademark, and other intellectual property laws. You may not reproduce, distribute, modify, create derivative works of, publicly display, or commercially exploit any content from our Platform without our prior written consent. The ClothStore name, logo, and all related names, logos, product and service names, designs, and slogans are trademarks of ClothStore. You may not use such marks without our prior written permission.`,
  },
  {
    title: "9. Limitation of Liability",
    content: `To the fullest extent permitted by applicable law, ClothStore, its directors, employees, partners, agents, and affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or goodwill, arising out of or in connection with your use of the Platform or any products purchased through the Platform. Our total liability to you for any claims arising from your use of the Platform or purchases shall not exceed the amount you paid to us for the specific product giving rise to the claim. Nothing in these Terms shall exclude or limit liability for death or personal injury caused by negligence, fraud, or any other liability that cannot be excluded by law.`,
  },
  {
    title: "10. Governing Law",
    content: `These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising out of or relating to these Terms or your use of the Platform shall be subject to the exclusive jurisdiction of the courts in Mumbai, Maharashtra, India. If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.`,
  },
  {
    title: "11. Changes to Terms",
    content: `We reserve the right to update or modify these Terms at any time. Changes will be effective upon posting on the Platform. Your continued use of the Platform after any changes constitutes your acceptance of the updated Terms. We encourage you to review these Terms periodically.`,
  },
  {
    title: "12. Contact Us",
    content: `If you have any questions about these Terms and Conditions, please contact us:\n\nClothStore\n123 Fashion Street, Andheri West\nMumbai 400058, Maharashtra, India\nEmail: legal@clothstore.com\nPhone: +91 98765 43210`,
  },
];

export default function Terms() {
  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="border-b border-gray-100 bg-gray-50/50">
        <div className="mx-auto max-w-4xl px-4 py-3 sm:px-6">
          <Breadcrumbs items={[{ label: "Terms & Conditions" }]} />
        </div>
      </div>

      {/* Header */}
      <section className="bg-gradient-to-br from-[#1a1f36] via-[#1a1f36] to-[#2d3436]">
        <div className="mx-auto max-w-4xl px-4 py-12 text-center sm:px-6 md:py-16">
          <h1 className="text-3xl font-extrabold text-white md:text-4xl">
            Terms & Conditions
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-gray-300">
            Please read these terms carefully before using our platform.
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
