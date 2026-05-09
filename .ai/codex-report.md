# Codex Report

## 관리자 보강 큐 라운드 진행 결과

1. 보강 큐를 만든 이유
- 공개 상세에 이미 붙어 있는 정보 완성도 등급을 운영 큐로 연결해, `정보 부족 업체를 나중에 보자`가 아니라 `오늘 무엇부터 보강할지`를 관리자 화면에서 바로 결정할 수 있게 만들었습니다.
- 기존 `확인 제보 검수`가 전화·방문 검수 흐름을 다뤘다면, 이번 `보강 필요 업체` 탭은 좌표, 전화번호, 외부 지도 비교, 사진, 후기처럼 빠진 핵심 정보가 많은 업체를 우선적으로 모아주는 운영용 큐입니다.

2. 표시 기준
- 대상은 공개 스냅샷 기준 `정보 완성도 NEEDS_CHECK / C / B`에 해당하는 식당·장소만 포함합니다.
- 계산에는 출처 여부, 전화번호, 외부 지도 링크/카테고리, 승인 후기 수, 좌표, 사진, 최근 승인된 운영 확인, 최근 갱신일을 함께 반영합니다.
- 정렬은 등급 우선(`NEEDS_CHECK` → `C` → `B`), 빠진 항목 수, 카테고리 우선순위, 마지막 반영일 순서입니다.
- 운영 화면에는 전체 집계와 함께 상위 24곳만 먼저 노출합니다.

3. 기존 관리자 기능 영향 여부
- 기존 `/admin/business-checks` 기본 화면은 그대로 유지됐습니다. 상태 카드(`대기/승인/거절/전체`), `오늘 확인할 업체 추천`, `업체 검색 후 확인 등록`, `운영 확인 직접 등록`, 기존 제보 승인·거절 목록 구조는 깨지지 않았습니다.
- production 확인 결과 기존 검수 화면에서 `오늘 확인할 업체 추천` 카드와 `확인 등록` 폼이 그대로 노출됐고, 새 `보강 필요 업체` 탭만 추가된 형태로 동작했습니다.
- 비인증 접근은 여전히 관리자 로그인으로 유도돼, 권한 없는 공개 접근 구조로 바뀌지 않았습니다.

4. npm test 결과
- `npm test`: 통과
- 결과: 39개 테스트 통과, 실패 0개

5. npm run build 결과
- 최초 build에서 `src/app/admin/business-checks/page.tsx`의 카테고리 라벨 인덱싱 타입 오류 1건을 확인했습니다.
- `getAdminPlaceCategoryLabel(category: string)` helper로 안전하게 라벨을 읽도록 보정한 뒤 `npm run build` 재실행에 최종 통과했습니다.
- Prisma generate, public snapshot export, Next.js production build, 타입 검사까지 최종 완료했습니다.

6. 금지 파일 변경 여부
- `.env.local`: 변경 없음
- `public/data/business-enrichment.json`: 변경 없음
- `public/data/**`: build로 재생성됐지만 `git restore -- public/data`로 원복해 커밋 대상에서 제외했습니다.
- `prisma/schema.prisma`, `prisma/migrations/20260508123000_add_business_checks/`: 현재 워크트리에 이미 변경/추가 상태가 남아 있습니다. 이번 마감 단계에서 새 migration을 만들거나 추가 스키마 수정을 하지는 않았습니다.

7. production 또는 preview 확인 결과
- production 배포: `https://pet-restaurant-site-starter-9mtdnczul-larchides-projects.vercel.app`
- alias: `https://pet-restaurant-site-starter.vercel.app`
- 인증된 관리자 세션으로 `/admin/business-checks` 확인 결과, 기존 `확인 제보 검수` 화면에서 상태 카드와 `오늘 확인할 업체 추천` 폼이 정상 노출됐습니다.
- `/admin/business-checks?view=gaps` 확인 결과, 새 `보강 필요 업체 큐` 헤더와 요약 카드(`보강 필요 전체 53,726`, `확인 필요 0`, `정보 완성도 C 34,380`, `정보 완성도 B 19,346`)가 노출됐습니다.
- 같은 화면에서 `오늘 먼저 보강할 업체` 목록이 상위 24건 기준으로 노출됐고, 현재 실제 데이터에서는 `확인 필요`가 0건이라 `정보 완성도 C` 업체들이 최상단에 먼저 보였습니다.
- 비인증 상태에서 같은 URL을 요청하면 관리자 로그인 화면으로 이동하는 것을 별도 확인했습니다.

8. 남은 문제
- 현재 production 스냅샷에는 `정보 완성도 NEEDS_CHECK`가 0건이라, 실제 화면에서 `NEEDS_CHECK`가 `C/B`보다 위에 뜨는 장면까지는 직접 보지 못했습니다. 다만 정렬 함수는 해당 우선순위대로 구현돼 있습니다.
- 보강 큐는 현재 빠진 항목 수 중심으로 강하게 정렬되므로, 지역 분산이나 카테고리 다양성을 더 주고 싶다면 후속 조정이 필요합니다.

9. 다음 제안
- 보강 큐에 `전화번호 부족`, `좌표 부족`, `사진 부족`, `후기 부족` 같은 빠진 항목 필터를 붙이면 운영자가 업무 종류별로 바로 처리할 수 있습니다.
- `정보 보강` 제보가 실제로 들어온 항목과 `운영 확인` 승인 이력을 한 카드에 묶어 보여주면, 보강 큐와 검수 큐를 따로 오가지 않고 한 번에 판단할 수 있습니다.

