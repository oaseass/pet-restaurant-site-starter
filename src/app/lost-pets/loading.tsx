function NoticeSkeletonCard() {
  return (
    <div className="overflow-hidden rounded-lg border border-[#e5e7eb] bg-white">
      <div className="h-[140px] animate-pulse bg-[#eef1f4]" />
      <div className="space-y-2 p-3">
        <div className="h-4 w-3/4 animate-pulse rounded bg-[#eef1f4]" />
        <div className="h-3 w-full animate-pulse rounded bg-[#f3f4f6]" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-[#f3f4f6]" />
        <div className="flex justify-between gap-3 pt-1">
          <div className="h-3 w-24 animate-pulse rounded bg-[#f3f4f6]" />
          <div className="h-3 w-16 animate-pulse rounded bg-[#e8eefb]" />
        </div>
      </div>
    </div>
  );
}

export default function LostPetsLoading() {
  return (
    <div className="portal-layout">
      <aside className="portal-sidebar" />
      <main className="portal-main bg-white">
        <div className="portal-section-header">
          <div className="space-y-2">
            <div className="h-4 w-28 animate-pulse rounded bg-[#eef1f4]" />
            <div className="h-3 w-40 animate-pulse rounded bg-[#f3f4f6]" />
          </div>
        </div>
        <div className="flex gap-2 border-b border-[#e5e7eb] px-4 py-2">
          <div className="h-7 w-20 animate-pulse rounded bg-[#f3f4f6]" />
          <div className="h-7 w-28 animate-pulse rounded bg-[#e8eefb]" />
        </div>
        <div className="portal-notice-bar">
          <div className="h-3 w-56 animate-pulse rounded bg-[#eef1f4]" />
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3 p-4">
          {Array.from({ length: 6 }, (_, index) => <NoticeSkeletonCard key={index} />)}
        </div>
      </main>
      <aside className="portal-rail" />
    </div>
  );
}