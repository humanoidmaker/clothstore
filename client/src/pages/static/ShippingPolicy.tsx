import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { Truck, MapPin, Clock, Search, AlertTriangle } from "lucide-react";

export default function ShippingPolicy() {
  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="border-b border-gray-100 bg-gray-50/50">
        <div className="mx-auto max-w-4xl px-4 py-3 sm:px-6">
          <Breadcrumbs items={[{ label: "Shipping Policy" }]} />
        </div>
      </div>

      {/* Header */}
      <section className="bg-gradient-to-br from-[#1a1f36] via-[#1a1f36] to-[#2d3436]">
        <div className="mx-auto max-w-4xl px-4 py-12 text-center sm:px-6 md:py-16">
          <h1 className="text-3xl font-extrabold text-white md:text-4xl">
            Shipping Policy
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-gray-300">
            Everything you need to know about how we deliver your orders.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 md:py-16">
        <div className="space-y-10">
          {/* Shipping Methods */}
          <div>
            <div className="mb-4 flex items-center gap-3">
              <Truck className="h-6 w-6 text-[#c8a96e]" />
              <h2 className="text-xl font-bold text-[#1a1f36]">
                Shipping Methods
              </h2>
            </div>
            <div className="prose max-w-none text-[#2d3436]">
              <p>
                We partner with India's leading logistics providers including
                Delhivery, Blue Dart, and DTDC to ensure safe and timely
                delivery of your orders. We offer two shipping options:
              </p>
              <ul>
                <li>
                  <strong>Standard Shipping:</strong> Reliable delivery within
                  the estimated timeframe at standard or free shipping rates.
                </li>
                <li>
                  <strong>Express Shipping:</strong> Priority handling and faster
                  delivery for an additional charge of ₹149. Available for select
                  pin codes.
                </li>
              </ul>
            </div>
          </div>

          {/* Delivery Timeframes */}
          <div>
            <div className="mb-4 flex items-center gap-3">
              <Clock className="h-6 w-6 text-[#c8a96e]" />
              <h2 className="text-xl font-bold text-[#1a1f36]">
                Delivery Timeframes
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse rounded-lg border border-gray-200 text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border-b border-gray-200 px-4 py-3 text-left font-semibold text-[#1a1f36]">
                      Location
                    </th>
                    <th className="border-b border-gray-200 px-4 py-3 text-left font-semibold text-[#1a1f36]">
                      Standard Shipping
                    </th>
                    <th className="border-b border-gray-200 px-4 py-3 text-left font-semibold text-[#1a1f36]">
                      Express Shipping
                    </th>
                  </tr>
                </thead>
                <tbody className="text-gray-600">
                  <tr>
                    <td className="border-b border-gray-100 px-4 py-3">
                      Metro Cities (Mumbai, Delhi, Bangalore, Chennai, Kolkata,
                      Hyderabad)
                    </td>
                    <td className="border-b border-gray-100 px-4 py-3">
                      3-5 business days
                    </td>
                    <td className="border-b border-gray-100 px-4 py-3">
                      1-2 business days
                    </td>
                  </tr>
                  <tr>
                    <td className="border-b border-gray-100 px-4 py-3">
                      Non-Metro Cities & Towns
                    </td>
                    <td className="border-b border-gray-100 px-4 py-3">
                      5-7 business days
                    </td>
                    <td className="border-b border-gray-100 px-4 py-3">
                      3-4 business days
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">
                      Remote & Rural Areas
                    </td>
                    <td className="px-4 py-3">
                      7-10 business days
                    </td>
                    <td className="px-4 py-3">
                      5-7 business days
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-sm text-gray-500">
              * Business days exclude Sundays and public holidays. Delivery
              timeframes are estimates and may vary during peak seasons or
              unforeseen circumstances.
            </p>
          </div>

          {/* Shipping Charges */}
          <div>
            <div className="mb-4 flex items-center gap-3">
              <MapPin className="h-6 w-6 text-[#c8a96e]" />
              <h2 className="text-xl font-bold text-[#1a1f36]">
                Shipping Charges
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse rounded-lg border border-gray-200 text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border-b border-gray-200 px-4 py-3 text-left font-semibold text-[#1a1f36]">
                      Order Value
                    </th>
                    <th className="border-b border-gray-200 px-4 py-3 text-left font-semibold text-[#1a1f36]">
                      Standard Shipping
                    </th>
                    <th className="border-b border-gray-200 px-4 py-3 text-left font-semibold text-[#1a1f36]">
                      Express Shipping
                    </th>
                  </tr>
                </thead>
                <tbody className="text-gray-600">
                  <tr>
                    <td className="border-b border-gray-100 px-4 py-3">
                      Below ₹999
                    </td>
                    <td className="border-b border-gray-100 px-4 py-3">₹79</td>
                    <td className="border-b border-gray-100 px-4 py-3">
                      ₹228 (₹79 + ₹149)
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">₹999 and above</td>
                    <td className="px-4 py-3 font-medium text-green-600">
                      FREE
                    </td>
                    <td className="px-4 py-3">₹149</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Order Tracking */}
          <div>
            <div className="mb-4 flex items-center gap-3">
              <Search className="h-6 w-6 text-[#c8a96e]" />
              <h2 className="text-xl font-bold text-[#1a1f36]">
                Order Tracking
              </h2>
            </div>
            <div className="prose max-w-none text-[#2d3436]">
              <p>
                Once your order is dispatched, you will receive a confirmation
                email and SMS with a tracking ID and a link to track your
                shipment in real-time. You can also track your order by:
              </p>
              <ol>
                <li>
                  Logging in to your account and visiting the{" "}
                  <strong>My Orders</strong> section.
                </li>
                <li>
                  Clicking on the specific order to view tracking details and
                  delivery status.
                </li>
                <li>
                  Using the tracking ID on our courier partner's website for the
                  most up-to-date information.
                </li>
              </ol>
            </div>
          </div>

          {/* Shipping Restrictions */}
          <div>
            <div className="mb-4 flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-[#c8a96e]" />
              <h2 className="text-xl font-bold text-[#1a1f36]">
                Shipping Restrictions
              </h2>
            </div>
            <div className="prose max-w-none text-[#2d3436]">
              <ul>
                <li>
                  We currently ship only within India. International shipping is
                  not available at this time.
                </li>
                <li>
                  Delivery to P.O. Box addresses is not supported.
                </li>
                <li>
                  Certain remote areas or pin codes may not be serviceable by our
                  logistics partners. In such cases, we will notify you and
                  arrange an alternative or issue a refund.
                </li>
                <li>
                  Cash on Delivery (COD) is available for orders below ₹10,000
                  and only for serviceable pin codes. A COD fee of ₹49 may apply.
                </li>
                <li>
                  During peak sale seasons (such as festive sales), delivery
                  times may be extended by 2-3 business days.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="mt-12 rounded-xl border border-gray-100 bg-gray-50/50 p-6">
          <p className="text-sm text-gray-600">
            For any shipping-related queries, please contact our support team at{" "}
            <a
              href="mailto:support@clothstore.com"
              className="font-medium text-[#c8a96e] hover:underline"
            >
              support@clothstore.com
            </a>{" "}
            or call us at{" "}
            <a
              href="tel:+919876543210"
              className="font-medium text-[#c8a96e] hover:underline"
            >
              +91 98765 43210
            </a>
            .
          </p>
          <p className="mt-2 text-xs text-gray-400">
            Last updated: January 2025
          </p>
        </div>
      </section>
    </div>
  );
}