## 가짜 비주얼 블록 제거 및 장소 페이지 단순화 결과

1. 이번 라운드에서 되돌린 문제
- 직전 커밋의 사진 대체 블록은 실제 사진이 없다는 사실을 설명하려다, 오히려 AI가 만든 듯한 가짜 비주얼 영역처럼 보였습니다.
- 목록/검색/지도 카드에 대표 메뉴, 진료 항목, 서비스가 비어 있다는 안내가 실제 데이터처럼 크게 노출되었습니다.
- 상세 상단의 우측 비주얼 블록과 미확인 서비스 카드가 업체명, 주소, 전화, 지도 분류 같은 실제 정보를 밀어냈습니다.

2. 실제로 제거한 것
- 사진 대체 컴포넌트를 삭제했습니다.
- 가짜 비주얼과 빈 정보 노출에 쓰이던 helper 필드를 공통 장소 정체성 helper, 지도 타입, 카드 데이터 생성 흐름에서 제거했습니다.
- 공개 화면에서 가짜 사진 안내, 카테고리 구분용 비주얼 안내, 미확인 정보 강조 문구가 노출되지 않게 정리했습니다.
- 카드 본문에서 업데이트 날짜, 빈 대표 메뉴/서비스, 반복되는 무후기 문구를 줄이고 업체명, 장소 성격, 지역, 주소, 전화/지도/상세/후기 CTA 중심으로 단순화했습니다.

3. 목록/검색/지도 구조 변경
- `RestaurantCard`, `PlaceCard`, `SearchResultsList`, `PlaceListSection`은 가짜 좌측 비주얼 영역 없이 배지, 업체명, 지역/주소, 실제 연결 가능한 정보만 보여줍니다.
- 지도 목록(`MapListPanel`, `MapBottomSheet`, `MapShell`)도 같은 구조로 맞추고, 후기 라벨은 실제 승인 후기가 있을 때만 표시합니다.
- 홈 카테고리 카드는 건수보다 `좌석은 가기 전 확인`, `재고는 전화 확인` 같은 사용 목적 중심 보조 문구로 낮췄습니다.

4. 상세 페이지 구조 변경
- 식당 상세와 장소 상세 상단에서 가짜 비주얼 블록, 대표 메뉴/진료 항목/서비스 빈칸, 큰 미확인 정보 박스를 제거했습니다.
- 상단은 업체명, 장소 성격, 주소, 전화, 지도 분류, 후기, 지도/길찾기/전화/후기 CTA를 중심으로 재정리했습니다.
- 메뉴, 좌석, 서비스, 비용, 사진 같은 보완 정보는 상세 하단의 `정보를 더 정확하게 만들기` 섹션으로 옮겼습니다.
- `GROOMING`/`DAYCARE` enrichment 비노출 보호 로직은 유지했습니다.

5. 검증 결과
- `npm test`: 통과, 27개 테스트 통과, 실패 0개.
- `npm run build`: 통과, Prisma generate, public data export, Next.js production build, 타입 검사 모두 통과.
- build가 재생성한 `public/data/**` 변경은 커밋 대상에서 제외했습니다.

6. production 확인 결과
- 배포: `https://pet-restaurant-site-starter-79ned1zcr-larchides-projects.vercel.app`
- alias: `https://pet-restaurant-site-starter.vercel.app`
- 390px 모바일 폭으로 `/`, `/restaurants`, `/hospitals`, `/pharmacy`, `/map?lat=35.190605&lng=126.815636&category=all`, `/restaurants/9bbc43ee-d9c5-4fac-a593-116d3cced8d6`, `/places/33e00bc4-44eb-4e88-a866-e1a3a868832b`, `/places/bd5eeb9b-cfb6-4bcb-a9fe-38f9a7556b31` 확인 완료.
- 확인 경로 모두 200 응답, 가로 overflow 없음, 금지 문구 노출 없음, 가짜 사진 안내 영역 없음.

7. 남은 한계
- 실제 대표 메뉴, 진료 항목, 약품 재고, 미용 가능 견종, 호텔링 조건, 장례 비용은 검증된 구조화 데이터가 아직 없어 상단에 단정 표시하지 않았습니다.
- 상세의 `정보를 더 정확하게 만들기`는 실제 제보/업체 등록 데이터가 쌓이면 더 구체적인 정보 카드로 바꾸는 것이 좋습니다.

## 114 전화번호부 느낌 제거 라운드 보관 요약

- 이전 라운드에서는 업체명, 주소, 전화, 버튼이 반복되는 전화번호부식 구조를 줄이기 위해 장소 성격 helper와 카테고리별 문맥을 추가했습니다.
- 다만 그 과정에서 사진 대체용 시각 블록과 빈 정보 CTA가 과하게 커져 이번 라운드에서 폐기했습니다.
- 현재 기준의 실제 적용 상태는 바로 위 `가짜 비주얼 블록 제거 및 장소 페이지 단순화 결과` 섹션을 기준으로 보면 됩니다.

## AI 느낌 제거 및 공개 화면 톤 정리 진행 결과

