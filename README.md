# 🖥️ Doyoucode Dev Tistory Skin

<img width="2879" height="1497" alt="image" src="https://github.com/user-attachments/assets/851184b3-8ec3-4324-8495-bbe60f71641c" />

GitHub 감성의 다크 사이드바와 macOS & Ubuntu 스타일 데스크탑 UI를 결합한 개발자 테마 티스토리 스킨입니다.

## ✨ 주요 기능

### 🎨 레이아웃
- **다크 사이드바 + 라이트 콘텐츠** 듀얼 테마 (GitHub 감성)
- 반응형 디자인 지원 (모바일 ≤ 960px)
- 코드 블록 다크 터미널 스타일 (Copy 버튼 포함)
- 목차(TOC) 자동 생성 & 스크롤 진행 바

### 🖥️ 데스크탑 UI
블로그 메인 페이지에서 macOS/Windows 스타일 인터랙티브 데스크탑이 표시됩니다.

| 기능 | 설명 |
|------|------|
| **데스크탑 아이콘** | 더블클릭으로 창 열기, 우클릭 컨텍스트 메뉴 |
| **태스크바** | 열린 창 목록, 시계/날짜 표시 |
| **창 관리** | 드래그 이동, 리사이즈, 최소화/최대화/닫기 |
| **창 애니메이션** | 팝업 열기, 닫기, 최소화(태스크바로 비행), 최대화 |
| **컨텍스트 메뉴** | 우클릭 시 창 조작 메뉴 (속성, 최소화 등) |

### 🪟 창 목록

- **Terminal** — 블로그 탐색 CLI (`help`, `ls`, `cd`, `search`, `date` 등)
- **Browser** — 인라인 iframe 브라우저 (외부 링크 확인 다이얼로그 포함)
- **File Explorer** — 블로그 카테고리/포스트 트리 탐색기
- **Guestbook** — KakaoTalk 스타일 방명록 채팅창
- **Properties** — 아이콘 속성 정보 창
- **README** — 블로그 소개 마크다운 뷰어

### 💬 방명록 (Guestbook)
- KakaoTalk UI 스타일 채팅 인터페이스
- 메시지 타임스탬프 표시 (API 제공 포맷 그대로)
- 인라인 수정/삭제 (비밀번호 입력 폼 포함)
- 관리자 전용 일괄 삭제 지원
- 브라우저 `alert()` 대신 **토스트 알림** 사용

### 🔔 토스트 알림
- `success` / `error` / `warn` / `info` 4가지 타입
- 슬라이드 인/아웃 애니메이션 + 진행 바
- 클릭 시 즉시 닫기

## 🛠️ 기술 스택

- **Vanilla JS** (외부 라이브러리 없음)
- **CSS3** (Custom Properties, Keyframe 애니메이션)
- **Tistory Skin API** (`/m/api/guestbook`)
- 폰트: [Noto Sans KR](https://fonts.google.com/noto/specimen/Noto+Sans+KR), [Fira Code](https://github.com/tonsky/FiraCode)
- 코드 하이라이팅: [highlight.js](https://highlightjs.org/)

---

📄 라이선스

직접 운영 중인 블로그: [doyoucode dev blog](https://dyomyo.tistory.com)

---

