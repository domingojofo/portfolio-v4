import { site } from "@/content/site";

// LinkedIn + CV icons (from the Figma frame). Shown beside the nav on desktop, in the bottom bar on mobile.
export function SocialLinks({ className = "" }: { className?: string }) {
  return (
    <ul className={`social ${className}`}>
      <li>
        <a href={site.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
          <span className="social-icon">
            {/* eslint-disable-next-line @next/next/no-img-element -- tiny static SVG */}
            <img src="/icons/linkedin.svg" width={17.0667} height={17.0667} alt="" />
          </span>
        </a>
      </li>
      <li>
        <a href={site.cv} target="_blank" rel="noopener noreferrer" aria-label="CV">
          <span className="social-icon cv-icon">
            {/* eslint-disable-next-line @next/next/no-img-element -- tiny static SVG */}
            <img src="/icons/cv.svg" width={13.8667} height={17.0667} alt="" />
            <span aria-hidden="true">CV</span>
          </span>
        </a>
      </li>
    </ul>
  );
}
