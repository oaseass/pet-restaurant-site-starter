const BASE = 'https://pet-restaurant-site-starter.vercel.app';
const ids = {
  ANIMAL_HOSPITAL: 'ae82b39a-6164-44c8-a322-872ee461216b',
  PHARMACY:        'f6d2061e-8f3b-41f7-b316-1ef2cf4b6e11',
  GROOMING:        '392c79da-34a6-415b-bf99-f3606fafaf99',
  DAYCARE:         '3efc938f-ae91-4ca2-aa45-1c4562189aaf',
  FUNERAL:         'fb95c0f3-9591-4007-ae80-2879f44c5427',
};

for (const [cat, id] of Object.entries(ids)) {
  const url = `${BASE}/places/${id}`;
  process.stdout.write(`${cat} ... `);
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(60000) });
    const html = await r.text();
    const ok = (k) => html.includes(k);
    console.log(JSON.stringify({
      HTTP:    r.status,
      지도보기:   ok('지도에서 보기'),
      카카오:    ok('카카오'),
      정보수정:   ok('정보수정') || ok('제보'),
      추천:     ok('추천') || ok('다른'),
      한글OK:   /[가-힣]/.test(html.slice(500, 2000)),
    }));
  } catch (e) {
    console.log('ERROR', e.message);
  }
}
