"use client";

import { useState } from "react";
import clsx from "clsx";
import Image from "next/image";
import type { CharacterAsset } from "@/lib/platform-content";

const CHARACTER_ASSET_PATHS: Record<CharacterAsset, string> = {
  "puppy-front-white": "/images/characters/puppy-front-white.png",
  "puppy-side-white": "/images/characters/puppy-side-white.png",
  "dog-hoodie": "/images/characters/dog-hoodie.png",
  "dog-brown": "/images/characters/dog-brown.png",
  "cat-waving": "/images/characters/cat-waving.png",
  "cat-peeking": "/images/characters/cat-peeking.png",
  "theme-hospital": "/images/characters/theme-hospital.png",
  "theme-restaurant": "/images/characters/theme-restaurant.png",
  "theme-grooming": "/images/characters/theme-grooming.png",
  "theme-hotel": "/images/characters/theme-hotel.png",
  "theme-pharmacy": "/images/characters/theme-pharmacy.png",
  "theme-memorial": "/images/characters/theme-memorial.png",
  "gen-shiba": "/images/characters/gen-shiba.png",
  "gen-corgi": "/images/characters/gen-corgi.png",
  "gen-maltese": "/images/characters/gen-maltese.png",
};

export function CharacterImage({
  asset,
  alt = "",
  className,
  imageClassName,
  priority = false,
  decorative = true,
  sizes = "(max-width: 640px) 96px, (max-width: 1024px) 160px, 220px",
}: {
  asset: CharacterAsset;
  alt?: string;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
  decorative?: boolean;
  sizes?: string;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <div className={clsx("relative overflow-hidden rounded-[1.75rem]", className)}>
      {failed ? (
        <div className="h-full w-full rounded-[inherit] bg-[radial-gradient(circle_at_30%_30%,rgba(255,184,107,0.32),rgba(189,237,220,0.26),rgba(255,255,255,0.32))]" />
      ) : (
        <Image
          src={CHARACTER_ASSET_PATHS[asset]}
          alt={decorative ? "" : alt}
          fill
          priority={priority}
          sizes={sizes}
          onError={() => setFailed(true)}
          className={clsx("object-contain", imageClassName)}
        />
      )}
    </div>
  );
}