1. AI 느낌이 강했던 문구/화면
- 홈, 검색, 목록, 지도, 상세, 보호동물, 가이드 전반에 `공공 데이터`, `첫 리뷰 대기`, 미확인 상태 안내, `전화 제보`, `상세보기`, `데이터 기준`, `외부 장소 정보`, `관리자 검수형 가이드`, `내부 DB`처럼 서비스 내부 상태나 행정 데이터 화면처럼 보이는 표현이 반복되었습니다.
- 식당, 병원, 약국, 미용, 유치원·호텔, 장례가 서로 다른 방문 맥락을 갖는데도 카드와 상세 패널에서 같은 fallback 문구가 반복되어 사람이 직접 만든 생활 서비스 느낌이 약했습니다.

2. 실제로 바꾼 문구 방향
- 공개 화면의 기본 톤을 `데이터를 보여줍니다`에서 `가기 전에 무엇을 물어볼지 알려주는 서비스`로 바꿨습니다.
- 예: `첫 리뷰 대기`는 `아직 후기가 없어요`, `공공 데이터`는 `정부 공개자료를 정리했어요`, `외부 장소 정보`는 `지도 정보와 비교해봤어요`, `상세보기`는 `자세히 보기`, `정보 수정 제보`는 `정보 수정 요청`으로 바꿨습니다.
- 식당은 좌석·실내/야외·피크타임, 병원은 오늘 진료·야간/응급·예약, 약국은 원하는 약 재고·처방전, 미용은 견종/크기/피부 상태, 유치원·호텔은 입소 기준·예방접종, 장례는 화장·봉안·픽업·비용처럼 카테고리별로 실제 질문이 달라지게 정리했습니다.
- `내부 DB`, `관리자 검수형` 같은 내부 용어는 공개 화면에서 제거하고 `직접 정리한 가이드`, `공개자료를 바탕으로 찾기 쉽게 정리`처럼 사용자에게 보이는 표현으로 바꿨습니다.

3. 수정 파일
- 홈/검색/지도/목록: `src/app/page.tsx`, `src/app/search/page.tsx`, `src/app/map/page.tsx`, `src/app/restaurants/page.tsx`, `src/components/search/SearchResultsList.tsx`, `src/components/PlaceDirectoryPage.tsx`, `src/components/PlaceListSection.tsx`, `src/components/RestaurantCard.tsx`, `src/components/PlaceCard.tsx`, `src/components/map/MapListPanel.tsx`, `src/components/map/MapBottomSheet.tsx`, `src/components/map/MapShell.tsx`
- 상세/후기/가이드/보호동물: `src/app/restaurants/[id]/page.tsx`, `src/app/places/[slug]/page.tsx`, `src/app/reviews/new/page.tsx`, `src/app/lost-pets/page.tsx`, `src/app/lost-pets/notices/[desertionNo]/page.tsx`, `src/components/detail/*`, `src/components/reviews/ReviewSection.tsx`, `src/components/guide/GuideArticle.tsx`
- 공통 콘텐츠/라벨: `src/lib/discovery-cards.ts`, `src/lib/discovery-cards.test.ts`, `src/lib/platform-content.ts`, `src/lib/category-info-content.ts`, `src/lib/sources/travel/airline-rules.ts`, `src/lib/sources/travel/ship-rules.ts`, `src/components/SourceNotice.tsx`, `src/components/BoardList.tsx`, `src/components/RightRail.tsx`, `src/app/offline/page.tsx`, `src/app/policies/[slug]/page.tsx`

4. npm test 결과
- `npm test`: 통과
- 결과: 25개 테스트 통과, 실패 0개

5. npm run build 결과
- `npm run build`: 최종 통과
- 참고: 중간에 로컬 `next start`가 Prisma DLL을 잡고 있어 Windows `EPERM rename`이 한 번 발생했습니다. 로컬 서버를 종료한 뒤 재실행해 정상 통과했습니다.
- build/export 후 생성된 `public/data/**` 변경은 커밋 대상에서 제외했습니다.

6. production 확인 결과
- 최종 배포: `https://pet-restaurant-site-starter-pekmah9yj-larchides-projects.vercel.app`, alias `https://pet-restaurant-site-starter.vercel.app` 연결 확인.
- 390px 모바일 폭으로 `/`, `/search?q=동물병원`, `/restaurants`, `/hospitals`, `/pharmacy`, `/grooming`, `/daycare`, `/funeral`, `/map?lat=35.190605&lng=126.815636&category=all`, `/restaurants/9bbc43ee-d9c5-4fac-a593-116d3cced8d6`, `/places/33e00bc4-44eb-4e88-a866-e1a3a868832b`, `/places/bd5eeb9b-cfb6-4bcb-a9fe-38f9a7556b31`, `/lost-pets`, `/guide/travel` 확인 완료.
- 확인 경로 모두 200 응답, 가로 overflow 없음, 개발자용 enum과 이전 라운드의 내부 상태 문구 노출 없음.

7. 아직 남은 AI스러운 부분
- 카테고리 목록의 지역별 수치 배지와 보호동물 공고 숫자는 여전히 행정 데이터 느낌이 조금 남아 있습니다. 다만 실제 탐색에 필요한 신호라 삭제하지 않고 문장 톤만 낮췄습니다.
- 법률/의료/항공·선박 가이드 일부는 규정성 정보라 문장이 보수적입니다. 검증되지 않은 사실을 만들지 않기 위해 실무적인 확인 문장 중심으로 유지했습니다.

