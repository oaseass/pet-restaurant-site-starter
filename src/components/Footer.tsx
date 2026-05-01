import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-20 px-5 pb-10 pt-4">
      <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-[1.5fr_0.8fr_0.9fr]">
        <div className="card rounded-[2rem] p-5 text-sm leading-7 text-gray-600">
          본 사이트는 식품안전나라 공개 정보를 보기 쉽게 정리한 조회 서비스입니다. 사용자 검색 시 원본 사이트를 호출하지 않고,
          서버 크론이 하루 1회만 동기화한 자체 DB를 조회합니다. 실제 방문 전 영업 여부와 반려동물 동반 조건은 업소에 직접 확인하세요.
        </div>
        <div className="card rounded-[2rem] p-5 text-sm text-gray-600">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-gray-400">Quick Links</p>
          <div className="mt-4 flex flex-col gap-3 font-bold">
            <Link href="/search">식당 검색</Link>
            <Link href="/regions/서울">지역별 보기</Link>
            <Link href="/guide">이용 가이드</Link>
          </div>
        </div>
        <div className="card rounded-[2rem] p-5 text-sm leading-7 text-gray-600">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-gray-400">Policy</p>
          <p className="mt-4">목록에 없다고 동반 불가라고 단정하지 않습니다.</p>
          <p className="mt-2">공식 데이터 출처와 기준일을 주요 페이지에 계속 표시합니다.</p>
        </div>
      </div>
    </footer>
  );
}
