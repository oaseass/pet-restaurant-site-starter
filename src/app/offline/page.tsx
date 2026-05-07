export default function OfflinePage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-16">
      <div className="card rounded-[2rem] p-8 text-center">
        <p className="eyebrow">Offline</p>
        <h1 className="mt-4 text-3xl font-black tracking-tight">오프라인 상태입니다.</h1>
        <p className="mt-4 text-sm leading-8 text-[#665950]">네트워크가 다시 연결되면 최신 정보를 다시 불러올 수 있습니다. 연결 전에는 저장된 정보만 볼 수 있어요.</p>
      </div>
    </main>
  );
}