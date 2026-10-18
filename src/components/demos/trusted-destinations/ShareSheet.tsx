/* eslint-disable @next/next/no-img-element -- static Figma assets inside a scaled mock screen */
import type { ReactNode } from "react";

// The system share sheet (UIActivityViewController) the app hands the dashboard link to.
// Any target "sends" the link; the app then shows the Done state.
const dir = "/demos/trusted-destinations";

const contacts = [
  { name: "Phillip Philips", photo: "contact-1.png", app: "app-slack.png" },
  { name: "Tatiana Bergson", photo: "contact-2.png", app: "app-slack.png" },
  { name: "Gustavo Torff", photo: "contact-3.png", app: "app-slack.png" },
  { name: "Hanna Botosh", photo: "contact-4.png", app: "app-slack.png" },
  { name: "Hanna Botosh", photo: "contact-5.png", app: "app-messages.png" },
];

const apps = [
  { name: "AirDrop", icon: "app-airdrop.png" },
  { name: "Slack", icon: "app-slack.png" },
  { name: "Messages", icon: "app-messages.png" },
  { name: "Notes", icon: "app-notes.png" },
  { name: "Mail", icon: "app-mail.png" },
];

// SF Symbols can't ship on the web — light line glyphs stand in for them
const glyph = (d: ReactNode) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" aria-hidden>{d}</svg>
);
const icons = {
  copy: glyph(<><rect x="8" y="3" width="11" height="14" rx="2" /><path d="M5 7v12a2 2 0 0 0 2 2h9" /></>),
  folder: glyph(<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />),
  print: glyph(<><path d="M7 9V3h10v6" /><rect x="3" y="9" width="18" height="8" rx="2" /><rect x="7" y="14" width="10" height="7" rx="1" /></>),
  album: glyph(<><rect x="4" y="7" width="16" height="13" rx="2" /><path d="M7 4h10" /><circle cx="12" cy="12" r="2" /><path d="M8.5 18a3.5 3.5 0 0 1 7 0" /></>),
  addAlbum: glyph(<><rect x="4" y="7" width="16" height="13" rx="2" /><path d="M7 4h10M12 10.5v6M9 13.5h6" /></>),
  duplicate: glyph(<><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2M14 11v6M11 14h6" /></>),
  hide: glyph(<><path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z" /><circle cx="12" cy="12" r="2.5" /><path d="M4 4l16 16" /></>),
  slideshow: glyph(<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M10 9.5v5l4.5-2.5z" /></>),
};

const favorite = [
  { label: "Copy Photo", icon: icons.copy },
  { label: "Save to Files", icon: icons.folder },
  { label: "Print", icon: icons.print },
];
const contextual = [
  { label: "Add to Shared Album", icon: icons.album },
  { label: "Add to Album", icon: icons.addAlbum },
  { label: "Duplicate", icon: icons.duplicate },
  { label: "Hide", icon: icons.hide },
  { label: "Slideshow", icon: icons.slideshow },
];

export function ShareSheet({ onSend, onClose }: { onSend: () => void; onClose: () => void }) {
  return (
    <div className="td-sheet" role="dialog" aria-label="Share">
      <div className="td-sheet-header">
        <img className="td-sheet-logo" src={`${dir}/anchorage-logo.svg`} alt="" />
        <p className="td-sheet-title">Create fiat trusted destination</p>
        <p className="td-sheet-url">clientdashboard.anchorage-staging.com</p>
        <span className="td-sheet-options">
          Options
          <svg viewBox="0 0 6 10" width="6" height="10" fill="none" stroke="#bebebf" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M1 1l4 4-4 4" /></svg>
        </span>
        <button type="button" className="td-sheet-dismiss" onClick={onClose} aria-label="Close share sheet">
          <img src={`${dir}/sheet-dismiss.svg`} alt="" />
        </button>
        <img className="td-sheet-divider" src={`${dir}/sheet-divider-header.svg`} alt="" />
      </div>

      <div className="td-sheet-scroll">
        <div className="td-sheet-row td-sheet-contacts">
          {contacts.map((c, i) => (
            <button type="button" key={i} className="td-contact" onClick={onSend}>
              <span className="td-contact-photo"><img src={`${dir}/${c.photo}`} alt="" /></span>
              <img className="td-contact-app" src={`${dir}/${c.app}`} alt="" />
              <span className="td-sheet-label">{c.name}</span>
            </button>
          ))}
        </div>
        <img className="td-sheet-divider-row" src={`${dir}/sheet-divider-full.svg`} alt="" />

        <div className="td-sheet-row td-sheet-apps">
          {apps.map((a) => (
            <button type="button" key={a.name} className="td-app" onClick={onSend} data-tap={a.name === "Slack" ? "send" : undefined}>
              <img className="td-app-icon" src={`${dir}/${a.icon}`} alt="" />
              <span className="td-sheet-label">{a.name}</span>
            </button>
          ))}
        </div>

        <div className="td-sheet-groups">
          {[favorite, contextual].map((group, g) => (
            <div key={g} className="td-sheet-group">
              {group.map((cell, i) => (
                <button type="button" key={cell.label} className="td-cell" onClick={onSend}>
                  <span>{cell.label}</span>
                  {cell.icon}
                  {i < group.length - 1 && <img className="td-cell-divider" src={`${dir}/sheet-divider-cell.svg`} alt="" />}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
