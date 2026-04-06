import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport/index.js";
import { config } from "../config/env.js";
import { logger } from "../config/logger.js";

const transporter = nodemailer.createTransport({
  host: config.SMTP_HOST,
  port: config.SMTP_PORT,
  secure: config.SMTP_PORT === 465,
  auth: {
    user: config.SMTP_USER,
    pass: config.SMTP_PASS,
  },
});

// ── Shared HTML helpers ────────────────────────────────────────────────

const BRAND_NAVY = "#1a1f36";
const BRAND_GOLD = "#c8a96e";
const BRAND_LIGHT_BG = "#f7f7f8";
const BRAND_BORDER = "#e5e7eb";

function layout(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:${BRAND_LIGHT_BG};font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND_LIGHT_BG};padding:24px 0;">
<tr><td align="center">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
    <!-- Header -->
    <tr>
      <td style="background-color:${BRAND_NAVY};padding:28px 32px;text-align:center;">
        <span style="font-size:28px;font-weight:700;color:#ffffff;letter-spacing:1px;">Cloth</span><span style="font-size:28px;font-weight:700;color:${BRAND_GOLD};letter-spacing:1px;">Store</span>
      </td>
    </tr>
    <!-- Body -->
    <tr>
      <td style="padding:32px;">
        ${bodyHtml}
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="background-color:${BRAND_LIGHT_BG};padding:24px 32px;text-align:center;border-top:1px solid ${BRAND_BORDER};">
        <p style="margin:0 0 6px;font-size:13px;color:#6b7280;">&copy; ${new Date().getFullYear()} ClothStore. All rights reserved.</p>
        <p style="margin:0;font-size:12px;color:#9ca3af;">If you have questions, reply to this email or contact us at support@clothstore.com</p>
      </td>
    </tr>
  </table>
</td></tr>
</table>
</body>
</html>`;
}

function ctaButton(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto;">
<tr><td style="background-color:${BRAND_GOLD};border-radius:8px;">
  <a href="${href}" target="_blank" style="display:inline-block;padding:14px 36px;color:${BRAND_NAVY};font-weight:700;font-size:15px;text-decoration:none;letter-spacing:0.5px;">${label}</a>
</td></tr></table>`;
}

function heading(text: string): string {
  return `<h1 style="margin:0 0 16px;font-size:22px;color:${BRAND_NAVY};font-weight:700;">${text}</h1>`;
}

function paragraph(text: string): string {
  return `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#374151;">${text}</p>`;
}

function divider(): string {
  return `<hr style="border:none;border-top:1px solid ${BRAND_BORDER};margin:20px 0;" />`;
}

// ── Email Service ──────────────────────────────────────────────────────

