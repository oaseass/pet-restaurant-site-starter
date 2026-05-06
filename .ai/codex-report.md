# Codex Report

## 대표 검수 요약

- 이번에 실제로 좋아진 화면: 홈(`/`), 검색(`/search?q=동물병원`, `/search?q=동물약국`), 식당/병원/약국 목록(`/restaurants`, `/hospitals`, `/pharmacy`), 지도 목록(`/map?lat=35.190605&lng=126.815636&category=all`)은 카드 안에서 카테고리, 주소, 전화, 외부정보, 리뷰, 지도, 상세 CTA가 더 명확해졌습니다.
- 아직 부족한 화면: `/lost-pets`와 `/guide/travel`은 production에서 정상 동작하지만 이번 discovery card 개선 범위와는 별개라 목록 카드의 리뷰/지도/외부정보 CTA 밀도는 아직 장소 탐색 화면만큼 강하지 않습니다. 광고는 슬롯 배치 여지는 있으나 production 환경변수 미설정 상태라 실제 노출은 확인되지 않습니다.
- 다음에 바로 고쳐야 할 P0/P1: P0는 발견하지 못했습니다. P1은 목록 카드에 실제 승인 리뷰 수/평점 스냅샷을 붙이는 작업, lost-pets 카드의 CTA 밀도 보강, guide 상세 하단의 장소 추천/광고 위치 보강입니다.
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
