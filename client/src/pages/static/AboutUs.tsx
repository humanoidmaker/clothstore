import { Link } from "react-router-dom";
import { ArrowRight, Users, Eye, Heart, ShoppingBag } from "lucide-react";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { Button } from "@/components/ui/button";

const stats = [
  { label: "Happy Customers", value: "10,000+", icon: Users },
  { label: "Products", value: "500+", icon: ShoppingBag },
  { label: "Brands", value: "50+", icon: Heart },
  { label: "Star Rated", value: "5", icon: Eye },
];

const values = [
  {
    title: "Our Mission",
    description:
      "To make premium Indian fashion accessible to everyone. We believe that great style should not come at a steep price, and every person deserves clothing that makes them feel confident and empowered.",
    icon: "🎯",
  },
  {
    title: "Our Vision",
    description:
      "To become India's most trusted fashion destination — where tradition meets modern design, and every purchase supports local artisans, sustainable practices, and homegrown craftsmanship.",
    icon: "🔭",
  },
  {
    title: "Our Values",
    description:
      "Quality over quantity, transparency in pricing, sustainability in sourcing, and an unwavering commitment to customer satisfaction. We stand behind every product we sell.",
    icon: "💎",
  },
];

const team = [
  {
    name: "Aarav Mehta",
    title: "Founder & CEO",
    bio: "A textile engineering graduate from NID Ahmedabad, Aarav started ClothStore with a vision to bring curated Indian fashion online.",
  },
  {
    name: "Neha Kapoor",
    title: "Head of Design",
    bio: "With 12 years in fashion design across Mumbai and Milan, Neha leads our creative direction, blending global trends with Indian aesthetics.",
  },
  {
    name: "Rohan Desai",
    title: "Chief Technology Officer",
    bio: "An IIT Bombay alumnus, Rohan ensures our platform delivers a seamless shopping experience to millions of customers across India.",
  },
];

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="border-b border-gray-100 bg-gray-50/50">
        <div className="mx-auto max-w-4xl px-4 py-3 sm:px-6">
          <Breadcrumbs items={[{ label: "About Us" }]} />
        </div>
      </div>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#1a1f36] via-[#1a1f36] to-[#2d3436]">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 md:py-24">
          <h1 className="text-4xl font-extrabold text-white md:text-5xl">
            Our Story
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-300">
            Bringing the finest of Indian fashion to your doorstep since 2019
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 md:py-16">
        <div className="prose prose-lg max-w-none text-[#2d3436]">
          <p>
            ClothStore was born in the vibrant lanes of Andheri West, Mumbai, in
            2019. What started as a small passion project by a group of fashion
            enthusiasts has since grown into one of India's most loved online
            fashion destinations. Our founders believed that India's incredible
            textile heritage deserved a modern, accessible platform — and that
            belief drives everything we do today.
          </p>
          <p>
            We work directly with over 50 brands and hundreds of artisans across
            India — from the handloom weavers of Varanasi to the block printers
            of Jaipur, from the silk craftsmen of Kanchipuram to the embroidery
            artists of Lucknow. Every product on our platform tells a story of
            craftsmanship, quality, and cultural pride.
          </p>
          <p>
            Today, we serve more than 10,000 happy customers across India,
            offering a carefully curated selection of men's, women's, and kids'
            fashion. Whether you are looking for a crisp formal shirt for the
            office, an elegant saree for a wedding, or a comfortable kurta for
            the weekend, ClothStore has something for every occasion and every
            budget.
          </p>
        </div>
      </section>

      {/* Mission / Vision / Values */}
      <section className="bg-gray-50/50">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 md:py-16">
          <h2 className="mb-8 text-center text-2xl font-bold text-[#1a1f36] md:text-3xl">
            What Drives Us
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {values.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-3 text-3xl">{item.icon}</div>
                <h3 className="mb-2 text-lg font-bold text-[#1a1f36]">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-gray-600">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-[#1a1f36]">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 md:py-16">
          <h2 className="mb-8 text-center text-2xl font-bold text-white md:text-3xl">
            Our Numbers
          </h2>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#c8a96e]/20">
                  <stat.icon className="h-6 w-6 text-[#c8a96e]" />
                </div>
                <p className="text-3xl font-extrabold text-white">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-gray-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 md:py-16">
        <h2 className="mb-8 text-center text-2xl font-bold text-[#1a1f36] md:text-3xl">
          Meet Our Team
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {team.map((member) => (
            <div
              key={member.name}
              className="rounded-xl border border-gray-100 bg-white p-6 text-center shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#1a1f36] to-[#c8a96e]/60 text-2xl font-bold text-white">
                {member.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
              <h3 className="text-lg font-bold text-[#1a1f36]">
                {member.name}
              </h3>
              <p className="mb-3 text-sm font-medium text-[#c8a96e]">
                {member.title}
              </p>
              <p className="text-sm leading-relaxed text-gray-600">
                {member.bio}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-gray-100 bg-gray-50/50">
        <div className="mx-auto max-w-4xl px-4 py-12 text-center sm:px-6 md:py-16">
          <h2 className="text-2xl font-bold text-[#1a1f36]">
            Ready to Explore?
          </h2>
          <p className="mx-auto mt-2 max-w-md text-gray-600">
            Discover our latest collection and find something you will love.
          </p>
          <div className="mt-6">
            <Link to="/category/new-arrivals">
              <Button variant="accent" size="lg" className="gap-2 px-8">
                Start Shopping <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
