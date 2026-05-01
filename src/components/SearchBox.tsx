import { Search } from "lucide-react";

export function SearchBox({ defaultValue = "", action = "/search" }: { defaultValue?: string; action?: string }) {
  return (
    <form action={action} className="card flex flex-col gap-3 rounded-[1.1rem] p-3 sm:flex-row sm:items-center sm:p-3.5">
      <div className="relative flex-1">
        <span className="pointer-events-none absolute left-4 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
          <Search size={18} />
        </span>
        <input
          name="q"
          defaultValue={defaultValue}
          className="input pl-14"
          placeholder="동네, 식당, 병원, 미용, 찾아요, 가이드 검색"
        />
      </div>
      <button className="btn-primary w-full sm:w-auto" type="submit">검색</button>
    </form>
  );
}
