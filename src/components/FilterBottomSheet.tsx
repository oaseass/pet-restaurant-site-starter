import type { ReactNode } from "react";

export function FilterBottomSheet({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="card rounded-[1.7rem] p-4 md:hidden">
      <summary className="cursor-pointer list-none text-sm font-black text-[#4d443f]">{title}</summary>
      <div className="mt-4">{children}</div>
    </details>
  );
}