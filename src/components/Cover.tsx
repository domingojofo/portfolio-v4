import Image from "next/image";
import type { Project } from "@/content/projects";
import { GradientField } from "./GradientField";
import { ElevenLabsScene } from "./demos/elevenlabs/ElevenLabsScene";

// A project's cover: its image; a silent looping video with the image as its poster; or the
// animated GradientField.
export function Cover({ cover, sizes, eager = false }: { cover: Project["cover"]; sizes: string; eager?: boolean }) {
  if (cover.gradient) {
    return (
      <span className="cover-gradient" role="img" aria-label={cover.alt}>
        <GradientField {...cover.gradient} />
        {cover.scene === "elevenlabs" && <ElevenLabsScene />}
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