8. 다음 개선 제안
- 실제 사용자 후기와 제보가 쌓이면 카드에 `다녀온 사람이 남긴 조건`을 1줄 요약으로 붙여 공공자료 의존감을 더 줄일 수 있습니다.
- 병원·약국·미용·유치원·장례 목록은 지역별 수치 배지보다 `지금 전화해볼 곳`, `지도에서 바로 볼 곳`, `후기가 있는 곳` 같은 생활형 필터로 바꾸면 더 한국형 서비스처럼 보일 수 있습니다.
- 보호동물 화면은 지역/보호소 필터와 공고 상태 필터를 더 직관적으로 정리하면 행정 공고 목록 느낌을 줄일 수 있습니다.

## 가이드 상세 장소 연결 및 수익화 라운드 진행 결과

- 이번에 실제로 좋아진 화면: `/guide/travel`을 포함한 가이드 상세가 글만 읽고 끝나는 구조에서 벗어나, 본문 초반에 `같이 확인할 장소` 카드로 바로 이어지도록 개선했습니다. 여행 가이드는 동반 식당과 여행지 주변 병원을 함께 보여주고, 예방접종/수술/등록/장례 등 다른 가이드는 상황에 맞는 병원, 약국, 장례 시설을 공개 스냅샷에서 추천합니다.
- 장소 연결 방식: 새 추천 카드는 `restaurants-light.json`과 카테고리별 `places/by-category/*.json` 공개 스냅샷만 읽습니다. 카드에는 상세, 지도, 전화, 리뷰 CTA를 붙여 가이드에서 지도/상세/리뷰 흐름으로 바로 이동할 수 있게 했습니다.
- 광고/수익화 흐름: 기존 하단 광고 슬롯은 긴 글을 다 읽은 뒤에만 만나는 구조였습니다. 이번에는 본문 두 번째 섹션 뒤에 `AdSlot`을 배치해, 사용자가 체크리스트와 주요 본문을 일부 읽은 뒤 자연스럽게 광고 슬롯을 만나는 흐름으로 바꿨습니다. 광고 환경변수가 없으면 기존처럼 화면에 노출되지 않습니다.
- 로컬 production 확인: `http://localhost:3000`에서 `/guide/travel`, `/guide/vaccination`, `/guide/funeral`, `/`, `/map?lat=35.190605&lng=126.815636&category=all` 확인 완료. 확인 경로 모두 200 응답, 390px 기준 가로 overflow 없음, 가이드 상세의 관련 장소 섹션 노출 확인, 개발자용 enum 노출 없음.
- 검증 결과: `npm test` 통과(25개), `npm run build` 통과. build/export 후 생성된 기존 `public/data/**` 변경은 커밋 대상에서 제외했습니다.
- 금지사항 준수: Prisma schema 변경 없음, migration 생성 없음, DB reset 없음, `.env.local` 변경/커밋 없음, 외부 리뷰/블로그/메뉴판 크롤링 없음, `GROOMING`/`DAYCARE` enrichment 실제 반영 없음, `business-enrichment.json` 삭제/초기화 없음.
- 현재 한계: 관련 장소 추천은 공개 스냅샷 기반의 보수적 추천입니다. 실제 승인 리뷰가 쌓이면 추천 카드에도 리뷰 요약을 함께 붙이는 다음 개선이 가능합니다.

## 홈 첫 화면 및 광고/수익화 라운드 진행 결과

- 이번에 실제로 좋아진 화면: 홈(`/`) 첫 화면에서 검색창, 현재 위치, 지도, 병원, 약국, 식당, 보호동물, 여행 가이드 진입이 한 번에 보이도록 상단 구조를 압축했습니다. 기존의 큰 퀵액션/상황별 카드 묶음은 첫 화면에서 제거해 390px 모바일에서 시작 화면이 덜 답답하게 보이도록 했습니다.
- 광고/수익화 흐름: 홈 광고 슬롯은 카테고리 바로 뒤가 아니라 최근 등록 식당 다음으로 옮겨, 사용자가 먼저 탐색 진입과 실제 콘텐츠를 본 뒤 광고를 만나도록 했습니다. `AdSlot` 자체도 큰 장식형 카드에서 8px radius의 얇은 콘텐츠 사이 슬롯으로 낮춰 광고가 활성화되어도 화면 흐름을 덜 끊게 정리했습니다.
- 모바일 확인: 로컬 production과 공개 production 모두 390px 기준으로 `/`, `/search?q=동물병원`, `/map?lat=35.190605&lng=126.815636&category=all`, `/lost-pets`, `/guide/travel`을 확인했습니다. 확인 경로 모두 200 응답, 가로 overflow 없음, 홈 첫 화면에서 검색/지도/카테고리/보호동물/가이드 진입 노출 확인, 개발자용 enum 노출 없음.
- 검증 결과: `npm test` 통과(25개), `npm run build` 통과. build/export 후 생성된 기존 `public/data/**` 변경은 커밋 대상에서 제외했습니다.
- 금지사항 준수: Prisma schema 변경 없음, migration 생성 없음, DB reset 없음, `.env.local` 변경/커밋 없음, 외부 리뷰/블로그/메뉴판 크롤링 없음, `GROOMING`/`DAYCARE` enrichment 실제 반영 없음, `business-enrichment.json` 삭제/초기화 없음.
- production 배포 확인: `https://pet-restaurant-site-starter-m8rdank96-larchides-projects.vercel.app` Ready, `https://pet-restaurant-site-starter.vercel.app` alias 연결 확인.
- 현재 한계: 실제 AdSense 노출은 Vercel 환경변수 `NEXT_PUBLIC_ADSENSE_ENABLED=true`, `NEXT_PUBLIC_ADSENSE_CLIENT_ID`, `NEXT_PUBLIC_ADSENSE_DEFAULT_SLOT_ID`가 설정된 뒤에만 확인할 수 있습니다. 이번 변경은 광고가 켜졌을 때 들어갈 위치와 컴포넌트 밀도를 정리한 것입니다.

