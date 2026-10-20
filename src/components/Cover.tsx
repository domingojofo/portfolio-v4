import Image from "next/image";
import type { Project } from "@/content/projects";
import { GradientField } from "./GradientField";
import { AnchorageScene } from "./demos/anchorage/AnchorageScene";
import { ElevenLabsScene } from "./demos/elevenlabs/ElevenLabsScene";
import { OamoEligible } from "./demos/oamo-mockup/OamoEligible";
import { OamoScene } from "./demos/oamo-mockup/OamoScene";

// A project's cover: its image; a silent looping video with the image as its poster; the animated
// GradientField; or a scene of its own (Anchorage, ElevenLabs, OAMO). `live` pauses a scene that isn't
// in view; `deck` is the home page's project card (OAMO shows its eligibility check there, and the
// devices in the project itself).
export function Cover({ cover, sizes, eager = false, live = true, deck = false }: { cover: Project["cover"]; sizes: string; eager?: boolean; live?: boolean; deck?: boolean }) {
  if (cover.scene === "anchorage") {
    return (
      <span className="cover-scene" role="img" aria-label={cover.alt}>
        <AnchorageScene live={live} />
      </span>
    );
  }
  if (cover.scene === "oamo") {
    return (
      <span className="cover-scene" role="img" aria-label={cover.alt}>
        {deck ? <OamoEligible cover={cover} live={live} eager={eager} /> : <OamoScene cover={cover} live={live} eager={eager} />}
      </span>
    );
  }
  // ElevenLabs: the generate flow on its own grey wave backdrop (the gradient is off for now)
  if (cover.scene === "elevenlabs") {
    return (
      <span className="cover-scene" role="img" aria-label={cover.alt}>
        <ElevenLabsScene />
      </span>
    );
  }
  if (cover.gradient) {
    return (
      <span className="cover-gradient" role="img" aria-label={cover.alt}>
        <GradientField {...cover.gradient} />
      </span>
    );
  }
  if (cover.video) {
    return (
      <video
        className="cover-video"
        src={cover.video}
        poster={cover.src}
        width={cover.width}
        height={cover.height}
        aria-label={cover.alt}
        autoPlay
        muted
        loop
        playsInline
        preload={eager ? "auto" : "metadata"}
      />
    );
  }
  return (
    <Image src={cover.src} width={cover.width} height={cover.height} alt={cover.alt} sizes={sizes}
      loading={eager ? "eager" : "lazy"} unoptimized={cover.src.endsWith(".svg")} />
  );
}
