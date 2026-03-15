# doyoucode Tistory 스킨 — 코드 레퍼런스

> 이 문서는 `index.html` 및 `style.css` 전체를 분석한 개발용 참고문서입니다.
> 매번 소스를 열지 않고 이 파일만으로 구조·로직·수정 포인트를 파악할 수 있도록 작성했습니다.

---

## 목차

1. [파일 구조](#1-파일-구조)
2. [외부 의존성](#2-외부-의존성)
3. [HTML 뼈대 — Tistory 스킨 마크업](#3-html-뼈대--tistory-스킨-마크업)
4. [데스크탑 UI 컴포넌트 목록](#4-데스크탑-ui-컴포넌트-목록)
5. [JavaScript 모듈 상세](#5-javascript-모듈-상세)
6. [전역 window 함수 인터페이스](#6-전역-window-함수-인터페이스)
7. [카테고리 트리 (FS / Explorer 공용)](#7-카테고리-트리-fs--explorer-공용)
8. [Tistory API 연동 목록](#8-tistory-api-연동-목록)
9. [커스터마이징 포인트](#9-커스터마이징-포인트)
10. [테마 시스템 (Default · Astronaut · Sakura)](#10-테마-시스템-default--astronaut--sakura)
11. [창 공통 패턴 (드래그·리사이즈·최소화·최대화)](#11-창-공통-패턴-드래그리사이즈최소화최대화)
12. [z-index 관리 방식](#12-z-index-관리-방식)
13. [주요 CSS 클래스 레퍼런스](#13-주요-css-클래스-레퍼런스)
14. [style.css 구조 상세](#14-stylecss-구조-상세)

---

## 1. 파일 구조

```
tistory/
├── index.html          # 스킨 메인 (~10,400 줄) — 모든 HTML + JS 인라인
├── style.css           # 전체 스타일 (~8,700 줄, 외부 파일)
├── images/
│   ├── font.css        # 커스텀 폰트 정의
│   └── script.js       # 외부 공통 유틸 (dyoAnimOpen 등 일부 정의 가능)
└── README.md           # 이 문서
```

> `images/` 폴더는 실제 경로에 있어야 하며, `script.js`는 `index.html` 끝에서 가장 먼저 로드됩니다.

---

## 2. 외부 의존성

| 라이브러리 | 버전 | 용도 |
|-----------|------|------|
| Google Fonts | — | Ubuntu, Ubuntu Mono, Fira Code, Inter, Noto Sans KR |
| blueimp-md5 | 2.19.0 | 방명록/댓글 비밀번호 해싱 (MD5 단계) — `window.md5` |
| highlight.js | 11.9.0 | 코드블럭 syntax highlighting (github-dark 테마) |
| jQuery | 3.5.1 (IE9+) / 1.12.4 (IE8) | Tistory 기본 요구사항 (CDN: daumcdn) |
| YouTube IFrame API | — | 뮤직 플레이어 — `window.YT`, 동적 로드 |

---

## 3. HTML 뼈대 — Tistory 스킨 마크업

```
<body id="[##_body_id_##]">   ← Tistory가 페이지 타입에 따라 주입
  <s_t3>                       ← Tistory 조건 블록 (항상 렌더)
    #dkIndex                   ← "본문 바로가기" 스킵 링크
    #dkWrap.wrap_skin          ← 전체 스킨 래퍼 (홈에서 visibility:hidden)
      #dkHead                  ← 헤더
      #dkContent               ← 본문
        #cMain
          #mFeature.wrap_sub   ← 사이드바 (카테고리 메뉴 + 사이드 위젯)
          #mArticle            ← 글 본문 / 목록
      #dkFoot                  ← 푸터
    #scrollProgress            ← 스크롤 진행바
    #btnScrollTop              ← 맨 위로 가기 버튼
    #dyoTutorial               ← 튜토리얼 오버레이
    #dyoDesktop                ← 바탕화면 (홈 전용)
    #dyoCalPopup               ← 태스크바 캘린더 팝업 (시계 클릭으로 열기)
    #dyoBmWidget               ← Bookmarks 위젯 (홈 전용, 드래그 가능)
    #dyoMemoWidget             ← 메모 위젯 (홈 전용, CRUD 지원, 드래그 가능)
    #dyoFeaturesPopup          ← Features 폴더 팝업 (Blogram/Music/GitHub)
    #dyoDesktopBar             ← 하단 태스크바
    [각종 .dyo-shell-win 창들]
    .dyo-admin-bar             ← 관리자 버튼 (우하단)
    #dyoConfirmOverlay         ← 외부 링크 확인 다이얼로그
    #dyoCtxMenu                ← 우클릭 컨텍스트 메뉴
  </s_t3>
  <script src="./images/script.js">
  <script> ...인라인 JS... </script>
```

### 3-1. #dkHead 헤더 구성
- `.btn_cate` — 카테고리 토글 버튼
- `.area_search` + `s_search` — 검색폼 (`grep -r "keyword"` placeholder)
- `.area_profile` — 프로필 섹션
  - `.terminal-prompt` — `~$ whoami` 프롬프트
  - `.tit_post a` — 블로그 제목 링크 (/)
  - `.thumb_profile img` — 프로필 이미지 → `/category` 링크
  - `.txt_profile` — 블로거 닉네임
  - `#typingText` — 타이핑 애니메이션 타겟

### 3-2. #mFeature 사이드바
`s_sidebar > s_sidebar_element` 구조로 6개 위젯:
1. `s_rct_notice` — Notice 목록
2. `s_rctps_rep` — Recent Posts
3. `s_rctrp_rep` — Recent Comments
4. `s_link_rep` — Link
5. `[##_calendar_##]` — 달력
6. `s_random_tags` — Tags + `s_archive_rep` Archives + 방문자 수 (Today / Total)

- `.btn_close` — 사이드바 닫기 버튼
- `#btnShell` — 헤더 안의 Terminal 열기 버튼

### 3-3. #mArticle 본문 영역

| Tistory 태그 | 렌더 상황 |
|------------|---------|
| `s_list` | 목록 페이지 헤더 (글 수 배지 포함) |
| `.index_title` | 홈 제목 |
| `s_article_rep > s_index_article_rep` | 목록 뷰 — 썸네일, 제목, 요약, 카테고리, 날짜 |
| `s_article_rep > s_permalink_article_rep` | 단독 포스트 뷰 — 본문(`#article-view`), 태그, 관련글, 댓글 |
| `s_page_rep` | 페이지(공지 등) 단독 뷰 |
| `s_notice_rep` | 공지사항 목록/뷰 |
| `s_article_protected` | 비공개 글 — 비밀번호 폼 |
| `s_tag` | 태그 목록 페이지 |
| `s_guest` | 방명록 (`[##_guestbook_group_##]`) |
| `s_paging` | 페이지네이션 — Prev / 번호 / Next |

---

## 4. 데스크탑 UI 컴포넌트 목록

| ID | 타입 | 크기(초기) | 설명 |
|----|------|-----------|------|
| `#dyoDesktop` | 바탕화면 | 전체화면 | 6개 아이콘 그리드 + Features 폴더, 홈(`tt-body-index`)에서만 표시 |
| `#dyoDesktopBar` | 태스크바 | 하단 고정 52px | 태스크 버튼 + macOS Dock + 시계 + 뮤직 미니 |
| `#dyoBrowserWin` | 브라우저 창 | min(1200,vw-40) × min(700,vh-40) | iframe 기반 |
| `#dyoShellWin` | 터미널 창 | 680 × 440 | 중앙 정렬 |
| `#dyoReadmeWin` | README 창 | min(700,vw-40) × min(480,vh-40) | 중앙 정렬 |
| `#dyoGuestWin` | 방명록 채팅 | min(360,vw-40) × min(580,vh-40) | 우측 정렬 |
| `#dyoMusicWin` | 뮤직 플레이어 | 260 × (vh-76) | 우측 상단 고정 |
| `#dyoExplorerWin` | 파일 탐색기 | 680 × 480 | 중앙 정렬 |
| `#dyoPropsWin` | Properties | 360 × 480 | top:100, left:420 |
| `#dyoGalleryWin` | Blogram | min(400,vw-40) × min(580,vh-40) | 우측 정렬 |
| `#dyoBoardWin` | Board | 884 × 624 | memoTop 정렬, min 728×416 |
| `#dyoLightbox` | 라이트박스 | 전체화면 오버레이 | 사진 + Instagram 사이드바 |
| `#dyoTutorial` | 튜토리얼 | 전체화면 오버레이 | 스팟라이트 + 박스 + 창 미리보기 |
| `#dyoFeaturesPopup` | Features 폴더 팝업 | 아이콘 옆 동적 위치 | Blogram, Music, GitHub 3개 아이템 |
| `#dyoCalPopup` | 캘린더 팝업 | 태스크바 시계 위 | 월별 달력, 이전/다음 월, 오늘 표시 |
| `#dyoBmWidget` | Bookmarks 위젯 | Memo 아래 | 게시물(`/notice/129`)에서 링크 파싱, favicon 표시, 접기/펼치기, 드래그 이동 |
| `#dyoMemoWidget` | Memo 위젯 | 우상단 | 게시물(`/notice/126`)에서 할일 파싱, CRUD, 클립보드 복사, 드래그 이동 |
| `#dyoConfirmOverlay` | 외부 링크 다이얼로그 | 중앙 모달 | `dyoOpenExternal()` 로 호출 |
| `#dyoCtxMenu` | 컨텍스트 메뉴 | 동적 | 우클릭 위치 기준 |
| `.dyo-admin-bar` | 관리자 바 | 우하단 고정 | 글쓰기 / 관리 / 전체화면 |

### 데스크탑 아이콘 ID → 열리는 창

| 아이콘 ID | 행동 | 비고 |
|-----------|------|------|
| `desktopIconReadme` | `dyoOpenReadme()` | |
| `desktopIconBlog` | `dyoOpenBrowser('/category')` | |
| `desktopIconShell` | `dyoOpenShell()` | |
| `desktopIconExplorer` | `dyoOpenExplorer()` | |
| `desktopIconGuest` | `dyoOpenGuest()` | |
| `desktopIconBoard` | `dyoOpenBoard()` | 바탕화면 아이콘 (Features 앞 배치) |
| `desktopIconFeatures` | `dyoOpenFeatures()` — 폴더 팝업 토글 | |
| `desktopIconGallery` | `dyoOpenGallery()` | `display:none` — Features 폴더 안 |
| `desktopIconMusic` | `dyoOpenMusic()` | `display:none` — Features 폴더 안 |

### 태스크바 Board 버튼

| ID | 설명 |
|----|------|
| `#dyoBarBoard` | 태스크바 고정 Board 버튼 — 클릭 시 `dyoOpenBoard()` |
| `#dyoBarBoardBadge` | 미완료 카드 수(To Do + In Progress) 파란색 배지, 전부 Done이면 숨김 |

### Features 폴더 팝업 아이템 → 열리는 창

| 아이템 ID | 행동 |
|-----------|------|
| `fpBlogram` | `dyoOpenGallery()` |
| `fpMusic` | `dyoOpenMusic()` |
| `fpGithub` | `dyoOpenExternal('https://github.com/doyoungkim-code')` |

---

## 5. JavaScript 모듈 상세

모든 모듈은 즉시실행함수(IIFE) 패턴. `<script>` 블록은 총 6개.

---

### [Script 1] `./images/script.js` (외부)
공통 유틸. `window.dyoAnimOpen` 등 일부 함수가 여기에 정의될 수 있음.

---

### [Script 1 인라인] 기본 UI 모듈들

#### 1. 타이핑 애니메이션
```
대상: #typingText
텍스트: 'Do You Coding?'
타이핑 속도: 120ms / 삭제 속도: 80ms
타이핑 후 대기: 2000ms / 삭제 후 대기: 800ms
시작 딜레이: 1000ms
```

#### 2. 홈 데스크탑 초기화
- `document.body.id === 'tt-body-index'` 일 때만 실행
- `#dyoDesktop`에 `.show` 클래스 추가 → `display:flex` (CSS에서 기본 `display:none`)
- `body.style.overflow = 'hidden'` (스크롤 잠금)
- `#dyoDesktopBar`에 `.show` 클래스 추가
- `setInterval(updateClock, 1000)` — `#desktopClock`, `#desktopDate` 갱신
- 7개 바탕화면 아이콘(Board 포함) + Features 폴더 아이콘 클릭 이벤트 등록
- Features 폴더: 클릭 시 `#dyoFeaturesPopup` 토글 (Blogram/Music/GitHub 3개 아이템)
- 태스크바 Board 버튼: 클릭 시 `dyoOpenBoard()`, 배지에 미완료 카드 수 표시
- 태스크바 시계 클릭: 캘린더 팝업 토글 (`#dyoCalPopup`)
  - 팝업 위치: 아이콘 오른쪽, 화면 밖이면 왼쪽으로 전환
  - 팝업 외부 클릭 시 자동 닫힘
  - 팝업 아이템 우클릭 → `dyoShowIconCtxMenu()` 호출

#### 3. TOC 자동 생성
- `document.body.id === 'tt-body-page'` 일 때만 실행
- `#article-view` 안의 `h2, h3` 태그 수집 (2개 미만이면 생략)
- `.toc-wrapper > .toc-title` 클릭 → `.collapsed` 토글
- 각 헤딩에 `id="toc-heading-{i}"` 부여

#### 4. 코드블럭 처리
```
실행 순서:
1. hljs.highlightElement() — pre code 전체
2. data-ke-language (Tistory 에디터 속성) → class="language-{lang}" 변환
3. guessLang(codeText) — 정규식으로 언어 추측 (12개 언어)
4. .code-block-wrapper 생성 후 pre를 감쌈
5. .code-block-header 생성 (언어 이름 + 색상 도트 + Copy 버튼)
6. Copy 버튼: navigator.clipboard.writeText() → 2초 후 원복
```

지원 언어 색상 도트: Java, Python, JavaScript, TypeScript, HTML, CSS, JSON, SQL, Bash,
Shell, C, C++, C#, Go, Rust, Ruby, PHP, Swift, Kotlin, Dart, Scala, Dockerfile,
Groovy, Gradle, SCSS, XML, YAML, Markdown

`guessLang()` 패턴 탐지 순서:
Java → Python → JavaScript → TypeScript → HTML → CSS → SQL → Bash → JSON → XML → Dockerfile → Properties → Go → Rust

#### 5. 스크롤 진행바 + 맨 위로 가기
- `tt-body-page`에서만 진행바(`#scrollProgress`) 표시
- `scrollTop > 300px` → `#btnScrollTop`에 `.visible` 클래스

---

### [Script 1 인라인] Terminal 창 (`dyoShellWin`)

**변수:**
```js
history[]        // 명령어 히스토리 (↑↓ 탐색)
histIdx          // 현재 히스토리 인덱스
cwdPath[]        // 현재 경로 (FS 노드 배열, 루트=[FS])
prevCwdPath[]    // cd - 용 이전 경로
MIN_W=360, MIN_H=180
```

**가상 파일시스템 (FS 객체):**
```
~ (root, /category)
├── Project (/category/Project)
│   ├── Dev Log
│   └── Retrospect
├── Backend
│   ├── Java, Spring Boot, Database
├── Frontend
│   ├── Mobile, Web
├── CS & Engineering
│   ├── C, Algorithm, Computer Science, Infra & Tools
└── Growth
    ├── Certifications, English, Books, Documents, etc
```
> Terminal의 FS 정의와 File Explorer의 `tree` 정의는 코드상 별도 객체지만 **내용이 동일**해야 합니다.

**지원 명령어:**

| 명령어 | 동작 |
|--------|------|
| `help` | 사용 가능한 명령어 목록 출력 |
| `about` / `whoami` | 블로그 소개 |
| `ls [-l\|-al]` | 현재 디렉토리 목록 (`-l`: 상세, `-a`: 숨김 포함) |
| `cd [name\|..\|~\|-\|.]` | 디렉토리 이동; 최하위 카테고리는 `dyoOpenBrowser()` 호출 |
| `pwd` | `/home/doyoucode/blog/[경로]` 출력 |
| `search <kw>` / `grep <kw>` | `/search/{kw}` 를 브라우저 창으로 열기 |
| `date` | 현재 날짜·시간 KST |
| `echo <text>` | 텍스트 출력 |
| `github` | 400ms 후 `dyoOpenExternal()` |
| `clear` | 출력 초기화 + 배너 재표시 |
| `exit` | 터미널 창 닫기 |
| `sudo` / `rm` | 거부 메시지 |
| `hello` / `hi` | 인사 |

**Tab 자동완성:**
- 명령어 단독 입력 시 → 명령어 목록에서 prefix 매칭
- `cd [prefix]` 입력 시 → 현재 노드의 자식 이름에서 prefix 매칭

**addOutput(cmd, html):**
- 출력 블록 생성: 프롬프트 라인 + 결과 HTML
- `output.insertBefore(block, form)` — 입력폼 위에 삽입
- `output.scrollTop = output.scrollHeight` — 자동 스크롤

---

### [Script 1 인라인] Browser 창 (`dyoBrowserWin`)

```
openBrowser(url):
  url이 'http'로 시작하면 그대로 사용, 아니면 location.origin + url
  bFrame.src = fullUrl
  bUrlBar.textContent = hostname + path
  처음 열릴 때 min(1200, vw-40) × min(700, vh-40) 크기

closeBrowser():
  bFrame.src = 'about:blank' 로 초기화

bFrame.load 이벤트:
  try { bUrlBar.textContent = bFrame.contentWindow.location.href } catch { /* cross-origin 무시 */ }

뒤로/앞으로/새로고침:
  contentWindow.history.back() / forward() / location.reload()
  실패 시(cross-origin) bFrame.src = bFrame.src
```

드래그 중 `bFrame.style.pointerEvents = 'none'` → mouseup 시 복원.

---

### [Script 2] README / Guestbook 창

**README 창:** 단순 드래그/리사이즈/최소화/최대화 패턴 (콘텐츠는 HTML 정적)

**Guestbook 채팅창:**

비밀번호 해싱: `SHA-256( MD5( encodeURIComponent(passwd) ) )`
- MD5: `blueimp-md5` 라이브러리의 `window.md5()`
- SHA-256: `crypto.subtle.digest('SHA-256', ...)`

```
ADMIN_NICK = 'doyoucode'
isOwner    — role === 'owner' && isRequestUser
isLoggedIn — 어떤 아이템에든 isRequestUser === true

canEdit 로직:
  isOwner    → 관리자 메시지만
  isLoggedIn → 본인 메시지만 (isRequestUser)
  비로그인   → 게스트 메시지 전체 (비밀번호 입력 후 처리)

canDelete 로직:
  isOwner    → 모든 메시지
  isLoggedIn → 본인 메시지만
  비로그인   → 게스트 메시지 전체
```

API 호출:
- `GET  /m/api/guestbook?reverse=true` — 목록 로드 (credentials: include)
- `POST /m/api/guestbook` — 메시지 전송
- `PUT  /m/api/guestbook/{id}` — 수정
- `DELETE /m/api/guestbook/{id}` — 삭제 (body에 password)

수정/삭제는 인라인 폼 방식 — 말풍선 숨기고 폼 삽입, 완료/취소 후 원복.
`Ctrl+Enter` 단축키로 전송.

---

### [Script 3] 공통 유틸 모듈들

#### 외부 링크 확인 다이얼로그
```js
window.dyoOpenExternal(url)
  pendingUrl = url
  overlay.classList.add('show')

OK → window.open(pendingUrl, '_blank')
취소 / ESC / 배경클릭 / Enter(OK) 모두 지원
```

#### Toast 알림
```js
window.dyoToast(msg, type, duration)
  type: 'success' | 'error' | 'warn' | 'info'  (기본: 'info')
  duration: ms (기본: 3000)

container → document.body에 동적 추가
toast 클릭 시 즉시 dismiss
.dyo-toast-bar: animation-duration으로 진행 표시
```

#### 창 애니메이션 헬퍼
```js
window.dyoAnimOpen(winEl)
  window._dyoAnimSrc (아이콘 element)를 기준으로 transform-origin 계산
  .dyo-win-pop 클래스 → animationend 후 제거

window.dyoAnimDismiss(winEl, cb)
  최소화 상태거나 display 없으면 즉시 cb()
  .dyo-win-dismissing → animationend 후 cb()

window.dyoAnimMinimize(winEl, cb)
  독/태스크바 버튼 위치 계산 (없으면 화면 하단 중앙)
  --min-tx, --min-ty CSS 변수 설정
  .dyo-win-minimizing → animationend 후 cb()

window.dyoAnimMaximizeIn(winEl)   // .dyo-win-zoom-in
window.dyoAnimMaximizeOut(winEl)  // .dyo-win-zoom-out
```

#### 전체화면 토글
```js
#btnFullscreen 클릭:
  진입: documentElement.requestFullscreen() / webkitRequestFullscreen()
  종료: document.exitFullscreen() / webkitExitFullscreen()
  fullscreenchange 이벤트 → #fsIconExpand / #fsIconCompress 전환
```

#### 태스크바 버튼 (`#dyoBarCenter`)
8개 창 정의 → 각각 `<button class="dyo-taskbtn" data-win-id="...">` 생성

클릭 동작:
- 창 닫힘 → open 함수 호출
- 창 열림 + 최소화 → 복원 (`dyoAnimOpen`)
- 창 열림 + 정상 → 최소화 (`dyoAnimMinimize`)

`MutationObserver`로 창 class 변화 감지 → `.open` / `.active` / `.minimized` 클래스 토글.

#### macOS Dock (`#dyoDock`)
7개 항목 (README, Terminal, Dev Blog, Guestbook, Files, Blogram, Music)

hover 확대 효과:
```
MAX_SCALE = 1.6
INFLUENCE = 90  (px, 이 거리 이내의 아이템만 확대)
scale = 1 + (MAX_SCALE-1) * Math.pow(1 - dist/INFLUENCE, 1.2)
```
창이 열려있는 항목만(`.open`) 효과 적용.
독 자체는 열린 창이 하나라도 있을 때만 `display:flex`.

#### 우클릭 컨텍스트 메뉴

3가지 케이스:
1. **아이콘 우클릭** → Open / Properties
2. **태스크바 버튼 우클릭** → Bring to Front / Minimize / Close
3. **배경 우클릭** → New Terminal / Open README / Open Guestbook / Dev Blog / Open File Explorer / Open Blogram / Tutorial / Refresh Desktop

`iconMeta` 객체에 9개 아이콘(7개 바탕화면(Board 포함) + Features 폴더 + 숨겨진 Blogram/Music)의 메타데이터(name, ext, type, desc, location, url, size, disk, created, modified, owner, group, permissions, version, iconBg, iconBorder, iconColor, iconChar, action) 정의.

`window.dyoShowExpItemCtx(child, openFn, x, y)` — File Explorer 아이템 우클릭용.

---

### [Script 3] Properties 창

`buildContent(meta)` — 4개 섹션 렌더:
- **General**: Name, Type, Description, Location, (URL)
- **Storage**: Size, On disk
- **Dates**: Created, Modified, Accessed (항상 오늘)
- **Details**: Owner, Group, Permissions, Version, Encoding(UTF-8), Platform(Web/Browser)

`window.dyoOpenProps(meta)` — 열기. `window._dyoLastPropsMeta` 에도 저장.

---

### [Script 3] File Explorer (`dyoExplorerWin`)

```
tree[] — 카테고리 트리 (5개 루트 노드)
rootNode = { label:'Blog Root', icon:'📂', url:'/category', children: tree }

navHistory[] — { node, ancestors } 스택
navIdx       — 현재 인덱스

navigate(node, ancestors)
  navHistory = navHistory.slice(0, navIdx+1)
  navHistory.push({node, ancestors})
  navIdx++
  renderMain() + updateAddrBar() + updateNavBtns()

renderMain(node, ancestors)
  자식 있으면: Grid 뷰 or List 뷰
    bindItem(el, child):
      자식 있으면: navigate() 호출
      자식 없으면: dyoOpenBrowser(child.url)
      우클릭: dyoShowExpItemCtx()
  자식 없으면: "Open in Browser" 버튼

buildTreeNodes(nodes, depth, parentEl)
  재귀적으로 사이드바 트리 생성
  클릭: active 업데이트 + navigate() + 펼침/접힘 토글
```

뷰 전환: `#dyoExpViewGrid` / `#dyoExpViewList` → `setViewMode('grid'|'list')`
주소창: `.dyo-exp-crumb` — 클릭 시 해당 노드로 navigate (마지막 크럼은 링크 없음)

---

### [Script 4] Blogram (`dyoGalleryWin`)

```
GALLERY_CATEGORY = '/category/Pictures'   ← 변경 포인트
GALLERY_POSTS = []                        ← 수동 목록 (GALLERY_CATEGORY 비거나 실패 시 사용)
GALLERY_PAGE_SIZE = 12                    ← 한 번에 렌더할 사진 수
```

**카테고리 자동 파싱 (`fetchCategoryPosts`):**
- `fetch(path)` → `DOMParser` → `.list_content` 순회
- `.thumbnail_post img` + `a.thumbnail_post, a.link_post` + `.tit_post` + `.txt_date`
- 썸네일 URL: `/thumb/R???x???/` → `/thumb/R1280x0/` 고화질 변환
- 절대 URL이면 `.pathname`만 추출

**무한 스크롤:**
- `IntersectionObserver` — sentinel 요소가 `galleryBodyEl` 루트 기준 60px 이내 진입 시 `renderMore()`
- `_rendered` 변수로 다음 배치 시작 인덱스 추적

**라이트박스 — 좋아요 시스템:**
```
_likeCache[postId] = { liked: bool, count: number }

fetchLikeState(postId, postUrl, cb):
  병렬 2개 API 호출 (done 카운터로 both 완료 후 cb):
  ① GET /m/api/{postId}/reaction  → liked + count
  ② GET /reaction?entryId={postId} → isActive / reactionActivated

callReactionAPI(postId, isLike, cb):
  isLike  → POST /reaction  body: { entryId, reactionType:'LIKE' }
  !isLike → DELETE /reaction body: { entryId }
  낙관적 UI 업데이트 → API 실패 시 롤백 + 캐시 복원
```

**라이트박스 — 댓글 시스템:**
```
fetchTistoryComments(postUrl, cb):
  GET /m/api/{postId}/comment?reverse=true

postComment(postId, name, pw, text, cb):
  POST /m/api/{postId}/comment
  비밀번호: SHA-256( MD5( encodeURIComponent(pw) ) )
  body: { captcha:'', comment, homepage:location.origin, isSecret:false,
          mentionId:null, name, parent:null, password:hashedPw }
```

**로그인 상태 감지 (`detectLoginState`):**
1. `GET /m/api/me` 시도 → 응답 data 있으면 로그인
2. 실패 시 → `GET /m/api/guestbook?limit=3` fallback → `isRequestUser` 확인
결과를 `_lbLoginState`에 캐시 (한 번만 감지).

로그인 시: `.dyo-lb-ig-compose-meta` (이름/비밀번호 입력란) 숨김.

**키보드:** `ArrowLeft/Right` — 이전/다음, `Escape` — 닫기

---

### [Script 5] 전역 ESC 핸들러
```
열린 창(.dyo-shell-win.open:not(.minimized), .dyo-browser-win.open:not(.minimized)) 중
z-index 최댓값 창을 dyoAnimDismiss()로 닫음.
컨텍스트 메뉴(.dyo-ctx-menu.show)가 표시 중이면 창 닫기 건너뜀.
```

---

### [Script 5] 튜토리얼

```
TUT_KEY = 'dyo_tut_v1'   ← localStorage 키

steps[] 7개:
  0. 환영 메시지 (target: null)
  1. README 아이콘 spotlight
  2. Dev Blog 아이콘 spotlight → dyoBrowserWin 미리보기
  3. Terminal 아이콘 spotlight → dyoShellWin 미리보기
  4. File Explorer 아이콘 spotlight → dyoExplorerWin 미리보기
  5. Guestbook 아이콘 spotlight → dyoGuestWin 미리보기
  6. 완료 (target: null)
```

**창 미리보기 (`showWinPreview`):**
실제 창 DOM을 `cloneNode(true)` → `injectDummyContent()` → scale 계산 → `#dyoTutPreview`에 삽입.
브라우저 창은 iframe을 div로 교체, 탐색기는 트리/메인/주소바에 더미 데이터 주입, 방명록은 더미 채팅 렌더.

**spotlight 위치:** `el.getBoundingClientRect()` + padding 12px
**박스 위치:** 오른쪽 공간 충분하면 오른쪽, 아니면 왼쪽. 수직 중앙 정렬.

완료/건너뛰기: `localStorage.setItem(TUT_KEY, '1')` 저장.
`window.dyoMaybeStartTutorial()` — 미완료 시 launcher 버튼 표시.

---

### [Script 5] Memo 위젯 (`dyoMemoWidget`)

홈 페이지(`tt-body-index`) 전용. 게시물에서 할일 목록을 파싱하여 스티커 메모 형태로 표시.
CRUD 지원 — 추가, 인라인 수정(더블클릭), 삭제, 체크 토글, 클립보드 복사.

```
PLAN_POST_URL = '/notice/126'
_memoItems = []   // IIFE 스코프 배열
_dirty = false    // 변경사항 추적

fetchPostItems(url, cb):
  게시물 HTML 파싱 → p, li 개별 element의 innerHTML에서 <br> → \n 치환
  텍스트 형식: "X, 할일 내용" (X=미완료) / "O, 할일 내용" (O=완료)
  결과: [{ id, text, done }]

render(items):
  _memoItems에 저장
  체크박스 + 라벨 + 삭제 버튼(×) 리스트 렌더
  countEl: "완료수/전체수" 표시
  더블클릭: 인라인 수정 (input field → Enter/blur 저장, Esc 취소)
  삭제: × 버튼 클릭 시 _memoItems에서 제거 → _dirty → re-render
  체크 변경 시 _dirty = true

addMemo():
  하단 입력란 + 버튼으로 새 메모 추가
  _memoItems에 push → _dirty → re-render

클립보드 복사:
  _memoItems를 "O, text" / "X, text" 형식으로 변환 → 클립보드
  변경 시 .dirty 클래스 → 빨간 점 표시

접기/펼치기:
  localStorage 키: 'dyo_memo_collapsed'
  toggleBtn 클릭 시 body display 토글

드래그:
  헤더 mousedown → document mousemove/mouseup 패턴
  widget z-index: mousedown 시 _dyoZTop++ 적용

초기화 순서:
  fetchPostItems → render → dispatchEvent('dyoMemoReady')
```

---

### [Script 5] Bookmarks 위젯 (`dyoBmWidget`)

홈 페이지 전용. 게시물에서 링크를 파싱하여 북마크 목록으로 표시.

```
BM_POST_URL = '/notice/129'

fetchLinks(url, cb):
  게시물 HTML 파싱 → p, li 순회
  URL: <a href> 우선, 없으면 텍스트 regex
  이름: 텍스트에서 첫 쉼표 앞 부분 (없으면 hostname)
  결과: [{ title, url }]

render():
  favicon: Google S2 Favicons API 사용
  각 항목: favicon + 제목 + 호스트명

위치: dyoMemoWidget 바로 아래 (reposition)
드래그: 헤더 드래그 + z-index 관리
접기/펼치기: localStorage 'dyo_bm_collapsed'

초기화 순서:
  document 'dyoMemoReady' 이벤트 후 → fetchLinks → render → reposition
  → dispatchEvent('dyoBmReady')
```

---

### [Script 5] 캘린더 팝업 (`dyoCalPopup`)

태스크바 시계/날짜 클릭 시 표시되는 캘린더 팝업. 흰색 배경 + 검은 글씨.

```
renderCal():
  7열 그리드 — 일~토 요일 헤더 + 날짜 셀
  오늘 날짜: .today 클래스 (검정 배경 + 흰 글씨)

네비게이션:
  #dyoCalPrev / #dyoCalNext — 이전/다음 달

위치: 태스크바 시계 위 (bottom 기준 positioning)
열기/닫기: #dyoBarClock 클릭 시 토글, 팝업 외부 클릭 시 닫힘
```

위젯 초기화 체인: **Memo → (dyoMemoReady) → Bookmarks → (dyoBmReady)**

---

### [Script 6] Music Player (`dyoMusicWin`)

```
PLAYLIST = [
  { id: 'uTuuz__8gUM', title: '', artist: '' },
  { id: 'CfPxlb8-ZQ0', title: '', artist: '' },
  { id: 'HfaIcB4Ogxk', title: '', artist: '' },
  { id: 'hOJ76cZEt08', title: '', artist: '' }
]
```
> `title`, `artist`는 YouTube API 로드 후 `getVideoData()`로 자동 채워짐.

**YouTube IFrame API 초기화:**
```
loadYTAPI() → <script src="https://www.youtube.com/iframe_api"> 동적 삽입
window.onYouTubeIframeAPIReady → initPlayer()
playerVars: { autoplay:0, controls:0, disablekb:1, fs:0, iv_load_policy:3, modestbranding:1, rel:0 }
```

**상태 흐름:**
```
onPlayerReady → setVolume(volEl.value) + syncMeta() + (autoPlayOnReady ? playVideo())
onStateChange:
  PLAYING → setPlaying(true) + syncMeta()
  PAUSED/BUFFERING → setPlaying(false)
  ENDED → playTrack((curIdx+1) % length)
```

**진행바:**
- `setInterval(updateProgress, 1000)` 재생 중에만 동작
- `fillEl.style.width` + `knobEl.style.left` = `(cur/dur)*100%`
- 라이브 스트림: `dur <= 0` → "LIVE" 표시

**Seek:**
- `#dyoMusicSeek` mousedown → `seeking=true` → mousemove 중 `doSeek(e)`
- `ytPlayer.seekTo(pct * dur, true)`

**태스크바 미니 위젯 (`#dyoTbMusic`):**
- 재생 시작(`setPlaying(true)`) → `.show` 클래스 + `showTbMusic()`
- 일시정지(`setPlaying(false)`) → `hideTbMusic()`
- `#dyoTbmPlay` — 재생/일시정지
- `#dyoTbmVol` — 볼륨 슬라이더 (volEl과 연동)
- `#dyoTbmOpen` / `#dyoTbmTitle` 클릭 — `openMusic()`

---

### [Script 6] Board (`dyoBoardWin`)

```
BOARD_URL = '/notice/130'
COLS = [
  { id: 'todo',       title: 'To Do',      color: '#3b82f6' },
  { id: 'inprogress', title: 'In Progress', color: '#f59e0b' },
  { id: 'done',       title: 'Done',        color: '#22c55e' }
]
MIN_W = 728, MIN_H = 416
초기 크기: 884 × 624
```

**데이터 파싱 (`fetchBoardCards`):**
- 게시글 HTML 파싱 → content area `innerHTML`에서 `<br>` → `\n` 치환 후 라인별 파싱
- 텍스트 형식: `"colNum, title[, label[, priority[, desc[, dueDate]]]]"`
- colNum: 1=Todo, 2=InProgress, 3=Done
- label: `bug`, `feature`, `docs`, `infra`
- priority: `veryhigh`, `high`, `medium`, `low`, `verylow`
- dueDate: `YYYY-MM-DD` 형식 (D-day 배지로 표시)
- desc 안의 `[ ] 항목` / `[x] 항목` 패턴은 서브태스크로 자동 파싱

**툴바 (`#dyoBoardToolbar`):**
- 새 이슈 추가 버튼 (`#dyoBrdAddBtnTrigger`) — 폼 토글
- 검색 입력 (`#dyoBrdSearch`) — 카드 제목 실시간 필터링
- 라벨 필터 (`#dyoBrdFilterLabel`) — bug/feature/docs/infra 필터
- 우선순위 필터 (`#dyoBrdFilterPriority`) — veryhigh~verylow 필터
- 진행률 바 (`#dyoBrdProgressBar`) — Done 카드 비율 표시 (숫자 + 퍼센트)
- 클립보드 복사 버튼 (`#dyoBrdClipboard`) — 현재 보드 상태를 게시물 형식으로 복사
  - 변경 시 `.dirty` 클래스 → 빨간 점 표시

**이슈 추가 (`#dyoBrdAddForm`):**
- 제목, 컬럼, 라벨, 우선순위, 마감일, 설명 입력
- 추가 시 `_allCards`에 push → `_dirty = true` → re-render

**이슈 수정 (상세 패널 내 인라인 폼):**
- Edit 버튼 클릭 → view/edit 모드 토글
- 제목, 컬럼, 라벨, 우선순위, 마감일, 설명(서브태스크 포함) 편집
- Save 시 카드 속성 업데이트 → `_dirty = true` → re-render

**이슈 삭제 (상세 패널):**
- Delete 버튼 클릭 → `_allCards`에서 제거 → 패널 닫기 → re-render

**Done 카드 취소선:**
- Done 컬럼 카드 제목에 `line-through` + `opacity: 0.55` 자동 적용

**카드 D-day 배지:**
- `getDdayBadge(dateStr)` — 오늘 기준 D-day 계산
- 3일 이내: `.soon` (주황), 만료: `.overdue` (빨강+취소선)

**카드 서브태스크:**
- `parseSubtasks(desc)` — desc에서 `[ ] / [x]` 패턴 추출
- 카드에 `"완료/전체"` 배지, 상세 패널에 체크리스트 UI
- 체크 변경 시 `_dirty = true` 설정

**드래그 앤 드롭:**
- HTML5 Drag API 사용 (`draggable="true"`)
- 드래그 중 `.dragging` 클래스 (반투명)
- 드롭 존: `.dyo-brd-dragover` (파란 점선 테두리)
- `.dyo-brd-drop-indicator` — 삽입 위치 표시 (파란 막대)
- 드롭 시 카드의 `colId` 변경 → `_dirty = true` → Toast 알림
- 게시물은 직접 수정 불가 → 클립보드 복사 버튼으로 변경 데이터 추출

**컬럼 접기/펼치기:**
- `.dyo-brd-col-toggle` 버튼 — 컬럼 헤더에 +/− 표시
- 접힌 상태: 48px 폭, 제목 세로 표시, 카드 영역 숨김
- `_collapsedCols` 객체로 상태 관리

**카드 상세 패널:**
- 카드 클릭 시 우측 280px 슬라이드 패널 열림 (창 너비 자동 확장)
- 담당자, 보고자, 우선순위, 카테고리, 마감일, 서브태스크 체크리스트 표시
- Edit / Delete 버튼
- 닫기 시 창 너비 복원

**클립보드 복사:**
- 클릭 시 `_allCards`를 게시물 텍스트 형식으로 변환
- `navigator.clipboard.writeText()` → Toast "복사되었습니다"
- 형식: `"컬럼번호, 제목, 라벨, 우선순위, 설명 [x] 서브태스크, 마감일"`

**태스크바 배지 (독립 IIFE):**
- Board 창 열림 여부와 무관하게 `/notice/130` 파싱
- 미완료 카드(To Do + In Progress) 수를 `#dyoBarBoardBadge`에 표시
- 전부 Done이면 배지 숨김

**열기 방식:**
- 바탕화면 Board 아이콘 클릭
- 태스크바 Board 버튼 클릭

드래그/리사이즈/최소화/최대화: 다른 창과 동일 패턴.
터치 드래그(모바일) 지원.

---

## 6. 전역 window 함수 인터페이스

| 함수 | 등록 위치 | 설명 |
|------|----------|------|
| `window.dyoOpenShell()` | Terminal 모듈 | 터미널 창 열기 |
| `window.dyoOpenBrowser(url)` | Browser 모듈 | 브라우저 창 열기 |
| `window.dyoOpenReadme()` | README 모듈 | README 창 열기 |
| `window.dyoOpenGuest()` | Guestbook 모듈 | 방명록 창 열기 |
| `window.dyoOpenExternal(url)` | 외부 링크 모듈 | 외부 링크 확인 다이얼로그 |
| `window.dyoOpenExplorer()` | File Explorer 모듈 | 탐색기 창 열기 |
| `window.dyoOpenGallery()` | Blogram 모듈 | 갤러리 창 열기 |
| `window.dyoOpenMusic()` | Music 모듈 | 뮤직 플레이어 창 열기 |
| `window.dyoOpenBoard()` | Board 모듈 | Board 창 열기 |
| `window.dyoOpenFeatures()` | Features 폴더 모듈 | Features 폴더 팝업 열기 |
| `window.dyoOpenProps(meta)` | Properties 모듈 | Properties 창 열기 |
| `window.dyoShowExpItemCtx(child, openFn, x, y)` | CtxMenu 모듈 | 탐색기 아이템 우클릭 메뉴 |
| `window.dyoToast(msg, type, duration)` | Toast 모듈 | Toast 알림 표시 |
| `window.dyoAnimOpen(winEl)` | 애니메이션 모듈 | 창 열기 팝 애니메이션 |
| `window.dyoAnimDismiss(winEl, cb)` | 애니메이션 모듈 | 창 닫기 애니메이션 |
| `window.dyoAnimMinimize(winEl, cb)` | 애니메이션 모듈 | 창 최소화 애니메이션 |
| `window.dyoAnimMaximizeIn(winEl)` | 애니메이션 모듈 | 최대화 진입 애니메이션 |
| `window.dyoAnimMaximizeOut(winEl)` | 애니메이션 모듈 | 최대화 복원 애니메이션 |
| `window.dyoStartTutorial()` | 튜토리얼 모듈 | 튜토리얼 시작 (step 0) |
| `window.dyoMaybeStartTutorial()` | 튜토리얼 모듈 | localStorage 미완료 시 launcher 표시 |

**전역 상태 변수:**

| 변수 | 설명 |
|------|------|
| `window._dyoZTop` | 현재 최상위 z-index (9000에서 시작, 창 열릴 때마다 +1) |
| `window._dyoAnimSrc` | 애니메이션 기준 element (아이콘 클릭 시 설정, animOpen 후 null로 초기화) |
| `window._dyoBWin` | 브라우저 창 element 참조 |
| `window._dyoBFrame` | 브라우저 창 iframe 참조 |
| `window._dyoBUrlBar` | 브라우저 창 URL바 참조 |
| `window._dyoLastPropsMeta` | 마지막으로 열었던 Properties meta 객체 |

---

## 7. 카테고리 트리 (FS / Explorer 공용)

**수정 시 두 곳 동시 업데이트 필요:**
- Terminal: `index.html` ~line 1776 — `var FS = { ... }`
- File Explorer: `index.html` ~line 4341 — `var tree = [ ... ]`

**트리 구조:**
```
children가 있으면 → 폴더 (cd/navigate 가능)
children가 없거나 빈 배열 → 파일 (클릭 시 dyoOpenBrowser(url))
```

---

## 8. Tistory API 연동 목록

| API | Method | 용도 |
|-----|--------|------|
| `/m/api/guestbook` | GET | 방명록 목록 (`?reverse=true`) |
| `/m/api/guestbook` | POST | 방명록 작성 |
| `/m/api/guestbook/{id}` | PUT | 방명록 수정 |
| `/m/api/guestbook/{id}` | DELETE | 방명록 삭제 |
| `/m/api/{postId}/comment` | GET | 댓글 목록 (`?reverse=true`) |
| `/m/api/{postId}/comment` | POST | 댓글 작성 |
| `/m/api/{postId}/reaction` | GET | 좋아요 상태 + 카운트 |
| `/reaction` | GET | 좋아요 `isActive` 여부 (`?entryId={id}`) |
| `/reaction` | POST | 좋아요 추가 |
| `/reaction` | DELETE | 좋아요 취소 |
| `/m/api/me` | GET | 로그인 상태 확인 |

모든 API 호출에 `credentials: 'include'` 포함.

**비밀번호 해싱 공통 방식:**
```
SHA-256( md5( encodeURIComponent(plaintext) ) )
```
blueimp-md5가 없으면 `encodeURIComponent()` 값을 그대로 SHA-256 처리.

---

## 9. 커스터마이징 포인트

### 9-1. 개인 정보 (하드코딩된 값들)

| 위치(약) | 값 | 변수/ID |
|---------|-----|---------|
| line 1307 | `'Do You Coding?'` | 타이핑 텍스트 |
| line 1411 | `'https://github.com/doyoungkim-code'` | GitHub URL (Features 폴더 아이콘 클릭) |
| line 1776 | FS 객체 전체 | Terminal 가상 파일시스템 |
| line 2737 | `'doyoucode'` | Guestbook ADMIN_NICK |
| line 4341 | tree[] 전체 | File Explorer 카테고리 트리 |
| line 4761 | `'/category/Pictures'` | Blogram 파싱 카테고리 |
| line 5519 | `'/notice/126'` | Memo 위젯 게시물 URL (`PLAN_POST_URL`) |
| line 6038 | PLAYLIST[] 4개 | 뮤직 플레이어 YouTube ID |
| line 6412 | `'/notice/129'` | Bookmarks 위젯 게시물 URL (`BM_POST_URL`) |
| line 6703 | `'/notice/130'` | Board 데이터 게시글 URL (`BOARD_URL`) |
| line 1187 | img src (긴 CDN URL) | Blogram 프로필 아바타 이미지 |

### 9-2. 뮤직 플레이어 곡 추가/변경
```js
var PLAYLIST = [
  { id: 'YouTube_VIDEO_ID', title: '', artist: '' },
  // title/artist는 비워도 됨 (API에서 자동 채워짐)
];
```

### 9-3. Blogram 사진 수동 추가 (카테고리 없을 때)
```js
var GALLERY_POSTS = [
  { img: 'CDN_URL', url: '/포스트_경로', title: '제목', date: 'YYYY-MM-DD' },
];
var GALLERY_CATEGORY = '';  // 빈 문자열로 변경 필요
```

### 9-4. 카테고리 트리 수정
1. Terminal FS 객체 (line ~1776) 수정
2. File Explorer tree 배열 (line ~4341) 동일하게 수정
3. README 창 내부 HTML 텍스트 (line ~793) 에도 명령어 설명이 하드코딩되어 있음

### 9-5. Memo 위젯 데이터 변경
게시물 URL 변경: `PLAN_POST_URL` (line ~5519)
게시물 텍스트 형식: 한 줄에 하나씩, `"O, 완료 항목"` 또는 `"X, 미완료 항목"`

### 9-6. Bookmarks 위젯 데이터 변경
게시물 URL 변경: `BM_POST_URL` (line ~6412)
게시물 텍스트 형식: 한 줄에 `"이름, https://url"` 또는 `<a>` 태그 포함 텍스트

### 9-7. Board 데이터 변경
게시물 URL 변경: `BOARD_URL` (line ~6703)
게시물 텍스트 형식: `"컬럼번호, 제목[, 라벨[, 우선순위[, 설명[, 마감일]]]]"`
- 컬럼번호: 1=Todo, 2=InProgress, 3=Done
- 라벨: `bug`, `feature`, `docs`, `infra`
- 우선순위: `veryhigh`, `high`, `medium`, `low`, `verylow`
- 마감일: `YYYY-MM-DD` 형식
- 설명 내 `[ ] 항목` / `[x] 항목` → 서브태스크 자동 파싱
- UI에서 추가/수정/삭제 가능 (변경사항은 클립보드 복사 → 게시물에 반영)

### 9-8. 튜토리얼 단계 수정
`steps[]` 배열 — `target`, `emoji`, `title`, `desc`, `previewWin` 필드 수정.

### 9-9. 전체화면 모드 CSS (홈화면)
```css
/* index.html <style> 블록 */
#tt-body-index #dkWrap { visibility: hidden; }     /* 스킨 본문 숨김 */
#tt-body-index #dyoDesktop { display: flex; }      /* 데스크탑 즉시 표시 */
#tt-body-index #dyoDesktopBar { display: flex; }

/* 커버 이미지 */
<s_if_var_cover-image>
.wrap_sub { background-image: url('[##_var_cover-image_##]'); }
</s_if_var_cover-image>
```

---

## 10. 테마 시스템 (Default · Astronaut · Sakura)

태스크바의 🎨 팔레트 아이콘 클릭으로 3가지 테마를 전환. `#dyoDesktop`에 `.theme-astronaut` 또는 `.theme-sakura` 클래스를 토글하여 전환.

### 테마 구조

| 테마 | CSS 클래스 | 레이어 | 주요 요소 |
|------|-----------|--------|----------|
| Default | (없음) | — | 기본 바탕화면 |
| Astronaut | `.theme-astronaut` | `.dyo-astro-layer` | 우주인 캐릭터, 별, 행성 |
| Sakura | `.theme-sakura` | `.dyo-sakura-layer` | 고양이 4마리, 벚꽃나무 3그루, 나비(최대 6마리) |

### 테마별 요소 가시성

```
.dyo-astro-layer   → .theme-astronaut 일 때만 display
.dyo-sakura-layer  → .theme-sakura 일 때만 display

개별 요소 숨김 (드래그로 레이어 밖으로 이동된 경우 대비):
  .dyo-desktop:not(.theme-astronaut) .dyo-astronaut      { display: none !important; }
  .dyo-desktop:not(.theme-sakura)    .dyo-sakura-cat      { display: none !important; }
```

### 캐릭터 드래그 & 물리 시스템

우주인(Astronaut)과 고양이(Sakura)는 포인터 캡처 기반 드래그를 지원.

```
드래그 시작: pointerdown → setPointerCapture()
드래그 중:   pointermove → 캐릭터 위치 업데이트 (inline style)
드래그 종료: pointerup   → releasePointerCapture() → 물리 시뮬레이션

물리 시뮬레이션:
  1. 드래그 속도(velocity) 계산
  2. 중력 적용 → 낙하
  3. 지면 충돌 → 바운스 (감쇠)
  4. 정지 후 → 걸어가기 애니메이션 (원래 위치로 복귀)

지면 높이 계산: getGroundY()
  - SVG terrain (viewBox 0 0 1920 240) 기반
  - 3개의 언덕 중 가장 앞쪽(front hill) 기준
  - Sakura: gr.height * 0.70
```

### 말풍선 시스템

캐릭터 클릭 시 말풍선 표시. 캐릭터의 `scaleX(-1)` 상태에서도 올바르게 위치하도록 `--bubble-flip` CSS 변수 사용.

```css
transform: translateX(-50%) scaleX(var(--bubble-flip, 1));
```

### 나비 (Sakura 테마)

- 최대 6마리 제한 (`maxButterflies = 6`)
- 랜덤 생성 + 날아다니기 애니메이션
- 테마 전환 시 카운트 체크로 무한 증가 방지

### 테마 전환 시 정리

```js
resetThemeObjects()
  — desktop.appendChild()로 레이어 밖으로 이동된 오브젝트를
    원래 레이어로 복귀시킴
  — inline style 제거하여 CSS 기본 위치로 리셋
```

---

## 11. 창 공통 패턴 (드래그·리사이즈·최소화·최대화)

모든 창이 동일한 패턴을 각각 독립적으로 구현.

```
변수:
  dragging, dragOX, dragOY
  resizing, resizeDir, resizeSX, resizeSY, resizeSRect
  savedPos = { left, top, right, bottom, width, height }  // 최대화 전 위치 저장
  MIN_W, MIN_H  // 창 최소 크기

드래그:
  titlebar.mousedown → 현재 getBoundingClientRect()를 inline style로 고정
                      → dragging=true, dragOX/Y 기록
  document.mousemove → Math.max/min으로 화면 경계 제한 (하단 40px 태스크바 여유)
  document.mouseup   → dragging=false

리사이즈:
  .dyo-brs-handle.mousedown → data-dir 속성('n','ne','e','se','s','sw','w','nw') 읽기
  document.mousemove → dir에 따라 left/top/width/height 계산 (MIN_W/H 보장)

최소화:
  최소화 상태 → 복원: classList.remove('minimized') + dyoAnimOpen()
  정상 상태 → 최소화: savedPos 기록(최대화 상태면 먼저 복원) + dyoAnimMinimize() + classList.add('minimized')

최대화:
  최대화 상태 → 복원: classList.remove('maximized') + savedPos 복원 + dyoAnimMaximizeOut()
  정상 상태 → 최대화: savedPos 기록 + style 전부 '' + classList.add('maximized') + dyoAnimMaximizeIn()

타이틀바 더블클릭 → 최대화 토글
z-index: win.addEventListener('mousedown') → window._dyoZTop++ + win.style.zIndex
```

리사이즈 핸들 8방향: `.dyo-brs-handle[data-dir="n|ne|e|se|s|sw|w|nw"]`

---

## 12. z-index 관리 방식

```
window._dyoZTop (초기값 9000)

창 열릴 때: window._dyoZTop++ → win.style.zIndex = window._dyoZTop
창 클릭 시(mousedown): 동일하게 ++하여 최상위로
최상위 창이 어느 창인지 확인: parseInt(winEl.style.zIndex) >= window._dyoZTop

.dyo-ctx-menu — 매우 높은 z-index (CSS에서 별도 설정)
.dyo-admin-bar, .dyo-desktop-bar — 고정 z-index (CSS에서 별도 설정)
.dyo-lightbox — 최상위 (CSS에서 별도 설정)
#dyoTutorial — 튜토리얼 오버레이 (CSS에서 별도 설정)
```

---

## 13. 주요 CSS 클래스 레퍼런스

> 상세 스타일은 `style.css` 참고. 여기서는 JS에서 토글되는 동작 관련 클래스만 정리.

| 클래스 | 대상 element | JS 토글 시점 |
|--------|-------------|-------------|
| `.show` | `#dyoDesktop`, `#dyoDesktopBar` | 홈 페이지 초기화 |
| `.show` | `#dyoTbMusic` | 뮤직 재생 시작 |
| `.show` | `#dyoCtxMenu` | 우클릭 메뉴 표시 |
| `.active` | `#dyoTutorial` | 튜토리얼 시작 |
| `.open` | `.dyo-shell-win`, `.dyo-browser-win` | 창 열기 |
| `.minimized` | 창 요소 | 최소화 |
| `.maximized` | 창 요소 | 최대화 |
| `.open` | `.dyo-taskbtn`, `.dyo-dock-item` | 대응 창이 열려있을 때 |
| `.active` | `.dyo-taskbtn` | 창 열림 + 최소화 아님 |
| `.minimized` | `.dyo-taskbtn`, `.dyo-dock-item` | 창 최소화 상태 |
| `.playing` | `#dyoMusicArt`, `#dyoTbMusic` | 뮤직 재생 중 |
| `.liked` | `#dyoLbLikeBtn` | 좋아요 누른 상태 |
| `.collapsed` | `.toc-wrapper`, `.dyo-tree-children` | 접힌 상태 |
| `.active` | `.dyo-tree-item` | 탐색기 선택 노드 |
| `.active` | `.dyo-exp-viewbtn` | Grid/List 뷰 활성 버튼 |
| `.active` | `.dyo-music-pl-item` | 현재 재생 중인 곡 |
| `.open` | `.dyo-lb-ig-dropdown` | 라이트박스 더보기 드롭다운 |
| `.open` | `#dyoLightbox` | 라이트박스 열림 |
| `.visible` | `#btnScrollTop` | 300px 이상 스크롤 시 |
| `.dyo-win-pop` | 창 요소 | 열기 애니메이션 중 |
| `.dyo-win-dismissing` | 창 요소 | 닫기 애니메이션 중 |
| `.dyo-win-minimizing` | 창 요소 | 최소화 애니메이션 중 |
| `.dyo-win-zoom-in` | 창 요소 | 최대화 진입 애니메이션 중 |
| `.dyo-win-zoom-out` | 창 요소 | 최대화 복원 애니메이션 중 |
| `.owner-mode` | `#dyoGuestMeta` | 관리자 로그인 시 이름/비밀번호 숨김 |
| `.no-target` | `#dyoTutSpotlight` | 튜토리얼 타겟 없는 단계 |
| `.hidden` | `#dyoTutPreview`, `#dyoTutLauncher` | 숨김 상태 |
| `.copied` | `.code-copy-btn` | 복사 완료 상태 (2초) |
| `.open` | `#dyoFeaturesPopup` | Features 폴더 팝업 표시 |
| `.collapsed` | `.dyo-memo-widget`, `.dyo-bm-widget` | 위젯 접힌 상태 |
| `.done` | `.dyo-memo-item` | Memo 항목 완료 상태 |
| `.done` | `.dyo-brd-card-title` | Board Done 컬럼 카드 제목 취소선 |
| `.dirty` | `.dyo-brd-clipboard-btn`, `.dyo-memo-action-btn` | 변경사항 있음 (빨간 점 표시) |
| `.editing` | `.dyo-memo-item` | Memo 항목 인라인 편집 중 |
| `.open` | `.dyo-brd-detail-panel` | Board 카드 상세 패널 열림 |
| `.theme-astronaut` | `#dyoDesktop` | 우주인 테마 활성화 |
| `.theme-sakura` | `#dyoDesktop` | 벚꽃 테마 활성화 |
| `.dyo-astronaut` | 우주인 element | 개별 요소 테마 전환 시 숨김용 |
| `.dyo-sakura-cat` | 고양이 element | 개별 요소 테마 전환 시 숨김용 |

---

## 14. style.css 구조 상세

전체 **~8,700 줄**. 다크 사이드바 + 라이트 콘텐츠 이중 테마 + 3가지 데스크탑 테마(Default · Astronaut · Sakura).

---

### 13-1. CSS 변수 (`:root`)

#### 사이드바 (Dark)
| 변수 | 값 | 용도 |
|------|----|------|
| `--sb-bg` | `#0d1117` | 사이드바 기본 배경 |
| `--sb-bg2` | `#161b22` | 사이드바 보조 배경 |
| `--sb-bg3` | `#1c2128` | 사이드바 3차 배경 |
| `--sb-text` | `#ffffff` | 기본 텍스트 |
| `--sb-text2` | `#e6edf3` | 보조 텍스트 |
| `--sb-text3` | `#b1bac4` | 3차 텍스트 |
| `--sb-border` | `#21262d` | 기본 보더 |
| `--sb-border2` | `#30363d` | 보조 보더 |
| `--sb-green` | `#3fb950` | 강조색 (프롬프트, 커서 등) |
| `--sb-cyan` | `#39d353` | 보조 강조색 |
| `--sb-blue` | `#58a6ff` | 링크/액션 색 |
| `--sb-purple` | `#bc8cff` | 보조 강조색 |

#### 콘텐츠 (Light)
| 변수 | 값 | 용도 |
|------|----|------|
| `--ct-bg` | `#ffffff` | 콘텐츠 기본 배경 |
| `--ct-bg2` | `#f6f8fa` | 콘텐츠 보조 배경 |
| `--ct-bg3` | `#eef1f5` | 콘텐츠 3차 배경 |
| `--ct-text` | `#1f2328` | 기본 텍스트 |
| `--ct-text2` | `#656d76` | 보조 텍스트 |
| `--ct-text3` | `#8b949e` | 3차 텍스트 |
| `--ct-border` | `#d1d9e0` | 기본 보더 |
| `--ct-link` | `#0969da` | 링크 색 |
| `--ct-green` | `#1a7f37` | 성공/강조 |
| `--ct-purple` | `#8250df` | 보조 강조 |
| `--ct-orange` | `#bc4c00` | 경고색 |
| `--ct-hover` | `#f3f5f8` | hover 배경 |

#### 공통
| 변수 | 값 | 용도 |
|------|----|------|
| `--font-mono` | `'Fira Code', 'Consolas', monospace` | 코드/터미널 폰트 |
| `--font-sans` | `'Noto Sans KR', -apple-system, ...` | 본문 폰트 |
| `--radius` | `8px` | 기본 border-radius |
| `--radius-sm` | `4px` | 소형 border-radius |
| `--tr` | `0.2s ease` | transition 기본값 |

---

### 13-2. 섹션별 구조

| 줄 번호 | 섹션 | 주요 내용 |
|---------|------|---------|
| 1~43 | CSS 변수 | `:root` — 테마 컬러·폰트·radius·transition |
| 44~167 | Reset & Utilities | 마진/패딩 초기화, `.screen_out`, `.show`, `.hide` |
| 169~186 | Layout | `.wrap_skin` (280px 좌측 패딩), `.cont_skin` (흰 배경) |
| 187~778 | Sidebar (Dark Theme) | `.area_head`, 프로필, 타이핑 커서, 검색, 카테고리 내비게이션, 사이드바 위젯 |
| 779~1879 | Content Area (Light Theme) | 글 목록, 단독 포스트(`#article-view`), 댓글, 페이지네이션, 태그, 방명록 |
| 1880~1906 | Footer | `.area_foot` |
| 1907~2221 | Responsive: Mobile | 768px 이하 모바일 레이아웃 전환 |
| 2222~2318 | TOC | `.toc-wrapper`, `.toc-title`, `.toc-list`, `.collapsed` |
| 2319~2334 | Scroll Progress Bar | `#scrollProgress` |
| 2335~2405 | Scroll To Top Button | `#btnScrollTop`, `.visible` |
| 2406~2571 | Shell Window | `#dyoShellWin`, 터미널 출력·입력·프롬프트 |
| 2572~2722 | Desktop Home Screen | `#dyoDesktop`, 아이콘 그리드, `#dyoDesktopBar`, 태스크바, 시계 |
| 2723~3143 | Features 폴더 팝업 | `.wrap_sub` (사이드바 오버레이), 카테고리 메뉴 슬라이드 |
| 3144~3195 | (미명명) | 추가 데스크탑 관련 스타일 |
| 3196~3338 | Browser Window | `#dyoBrowserWin`, iframe, URL바, 내비게이션 버튼 |
| 3339~3394 | Window Animations | `.dyo-win-pop`, `.dyo-win-dismissing`, `.dyo-win-minimizing`, `.dyo-win-zoom-in/out` |
| 3395~3472 | Browser Launch Animation | 브라우저 창 열기 효과 |
| 3473~4229 | Guestbook 채팅창 | `#dyoGuestWin`, 말풍선, 입력폼, 수정/삭제 UI |
| 4230~4499 | Toast | `.dyo-toast-container`, `.dyo-toast`, `.dyo-toast-bar` |
| 4500~4901 | Gallery Lightbox | `#dyoLightbox`, Instagram 스타일 사이드바, 댓글, 좋아요 |
| 4902~5057 | Boot Screen | `#dyoBootScreen` (사용 여부 확인 필요) |
| 5058~5066 | Music Player 아이콘 | 뮤직 아이콘 스타일 |
| 5067~5321 | Music Player Window | `#dyoMusicWin`, 플레이리스트, 진행바, seek knob, 볼륨 |
| 5322~5493 | Memo 위젯 | `.dyo-memo-widget`, CRUD 버튼, 인라인 편집, 클립보드 복사 |
| 5494~5630 | Bookmarks 위젯 | `.dyo-bm-widget`, favicon + 링크 목록, 접기/펼치기 |
| 5631~5750 | 캘린더 팝업 + 태스크바 Board 버튼 | `.dyo-cal-popup`, `.dyo-bar-board`, 배지 |
| 5751~6700+ | Board Window | `.dyo-brd-win`, 컬럼·카드·상세 패널·CRUD·드래그 앤 드롭, 모바일 반응형 |
| 6700~8000+ | Astronaut 테마 | `.theme-astronaut`, 우주인 캐릭터, 드래그 물리, 말풍선, 별/행성 배경 |
| 8000~8700+ | Sakura 테마 | `.theme-sakura`, 고양이 4마리, 벚꽃나무, 나비, 언덕 terrain, 말풍선 |

---

### 13-3. 사이드바 상세

```
.area_head
  position: fixed; left:0; top:0; width:280px; z-index:1000
  flex-direction: column; align-items: center; padding: 48px 0 24px

.area_profile
  .terminal-prompt   → "~$ whoami" 스타일 (font-mono, sb-text3)
  .link_post         → 블로그 제목 (font-mono, 21px, bold)
  .thumb_profile     → 72×72px 원형 아바타, hover시 green 보더
  .txt_profile       → 닉네임 (font-mono, 14px)
  .typing-line       → "~$ [타이핑텍스트][커서]"
    .typing-cursor   → 8×15px 사각형, cursor-blink 1s 무한 반복

.area_navi (카테고리)
  .category_list     → Tistory [##_category_list_##] 렌더 결과
  .link_guestbook    → Guestbook 링크
```

---

### 13-4. 콘텐츠 영역 상세

```
.cont_skin                  → background: white; min-height: 100vh
#article-view               → 단독 포스트 본문
  h1~h6                     → 계층별 폰트 크기·보더
  pre code                  → highlight.js 스타일 위에 .code-block-wrapper 래핑
  .code-block-header        → 언어명 + 색상 도트 + Copy 버튼
  blockquote                → 왼쪽 보더 강조
  table                     → 보더 테이블, 홀수행 배경
  img                       → max-width:100%, border-radius

.index_title                → 목록 페이지 헤더
.list_content               → 포스트 카드 목록
  .link_post (카드)         → 썸네일 + 제목 + 요약 + 메타
```

---

### 13-5. 반응형 (Mobile, 768px 이하)

- `.wrap_skin` → `padding-left: 0` (사이드바 오프스크린)
- `.area_head` → 하단 고정 또는 오버레이로 전환
- `.btn_cate` → 표시 (카테고리 토글 햄버거)
- 창들(`.dyo-shell-win` 등) → `width/height: 100vw/100vh` 전체 화면

---

### 13-6. 주요 애니메이션 (@keyframes)

| 이름 | 효과 |
|------|------|
| `cursor-blink` | 터미널 커서 깜빡임 (50% opacity:0) |
| `dyo-pop-in` | 창 열기 (scale + opacity, transform-origin 기준) |
| `dyo-dismiss-out` | 창 닫기 (scale → 0.8 + fade) |
| `dyo-minimize-out` | 창 최소화 (태스크바 버튼 위치로 축소) |
| `dyo-zoom-in` | 최대화 확대 |
| `dyo-zoom-out` | 최대화 복원 |
| `toast-slide-in` | Toast 우측에서 슬라이드 인 |
| `toast-fade-out` | Toast 사라짐 |
| `toast-bar` | Toast 진행 타이머 바 |