class EmailService {
  private async send(mailOptions: nodemailer.SendMailOptions): Promise<boolean> {
    try {
      await transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully to ${mailOptions.to} — subject: ${mailOptions.subject}`);
      return true;
    } catch (err) {
      logger.error(`Failed to send email to ${mailOptions.to}: ${(err as Error).message}`);
      return false;
    }
  }

  // ── Welcome ────────────────────────────────────────────────────────

  async sendWelcome(to: string, firstName: string): Promise<boolean> {
    const html = layout(
      "Welcome to ClothStore!",
      `${heading(`Welcome, ${firstName}!`)}
      ${paragraph("We're thrilled to have you join the ClothStore family. Discover curated fashion collections, exclusive deals, and a seamless shopping experience — all in one place.")}
      ${paragraph("Start exploring our latest arrivals and find something you'll love.")}
      ${ctaButton(`${config.CLIENT_URL}/shop`, "Start Shopping")}
      ${paragraph("Happy shopping!<br/><strong>— The ClothStore Team</strong>")}`
    );

    return this.send({
      from: config.SMTP_FROM,
      to,
      subject: "Welcome to ClothStore! 🎉",
      html,
    });
  }

  // ── Verification OTP ──────────────────────────────────────────────

  async sendVerificationOTP(to: string, firstName: string, otp: string): Promise<boolean> {
    const html = layout(
      "Verify Your Email",
      `${heading("Verify Your Email")}
      ${paragraph(`Hi ${firstName}, please use the verification code below to confirm your email address.`)}
      <div style="text-align:center;margin:24px 0;">
        <div style="display:inline-block;background-color:${BRAND_LIGHT_BG};border:2px dashed ${BRAND_GOLD};border-radius:10px;padding:18px 40px;">
          <span style="font-size:36px;font-weight:800;letter-spacing:10px;color:${BRAND_NAVY};">${otp}</span>
        </div>
      </div>
      ${paragraph("This code is valid for <strong>10 minutes</strong>. If you did not request this, please ignore this email.")}
      ${divider()}
      ${paragraph('<span style="font-size:13px;color:#9ca3af;">For security, never share this code with anyone.</span>')}`
    );

    return this.send({
      from: config.SMTP_FROM,
      to,
      subject: "Your ClothStore Verification Code",
      html,
    });
  }

  // ── Password Reset OTP ────────────────────────────────────────────

  async sendPasswordResetOTP(to: string, firstName: string, otp: string): Promise<boolean> {
    const html = layout(
      "Reset Your Password",
      `${heading("Password Reset Request")}
      ${paragraph(`Hi ${firstName}, we received a request to reset your password. Use the code below to proceed.`)}
      <div style="text-align:center;margin:24px 0;">
        <div style="display:inline-block;background-color:${BRAND_LIGHT_BG};border:2px dashed ${BRAND_GOLD};border-radius:10px;padding:18px 40px;">
          <span style="font-size:36px;font-weight:800;letter-spacing:10px;color:${BRAND_NAVY};">${otp}</span>
        </div>
      </div>
      ${paragraph("This code expires in <strong>10 minutes</strong>.")}
      ${divider()}
      <div style="background-color:#fef3c7;border-left:4px solid #f59e0b;padding:14px 16px;border-radius:4px;margin:16px 0;">
        <p style="margin:0;font-size:14px;color:#92400e;"><strong>Security Notice:</strong> If you did not request a password reset, please secure your account immediately by changing your password and contacting our support team.</p>
      </div>`
    );

    return this.send({
      from: config.SMTP_FROM,
      to,
      subject: "ClothStore Password Reset Code",
      html,
    });
  }

  // ── Order Confirmation ────────────────────────────────────────────

  async sendOrderConfirmation(to: string, order: any): Promise<boolean> {
    const itemsRows = (order.items || [])
      .map(
        (item: any) => `
      <tr>
        <td style="padding:10px 8px;border-bottom:1px solid ${BRAND_BORDER};">
          <div style="width:52px;height:52px;background-color:#e5e7eb;border-radius:6px;display:inline-block;vertical-align:middle;text-align:center;line-height:52px;font-size:11px;color:#9ca3af;">IMG</div>
        </td>
        <td style="padding:10px 8px;border-bottom:1px solid ${BRAND_BORDER};font-size:14px;color:${BRAND_NAVY};font-weight:600;">${item.name || item.productName || "Product"}</td>
        <td style="padding:10px 8px;border-bottom:1px solid ${BRAND_BORDER};font-size:13px;color:#6b7280;text-align:center;">${item.size || "—"}</td>
        <td style="padding:10px 8px;border-bottom:1px solid ${BRAND_BORDER};font-size:13px;color:#6b7280;text-align:center;">${item.color || "—"}</td>
        <td style="padding:10px 8px;border-bottom:1px solid ${BRAND_BORDER};font-size:13px;color:#6b7280;text-align:center;">${item.quantity ?? 1}</td>
        <td style="padding:10px 8px;border-bottom:1px solid ${BRAND_BORDER};font-size:14px;color:${BRAND_NAVY};font-weight:600;text-align:right;">₹${(item.price ?? 0).toLocaleString("en-IN")}</td>
      </tr>`
      )
      .join("");

    const orderDate = order.createdAt
      ? new Date(order.createdAt).toLocaleDateString("en-IN", { dateStyle: "long", timeZone: "Asia/Kolkata" })
      : new Date().toLocaleDateString("en-IN", { dateStyle: "long", timeZone: "Asia/Kolkata" });

    const address = order.shippingAddress;
    const addressBlock = address
      ? `<div style="background-color:${BRAND_LIGHT_BG};border-radius:8px;padding:16px;margin-top:20px;">
          <p style="margin:0 0 6px;font-size:14px;font-weight:700;color:${BRAND_NAVY};">Shipping Address</p>
          <p style="margin:0;font-size:14px;line-height:1.5;color:#374151;">
            ${address.fullName || address.name || ""}<br/>
            ${address.addressLine1 || address.street || ""}<br/>
            ${address.addressLine2 ? address.addressLine2 + "<br/>" : ""}
            ${address.city || ""}, ${address.state || ""} ${address.pincode || address.zip || ""}<br/>
            ${address.phone ? "Phone: " + address.phone : ""}
          </p>
        </div>`
      : "";

    const summaryLine = (label: string, value: string, bold = false) =>
      `<tr>
        <td style="padding:4px 0;font-size:14px;color:#6b7280;">${label}</td>
        <td style="padding:4px 0;font-size:14px;color:${BRAND_NAVY};text-align:right;${bold ? "font-weight:700;font-size:16px;" : ""}">${value}</td>
      </tr>`;

    const html = layout(
      "Order Confirmation",
      `${heading("Order Confirmed!")}
      ${paragraph("Thank you for your order. Here's a summary of what you purchased.")}
      <div style="background-color:${BRAND_LIGHT_BG};border-radius:8px;padding:14px 16px;margin-bottom:20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-size:13px;color:#6b7280;">Order Number</td>
            <td style="font-size:14px;font-weight:700;color:${BRAND_NAVY};text-align:right;">${order.orderNumber || order._id || "N/A"}</td>
          </tr>
          <tr>
            <td style="font-size:13px;color:#6b7280;">Date</td>
            <td style="font-size:14px;color:${BRAND_NAVY};text-align:right;">${orderDate}</td>
          </tr>
        </table>
      </div>
      <!-- Items table -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${BRAND_BORDER};border-radius:8px;overflow:hidden;">
        <thead>
          <tr style="background-color:${BRAND_NAVY};">
            <th style="padding:10px 8px;font-size:12px;color:#ffffff;text-align:left;font-weight:600;"></th>
            <th style="padding:10px 8px;font-size:12px;color:#ffffff;text-align:left;font-weight:600;">Item</th>
            <th style="padding:10px 8px;font-size:12px;color:#ffffff;text-align:center;font-weight:600;">Size</th>
            <th style="padding:10px 8px;font-size:12px;color:#ffffff;text-align:center;font-weight:600;">Color</th>
            <th style="padding:10px 8px;font-size:12px;color:#ffffff;text-align:center;font-weight:600;">Qty</th>
            <th style="padding:10px 8px;font-size:12px;color:#ffffff;text-align:right;font-weight:600;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>
      <!-- Totals -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
        ${summaryLine("Subtotal", `₹${(order.subtotal ?? 0).toLocaleString("en-IN")}`)}
        ${summaryLine("Shipping", order.shippingCost === 0 ? "FREE" : `₹${(order.shippingCost ?? 0).toLocaleString("en-IN")}`)}
        ${order.tax != null ? summaryLine("Tax", `₹${order.tax.toLocaleString("en-IN")}`) : ""}
        ${order.discount ? summaryLine("Discount", `−₹${order.discount.toLocaleString("en-IN")}`) : ""}
        <tr><td colspan="2"><hr style="border:none;border-top:1px solid ${BRAND_BORDER};margin:8px 0;" /></td></tr>
        ${summaryLine("Total", `₹${(order.totalAmount ?? order.total ?? 0).toLocaleString("en-IN")}`, true)}
      </table>
      ${addressBlock}
      ${ctaButton(`${config.CLIENT_URL}/orders/${order.orderNumber || order._id || ""}`, "Track Order")}`
    );

    return this.send({
      from: config.SMTP_FROM,
      to,
      subject: `Order Confirmed — #${order.orderNumber || order._id || ""}`,
      html,
    });
  }

  // ── Order Status Update ───────────────────────────────────────────

  async sendOrderStatusUpdate(
    to: string,
    firstName: string,
    orderNumber: string,
    status: string
  ): Promise<boolean> {
    const statusMessages: Record<string, { icon: string; color: string; message: string }> = {
      Confirmed: { icon: "✅", color: "#059669", message: "Your order is confirmed!" },
      Processing: { icon: "⚙️", color: "#2563eb", message: "Your order is being processed." },
      Shipped: { icon: "🚚", color: "#7c3aed", message: "Your order is on its way!" },
      "Out for Delivery": { icon: "📦", color: "#d97706", message: "Your order is out for delivery!" },
      Delivered: { icon: "🎉", color: "#059669", message: "Your order has been delivered!" },
      Cancelled: { icon: "❌", color: "#dc2626", message: "Your order has been cancelled." },
      Returned: { icon: "↩️", color: "#6b7280", message: "Your order return has been processed." },
    };

    const info = statusMessages[status] || { icon: "📋", color: BRAND_NAVY, message: `Your order status is now: ${status}` };

    const html = layout(
      "Order Status Update",
      `${heading("Order Update")}
      ${paragraph(`Hi ${firstName}, here's an update on your order <strong>#${orderNumber}</strong>.`)}
      <div style="text-align:center;margin:24px 0;">
        <div style="display:inline-block;background-color:${info.color}15;border:2px solid ${info.color};border-radius:12px;padding:20px 40px;">
          <span style="font-size:36px;display:block;margin-bottom:8px;">${info.icon}</span>
          <span style="font-size:18px;font-weight:700;color:${info.color};">${status}</span>
        </div>
      </div>
      ${paragraph(info.message)}
      ${ctaButton(`${config.CLIENT_URL}/orders/${orderNumber}`, "View Order Details")}`
    );

    return this.send({
      from: config.SMTP_FROM,
      to,
      subject: `Order #${orderNumber} — ${status}`,
      html,
    });
  }

  // ── Payment Receipt ───────────────────────────────────────────────

  async sendPaymentReceipt(to: string, order: any): Promise<boolean> {
    const paidDate = order.paidAt || order.createdAt
      ? new Date(order.paidAt || order.createdAt).toLocaleDateString("en-IN", { dateStyle: "long", timeZone: "Asia/Kolkata" })
      : new Date().toLocaleDateString("en-IN", { dateStyle: "long", timeZone: "Asia/Kolkata" });

    const html = layout(
      "Payment Receipt",
      `${heading("Payment Receipt")}
      ${paragraph("Your payment has been successfully processed. Here are the details.")}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND_LIGHT_BG};border-radius:8px;padding:4px 0;">
        <tr>
          <td style="padding:12px 20px;font-size:14px;color:#6b7280;">Transaction ID</td>
          <td style="padding:12px 20px;font-size:14px;color:${BRAND_NAVY};font-weight:600;text-align:right;word-break:break-all;">${order.paymentId || order.transactionId || "N/A"}</td>
        </tr>
        <tr>
          <td style="padding:12px 20px;font-size:14px;color:#6b7280;">Order Number</td>
          <td style="padding:12px 20px;font-size:14px;color:${BRAND_NAVY};font-weight:600;text-align:right;">${order.orderNumber || order._id || "N/A"}</td>
        </tr>
        <tr>
          <td style="padding:12px 20px;font-size:14px;color:#6b7280;">Amount Paid</td>
          <td style="padding:12px 20px;font-size:18px;color:${BRAND_NAVY};font-weight:700;text-align:right;">₹${(order.totalAmount ?? order.total ?? 0).toLocaleString("en-IN")}</td>
        </tr>
        <tr>
          <td style="padding:12px 20px;font-size:14px;color:#6b7280;">Payment Method</td>
          <td style="padding:12px 20px;font-size:14px;color:${BRAND_NAVY};text-align:right;">${order.paymentMethod || "Online"}</td>
        </tr>
        <tr>
          <td style="padding:12px 20px;font-size:14px;color:#6b7280;">Date</td>
          <td style="padding:12px 20px;font-size:14px;color:${BRAND_NAVY};text-align:right;">${paidDate}</td>
        </tr>
      </table>
      ${divider()}
      ${paragraph("This receipt confirms your payment. Please keep it for your records.")}
      ${ctaButton(`${config.CLIENT_URL}/orders/${order.orderNumber || order._id || ""}`, "View Order")}`
    );

    return this.send({
      from: config.SMTP_FROM,
      to,
      subject: `Payment Receipt — Order #${order.orderNumber || order._id || ""}`,
      html,
    });
  }

  // ── Contact Form Notification ─────────────────────────────────────

  async sendContactFormNotification(
    adminEmail: string,
    data: { name: string; email: string; subject: string; message: string }
  ): Promise<boolean> {
    const html = layout(
      "New Contact Form Submission",
      `${heading("New Contact Form Message")}
      ${paragraph("A visitor has submitted a message through the contact form.")}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND_LIGHT_BG};border-radius:8px;">
        <tr>
          <td style="padding:12px 20px;font-size:14px;color:#6b7280;font-weight:600;width:100px;">Name</td>
          <td style="padding:12px 20px;font-size:14px;color:${BRAND_NAVY};">${data.name}</td>
        </tr>
        <tr>
          <td style="padding:12px 20px;font-size:14px;color:#6b7280;font-weight:600;">Email</td>
          <td style="padding:12px 20px;font-size:14px;color:${BRAND_NAVY};"><a href="mailto:${data.email}" style="color:${BRAND_GOLD};text-decoration:none;">${data.email}</a></td>
        </tr>
        <tr>
          <td style="padding:12px 20px;font-size:14px;color:#6b7280;font-weight:600;">Subject</td>
          <td style="padding:12px 20px;font-size:14px;color:${BRAND_NAVY};">${data.subject}</td>
        </tr>
      </table>
      ${divider()}
      <div style="background-color:${BRAND_LIGHT_BG};border-left:4px solid ${BRAND_GOLD};padding:16px;border-radius:4px;">
        <p style="margin:0;font-size:14px;line-height:1.6;color:#374151;white-space:pre-wrap;">${data.message}</p>
      </div>
      ${paragraph(`<span style="font-size:13px;color:#9ca3af;">You can reply directly to <a href="mailto:${data.email}" style="color:${BRAND_GOLD};">${data.email}</a></span>`)}`
    );

    return this.send({
      from: config.SMTP_FROM,
      to: adminEmail,
      subject: `Contact Form: ${data.subject}`,
      html,
    });
  }
}

export const emailService = new EmailService();
