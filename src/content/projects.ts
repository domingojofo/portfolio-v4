// Design projects. Each one gets a URL at /design/[slug]: it opens as a modal from the home page's
// project cards, or as a full page when the link is opened directly. What's inside each one is in
// ProjectView (the Anchorage and Chipp demo panels).
// The deck on the home page shows them in this order.

type Img = { src: string; width: number; height: number; alt: string };
/** A cover can be a looping, silent video (`src` is then its poster frame) or the animated
 *  GradientField (`src` stays as a still for places that need an image) */
type Cover = Img & { video?: string; gradient?: { colors?: string[]; speed?: number; warp?: number; grain?: number } };

export type Project = {
  slug: string;
  title: string;
  /** Tab label in the project cards */
  short: string;
  summary: string;
  year: string;
  role: string;
  cover: Cover;
  /** Four thumbnails that float around the deck while this project is in front (two left, two right) */
  gallery?: (Img & { label: string })[];
};

// Placeholder copy and imagery until the real case studies are in
export const projects: Project[] = [
  {
    slug: "anchorage",
    title: "Anchorage Digital",
    short: "Anchorage",
    summary:
      "Placeholder — Anchorage Cash, Trusted Destinations, the banks hero and virtual accounts: cash management and transfers for institutions holding USD and stablecoins side by side.",
    year: "2022 — Now",
    role: "Staff product designer",
    cover: {
      src: "/images/design-placeholder.png",
      width: 2028,
      height: 1101,
      alt: "Anchorage Cash dashboard showing a $1,000,000 balance and portfolio overview",
    },
    // Placeholder thumbnails — swap for real detail shots
    gallery: [
      { src: "/images/design-placeholder.png", width: 2028, height: 1101, alt: "", label: "Cash" },
      { src: "/images/virtual-accounts-bg.png", width: 414, height: 276, alt: "", label: "Virtual accounts" },
      { src: "/images/trusted-destinations-bg.jpg", width: 3126, height: 2082, alt: "", label: "Trusted Destinations" },
      { src: "/demos/trusted-destinations/qr.png", width: 590, height: 584, alt: "", label: "Deposits" },
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
  {
    // Details to come
    slug: "oamo",
    title: "OAMO",
    short: "OAMO",
    summary: "Placeholder — details coming soon.",
    year: "",
    role: "",
    // Hero for now: the bounce loop (silent, 720px H.264); the poster is its first frame
    cover: {
      src: "/images/oamo-bounce-poster.jpg",
      video: "/images/oamo-bounce.mp4",
      width: 1080,
      height: 1080,
      alt: "OAMO — yellow, white and black links tumbling together",
    },
    // Placeholder thumbnails — stills from the bounce loop
    gallery: [
      { src: "/images/oamo-thumb-1.jpg", width: 600, height: 600, alt: "", label: "Links" },
      { src: "/images/oamo-thumb-2.jpg", width: 600, height: 600, alt: "", label: "Motion" },
      { src: "/images/oamo-thumb-3.jpg", width: 600, height: 600, alt: "", label: "System" },
      { src: "/images/oamo-thumb-4.jpg", width: 600, height: 600, alt: "", label: "Brand" },
    ],
  },
  {
    // Details to come
    slug: "elevenlabs",
    title: "ElevenLabs",
    short: "ElevenLabs",
    summary: "Placeholder — voice generation: choose a voice, then hear your text or audio delivered in it, with control over tone, style and delivery.",
    year: "",
    role: "",
    // Hero for now: the animated warped gradient (GradientField, Ember palette)
    cover: {
      src: "/images/elevenlabs-cover.jpg",
      width: 2000,
      height: 1500,
      alt: "ElevenLabs — a warm, slowly shifting gradient",
      gradient: {},
    },
    // Placeholder thumbnails — crops of the cover
    gallery: [
      { src: "/images/elevenlabs-thumb-1.jpg", width: 600, height: 450, alt: "", label: "Generate" },
      { src: "/images/elevenlabs-thumb-2.jpg", width: 600, height: 440, alt: "", label: "Voices" },
      { src: "/images/elevenlabs-thumb-3.jpg", width: 600, height: 450, alt: "", label: "Playback" },
      { src: "/images/elevenlabs-thumb-4.jpg", width: 600, height: 450, alt: "", label: "Studio" },
    ],
  },
];

export function getProject(slug: string) {
  return projects.find((p) => p.slug === slug);
}
