import { Search } from "lucide-react";

export function SearchBox({ defaultValue = "", action = "/search" }: { defaultValue?: string; action?: string }) {
  return (
    <form action={action} className="card flex flex-col gap-3 rounded-[2rem] p-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <span className="pointer-events-none absolute left-4 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-slate-100 text-gray-400">
          <Search size={18} />
        </span>
        <input
          name="q"
          defaultValue={defaultValue}
          className="input pl-14"
          placeholder="지역, 업소명, 주소 검색 예: 광주 광산구 / 강남구 / 커피빈"
        />
      </div>
      <button className="btn-primary w-full sm:w-auto" type="submit">검색하기</button>
    </form>
  );
}
