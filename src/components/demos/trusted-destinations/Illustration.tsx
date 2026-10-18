/* eslint-disable @next/next/no-img-element -- static Figma SVG layers, sized by their slots */
import type { CSSProperties } from "react";

// Drawer illustrations, rebuilt from their Figma layers. Each part sits at its Figma inset
// inside the artwork layer; `wrap` is the export's bleed (strokes drawn past the layer box).
type Part = {
  src: string;
  inset: string;
  wrap?: string;
  mask?: { src: string; position: string; size: string };
};

const dir = "/demos/trusted-destinations";

// "Log in on your computer" — shown before the user has a dashboard session
const login: { layer: string; parts: Part[] } = {
  layer: "0.09% 9.2% 0.18% 9.29%",
  parts: [
    { src: "login-1.svg", inset: "15.28% 10.81% 0.25% 23.58%", wrap: "-1.76% -1.24% -1.31% -0.92%" },
    { src: "login-2.svg", inset: "0.57% 67.26% 87.27% 16.75%", wrap: "-5.31% -7.06% -6.05% -4.44%" },
    { src: "login-3.svg", inset: "66.95% 83.57% 9.29% 2.6%", wrap: "-3.66% -3.47%" },
    { src: "login-4.svg", inset: "74.26% 87.76% 16.66% 6.77%" },
    {
      src: "login-5.svg", inset: "76.09% 88.14% 14.83% 6.4%", wrap: "-16.36% -14.93%",
      mask: { src: "login-5-mask.svg", position: "2.802px -8.177px", size: "40.536px 40.535px" },
    },
    { src: "login-6.svg", inset: "32.11% 0.31% 10.48% 53.39%", wrap: "0 -1.76% -2.59% 0" },
    { src: "login-7.svg", inset: "22.57% 80.92% 44.47% 0.31%", wrap: "0 0 0 -4.35%" },
    { src: "login-8.svg", inset: "72.01% 7.57% 17.67% 87.51%" },
    { src: "login-9.svg", inset: "0.43% 4.82% 78.8% 80.9%", wrap: "-6.13% -4.9%" },
  ],
};

// "Connected" — the link is ready to finish on the computer
const connected: { layer: string; parts: Part[] } = {
  layer: "0.2% 7.22% 0.07% 7.21%",
  parts: [
    { src: "done-1.svg", inset: "14.97% 14.73% 0.26% 22.55%", wrap: "-1.76% -1.24% -1.32% -0.92%" },
    { src: "done-2.svg", inset: "0.21% 68.7% 87.58% 16.01%", wrap: "-5.32% -7.06% -6.05% -4.44%" },
    { src: "done-3.svg", inset: "66.81% 84.3% 9.33% 2.49%", wrap: "-3.66% -3.47%" },
    { src: "done-4.svg", inset: "74.18% 88.3% 16.71% 6.48%" },
    {
      src: "done-5.svg", inset: "76.01% 88.66% 14.87% 6.12%", wrap: "-3.57% -3.26%",
      mask: { src: "done-5-mask.svg", position: "2.812px -8.22px", size: "40.684px 40.684px" },
    },
    { src: "done-6.svg", inset: "31.85% 4.7% 10.52% 51.04%", wrap: "0 -1.76% -2.59% 0" },
    { src: "done-7.svg", inset: "22.29% 81.76% 44.63% 0.29%", wrap: "0 0 0 -0.95%" },
    { src: "done-8.svg", inset: "51.06% 19.24% 22.9% 65.83%", wrap: "-5.82% -5.31%" },
    { src: "done-9.svg", inset: "18.26% 0.18% 72.51% 91.68%", wrap: "-3.24% -5.58% -11.68% -8.69%" },
  ],
};

function maskStyle(mask: Part["mask"]): CSSProperties | undefined {
  if (!mask) return undefined;
  const url = `url("${dir}/${mask.src}")`;
  return {
    maskImage: url, WebkitMaskImage: url,
    maskPosition: mask.position, WebkitMaskPosition: mask.position,
    maskSize: mask.size, WebkitMaskSize: mask.size,
    maskRepeat: "no-repeat", WebkitMaskRepeat: "no-repeat",
    maskMode: "alpha",
    maskComposite: "intersect",
    maskClip: "no-clip",
  };
}

export type Theme = "dark" | "light";

// Light variants swap the white linework and dark knockouts; the blue stays
export const themed = (file: string, theme: Theme) => (theme === "light" ? file.replace(/\.svg$/, ".light.svg") : file);

export function Illustration({ variant, theme }: { variant: "login" | "connected"; theme: Theme }) {
  const art = variant === "login" ? login : connected;
  return (
    <div className="td-illu" aria-hidden>
      <div className="td-illu-layer" style={{ inset: art.layer }}>
        {art.parts.map((p) => (
          <div key={p.src} className="td-illu-part" style={{ inset: p.inset, ...maskStyle(p.mask) }}>
            <div className="td-illu-part" style={{ inset: p.wrap ?? 0 }}>
              <img src={`${dir}/${themed(p.src, theme)}`} alt="" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
