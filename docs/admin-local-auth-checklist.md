# 로컬 관리자 로그인 준비 체크리스트

로컬에서 관리자 로그인과 외부 링크 검수 화면을 확인하려면 `.env.local`에 관리자 인증 값이 실제로 들어 있어야 합니다.

현재 이 워크스페이스에서는 `.env.local`의 `ADMIN_SECRET`, `ADMIN_BOOTSTRAP_PASSWORD`가 비어 있는 값으로 해석되어 로컬 로그인 화면이 `관리자 접근 비활성` 상태로 보입니다.

## 1. 필수 환경 변수 확인

- `ADMIN_SECRET`: 비어 있으면 관리자 로그인 자체가 비활성화됩니다.
- `ADMIN_BOOTSTRAP_PASSWORD`: `ADMIN_USERS_JSON`을 쓰지 않을 때 기본 관리자 로그인 비밀번호로 사용됩니다.
- `NEXTAUTH_SECRET`: 세션 서명용 값입니다. 로컬에서도 명시적으로 채워 두는 편이 안전합니다.

## 2. 선택 환경 변수 확인

- `ADMIN_LOGIN_EMAIL`: 부트스트랩 관리자 이메일입니다. 비우면 `admin@daengnyang.local`이 기본값입니다.
- `ADMIN_USERS_JSON`: 역할 분리된 관리자 계정을 쓸 때만 설정합니다.

## 3. 값 채우기 예시

실제 비밀값 대신 아래처럼 각자 별도 랜덤 문자열을 넣습니다.

```dotenv
ADMIN_SECRET="replace-with-long-random-secret"
ADMIN_BOOTSTRAP_PASSWORD="replace-with-local-admin-password"
ADMIN_LOGIN_EMAIL="admin@example.com"
NEXTAUTH_SECRET="replace-with-long-random-nextauth-secret"
```

## 4. 로컬 검증 순서

1. `npm run build`
2. 포트 충돌을 피하려면 `npm run dev -- -p 3101` 또는 `npm run start -- -p 3101`
3. 브라우저에서 `http://127.0.0.1:3101/admin/login?next=%2Fadmin%2Fexternal-links%3Fq%3D%EC%84%9C%EC%9A%B8` 열기
4. `ADMIN_LOGIN_EMAIL` 또는 기본값 `admin@daengnyang.local`로 로그인
5. 로그인 후 `/admin/external-links?q=서울`로 이동하는지 확인
6. 화면에서 `외부 링크 저장소 검수`, `업체 검색 후 대상 자동 선택`, `외부 링크 직접 등록`, `후보 자동 수집`이 보이는지 확인

## 5. 자주 보이는 실패 신호

- `관리자 접근 비활성`: `ADMIN_SECRET`가 비어 있거나 로딩되지 않았습니다.
- 로그인 POST가 `401`: 이메일 또는 비밀번호가 현재 런타임 설정과 다릅니다.
- 로그인 후 한글 쿼리 포함 경로에서 `500`: 오래된 번들이 떠 있을 수 있으니 최신 빌드/배포로 다시 확인합니다.
- `localhost:3000`에서 `404`: 이 머신에서는 다른 Node 프로세스가 IPv4 3000을 점유할 수 있으니 `127.0.0.1:3101` 같은 별도 포트를 우선 사용합니다.