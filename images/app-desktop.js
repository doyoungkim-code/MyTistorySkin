
    // 타이핑 애니메이션
    (function() {
      var el = document.getElementById('typingText');
      if (!el) return;

      var text = 'Do You Coding?';
      var i = 0;
      var deleting = false;
      var typeSpeed = 120;
      var deleteSpeed = 80;
      var pauseAfterType = 2000;
      var pauseAfterDelete = 800;

      function tick() {
        if (!deleting) {
          el.textContent = text.substring(0, i + 1);
          i++;
          if (i === text.length) {
            deleting = true;
            setTimeout(tick, pauseAfterType);
          } else {
            setTimeout(tick, typeSpeed);
          }
        } else {
          i--;
          el.textContent = text.substring(0, i);
          if (i === 0) {
            deleting = false;
            setTimeout(tick, pauseAfterDelete);
          } else {
            setTimeout(tick, deleteSpeed);
          }
        }
      }

      setTimeout(tick, 1000);
    })();

    // ── iframe 내부면 관리자바 + 소스 링크 숨김 ──
    (function() {
      if (window.self !== window.top) {
        var bar = document.querySelector('.dyo-admin-bar');
        if (bar) bar.style.setProperty('display', 'none', 'important');
        // 두 개 모두(.dyo-source-link / .dyo-portfolio-link) 숨김
        document.querySelectorAll('.dyo-source-link').forEach(function(src) {
          src.style.setProperty('display', 'none', 'important');
        });
      }
    })();

    // ── 관리자 로그인 감지 → 관리자 UI(제어판 등) 게이팅 ──
    //   window.dyoIsAdmin(동기 참조) + <html>.dyo-admin(CSS 게이팅) 설정.
    //   주의: /m/api/me 는 "티스토리 로그인 여부"이지 소유자 판별이 아님 —
    //   UX 게이팅일 뿐, 실제 권한은 티스토리 서버(/manage 접근 제어)가 강제함.
    (function() {
      window.dyoIsAdmin = false;
      if (window.self !== window.top) return;             // iframe 내부 스킵
      if (document.body.id !== 'tt-body-index') return;   // 데스크탑(홈)에서만 필요

      var KEY = 'dyo_admin_state';   // sessionStorage 캐시 (브라우저 종료 시 소멸 — 공용 PC 영구 노출 방지)
      function apply(on) {
        window.dyoIsAdmin = !!on;
        document.documentElement.classList.toggle('dyo-admin', !!on);
        try { sessionStorage.setItem(KEY, on ? '1' : '0'); } catch (e) {}
      }
      // 캐시 있으면 즉시 표시(깜빡임 방지) — 아래 fetch 가 백그라운드 재검증으로 회수
      try { if (sessionStorage.getItem(KEY) === '1') apply(true); } catch (e) {}

      function fallbackGuestbook() {
        fetch('/m/api/guestbook?limit=3&reverse=true', { credentials: 'include' })
          .then(function(r) { if (!r.ok) throw new Error(); return r.json(); })
          .then(function(d) {
            var items = (d && (d.items || (d.data && d.data.items))) || [];
            var mine = false;
            items.forEach(function(it) {
              if (it && it.writer && it.writer.isRequestUser) mine = true;
            });
            apply(mine);
          })
          .catch(function() { apply(false); });
      }
      fetch('/m/api/me', { credentials: 'include', headers: { 'X-Requested-With': 'XMLHttpRequest' } })
        .then(function(r) { if (!r.ok) throw new Error(); return r.json(); })
        .then(function(d) {
          var ok = !!(d && (d.data || d.id || d.userId || d.name || d.blogName));
          if (ok) apply(true); else fallbackGuestbook();
        })
        .catch(fallbackGuestbook);
    })();

    // ── 데스크탑 초기화 ──
    (function() {
      if (document.body.id !== 'tt-body-index') return;

      var desktop    = document.getElementById('dyoDesktop');
      var desktopBar = document.getElementById('dyoDesktopBar');
      var dkWrap     = document.getElementById('dkWrap');
      if (!desktop) return;

      // 모드 적용 (Windows / Linux) — html 클래스는 early script가 이미 적용
      // 단, 테마(Astronaut/Sakura)는 Linux 모드에서만 활성화
      var savedMode = localStorage.getItem('dyo_desktop_mode');
      if (savedMode !== 'windows' && savedMode !== 'linux') savedMode = 'windows';

      // 테마 적용 — Linux 모드일 때만
      var savedTheme = localStorage.getItem('dyo_desktop_theme') || 'default';
      if (savedMode === 'linux') {
        if (savedTheme === 'astronaut') desktop.classList.add('theme-astronaut');
        else if (savedTheme === 'sakura') desktop.classList.add('theme-sakura');
      }

      // 모드별 라벨 스왑 — data-label-win / data-label-linux 보존 후 교체
      function applyModeLabels(mode) {
        document.querySelectorAll('[data-label-win]').forEach(function(el) {
          if (!el.hasAttribute('data-label-linux')) {
            el.setAttribute('data-label-linux', el.textContent.trim());
          }
          el.textContent = mode === 'windows'
            ? el.getAttribute('data-label-win')
            : el.getAttribute('data-label-linux');
        });
      }
      applyModeLabels(savedMode);

      // ── 데스크탑 아이콘 SVG를 모드별로 스왑 ──────────────────
      // Windows 모드용 평면 SVG (40x40 viewBox) — 배경 박스 없이 단일 그래픽
      var WIN_DESKTOP_ICONS = {
        desktopIconReadme:
          '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">' +
            '<path d="M9 5h16l6 6v22a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" fill="#ffffff" stroke="#a4c2e6" stroke-width="0.8"/>' +
            '<path d="M25 5v6h6" fill="none" stroke="#a4c2e6" stroke-width="0.8" stroke-linejoin="round"/>' +
            '<line x1="12" y1="16" x2="27" y2="16" stroke="#0078d4" stroke-width="1.6" stroke-linecap="round"/>' +
            '<line x1="12" y1="21" x2="27" y2="21" stroke="#0078d4" stroke-width="1.6" stroke-linecap="round"/>' +
            '<line x1="12" y1="26" x2="22" y2="26" stroke="#0078d4" stroke-width="1.6" stroke-linecap="round"/>' +
          '</svg>',
        desktopIconBlog:
          '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">' +
            '<defs><radialGradient id="edgeG" cx="40%" cy="35%" r="65%">' +
              '<stop offset="0%" stop-color="#3ecbff"/>' +
              '<stop offset="55%" stop-color="#0078d4"/>' +
              '<stop offset="100%" stop-color="#063e7a"/>' +
            '</radialGradient></defs>' +
            '<circle cx="20" cy="20" r="16" fill="url(#edgeG)"/>' +
            '<path d="M11 18c0-5 4-9 9-9 4.5 0 8 3 9 7-1-1-3-2-6-2-4 0-7 3-7 7 0 3 2 5 4 6-5-1-9-5-9-9z" fill="#fff" opacity="0.95"/>' +
            '<path d="M14 28c2 2 5 3 8 3 4 0 7-2 8-5-1 1-3 2-6 2-4 0-7-2-8-5 0 1-1 3-2 5z" fill="#3ecbff" opacity="0.85"/>' +
          '</svg>',
        desktopIconShell:
          '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">' +
            '<rect x="4" y="7" width="32" height="26" rx="2.5" fill="#1e1e1e"/>' +
            '<rect x="4" y="7" width="32" height="5" rx="2.5" fill="#2d2d2d"/>' +
            '<circle cx="8" cy="9.5" r="1" fill="#ff5f56"/>' +
            '<circle cx="11" cy="9.5" r="1" fill="#ffbd2e"/>' +
            '<circle cx="14" cy="9.5" r="1" fill="#27c93f"/>' +
            '<text x="9" y="27" font-family="\'Fira Code\',monospace" font-size="11" font-weight="700" fill="#3fb950">$</text>' +
            '<rect x="17" y="19" width="6" height="8" fill="#abb2bf" opacity="0.8"/>' +
          '</svg>',
        desktopIconExplorer:
          '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">' +
            '<path d="M4 11a2 2 0 0 1 2-2h8l3 3h15a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" fill="#ffd166"/>' +
            '<path d="M4 14h30" stroke="#d99a14" stroke-width="0.6" opacity="0.4"/>' +
            '<path d="M4 11a2 2 0 0 1 2-2h8l3 3h15a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" fill="none" stroke="#d99a14" stroke-width="0.6"/>' +
          '</svg>',
        desktopIconGuest:
          '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">' +
            '<path d="M5 9a2 2 0 0 1 2-2h26a2 2 0 0 1 2 2v18a2 2 0 0 1-2 2H16l-7 6v-6H7a2 2 0 0 1-2-2z" fill="#0078d4"/>' +
            '<circle cx="14" cy="18" r="1.8" fill="#fff"/>' +
            '<circle cx="20" cy="18" r="1.8" fill="#fff"/>' +
            '<circle cx="26" cy="18" r="1.8" fill="#fff"/>' +
          '</svg>',
        desktopIconBoard:
          '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">' +
            '<rect x="5" y="8" width="8" height="24" rx="1.5" fill="#0078d4"/>' +
            '<rect x="16" y="8" width="8" height="17" rx="1.5" fill="#50c0e6"/>' +
            '<rect x="27" y="8" width="8" height="12" rx="1.5" fill="#9bd9f0"/>' +
          '</svg>',
        desktopIconFeatures:
          '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">' +
            '<path d="M4 11a2 2 0 0 1 2-2h8l3 3h15a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" fill="#ffd166" stroke="#d99a14" stroke-width="0.6"/>' +
            '<circle cx="14" cy="22" r="2" fill="#a06a08"/>' +
            '<circle cx="20" cy="22" r="2" fill="#a06a08"/>' +
            '<circle cx="26" cy="22" r="2" fill="#a06a08"/>' +
          '</svg>',
        desktopIconGallery:
          '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">' +
            '<rect x="4" y="8" width="32" height="24" rx="3" fill="#0078d4"/>' +
            '<circle cx="20" cy="21" r="7" fill="none" stroke="#fff" stroke-width="2.4"/>' +
            '<circle cx="29" cy="13" r="1.8" fill="#fff"/>' +
          '</svg>',
        desktopIconMusic:
          '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">' +
            '<path d="M15 28V10l18-3v18" stroke="#0078d4" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>' +
            '<circle cx="11" cy="28" r="4" fill="#0078d4"/>' +
            '<circle cx="29" cy="25" r="4" fill="#0078d4"/>' +
          '</svg>',
        desktopIconAdmin:
          // 기어(설정) — defs 없이 단색 #0078d4 계열 (id 충돌 방지)
          '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">' +
            '<circle cx="20" cy="20" r="6" stroke="#0078d4" stroke-width="2.6"/>' +
            '<circle cx="20" cy="20" r="2" fill="#50c0e6"/>' +
            '<line x1="20" y1="6"    x2="20" y2="10.5" stroke="#0078d4" stroke-width="3" stroke-linecap="round"/>' +
            '<line x1="20" y1="29.5" x2="20" y2="34"   stroke="#0078d4" stroke-width="3" stroke-linecap="round"/>' +
            '<line x1="6"    y1="20" x2="10.5" y2="20" stroke="#0078d4" stroke-width="3" stroke-linecap="round"/>' +
            '<line x1="29.5" y1="20" x2="34"   y2="20" stroke="#0078d4" stroke-width="3" stroke-linecap="round"/>' +
            '<line x1="10.1" y1="10.1" x2="13.3" y2="13.3" stroke="#0078d4" stroke-width="3" stroke-linecap="round"/>' +
            '<line x1="26.7" y1="26.7" x2="29.9" y2="29.9" stroke="#0078d4" stroke-width="3" stroke-linecap="round"/>' +
            '<line x1="29.9" y1="10.1" x2="26.7" y2="13.3" stroke="#0078d4" stroke-width="3" stroke-linecap="round"/>' +
            '<line x1="13.3" y1="26.7" x2="10.1" y2="29.9" stroke="#0078d4" stroke-width="3" stroke-linecap="round"/>' +
          '</svg>'
      };

      // ── 태스크바/시작 메뉴 공용 아이콘 맵 (window-id 키) ─────
      // 데스크탑 아이콘 SVG를 그대로 재사용 → 통일성 확보.
      // Links 는 데스크탑 아이콘이 없어 자체 정의.
      window.WIN_TASKBAR_ICONS = {
        dyoReadmeWin:   WIN_DESKTOP_ICONS.desktopIconReadme,
        dyoBrowserWin:  WIN_DESKTOP_ICONS.desktopIconBlog,
        dyoShellWin:    WIN_DESKTOP_ICONS.desktopIconShell,
        dyoExplorerWin: WIN_DESKTOP_ICONS.desktopIconExplorer,
        dyoGuestWin:    WIN_DESKTOP_ICONS.desktopIconGuest,
        dyoBoardWin:    WIN_DESKTOP_ICONS.desktopIconBoard,
        dyoGalleryWin:  WIN_DESKTOP_ICONS.desktopIconGallery,
        dyoMusicWin:    WIN_DESKTOP_ICONS.desktopIconMusic,
        dyoLinksWin:
          '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">' +
            '<path d="M16 24a7 7 0 0 0 10 0.5l4-4a7 7 0 0 0-9.9-9.9l-2 2" stroke="#0078d4" stroke-width="2.8" stroke-linecap="round" fill="none"/>' +
            '<path d="M24 16a7 7 0 0 0-10-0.5l-4 4a7 7 0 0 0 9.9 9.9l2-2" stroke="#0078d4" stroke-width="2.8" stroke-linecap="round" fill="none"/>' +
          '</svg>',
        dyoAdminWin: WIN_DESKTOP_ICONS.desktopIconAdmin
      };

      function applyModeIcons(mode) {
        Object.keys(WIN_DESKTOP_ICONS).forEach(function(iconId) {
          var iconEl = document.getElementById(iconId);
          if (!iconEl) return;
          var wrap = iconEl.querySelector('.dyo-di-wrap');
          if (!wrap) return;
          // 최초 1회 원본 SVG HTML 저장
          if (!wrap.hasAttribute('data-svg-linux')) {
            wrap.setAttribute('data-svg-linux', wrap.innerHTML);
          }
          wrap.innerHTML = mode === 'windows'
            ? WIN_DESKTOP_ICONS[iconId]
            : wrap.getAttribute('data-svg-linux');
        });
      }
      applyModeIcons(savedMode);

      // 데스크탑 활성화
      desktop.style.display = 'flex';
      desktop.classList.add('show');
      desktopBar.style.display = 'flex';
      desktopBar.classList.add('show');
      dkWrap.style.visibility = 'hidden';
      document.body.style.overflow = 'hidden';
      // 튜토리얼 자동 실행 제거 — 우클릭 컨텍스트 메뉴의 Tutorial 항목으로만 시작

      // ── 인트로 랜딩 → 그림 속 오브젝트 클릭 시 진입/이동 ──
      // 데스크탑은 위처럼 즉시 활성화되지만 랜딩이 그 위를 덮고 있다가,
      // 모니터를 클릭하면 그 지점으로 줌인+페이드아웃되며 준비된 데스크탑이 드러난다.
      //
      // ★ 핫스팟 추가/수정: 아래 배열만 편집하면 됩니다. (좌표는 홈 URL 뒤 ?calib 로 측정)
      //   모양은 3가지 중 택1:
      //   ① 사각형        : left, top, width, height (이미지 기준 %)
      //   ② 회전 사각형   : 위 + rotate: -12  (도 단위, 살짝 기운 물체)
      //   ③ 자유 다각형   : points: [[x,y],[x,y],...]  (비스듬한 책 등 모양대로 — %)
      //   icon/title/desc/hint : 호버 시 하단 정보 패널에 표시 (아이콘·제목·상세설명·동작배지)
      //   action  : 'enter'  → 그 지점으로 줌인 후 데스크탑 / { url, target } → 링크 열기
      var LANDING_HOTSPOTS = [
        // 모니터(화면+받침대 하나로 연결) → 클릭 시 데스크탑 진입. 점은 화면 중앙(markerAt)에.
        { id: 'monitor', markerAt: [48, 34],
          icon: '🖥️', title: 'Desktop', hint: '클릭하여 진입',
          desc: '모니터 화면 속으로 들어가 데스크탑 환경을 실행합니다.\n터미널 · 파일 탐색기 · 보드 · 뮤직 등 앱을 자유롭게 사용해보세요.',
          points: [[23.2, 7.9], [72.8, 7.8], [72.3, 60.5], [50.8, 59.9], [50.8, 63], [57.8, 63.4],
                   [58.5, 70.8], [38.5, 70.5], [39.9, 62.8], [46.5, 63.1], [46.5, 59.9], [23.9, 59.8]],
          action: 'enter' },
        // PORTFOLIO 책 → 포트폴리오 사이트
        { id: 'book',
          icon: '💼', title: 'Do You Coding? : Portfolio', hint: '새 탭에서 열기',
          desc: '개발자 포트폴리오 사이트로 이동합니다.\n진행한 프로젝트와 경력, 기술 스택을 한눈에 확인할 수 있어요.',
          points: [[74.6, 36.5], [76.1, 35.8], [89.3, 38.6], [87.9, 73.4], [86.1, 74.7], [73.9, 69.2]],
          action: { url: 'https://doyoungkim-code.github.io/Portfolio/', target: '_blank' } },
        // 위키(왼쪽 책) → 위키 사이트
        { id: 'wiki',
          icon: '📖', title: 'Do You Coding? : Wiki', hint: '새 탭에서 열기',
          desc: 'doyoucode가 아는 것을, 아는 만큼만 적어두는 개인 위키입니다.\n개발·음악을 비롯해 여러 분야를 조금씩 정리하고 있습니다.',
          points: [[11.7, 63.4], [26.9, 64.3], [27.5, 70.9], [22.2, 92], [21.4, 95.3], [0.8, 93.6], [0.4, 92.1], [0.3, 85.8]],
          action: { url: 'https://dyomyo-wiki.tistory.com/', target: '_blank' } }
        // 예) 커피잔/램프/창밖 등 추가 시 위 형식대로 항목만 늘리면 됩니다.
      ];

      var landing = document.getElementById('dyoLanding');
      var scene   = document.getElementById('dyoLandingScene');
      if (landing && scene) {
        document.documentElement.classList.add('dyo-landing-active');
        var landingDismissed = false;

        // 모니터로 줌인하며 데스크탑 진입
        var enterDesktop = function(originStr) {
          if (landingDismissed) return;
          landingDismissed = true;
          if (originStr) scene.style.setProperty('--enter-origin', originStr);
          landing.classList.add('is-leaving');
          document.documentElement.classList.remove('dyo-landing-active'); // bar/admin 복귀
          setTimeout(function() { landing.remove(); }, 750);               // 줌인 종료 후 제거
          // 진입 1.5초 뒤 개발 블로그 창이 '개발 블로그 아이콘'에서 튀어나오듯 자동 열기
          setTimeout(function() {
            if (!window.dyoOpenBrowser) return;
            var icon = document.getElementById('desktopIconBlog');
            window._dyoAnimSrc = icon || null;   // 팝 애니메이션 기준점 = 아이콘 위치
            window.dyoOpenBrowser('/category');
            // 기본 팝(약함)을 강한 팝으로 교체 — 아이콘 지점에서 작게 시작해 크게 튀어나옴
            var bwin = document.getElementById('dyoBrowserWin');
            if (bwin) {
              bwin.classList.remove('dyo-win-pop');   // 기본 팝 제거(아이콘 origin은 인라인으로 유지됨)
              void bwin.offsetWidth;
              bwin.classList.add('dyo-win-pop-strong');
              bwin.addEventListener('animationend', function() {
                bwin.classList.remove('dyo-win-pop-strong');
                bwin.style.transformOrigin = '';
              }, { once: true });
            }
          }, 1500);
        };

        // 핫스팟 중심(%) — 줌인/마커 기준점.
        //   markerAt: [x,y] 지정 시 그 좌표 사용 / 다각형은 무게중심 / 사각형은 중앙
        function spotCenter(h) {
          if (h.markerAt) return { x: h.markerAt[0], y: h.markerAt[1] };
          if (h.points && h.points.length) {
            var sx = 0, sy = 0;
            h.points.forEach(function(p) { sx += p[0]; sy += p[1]; });
            return { x: sx / h.points.length, y: sy / h.points.length };
          }
          return { x: h.left + h.width / 2, y: h.top + h.height / 2 };
        }

        // 하단 상세 정보 패널 (호버/포커스 시 표시)
        var info = document.createElement('div');
        info.className = 'dyo-ls-info';
        info.innerHTML =
          '<div class="dyo-ls-info-icon"></div>' +
          '<div class="dyo-ls-info-body">' +
            '<div class="dyo-ls-info-head">' +
              '<span class="dyo-ls-info-title"></span>' +
              '<span class="dyo-ls-info-hint"></span>' +
            '</div>' +
            '<div class="dyo-ls-info-desc"></div>' +
          '</div>';
        landing.appendChild(info);
        var infoIcon  = info.querySelector('.dyo-ls-info-icon');
        var infoTitle = info.querySelector('.dyo-ls-info-title');
        var infoHint  = info.querySelector('.dyo-ls-info-hint');
        var infoDesc  = info.querySelector('.dyo-ls-info-desc');
        var infoHideT = null;
        function showInfo(h) {
          if (infoHideT) { clearTimeout(infoHideT); infoHideT = null; }
          infoIcon.textContent  = h.icon  || '';
          infoTitle.textContent = h.title || '';
          infoHint.textContent  = h.hint  || '';
          infoHint.style.display = h.hint ? '' : 'none';
          infoDesc.textContent  = h.desc  || '';
          info.classList.add('show');
        }
        function hideInfo() {
          infoHideT = setTimeout(function() { info.classList.remove('show'); }, 120);
        }

        // 핫스팟 생성
        LANDING_HOTSPOTS.forEach(function(h) {
          var btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'dyo-ls-hot';
          btn.setAttribute('aria-label', h.title || h.id);
          var c = spotCenter(h);
          var markerStyle = '';
          if (h.points && h.points.length >= 3) {
            // 다각형: scene 전체를 덮고 clip-path로 실제 모양만 클릭 영역이 됨
            btn.classList.add('poly');
            btn.style.left = '0'; btn.style.top = '0';
            btn.style.width = '100%'; btn.style.height = '100%';
            btn.style.clipPath = 'polygon(' +
              h.points.map(function(p) { return p[0] + '% ' + p[1] + '%'; }).join(', ') + ')';
            markerStyle = 'left:' + c.x + '%;top:' + c.y + '%;';   // 마커를 무게중심에
          } else {
            btn.style.left = h.left + '%';
            btn.style.top = h.top + '%';
            btn.style.width = h.width + '%';
            btn.style.height = h.height + '%';
            if (h.rotate) {
              btn.style.transform = 'rotate(' + h.rotate + 'deg)';
              // 툴팁은 수평 유지하도록 마커를 역회전
              markerStyle = 'transform:translate(-50%,-50%) rotate(' + (-h.rotate) + 'deg);';
            }
          }
          // noMarker: 점 없이 클릭 영역만 (예: 보조 영역)
          btn.innerHTML = h.noMarker ? '' :
            '<span class="dyo-ls-marker"' + (markerStyle ? ' style="' + markerStyle + '"' : '') + '>' +
              '<span class="dyo-ls-dot"></span>' +
            '</span>';
          // 호버/포커스 → 하단 상세 정보 패널
          if (!h.noMarker) {
            btn.addEventListener('mouseenter', function() { showInfo(h); });
            btn.addEventListener('mouseleave', hideInfo);
            btn.addEventListener('focus',      function() { showInfo(h); });
            btn.addEventListener('blur',        hideInfo);
          }
          btn.addEventListener('click', function() {
            if (h.action === 'enter') {
              enterDesktop(c.x + '% ' + c.y + '%');
            } else if (h.action && h.action.url) {
              if (h.action.target === '_self') location.href = h.action.url;
              else window.open(h.action.url, '_blank', 'noopener');
            }
          });
          scene.appendChild(btn);
        });

        // ── 그림 속 작은 기기에 7-세그먼트 디지털 시계 (HH:MM) ──
        //   위치·크기·기울기·색은 style.css 의 .dyo-ls-clock / .dyo-ls-seg 에서 조정
        var clock = document.createElement('div');
        clock.className = 'dyo-ls-clock';
        scene.appendChild(clock);
        var clockTimer = null;
        (function buildSevenSeg() {
          var NS = 'http://www.w3.org/2000/svg';
          var Wd = 30, Hd = 54, ht = 3.5, m = 2, gp = 1.2;
          var xa = m + ht + gp, xb = Wd - m - ht - gp;   // 가로 세그먼트 x 범위
          var uy1 = m + ht + gp, uy2 = Hd / 2 - gp;      // 위쪽 세로 세그먼트
          var ly1 = Hd / 2 + gp, ly2 = Hd - m - ht - gp; // 아래쪽 세로 세그먼트
          var ca = m + ht, cg = Hd / 2, cd = Hd - m - ht; // a/g/d 중심 y
          var cl = m + ht, cr = Wd - m - ht;              // f·e / b·c 중심 x
          function hseg(cy) { return [[xa,cy],[xa+ht,cy-ht],[xb-ht,cy-ht],[xb,cy],[xb-ht,cy+ht],[xa+ht,cy+ht]]; }
          function vseg(cx,y1,y2) { return [[cx,y1],[cx+ht,y1+ht],[cx+ht,y2-ht],[cx,y2],[cx-ht,y2-ht],[cx-ht,y1+ht]]; }
          var SEG = { a:hseg(ca), b:vseg(cr,uy1,uy2), c:vseg(cr,ly1,ly2), d:hseg(cd), e:vseg(cl,ly1,ly2), f:vseg(cl,uy1,uy2), g:hseg(cg) };
          var MAP = { '0':'abcdef','1':'bc','2':'abged','3':'abgcd','4':'fgbc','5':'afgcd','6':'afgecd','7':'abc','8':'abcdefg','9':'abcdfg' };
          var OFF = [0, 35, 82, 117];   // 4자리 x-오프셋 (가운데에 콜론 공간)
          var colonX = 73.5;
          function poly(shape, ox) {
            var el = document.createElementNS(NS, 'polygon');
            el.setAttribute('points', shape.map(function(p) { return (p[0] + ox) + ',' + p[1]; }).join(' '));
            return el;
          }
          var svg = document.createElementNS(NS, 'svg');
          svg.setAttribute('class', 'dyo-ls-seg');
          svg.setAttribute('viewBox', '-6 -3 160 60');
          svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
          var grp = document.createElementNS(NS, 'g');
          grp.setAttribute('transform', 'skewX(-8)');   // 살짝 이탤릭
          svg.appendChild(grp);
          // 꺼진 세그먼트(고스트) — 모든 자리의 7세그먼트 전체
          var offG = document.createElementNS(NS, 'g'); offG.setAttribute('class', 'seg-off');
          OFF.forEach(function(ox) { 'abcdefg'.split('').forEach(function(s) { offG.appendChild(poly(SEG[s], ox)); }); });
          grp.appendChild(offG);
          // 점등 세그먼트 — 매 갱신마다 재생성
          var onG = document.createElementNS(NS, 'g'); onG.setAttribute('class', 'seg-on');
          grp.appendChild(onG);
          // 콜론(깜빡임)
          var colonG = document.createElementNS(NS, 'g'); colonG.setAttribute('class', 'seg-colon');
          [18, 34].forEach(function(cy) {
            var r = document.createElementNS(NS, 'rect');
            r.setAttribute('x', colonX - 2.6); r.setAttribute('y', cy - 2.6);
            r.setAttribute('width', 5.2); r.setAttribute('height', 5.2); r.setAttribute('rx', 1);
            colonG.appendChild(r);
          });
          grp.appendChild(colonG);
          clock.appendChild(svg);
          function renderOn() {
            if (!clock.isConnected) { if (clockTimer) clearInterval(clockTimer); return; }
            var now = new Date();
            var t = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
            onG.textContent = '';
            for (var i = 0; i < 4; i++) {
              var lit = MAP[t.charAt(i)] || '';
              for (var k = 0; k < lit.length; k++) onG.appendChild(poly(SEG[lit.charAt(k)], OFF[i]));
            }
          }
          renderOn();
          clockTimer = setInterval(renderOn, 1000);
        })();

        // 접근성/편의: Enter 키 → 첫 'enter' 핫스팟으로 진입
        var enterSpot = LANDING_HOTSPOTS.filter(function(h) { return h.action === 'enter'; })[0];
        if (enterSpot) {
          document.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !landingDismissed) {
              var ec = spotCenter(enterSpot);
              enterDesktop(ec.x + '% ' + ec.y + '%');
            }
          });
        }

        // ── 좌표 보정 도구: 홈 URL 뒤에 ?calib 붙이면 활성 ──
        //   사각형 모드: 드래그 → { left, top, width, height }
        //   다각형 모드: 모서리를 순서대로 클릭 → points: [[x,y],...] (비스듬한 물체용)
        //   우클릭 = 다각형 초기화, 버튼으로 모드 전환. 결과는 클립보드 자동 복사.
        if (/[?&]calib/.test(location.search)) {
          landing.classList.add('calib');
          var cal = document.createElement('div');
          cal.className = 'dyo-ls-calib';
          var read = document.createElement('div');
          read.className = 'dyo-ls-calib-read';
          var modeBtn = document.createElement('button');
          modeBtn.className = 'dyo-ls-calib-mode';
          var vx = document.createElement('div'); vx.className = 'dyo-ls-calib-y';
          var hy = document.createElement('div'); hy.className = 'dyo-ls-calib-x';
          var rect = document.createElement('div'); rect.className = 'dyo-ls-calib-rect'; rect.style.display = 'none';
          // 다각형 그리기용 SVG
          var svgNS = 'http://www.w3.org/2000/svg';
          var svg = document.createElementNS(svgNS, 'svg');
          svg.setAttribute('class', 'dyo-ls-calib-svg');
          svg.setAttribute('viewBox', '0 0 100 100');
          svg.setAttribute('preserveAspectRatio', 'none');
          var poly = document.createElementNS(svgNS, 'polygon');
          poly.setAttribute('class', 'dyo-ls-calib-poly');
          svg.appendChild(poly);
          cal.appendChild(vx); cal.appendChild(hy); cal.appendChild(rect); cal.appendChild(svg);
          scene.appendChild(cal);
          landing.appendChild(read);
          landing.appendChild(modeBtn);

          var pct = function(e) {
            var r = scene.getBoundingClientRect();
            return { x: (e.clientX - r.left) / r.width * 100, y: (e.clientY - r.top) / r.height * 100 };
          };
          var round = function(n) { return Math.round(n * 10) / 10; };
          var copy = function(t) { if (navigator.clipboard) navigator.clipboard.writeText(t).catch(function() {}); };
          var mode = 'rect';          // 'rect' | 'poly'
          var dragging = false, sx = 0, sy = 0;
          var pts = [];               // 다각형 점 목록

          function updateModeBtn() {
            modeBtn.textContent = mode === 'rect' ? '■ 사각형 모드 (전환)' : '⬡ 다각형 모드 (전환)';
            rect.style.display = 'none';
            svg.style.display = mode === 'poly' ? 'block' : 'none';
          }
          function renderPoly() {
            poly.setAttribute('points', pts.map(function(p) { return p[0] + ',' + p[1]; }).join(' '));
            if (pts.length) {
              var out = 'points: [' + pts.map(function(p) { return '[' + round(p[0]) + ', ' + round(p[1]) + ']'; }).join(', ') + ']';
              read.textContent = out + '\n(점 ' + pts.length + '개 · 클립보드 복사됨 · 우클릭=초기화)';
              copy(out);
            } else {
              read.textContent = '다각형: 모서리를 순서대로 클릭\n우클릭 = 초기화';
            }
          }
          modeBtn.addEventListener('click', function() {
            mode = mode === 'rect' ? 'poly' : 'rect';
            pts = []; renderPoly(); updateModeBtn();
            read.textContent = mode === 'rect' ? '사각형: 드래그해서 영역 지정' : '다각형: 모서리를 순서대로 클릭';
          });

          cal.addEventListener('mousemove', function(e) {
            var p = pct(e);
            vx.style.left = (e.clientX - scene.getBoundingClientRect().left) + 'px';
            hy.style.top = (e.clientY - scene.getBoundingClientRect().top) + 'px';
            if (mode === 'rect' && dragging) {
              var l = Math.min(sx, p.x), t = Math.min(sy, p.y);
              var w = Math.abs(p.x - sx), h = Math.abs(p.y - sy);
              rect.style.left = l + '%'; rect.style.top = t + '%';
              rect.style.width = w + '%'; rect.style.height = h + '%';
              read.textContent = 'left: ' + round(l) + ', top: ' + round(t) + ', width: ' + round(w) + ', height: ' + round(h);
            } else if (mode === 'rect') {
              read.textContent = 'x: ' + round(p.x) + '%   y: ' + round(p.y) + '%\n사각형: 드래그 / 다각형: 버튼 전환';
            }
          });
          cal.addEventListener('mousedown', function(e) {
            if (mode !== 'rect' || e.button !== 0) return;
            var p = pct(e); sx = p.x; sy = p.y; dragging = true;
            rect.style.display = 'block';
            rect.style.left = sx + '%'; rect.style.top = sy + '%'; rect.style.width = '0%'; rect.style.height = '0%';
          });
          cal.addEventListener('mouseup', function(e) {
            if (mode !== 'rect' || !dragging) return;
            dragging = false;
            var p = pct(e);
            var l = round(Math.min(sx, p.x)), t = round(Math.min(sy, p.y));
            var w = round(Math.abs(p.x - sx)), h = round(Math.abs(p.y - sy));
            var out = '{ left: ' + l + ', top: ' + t + ', width: ' + w + ', height: ' + h + ' }';
            read.textContent = out + '\n(클립보드 복사됨)';
            copy(out);
          });
          cal.addEventListener('click', function(e) {
            if (mode !== 'poly') return;
            var p = pct(e);
            pts.push([round(p.x), round(p.y)]);
            renderPoly();
          });
          cal.addEventListener('contextmenu', function(e) {
            if (mode !== 'poly') return;
            e.preventDefault();
            pts = []; renderPoly();
          });
          updateModeBtn();
          read.textContent = '사각형: 드래그해서 영역 지정';
        }
      }

      // 관리자바 모드 토글 버튼 → Windows ↔ Linux 전환
      var modeBtn = document.getElementById('btnModeToggle');
      if (modeBtn) {
        modeBtn.addEventListener('click', function() {
          var cur = localStorage.getItem('dyo_desktop_mode');
          if (cur !== 'windows' && cur !== 'linux') cur = 'windows';
          var next = cur === 'windows' ? 'linux' : 'windows';

          // html 클래스 갱신
          document.documentElement.classList.remove('dyo-mode-windows', 'dyo-mode-linux');
          document.documentElement.classList.add('dyo-mode-' + next);

          // Windows → 장식 테마 클래스 제거 (테마 저장값은 보존)
          if (next === 'windows') {
            desktop.classList.remove('theme-astronaut', 'theme-sakura');
          } else {
            // Linux → 저장된 테마 복원
            var t = localStorage.getItem('dyo_desktop_theme') || 'default';
            desktop.classList.remove('theme-astronaut', 'theme-sakura');
            if (t === 'astronaut') desktop.classList.add('theme-astronaut');
            else if (t === 'sakura') desktop.classList.add('theme-sakura');
          }

          // 모드별 라벨 갱신 (데스크탑 아이콘 + Win 태스크바 툴팁)
          applyModeLabels(next);
          // 모드별 데스크탑 아이콘 SVG 스왑
          applyModeIcons(next);
          // 시작 메뉴가 열려있으면 닫기
          var sm = document.getElementById('dyoWinStartMenu');
          if (sm) sm.classList.remove('open');

          localStorage.setItem('dyo_desktop_mode', next);
          if (window.dyoToast) {
            window.dyoToast((next === 'windows' ? 'Windows' : 'Linux') + ' 모드로 전환', 'success', 1800);
          }
        });
      }

      // ── 별빛 생성 ──
      (function generateStars() {
        var layer = document.getElementById('dyoStarLayer');
        if (!layer) return;
        var frag = document.createDocumentFragment();
        var sizes = ['xs', 'xs', 'xs', 'sm', 'sm', 'md', 'lg'];
        var colors = ['', '', '', '', '', 'cool', 'warm', 'blue'];

        // 점 별 150개
        for (var i = 0; i < 150; i++) {
          var star = document.createElement('div');
          var size = sizes[Math.floor(Math.random() * sizes.length)];
          var color = colors[Math.floor(Math.random() * colors.length)];
          star.className = 'dyo-star ' + size + (color ? ' ' + color : '');
          star.style.left = (Math.random() * 100) + '%';
          star.style.top = (Math.random() * 100) + '%';
          star.style.setProperty('--dur', (2 + Math.random() * 5) + 's');
          star.style.setProperty('--delay', (Math.random() * 6) + 's');
          frag.appendChild(star);
        }
        layer.appendChild(frag);

        // 유성 — 동시에 여러 개, 짧은 간격
        function spawnShootingStar() {
          var el = document.createElement('div');
          el.className = 'dyo-shooting-star';
          el.style.top = (Math.random() * 45) + '%';
          el.style.left = (Math.random() * 70) + '%';
          var len = 80 + Math.random() * 120;
          var speed = 0.6 + Math.random() * 0.8;
          var dx = 200 + Math.random() * 300;
          var dy = 120 + Math.random() * 200;
          var angle = 20 + Math.random() * 30;
          el.style.setProperty('--len', len + 'px');
          el.style.setProperty('--speed', speed + 's');
          el.style.setProperty('--dx', dx + 'px');
          el.style.setProperty('--dy', dy + 'px');
          el.style.setProperty('--angle', angle + 'deg');
          layer.appendChild(el);
          el.addEventListener('animationend', function() { el.remove(); });
        }

        // 4~5초에 1개씩 생성 (레이어 숨김 상태면 건너뜀)
        function scheduleShootingStars() {
          if (layer.offsetParent !== null) spawnShootingStar();
          setTimeout(scheduleShootingStars, 4000 + Math.random() * 1000);
        }
        setTimeout(scheduleShootingStars, 3000);
      })();

      // ── 우주인 드래그 & 달 중력 낙하 ──
      (function() {
        var astroLayer = document.querySelector('.dyo-astronaut-layer');
        var desktop = document.getElementById('dyoDesktop');
        if (!astroLayer || !desktop) return;

        var GRAVITY = 0.04;
        var WALK_SPEED = 0.8;
        var dragged = null; // 현재 드래그 중인 우주인 상태

        // 각 우주인에 고유 상태 부여
        astroLayer.querySelectorAll('.dyo-astronaut').forEach(function(el, i) {
          el._astro = { phase: 'css', raf: null, idx: i };
        });

        function getGroundY() {
          var dr = desktop.getBoundingClientRect();
          var lr = astroLayer.getBoundingClientRect();
          return lr.bottom - dr.top - 48; // 48 = astronaut height
        }

        // 위치 캡처 (CSS 애니메이션 중이어도 실제 화면 위치)
        function grab(el) {
          var dr = desktop.getBoundingClientRect();
          var er = el.getBoundingClientRect();
          return { x: er.left - dr.left, y: er.top - dr.top };
        }

        // ── pointerdown: 잡기 ──
        document.addEventListener('pointerdown', function(e) {
          var el = e.target.closest('.dyo-astronaut');
          if (!el || !el._astro) return;
          e.preventDefault();

          var a = el._astro;
          if (a.raf) { cancelAnimationFrame(a.raf); a.raf = null; }

          var pos = grab(el);

          a.phase = 'dragging';
          el.classList.add('dyo-dragging');
          el.classList.remove('dyo-falling', 'dyo-walking');
          desktop.appendChild(el);
          el.style.cssText = 'position:absolute;left:'+pos.x+'px;top:'+pos.y+'px;width:32px;height:48px;z-index:9999;pointer-events:auto;cursor:grabbing;';

          var dr = desktop.getBoundingClientRect();
          dragged = {
            el: el,
            offX: e.clientX - dr.left - pos.x,
            offY: e.clientY - dr.top - pos.y,
            // 속도 추적용
            prevX: e.clientX,
            prevY: e.clientY,
            prevT: performance.now(),
            velX: 0,
            velY: 0
          };

          el.setPointerCapture(e.pointerId);
        });

        // ── pointermove: 드래그 + 속도 추적 ──
        document.addEventListener('pointermove', function(e) {
          if (!dragged) return;
          e.preventDefault();
          var dr = desktop.getBoundingClientRect();
          var newX = e.clientX - dr.left - dragged.offX;
          var newY = e.clientY - dr.top - dragged.offY;
          dragged.el.style.left = newX + 'px';
          dragged.el.style.top = newY + 'px';

          // 속도 계산 (최근 이동 기반)
          var now = performance.now();
          var dt = now - dragged.prevT;
          if (dt > 0) {
            // 이전 속도와 블렌딩 (부드러운 속도 추적)
            var vx = (e.clientX - dragged.prevX) / dt * 16; // px/frame 단위로 변환
            var vy = (e.clientY - dragged.prevY) / dt * 16;
            dragged.velX = dragged.velX * 0.5 + vx * 0.5;
            dragged.velY = dragged.velY * 0.5 + vy * 0.5;
          }
          dragged.prevX = e.clientX;
          dragged.prevY = e.clientY;
          dragged.prevT = now;
        });

        // ── pointerup: 놓기 → 던지기/낙하 ──
        document.addEventListener('pointerup', function(e) {
          if (!dragged) return;
          var el = dragged.el;
          var MAX_V = 5;
          var throwVX = Math.max(-MAX_V, Math.min(MAX_V, dragged.velX * 0.3));
          var throwVY = Math.max(-MAX_V, Math.min(MAX_V, dragged.velY * 0.3));
          dragged = null;
          try { el.releasePointerCapture(e.pointerId); } catch(ex) {}

          var curX = parseFloat(el.style.left) || 0;
          var curY = parseFloat(el.style.top) || 0;
          var groundY = getGroundY();

          // 속도가 있으면 던지기, 없으면 그냥 낙하
          startThrow(el, curX, curY, throwVX, throwVY, groundY);
        });

        // ── 던지기 + 달 중력 낙하 ──
        function startThrow(el, posX, posY, velX, velY, groundY) {
          var a = el._astro;
          a.phase = 'falling';
          el.classList.add('dyo-falling');
          el.classList.remove('dyo-dragging');
          el.style.cursor = 'default';

          var bounces = 0;
          var dw = desktop.offsetWidth;
          // 공기저항 (감속)
          var friction = 0.99;

          function step() {
            if (a.phase !== 'falling') return;

            // 중력 적용 (Y)
            velY += GRAVITY;
            // 마찰 적용 (X) — 달엔 공기가 없지만 느낌상
            velX *= friction;

            posX += velX;
            posY += velY;

            // 바닥 충돌
            if (posY >= groundY) {
              posY = groundY;
              bounces++;
              if (bounces < 3 && (Math.abs(velY) > 1.5 || Math.abs(velX) > 1)) {
                velY = -velY * 0.3;
                velX *= 0.6;
              } else {
                el.style.left = posX + 'px';
                el.style.top = groundY + 'px';
                startWalk(el);
                return;
              }
            }

            // 좌우 벽 반사 (화면 안에 유지)
            if (posX < -20) { posX = -20; velX = Math.abs(velX) * 0.5; }
            if (posX > dw - 12) { posX = dw - 12; velX = -Math.abs(velX) * 0.5; }

            el.style.left = posX + 'px';
            el.style.top = posY + 'px';
            a.raf = requestAnimationFrame(step);
          }
          a.raf = requestAnimationFrame(step);
        }

        // ── 착지 후 걸어서 퇴장 ──
        function startWalk(el) {
          var a = el._astro;
          a.phase = 'walking';
          el.classList.remove('dyo-dragging', 'dyo-falling');
          el.classList.add('dyo-walking');

          var posX = parseFloat(el.style.left) || 0;
          var groundY = getGroundY();
          var dw = desktop.offsetWidth;
          var dir = (posX < dw / 2) ? 1 : -1;
          var t = 0;
          var flip = dir === 1 ? 'scaleX(1)' : 'scaleX(-1)';

          el.style.top = groundY + 'px';
          el.style.cursor = 'grab';
          el.style.transform = flip;

          function step() {
            if (a.phase !== 'walking') return;
            t++;
            posX += WALK_SPEED * dir;
            var bounce = Math.abs(Math.sin(t * 0.08)) * 10;
            el.style.left = posX + 'px';
            el.style.top = (groundY - bounce) + 'px';

            if (posX > dw + 60 || posX < -60) {
              a.phase = 'css';
              a.raf = null;
              el.style.cssText = '';
              el.classList.remove('dyo-dragging', 'dyo-falling', 'dyo-walking');
              astroLayer.appendChild(el);
              return;
            }
            a.raf = requestAnimationFrame(step);
          }
          a.raf = requestAnimationFrame(step);
        }
      })();

      // ── 우주인 말풍선 ──
      (function() {
        var QUOTES = [
          '여기 와이파이 되나요?',
          '지구 가고싶다...',
          '점심 추천 좀..',
          '여긴 배달이 안돼...',
          '퇴근하고 싶다',
          '아 커피 마시고싶어',
          '여기 편의점 없나..',
          '오늘 지구 날씨 어때?',
          '월급이 밀리고 있어..',
          '충전기 안가져왔다',
          '집 보일러 껐나..',
          '내일도 출근이네..',
          '심심하다...',
          '카톡 왜 안오지',
          '아 졸려..'
        ];

        var astros = document.querySelectorAll('.dyo-astronaut');
        if (!astros.length) return;

        function showBubble() {
          // css 상태 우주인만 대상
          var candidates = [];
          astros.forEach(function(el) {
            if (el._astro && el._astro.phase === 'css' && !el._bubble) {
              candidates.push(el);
            }
          });
          if (!candidates.length) return;

          var el = candidates[Math.floor(Math.random() * candidates.length)];
          var msg = QUOTES[Math.floor(Math.random() * QUOTES.length)];

          var bubble = document.createElement('div');
          bubble.className = 'dyo-astro-bubble';
          bubble.textContent = msg;
          el.appendChild(bubble);
          el._bubble = true;

          // 방향 추적 (말풍선 살아있는 동안 매 프레임 체크)
          var flipRaf;
          function trackFlip() {
            if (!bubble.parentNode) return;
            var matrix = window.getComputedStyle(el).transform;
            var flip = '1';
            if (matrix && matrix !== 'none') {
              var m = matrix.match(/matrix\(([^)]+)\)/);
              if (m && parseFloat(m[1].split(',')[0]) < 0) flip = '-1';
            }
            bubble.style.setProperty('--bubble-flip', flip);
            flipRaf = requestAnimationFrame(trackFlip);
          }
          flipRaf = requestAnimationFrame(trackFlip);

          // 3초 후 제거
          setTimeout(function() {
            bubble.classList.add('dyo-astro-bubble-out');
            setTimeout(function() {
              cancelAnimationFrame(flipRaf);
              if (bubble.parentNode) bubble.remove();
              el._bubble = false;
            }, 400);
          }, 3000);
        }

        // 3~6초 간격으로 랜덤 출현
        function schedule() {
          var delay = 3000 + Math.random() * 3000;
          setTimeout(function() {
            showBubble();
            schedule();
          }, delay);
        }
        // 첫 등장은 2초 후
        setTimeout(function() {
          showBubble();
          schedule();
        }, 2000);
      })();

      // ══════ 벚꽃 테마 JS ══════

      // ── 꽃잎 생성 ──
      (function() {
        var petalLayer = document.getElementById('dyoPetalLayer');
        if (!petalLayer) return;

        var PETAL_COUNT = 70;
        var colors = ['#ffb7c5','#ffc4d1','#ffd0dc','#ffe0e8','#fff0f3','#ffa6b8'];
        var frag = document.createDocumentFragment();

        for (var i = 0; i < PETAL_COUNT; i++) {
          var p = document.createElement('div');
          p.className = 'dyo-sakura-petal';
          var size = 5 + Math.random() * 9;
          p.style.width = size + 'px';
          p.style.height = size + 'px';
          p.style.left = (Math.random() * 110 - 5) + '%';
          p.style.top = -(Math.random() * 15) + '%';
          p.style.background = colors[Math.floor(Math.random() * colors.length)];
          p.style.setProperty('--dur', (7 + Math.random() * 10) + 's');
          p.style.setProperty('--delay', (Math.random() * 12) + 's');
          p.style.setProperty('--opa', (0.5 + Math.random() * 0.4).toFixed(2));
          p.style.setProperty('--dx1', (Math.random() * 80 - 40) + 'px');
          p.style.setProperty('--dx2', (Math.random() * 140 - 70) + 'px');
          p.style.setProperty('--rot', (270 + Math.random() * 180) + 'deg');
          frag.appendChild(p);
        }
        petalLayer.appendChild(frag);

        // ── 나비 (최대 6마리) ──
        var wingColors = ['#ff9ecd','#ffb347','#87ceeb','#dda0dd','#f0e68c'];
        var maxButterflies = 6;
        function spawnButterfly() {
          if (petalLayer.offsetParent === null) return;
          var current = petalLayer.querySelectorAll('.dyo-sakura-butterfly').length;
          if (current >= maxButterflies) return;
          var b = document.createElement('div');
          b.className = 'dyo-sakura-butterfly';
          var startLeft = Math.random() * 80;
          var startTop = 20 + Math.random() * 40;
          b.style.left = startLeft + '%';
          b.style.top = startTop + '%';
          var speed = 6 + Math.random() * 6;
          var bx = (Math.random() > 0.5 ? 1 : -1) * (200 + Math.random() * 400);
          var by = -(80 + Math.random() * 200);
          b.style.setProperty('--speed', speed + 's');
          b.style.setProperty('--bx', bx + 'px');
          b.style.setProperty('--by', by + 'px');
          b.style.setProperty('--wing', wingColors[Math.floor(Math.random() * wingColors.length)]);
          petalLayer.appendChild(b);
          b.addEventListener('animationend', function() { b.remove(); });
        }
        function scheduleButterfly() {
          spawnButterfly();
          setTimeout(scheduleButterfly, 6000 + Math.random() * 4000);
        }
        setTimeout(scheduleButterfly, 4000);
      })();

      // ── 고양이 드래그 & 중력 낙하 ──
      (function() {
        var catLayer = document.querySelector('.dyo-sakura-cat-layer');
        var desktop = document.getElementById('dyoDesktop');
        if (!catLayer || !desktop) return;

        var GRAVITY = 0.06;
        var WALK_SPEED = 0.9;
        var dragged = null;

        catLayer.querySelectorAll('.dyo-sakura-cat').forEach(function(el, i) {
          el._scat = { phase: 'css', raf: null, idx: i };
        });

        function getGroundY() {
          var ground = document.querySelector('.dyo-sakura-ground');
          if (ground) {
            var dr = desktop.getBoundingClientRect();
            var gr = ground.getBoundingClientRect();
            return gr.top - dr.top + (gr.height * 0.70) - 36;
          }
          return desktop.offsetHeight * 0.86;
        }

        function grab(el) {
          var dr = desktop.getBoundingClientRect();
          var er = el.getBoundingClientRect();
          return { x: er.left - dr.left, y: er.top - dr.top };
        }

        function setCatInline(el, left, top, extra) {
          el.style.cssText = 'position:absolute;left:'+left+'px;top:'+top+'px;width:32px;height:36px;z-index:9999;pointer-events:auto;animation:none !important;' + (extra || '');
        }

        document.addEventListener('pointerdown', function(e) {
          var el = e.target.closest('.dyo-sakura-cat');
          if (!el || !el._scat) return;
          e.preventDefault();
          var a = el._scat;
          if (a.raf) { cancelAnimationFrame(a.raf); a.raf = null; }
          var pos = grab(el);
          a.phase = 'dragging';
          el.classList.add('dyo-dragging');
          el.classList.remove('dyo-falling', 'dyo-walking');
          desktop.appendChild(el);
          setCatInline(el, pos.x, pos.y, 'cursor:grabbing;');
          var dr = desktop.getBoundingClientRect();
          dragged = { el: el, offX: e.clientX - dr.left - pos.x, offY: e.clientY - dr.top - pos.y, prevX: e.clientX, prevY: e.clientY, prevT: performance.now(), velX: 0, velY: 0 };
          el.setPointerCapture(e.pointerId);
        });

        document.addEventListener('pointermove', function(e) {
          if (!dragged) return;
          e.preventDefault();
          var dr = desktop.getBoundingClientRect();
          var nx = e.clientX - dr.left - dragged.offX;
          var ny = e.clientY - dr.top - dragged.offY;
          dragged.el.style.left = nx + 'px';
          dragged.el.style.top = ny + 'px';
          var now = performance.now();
          var dt = now - dragged.prevT;
          if (dt > 0) {
            var vx = (e.clientX - dragged.prevX) / dt * 16;
            var vy = (e.clientY - dragged.prevY) / dt * 16;
            dragged.velX = dragged.velX * 0.5 + vx * 0.5;
            dragged.velY = dragged.velY * 0.5 + vy * 0.5;
          }
          dragged.prevX = e.clientX;
          dragged.prevY = e.clientY;
          dragged.prevT = now;
        });

        document.addEventListener('pointerup', function(e) {
          if (!dragged) return;
          var el = dragged.el;
          var MAX_V = 5;
          var tvx = Math.max(-MAX_V, Math.min(MAX_V, dragged.velX * 0.3));
          var tvy = Math.max(-MAX_V, Math.min(MAX_V, dragged.velY * 0.3));
          dragged = null;
          try { el.releasePointerCapture(e.pointerId); } catch(ex) {}
          startThrow(el, parseFloat(el.style.left) || 0, parseFloat(el.style.top) || 0, tvx, tvy, getGroundY());
        });

        function startThrow(el, posX, posY, velX, velY, groundY) {
          var a = el._scat;
          a.phase = 'falling';
          el.classList.add('dyo-falling');
          el.classList.remove('dyo-dragging');
          setCatInline(el, posX, posY, 'cursor:default;');
          var bounces = 0;
          var dw = desktop.offsetWidth;
          function step() {
            if (a.phase !== 'falling') return;
            velY += GRAVITY;
            velX *= 0.99;
            posX += velX;
            posY += velY;
            if (posY >= groundY) {
              posY = groundY;
              bounces++;
              if (bounces < 3 && (Math.abs(velY) > 1.5 || Math.abs(velX) > 1)) { velY = -velY * 0.3; velX *= 0.6; }
              else { el.style.left = posX + 'px'; el.style.top = groundY + 'px'; startWalk(el); return; }
            }
            if (posX < -20) { posX = -20; velX = Math.abs(velX) * 0.5; }
            if (posX > dw - 12) { posX = dw - 12; velX = -Math.abs(velX) * 0.5; }
            el.style.left = posX + 'px';
            el.style.top = posY + 'px';
            a.raf = requestAnimationFrame(step);
          }
          a.raf = requestAnimationFrame(step);
        }

        function startWalk(el) {
          var a = el._scat;
          a.phase = 'walking';
          el.classList.remove('dyo-dragging', 'dyo-falling');
          el.classList.add('dyo-walking');
          var posX = parseFloat(el.style.left) || 0;
          var groundY = getGroundY();
          var dw = desktop.offsetWidth;
          var dir = (posX < dw / 2) ? 1 : -1;
          var t = 0;
          var flip = dir === 1 ? 'scaleX(1)' : 'scaleX(-1)';
          el.style.top = groundY + 'px';
          el.style.cursor = 'grab';
          el.style.transform = flip;
          function step() {
            if (a.phase !== 'walking') return;
            t++;
            posX += WALK_SPEED * dir;
            var bounce = Math.abs(Math.sin(t * 0.1)) * 6;
            el.style.left = posX + 'px';
            el.style.top = (groundY - bounce) + 'px';
            if (posX > dw + 60 || posX < -60) {
              a.phase = 'css';
              a.raf = null;
              el.style.cssText = '';
              el.classList.remove('dyo-dragging', 'dyo-falling', 'dyo-walking');
              catLayer.appendChild(el);
              return;
            }
            a.raf = requestAnimationFrame(step);
          }
          a.raf = requestAnimationFrame(step);
        }
      })();

      // ── 고양이 말풍선 ──
      (function() {
        var CAT_QUOTES = [
          '냥~',
          '꽃잎이다 냥!',
          '졸려...',
          '참치 줘...',
          '여기 따뜻하다 냥',
          '나비다!',
          '간식 시간 아냥?',
          '쓰다듬어 줘...',
          '벚꽃 구경 중이다냥',
          '꿀잠 자고싶다...',
          '개 어디갔냥',
          '집사 보고싶다...',
          '캣닢 냄새 난다...',
          '높은 데 올라가고 싶다냥',
          '가르릉...'
        ];
        var cats = document.querySelectorAll('.dyo-sakura-cat');
        if (!cats.length) return;

        function showBubble() {
          var candidates = [];
          cats.forEach(function(el) {
            if (el._scat && el._scat.phase === 'css' && !el._bubble) candidates.push(el);
          });
          if (!candidates.length) return;
          var el = candidates[Math.floor(Math.random() * candidates.length)];
          var msg = CAT_QUOTES[Math.floor(Math.random() * CAT_QUOTES.length)];
          var bubble = document.createElement('div');
          bubble.className = 'dyo-scat-bubble';
          bubble.textContent = msg;
          el.appendChild(bubble);
          el._bubble = true;
          var flipRaf;
          function trackFlip() {
            if (!bubble.parentNode) return;
            var matrix = window.getComputedStyle(el).transform;
            var flip = '1';
            if (matrix && matrix !== 'none') {
              var m = matrix.match(/matrix\(([^)]+)\)/);
              if (m && parseFloat(m[1].split(',')[0]) < 0) flip = '-1';
            }
            bubble.style.setProperty('--bubble-flip', flip);
            flipRaf = requestAnimationFrame(trackFlip);
          }
          flipRaf = requestAnimationFrame(trackFlip);
          setTimeout(function() {
            bubble.classList.add('dyo-scat-bubble-out');
            setTimeout(function() {
              cancelAnimationFrame(flipRaf);
              if (bubble.parentNode) bubble.remove();
              el._bubble = false;
            }, 300);
          }, 3000);
        }
        function schedule() {
          setTimeout(function() { showBubble(); schedule(); }, 4000 + Math.random() * 4000);
        }
        setTimeout(function() { showBubble(); schedule(); }, 3000);
      })();

      // ══════ /벚꽃 테마 JS ══════

      // ── 이스터에그: 태극기 20번 클릭 → 외계인 침공 ──
      (function() {
        var flag = document.querySelector('.dyo-moon-flag');
        if (!flag) return;
        var clickCount = 0;
        var invaded = false;
        flag.style.cursor = 'pointer';
        flag.style.pointerEvents = 'auto';

        flag.addEventListener('click', function() {
          if (invaded) return;
          clickCount++;
          // 깃발 흔들기 피드백
          flag.style.transform = 'rotate(' + (clickCount % 2 ? 3 : -3) + 'deg)';
          setTimeout(function() { flag.style.transform = ''; }, 150);

          if (clickCount >= 10) {
            invaded = true;
            startInvasion();
          }
        });

        function makeAlienSvg() {
          return '<svg viewBox="0 0 28 38" fill="none" xmlns="http://www.w3.org/2000/svg">' +
            '<!-- 머리 -->' +
            '<ellipse cx="14" cy="10" rx="10" ry="9" fill="#4a7a3a"/>' +
            '<ellipse cx="14" cy="10" rx="9" ry="8" fill="#5a9a4a"/>' +
            '<!-- 눈 (큰 검은 아몬드) -->' +
            '<ellipse cx="9" cy="9" rx="4" ry="3" fill="#111" transform="rotate(-10 9 9)"/>' +
            '<ellipse cx="19" cy="9" rx="4" ry="3" fill="#111" transform="rotate(10 19 9)"/>' +
            '<ellipse cx="8.5" cy="8.5" rx="1.5" ry="1" fill="rgba(100,255,100,0.4)"/>' +
            '<ellipse cx="18.5" cy="8.5" rx="1.5" ry="1" fill="rgba(100,255,100,0.4)"/>' +
            '<!-- 몸 -->' +
            '<rect x="9" y="18" width="10" height="10" rx="3" fill="#5a9a4a"/>' +
            '<!-- 팔 -->' +
            '<path d="M9,20 Q4,24 3,28" stroke="#4a8a3a" stroke-width="2" stroke-linecap="round" fill="none"/>' +
            '<path d="M19,20 Q24,24 25,28" stroke="#4a8a3a" stroke-width="2" stroke-linecap="round" fill="none"/>' +
            '<circle cx="3" cy="28.5" r="1.5" fill="#4a8a3a"/>' +
            '<circle cx="25" cy="28.5" r="1.5" fill="#4a8a3a"/>' +
            '<!-- 다리 -->' +
            '<path d="M11,28 L10,35" stroke="#4a8a3a" stroke-width="2" stroke-linecap="round"/>' +
            '<path d="M17,28 L18,35" stroke="#4a8a3a" stroke-width="2" stroke-linecap="round"/>' +
            '<ellipse cx="9.5" cy="36" rx="2.5" ry="1.2" fill="#3a7a2a"/>' +
            '<ellipse cx="18.5" cy="36" rx="2.5" ry="1.2" fill="#3a7a2a"/>' +
          '</svg>';
        }

        function makeUfoSvg() {
          return '<svg viewBox="0 0 120 70" fill="none" xmlns="http://www.w3.org/2000/svg">' +
            '<ellipse cx="60" cy="48" rx="50" ry="12" fill="#5a5a6a" stroke="#7a7a8a" stroke-width="1"/>' +
            '<ellipse cx="60" cy="46" rx="42" ry="8" fill="#6a6a7a"/>' +
            '<circle cx="35" cy="48" r="3" fill="#0f0" opacity="0.8"><animate attributeName="opacity" values="0.8;0.3;0.8" dur="0.6s" repeatCount="indefinite"/></circle>' +
            '<circle cx="50" cy="50" r="3" fill="#0f0" opacity="0.6"><animate attributeName="opacity" values="0.6;0.2;0.6" dur="0.5s" repeatCount="indefinite"/></circle>' +
            '<circle cx="70" cy="50" r="3" fill="#0f0" opacity="0.8"><animate attributeName="opacity" values="0.8;0.3;0.8" dur="0.7s" repeatCount="indefinite"/></circle>' +
            '<circle cx="85" cy="48" r="3" fill="#0f0" opacity="0.6"><animate attributeName="opacity" values="0.6;0.2;0.6" dur="0.55s" repeatCount="indefinite"/></circle>' +
            '<path d="M35,42 Q60,10 85,42" fill="#8888aa" stroke="#9999bb" stroke-width="0.8"/>' +
            '<ellipse cx="60" cy="28" rx="12" ry="10" fill="#aaaacc" opacity="0.3"/>' +
          '</svg>';
        }

        function startInvasion() {
          var desktop = document.getElementById('dyoDesktop');
          if (!desktop) return;
          var aliens = [];
          var alienKills = 0;
          var standoffActive = false;
          var defeated = false;
          var astroLayer = document.querySelector('.dyo-astronaut-layer');
          var dw = desktop.offsetWidth;
          var baseX = dw * 0.65;
          var timers = []; // 취소 가능한 타이머들

          function grab(el) {
            var dr = desktop.getBoundingClientRect();
            var er = el.getBoundingClientRect();
            return { x: er.left - dr.left, y: er.top - dr.top };
          }

          function later(fn, ms) {
            var t = setTimeout(fn, ms);
            timers.push(t);
            return t;
          }

          function resetAll() {
            timers.forEach(clearTimeout);
            if (overlay && overlay.parentNode) overlay.remove();
            if (txt && txt.parentNode) txt.remove();
            var astros = document.querySelectorAll('.dyo-astronaut');
            astros.forEach(function(el) {
              el.classList.remove('dyo-panic', 'dyo-panic-run-l', 'dyo-panic-run-r', 'dyo-celebrate');
              el.style.cssText = '';
              if (el._astro) { el._astro.phase = 'css'; el._astro.raf = null; }
              if (astroLayer && el.parentNode !== astroLayer) astroLayer.appendChild(el);
            });
            invaded = false;
            clickCount = 0;
          }

          // ── 0s: 화면 깜빡임 + 경고 텍스트 ──
          var flash = document.createElement('div');
          flash.className = 'dyo-invasion-flash';
          desktop.appendChild(flash);
          later(function() { flash.remove(); }, 1000);

          var txt = document.createElement('div');
          txt.className = 'dyo-invasion-text';
          txt.textContent = '⚠ ALIEN INVASION ⚠';
          desktop.appendChild(txt);

          var overlay = document.createElement('div');
          overlay.className = 'dyo-invasion-overlay';
          desktop.appendChild(overlay);

          // ── 0.3~0.9s: UFO 3대 왼쪽에 등장 ──
          var ufoData = [
            { left: '10%', y: '10%', delay: 300, alienLeft: '12%' },
            { left: '22%', y: '6%',  delay: 600, alienLeft: '24%' },
            { left: '34%', y: '12%', delay: 900, alienLeft: '36%' }
          ];

          ufoData.forEach(function(d) {
            later(function() {
              var ufo = document.createElement('div');
              ufo.className = 'dyo-ufo dyo-ufo-enter';
              ufo.style.left = d.left;
              ufo.style.setProperty('--ufo-y', d.y);
              ufo.innerHTML = makeUfoSvg() + '<div class="dyo-ufo-beam-ray"></div>';
              overlay.appendChild(ufo);

              later(function() {
                ufo.classList.remove('dyo-ufo-enter');
                ufo.classList.add('dyo-ufo-hover');
                ufo.style.top = d.y;
                ufo.style.opacity = '1';
              }, 2000);

              later(function() {
                ufo.classList.add('dyo-ufo-beam-on');
                var alien = document.createElement('div');
                alien.className = 'dyo-alien dyo-alien-descend';
                alien.style.left = d.alienLeft;
                alien.style.bottom = '52px';
                alien.style.pointerEvents = 'none';
                alien.innerHTML = makeAlienSvg();
                overlay.appendChild(alien);
                aliens.push(alien);

                later(function() {
                  alien.classList.remove('dyo-alien-descend');
                  alien.classList.add('dyo-alien-standoff');
                }, 1200);
              }, 2800);
            }, d.delay);
          });

          // ── 2s: 우주인 현재 위치 캡처 → 기지쪽에 모으기 ──
          later(function() {
            var astros = document.querySelectorAll('.dyo-astronaut');
            var groundY = astroLayer
              ? (astroLayer.getBoundingClientRect().bottom - desktop.getBoundingClientRect().top - 48)
              : (desktop.offsetHeight - 100);

            astros.forEach(function(el, i) {
              // 현재 CSS 애니메이션 위치 캡처
              var pos = grab(el);

              if (el._astro && el._astro.raf) {
                cancelAnimationFrame(el._astro.raf);
                el._astro.raf = null;
              }
              if (el._astro) el._astro.phase = 'panic';
              el.classList.remove('dyo-dragging', 'dyo-falling', 'dyo-walking');
              el.classList.add('dyo-panic');

              // 먼저 캡처된 위치에 배치 (순간이동 방지)
              desktop.appendChild(el);
              el.style.cssText = 'position:absolute;left:' + pos.x + 'px;top:' + pos.y + 'px;width:32px;height:48px;z-index:9999;pointer-events:none;animation:none !important;';

              // 다음 프레임에 기지 위치로 트랜지션
              var gatherX = baseX + (i - 2.5) * 22;
              requestAnimationFrame(function() {
                el.style.transition = 'left 1.5s ease, top 1.5s ease';
                el.style.left = gatherX + 'px';
                el.style.top = groundY + 'px';
              });
            });
          }, 2000);

          // ── 5.5s: 대치 시작 — 외계인 클릭 가능하게 ──
          later(function() {
            standoffActive = true;
            overlay.style.pointerEvents = 'auto';
            aliens.forEach(function(alien) {
              alien.style.pointerEvents = 'auto';
              alien.style.cursor = 'crosshair';
            });

            overlay.addEventListener('click', function(e) {
              if (!standoffActive) return;
              var alien = e.target.closest('.dyo-alien');
              if (!alien) return;

              // 외계인 제거 애니메이션
              alien.style.pointerEvents = 'none';
              alien.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
              alien.style.transform = 'scale(0) rotate(180deg)';
              alien.style.opacity = '0';
              setTimeout(function() { alien.remove(); }, 300);

              alienKills++;
              if (alienKills >= 3) {
                // 전부 제거! 승리!
                standoffActive = false;
                defeated = true;
                triggerVictory();
              }
            });
          }, 5500);

          // ── 8.5s: 대치 3초 후, 아직 안 잡았으면 → 도망 ──
          later(function() {
            if (defeated) return; // 이미 승리했으면 스킵
            standoffActive = false;
            overlay.style.pointerEvents = 'none';

            txt.style.transition = 'opacity 0.5s ease';
            txt.style.opacity = '0';

            overlay.querySelectorAll('.dyo-ufo').forEach(function(ufo) {
              ufo.classList.remove('dyo-ufo-beam-on');
            });

            // 우주인 오른쪽으로 도망
            var astros = document.querySelectorAll('.dyo-astronaut');
            astros.forEach(function(el, i) {
              el.classList.remove('dyo-panic');
              el.style.transition = 'none';
              el.style.animation = '';
              later(function() {
                el.classList.add('dyo-panic-run-r');
              }, i * 150);
            });

            // 외계인 추격
            later(function() {
              aliens.forEach(function(alien, i) {
                if (!alien.parentNode) return;
                alien.classList.remove('dyo-alien-standoff');
                later(function() {
                  alien.classList.add('dyo-alien-chase-r');
                }, i * 100);
              });
            }, 500);
          }, 8500);

          // ── 13s: 패배 시나리오 ──
          later(function() {
            if (defeated) return;

            // UFO 퇴장
            overlay.querySelectorAll('.dyo-ufo').forEach(function(ufo) {
              ufo.style.transition = 'top 1.5s ease-in, opacity 1.5s ease-in';
              ufo.style.top = '-80px';
              ufo.style.opacity = '0';
            });

            later(function() {
              overlay.remove();
              if (txt.parentNode) txt.remove();
              triggerDefeat();
            }, 2000);
          }, 13000);

          // ── 승리 시나리오 ──
          function triggerVictory() {
            // 빔 끄기
            overlay.querySelectorAll('.dyo-ufo').forEach(function(ufo) {
              ufo.classList.remove('dyo-ufo-beam-on');
            });

            // 텍스트 변경
            txt.textContent = '🎉 VICTORY! 🎉';
            txt.style.color = '#44ff44';
            txt.style.textShadow = '0 0 20px rgba(0,255,0,0.8), 0 0 40px rgba(0,255,0,0.4)';
            txt.style.opacity = '1';
            txt.style.animation = 'dyo-invasion-text-in 0.5s ease-out forwards';

            // 폭죽 파티클 생성
            for (var f = 0; f < 40; f++) {
              (function(idx) {
                later(function() { spawnFirework(overlay); }, idx * 80);
              })(f);
            }

            // 우주인 축하 (팔 흔들기)
            var astros = document.querySelectorAll('.dyo-astronaut');
            astros.forEach(function(el) {
              el.classList.remove('dyo-panic');
              el.style.animation = 'dyo-celebrate-jump 0.5s ease-in-out infinite alternate';
            });

            // UFO 도망
            later(function() {
              overlay.querySelectorAll('.dyo-ufo').forEach(function(ufo) {
                ufo.style.transition = 'top 1s ease-in, opacity 1s ease-in';
                ufo.style.top = '-80px';
                ufo.style.opacity = '0';
              });
            }, 1000);

            // 4초 후 정리
            later(function() {
              resetAll();
            }, 4000);
          }

          function spawnFirework(container) {
            var colors = ['#ff4444','#44ff44','#4488ff','#ffaa00','#ff44ff','#44ffff','#ffff44'];
            var x = 20 + Math.random() * 60;
            var y = 20 + Math.random() * 40;
            for (var p = 0; p < 8; p++) {
              var dot = document.createElement('div');
              var angle = (p / 8) * Math.PI * 2;
              var dist = 30 + Math.random() * 40;
              var dx = Math.cos(angle) * dist;
              var dy = Math.sin(angle) * dist;
              var c = colors[Math.floor(Math.random() * colors.length)];
              dot.style.cssText = 'position:absolute;left:' + x + '%;top:' + y + '%;width:4px;height:4px;border-radius:50%;background:' + c + ';pointer-events:none;z-index:60;opacity:1;box-shadow:0 0 6px ' + c + ';transition:all 0.8s ease-out;';
              container.appendChild(dot);
              requestAnimationFrame(function() {
                dot.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
                dot.style.opacity = '0';
              });
              setTimeout(function() { dot.remove(); }, 900);
            }
          }

          // ── 패배 시나리오 ──
          function triggerDefeat() {
            // 우주인 숨기기 (도망간 채로)
            var astros = document.querySelectorAll('.dyo-astronaut');
            astros.forEach(function(el) {
              el.style.display = 'none';
              el.classList.remove('dyo-panic', 'dyo-panic-run-l', 'dyo-panic-run-r');
              if (el._astro) { el._astro.phase = 'defeated'; el._astro.raf = null; }
            });

            // 달 어두워지기
            var darkOverlay = document.createElement('div');
            darkOverlay.className = 'dyo-moon-dark';
            darkOverlay.id = 'dyoMoonDark';
            desktop.appendChild(darkOverlay);
            requestAnimationFrame(function() {
              darkOverlay.classList.add('active');
            });

            // 외계인 3마리 걸어다니기
            var alienWalkers = [];
            var walkData = [
              { dur: '18s', anim: 'dyo-alien-walk-r', delay: '0s' },
              { dur: '22s', anim: 'dyo-alien-walk-l', delay: '-8s' },
              { dur: '15s', anim: 'dyo-alien-walk-r', delay: '-12s' }
            ];
            walkData.forEach(function(w) {
              var walker = document.createElement('div');
              walker.className = 'dyo-alien-walker';
              walker.innerHTML = makeAlienSvg();
              walker.style.setProperty('--walk-anim', w.anim + ' ' + w.dur);
              walker.style.animationDelay = w.delay;
              desktop.appendChild(walker);
              alienWalkers.push(walker);
            });

            // 패배 상태 저장 (태극기 10번 클릭으로 해방 가능)
            invaded = true;
            clickCount = 0;

            // 태극기 클릭으로 해방
            var liberateCount = 0;
            function liberateHandler() {
              liberateCount++;
              flag.style.transform = 'rotate(' + (liberateCount % 2 ? 5 : -5) + 'deg)';
              setTimeout(function() { flag.style.transform = ''; }, 150);

              if (liberateCount >= 10) {
                flag.removeEventListener('click', liberateHandler);

                // 화면 밝아지기
                darkOverlay.classList.remove('active');
                setTimeout(function() {
                  if (darkOverlay.parentNode) darkOverlay.remove();
                }, 3000);

                // 외계인 도망
                alienWalkers.forEach(function(w) {
                  w.style.transition = 'opacity 1s ease';
                  w.style.opacity = '0';
                  setTimeout(function() { w.remove(); }, 1000);
                });

                // 우주인 복귀
                setTimeout(function() {
                  astros.forEach(function(el) {
                    el.style.display = '';
                    el.style.cssText = '';
                    el.classList.remove('dyo-panic', 'dyo-panic-run-l', 'dyo-panic-run-r');
                    if (el._astro) { el._astro.phase = 'css'; el._astro.raf = null; }
                    if (astroLayer && el.parentNode !== astroLayer) astroLayer.appendChild(el);
                  });
                  invaded = false;
                  clickCount = 0;
                }, 1500);
              }
            }
            // 기존 invasion 핸들러 무시하고 liberate로 전환
            flag.addEventListener('click', liberateHandler);
          }
        }
      })();

      // 태스크바 표시 (dyo-desktop 외부에 위치)
      var desktopBar = document.getElementById('dyoDesktopBar');
      if (desktopBar) desktopBar.classList.add('show');

      // 시계 업데이트 (Linux 바 + Windows 바 양쪽 갱신)
      function updateClock() {
        var now = new Date();
        var hh = String(now.getHours()).padStart(2, '0');
        var mm = String(now.getMinutes()).padStart(2, '0');
        var yyyy = now.getFullYear();
        var mo = String(now.getMonth() + 1).padStart(2, '0');
        var dd = String(now.getDate()).padStart(2, '0');
        var timeStr = hh + ':' + mm;
        var dateStr = yyyy + '/' + mo + '/' + dd;
        ['desktopClock', 'dyoWinClock'].forEach(function(id) {
          var el = document.getElementById(id);
          if (el) el.textContent = timeStr;
        });
        ['desktopDate', 'dyoWinDate'].forEach(function(id) {
          var el = document.getElementById(id);
          if (el) el.textContent = dateStr;
        });
      }
      updateClock();
      setInterval(updateClock, 1000);

      // 태스크바 칸반 버튼
      var barBoard = document.getElementById('dyoBarBoard');
      if (barBoard) barBoard.addEventListener('click', function() {
        if (window.dyoOpenBoard) window.dyoOpenBoard();
      });

      // ── Windows 시작 메뉴 (Windows 모드 전용) ─────────────
      // 앱 정의 — 시작 메뉴 + Win 태스크바 툴팁이 같은 한글명 공유
      // Start 메뉴 + Win 태스크바 정의 — 데스크탑 아이콘 SVG와 동일 사용
      // keywords: 검색용 별칭 (한글/영문 모두). label 자체도 검색 대상에 포함됨.
      var WIN_APP_DEFS = [
        { id: 'dyoBrowserWin',  label: '개발 블로그',     svg: window.WIN_TASKBAR_ICONS.dyoBrowserWin,
          keywords: ['blog', 'dev blog', '블로그', '개발블로그', '포스트', '글', '카테고리', 'tistory', '티스토리'],
          open: function() { if (window.dyoOpenBrowser) window.dyoOpenBrowser('/category'); } },
        { id: 'dyoShellWin',    label: 'bash',           svg: window.WIN_TASKBAR_ICONS.dyoShellWin,
          keywords: ['shell', 'terminal', 'cmd', 'command', 'powershell', '터미널', '명령어', '커맨드', '쉘', '콘솔', 'console'],
          open: function() { if (window.dyoOpenShell)    window.dyoOpenShell();    } },
        { id: 'dyoExplorerWin', label: '파일 탐색기',     svg: window.WIN_TASKBAR_ICONS.dyoExplorerWin,
          keywords: ['file explorer', 'files', 'explorer', '탐색기', '파일', '폴더', 'folder', '디렉토리'],
          open: function() { if (window.dyoOpenExplorer) window.dyoOpenExplorer(); } },
        { id: 'dyoReadmeWin',   label: 'README',          svg: window.WIN_TASKBAR_ICONS.dyoReadmeWin,
          keywords: ['readme', 'help', '도움말', '안내', '사용법', '리드미', 'guide'],
          open: function() { if (window.dyoOpenReadme)   window.dyoOpenReadme();   } },
        { id: 'dyoGuestWin',    label: '방명록',          svg: window.WIN_TASKBAR_ICONS.dyoGuestWin,
          keywords: ['guestbook', 'chat', '채팅', '방명록', '메시지', '댓글', 'message', '카톡', 'kakao'],
          open: function() { if (window.dyoOpenGuest)    window.dyoOpenGuest();    } },
        { id: 'dyoBoardWin',    label: '보드',            svg: window.WIN_TASKBAR_ICONS.dyoBoardWin,
          keywords: ['board', '보드', '칸반', 'kanban', '할일', 'todo', 'task', '일정', '관리', 'trello'],
          open: function() { if (window.dyoOpenBoard)    window.dyoOpenBoard();    } },
        { id: 'dyoLinksWin',    label: '링크',            svg: window.WIN_TASKBAR_ICONS.dyoLinksWin,
          keywords: ['links', '링크', '즐겨찾기', '북마크', 'bookmark', 'favorite', '바로가기'],
          open: function() { if (window.dyoOpenLinks)    window.dyoOpenLinks();    } },
        { id: 'dyoGalleryWin',  label: 'Blogram',         svg: window.WIN_TASKBAR_ICONS.dyoGalleryWin,
          keywords: ['blogram', 'gallery', 'photo', 'instagram', '갤러리', '사진', '인스타', '이미지', 'image'],
          open: function() { if (window.dyoOpenGallery)  window.dyoOpenGallery();  } },
        { id: 'dyoMusicWin',    label: '음악',            svg: window.WIN_TASKBAR_ICONS.dyoMusicWin,
          keywords: ['music', '뮤직', '음악', 'song', '노래', 'youtube', 'mp3', 'player', '플레이어', 'audio'],
          open: function() { if (window.dyoOpenMusic)    window.dyoOpenMusic();    } },
        { id: 'dyoAdminWin',    label: '제어판',          svg: window.WIN_TASKBAR_ICONS.dyoAdminWin, adminOnly: true,
          keywords: ['control panel', 'admin', 'manage', '관리자', '제어판', '관리', '글쓰기', 'write', 'post', '포스트', '스킨', 'skin', '스킨편집', '설정', 'settings', '새 글'],
          open: function() { if (window.dyoOpenAdminPanel) window.dyoOpenAdminPanel(); } }
      ];

      var winStart    = document.getElementById('dyoWinStart');
      var winStartMenu = document.getElementById('dyoWinStartMenu');
      var winStartList = document.getElementById('dyoWinStartList');

      // Win 태스크바 앱 툴팁 한글화 (DOM이 동적으로 추가되므로 MutationObserver)
      function applyWinAppTooltips() {
        WIN_APP_DEFS.forEach(function(def) {
          var btn = document.querySelector('.dyo-win-app[data-win-id="' + def.id + '"]');
          if (!btn) return;
          var tip = btn.querySelector('.dyo-win-app-tooltip');
          if (tip) tip.textContent = def.label;
        });
      }
      // 즉시 + 100ms 후 한 번 더 (dock init은 같은 turn에 실행됨)
      setTimeout(applyWinAppTooltips, 0);
      setTimeout(applyWinAppTooltips, 200);

      // Start 메뉴 populate + 검색 기능
      var winStartItems = []; // [{ el, def }]
      var winStartNoResults = null;
      if (winStartList) {
        WIN_APP_DEFS.forEach(function(def) {
          var item = document.createElement('button');
          item.className = 'dyo-winsm-item';
          if (def.adminOnly) item.classList.add('dyo-admin-only');   // 관리자 감지 전 CSS로 숨김
          item.dataset.winId = def.id;
          item.innerHTML =
            '<span class="dyo-winsm-icon">' + def.svg + '</span>' +
            '<span class="dyo-winsm-name">' + def.label + '</span>';
          item.addEventListener('click', function() {
            closeWinStartMenu();
            def.open();
          });
          winStartList.appendChild(item);
          winStartItems.push({ el: item, def: def });
        });
        // "검색 결과 없음" 표시 영역
        winStartNoResults = document.createElement('div');
        winStartNoResults.className = 'dyo-winsm-noresults';
        winStartNoResults.textContent = '검색 결과 없음';
        winStartList.appendChild(winStartNoResults);
      }

      // 검색 입력 핸들러 — 라벨 + keywords 매칭 (대소문자 무시)
      var winSmSearch = document.getElementById('dyoWinSmSearch');
      function applyStartSearch(q) {
        q = (q || '').trim().toLowerCase();
        var anyVisible = false;
        winStartItems.forEach(function(it) {
          // 관리자 전용 항목: 비관리자에겐 검색 대상에서도 제외.
          // (CSS 게이팅만으론 Enter 실행 로직이 인라인 display만 보고 숨은 항목을 실행할 수 있음)
          if (it.def.adminOnly && !window.dyoIsAdmin) {
            it.el.style.display = 'none';
            return;
          }
          if (!q) {
            it.el.style.display = '';
            anyVisible = true;
            return;
          }
          var hay = (it.def.label + ' ' + (it.def.keywords || []).join(' ')).toLowerCase();
          var match = hay.indexOf(q) !== -1;
          it.el.style.display = match ? '' : 'none';
          if (match) anyVisible = true;
        });
        if (winStartNoResults) {
          winStartNoResults.style.display = (q && !anyVisible) ? '' : 'none';
        }
      }
      if (winSmSearch) {
        winSmSearch.addEventListener('input', function() { applyStartSearch(this.value); });
        winSmSearch.addEventListener('keydown', function(e) {
          if (e.key === 'Enter') {
            e.preventDefault();
            // 첫 번째로 보이는 항목 실행
            for (var i = 0; i < winStartItems.length; i++) {
              if (winStartItems[i].el.style.display !== 'none') {
                winStartItems[i].el.click();
                break;
              }
            }
          }
        });
      }

      function openWinStartMenu() {
        if (!winStartMenu) return;
        var r = winStart ? winStart.getBoundingClientRect() : { left: 14, top: window.innerHeight - 48 };
        winStartMenu.style.left = Math.max(8, r.left) + 'px';
        winStartMenu.style.bottom = (window.innerHeight - r.top + 6) + 'px';
        winStartMenu.classList.add('open');
        // 검색 상태 초기화 + 입력란 자동 포커스
        if (winSmSearch) {
          winSmSearch.value = '';
          applyStartSearch('');
          setTimeout(function() { winSmSearch.focus(); }, 50);
        }
      }
      function closeWinStartMenu() {
        if (!winStartMenu) return;
        winStartMenu.classList.remove('open');
        // 검색 필터 리셋 — 다음 오픈 시 전체 목록부터 시작
        if (winSmSearch) {
          winSmSearch.value = '';
          applyStartSearch('');
        }
      }

      if (winStart) winStart.addEventListener('click', function(e) {
        e.stopPropagation();
        if (winStartMenu && winStartMenu.classList.contains('open')) closeWinStartMenu();
        else openWinStartMenu();
      });
      // 외부 클릭 닫기
      document.addEventListener('click', function(e) {
        if (!winStartMenu || !winStartMenu.classList.contains('open')) return;
        if (winStart && winStart.contains(e.target)) return;
        if (winStartMenu.contains(e.target)) return;
        closeWinStartMenu();
      });
      // ESC 닫기
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && winStartMenu && winStartMenu.classList.contains('open')) closeWinStartMenu();
      });
      var winSmPower = document.getElementById('dyoWinSmPower');
      if (winSmPower) winSmPower.addEventListener('click', function() {
        closeWinStartMenu();
        // 시스템 종료 → 메인화면(인트로 랜딩)으로 복귀 (btnGoLanding 과 동일 동작)
        if (document.body.id === 'tt-body-index') location.reload();  // 홈이면 새로고침 → 랜딩 재생
        else location.href = '/';                                     // 그 외엔 홈으로 이동
      });

      var winBoardBtn = document.getElementById('dyoWinBoard');
      if (winBoardBtn) winBoardBtn.addEventListener('click', function() {
        if (window.dyoOpenBoard) window.dyoOpenBoard();
      });

      // Windows 시계 → 기존 캘린더 팝업 토글 핸들러로 forward
      var winClock = document.getElementById('dyoWinClockWrap');
      if (winClock) winClock.addEventListener('click', function(e) {
        e.stopPropagation();
        var origin = document.getElementById('dyoBarClock');
        var popup  = document.getElementById('dyoCalPopup');
        if (!origin || !popup) return;
        // 팝업이 닫혀있으면 — Win 시계 위치 기준으로 띄움
        var isOpen = popup.classList.contains('open');
        if (isOpen) {
          popup.classList.remove('open');
          return;
        }
        // bar-clock 핸들러를 직접 호출하기 어려우니, 위치만 재계산 후 toggle
        origin.click(); // 내부에서 팝업 토글
        // 위치는 Win clock 위로 강제 이동
        var cr = winClock.getBoundingClientRect();
        var pw = popup.offsetWidth || 280;
        popup.style.left = Math.max(8, cr.right - pw) + 'px';
        popup.style.bottom = (window.innerHeight - cr.top + 8) + 'px';
      });

      // README 아이콘 클릭
      var iconReadme = document.getElementById('desktopIconReadme');
      if (iconReadme) {
        iconReadme.addEventListener('click', function() {
          window._dyoAnimSrc = this;
          if (window.dyoOpenReadme) window.dyoOpenReadme();
        });
      }

      // Terminal 아이콘 클릭 → 터미널 창 열기
      var iconShell = document.getElementById('desktopIconShell');
      if (iconShell) {
        iconShell.addEventListener('click', function() {
          window._dyoAnimSrc = this;
          if (window.dyoOpenShell) window.dyoOpenShell();
        });
      }

      // Blog 아이콘 클릭 → 전체글보기 창으로 열기
      var iconBlog = document.getElementById('desktopIconBlog');
      if (iconBlog) {
        iconBlog.addEventListener('click', function() {
          window._dyoAnimSrc = this;
          if (window.dyoOpenBrowser) window.dyoOpenBrowser('/category');
        });
      }

      // Guestbook 아이콘 클릭 → 채팅창 열기
      var iconGuest = document.getElementById('desktopIconGuest');
      if (iconGuest) {
        iconGuest.addEventListener('click', function() {
          window._dyoAnimSrc = this;
          if (window.dyoOpenGuest) window.dyoOpenGuest();
        });
      }

      // GitHub 아이콘 클릭 → 외부 링크 확인 후 새 탭으로 열기
      var iconGithub = document.getElementById('desktopIconGithub');
      if (iconGithub) {
        iconGithub.addEventListener('click', function() {
          if (window.dyoOpenExternal) window.dyoOpenExternal('https://github.com/doyoungkim-code');
        });
      }

      // File Explorer 아이콘 클릭
      var iconExplorer = document.getElementById('desktopIconExplorer');
      if (iconExplorer) {
        iconExplorer.addEventListener('click', function() {
          window._dyoAnimSrc = this;
          if (window.dyoOpenExplorer) window.dyoOpenExplorer();
        });
      }

      // Blogram 아이콘 클릭
      var iconGallery = document.getElementById('desktopIconGallery');
      if (iconGallery) {
        iconGallery.addEventListener('click', function() {
          window._dyoAnimSrc = this;
          if (window.dyoOpenGallery) window.dyoOpenGallery();
        });
      }

      // Music Player 아이콘 클릭
      var iconMusic = document.getElementById('desktopIconMusic');
      if (iconMusic) {
        iconMusic.addEventListener('click', function() {
          window._dyoAnimSrc = this;
          if (window.dyoOpenMusic) window.dyoOpenMusic();
        });
      }

      // Board 아이콘 클릭
      var iconBoard = document.getElementById('desktopIconBoard');
      if (iconBoard) {
        iconBoard.addEventListener('click', function() {
          window._dyoAnimSrc = this;
          if (window.dyoOpenBoard) window.dyoOpenBoard();
        });
      }

      // Features 폴더 아이콘 → 폴더 창 열기 (File Explorer 스타일)
      // 창 열기/드래그/리사이즈 및 내부 아이템 렌더링은 별도 IIFE(window.dyoOpenFeatures)에서 처리
      var iconFeatures = document.getElementById('desktopIconFeatures');
      if (iconFeatures) {
        iconFeatures.addEventListener('click', function() {
          window._dyoAnimSrc = iconFeatures;
          if (window.dyoOpenFeatures) window.dyoOpenFeatures();
        });
      }

      // 제어판 아이콘 (관리자 전용) → 제어판 창 열기
      var iconAdmin = document.getElementById('desktopIconAdmin');
      if (iconAdmin) {
        iconAdmin.addEventListener('click', function() {
          window._dyoAnimSrc = iconAdmin;
          if (window.dyoOpenAdminPanel) window.dyoOpenAdminPanel();
        });
      }

    })();

    // 게시글 목차(TOC) 자동 생성
    (function() {
      var view = document.getElementById('article-view');
      if (!view) return;
      var bodyId = document.body.id;
      if (bodyId !== 'tt-body-page') return;

      var headings = view.querySelectorAll('h2, h3');
      if (headings.length < 2) return;

      var toc = document.createElement('div');
      toc.className = 'toc-wrapper';

      var title = document.createElement('div');
      title.className = 'toc-title';
      title.innerHTML = 'Table of Contents <span class="toc-toggle">&#9660;</span>';
      title.addEventListener('click', function() {
        toc.classList.toggle('collapsed');
      });

      var list = document.createElement('ul');
      list.className = 'toc-list';

      headings.forEach(function(h, i) {
        var id = 'toc-heading-' + i;
        h.id = id;
        var li = document.createElement('li');
        li.className = 'toc-' + h.tagName.toLowerCase();
        var a = document.createElement('a');
        a.href = '#' + id;
        a.textContent = h.textContent;
        li.appendChild(a);
        list.appendChild(li);
      });

      toc.appendChild(title);
      toc.appendChild(list);
      view.insertBefore(toc, view.firstChild);
    })();

    // 코드블럭: highlight.js 적용 + 언어 감지 + 복사 버튼 + wrapper
    (function() {
      var view = document.getElementById('article-view');
      if (!view) return;

      // highlight.js 실행 (Tistory data-ke-language 지원)
      if (typeof hljs !== 'undefined') {
        view.querySelectorAll('pre code').forEach(function(codeEl) {
          var pre = codeEl.parentElement;
          var keLang = pre && pre.getAttribute('data-ke-language');
          if (keLang && !codeEl.classList.contains('hljs')) {
            codeEl.className = 'language-' + keLang.toLowerCase();
          }
          if (!codeEl.classList.contains('hljs')) {
            hljs.highlightElement(codeEl);
          }
        });
        // code 없이 pre만 있는 경우
        view.querySelectorAll('pre').forEach(function(pre) {
          if (!pre.querySelector('code')) {
            var code = document.createElement('code');
            code.textContent = pre.textContent;
            var keLang = pre.getAttribute('data-ke-language');
            if (keLang) code.className = 'language-' + keLang.toLowerCase();
            pre.textContent = '';
            pre.appendChild(code);
            hljs.highlightElement(code);
          }
        });
      }

      // 언어 감지 맵: class명 → 표시 이름
      var langMap = {
        'java': 'Java', 'python': 'Python', 'py': 'Python',
        'javascript': 'JavaScript', 'js': 'JavaScript',
        'typescript': 'TypeScript', 'ts': 'TypeScript',
        'html': 'HTML', 'css': 'CSS', 'scss': 'SCSS',
        'json': 'JSON', 'xml': 'XML', 'yaml': 'YAML', 'yml': 'YAML',
        'sql': 'SQL', 'bash': 'Bash', 'sh': 'Shell', 'shell': 'Shell',
        'c': 'C', 'cpp': 'C++', 'csharp': 'C#', 'cs': 'C#',
        'go': 'Go', 'rust': 'Rust', 'ruby': 'Ruby', 'rb': 'Ruby',
        'php': 'PHP', 'swift': 'Swift', 'kotlin': 'Kotlin', 'kt': 'Kotlin',
        'dart': 'Dart', 'scala': 'Scala', 'r': 'R',
        'markdown': 'Markdown', 'md': 'Markdown',
        'dockerfile': 'Dockerfile', 'docker': 'Docker',
        'groovy': 'Groovy', 'gradle': 'Gradle',
        'properties': 'Properties', 'ini': 'INI', 'toml': 'TOML',
        'plaintext': 'Text', 'text': 'Text'
      };

      // 언어 색상 맵
      var langColors = {
        'Java': '#b07219', 'Python': '#3572A5', 'JavaScript': '#f1e05a',
        'TypeScript': '#3178c6', 'HTML': '#e34c26', 'CSS': '#563d7c',
        'JSON': '#292929', 'SQL': '#e38c00', 'Bash': '#89e051',
        'Shell': '#89e051', 'C': '#555555', 'C++': '#f34b7d',
        'C#': '#178600', 'Go': '#00ADD8', 'Rust': '#dea584',
        'Ruby': '#701516', 'PHP': '#4F5D95', 'Swift': '#F05138',
        'Kotlin': '#A97BFF', 'Dart': '#00B4AB', 'Scala': '#c22d40',
        'Dockerfile': '#384d54', 'Groovy': '#4298b8', 'Gradle': '#02303A',
        'SCSS': '#c6538c', 'XML': '#0060ac', 'YAML': '#cb171e',
        'Markdown': '#083fa1'
      };

      // 코드 내용으로 언어 추측
      function guessLang(code) {
        if (/public\s+(static\s+)?void\s+main|System\.out\.print|import\s+java\.|@(Override|Autowired|Service|Controller|Repository|Entity|Component)/.test(code)) return 'Java';
        if (/from\s+\w+\s+import|def\s+\w+\s*\(|print\s*\(|if\s+__name__/.test(code)) return 'Python';
        if (/console\.\w+\(|=>\s*\{|const\s+\w+\s*=|let\s+\w+\s*=|require\s*\(|module\.exports/.test(code)) return 'JavaScript';
        if (/interface\s+\w+|:\s*(string|number|boolean)\b|<\w+>/.test(code) && /const\s+|let\s+|=>\s*/.test(code)) return 'TypeScript';
        if (/<\/?[a-z][\s\S]*>/i.test(code) && /<(div|span|html|head|body|p|a|img|ul|li|table|form)\b/i.test(code)) return 'HTML';
        if (/\{[\s\S]*?[\w-]+\s*:\s*[\w#][\s\S]*?\}/.test(code) && /(color|margin|padding|display|font-size|background)\s*:/.test(code)) return 'CSS';
        if (/^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|FROM|WHERE)\b/im.test(code)) return 'SQL';
        if (/^(#!\/?bin\/|apt-get|sudo|echo|grep|chmod|mkdir|cd\s|ls\s|curl\s|wget\s)/m.test(code)) return 'Bash';
        if (/^\s*\{[\s\S]*"[\w]+":\s*/m.test(code)) return 'JSON';
        if (/^\s*<\?xml|<\/?\w+:\w+/m.test(code)) return 'XML';
        if (/^(FROM|RUN|CMD|EXPOSE|COPY|ADD|ENTRYPOINT|WORKDIR)\s/m.test(code)) return 'Dockerfile';
        if (/^(spring|server|logging)\.\w+\s*=/m.test(code)) return 'Properties';
        if (/func\s+\w+|package\s+main|fmt\.Print/.test(code)) return 'Go';
        if (/fn\s+\w+|let\s+mut\s|println!\(|use\s+std::/.test(code)) return 'Rust';
        return '';
      }

      var pres = view.querySelectorAll('pre');
      pres.forEach(function(pre) {
        if (pre.closest('.code-block-wrapper')) return;

        var codeEl = pre.querySelector('code');
        var lang = '';

        // 1. class에서 언어 감지
        if (codeEl) {
          var cls = (codeEl.className || '') + ' ' + (pre.className || '');
          var m = cls.match(/(?:language-|lang-|hljs\s+)(\w+)/);
          if (m && langMap[m[1].toLowerCase()]) {
            lang = langMap[m[1].toLowerCase()];
          }
        }
        // 2. data-ke-language (Tistory 에디터)
        if (!lang && pre.getAttribute('data-ke-language')) {
          var keLang = pre.getAttribute('data-ke-language').toLowerCase();
          if (langMap[keLang]) lang = langMap[keLang];
        }
        // 3. 코드 내용으로 추측
        if (!lang) {
          var codeText = (codeEl || pre).textContent || '';
          lang = guessLang(codeText);
        }

        var dotColor = (lang && langColors[lang]) ? langColors[lang] : '#8b949e';
        var displayLang = lang || 'Code';

        // wrapper 생성
        var wrapper = document.createElement('div');
        wrapper.className = 'code-block-wrapper';

        // header
        var header = document.createElement('div');
        header.className = 'code-block-header';
        header.innerHTML =
          '<span class="code-lang-label">' +
            '<span class="code-lang-dot" style="background:' + dotColor + ';"></span>' +
            displayLang +
          '</span>' +
          '<button type="button" class="code-copy-btn">' +
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>' +
            '<span>Copy</span>' +
          '</button>';

        // 복사 기능
        var btn = header.querySelector('.code-copy-btn');
        btn.addEventListener('click', function() {
          var text = (codeEl || pre).textContent;
          navigator.clipboard.writeText(text).then(function() {
            btn.classList.add('copied');
            btn.querySelector('span').textContent = 'Copied!';
            btn.querySelector('svg').innerHTML = '<polyline points="20 6 9 17 4 12"></polyline>';
            setTimeout(function() {
              btn.classList.remove('copied');
              btn.querySelector('span').textContent = 'Copy';
              btn.querySelector('svg').innerHTML = '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>';
            }, 2000);
          });
        });

        pre.parentNode.insertBefore(wrapper, pre);
        wrapper.appendChild(header);
        wrapper.appendChild(pre);
      });
    })();

    // 스크롤 진행바 + 맨 위로 가기 버튼
    (function() {
      var progressBar = document.getElementById('scrollProgress');
      var btnTop = document.getElementById('btnScrollTop');
      if (!progressBar || !btnTop) return;

      // 게시글 페이지에서만 진행바 표시
      var isArticle = document.body.id === 'tt-body-page';

      window.addEventListener('scroll', function() {
        var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        var docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;

        // 진행바
        if (isArticle && docHeight > 0) {
          var progress = (scrollTop / docHeight) * 100;
          progressBar.style.width = progress + '%';
        }

        // 맨 위로 버튼: 300px 이상 스크롤 시 표시
        if (scrollTop > 300) {
          btnTop.classList.add('visible');
        } else {
          btnTop.classList.remove('visible');
        }
      }, { passive: true });

      btnTop.addEventListener('click', function() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    })();

    // ============================================================
    // 가상 터미널 창 (드래그 가능, 최소화/최대화)
    // ============================================================
    (function() {
      var win      = document.getElementById('dyoShellWin');
      var btnShell = document.getElementById('btnShell');
      var titlebar = document.getElementById('dyoShellTitlebar');
      var closeBtn = document.getElementById('dyoShellClose');
      var minBtn   = document.getElementById('dyoShellMin');
      var maxBtn   = document.getElementById('dyoShellMax');
      var termInput= document.getElementById('termInput');
      var output   = document.getElementById('termOutput');
      var form     = document.getElementById('dyoTermForm');
      if (!win) return;

      var history = [], histIdx = -1;
      var dragging = false, dragOX = 0, dragOY = 0;
      var resizing = false, resizeDir = '', resizeSX = 0, resizeSY = 0, resizeSRect = null;
      var MIN_W = 360, MIN_H = 180;
      // 최대화 전 저장용
      var savedPos = null;

      // 가상 파일시스템 (File Explorer와 동일한 트리)
      var FS = { label: '~', icon: '📂', url: '/category', children: [
        { label: 'Project', icon: '📂', url: '/category/Project', children: [
          { label: 'Dev Log',    icon: '📁', url: '/category/Project/Dev%20Log' },
          { label: 'Retrospect', icon: '📁', url: '/category/Project/Retrospect' }
        ]},
        { label: 'Backend', icon: '☕', url: '/category/Backend', children: [
          { label: 'Java',        icon: '☕', url: '/category/Backend/Java' },
          { label: 'Spring Boot', icon: '🍃', url: '/category/Backend/Spring%20Boot' },
          { label: 'Database',    icon: '💾', url: '/category/Backend/Database' }
        ]},
        { label: 'Frontend', icon: '🎨', url: '/category/Frontend', children: [
          { label: 'Mobile', icon: '📱', url: '/category/Frontend/Mobile' },
          { label: 'Web',    icon: '🌐', url: '/category/Frontend/Web' }
        ]},
        { label: 'CS & Engineering', icon: '💻', url: '/category/CS%20&%20Engineering', children: [
          { label: 'C',                icon: '📗', url: '/category/CS%20&%20Engineering/C' },
          { label: 'Algorithm',        icon: '📐', url: '/category/CS%20&%20Engineering/Algorithm' },
          { label: 'Computer Science', icon: '📚', url: '/category/CS%20&%20Engineering/Computer%20Science' },
          { label: 'Infra & Tools',    icon: '🧱', url: '/category/CS%20&%20Engineering/Infra%20&%20Tools' }
        ]},
        { label: 'Growth', icon: '🌱', url: '/category/Growth', children: [
          { label: 'Certifications', icon: '📜', url: '/category/Growth/Certifications' },
          { label: 'English',        icon: '📖', url: '/category/Growth/English' },
          { label: 'Books',          icon: '📚', url: '/category/Growth/Books' },
          { label: 'Documents',      icon: '📑', url: '/category/Growth/Documents' },
          { label: 'etc',            icon: '📄', url: '/category/Growth/etc' }
        ]}
      ]};
      var cwdPath     = [FS]; // 현재 경로 (노드 배열, root = [FS])
      var prevCwdPath = null; // cd - 용 이전 경로

      function esc(t) { return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

      function getCwdNode() { return cwdPath[cwdPath.length - 1]; }
      function getCwdStr() {
        if (cwdPath.length === 1) return '~';
        return '~/' + cwdPath.slice(1).map(function(n){ return n.label; }).join('/');
      }
      function updatePrompt() {
        var el = document.getElementById('dyoTermPrompt');
        if (el) el.innerHTML = '[doyoucode@blog&nbsp;<span style="color:#58a6ff;font-weight:600">' + getCwdStr() + '</span>]$&nbsp;';
      }

      function addOutput(cmd, html) {
        var block = document.createElement('div');
        block.className = 'dyo-output-block';
        var pStr = '[doyoucode@blog&nbsp;<span style="color:#58a6ff">' + getCwdStr() + '</span>]$';
        block.innerHTML =
          '<div class="dyo-output-cmd-line">' +
            '<span class="dyo-output-prompt">' + pStr + '</span> ' +
            '<span class="dyo-output-cmd">' + esc(cmd) + '</span>' +
          '</div>' +
          (html ? '<div class="dyo-output-result">' + html + '</div>' : '');
        output.insertBefore(block, form);
        output.scrollTop = output.scrollHeight;
      }

      var BANNER = '╔════════════════════════════════════════╗\n║  Welcome to doyoucode\'s terminal       ║\n║  Type \'<span class="tr-cmd">help</span>\' to see available commands ║\n╚════════════════════════════════════════╝';

      // ── 브라우저 창 열기 (iframe) ──
      function launchBrowser(url) {
        if (window.dyoOpenBrowser) window.dyoOpenBrowser(url);
      }

      function processCmd(raw) {
        var cmd = raw.trim();
        if (!cmd) return;
        history.push(cmd); histIdx = history.length;

        var parts = cmd.split(/\s+/);
        var base = parts[0].toLowerCase();
        var arg  = parts.slice(1).join(' ');

        switch (base) {
          case 'help':
            addOutput(cmd,
              '<span class="tr-info">Available commands:</span><br><br>' +
              '<span style="color:#8b949e">── Navigation ──────────────────────────────</span><br>' +
              '<span class="tr-cmd">ls</span> <span style="color:#5c6370">[-l|-al]</span>          — 디렉토리 목록 <span style="color:#5c6370">(-l 상세, -al 숨김 포함)</span><br>' +
              '<span class="tr-cmd">cd</span> <span style="color:#5c6370">[name|..|~|-]</span>   — 디렉토리 이동 <span style="color:#5c6370">(..: 상위, ~: 루트, -: 이전)</span><br>' +
              '<span style="color:#5c6370;padding-left:20px;font-size:11px">└ 최하위 카테고리는 cd 시 File Explorer에서 자동으로 열림</span><br>' +
              '<span class="tr-cmd">pwd</span>                 — 현재 경로 출력<br>' +
              '<br><span style="color:#8b949e">── Etc ─────────────────────────────────────</span><br>' +
              '<span class="tr-cmd">about</span> / <span class="tr-cmd">whoami</span>   — 블로그 소개<br>' +
              '<span class="tr-cmd">search &lt;keyword&gt;</span>   — 블로그 포스트 검색<br>' +
              '<span class="tr-cmd">date</span>                — 현재 날짜 및 시간<br>' +
              '<span class="tr-cmd">echo &lt;text&gt;</span>        — 텍스트 출력<br>' +
              '<span class="tr-cmd">github</span>              — GitHub 프로필 열기<br>' +
              '<span class="tr-cmd">clear</span>               — 터미널 화면 지우기<br>' +
              '<span class="tr-cmd">exit</span>                — 터미널 닫기<br>' +
              '<br><span style="color:#5c6370">💡 <kbd style="background:#21262d;border:1px solid #30363d;border-radius:3px;padding:0 4px">Tab</kbd> 자동완성 | <kbd style="background:#21262d;border:1px solid #30363d;border-radius:3px;padding:0 4px">↑↓</kbd> 히스토리</span>'
            ); break;

          case 'about': case 'whoami':
            addOutput(cmd,
              '<span class="tr-success"><b>doyoucode</b></span> — Backend Developer<br>' +
              '프로그래밍이 일상이 된 개발자 꿈나무의 기록 공간<br>' +
              '<span style="color:#5c6370">코딩 공부를 하며 마주친 시행착오와 해결 과정을 정리하며 성장 중</span>'
            ); break;

          case 'ls': {
            var lsFlags = parts.slice(1).filter(function(p){ return p.startsWith('-'); }).join('');
            var lsLong  = lsFlags.indexOf('l') !== -1;
            var lsAll   = lsFlags.indexOf('a') !== -1;
            var lsNode  = getCwdNode();
            var lsKids  = lsNode.children || [];
            var lsNow   = new Date();
            var lsMon   = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][lsNow.getMonth()];
            var lsDay   = String(lsNow.getDate()).padStart(2,' ');
            var lsTime  = String(lsNow.getHours()).padStart(2,'0') + ':' + String(lsNow.getMinutes()).padStart(2,'0');
            var lsDate  = lsMon + ' ' + lsDay + ' ' + lsTime;
            if (lsLong) {
              var lsH = '<pre style="margin:0;font-family:var(--font-mono);line-height:1.6">';
              lsH += '<span style="color:#8b949e">total ' + (lsKids.length + (lsAll ? 2 : 0)) + '</span>\n';
              if (lsAll) {
                lsH += '<span style="color:#484f58">drwxr-xr-x</span> <span style="color:#8b949e">doyoucode blog ' + lsDate + '</span> <span style="color:#58a6ff">📂 .</span>\n';
                lsH += '<span style="color:#484f58">drwxr-xr-x</span> <span style="color:#8b949e">doyoucode root ' + lsDate + '</span> <span style="color:#58a6ff">📂 ..</span>\n';
              }
              lsKids.forEach(function(c) {
                var isDir  = c.children && c.children.length;
                var perm   = isDir ? 'drwxr-xr-x' : '-rw-r--r--';
                var nColor = isDir ? '#58a6ff' : '#e6edf3';
                lsH += '<span style="color:#484f58">' + perm + '</span> ';
                lsH += '<span style="color:#8b949e">doyoucode blog ' + lsDate + '</span> ';
                lsH += '<span style="color:' + nColor + '">' + c.icon + ' ' + esc(c.label) + (isDir ? '/' : '') + '</span>\n';
              });
              lsH += '</pre>';
              if (!lsKids.length && !lsAll) lsH = '<span style="color:#8b949e">total 0</span><br><span style="color:#5c6370">(하위 디렉토리 없음) — <span class="tr-cmd">cd ..</span> 로 상위로 이동하세요.</span>';
              addOutput(cmd, lsH);
            } else {
              if (!lsKids.length) {
                addOutput(cmd, '<span style="color:#8b949e">(하위 디렉토리 없음)</span><br><span style="color:#5c6370"><span class="tr-cmd">cd ..</span> 로 상위로 이동하세요.</span>');
              } else {
                var lsH2 = '';
                lsKids.forEach(function(c) {
                  var isDir  = c.children && c.children.length;
                  var nColor = isDir ? '#58a6ff' : '#e6edf3';
                  lsH2 += '<span style="color:' + nColor + ';margin-right:18px">' + c.icon + '&nbsp;' + esc(c.label) + (isDir ? '/' : '') + '</span>';
                });
                addOutput(cmd, lsH2);
              }
            }
            break;
          }

          case 'cd': {
            var cdArg  = arg.replace(/^['"]|['"]$/g,'').trim();
            var cdPrev = cwdPath.slice();
            if (!cdArg || cdArg === '~') {
              // cd 또는 cd ~ → root
              addOutput(cmd, '');
              prevCwdPath = cdPrev;
              cwdPath = [FS];
              updatePrompt();
            } else if (cdArg === '-') {
              // cd - → 이전 위치
              if (!prevCwdPath) {
                addOutput(cmd, '<span class="tr-error">bash: cd: OLDPWD not set</span>');
              } else {
                // 새 경로 문자열을 미리 계산 후, addOutput은 cwdPath 변경 전에 호출 (프롬프트 = 현재 위치)
                var cdNewStr = prevCwdPath.length === 1 ? '~' : '~/' + prevCwdPath.slice(1).map(function(n){ return n.label; }).join('/');
                addOutput(cmd, '<span style="color:#8b949e">' + cdNewStr + '</span>');
                var cdTmp = cwdPath.slice();
                cwdPath = prevCwdPath;
                prevCwdPath = cdTmp;
                updatePrompt();
              }
            } else if (cdArg === '.') {
              // cd . → 현재 위치 유지
              addOutput(cmd, '');
            } else if (cdArg === '..') {
              // cd .. → 상위로
              if (cwdPath.length <= 1) {
                addOutput(cmd, '');
              } else {
                addOutput(cmd, '');
                prevCwdPath = cdPrev;
                cwdPath = cwdPath.slice(0, -1);
                updatePrompt();
              }
            } else {
              // 이름으로 자식 검색 (대소문자 무시)
              var cdCur    = getCwdNode();
              var cdTarget = null;
              if (cdCur.children) {
                for (var ci = 0; ci < cdCur.children.length; ci++) {
                  if (cdCur.children[ci].label.toLowerCase() === cdArg.toLowerCase()) {
                    cdTarget = cdCur.children[ci]; break;
                  }
                }
              }
              if (cdTarget) {
                if (!cdTarget.children || !cdTarget.children.length) {
                  // 최하위 카테고리 → 브라우저에서 열고 현재 위치 유지
                  addOutput(cmd, '<span class="tr-success">🌐 ' + esc(cdTarget.label) + ' 을(를) 브라우저에서 열기...</span>');
                  launchBrowser(cdTarget.url);
                } else {
                  addOutput(cmd, '');
                  prevCwdPath = cdPrev;
                  cwdPath = cwdPath.concat([cdTarget]);
                  updatePrompt();
                }
              } else {
                var cdSugg = [];
                if (cdCur.children) {
                  cdCur.children.forEach(function(c) {
                    if (c.label.toLowerCase().indexOf(cdArg.toLowerCase()) !== -1) cdSugg.push(esc(c.label));
                  });
                }
                var cdMsg = '<span class="tr-error">bash: cd: ' + esc(cdArg) + ': No such file or directory</span>';
                if (cdSugg.length) cdMsg += '<br><span class="tr-warn">혹시 이 항목을 찾으시나요? ' + cdSugg.join(', ') + '</span>';
                addOutput(cmd, cdMsg);
              }
            }
            break;
          }

          case 'pwd':
            var pwdFull = '/home/doyoucode/blog';
            if (cwdPath.length > 1) pwdFull += '/' + cwdPath.slice(1).map(function(n){ return n.label; }).join('/');
            addOutput(cmd, '<span class="tr-default">' + esc(pwdFull) + '</span>'); break;

          case 'search': case 'grep':
            if (!arg) { addOutput(cmd,'<span class="tr-warn">Usage: search &lt;keyword&gt;</span>'); break; }
            addOutput(cmd,'<span class="tr-success">🔍 Searching for "'+esc(arg)+'" ...</span>');
            launchBrowser('/search/'+encodeURIComponent(arg)); break;

          case 'date':
            var now = new Date();
            var ds = now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+
              String(now.getDate()).padStart(2,'0')+' '+String(now.getHours()).padStart(2,'0')+':'+
              String(now.getMinutes()).padStart(2,'0')+':'+String(now.getSeconds()).padStart(2,'0');
            addOutput(cmd,'<span class="tr-default">'+['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][now.getDay()]+' '+ds+' KST</span>'); break;

          case 'echo':
            addOutput(cmd,'<span class="tr-default">'+(arg?esc(arg):'')+'</span>'); break;

          case 'clear':
            while (output.firstChild && output.firstChild !== form) {
              output.removeChild(output.firstChild);
            }
            var bannerEl = document.createElement('div');
            bannerEl.className = 'dyo-term-banner';
            bannerEl.innerHTML = BANNER;
            output.insertBefore(bannerEl, form);
            output.scrollTop = 0;
            return;

          case 'github':
            addOutput(cmd,'<span class="tr-success">🚀 Opening GitHub ...</span>');
            setTimeout(function(){ if (window.dyoOpenExternal) window.dyoOpenExternal('https://github.com/doyoungkim-code'); }, 400); break;

          case 'sudo':   addOutput(cmd,'<span class="tr-error">🔒 Permission denied 😎</span>'); break;
          case 'rm':     addOutput(cmd,'<span class="tr-error">🚫 Not gonna happen here 😅</span>'); break;
          case 'exit':   closeWindow(); return;
          case 'hello': case 'hi':
            addOutput(cmd,'<span class="tr-success">👋 Hello! Type <span class="tr-cmd">help</span> to see what you can do.</span>'); break;

          default:
            addOutput(cmd,
              '<span class="tr-error">bash: '+esc(base)+': command not found</span><br>' +
              '<span style="color:#5c6370">Type <span class="tr-cmd">help</span> to see available commands.</span>'
            );
        }
      }

      // ── 창 열기/닫기/최소화/최대화 ──
      function openWindow() {
        var wasOpen = win.classList.contains('open');
        if (!wasOpen) {
          var W = 680, H = 440;
          var _m = document.getElementById('dyoMemoWidget');
          var _mT = _m ? _m.getBoundingClientRect().top : 28;
          win.style.left   = Math.round((window.innerWidth  - W) / 2) + 'px';
          win.style.top    = _mT + 'px';
          win.style.right  = 'auto';
          win.style.bottom = 'auto';
        }
        win.classList.add('open');
        win.classList.remove('minimized');
        if (btnShell) btnShell.classList.add('active');
        window._dyoZTop = (window._dyoZTop || 9000) + 1;
        win.style.zIndex = window._dyoZTop;
        if (!wasOpen && window.dyoAnimOpen) window.dyoAnimOpen(win);
        setTimeout(function() {
          termInput && termInput.focus();
          output.scrollTop = output.scrollHeight;
        }, 50);
      }
      function closeWindow() {
        if (window.dyoAnimDismiss) {
          window.dyoAnimDismiss(win, function() {
            win.classList.remove('open', 'minimized', 'maximized');
            if (btnShell) btnShell.classList.remove('active');
            savedPos = null;
          });
        } else {
          win.classList.remove('open', 'minimized', 'maximized');
          if (btnShell) btnShell.classList.remove('active');
          savedPos = null;
        }
      }
      function minimizeWindow() {
        if (win.classList.contains('minimized')) {
          var tb = document.querySelector('.dyo-taskbtn[data-win-id="dyoShellWin"]');
          window._dyoAnimSrc = tb || null;
          win.classList.remove('minimized');
          if (window.dyoAnimOpen) window.dyoAnimOpen(win);
          setTimeout(function(){ termInput && termInput.focus(); }, 200);
        } else {
          if (win.classList.contains('maximized')) {
            win.classList.remove('maximized');
            if (savedPos) {
              win.style.left = savedPos.left; win.style.top = savedPos.top;
              win.style.right = savedPos.right; win.style.bottom = savedPos.bottom;
              win.style.width = savedPos.width; win.style.height = savedPos.height;
              savedPos = null;
            }
          }
          if (window.dyoAnimMinimize) {
            window.dyoAnimMinimize(win, function() { win.classList.add('minimized'); });
          } else {
            win.classList.add('minimized');
          }
        }
      }
      function maximizeWindow() {
        if (win.classList.contains('maximized')) {
          win.classList.remove('maximized');
          if (savedPos) {
            win.style.left   = savedPos.left;
            win.style.top    = savedPos.top;
            win.style.right  = savedPos.right;
            win.style.bottom = savedPos.bottom;
            win.style.width  = savedPos.width;
            win.style.height = savedPos.height;
            savedPos = null;
          }
          if (window.dyoAnimMaximizeOut) window.dyoAnimMaximizeOut(win);
        } else {
          win.classList.remove('minimized');
          savedPos = {
            left: win.style.left, top: win.style.top,
            right: win.style.right, bottom: win.style.bottom,
            width: win.style.width, height: win.style.height
          };
          win.classList.add('maximized');
          win.style.left = win.style.top = win.style.right =
          win.style.bottom = win.style.width = win.style.height = '';
          if (window.dyoAnimMaximizeIn) window.dyoAnimMaximizeIn(win);
        }
        setTimeout(function(){ termInput && termInput.focus(); }, 50);
      }

      // 데스크탑 아이콘에서 호출할 수 있도록 전역 노출
      window.dyoOpenShell = openWindow;

      // 창 포커스 (z-index 최상위)
      function bringToFront() {
        window._dyoZTop = (window._dyoZTop || 9000) + 1;
        win.style.zIndex = window._dyoZTop;
      }
      win.addEventListener('mousedown', bringToFront);

      if (btnShell) btnShell.addEventListener('click', function() {
        if (win.classList.contains('open')) {
          closeWindow();
        } else {
          window._dyoAnimSrc = btnShell;
          openWindow();
        }
      });
      if (closeBtn) closeBtn.addEventListener('click', closeWindow);
      if (minBtn)   minBtn.addEventListener('click',   minimizeWindow);
      if (maxBtn)   maxBtn.addEventListener('click',   maximizeWindow);


      // ── 드래그 ──
      titlebar.addEventListener('dblclick', function(e) {
        if (e.target === closeBtn || e.target === minBtn || e.target === maxBtn) return;
        maximizeWindow();
      });

      titlebar.addEventListener('mousedown', function(e) {
        if (win.classList.contains('maximized')) return;
        if (e.target === minBtn || e.target === maxBtn || e.target === closeBtn) return;
        var rect = win.getBoundingClientRect();
        // 인라인 left/top 좌표로 전환
        win.style.left   = rect.left + 'px';
        win.style.top    = rect.top  + 'px';
        win.style.right  = 'auto';
        win.style.bottom = 'auto';
        dragging = true;
        dragOX = e.clientX - rect.left;
        dragOY = e.clientY - rect.top;
        e.preventDefault();
      });

      document.addEventListener('mousemove', function(e) {
        if (dragging) {
          var x = Math.max(0, Math.min(window.innerWidth  - win.offsetWidth,  e.clientX - dragOX));
          var y = Math.max(0, Math.min(window.innerHeight - 40, e.clientY - dragOY));
          win.style.left = x + 'px';
          win.style.top  = y + 'px';
        }
        if (resizing) {
          var dx = e.clientX - resizeSX;
          var dy = e.clientY - resizeSY;
          var r = resizeSRect;
          var newL = r.left, newT = r.top, newW = r.width, newH = r.height;
          if (resizeDir.indexOf('e') !== -1) newW = Math.max(MIN_W, r.width + dx);
          if (resizeDir.indexOf('s') !== -1) newH = Math.max(MIN_H, r.height + dy);
          if (resizeDir.indexOf('w') !== -1) { newW = Math.max(MIN_W, r.width - dx); newL = r.left + r.width - newW; }
          if (resizeDir.indexOf('n') !== -1) { newH = Math.max(MIN_H, r.height - dy); newT = r.top + r.height - newH; }
          win.style.left   = newL + 'px';
          win.style.top    = newT + 'px';
          win.style.width  = newW + 'px';
          win.style.height = newH + 'px';
        }
      });

      document.addEventListener('mouseup', function() {
        dragging = false;
        resizing = false;
      });

      // ── 리사이즈 핸들 ──
      win.querySelectorAll('.dyo-brs-handle').forEach(function(handle) {
        handle.addEventListener('mousedown', function(e) {
          if (win.classList.contains('maximized') || win.classList.contains('minimized')) return;
          e.stopPropagation();
          e.preventDefault();
          resizing = true;
          resizeDir = handle.getAttribute('data-dir');
          resizeSX = e.clientX;
          resizeSY = e.clientY;
          var rect = win.getBoundingClientRect();
          resizeSRect = { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
          win.style.left   = rect.left   + 'px';
          win.style.top    = rect.top    + 'px';
          win.style.width  = rect.width  + 'px';
          win.style.height = rect.height + 'px';
          win.style.right  = 'auto';
          win.style.bottom = 'auto';
        });
      });

      // 터치 드래그 (모바일)
      titlebar.addEventListener('touchstart', function(e) {
        if (win.classList.contains('maximized')) return;
        var t = e.touches[0];
        var rect = win.getBoundingClientRect();
        win.style.left   = rect.left + 'px';
        win.style.top    = rect.top  + 'px';
        win.style.right  = 'auto';
        win.style.bottom = 'auto';
        dragging = true;
        dragOX = t.clientX - rect.left;
        dragOY = t.clientY - rect.top;
      }, { passive: true });

      document.addEventListener('touchmove', function(e) {
        if (!dragging) return;
        var t = e.touches[0];
        var x = Math.max(0, Math.min(window.innerWidth  - win.offsetWidth,  t.clientX - dragOX));
        var y = Math.max(0, Math.min(window.innerHeight - 40, t.clientY - dragOY));
        win.style.left = x + 'px';
        win.style.top  = y + 'px';
      }, { passive: true });

      document.addEventListener('touchend', function() { dragging = false; });

      // ── 입력 이벤트 ──
      // Enter: form submit (가장 안정적인 크로스-브라우저 방식)
      if (form) {
        form.addEventListener('submit', function(e) {
          e.preventDefault();
          if (!termInput) return;
          processCmd(termInput.value);
          termInput.value = '';
          termInput.focus();
        });
      }

      // 화살표키(히스토리) + Tab(자동완성)만 keydown으로 처리
      if (termInput) {
        termInput.addEventListener('keydown', function(e) {
          if (e.key === 'ArrowUp' || e.keyCode === 38) {
            e.preventDefault();
            if (histIdx > 0) termInput.value = history[--histIdx];
          } else if (e.key === 'ArrowDown' || e.keyCode === 40) {
            e.preventDefault();
            termInput.value = histIdx < history.length-1 ? history[++histIdx] : (histIdx=history.length,'');
          } else if (e.key === 'Tab' || e.keyCode === 9) {
            e.preventDefault();
            var val = termInput.value;
            var valTrim = val.trim().toLowerCase();
            var cmds = ['help','about','whoami','ls','cd','pwd','search','grep','date','echo','clear','github','exit'];
            if (!val.trim().includes(' ')) {
              var tm = cmds.filter(function(c){ return c.startsWith(valTrim); });
              if (tm.length === 1) termInput.value = tm[0] + ' ';
            } else {
              // cd/open 이후 자식 이름 자동완성
              var spIdx = val.indexOf(' ');
              var tabCmd = val.slice(0, spIdx).toLowerCase();
              var tabArg = val.slice(spIdx + 1).toLowerCase();
              if (tabCmd === 'cd') {
                var tabKids = (getCwdNode().children || []).map(function(c){ return c.label; });
                var tabM = tabKids.filter(function(n){ return n.toLowerCase().startsWith(tabArg); });
                if (tabM.length === 1) termInput.value = tabCmd + ' ' + tabM[0];
                else if (tabM.length > 1) {
                  addOutput(val.trim(), tabM.map(function(n){ return '<span style="color:#58a6ff">' + esc(n) + '</span>'; }).join('  '));
                }
              }
            }
          }
        });
      }

      if (output) {
        output.addEventListener('click', function(e) {
          if (e.target.tagName !== 'A') termInput && termInput.focus();
        });
      }
    })();

    // ============================================================
    // 가상 브라우저 창 (드래그 가능, 최소화/최대화/닫기)
    // ============================================================
    (function() {
      var bwin     = document.getElementById('dyoBrowserWin');
      var btbar    = document.getElementById('dyoBrowserTitlebar');
      var bClose   = document.getElementById('dyoBrowserClose');
      var bMin     = document.getElementById('dyoBrowserMin');
      var bMax     = document.getElementById('dyoBrowserMax');
      var bBack    = document.getElementById('dyoBrowserBack');
      var bFwd     = document.getElementById('dyoBrowserFwd');
      var bReload  = document.getElementById('dyoBrowserReload');
      var bUrlBar  = document.getElementById('dyoBrowserUrl');
      var bTabTitle = document.getElementById('dyoBrowserTabTitle');
      var bFrame   = document.getElementById('dyoBrowserFrame');
      if (!bwin || !bFrame || !bUrlBar) return;
      window._dyoBWin = bwin;
      window._dyoBFrame = bFrame;
      window._dyoBUrlBar = bUrlBar;

      var dragging = false, dragOX = 0, dragOY = 0;
      var resizing = false, resizeDir = '', resizeSX = 0, resizeSY = 0, resizeSRect = null;
      var savedPos = null;
      var MIN_W = 360, MIN_H = 200;

      // 브라우저 내비게이션 히스토리 추적
      var bNavHistory = [];
      var bNavIdx = -1;

      function updateBrowserNavBtns() {
        if (bBack) bBack.disabled = bNavIdx <= 0;
        if (bFwd)  bFwd.disabled  = bNavIdx >= bNavHistory.length - 1;
      }

      function openBrowser(url) {
        var fullUrl = url.startsWith('http') ? url : (window.location.origin + url);
        bUrlBar.value = url.startsWith('http')
          ? url.replace(/^https?:\/\//, '')
          : window.location.hostname + (url.startsWith('/') ? url : '/' + url);
        if (bTabTitle) bTabTitle.textContent = '로딩 중…';
        var wasOpen = bwin.classList.contains('open');
        if (!wasOpen) {
          var W = Math.min(1200, window.innerWidth  - 40);
          var H = Math.min(700,  window.innerHeight - 40);
          bwin.style.width  = W + 'px';
          bwin.style.height = H + 'px';
          var _m2 = document.getElementById('dyoMemoWidget');
          var _mT2 = _m2 ? _m2.getBoundingClientRect().top : 28;
          bwin.style.left   = Math.round((window.innerWidth  - W) / 2) + 'px';
          bwin.style.top    = _mT2 + 'px';
          bwin.style.right  = 'auto';
          bwin.style.bottom = 'auto';
          // 새로 열 때 히스토리 초기화
          bNavHistory = [fullUrl];
          bNavIdx = 0;
        } else {
          // 현재 위치 이후 히스토리 잘라내고 새 URL 추가
          bNavHistory = bNavHistory.slice(0, bNavIdx + 1);
          bNavHistory.push(fullUrl);
          bNavIdx = bNavHistory.length - 1;
        }
        updateBrowserNavBtns();
        bwin.classList.add('open');
        bwin.classList.remove('minimized');
        window._dyoZTop = (window._dyoZTop || 9000) + 1;
        bwin.style.zIndex = window._dyoZTop;
        if (!wasOpen && window.dyoAnimOpen) window.dyoAnimOpen(bwin);
        // iframe은 애니메이션 완료 후 로드 (CSS에서 애니메이션 중 visibility:hidden)
        if (!wasOpen) {
          requestAnimationFrame(function() { bFrame.src = fullUrl; });
        } else {
          bFrame.src = fullUrl;
        }
      }

      function closeBrowser() {
        bNavHistory = [];
        bNavIdx = -1;
        updateBrowserNavBtns();
        if (bTabTitle) bTabTitle.textContent = '새 탭';
        if (window.dyoAnimDismiss) {
          window.dyoAnimDismiss(bwin, function() {
            bwin.classList.remove('open', 'minimized', 'maximized');
            bFrame.src = 'about:blank';
            bUrlBar.value = 'about:blank';
            savedPos = null;
          });
        } else {
          bwin.classList.remove('open', 'minimized', 'maximized');
          bFrame.src = 'about:blank';
          bUrlBar.value = 'about:blank';
          savedPos = null;
        }
      }

      function minimizeBrowser() {
        if (bwin.classList.contains('minimized')) {
          var tb = document.querySelector('.dyo-taskbtn[data-win-id="dyoBrowserWin"]');
          window._dyoAnimSrc = tb || null;
          bwin.classList.remove('minimized');
          if (window.dyoAnimOpen) window.dyoAnimOpen(bwin);
        } else {
          if (window.dyoAnimMinimize) {
            window.dyoAnimMinimize(bwin, function() { bwin.classList.add('minimized'); });
          } else {
            bwin.classList.add('minimized');
          }
        }
      }

      function maximizeBrowser() {
        if (bwin.classList.contains('maximized')) {
          bwin.classList.remove('maximized');
          if (savedPos) {
            bwin.style.left   = savedPos.left;
            bwin.style.top    = savedPos.top;
            bwin.style.right  = savedPos.right;
            bwin.style.bottom = savedPos.bottom;
            bwin.style.width  = savedPos.width;
            bwin.style.height = savedPos.height;
            savedPos = null;
          }
          if (window.dyoAnimMaximizeOut) window.dyoAnimMaximizeOut(bwin);
        } else {
          bwin.classList.remove('minimized');
          savedPos = {
            left: bwin.style.left, top: bwin.style.top,
            right: bwin.style.right, bottom: bwin.style.bottom,
            width: bwin.style.width, height: bwin.style.height
          };
          bwin.classList.add('maximized');
          bwin.style.left = bwin.style.top = bwin.style.right =
          bwin.style.bottom = bwin.style.width = bwin.style.height = '';
          if (window.dyoAnimMaximizeIn) window.dyoAnimMaximizeIn(bwin);
        }
      }

      // URL 업데이트 + iframe 내 링크 클릭 인터셉트
      function _bFrameClickHandler(e) {
        var link = e.target.closest ? e.target.closest('a[href]') : null;
        if (!link) {
          var el = e.target;
          while (el && el.tagName !== 'A') el = el.parentElement;
          if (el && el.hasAttribute('href')) link = el;
        }
        if (!link) return;

        var href = link.getAttribute('href');
        if (!href || href === '#' || href.startsWith('#') || href.startsWith('javascript:')) return;

        var isExternal = false, resolved = href;
        try {
          var linkUrl = new URL(href, bFrame.contentWindow.location.href);
          isExternal = (linkUrl.origin !== window.location.origin);
          resolved = isExternal ? linkUrl.href : (linkUrl.pathname + linkUrl.search + linkUrl.hash);
        } catch(ex) {}

        if (isExternal) {
          // 외부 링크 → 확인 다이얼로그(새 창)로 처리, 프레임 안에서는 열지 않음
          e.preventDefault();
          e.stopPropagation();
          if (window.dyoOpenExternal) window.dyoOpenExternal(resolved);
          else window.open(resolved, '_blank', 'noopener');
          return;
        }

        // 같은 출처(블로그 내부) 링크
        var tgt = (link.getAttribute('target') || '').toLowerCase();
        if (tgt && tgt !== '_self') {
          // _blank 등 새 창 지정 링크도 프레임 안에서 이동
          e.preventDefault();
          e.stopPropagation();
          openBrowser(resolved);
        }
        // target 미지정/_self → iframe이 자연스럽게 이동, load 이벤트가 주소·히스토리 추적
      }

      var _lastIframeDoc = null;
      var _bNavFromBtn = false; // 뒤로/앞으로 버튼에 의한 로드 여부
      bFrame.addEventListener('load', function() {
        try {
          var loc = bFrame.contentWindow.location.href;
          if (loc && loc !== 'about:blank' && loc !== 'about:srcdoc') {
            if (document.activeElement !== bUrlBar) bUrlBar.value = loc.replace(/^https?:\/\//, '');
            // 뒤로/앞으로 버튼이 아닌 iframe 내부 네비게이션 추적
            if (!_bNavFromBtn && bNavHistory.length > 0 && loc !== bNavHistory[bNavIdx]) {
              bNavHistory = bNavHistory.slice(0, bNavIdx + 1);
              bNavHistory.push(loc);
              bNavIdx = bNavHistory.length - 1;
              updateBrowserNavBtns();
            }
            _bNavFromBtn = false;
          }

          var iframeDoc = bFrame.contentDocument || bFrame.contentWindow.document;
          // 탭 제목을 현재 페이지 제목으로 갱신 (단일 탭)
          if (bTabTitle) {
            var pageTitle = (iframeDoc && iframeDoc.title) ? iframeDoc.title.trim() : '';
            bTabTitle.textContent = pageTitle || '새 탭';
            bTabTitle.parentNode.title = pageTitle || '';
          }
          // 이전 문서의 리스너 제거 후 새 문서에 등록 (중복 방지)
          if (_lastIframeDoc && _lastIframeDoc !== iframeDoc) {
            try { _lastIframeDoc.removeEventListener('click', _bFrameClickHandler, true); } catch(ex) {}
          }
          iframeDoc.addEventListener('click', _bFrameClickHandler, true);
          _lastIframeDoc = iframeDoc;

          try {
            bFrame.contentWindow.__dyoInBrowser = true;
          } catch(ex) {}
        } catch(e) { /* cross-origin: 무시 */ }
      });

      // 전역 노출
      window.dyoOpenBrowser = openBrowser;

      // 창 포커스 (z-index 최상위)
      function bringToFront() {
        window._dyoZTop = (window._dyoZTop || 9000) + 1;
        bwin.style.zIndex = window._dyoZTop;
      }
      bwin.addEventListener('mousedown', bringToFront);

      if (bClose)  bClose.addEventListener('click',  closeBrowser);
      if (bMin)    bMin.addEventListener('click',    minimizeBrowser);
      if (bMax)    bMax.addEventListener('click',    maximizeBrowser);
      if (bBack) bBack.addEventListener('click', function() {
        if (bNavIdx <= 0) return;
        bNavIdx--;
        _bNavFromBtn = true;
        bFrame.src = bNavHistory[bNavIdx];
        updateBrowserNavBtns();
        bUrlBar.value = bNavHistory[bNavIdx].replace(/^https?:\/\//, '');
      });
      if (bFwd) bFwd.addEventListener('click', function() {
        if (bNavIdx >= bNavHistory.length - 1) return;
        bNavIdx++;
        _bNavFromBtn = true;
        bFrame.src = bNavHistory[bNavIdx];
        updateBrowserNavBtns();
        bUrlBar.value = bNavHistory[bNavIdx].replace(/^https?:\/\//, '');
      });
      if (bReload) bReload.addEventListener('click', function() { try { bFrame.contentWindow.location.reload(); } catch(e){ bFrame.src = bFrame.src; } });
      // 현재 iframe이 실제로 보고 있는 URL 반환 (내부 네비게이션으로 stale 해진 bFrame.src 보정)
      function currentBrowserUrl() {
        var url = null;
        try { url = bFrame.contentWindow.location.href; } catch(e) { url = null; }
        if (!url || url === 'about:blank') url = bNavHistory[bNavIdx] || bFrame.src;
        return url;
      }

      var bNewTab = document.getElementById('dyoBrowserNewTab');
      if (bNewTab) bNewTab.addEventListener('click', function() {
        var url = currentBrowserUrl();
        if (url && url !== 'about:blank') window.open(url, '_blank', 'noopener');
      });

      // 더블클릭 타이틀바 → 최대화 토글
      btbar.addEventListener('dblclick', function(e) {
        if (e.target === bClose || e.target === bMin || e.target === bMax) return;
        maximizeBrowser();
      });

      // 드래그 (마우스)
      btbar.addEventListener('mousedown', function(e) {
        if (bwin.classList.contains('maximized')) return;
        if (e.target === bClose || e.target === bMin || e.target === bMax) return;
        var rect = bwin.getBoundingClientRect();
        bwin.style.left   = rect.left + 'px';
        bwin.style.top    = rect.top  + 'px';
        bwin.style.right  = 'auto';
        bwin.style.bottom = 'auto';
        dragging = true;
        dragOX = e.clientX - rect.left;
        dragOY = e.clientY - rect.top;
        bFrame.style.pointerEvents = 'none';
        e.preventDefault();
      });

      document.addEventListener('mousemove', function(e) {
        if (dragging) {
          var x = Math.max(0, Math.min(window.innerWidth  - bwin.offsetWidth,  e.clientX - dragOX));
          var y = Math.max(0, Math.min(window.innerHeight - 40, e.clientY - dragOY));
          bwin.style.left = x + 'px';
          bwin.style.top  = y + 'px';
        }
        if (resizing) {
          var dx = e.clientX - resizeSX;
          var dy = e.clientY - resizeSY;
          var r = resizeSRect;
          var newL = r.left, newT = r.top, newW = r.width, newH = r.height;
          if (resizeDir.indexOf('e') !== -1) newW = Math.max(MIN_W, r.width + dx);
          if (resizeDir.indexOf('s') !== -1) newH = Math.max(MIN_H, r.height + dy);
          if (resizeDir.indexOf('w') !== -1) { newW = Math.max(MIN_W, r.width - dx); newL = r.left + r.width - newW; }
          if (resizeDir.indexOf('n') !== -1) { newH = Math.max(MIN_H, r.height - dy); newT = r.top + r.height - newH; }
          bwin.style.left   = newL + 'px';
          bwin.style.top    = newT + 'px';
          bwin.style.width  = newW + 'px';
          bwin.style.height = newH + 'px';
        }
      });

      document.addEventListener('mouseup', function() {
        if (dragging || resizing) bFrame.style.pointerEvents = '';
        dragging = false;
        resizing = false;
      });

      // 리사이즈 핸들 (마우스)
      bwin.querySelectorAll('.dyo-brs-handle').forEach(function(handle) {
        handle.addEventListener('mousedown', function(e) {
          if (bwin.classList.contains('maximized') || bwin.classList.contains('minimized')) return;
          e.stopPropagation();
          e.preventDefault();
          resizing = true;
          resizeDir = handle.getAttribute('data-dir');
          resizeSX = e.clientX;
          resizeSY = e.clientY;
          var rect = bwin.getBoundingClientRect();
          resizeSRect = { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
          bwin.style.left   = rect.left   + 'px';
          bwin.style.top    = rect.top    + 'px';
          bwin.style.width  = rect.width  + 'px';
          bwin.style.height = rect.height + 'px';
          bwin.style.right  = 'auto';
          bwin.style.bottom = 'auto';
          bFrame.style.pointerEvents = 'none';
        });
      });

      // 드래그 (터치)
      btbar.addEventListener('touchstart', function(e) {
        if (bwin.classList.contains('maximized')) return;
        var t = e.touches[0];
        var rect = bwin.getBoundingClientRect();
        bwin.style.left   = rect.left + 'px';
        bwin.style.top    = rect.top  + 'px';
        bwin.style.right  = 'auto';
        bwin.style.bottom = 'auto';
        dragging = true;
        dragOX = t.clientX - rect.left;
        dragOY = t.clientY - rect.top;
      }, { passive: true });

      document.addEventListener('touchmove', function(e) {
        if (!dragging) return;
        var t = e.touches[0];
        var x = Math.max(0, Math.min(window.innerWidth  - bwin.offsetWidth,  t.clientX - dragOX));
        var y = Math.max(0, Math.min(window.innerHeight - 40, t.clientY - dragOY));
        bwin.style.left = x + 'px';
        bwin.style.top  = y + 'px';
      }, { passive: true });

      document.addEventListener('touchend', function() { dragging = false; });
    })();
  