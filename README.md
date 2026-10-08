# 💊 약챙김 — 원터치 약 복용 체크 & 가족 안심 알림 PWA

부모님은 큰 버튼 하나로 약 복용을 체크하고, 보호자(자녀)는 7일 복약률·병원 예약·비상연락망을 관리하는 앱입니다.
모든 기록은 휴대폰 안(LocalStorage)에 저장되어 인터넷 없이도 동작합니다.

## 바로 실행 (이 폴더를 받은 경우)

```bash
cd yakchaenggim
npm install
npm run dev
```

브라우저에서 http://localhost:5173 을 엽니다.

## 처음부터 직접 만드는 경우

1. Node.js LTS 설치: https://nodejs.org → 설치 후 터미널에서 `node -v` 로 확인 (v20 이상)
2. 프로젝트 만들기
   ```bash
   npm create vite@latest yakchaenggim -- --template react-ts
   cd yakchaenggim
   npm install
   ```
3. 필요한 도구 설치
   ```bash
   npm install lucide-react
   npm install -D tailwindcss @tailwindcss/vite
   ```
4. 기본 파일 정리: `src/App.css` 와 `src/assets` 폴더를 지웁니다.
5. 아래 파일들을 만들거나 내용을 통째로 바꿔 붙여넣습니다. (tsconfig 파일들은 Vite가 만든 것을 그대로 둡니다)
   - `index.html`, `vite.config.ts`
   - `public/manifest.webmanifest`, `public/sw.js`, `public/icon.svg`, `public/icon-192.png`, `public/icon-512.png`
   - `src/main.tsx`, `src/index.css`, `src/App.tsx`, `src/store.ts`
   - `src/components/` : `ui.tsx`, `PrintReport.tsx`, `ReminderBanner.tsx`, `InstallBanner.tsx`
   - `src/pages/` : `ParentPage.tsx`, `GuardianPage.tsx`, `AppointmentPage.tsx`, `EmergencyPage.tsx`, `SettingsPage.tsx`
6. 실행
   ```bash
   npm run dev
   ```
   → http://localhost:5173

## 배포 (GitHub Pages)

`main` 브랜치에 올리면 GitHub Actions가 자동으로 빌드해서 배포합니다.
처음 한 번만 저장소 **Settings → Pages → Source** 를 **GitHub Actions** 로 바꿔주세요.
배포 주소: https://linkcleaning.github.io/yakchaenggim/

## 휴대폰에서 보기

- 같은 와이파이라면 `npm run dev` 화면에 나오는 `Network: http://192.168.x.x:5173` 주소를 휴대폰에서 열면 됩니다.
- **홈 화면 설치·알림·오프라인**은 HTTPS 주소에서만 동작합니다. `npm run build` 후 생기는 `dist` 폴더를
  Vercel / Netlify / GitHub Pages 등에 올리면 HTTPS 주소가 생깁니다.

## 쓰는 법

1. 위쪽 **보호자** → **설정**: 부모님 호칭, 보호자 번호, 약 이름 입력
2. **병원·예약**: 다니는 병원 등록 → 예약 추가 → `휴대폰 캘린더에 추가` (앱을 닫아도 전날·2시간 전 알림)
3. **비상연락망**: 가족·주치의 번호와 응급 의료 정보(혈액형·지병·복용 약) 입력
4. 위쪽 **부모님**으로 바꿔서 부모님 휴대폰에 두면 끝
5. 진료 가기 전 **대시보드 → 인쇄 · PDF 저장**으로 기록지 출력

## 알아둘 점

- 기록은 그 휴대폰에만 저장됩니다. 부모님 폰 기록을 자녀 폰에서 실시간으로 보려면 서버가 필요합니다(다음 단계).
  지금은 부모님 폰의 `문자 보내기` 버튼, 또는 설정의 `백업 파일` 로 옮길 수 있습니다.
- 앱 안의 예약 알림은 앱을 열었을 때 울립니다. 앱을 닫아둬도 알림을 받으려면 `휴대폰 캘린더에 추가` 를 쓰세요.
- 아이폰은 iOS 16.4 이상에서 홈 화면에 추가한 뒤 열어야 알림 허용이 가능합니다.
