import type { Metadata } from "next";
import { Geist_Mono, Instrument_Serif, Public_Sans } from "next/font/google";
import localFont from "next/font/local";
import { MenuProvider } from "@/components/CommandMenu";
import { DotGrid } from "@/components/DotGrid";
import { BottomBlur } from "@/components/EdgeBlur";
import { MobileBar } from "@/components/MobileBar";
import { Nav } from "@/components/Nav";
import { Preloader } from "@/components/Preloader";
import { Toolbar } from "@/components/Toolbar";
import { INTRO_KEY } from "@/lib/intro";
import "./globals.css";

// Display serif: Gelica (Fontspring demo files — swap for the licensed web font before launch)
const gelica = localFont({
  src: [
    { path: "./fonts/Gelica-ExtraLight.otf", weight: "200", style: "normal" },
    { path: "./fonts/Gelica-ExtraLightItalic.otf", weight: "200", style: "italic" },
    { path: "./fonts/Gelica-Light.otf", weight: "300", style: "normal" },
    { path: "./fonts/Gelica-LightItalic.otf", weight: "300", style: "italic" },
    { path: "./fonts/Gelica-Regular.otf", weight: "400", style: "normal" },   // former Maragsa headings
  ],
  variable: "--font-gelica",
  display: "block",
});

// Everything that isn't Gelica: text, headlines, UI
const publicSans = Public_Sans({ subsets: ["latin"], variable: "--font-public-sans", display: "block" });

// Bottom-right location + time (Figma 152:65629)
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", weight: "400" });

// Test preloader type — not preloaded, it only shows with ?loader
const instrumentSerif = Instrument_Serif({ subsets: ["latin"], variable: "--font-instrument-serif", weight: "400", preload: false });

export const metadata: Metadata = {
  title: { default: "Jofo — Relentlessly Collaborative", template: "%s — Jofo" },
  description: "Hands-on product design leader specializing in FinTech and AI-driven interfaces.",
};

// Runs before first paint. Mirrors shouldPlayIntro() in Hero.tsx: on "/", once per session,
// motion allowed → mark the intro as playing so the page starts in its pre-intro state.
const introScript = `try{if(location.pathname==="/"&&!sessionStorage.getItem(${JSON.stringify(INTRO_KEY)})&&!matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.dataset.intro="playing"}catch(e){}`;

// Test preloader: ?loader (or /loader-test) shows it on this load, then replays the hero intro
// behind it. Runs before the intro script so the intro is armed even if it already played.
const loaderScript = `try{if(new URLSearchParams(location.search).has("loader")&&!matchMedia("(prefers-reduced-motion: reduce)").matches){document.documentElement.dataset.loader="on";sessionStorage.removeItem(${JSON.stringify(INTRO_KEY)})}}catch(e){}`;

// Nav variant being tested. The icon toolbar is the default for now; ?nav=words switches this
// browser back to the word nav, ?nav=toolbar (or /nav-test) to the toolbar. Remembered in
// localStorage; set before first paint so the page never flashes the other nav.
const navVariantScript = `try{var v=new URLSearchParams(location.search).get("nav");if(v){localStorage.setItem("nav-variant",v);history.replaceState(null,"",location.pathname+location.hash)}if((localStorage.getItem("nav-variant")||"toolbar")==="toolbar")document.documentElement.classList.add("nav-toolbar")}catch(e){}`;

export default function RootLayout({ children, modal }: LayoutProps<"/">) {
  return (
    // The intro script sets data-intro on <html> before React hydrates.
    // data-scroll-behavior="smooth": keep smooth in-page scrolling but jump
    // instantly to the top on page changes (Next 16 no longer does this by default).
    <html lang="en" className={`${gelica.variable} ${publicSans.variable} ${geistMono.variable} ${instrumentSerif.variable}`} data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: loaderScript }} />
        <script dangerouslySetInnerHTML={{ __html: introScript }} />
        <script dangerouslySetInnerHTML={{ __html: navVariantScript }} />
        {/* Without JS the word reveal never runs — show headings as they are */}
        <noscript><style>{`.rv-pending .rv-in{transform:none!important}`}</style></noscript>
      </head>
      <body>
        <DotGrid />
        <div className="paper" />
        <MenuProvider>
          {children}
          {modal}
          <Nav />
          <Toolbar />
          <BottomBlur />
          <MobileBar />
        </MenuProvider>
        <Preloader />
      </body>
    </html>
  );
}
