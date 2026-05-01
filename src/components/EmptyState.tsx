import { CharacterImage } from "@/components/CharacterImage";
import type { CharacterAsset } from "@/lib/platform-content";

export function EmptyState({
  title,
  description,
  character = "dog-brown",
}: {
  title: string;
  description: string;
  character?: CharacterAsset;
}) {
  return (
    <div className="card rounded-[1.25rem] p-8 text-center">
      <div className="mx-auto h-24 w-24 rounded-2xl bg-[var(--accent-soft)] p-3">
        <CharacterImage asset={character} className="h-full w-full" imageClassName="object-contain" />
      </div>
      <h3 className="mt-4 text-xl font-black tracking-tight">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{description}</p>
    </div>
  );
}