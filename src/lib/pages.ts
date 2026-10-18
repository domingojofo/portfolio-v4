// Site pages in nav order. Drives the toolbar, the mobile page menu and ← / → keys.
// Home is the Design page (hero + project cards); each project opens as a modal at /design/[slug].
export const pages = [
  { href: "/", label: "Design" },
  { href: "/about", label: "About" },
  { href: "/reading", label: "Reading" },
  { href: "/writing", label: "Writing" },
] as const;

/** Index of the page a path belongs to (/design/x → Design, /writing/x → Writing). */
export function pageIndex(pathname: string) {
  for (let i = pages.length - 1; i > 0; i--) {
    const { href } = pages[i];
    if (pathname === href || pathname.startsWith(`${href}/`)) return i;
  }
  return 0;
}
