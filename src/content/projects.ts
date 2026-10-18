// Design projects. Each one gets a URL at /design/[slug]: it opens as a modal from the home page's
// work deck (and the Design page), or as a full page when the link is opened directly.
// The deck on the home page shows them in this order.

type Img = { src: string; width: number; height: number; alt: string };

export type Project = {
  slug: string;
  title: string;
  /** Tab label in the work deck */
  short: string;
  summary: string;
  year: string;
  role: string;
  cover: Img;
  /** Four thumbnails that float around the deck while this project is in front (two left, two right) */
  gallery?: (Img & { label: string })[];
};

// Placeholder copy and imagery until the real case studies are in
export const projects: Project[] = [
  {
    slug: "anchorage-cash",
    title: "Anchorage Cash",
    short: "Cash",
    summary:
      "Placeholder — a cash management experience for institutions holding USD and stablecoins side by side.",
    year: "2025",
    role: "Staff product designer",
    cover: {
      src: "/images/design-placeholder.png",
      width: 2028,
      height: 1101,
      alt: "Anchorage Cash dashboard showing a $1,000,000 balance and portfolio overview",
    },
    // Placeholder thumbnails — swap for real detail shots
    gallery: [
      { src: "/images/design-placeholder.png", width: 2028, height: 1101, alt: "", label: "Dashboard" },
      { src: "/images/virtual-accounts-bg.png", width: 414, height: 276, alt: "", label: "Virtual accounts" },
      { src: "/images/trusted-destinations-bg.jpg", width: 3126, height: 2082, alt: "", label: "Mobile" },
      { src: "/demos/trusted-destinations/qr.png", width: 590, height: 584, alt: "", label: "Deposits" },
    ],
  },
  {
    slug: "trusted-destinations",
    title: "Trusted Destinations",
    short: "Trusted Destinations",
    summary:
      "Placeholder — saving and verifying where institutions send funds, so every transfer goes to an address they already trust.",
    year: "2024",
    role: "Staff product designer",
    cover: {
      src: "/images/trusted-destinations-bg.jpg",
      width: 3126,
      height: 2082,
      alt: "Trusted Destinations prototype",
    },
    // Placeholder thumbnails — swap for real detail shots
    gallery: [
      { src: "/demos/trusted-destinations/qr.png", width: 590, height: 584, alt: "", label: "Address QR" },
      { src: "/demos/trusted-destinations/contact-1.png", width: 243, height: 243, alt: "", label: "Contacts" },
      { src: "/images/trusted-destinations-bg.jpg", width: 3126, height: 2082, alt: "", label: "Prototype" },
      { src: "/demos/trusted-destinations/app-messages.png", width: 180, height: 180, alt: "", label: "Share sheet" },
    ],
  },
  {
    slug: "chipp",
    title: "Chipp",
    short: "Chipp",
    summary:
      "Placeholder — the brand and mascot system for a no-code platform for building AI apps, and the builder around it.",
    year: "2024",
    role: "Product designer",
    cover: {
      src: "/demos/chipp/features.png",
      width: 3150,
      height: 1716,
      alt: "Chipp feature board",
    },
    gallery: [
      { src: "/demos/chipp/brand-guidelines.png", width: 1718, height: 1206, alt: "", label: "Brand guidelines" },
      { src: "/demos/chipp/park.jpg", width: 2000, height: 1500, alt: "", label: "Mascot" },
      { src: "/demos/chipp/features.png", width: 3150, height: 1716, alt: "", label: "Builder" },
      { src: "/demos/chipp/tuscany.png", width: 1600, height: 1198, alt: "", label: "Campaign" },
    ],
  },
];

export function getProject(slug: string) {
  return projects.find((p) => p.slug === slug);
}
