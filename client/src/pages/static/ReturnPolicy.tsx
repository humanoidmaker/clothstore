import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import {
  RotateCcw,
  CheckCircle2,
  ListOrdered,
  CreditCard,
  ArrowLeftRight,
  XCircle,
  Mail,
} from "lucide-react";

export default function ReturnPolicy() {
  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="border-b border-gray-100 bg-gray-50/50">
        <div className="mx-auto max-w-4xl px-4 py-3 sm:px-6">
          <Breadcrumbs items={[{ label: "Return Policy" }]} />
        </div>
      </div>

      {/* Header */}
      <section className="bg-gradient-to-br from-[#1a1f36] via-[#1a1f36] to-[#2d3436]">
        <div className="mx-auto max-w-4xl px-4 py-12 text-center sm:px-6 md:py-16">
          <h1 className="text-3xl font-extrabold text-white md:text-4xl">
            Return & Refund Policy
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-gray-300">
            We want you to be completely happy with your purchase. Here is how
            our return process works.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 md:py-16">
        <div className="space-y-10">
          {/* Eligibility */}
          <div>
            <div className="mb-4 flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-[#c8a96e]" />
              <h2 className="text-xl font-bold text-[#1a1f36]">
                Return Eligibility
              </h2>
            </div>
            <div className="prose max-w-none text-[#2d3436]">
              <p>
                You may return most items purchased from ClothStore within{" "}
                <strong>7 days of delivery</strong>, provided the following
                conditions are met:
              </p>
              <ul>
                <li>The item is unworn, unwashed, and unused.</li>
                <li>
                  All original tags, labels, and packaging are intact and
                  attached.
                </li>
                <li>The item is in its original condition without any damage.</li>
                <li>
                  The return request is raised within 7 days of the delivery
                  date.
                </li>
                <li>
                  Items purchased during sale events are eligible for return
                  unless explicitly marked as "final sale."
                </li>
              </ul>
            </div>
          </div>

          {/* How to Return */}
          <div>
            <div className="mb-4 flex items-center gap-3">
              <ListOrdered className="h-6 w-6 text-[#c8a96e]" />
              <h2 className="text-xl font-bold text-[#1a1f36]">
                How to Initiate a Return
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  step: "1",
                  title: "Request a Return",
                  desc: 'Log in to your account, go to "My Orders," select the order, and click "Request Return." Choose the items and reason.',
                },
                {
                  step: "2",
                  title: "Pack & Hand Over",
                  desc: "Pack the item securely in its original packaging. Our logistics partner will schedule a pickup within 3-5 business days.",
                },
                {
                  step: "3",
                  title: "Receive Refund",
                  desc: "Once we receive and inspect the item, your refund will be processed within 5-7 business days to your original payment method.",
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="rounded-xl border border-gray-100 bg-gray-50/50 p-5"
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#1a1f36] text-sm font-bold text-white">
                    {item.step}
                  </div>
                  <h3 className="mb-1 text-sm font-bold text-[#1a1f36]">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Refund Process */}
          <div>
            <div className="mb-4 flex items-center gap-3">
              <CreditCard className="h-6 w-6 text-[#c8a96e]" />
              <h2 className="text-xl font-bold text-[#1a1f36]">
                Refund Process
              </h2>
            </div>
            <div className="prose max-w-none text-[#2d3436]">
              <p>
                Once your returned item is received at our warehouse and passes
                quality inspection, the refund process begins:
              </p>
              <ul>
                <li>
                  <strong>Online Payments (Credit/Debit/UPI/Net Banking):</strong>{" "}
                  Refund is credited to the original payment method within 5-7
                  business days. Bank processing may take an additional 2-3 days.
                </li>
                <li>
                  <strong>Cash on Delivery (COD) Orders:</strong> Refund is
                  processed via bank transfer. You will be asked to provide your
                  bank account details.
                </li>
                <li>
                  Shipping charges (if any were paid) are non-refundable unless
                  the return is due to a defective or incorrect item.
                </li>
              </ul>
            </div>
          </div>

          {/* Exchange Policy */}
          <div>
            <div className="mb-4 flex items-center gap-3">
              <ArrowLeftRight className="h-6 w-6 text-[#c8a96e]" />
              <h2 className="text-xl font-bold text-[#1a1f36]">
                Exchange Policy
              </h2>
            </div>
            <div className="prose max-w-none text-[#2d3436]">
              <p>
                We offer exchanges for a different size or color of the same
                product, subject to stock availability. To request an exchange:
              </p>
              <ul>
                <li>
                  Raise a return request and select "Exchange" as the reason.
                </li>
                <li>
                  Choose the desired size or color from the available options.
                </li>
                <li>
                  The exchange item will be shipped once we receive and verify
                  the returned item. Total processing time is approximately 7-10
                  business days.
                </li>
                <li>
                  If the desired variant is out of stock, we will issue a full
                  refund instead.
                </li>
              </ul>
            </div>
          </div>

          {/* Non-Returnable Items */}
          <div>
            <div className="mb-4 flex items-center gap-3">
              <XCircle className="h-6 w-6 text-[#c8a96e]" />
              <h2 className="text-xl font-bold text-[#1a1f36]">
                Non-Returnable Items
              </h2>
            </div>
            <div className="prose max-w-none text-[#2d3436]">
              <p>The following items are not eligible for return or exchange:</p>
              <ul>
                <li>Innerwear and lingerie</li>
                <li>Swimwear and beachwear</li>
                <li>
                  Customized or personalized products (e.g., monogrammed items)
                </li>
                <li>Items marked as "Final Sale" or "Non-Returnable"</li>
                <li>Free gifts or promotional items</li>
                <li>Items with removed or damaged tags</li>
                <li>Items showing signs of use, washing, or alteration</li>
              </ul>
            </div>
          </div>

          {/* Contact for Returns */}
          <div>
            <div className="mb-4 flex items-center gap-3">
              <Mail className="h-6 w-6 text-[#c8a96e]" />
              <h2 className="text-xl font-bold text-[#1a1f36]">
                Contact for Returns
              </h2>
            </div>
            <div className="prose max-w-none text-[#2d3436]">
              <p>
                If you face any issues with the return process or need
                assistance, please reach out to our support team:
              </p>
              <ul>
                <li>
                  Email:{" "}
                  <a
                    href="mailto:returns@clothstore.com"
                    className="text-[#c8a96e] hover:underline"
                  >
                    returns@clothstore.com
                  </a>
                </li>
                <li>
                  Phone:{" "}
                  <a
                    href="tel:+919876543210"
                    className="text-[#c8a96e] hover:underline"
                  >
                    +91 98765 43210
                  </a>{" "}
                  (Mon-Sat, 10 AM - 7 PM IST)
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 rounded-xl border border-gray-100 bg-gray-50/50 p-6">
          <p className="text-xs text-gray-400">Last updated: January 2025</p>
        </div>
      </section>
    </div>
  );
}
