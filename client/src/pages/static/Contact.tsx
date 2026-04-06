import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MapPin, Phone, Mail, Clock, Send, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiPost } from "@/lib/api";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  subject: z.string().min(1, "Please select a subject"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactForm = z.infer<typeof contactSchema>;

const contactInfo = [
  {
    icon: MapPin,
    title: "Address",
    lines: ["123 Fashion Street", "Andheri West, Mumbai 400058", "Maharashtra, India"],
  },
  {
    icon: Phone,
    title: "Phone",
    lines: ["+91 98765 43210", "+91 22 2635 0000"],
  },
  {
    icon: Mail,
    title: "Email",
    lines: ["support@clothstore.com", "hello@clothstore.com"],
  },
  {
    icon: Clock,
    title: "Business Hours",
    lines: ["Monday - Saturday", "10:00 AM - 7:00 PM IST", "Sunday: Closed"],
  },
];

const subjects = [
  "General Inquiry",
  "Order Issue",
  "Returns",
  "Feedback",
  "Other",
];

export default function Contact() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", subject: "", message: "" },
  });

  const onSubmit = async (data: ContactForm) => {
    setIsSubmitting(true);
    try {
      await apiPost("/contact", data);
      toast.success("Message sent successfully! We will get back to you soon.");
      reset();
    } catch {
      toast.error("Failed to send message. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="border-b border-gray-100 bg-gray-50/50">
        <div className="mx-auto max-w-4xl px-4 py-3 sm:px-6">
          <Breadcrumbs items={[{ label: "Contact Us" }]} />
        </div>
      </div>

      {/* Header */}
      <section className="bg-gradient-to-br from-[#1a1f36] via-[#1a1f36] to-[#2d3436]">
        <div className="mx-auto max-w-4xl px-4 py-12 text-center sm:px-6 md:py-16">
          <h1 className="text-3xl font-extrabold text-white md:text-4xl">
            Get in Touch
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-gray-300">
            Have a question or feedback? We would love to hear from you. Our
            team typically responds within 24 hours.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 md:py-16">
        <div className="grid gap-10 lg:grid-cols-5">
          {/* Form */}
          <div className="lg:col-span-3">
            <h2 className="mb-6 text-xl font-bold text-[#1a1f36]">
              Send Us a Message
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Your full name"
                  {...register("name")}
                  className="mt-1.5"
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  {...register("email")}
                  className="mt-1.5"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="subject">Subject</Label>
                <Select
                  onValueChange={(value) => setValue("subject", value)}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.subject && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.subject.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="How can we help you?"
                  rows={5}
                  {...register("message")}
                  className="mt-1.5"
                />
                {errors.message && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.message.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                variant="accent"
                className="gap-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Send Message
              </Button>
            </form>
          </div>

          {/* Contact Info */}
          <div className="lg:col-span-2">
            <h2 className="mb-6 text-xl font-bold text-[#1a1f36]">
              Contact Information
            </h2>
            <div className="space-y-6">
              {contactInfo.map((info) => (
                <div
                  key={info.title}
                  className="flex gap-4 rounded-xl border border-gray-100 bg-gray-50/50 p-4"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1a1f36]/5">
                    <info.icon className="h-5 w-5 text-[#c8a96e]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1a1f36]">
                      {info.title}
                    </p>
                    {info.lines.map((line, i) => (
                      <p key={i} className="text-sm text-gray-600">
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Map Placeholder */}
            <div className="mt-6 flex h-48 items-center justify-center rounded-xl border border-gray-200 bg-gray-100">
              <div className="text-center">
                <MapPin className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm font-medium text-gray-500">
                  Map
                </p>
                <p className="text-xs text-gray-400">
                  Andheri West, Mumbai
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