## 다음 라운드 진행 결과

- 이번에 실제로 좋아진 화면: 검색 결과, 식당/장소 목록, 지도 목록이 `review-summaries.json` 공개 스냅샷을 읽도록 바뀌었습니다. 승인 리뷰가 생기면 카드에서 `리뷰 n건 · 평점 n.n`으로 표시되고, 현재처럼 승인 리뷰가 0건인 경우에는 `첫 리뷰 대기`를 유지합니다.
- 정렬 개선: 검색/카테고리/지도 기본 목록에서 전화 가능, 외부 장소정보, 승인 리뷰, 좌표가 있는 항목을 같은 검색 관련도 안에서 조금 더 위로 올리도록 품질 점수를 추가했습니다.
- lost-pets 개선: 보호동물 공고 카드에 `전화`, `상세`, `보호소 지도` CTA를 명확히 추가했고, 실종 제보 카드에는 `자세히 보기`, `목격 제보` CTA를 분리했습니다.
- 검증 결과: `npm test` 통과(25개), `npm run build` 통과, `business-enrichment.json` 손상 없음(`total 663`, `bad 0`), `.env.local`/Prisma schema/migration/business-enrichment 변경 없음.
- 로컬 production 확인: `http://localhost:3000`에서 `/search?q=동물병원`, `/search?q=동물약국`, `/restaurants`, `/hospitals`, `/pharmacy`, `/map?lat=35.190605&lng=126.815636&category=all`, `/lost-pets`, `/lost-pets?tab=pets`를 390px 기준 확인했습니다. 확인 경로 모두 200 응답, 가로 overflow 없음, 개발자용 enum 노출 없음.
- 현재 한계: 이번 DB 기준 승인 리뷰 요약은 0건이라 build 로그의 `reviewSummaries`는 0입니다. 구조는 준비됐고, 승인 리뷰가 생기면 다음 export/build부터 카드에 실제 수치가 표시됩니다.
- production 확인: `https://pet-restaurant-site-starter.vercel.app`에서 `/search?q=동물병원`, `/search?q=동물약국`, `/restaurants`, `/hospitals`, `/pharmacy`, `/map?lat=35.190605&lng=126.815636&category=all`, `/lost-pets` 확인 완료. 확인 경로 모두 200 응답, 390px 기준 가로 overflow 없음, 리뷰 라벨/전화·외부정보 신호/lost-pets CTA 노출 확인, 개발자용 enum 노출 없음.
- Vercel deployment: `https://pet-restaurant-site-starter-66zzsfckh-larchides-projects.vercel.app` Ready.
- 이번 라운드 기능 커밋: `2cee33b51e120cc3f65a010fb25ac2e3106cfcb6`.

## 대표 검수 요약

- 이번에 실제로 좋아진 화면: 홈(`/`), 검색(`/search?q=동물병원`, `/search?q=동물약국`), 식당/병원/약국 목록(`/restaurants`, `/hospitals`, `/pharmacy`), 지도 목록(`/map?lat=35.190605&lng=126.815636&category=all`)은 카드 안에서 카테고리, 주소, 전화, 외부정보, 리뷰, 지도, 상세 CTA가 더 명확해졌습니다.
- 아직 부족한 화면: `/guide/travel`은 production에서 정상 동작하지만 장소 카드형 추천과 광고 배치가 아직 하단 링크 중심입니다. 광고는 슬롯 배치 여지는 있으나 production 환경변수 미설정 상태라 실제 노출은 확인되지 않습니다.
- 다음에 바로 고쳐야 할 P0/P1: P0는 발견하지 못했습니다. P1은 승인 리뷰 확보/검수 운영, guide 상세 중간의 관련 장소 추천/광고 슬롯 보강, lost-pets 지역 필터 고도화입니다.
- 대표가 직접 확인할 production URL: https://pet-restaurant-site-starter.vercel.app, https://pet-restaurant-site-starter.vercel.app/search?q=%EB%8F%99%EB%AC%BC%EB%B3%91%EC%9B%90, https://pet-restaurant-site-starter.vercel.app/search?q=%EB%8F%99%EB%AC%BC%EC%95%BD%EA%B5%AD, https://pet-restaurant-site-starter.vercel.app/restaurants, https://pet-restaurant-site-starter.vercel.app/hospitals, https://pet-restaurant-site-starter.vercel.app/pharmacy, https://pet-restaurant-site-starter.vercel.app/map?lat=35.190605&lng=126.815636&category=all, https://pet-restaurant-site-starter.vercel.app/restaurants/9bbc43ee-d9c5-4fac-a593-116d3cced8d6, https://pet-restaurant-site-starter.vercel.app/places/33e00bc4-44eb-4e88-a866-e1a3a868832b, https://pet-restaurant-site-starter.vercel.app/places/bd5eeb9b-cfb6-4bcb-a9fe-38f9a7556b31, https://pet-restaurant-site-starter.vercel.app/places/6f1e8b76-e33e-4dad-9692-05bc9bddb9a7, https://pet-restaurant-site-starter.vercel.app/lost-pets, https://pet-restaurant-site-starter.vercel.app/guide/travel

