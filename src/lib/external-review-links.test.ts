import test from "node:test";
import assert from "node:assert/strict";
import { evaluateExternalReviewCandidateMatch, extractExternalReviewLinksFromNaverHtml, mergeExternalReviewLinksByPriority, rankAutomaticExternalReviewLinks } from "./external-review-links";

test("extractExternalReviewLinksFromNaverHtml keeps direct blog article links", () => {
  const html = `
    <div>
      <a href="https://blog.naver.com/sampleUser">작성자 홈</a>
      <a href="https://blog.naver.com/sampleUser/224216904426">진해 애견동반카페 멍카페 후기</a>
      <a href="https://example.tistory.com/15">창원 애견카페 멍카페 방문기</a>
      <a href="https://search.naver.com/search.naver?where=blog&query=%EB%A9%8D%EC%B9%B4%ED%8E%98">내부 검색</a>
      <a href="https://www.ban-life.com/store/view?type=s&id=22748">반려생활 멍카페</a>
      <a href="https://blog.naver.com/sampleUser/224216904426">진해 애견동반카페 멍카페 후기</a>
    </div>
  `;

  const links = extractExternalReviewLinksFromNaverHtml(html);

  assert.deepEqual(
    links.map((link) => ({ href: link.href, title: link.title })),
    [
      {
        href: "https://example.tistory.com/15",
        title: "창원 애견카페 멍카페 방문기",
      },
      {
        href: "https://blog.naver.com/sampleUser/224216904426",
        title: "진해 애견동반카페 멍카페 후기",
      },
    ],
  );
});

test("extractExternalReviewLinksFromNaverHtml skips short or non-article anchors", () => {
  const html = `
    <div>
      <a href="https://blog.naver.com/short/123">123</a>
      <a href="https://blog.naver.com/short/124">Image</a>
      <a href="https://blog.naver.com/author">작성자</a>
      <a href="https://post.naver.com/viewer/postView.naver?volumeNo=123&memberNo=456">반려동물 동반 병원 방문 후기 정리</a>
    </div>
  `;

  const links = extractExternalReviewLinksFromNaverHtml(html);

  assert.equal(links.length, 1);
  assert.equal(links[0]?.href, "https://post.naver.com/viewer/postView.naver?volumeNo=123&memberNo=456");
});

test("extractExternalReviewLinksFromNaverHtml preserves tistory and brunch when naver blog links dominate", () => {
  const html = `
    <div>
      <a href="https://blog.naver.com/sample/1">네이버 후기 1</a>
      <a href="https://blog.naver.com/sample/2">네이버 후기 2</a>
      <a href="https://blog.naver.com/sample/3">네이버 후기 3</a>
      <a href="https://blog.naver.com/sample/4">네이버 후기 4</a>
      <a href="https://example.tistory.com/55">티스토리 멍스테이 방문기</a>
      <a href="https://brunch.co.kr/@writer/99">브런치 반려동물 동반 숙소 기록</a>
      <a href="https://post.naver.com/viewer/postView.naver?volumeNo=123&memberNo=456">네이버 포스트 정리</a>
    </div>
  `;

  const links = extractExternalReviewLinksFromNaverHtml(html);
  const hrefs = links.map((link) => link.href);

  assert.equal(links.length, 6);
  assert.equal(hrefs[0], "https://example.tistory.com/55");
  assert.equal(hrefs[1], "https://brunch.co.kr/@writer/99");
  assert.equal(hrefs.includes("https://example.tistory.com/55"), true);
  assert.equal(hrefs.includes("https://brunch.co.kr/@writer/99"), true);
  assert.equal(hrefs.indexOf("https://example.tistory.com/55") < hrefs.indexOf("https://blog.naver.com/sample/1"), true);
  assert.equal(hrefs.indexOf("https://brunch.co.kr/@writer/99") < hrefs.indexOf("https://blog.naver.com/sample/1"), true);
});

test("mergeExternalReviewLinksByPriority pins approved links ahead of automatic results", () => {
  const merged = mergeExternalReviewLinksByPriority({
    approvedLinks: [
      {
        href: "https://example.com/approved-1",
        title: "승인 링크 1",
        sourceLabel: "티스토리",
        publishedAtLabel: null,
        summary: "approved",
        kind: "blog",
        isApproved: true,
      },
      {
        href: "https://example.com/shared",
        title: "승인 링크 2",
        sourceLabel: "브런치",
        publishedAtLabel: null,
        summary: "approved",
        kind: "blog",
        isApproved: true,
      },
    ],
    searchLinks: [
      {
        href: "https://example.com/shared",
        title: "자동 링크 shared",
        sourceLabel: "네이버 블로그",
        publishedAtLabel: null,
        summary: "search",
        kind: "blog",
      },
      {
        href: "https://example.com/search-1",
        title: "자동 링크 1",
        sourceLabel: "네이버 블로그",
        publishedAtLabel: null,
        summary: "search",
        kind: "blog",
      },
    ],
    mapLinks: [
      {
        href: "https://example.com/map-1",
        title: "지도 링크 1",
        sourceLabel: "네이버지도",
        publishedAtLabel: null,
        summary: "map",
        kind: "map",
      },
    ],
  });

  assert.deepEqual(
    merged.map((link) => link.href),
    [
      "https://example.com/approved-1",
      "https://example.com/shared",
      "https://example.com/search-1",
      "https://example.com/map-1",
    ],
  );
  assert.equal(merged[0]?.isApproved, true);
  assert.equal(merged[1]?.isApproved, true);
});

