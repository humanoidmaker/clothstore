import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Package, RotateCcw, CreditCard, User } from "lucide-react";

interface FAQSection {
  title: string;
  icon: React.ElementType;
  questions: { q: string; a: string }[];
}

const faqSections: FAQSection[] = [
  {
    title: "Orders & Shipping",
    icon: Package,
    questions: [
      {
        q: "How can I track my order?",
        a: 'Once your order is shipped, you will receive a tracking ID via email and SMS. You can also track your order by visiting the "My Orders" section in your account dashboard and clicking on the specific order.',
      },
      {
        q: "How long does shipping take?",
        a: "Standard shipping takes 5-7 business days for most locations across India. Metro cities typically receive orders within 3-5 business days, while remote areas may take 7-10 business days.",
      },
      {
        q: "What are the shipping charges?",
        a: "We offer free shipping on all orders above ₹999. For orders below ₹999, a flat shipping fee of ₹79 is charged. Express shipping is available at an additional cost of ₹149.",
      },
      {
        q: "Do you offer international shipping?",
        a: "Currently, we only ship within India. We are working on expanding our international shipping capabilities and hope to offer this service soon. Please subscribe to our newsletter for updates.",
      },
      {
        q: "Can I change the delivery address after placing an order?",
        a: "You can change the delivery address within 2 hours of placing your order by contacting our support team. Once the order has been processed or shipped, the address cannot be changed.",
      },
    ],
  },
  {
    title: "Returns & Refunds",
    icon: RotateCcw,
    questions: [
      {
        q: "What is your return policy?",
        a: "We accept returns within 7 days of delivery. The product must be unused, unworn, unwashed, and in its original packaging with all tags attached. Certain categories like innerwear and swimwear are non-returnable.",
      },
      {
        q: "How do I initiate a return?",
        a: 'Go to "My Orders" in your account, select the order, and click "Request Return." Choose the item(s) and reason for return. Our logistics partner will pick up the item from your address within 3-5 business days.',
      },
      {
        q: "How long do refunds take?",
        a: "Once we receive and inspect the returned item, refunds are processed within 5-7 business days. The amount will be credited to your original payment method. Bank processing may take an additional 2-3 days.",
      },
      {
        q: "Can I exchange a product instead of returning it?",
        a: "Yes, you can request an exchange for a different size or color of the same product, subject to availability. Go to your order details and select the \"Exchange\" option. Exchanges are processed within 7-10 business days.",
      },
      {
        q: "What if I receive a damaged or defective item?",
        a: "If you receive a damaged or defective item, please contact our support team within 48 hours of delivery with photos of the damage. We will arrange a free pickup and send a replacement or issue a full refund.",
      },
    ],
  },
  {
    title: "Payments",
    icon: CreditCard,
    questions: [
      {
        q: "What payment methods do you accept?",
        a: "We accept credit cards (Visa, Mastercard, Amex), debit cards, UPI (Google Pay, PhonePe, Paytm), net banking from all major Indian banks, and wallets like Paytm and Mobikwik. Cash on Delivery is also available for select pincodes.",
      },
      {
        q: "Is my payment information secure?",
        a: "Absolutely. We use industry-standard SSL encryption and are PCI-DSS compliant. All payment processing is handled by Razorpay, one of India's most trusted payment gateways. We never store your card details on our servers.",
      },
      {
        q: "Do you offer EMI options?",
        a: "EMI options are coming soon! We are working with major banks to offer no-cost and low-cost EMI on purchases above ₹3,000. Stay tuned for updates.",
      },
      {
        q: "What happens if my payment fails?",
        a: "If your payment fails, no amount will be deducted. If an amount is debited but the order is not confirmed, it will be automatically refunded within 5-7 business days. You can try placing the order again using the same or a different payment method.",
      },
    ],
  },
  {
    title: "Account",
    icon: User,
    questions: [
      {
        q: "How do I create an account?",
        a: 'Click the "Sign Up" button on the top right corner of the page. Enter your name, email, phone number, and create a password. You will receive a verification email — click the link to activate your account.',
      },
      {
        q: "I forgot my password. How do I reset it?",
        a: 'Click "Login" and then "Forgot Password." Enter your registered email address, and we will send you an OTP. Enter the OTP and set a new password.',
      },
      {
        q: "Can I delete my account?",
        a: "Yes, you can request account deletion by contacting our support team at support@clothstore.com. Please note that this action is irreversible and all your order history, saved addresses, and wishlist items will be permanently deleted.",
      },
    ],
  },
];

export default function FAQ() {
  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="border-b border-gray-100 bg-gray-50/50">
        <div className="mx-auto max-w-4xl px-4 py-3 sm:px-6">
          <Breadcrumbs items={[{ label: "FAQ" }]} />
        </div>
      </div>

      {/* Header */}
      <section className="bg-gradient-to-br from-[#1a1f36] via-[#1a1f36] to-[#2d3436]">
        <div className="mx-auto max-w-4xl px-4 py-12 text-center sm:px-6 md:py-16">
          <h1 className="text-3xl font-extrabold text-white md:text-4xl">
            Frequently Asked Questions
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-gray-300">
            Find answers to common questions about orders, shipping, returns,
            payments, and your account.
          </p>
        </div>
      </section>

      {/* FAQ Sections */}
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 md:py-16">
        <div className="space-y-10">
          {faqSections.map((section) => (
            <div key={section.title}>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1a1f36]/5">
                  <section.icon className="h-5 w-5 text-[#c8a96e]" />
                </div>
                <h2 className="text-xl font-bold text-[#1a1f36]">
                  {section.title}
                </h2>
              </div>
              <Accordion type="single" collapsible className="rounded-xl border border-gray-100 px-4">
                {section.questions.map((item, index) => (
                  <AccordionItem
                    key={index}
                    value={`${section.title}-${index}`}
                  >
                    <AccordionTrigger className="text-left text-sm md:text-base">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent>{item.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>

        {/* Still need help */}
        <div className="mt-12 rounded-xl border border-gray-100 bg-gray-50/50 p-6 text-center">
          <h3 className="text-lg font-bold text-[#1a1f36]">
            Still have questions?
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            Our support team is here to help. Reach out and we will get back to
            you within 24 hours.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <a
              href="mailto:support@clothstore.com"
              className="text-sm font-medium text-[#c8a96e] underline-offset-2 hover:underline"
            >
              support@clothstore.com
            </a>
            <span className="text-gray-300">|</span>
            <a
              href="tel:+919876543210"
              className="text-sm font-medium text-[#c8a96e] underline-offset-2 hover:underline"
            >
              +91 98765 43210
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