### URL별 3줄 검수 메모

- `/`
	- 개선된 점: 첫 화면에서 검색, 지도, 동물병원, 동물약국, 식당, 미용, 유치원으로 바로 진입할 수 있어 홈이 단순 소개가 아니라 탐색 시작점처럼 보입니다.
	- 아직 부족한 점: 홈은 진입 화면이라 전화/외부정보/리뷰 신호가 직접 드러나지는 않고, 실제 광고 노출은 환경변수 설정 후 확인해야 합니다.
	- 다음 수정 필요 여부: P1 아님. 다음 라운드에서는 지역/카테고리별 인기 진입을 더 압축하면 좋습니다.
- `/search?q=동물병원`
	- 개선된 점: 검색 카드에 업체명, 동물병원 분류, 주소, 전화 가능/전화 제보, 공공 데이터, 첫 리뷰 대기, 지도/전화/리뷰/상세 CTA가 한 번에 보입니다.
	- 아직 부족한 점: 실제 리뷰 수가 아직 목록 스냅샷에 붙지 않아 대부분 `첫 리뷰 대기`로 보입니다.
	- 다음 수정 필요 여부: P1 후보. 리뷰 요약 스냅샷을 붙이면 대표 검수 체감이 더 좋아집니다.
- `/search?q=동물약국`
	- 개선된 점: 동물약국 검색 결과도 병원과 같은 카드 품질로 전화 가능 여부, 운영 상태, 지도, 리뷰, 상세 이동이 정리됐습니다.
	- 아직 부족한 점: 외부정보가 없는 약국은 공공 데이터 중심으로 보이며, 실제 전화/카카오 확인 가능 항목이 더 위로 오지는 않습니다.
	- 다음 수정 필요 여부: P1 후보. 외부정보 보유 항목을 검색 정렬에서 소폭 가산하면 좋습니다.
- `/restaurants`
	- 개선된 점: 식당 목록 카드에 일반음식점 분류, 지도 가능, 공식 등록, 전화, 카카오, 첫 리뷰 대기, 상세 CTA가 노출되어 114 목록 느낌이 줄었습니다.
	- 아직 부족한 점: 반려동물 동반 조건은 확인되지 않은 경우 단정하지 않아 카드에서 구체 조건까지 바로 보이지는 않습니다.
	- 다음 수정 필요 여부: P1 아님. 제보가 쌓이면 동반 조건 요약을 카드에 붙이는 작업이 다음 단계입니다.
- `/hospitals`
	- 개선된 점: 동물병원 목록이 주소/상태/전화 제보/공공 데이터/리뷰/지도/상세 CTA를 갖춘 검수 가능한 카드로 바뀌었습니다.
	- 아직 부족한 점: 휴업 또는 전화 미확인 항목이 많아 대표 화면에서 일부 카드가 아직 공공 데이터 느낌을 줍니다.
	- 다음 수정 필요 여부: P1 후보. 전화번호/영업상태 보강 데이터 우선순위를 따로 잡는 것이 좋습니다.
- `/pharmacy`
	- 개선된 점: 동물약국 목록에 지도, 전화, 공공 데이터 또는 외부 카테고리, 첫 리뷰 대기, 상세 이동이 같은 규칙으로 표시됩니다.
	- 아직 부족한 점: 약국은 공공 데이터 항목이 매우 많아 외부정보 보유 카드와 미보유 카드의 우선순위 차이가 약합니다.
	- 다음 수정 필요 여부: P1 후보. 외부정보 보유/전화 가능 항목을 상단에 노출하는 정렬 개선이 필요합니다.
- `/map?lat=35.190605&lng=126.815636&category=all`
	- 개선된 점: 지도 목록에서 전체/식당/병원/약국/미용/유치원/장례 카테고리와 카드 CTA가 함께 보여 지도 선택과 상세 이동 흐름이 분명해졌습니다.
	- 아직 부족한 점: 지도 위 카드 정보가 많아 작은 화면에서는 필터와 리스트 사이의 스크롤 체감이 조금 무거울 수 있습니다.
	- 다음 수정 필요 여부: P1 아님. 추후 선택 카드 고정 영역과 리스트 높이 최적화가 있으면 좋습니다.
- `/restaurants/9bbc43ee-d9c5-4fac-a593-116d3cced8d6`
	- 개선된 점: 상세 화면에는 전화·위치·상태 판단 패널, 카카오/네이버/T맵, 리뷰 남기기, 정보 제보가 정리되어 방문 판단이 쉽습니다.
	- 아직 부족한 점: 목록에서 들어온 맥락을 이어주는 `비슷한 주변 식당`의 품질은 리뷰/동반조건 데이터가 쌓여야 더 강해집니다.
	- 다음 수정 필요 여부: P1 아님. 리뷰 스냅샷과 주변 추천 랭킹 개선이 다음 단계입니다.
