import Link from "next/link";

export default function BusinessPage() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-8 sm:py-10">
      <section className="section-shell px-6 py-6 sm:px-8 sm:py-8">
        <div className="relative z-10 max-w-3xl">
          <p className="eyebrow">Business</p>
          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">업체 센터</h1>
          <p className="mt-4 text-sm leading-8 text-[#655a53] sm:text-base">업체 정보 등록 요청, 정정 요청, 가격 참고 제보를 접수합니다. 공개 전에는 내부 검수 단계를 거칩니다.</p>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        <Link href="/business/claim" className="card rounded-[2rem] p-6 transition hover:-translate-y-1">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#9d8e82]">Claim</p>
          <h2 className="mt-3 text-2xl font-black">업체 등록/정정 요청</h2>
          <p className="mt-3 text-sm leading-7 text-[#665950]">업체명이 없거나 정보 수정이 필요할 때 요청을 남길 수 있습니다.</p>
        </Link>
        <Link href="/report" className="card rounded-[2rem] p-6 transition hover:-translate-y-1">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#9d8e82]">Report</p>
          <h2 className="mt-3 text-2xl font-black">가격·정보 제보</h2>
          <p className="mt-3 text-sm leading-7 text-[#665950]">진료비, 미용비, 장례비 등 참고 정보를 제보할 수 있습니다.</p>
        </Link>
      </section>
    </main>
  );
}