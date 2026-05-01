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
    <div className="card rounded-[2rem] p-8 text-center">
      <div className="mx-auto h-28 w-28 rounded-full bg-[radial-gradient(circle_at_35%_35%,rgba(255,184,107,0.26),rgba(189,237,220,0.22),transparent_70%)] p-3">
        <CharacterImage asset={character} className="h-full w-full" imageClassName="object-contain" />
      </div>
      <h3 className="mt-4 text-xl font-black tracking-tight">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-[#665950]">{description}</p>
    </div>
  );
}