- `/places/33e00bc4-44eb-4e88-a866-e1a3a868832b`
	- 개선된 점: 병원 상세는 전화, 지도, 외부 장소 정보, 진료 전 확인 정보, 리뷰/제보 CTA가 명확합니다.
	- 아직 부족한 점: 진료 과목이나 야간/응급 여부는 확인된 데이터가 없으면 단정하지 않아 상세 판단 정보가 제한됩니다.
	- 다음 수정 필요 여부: P1 아님. 확인 가능한 공공/제보 기반 진료 정보가 생기면 보강하면 됩니다.
- `/places/bd5eeb9b-cfb6-4bcb-a9fe-38f9a7556b31`
	- 개선된 점: 약국 상세는 전화하기, 지도, 카카오맵, 리뷰 남기기, 정보 수정 제보가 한 화면 흐름 안에 들어옵니다.
	- 아직 부족한 점: 취급 의약품은 확인된 데이터가 아니면 단정할 수 없어 방문 전 확인 안내 중심입니다.
	- 다음 수정 필요 여부: P1 아님. 약국 품목 제보/검수 기능이 생기면 다음 개선 대상입니다.
- `/places/6f1e8b76-e33e-4dad-9692-05bc9bddb9a7`
	- 개선된 점: 장례 상세도 전화·위치·상태 판단 패널과 장례 상담 전 확인 정보, 리뷰/제보 CTA가 갖춰져 있습니다.
	- 아직 부족한 점: 장례 서비스 범위와 비용은 확인 데이터가 없어 카드/상세에서 구체 단정 없이 상담 전 확인 안내로 남아 있습니다.
	- 다음 수정 필요 여부: P1 아님. 검수된 장례 서비스 항목을 확보하면 상세 정보 밀도를 높일 수 있습니다.
- `/lost-pets`
	- 개선된 점: 보호동물 공고가 정상 노출되고 실종 제보, 보호동물 공고 탭, 전화번호, 자세히 보기 흐름이 유지됩니다.
	- 아직 부족한 점: 이번 discovery card 개선이 직접 적용된 화면은 아니라 지도/리뷰/외부정보형 CTA 밀도는 장소 목록보다 약합니다.
	- 다음 수정 필요 여부: P1 후보. 보호동물 카드에 보호소 전화, 지역 필터, 공고 상세 CTA를 더 명확히 정리할 필요가 있습니다.
- `/guide/travel`
	- 개선된 점: 여행 가이드는 바로 실행, 목차, 현장 질문, 체크리스트, 관련 장소 바로가기까지 있어 대표가 콘텐츠 완성도를 확인하기 좋습니다.
	- 아직 부족한 점: 광고/관련 장소 추천이 콘텐츠 흐름 중간에 들어가는 구조는 아직 약하고, 장소 카드형 연결은 하단 링크 중심입니다.
	- 다음 수정 필요 여부: P1 후보. 가이드 본문 중간에 관련 장소/광고 슬롯을 자연스럽게 넣으면 체류와 수익화가 좋아집니다.

## 1. 발견한 P0 문제
- 공개 화면을 막는 P0 문제는 발견하지 못했습니다.

## 2. 발견한 P1 문제
- 홈 첫 화면에서 검색/지도 CTA는 있었지만, 대표 카테고리로 바로 들어가는 빠른 진입이 부족했습니다.
- 검색 결과 카드는 상세/지도 흐름은 있었지만 전화 가능 여부, 외부 장소정보 여부, 리뷰 유도가 카드마다 같은 기준으로 드러나지 않았습니다.
- `/hospitals`, `/pharmacy`, `/grooming`, `/daycare`, `/funeral` 정적 카테고리 목록은 카드 정보 밀도와 CTA가 상세 페이지 수준에 못 미쳤습니다.
- 지도 목록 패널과 모바일 바텀시트가 지도 선택/상세 이동 중심이라 전화, 외부정보, 첫 리뷰 유도 신호가 약했습니다.
- 광고가 활성화될 때 검색/홈/카테고리 목록 흐름 안에 자연스럽게 들어갈 위치가 부족했습니다.

## 3. 실제 수정한 내용
- 공통 CTA 컴포넌트 `DiscoveryCardActions`를 추가해 지도, 전화, 외부 장소 링크, 리뷰, 상세 액션을 카드마다 같은 패턴으로 표시했습니다.
- 카드 헬퍼 `discovery-cards`를 추가해 지도 링크, 리뷰 링크, 날짜, 좌표 여부, 외부 보강정보 표시 기준을 재사용하도록 했습니다.
- 홈 첫 화면에 동물병원, 동물약국, 식당, 미용, 유치원 빠른 진입 칩을 추가했습니다.
- 식당 카드와 장소 카드에 전화 가능/전화 제보, 외부정보 있음/공공 데이터, 첫 리뷰 대기, 데이터 기준일을 추가했습니다.
- 검색 결과 식당/시설 카드에 전화/지도/리뷰/상세 CTA를 통일하고, 신뢰 기준을 통과한 외부 보강정보가 있으면 카테고리와 카카오 링크가 드러나도록 했습니다.
- 정적 카테고리 목록 카드에 지역, 주소, 운영 상태, 전화 가능 여부, 외부정보, 첫 리뷰 유도, 지도/전화/리뷰/상세 CTA를 추가했습니다.
- 지도 목록 패널과 모바일 바텀시트에 전화, 외부정보, 리뷰 신호와 공통 CTA를 추가했습니다.
- 지도 선택 요약에도 전화/외부정보/리뷰/상세 액션을 추가해 지도에서 상세로 이어지는 흐름을 보강했습니다.
- `GROOMING`, `DAYCARE` 외부 보강정보는 카드에 반영하지 않도록 보호 조건을 두었습니다.
- 홈, 검색 결과, 카테고리 목록에 광고 슬롯 배치 여지를 추가했습니다. 광고 환경변수가 없으면 화면에 노출되지 않습니다.

