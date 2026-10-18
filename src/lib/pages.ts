// Site pages in nav order. Drives the desktop nav, the mobile page menu and ← / → keys.
export const pages = [
  { href: "/", label: "Hey" },
  { href: "/design", label: "Design" },
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
