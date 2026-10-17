// Design projects. Each one gets a URL at /design/[slug]: it opens as a modal from the
// Design section, or as a full page when the link is opened directly.

export type Project = {
  slug: string;
  title: string;
  summary: string;
  year: string;
  role: string;
  cover: { src: string; width: number; height: number; alt: string };
};

export const projects: Project[] = [
  {
    slug: "anchorage-cash",
    title: "Anchorage Cash",
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
  },
];

export function getProject(slug: string) {
  return projects.find((p) => p.slug === slug);
}