## 4. 수정 파일
- `src/components/discovery/DiscoveryCardActions.tsx`
- `src/lib/discovery-cards.ts`
- `src/app/page.tsx`
- `src/app/map/page.tsx`
- `src/components/RestaurantCard.tsx`
- `src/components/PlaceCard.tsx`
- `src/components/PlaceListSection.tsx`
- `src/components/PlaceDirectoryPage.tsx`
- `src/components/search/SearchResultsList.tsx`
- `src/components/map/MapListPanel.tsx`
- `src/components/map/MapBottomSheet.tsx`
- `src/components/map/MapShell.tsx`
- `src/components/map/types.ts`

## 5. npm test 결과
- `npm test`: 통과
- 결과: 22개 테스트 통과, 실패 0개

## 6. npm run build 결과
- `npm run build`: 통과
- Next.js 15.5.15 production build 성공
- build/export 후 생성된 `public/data/**` 변경은 커밋 대상에서 제외했습니다.

## 7. production 확인 결과
- 로컬 production 확인: `http://localhost:3000`에서 지정 주요 경로 확인 완료
- 확인 경로: `/`, `/search?q=동물병원`, `/search?q=동물약국`, `/search?q=식당`, `/restaurants`, `/hospitals`, `/pharmacy`, `/grooming`, `/daycare`, `/funeral`, `/map?lat=35.190605&lng=126.815636&category=all`, `/map?lat=35.190605&lng=126.815636&category=hospitals`, `/restaurants/9bbc43ee-d9c5-4fac-a593-116d3cced8d6`, `/places/33e00bc4-44eb-4e88-a866-e1a3a868832b`, `/places/bd5eeb9b-cfb6-4bcb-a9fe-38f9a7556b31`
- 모바일 viewport 390px에서 확인 경로 가로 overflow 없음
- 검색/목록/지도 카드에서 상세, 지도, 전화 가능/전화 제보, 첫 리뷰 대기, 외부정보/공공 데이터 신호 확인
- 공개 production 확인: `https://pet-restaurant-site-starter.vercel.app` 확인 완료
- Vercel deployment: `https://pet-restaurant-site-starter-j6c1d4v00-larchides-projects.vercel.app` Ready, production alias 연결 확인
- production 확인 경로: `/`, `/search?q=동물병원`, `/restaurants`, `/hospitals`, `/pharmacy`, `/map?lat=35.190605&lng=126.815636&category=all`, `/restaurants/9bbc43ee-d9c5-4fac-a593-116d3cced8d6`, `/places/33e00bc4-44eb-4e88-a866-e1a3a868832b`
- production 모바일 viewport 390px에서 확인 경로 가로 overflow 없음
- production 검색/목록/지도 카드에서 상세, 지도, 전화 가능/전화 제보, 첫 리뷰 대기, 외부정보/공공 데이터 신호 확인
- production 화면에서 `ANIMAL_HOSPITAL`, `PHARMACY`, `GROOMING`, `DAYCARE`, `FUNERAL` 같은 개발자용 enum 문구가 노출되지 않음을 확인

## 8. 아직 남은 문제
- 실제 AdSense 노출은 Vercel 환경변수 `NEXT_PUBLIC_ADSENSE_ENABLED=true`, `NEXT_PUBLIC_ADSENSE_CLIENT_ID`, `NEXT_PUBLIC_ADSENSE_DEFAULT_SLOT_ID` 설정 후 확인이 필요합니다.
- 현재 카드에는 승인 리뷰 수를 대량 조회하지 않고 `첫 리뷰 대기` 유도를 기본으로 표시합니다. 추후 공개 스냅샷에 리뷰 요약을 넣으면 목록에서도 실제 리뷰 수를 표시할 수 있습니다.
- 로컬 `npm run start`에서는 admin 번들 쪽 기존 환경변수 관련 `Invalid URL` 경고가 출력됩니다. 이번 공개 사용자 경로 검증에는 영향이 없었습니다.

## 9. 다음 작업 제안
- 리뷰 요약 스냅샷을 export 단계에 추가해 검색/목록/지도 카드에서 실제 승인 리뷰 수와 평균 점수를 표시합니다.
- 외부 보강정보가 있는 항목을 검색 결과에서 소폭 가산해 전화/카카오 확인 가능 업체가 더 빨리 보이게 합니다.
- 광고 슬롯이 실제 활성화된 환경에서 CLS와 모바일 스크롤 체감을 측정합니다.

## 커밋 hash
- 기능 변경 커밋: `9913fba1055ff09ad25ad4c8dff821412a7a05d5`
