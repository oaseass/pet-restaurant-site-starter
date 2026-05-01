# 반려동물 동반 가능 식당 조회 사이트 Starter

공식 식품안전나라 공개 페이지를 1일 1회만 조회해 자체 DB에 저장하고, 사용자는 자체 DB를 검색합니다. 원본 사이트를 사용자 검색 때마다 호출하지 않습니다.

## 실행

```bash
cp .env.example .env
npm install
npx prisma migrate dev --name init
npm run dev
```

## 수동 동기화

```bash
npm run sync:local
```

또는 배포 후:

```bash
curl -H "Authorization: Bearer <CRON_SECRET>" https://your-domain.com/api/cron/sync-pet-restaurants
```

## Vercel Cron

`vercel.json` 기준 매일 19:10 UTC, 한국시간 04:10에 실행됩니다.
