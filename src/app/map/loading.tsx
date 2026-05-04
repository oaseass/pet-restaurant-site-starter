export default function MapLoading() {
  return (
    <div className="mx-auto grid min-h-[calc(100svh-56px)] max-w-[1440px] grid-cols-1 gap-0 bg-white lg:grid-cols-[360px_minmax(0,1fr)]">
      <section className="border-r border-[var(--line)] bg-white p-4">
        <div className="space-y-3">
          <div className="h-4 w-24 animate-pulse rounded bg-[#eef1f4]" />
          <div className="h-9 w-4/5 animate-pulse rounded bg-[#eef1f4]" />
          <div className="h-11 w-full animate-pulse rounded-full bg-[#f3f4f6]" />
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="h-16 animate-pulse rounded-lg border border-[var(--line)] bg-[#f8faf9]" />
            <div className="h-16 animate-pulse rounded-lg border border-[var(--line)] bg-[#edf7f2]" />
          </div>
        </div>
        <div className="mt-5 space-y-3">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="rounded-lg border border-[var(--line)] bg-white p-4">
              <div className="h-4 w-2/3 animate-pulse rounded bg-[#eef1f4]" />
              <div className="mt-3 h-3 w-full animate-pulse rounded bg-[#f3f4f6]" />
              <div className="mt-2 h-3 w-3/4 animate-pulse rounded bg-[#f3f4f6]" />
            </div>
          ))}
        </div>
      </section>
      <section className="relative min-h-[420px] bg-[#eaf1ed]">
        <div className="absolute inset-4 rounded-lg border border-[rgba(31,107,91,0.18)] bg-[linear-gradient(135deg,#edf7f2,#f8faf9)]" />
        <div className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-white/80 shadow-sm" />
      </section>
    </div>
  );
}