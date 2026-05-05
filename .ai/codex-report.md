# Codex Report

## 수정 내용
- 보호동물 공고 목록에서 상세 링크 자동 prefetch를 끄고, 보호동물 탭 진입 시 실종 제보 DB 조회를 생략해 초기 렌더링 부담을 줄였습니다.
- 검색 결과 상단의 "지도에서 보기" 링크가 동물병원·동물약국·미용·유치원·호텔·장례 의도를 지도 카테고리까지 유지하도록 연결했습니다.
- `AdSlot`이 `NEXT_PUBLIC_ADSENSE_DEFAULT_SLOT_ID`를 기본 slot으로 사용할 수 있게 해, 개별 slotId가 없어도 운영 환경에서 광고 노출 설정이 가능하도록 했습니다.
- 장소 상세, 보호동물 목록, 보호동물 상세에 광고 슬롯 위치를 추가했습니다. 광고 환경변수가 없으면 기존처럼 화면에 노출되지 않습니다.

## 검증 결과
- `npm test`: 통과 (22개 테스트)
- `npm run build`: 통과 (Next.js 15.5.15 production build)
- `business-enrichment.json` 안전 검증: total 663, targetTypes PLACE/RESTAURANT, bad 0
- 금지 변경 확인: `.env.local`, `public/data/business-enrichment.json`, `prisma/schema.prisma`, `prisma/migrations` 변경 없음
- 프로덕션 URL 확인: 배포 후 갱신 예정

## 커밋 hash
- 기능 변경 커밋: `43df261f10f2fc5b2ae86c0517370db99eb81175`

## 남은 문제
- 현재 작업트리에 이전 build/export 산출물로 보이는 `public/data/**` 수정과 `hosp_check.html` 삭제가 남아 있습니다. 이번 작업에서는 스테이징하지 않았습니다.
- 실제 AdSense 노출은 Vercel 환경변수 `NEXT_PUBLIC_ADSENSE_ENABLED=true`, `NEXT_PUBLIC_ADSENSE_CLIENT_ID`, `NEXT_PUBLIC_ADSENSE_DEFAULT_SLOT_ID` 설정 후 확인이 필요합니다.
