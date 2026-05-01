import clsx from "clsx";
import { CharacterImage } from "@/components/CharacterImage";
import type { CharacterAsset } from "@/lib/platform-content";

const MASCOTS = {
  peekCat: "cat-waving",
  curiousCat: "cat-peeking",
  mintDog: "dog-hoodie",
  peekShiba: "dog-brown",
  softPoodle: "puppy-front-white",
  snowyDog: "puppy-side-white",
} as const;

export type MascotName = keyof typeof MASCOTS;

export function MascotSticker({
  name,
  className,
  imageClassName,
  priority = false,
}: {
  name: MascotName;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
}) {
  return (
    <div aria-hidden="true" className={clsx("pointer-events-none relative select-none", className)}>
      <CharacterImage
        asset={MASCOTS[name] as CharacterAsset}
        priority={priority}
        className="h-full w-full"
        imageClassName={clsx("drop-shadow-[0_16px_32px_rgba(72,51,38,0.18)]", imageClassName)}
      />
    </div>
  );
}