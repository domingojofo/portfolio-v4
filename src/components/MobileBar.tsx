"use client";

import { usePathname } from "next/navigation";
import { pageIndex, pages } from "@/lib/pages";
import { useMenu } from "./CommandMenu";
import { SocialLinks } from "./SocialLinks";

// Mobile / iPad bottom bar: LinkedIn + CV on the left; on the right the current page,
// which opens the menu (as a bottom sheet) to switch pages.
export function MobileBar() {
  const pathname = usePathname();
  const current = pages[pageIndex(pathname)];
  const { open, setOpen } = useMenu();

  return (
    <div className="mobile-bar">
      <SocialLinks />
      <button
        type="button"
        className="page-menu-button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Menu — currently ${current.label}`}
        onClick={() => setOpen(true)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- tiny static SVG */}
        <img src="/icons/menu-anchor.svg" width={12} height={16} alt="" />
        <span>{current.label}</span>
      </button>
    </div>
  );
}
