import type { Metadata } from "next";
import { Geist_Mono, Instrument_Serif } from "next/font/google";
import localFont from "next/font/local";
import { MenuProvider } from "@/components/CommandMenu";
import { BottomBlur } from "@/components/EdgeBlur";
import { MobileBar } from "@/components/MobileBar";
import { Nav } from "@/components/Nav";
import { Preloader } from "@/components/Preloader";
import { Toolbar } from "@/components/Toolbar";
import { INTRO_KEY } from "@/lib/intro";
import "./globals.css";

const maragsa = localFont({
  src: "./fonts/MaragsaDisplay.otf",
  variable: "--font-maragsa",
  display: "block",
});

// Trial licences — swap for the licensed web font before launch
const graphik = localFont({
  src: "./fonts/Graphik-Regular-Trial.otf",
  variable: "--font-graphik",
  weight: "400",
});

const graphikWide = localFont({
  src: "./fonts/GraphikWide-Regular-Trial.otf",
  variable: "--font-graphik-wide",
  weight: "400",
});

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

// Runs once the page markup is parsed: a direct visit to /design opens at the Design section.
const designScrollScript = `if(location.pathname==="/design"){var d=document.getElementById("design");d&&d.scrollIntoView({behavior:"instant"})}`;

export default function RootLayout({ children, modal }: LayoutProps<"/">) {
  return (
    // The intro script sets data-intro on <html> before React hydrates.
    // data-scroll-behavior="smooth": keep smooth in-page scrolling (Hey ↔ Design) but jump
    // instantly to the top on page changes (Next 16 no longer does this by default).
    <html lang="en" className={`${maragsa.variable} ${graphik.variable} ${graphikWide.variable} ${geistMono.variable} ${instrumentSerif.variable}`} data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: loaderScript }} />
        <script dangerouslySetInnerHTML={{ __html: introScript }} />
        <script dangerouslySetInnerHTML={{ __html: navVariantScript }} />
      </head>
      <body>
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
        <script dangerouslySetInnerHTML={{ __html: designScrollScript }} />
      </body>
    </html>
  );
}