test("evaluateExternalReviewCandidateMatch rejects partial-name noise and favors exact target names", () => {
  const exact = evaluateExternalReviewCandidateMatch(
    { name: "멍카페", regionLabel: "경상남도 창원시", address: "경상남도 창원시 진해구 풍호동" },
    {
      title: "진해 애견동반카페 멍카페 후기",
      href: "https://blog.naver.com/sample/1",
      contextText: "창원 진해 풍호동 애견동반 카페 방문기",
    },
  );
  const noisy = evaluateExternalReviewCandidateMatch(
    { name: "멍카페", regionLabel: "경상남도 창원시", address: "경상남도 창원시 진해구 풍호동" },
    {
      title: "안산 애견카페 멍쓰런 야외 잔디마당 후기",
      href: "https://blog.naver.com/sample/2",
      contextText: "경기도 안산 애견카페",
    },
  );

  assert.equal(exact.keepFallback, true);
  assert.equal(exact.hasExactNameMatch, true);
  assert.equal(noisy.keepFallback, false);
  assert.equal(noisy.hasExactNameMatch, false);
});

test("evaluateExternalReviewCandidateMatch requires detailed address clues for generic same-name businesses", () => {
  const exactNeighborhood = evaluateExternalReviewCandidateMatch(
    { name: "멍스테이", regionLabel: "경기도 광명시", address: "경기도 광명시 소하동" },
    {
      title: "광명 멍스테이 호텔링 후기",
      href: "https://example.tistory.com/soha",
      contextText: "경기도 광명시 소하동 멍스테이 방문기",
    },
  );
  const wrongNeighborhood = evaluateExternalReviewCandidateMatch(
    { name: "멍스테이", regionLabel: "경기도 광명시", address: "경기도 광명시 소하동" },
    {
      title: "광명 멍스테이 방문 후기",
      href: "https://blog.naver.com/sample/branch-b",
      contextText: "경기도 광명시 철산동 멍스테이",
    },
  );

  assert.equal(exactNeighborhood.hasDetailAddressMatch, true);
  assert.equal(exactNeighborhood.keepFallback, true);
  assert.equal(wrongNeighborhood.hasDetailAddressMatch, false);
  assert.equal(wrongNeighborhood.keepFallback, false);
});

test("rankAutomaticExternalReviewLinks prioritizes exact matches with region clues", () => {
  const ranked = rankAutomaticExternalReviewLinks(
    { name: "멍스테이", regionLabel: "경기도 광명시", address: "경기도 광명시 소하동" },
    [
      {
        href: "https://blog.naver.com/sample/branch-a",
        title: "멍스테이 방문 후기",
        sourceLabel: "네이버 블로그",
        publishedAtLabel: null,
        summary: "blog",
        kind: "blog",
        contextText: "충청남도 천안시 멍스테이 애견동반카페 방문기",
      },
      {
        href: "https://example.tistory.com/55",
        title: "광명 멍스테이 반려견 호텔링 후기",
        sourceLabel: "티스토리",
        publishedAtLabel: null,
        summary: "blog",
        kind: "blog",
        contextText: "경기도 광명시 소하동 멍스테이",
      },
      {
        href: "https://blog.naver.com/sample/noise",
        title: "멍쓰런 애견카페 후기",
        sourceLabel: "네이버 블로그",
        publishedAtLabel: null,
        summary: "blog",
        kind: "blog",
        contextText: "경기도 안산시 애견카페",
      },
    ],
  );

  assert.equal(ranked.length, 1);
  assert.equal(ranked[0]?.href, "https://example.tistory.com/55");
  assert.equal(ranked.some((link) => link.href === "https://blog.naver.com/sample/branch-a"), false);
  assert.equal(ranked.some((link) => link.href === "https://blog.naver.com/sample/noise"), false);
});

test("rankAutomaticExternalReviewLinks drops same-city matches without the detailed address token", () => {
  const ranked = rankAutomaticExternalReviewLinks(
    { name: "멍스테이", regionLabel: "경기도 광명시", address: "경기도 광명시 소하동" },
    [
      {
        href: "https://blog.naver.com/sample/wrong-neighborhood",
        title: "광명 멍스테이 방문 후기",
        sourceLabel: "네이버 블로그",
        publishedAtLabel: null,
        summary: "blog",
        kind: "blog",
        contextText: "경기도 광명시 철산동 멍스테이",
      },
      {
        href: "https://example.tistory.com/right-neighborhood",
        title: "멍스테이 반려견 호텔링 후기",
        sourceLabel: "티스토리",
        publishedAtLabel: null,
        summary: "blog",
        kind: "blog",
        contextText: "경기도 광명시 소하동 멍스테이",
      },
    ],
  );

  assert.deepEqual(ranked.map((link) => link.href), ["https://example.tistory.com/right-neighborhood"]);
});