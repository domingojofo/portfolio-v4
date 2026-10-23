// Design projects. Each one gets a URL at /design/[slug]: it opens as a modal from the home page's
// project cards, or as a full page when the link is opened directly. What's inside each one is in
// ProjectView (the Anchorage and Chipp demo panels).
// The deck on the home page shows them in this order.

type Img = { src: string; width: number; height: number; alt: string };
/** A cover can be a looping, silent video (`src` is then its poster frame) or the animated
 *  GradientField (`src` stays as a still for places that need an image) */
type Cover = Img & {
  video?: string;
  gradient?: { colors?: string[]; speed?: number; warp?: number; grain?: number };
  /** An animated scene: drawn over the gradient (elevenlabs), the whole cover (anchorage), or a
   *  device over the cover video (oamo) */
  scene?: "elevenlabs" | "anchorage" | "oamo";
  /** Badges in the bottom corners of the home page's card, over the cover (Chipp: its mascot and award) */
  badges?: (Img & { at: "left" | "right" })[];
};

export type Project = {
  slug: string;
  /** The company's name */
  title: string;
  /** Short label */
  short: string;
  /** The company's wordmark (in its own colours), shown above its line in the deck: src and its size in px */
  logo?: { src: string; width: number; height: number };
  /** What I did there and the impact, in a few lines. **Marked** parts are highlighted (Marked.tsx) */
  summary: string;
  year: string;
  role: string;
  cover: Cover;
  /** Left out of the deck, the next-project links and the routes for now */
  hidden?: boolean;
  /** Four thumbnails that float around the deck while this project is in front (two left, two right) */
  gallery?: (Img & { label: string })[];
};

// Placeholder copy and imagery until the real case studies are in
const allProjects: Project[] = [
  {
    slug: "anchorage",
    title: "Anchorage Digital",
    short: "Anchorage",
    logo: { src: "/images/logos/anchorage.svg", width: 115, height: 32 },
    summary:
      "Led USD banking, launching payments and interest that earned $1M in 3 months.",
    year: "2022 — Now",
    role: "Staff product designer",
    // Hero: the Cash management app touring itself over The Creation of Adam (AnchorageScene)
    cover: {
      src: "/images/anchorage-creation.jpg",
      width: 1894,
      height: 1260,
      alt: "Anchorage cash management — balances, holdings and allocation, over Michelangelo's The Creation of Adam",
      scene: "anchorage",
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
    title: "Chipp.ai",
    short: "Chipp",
    logo: { src: "/images/logos/chipp.svg", width: 84, height: 24 },
    summary:
      "Founding designer (#4), then head of design. Built the AI agent studio and brand; helped raise a $2M seed.",
    year: "2024",
    role: "Design consultant\n↳ Head of Design",
    cover: {
      src: "/demos/chipp/brand-reel-poster.jpg",
      video: "/demos/chipp/brand-reel.mp4",
      width: 1080,
      height: 1080,
      alt: "Chipp's site and product, scrolling by",
      badges: [
        { at: "left", src: "/demos/chipp/mascot-builder.svg", width: 230, height: 233, alt: "Chipp's mascot in a hard hat" },
        { at: "right", src: "/demos/chipp/rgd-award.svg", width: 487, height: 345, alt: "2025 RGD Branding Awards winner" },
      ],
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
    hidden: true,   // its cover is being reworked
    title: "OAMO",
    short: "OAMO",
    logo: { src: "/images/logos/oamo.svg", width: 135, height: 24 },
    summary:
      "Lead designer for everything: brand, web, product UX, UI. Scaled past 200k users to acquisition.",
    year: "",
    role: "Lead product designer",
    // Hero: the bounce loop (silent, 720px H.264; the poster is its first frame) with the MacBook and
    // iPhone from the Interview Presentation slide on top (OamoScene)
    cover: {
      src: "/images/oamo-bounce-poster.jpg",
      video: "/images/oamo-bounce.mp4",
      width: 1080,
      height: 1080,
      alt: "The Oamo landing page on a MacBook and an iPhone, over yellow, white and black links tumbling together",
      scene: "oamo",
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
    logo: { src: "/images/logos/elevenlabs-logo.png", width: 186, height: 24 },
    summary:
      "Freelance product designer who lifted voice discovery conversion and exploration time by 15%.",
    year: "",
    role: "",
    // Hero for now: the animated warped gradient (GradientField, Ember palette)
    cover: {
      src: "/images/elevenlabs-cover.jpg",
      width: 2000,
      height: 1500,
      alt: "ElevenLabs — a voice card and a text box typing itself, over a warm, slowly shifting gradient",
      gradient: {},
      scene: "elevenlabs",
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

/** The projects on the site, in deck order (hidden ones left out) */
export const projects = allProjects.filter((p) => !p.hidden);

export function getProject(slug: string) {
  return projects.find((p) => p.slug === slug);
}
