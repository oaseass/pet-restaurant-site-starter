export default function SearchLoading() {
  return (
    <div className="portal-layout">
      <aside className="portal-sidebar" />
      <main className="portal-main bg-white">
        <div className="sticky top-0 z-20 border-b border-[var(--line)] bg-white px-4 py-3">
          <div className="mb-2 h-4 w-12 animate-pulse rounded bg-[#eef1f4]" />
          <div className="flex gap-2">
            <div className="h-11 flex-1 animate-pulse rounded-lg bg-[#f3f4f6]" />
            <div className="h-11 w-16 animate-pulse rounded-lg bg-[var(--brand-soft)]" />
            <div className="h-11 w-16 animate-pulse rounded-lg bg-white ring-1 ring-[var(--brand)]" />
          </div>
        </div>
        <div className="flex gap-2 border-b border-[var(--line)] px-4 py-2">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="h-7 w-16 animate-pulse rounded-full bg-[#f3f4f6]" />
          ))}
        </div>
        <div className="divide-y divide-[var(--line)]">
          {Array.from({ length: 8 }, (_, index) => (
            <div key={index} className="flex min-h-12 items-center gap-3 px-4 py-3">
              <div className="h-5 w-9 animate-pulse rounded bg-[#e8f7f1]" />
              <div className="h-4 flex-1 animate-pulse rounded bg-[#eef1f4]" />
              <div className="h-4 w-16 animate-pulse rounded bg-[#f3f4f6]" />
            </div>
          ))}
        </div>
      </main>
      <aside className="portal-rail" />
    </div>
  );
}