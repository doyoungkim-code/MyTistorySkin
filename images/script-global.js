    // ======================================================
    // 전역 ESC → 최전면 창 닫기
    // ======================================================
    document.addEventListener('keydown', function(e) {
      if (e.key !== 'Escape') return;
      if (document.querySelector('.dyo-ctx-menu.show')) return;
      var wins = document.querySelectorAll(
        '.dyo-shell-win.open:not(.minimized), .dyo-browser-win.open:not(.minimized)'
      );
      var top = null, topZ = -1;
      wins.forEach(function(w) {
        var z = parseInt(w.style.zIndex) || 0;
        if (z > topZ) { topZ = z; top = w; }
      });
      if (!top) return;
      if (window.dyoAnimDismiss) {
        window.dyoAnimDismiss(top, function() { top.classList.remove('open', 'minimized', 'maximized'); });
      } else {
        top.classList.remove('open', 'minimized', 'maximized');
      }
    });

    // ======================================================
    // 튜토리얼
    // ======================================================
    (function() {
      var TUT_KEY = 'dyo_tut_v1';

      var overlay   = document.getElementById('dyoTutorial');
      var spotlight = document.getElementById('dyoTutSpotlight');
      var box       = document.getElementById('dyoTutBox');
      var emojiEl   = document.getElementById('dyoTutEmoji');
      var titleEl   = document.getElementById('dyoTutTitle');
      var descEl    = document.getElementById('dyoTutDesc');
      var dotsEl    = document.getElementById('dyoTutDots');
      var skipBtn   = document.getElementById('dyoTutSkip');
      var nextBtn   = document.getElementById('dyoTutNext');
      if (!overlay) return;

      var previewEl = document.getElementById('dyoTutPreview');

      // ── 더미 콘텐츠 헬퍼 ──────────────────────────────────────
      function _blogCard(title, date, tag) {
        return '<div style="width:210px;border:1px solid #d0d7de;border-radius:8px;padding:12px;background:#fff;">' +
          '<div style="font-size:10px;color:#0969da;margin-bottom:5px;font-weight:600">' + tag + '</div>' +
          '<div style="font-size:12px;font-weight:600;color:#1f2328;margin-bottom:6px;line-height:1.4">' + title + '</div>' +
          '<div style="font-size:10px;color:#656d76">' + date + '</div>' +
          '</div>';
      }
      function _expItem(icon, label) {
        return '<div class="dyo-exp-item">' +
          '<div class="dyo-exp-item-icon">' + icon + '</div>' +
          '<div class="dyo-exp-item-label">' + label + '</div>' +
          '</div>';
      }
      function _chatRow(name, text, role, time) {
        return '<div class="dyo-chat-row ' + role + '">' +
          '<div class="dyo-chat-wrap">' +
          '<div class="dyo-chat-name">' + name + '</div>' +
          '<div class="dyo-chat-bwrap"><div class="dyo-chat-bubble">' + text + '</div></div>' +
          '<div class="dyo-chat-time">' + time + '</div>' +
          '</div></div>';
      }

      // 더미 데이터를 클론에 주입
      function injectDummyContent(clone, winId) {
        if (winId === 'dyoBrowserWin') {
          var frame = clone.querySelector('iframe');
          if (frame) {
            var fakeDiv = document.createElement('div');
            fakeDiv.style.cssText = 'width:100%;height:100%;background:#f6f8fa;overflow:auto;padding:20px;box-sizing:border-box;font-family:"Segoe UI",sans-serif;';
            fakeDiv.innerHTML =
              '<div style="display:flex;flex-wrap:wrap;gap:14px;">' +
              _blogCard('JavaScript 클로저 완전 정복', '2024.12.15', 'JavaScript') +
              _blogCard('React 18 주요 변경사항', '2024.12.10', 'React') +
              _blogCard('TypeScript 유틸리티 타입', '2024.12.05', 'TypeScript') +
              _blogCard('Git 브랜치 전략 A to Z', '2024.11.28', 'Git') +
              _blogCard('Docker 입문 가이드', '2024.11.15', 'DevOps') +
              _blogCard('CSS Grid vs Flexbox', '2024.11.10', 'CSS') +
              '</div>';
            frame.parentNode.replaceChild(fakeDiv, frame);
          }
          var urlBar = clone.querySelector('.dyo-browser-url');
          if (urlBar) urlBar.value = 'https://doyoucoding.tistory.com';
        } else if (winId === 'dyoExplorerWin') {
          var tree = clone.querySelector('#dyoExplorerTree');
          var main = clone.querySelector('#dyoExplorerMain');
          var addr = clone.querySelector('#dyoExpAddrBar');
          if (tree) {
            tree.innerHTML =
              '<div class="dyo-tree-item active" style="padding-left:4px">📁 Blog</div>' +
              '<div class="dyo-tree-children">' +
              '<div class="dyo-tree-item" style="padding-left:18px">📁 JavaScript</div>' +
              '<div class="dyo-tree-item" style="padding-left:18px">📁 React</div>' +
              '<div class="dyo-tree-item" style="padding-left:18px">📁 TypeScript</div>' +
              '<div class="dyo-tree-item" style="padding-left:18px">📁 DevOps</div>' +
              '<div class="dyo-tree-item" style="padding-left:18px">📁 Algorithm</div>' +
              '<div class="dyo-tree-item" style="padding-left:18px">📁 CSS</div>' +
              '</div>';
          }
          if (main) {
            main.innerHTML =
              '<div class="dyo-explorer-grid" style="padding:10px;">' +
              _expItem('📁', 'JavaScript') +
              _expItem('📁', 'React') +
              _expItem('📁', 'TypeScript') +
              _expItem('📁', 'DevOps') +
              _expItem('📁', 'Algorithm') +
              _expItem('📁', 'CSS') +
              '</div>';
          }
          if (addr) {
            addr.innerHTML = '<span class="dyo-exp-crumb current">📁&nbsp;Blog</span>';
          }
        } else if (winId === 'dyoGuestWin') {
          var loading = clone.querySelector('#dyoGuestLoading');
          var chat    = clone.querySelector('#dyoGuestChat');
          var footer  = clone.querySelector('#dyoGuestFooter');
          // 미리보기에선 입력 푸터 숨김 → 채팅 영역이 꽉 차서 실제 대화처럼 보임
          if (footer)  footer.style.display  = 'none';
          if (loading) loading.style.display = 'none';
          if (chat) {
            chat.style.display = 'flex';
            chat.innerHTML =
              _chatRow('dummy', '방명록입니다.', 'visitor', '2025. 1. 1. 12:00') +
              _chatRow('doyoucode', '반갑습니다 😊', 'admin', '2025. 1. 1. 12:05') +
              _chatRow('dummy', '블로그 잘 보고 있어요 ㅎㅎ', 'visitor', '2025. 1. 15. 14:30') +
              _chatRow('doyoucode', '감사합니다! 자주 놀러오세요 :)', 'admin', '2025. 1. 15. 14:45');
          }
        }
      }

      // 실제 창 요소를 클론해서 오른쪽 패널에 표시
      function showWinPreview(winId) {
        previewEl.innerHTML = '';
        if (!winId) { previewEl.classList.add('hidden'); return; }
        var win = document.getElementById(winId);
        if (!win) { previewEl.classList.add('hidden'); return; }

        // 각 창의 고정 크기 (CSS 기본값 기준, inline 리사이즈 무시)
        var winW = winId === 'dyoBrowserWin'  ? 860
                 : winId === 'dyoExplorerWin' ? 580
                 : winId === 'dyoGuestWin'    ? 360
                 : 680;
        var winH = winId === 'dyoBrowserWin'  ? 580
                 : winId === 'dyoExplorerWin' ? 400
                 : winId === 'dyoGuestWin'    ? 580
                 : 440;

        // 뷰포트 기준으로 스케일 계산 (오른쪽 절반 공간에 맞춤)
        var maxH = window.innerHeight - 120;
        var maxW = window.innerWidth * 0.5 - 80;
        var scale = Math.min(maxH / winH, maxW / winW, 1);
        var scaledW = Math.round(winW * scale);
        var scaledH = Math.round(winH * scale);

        var clone = win.cloneNode(true);
        clone.removeAttribute('id');
        injectDummyContent(clone, winId);

        // .dyo-shell-win이 font-mono를 상속하므로 방명록은 ID 없이 폰트가 깨짐 → 인라인으로 강제
        var guestFont = winId === 'dyoGuestWin'
          ? 'font-family:\'Noto Sans KR\',\'Apple SD Gothic Neo\',-apple-system,sans-serif !important;'
          : '';
        clone.style.cssText =
          'position:static !important;display:flex !important;' +
          'width:' + winW + 'px !important;height:' + winH + 'px !important;' +
          'transform:scale(' + scale + ');transform-origin:top left;' +
          'pointer-events:none;flex-shrink:0;border-radius:12px;overflow:hidden;' +
          'box-sizing:border-box;bottom:auto !important;right:auto !important;' +
          'top:auto !important;left:auto !important;z-index:auto !important;' +
          guestFont;

        var viewport = document.createElement('div');
        viewport.style.cssText =
          'width:' + scaledW + 'px;height:' + scaledH + 'px;' +
          'overflow:hidden;border-radius:10px;' +
          'box-shadow:0 8px 40px rgba(0,0,0,0.8);pointer-events:none;flex-shrink:0;';
        viewport.appendChild(clone);
        previewEl.appendChild(viewport);
        previewEl.classList.remove('hidden');
      }

      var steps = [
        {
          target: null,
          emoji: '👋',
          title: '안녕하세요!',
          desc: '이 블로그는 desktop 화면처럼 꾸며진 개발 블로그 \'Do you Coding?\' 입니다. 함께 둘러볼까요?',
          previewWin: null
        },
        {
          target: 'desktopIconReadme',
          emoji: '📄',
          title: 'README',
          desc: '블로그 소개, 사용법 등을 볼 수 있습니다. 블로그의 전체적인 기능을 여기서 확인하세요.',
          previewWin: 'dyoReadmeWin'
        },
        {
          target: 'desktopIconBlog',
          emoji: '🌐',
          title: 'Dev Blog',
          desc: '블로그 글 전체보기로 이동합니다. 작성된 포스트를 한눈에 확인해보세요.',
          previewWin: 'dyoBrowserWin'
        },
        {
          target: 'desktopIconShell',
          emoji: '⌨️',
          title: 'Terminal',
          desc: '커스텀 터미널로 다양한 명령어를 입력할 수 있습니다.\n`help`를 입력해 보세요.',
          previewWin: 'dyoShellWin'
        },
        {
          target: 'desktopIconExplorer',
          emoji: '📂',
          title: 'File Explorer',
          desc: '카테고리 별 포스트를 파일 탐색기 형식으로 탐색할 수 있습니다.',
          previewWin: 'dyoExplorerWin'
        },
        {
          target: 'desktopIconGuest',
          emoji: '💬',
          title: 'Guestbook',
          desc: '방명록에 방문 흔적을 남겨주세요!\n여러분의 댓글을 환영합니다.',
          previewWin: 'dyoGuestWin'
        },
        {
          target: null,
          emoji: '🎉',
          title: '준비 완료!',
          desc: '이제 자유롭게 탐색하세요.\n우클릭 메뉴에서 언제든 튜토리얼을 다시 볼 수 있습니다.',
          last: true,
          previewWin: null
        }
      ];

      var currentStep = 0;

      function applySpotlight(targetId) {
        if (!targetId) {
          spotlight.classList.add('no-target');
          var cx = window.innerWidth / 2;
          var cy = window.innerHeight / 2;
          spotlight.style.left   = cx + 'px';
          spotlight.style.top    = cy + 'px';
          spotlight.style.width  = '0px';
          spotlight.style.height = '0px';
          return;
        }
        spotlight.classList.remove('no-target');
        var el = document.getElementById(targetId);
        if (!el) { applySpotlight(null); return; }
        var r   = el.getBoundingClientRect();
        var pad = 12;
        spotlight.style.left   = (r.left   - pad) + 'px';
        spotlight.style.top    = (r.top    - pad) + 'px';
        spotlight.style.width  = (r.width  + pad * 2) + 'px';
        spotlight.style.height = (r.height + pad * 2) + 'px';
      }

      function positionBox(targetId) {
        var bw = box.offsetWidth  || 300;
        var bh = box.offsetHeight || 220;
        var margin = 20;
        var vw = window.innerWidth;
        var vh = window.innerHeight;

        if (!targetId) {
          box.style.left = Math.round((vw - bw) / 2) + 'px';
          box.style.top  = Math.round((vh - bh) / 2) + 'px';
          return;
        }
        var el = document.getElementById(targetId);
        if (!el) { positionBox(null); return; }
        var r = el.getBoundingClientRect();

        // 오른쪽에 공간이 있으면 오른쪽, 없으면 왼쪽
        var leftRight;
        if (r.right + margin + bw < vw) {
          leftRight = r.right + margin;
        } else {
          leftRight = r.left - bw - margin;
        }
        leftRight = Math.max(8, Math.min(leftRight, vw - bw - 8));

        // 수직 중앙 정렬, 화면 밖 보정
        var topPos = Math.round(r.top + r.height / 2 - bh / 2);
        topPos = Math.max(8, Math.min(topPos, vh - bh - 8));

        box.style.left = leftRight + 'px';
        box.style.top  = topPos   + 'px';
      }

      function buildDots(total, current) {
        dotsEl.innerHTML = '';
        for (var i = 0; i < total; i++) {
          var d = document.createElement('span');
          d.className = 'dyo-tut-dot' + (i === current ? ' active' : '');
          dotsEl.appendChild(d);
        }
      }

      function showStep(idx) {
        var step = steps[idx];
        emojiEl.textContent = step.emoji;
        titleEl.textContent = step.title;
        descEl.textContent  = step.desc;
        nextBtn.textContent = step.last ? '완료 ✓' : 'Next →';
        buildDots(steps.length, idx);

        // 실제 창 클론 미리보기
        showWinPreview(step.previewWin);

        applySpotlight(step.target);
        // 박스 위치: 즉시 설정 (초기) 후 스팟라이트 전환 뒤 재조정
        positionBox(step.target);
        setTimeout(function() { positionBox(step.target); }, 50);
      }

      function closeTutorial() {
        overlay.classList.remove('active');
        setTimeout(function() { overlay.style.display = 'none'; }, 400);
      }

      var launcherBtn = document.getElementById('dyoTutLauncher');

      function endTutorial() {
        localStorage.setItem(TUT_KEY, '1');
        closeTutorial();
        if (launcherBtn) launcherBtn.classList.add('hidden');
      }

      if (!skipBtn || !nextBtn) return;
      skipBtn.addEventListener('click', endTutorial);
      nextBtn.addEventListener('click', function() {
        currentStep++;
        if (currentStep >= steps.length) {
          endTutorial();
        } else {
          showStep(currentStep);
        }
      });

      // ESC 로 닫기
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && overlay.classList.contains('active')) {
          endTutorial();
        }
      });

      window.dyoStartTutorial = function() {
        currentStep = 0;
        if (launcherBtn) launcherBtn.classList.add('hidden');
        overlay.style.display = '';
        requestAnimationFrame(function() {
          overlay.classList.add('active');
          showStep(0);
        });
      };

      // 튜토리얼 미완료 시 런처 버튼 표시
      window.dyoMaybeStartTutorial = function() {
        if (!localStorage.getItem(TUT_KEY) && launcherBtn) {
          launcherBtn.classList.remove('hidden');
        }
      };

      if (launcherBtn) {
        launcherBtn.addEventListener('click', function() {
          window.dyoStartTutorial();
        });
      }
    })();

    // ============================================================
    // Music Player
    // ============================================================
    (function() {
      var w        = document.getElementById('dyoMusicWin');
      var titlebar = document.getElementById('dyoMusicTitlebar');
      var closeBtn = document.getElementById('dyoMusicClose');
      var minBtn   = document.getElementById('dyoMusicMin');
      var maxBtn   = document.getElementById('dyoMusicMax');
      if (!w) return;

      // 태스크바 뮤직 미니 위젯
      var tbMusic  = document.getElementById('dyoTbMusic');
      var tbTitle  = document.getElementById('dyoTbmTitle');
      var tbPlay   = document.getElementById('dyoTbmPlay');
      var tbVol    = document.getElementById('dyoTbmVol');
      var tbOpen   = document.getElementById('dyoTbmOpen');

      var artEl    = document.getElementById('dyoMusicArt');
      var thumbEl  = document.getElementById('dyoMusicThumb');
      var songEl   = document.getElementById('dyoMusicSong');
      var chanEl   = document.getElementById('dyoMusicChan');
      var seekEl   = document.getElementById('dyoMusicSeek');
      var fillEl   = document.getElementById('dyoMusicSeekFill');
      var knobEl   = document.getElementById('dyoMusicSeekKnob');
      var curEl    = document.getElementById('dyoMusicCur');
      var durEl    = document.getElementById('dyoMusicDur');
      var playBtn  = document.getElementById('dyoMusicPlay');
      var prevBtn  = document.getElementById('dyoMusicPrev');
      var nextBtn  = document.getElementById('dyoMusicNext');
      var volEl    = document.getElementById('dyoMusicVol');
      var listEl   = document.getElementById('dyoMusicList');

      var PLAYLIST = [
        { id: 'uTuuz__8gUM', title: '', artist: '' },
        { id: 'CfPxlb8-ZQ0', title: '', artist: '' },
        { id: 'HfaIcB4Ogxk', title: '', artist: '' },
        { id: 'hOJ76cZEt08', title: '', artist: '' }
      ];

      var curIdx         = 0;
      var ytPlayer       = null;
      var isPlaying      = false;
      var progressTimer  = null;
      var autoPlayOnReady = false;
      var dragging = false, dragOX = 0, dragOY = 0;
      var savedPos = null;
      var seeking  = false;

      function bringToFront() {
        window._dyoZTop = (window._dyoZTop || 9000) + 1;
        w.style.zIndex = window._dyoZTop;
      }
      w.addEventListener('mousedown', bringToFront);

      // ── 창 관리 ─────────────────────────────────────────────
      // ── 태스크바 뮤직 미니 위젯 ─────────────────────────────
      function updateTbPlayIcon() {
        if (!tbPlay) return;
        var pi = tbPlay.querySelector('.dyo-tbm-icon-play');
        var pa = tbPlay.querySelector('.dyo-tbm-icon-pause');
        if (pi) pi.style.display = isPlaying ? 'none' : '';
        if (pa) pa.style.display = isPlaying ? ''     : 'none';
        if (tbMusic) tbMusic.classList.toggle('playing', isPlaying);
      }
      function showTbMusic() {
        if (!tbMusic) return;
        var t = PLAYLIST[curIdx];
        if (tbTitle) tbTitle.textContent = t.title || ('Track ' + (curIdx + 1));
        if (tbVol)   tbVol.value = volEl ? volEl.value : 70;
        updateTbPlayIcon();
        tbMusic.classList.add('show');
      }
      function hideTbMusic() {
        if (tbMusic) tbMusic.classList.remove('show');
      }
      if (tbPlay) {
        tbPlay.addEventListener('click', function() {
          if (!ytPlayer) { openMusic(); return; }
          isPlaying ? ytPlayer.pauseVideo() : ytPlayer.playVideo();
        });
      }
      if (tbVol) {
        tbVol.addEventListener('input', function() {
          if (volEl) volEl.value = this.value;
          if (ytPlayer && ytPlayer.setVolume) ytPlayer.setVolume(parseInt(this.value, 10));
        });
      }
      if (tbOpen) {
        tbOpen.addEventListener('click', function() { openMusic(); });
      }
      if (tbTitle) {
        tbTitle.addEventListener('click', function() { openMusic(); });
      }

      function openMusic() {
        var wasOpen = w.classList.contains('open');
        if (!wasOpen) {
          var GAP_RIGHT  = 8;
          var GAP_TOP    = 8;
          var GAP_BOTTOM = 68; // 하단 바(52px) + 여유 16px
          var W = 260;
          var H = window.innerHeight - GAP_TOP - GAP_BOTTOM;
          w.style.width  = W + 'px';
          w.style.height = H + 'px';
          w.style.left   = (window.innerWidth - W - GAP_RIGHT) + 'px';
          w.style.top    = GAP_TOP + 'px';
          w.style.right  = 'auto';
          w.style.bottom = 'auto';
        }
        w.classList.add('open');
        w.classList.remove('minimized');
        window._dyoZTop = (window._dyoZTop || 9000) + 1;
        w.style.zIndex = window._dyoZTop;
        if (!wasOpen && window.dyoAnimOpen) window.dyoAnimOpen(w);
        if (!ytPlayer) { loadYTAPI(); }
        renderPlaylist();
        updateMeta(curIdx);
      }
      function closeMusic() {
        var doClose = function() {
          w.classList.remove('open','minimized','maximized');
          savedPos = null;
        };
        if (window.dyoAnimDismiss) {
          window.dyoAnimDismiss(w, doClose);
        } else {
          doClose();
        }
      }
      function minimizeMusic() {
        if (w.classList.contains('minimized')) {
          // 최소화 복원
          var tb = document.querySelector('.dyo-dock-item[data-win-id="dyoMusicWin"]') || document.querySelector('.dyo-taskbtn[data-win-id="dyoMusicWin"]');
          window._dyoAnimSrc = tb || null;
          w.classList.remove('minimized');
          if (window.dyoAnimOpen) window.dyoAnimOpen(w);
        } else {
          if (w.classList.contains('maximized')) {
            w.classList.remove('maximized');
            if (savedPos) { w.style.left=savedPos.left; w.style.top=savedPos.top; w.style.right=savedPos.right; w.style.bottom=savedPos.bottom; w.style.width=savedPos.width; w.style.height=savedPos.height; savedPos=null; }
          }
          var doMin = function() {
            w.classList.add('minimized');
          };
          if (window.dyoAnimMinimize) { window.dyoAnimMinimize(w, doMin); }
          else { doMin(); }
        }
      }
      function maximizeMusic() {
        if (w.classList.contains('maximized')) {
          w.classList.remove('maximized');
          if (savedPos) { w.style.left=savedPos.left; w.style.top=savedPos.top; w.style.right=savedPos.right; w.style.bottom=savedPos.bottom; w.style.width=savedPos.width; w.style.height=savedPos.height; savedPos=null; }
          if (window.dyoAnimMaximizeOut) window.dyoAnimMaximizeOut(w);
        } else {
          w.classList.remove('minimized');
          savedPos = { left:w.style.left, top:w.style.top, right:w.style.right, bottom:w.style.bottom, width:w.style.width, height:w.style.height };
          w.classList.add('maximized');
          if (window.dyoAnimMaximizeIn) window.dyoAnimMaximizeIn(w);
        }
      }

      closeBtn.addEventListener('click', closeMusic);
      minBtn.addEventListener('click', minimizeMusic);
      maxBtn.addEventListener('click', maximizeMusic);

      titlebar.addEventListener('dblclick', function(e) {
        if (e.target === closeBtn || e.target === minBtn || e.target === maxBtn) return;
        maximizeMusic();
      });

      titlebar.addEventListener('mousedown', function(e) {
        if (e.button !== 0 || w.classList.contains('maximized')) return;
        if (e.target===closeBtn || e.target===minBtn || e.target===maxBtn) return;
        dragging = true;
        dragOX = e.clientX - w.getBoundingClientRect().left;
        dragOY = e.clientY - w.getBoundingClientRect().top;
        w.style.right = 'auto'; w.style.bottom = 'auto';
        window._dyoZTop = (window._dyoZTop || 9000) + 1;
        w.style.zIndex = window._dyoZTop;
        e.preventDefault();
      });
      document.addEventListener('mousemove', function(e) {
        if (!dragging) return;
        w.style.left = Math.max(0, Math.min(e.clientX - dragOX, window.innerWidth  - w.offsetWidth))  + 'px';
        w.style.top  = Math.max(0, Math.min(e.clientY - dragOY, window.innerHeight - w.offsetHeight)) + 'px';
      });
      document.addEventListener('mouseup', function() { dragging = false; });

      // ── 리사이즈 핸들 ──────────────────────────────────────────
      w.querySelectorAll('.dyo-brs-handle').forEach(function(handle) {
        handle.addEventListener('mousedown', function(e) {
          if (w.classList.contains('maximized') || w.classList.contains('minimized')) return;
          e.stopPropagation(); e.preventDefault();
          var dir = handle.className.replace(/dyo-brs-handle/g, '').trim();
          var r = w.getBoundingClientRect();
          var sx = e.clientX, sy = e.clientY;
          var sl = r.left, st = r.top, sw = r.width, sh = r.height;
          function onMove(ev) {
            var dx = ev.clientX - sx, dy = ev.clientY - sy;
            var nl = sl, nt = st, nw = sw, nh = sh;
            if (dir.indexOf('e') !== -1) nw = Math.max(280, sw + dx);
            if (dir.indexOf('s') !== -1) nh = Math.max(400, sh + dy);
            if (dir.indexOf('w') !== -1) { nw = Math.max(280, sw - dx); nl = sl + sw - nw; }
            if (dir.indexOf('n') !== -1) { nh = Math.max(400, sh - dy); nt = st + sh - nh; }
            w.style.width  = nw + 'px'; w.style.height = nh + 'px';
            w.style.left   = nl + 'px'; w.style.top    = nt + 'px';
            w.style.right  = 'auto';    w.style.bottom = 'auto';
          }
          function onUp() {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
          }
          document.addEventListener('mousemove', onMove);
          document.addEventListener('mouseup', onUp);
        });
      });

      // ── YouTube IFrame API ───────────────────────────────────
      function loadYTAPI() {
        if (window.YT && window.YT.Player) { initPlayer(); return; }
        if (!document.getElementById('dyoYTScript')) {
          var s = document.createElement('script');
          s.id  = 'dyoYTScript';
          s.src = 'https://www.youtube.com/iframe_api';
          document.head.appendChild(s);
        }
        var prev = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = function() {
          if (prev) prev();
          initPlayer();
        };
      }
      function initPlayer() {
        if (ytPlayer) return;
        var ytCon = document.getElementById('dyoYTContainer');
        var ytW = ytCon ? (ytCon.offsetWidth  || 320) : 320;
        var ytH = ytCon ? (ytCon.offsetHeight || 180) : 180;
        ytPlayer = new YT.Player('dyoYTPlayer', {
          height: String(ytH), width: String(ytW),
          videoId: PLAYLIST[curIdx].id,
          playerVars: { autoplay: 0, controls: 0, disablekb: 1, fs: 0, iv_load_policy: 3, modestbranding: 1, rel: 0 },
          events: { onReady: onPlayerReady, onStateChange: onStateChange }
        });
      }
      function syncMeta() {
        if (!ytPlayer || !ytPlayer.getVideoData) return;
        var d = ytPlayer.getVideoData();
        if (!d || !d.title) return;
        PLAYLIST[curIdx].title  = d.title;
        PLAYLIST[curIdx].artist = d.author || '';
        songEl.textContent = d.title;
        chanEl.textContent = d.author || '';
        var items = listEl.querySelectorAll('.dyo-pl-title');
        if (items[curIdx]) items[curIdx].textContent = d.title;
        var artists = listEl.querySelectorAll('.dyo-pl-artist');
        if (artists[curIdx]) artists[curIdx].textContent = d.author || '';
        // 태스크바 뮤직 미니 동기화
        if (tbTitle) tbTitle.textContent = d.title;
      }
      function onPlayerReady(e) {
        e.target.setVolume(parseInt(volEl.value, 10));
        var iframe = document.querySelector('#dyoYTContainer iframe');
        if (iframe) { iframe.style.cssText = 'width:100%;height:100%;border:0;display:block;'; }
        syncMeta();
        if (autoPlayOnReady) { autoPlayOnReady = false; e.target.playVideo(); }
      }
      function onStateChange(e) {
        var S = (window.YT && YT.PlayerState) ? YT.PlayerState : { PLAYING:1, PAUSED:2, BUFFERING:3, ENDED:0 };
        if (e.data === S.PLAYING)  { setPlaying(true);  syncMeta(); }
        else if (e.data === S.PAUSED || e.data === S.BUFFERING) { setPlaying(false); }
        else if (e.data === S.ENDED) { handleEnded(); }
      }
      function handleEnded() {
        playTrack((curIdx + 1) % PLAYLIST.length);
      }

      // ── 플레이어 상태 ────────────────────────────────────────
      function setPlaying(val) {
        isPlaying = val;
        var pi = playBtn.querySelector('.dyo-mc-icon-play');
        var pa = playBtn.querySelector('.dyo-mc-icon-pause');
        if (pi) pi.style.display = val ? 'none' : '';
        if (pa) pa.style.display = val ? ''     : 'none';
        if (val) { artEl.classList.add('playing'); startProgress(); }
        else     { artEl.classList.remove('playing'); stopProgress(); }
        // 태스크바 뮤직 미니 동기화
        showTbMusic();
        updateTbPlayIcon();
      }
      function playTrack(idx) {
        curIdx = idx;
        updateMeta(idx);
        renderPlaylist();
        if (ytPlayer && ytPlayer.loadVideoById) ytPlayer.loadVideoById(PLAYLIST[idx].id);
      }
      function updateMeta(idx) {
        var t = PLAYLIST[idx];
        songEl.textContent = t.title;
        chanEl.textContent = t.artist;
        thumbEl.src = 'https://img.youtube.com/vi/' + t.id + '/mqdefault.jpg';
      }

      // ── 진행바 ───────────────────────────────────────────────
      function startProgress() {
        stopProgress();
        progressTimer = setInterval(updateProgress, 1000);
      }
      function stopProgress() {
        if (progressTimer) { clearInterval(progressTimer); progressTimer = null; }
      }
      function updateProgress() {
        if (!ytPlayer || !ytPlayer.getCurrentTime) return;
        var cur = ytPlayer.getCurrentTime() || 0;
        var dur = ytPlayer.getDuration()    || 0;
        curEl.textContent = fmtTime(cur);
        if (dur > 0) {
          durEl.textContent = fmtTime(dur);
          var pct = (cur / dur) * 100;
          fillEl.style.width = pct + '%';
          knobEl.style.left  = pct + '%';
        } else {
          durEl.textContent  = 'LIVE';
          fillEl.style.width = '100%';
          knobEl.style.left  = '100%';
        }
      }
      function fmtTime(s) {
        s = Math.floor(s);
        var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
        return h > 0 ? h + ':' + pad(m) + ':' + pad(sec) : m + ':' + pad(sec);
      }
      function pad(n) { return n < 10 ? '0' + n : '' + n; }

      // ── 컨트롤 이벤트 ────────────────────────────────────────
      playBtn.addEventListener('click', function() {
        if (!ytPlayer) { autoPlayOnReady = true; loadYTAPI(); return; }
        isPlaying ? ytPlayer.pauseVideo() : ytPlayer.playVideo();
      });
      prevBtn.addEventListener('click', function() {
        if (!ytPlayer) return;
        if ((ytPlayer.getCurrentTime() || 0) > 3) { ytPlayer.seekTo(0); return; }
        playTrack((curIdx - 1 + PLAYLIST.length) % PLAYLIST.length);
      });
      nextBtn.addEventListener('click', function() {
        if (!ytPlayer) return;
        playTrack((curIdx + 1) % PLAYLIST.length);
      });
      volEl.addEventListener('input', function() {
        if (ytPlayer && ytPlayer.setVolume) ytPlayer.setVolume(parseInt(this.value, 10));
      });

      // Seek
      seekEl.addEventListener('mousedown', function(e) { seeking = true; doSeek(e); e.preventDefault(); });
      document.addEventListener('mousemove', function(e) { if (seeking) doSeek(e); });
      document.addEventListener('mouseup',   function()  { seeking = false; });
      function doSeek(e) {
        if (!ytPlayer || !ytPlayer.getDuration) return;
        var dur = ytPlayer.getDuration();
        if (!dur || dur <= 0) return;
        var rect = seekEl.getBoundingClientRect();
        var pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        ytPlayer.seekTo(pct * dur, true);
        fillEl.style.width = (pct * 100) + '%';
        knobEl.style.left  = (pct * 100) + '%';
      }

      // ── 플레이리스트 렌더 ────────────────────────────────────
      function renderPlaylist() {
        listEl.innerHTML = '';
        PLAYLIST.forEach(function(track, i) {
          var item = document.createElement('div');
          item.className = 'dyo-music-pl-item' + (i === curIdx ? ' active' : '');
          var eqDelay = [0, 0.2, 0.1];
          var eqDur   = [0.6, 0.8, 0.7];
          var eqSvg =
            '<svg class="dyo-pl-eq" viewBox="0 0 24 24" fill="none">' +
              '<rect x="2"  y="10" width="4" height="10" rx="1" fill="#58a6ff" style="transform-origin:bottom center;animation:dyo-music-eq ' + eqDur[0] + 's ease-in-out infinite ' + eqDelay[0] + 's"/>' +
              '<rect x="10" y="6"  width="4" height="14" rx="1" fill="#58a6ff" style="transform-origin:bottom center;animation:dyo-music-eq ' + eqDur[1] + 's ease-in-out infinite ' + eqDelay[1] + 's"/>' +
              '<rect x="18" y="8"  width="4" height="12" rx="1" fill="#58a6ff" style="transform-origin:bottom center;animation:dyo-music-eq ' + eqDur[2] + 's ease-in-out infinite ' + eqDelay[2] + 's"/>' +
            '</svg>';
          item.innerHTML =
            '<span class="dyo-pl-num">' + (i + 1) + '</span>' +
            eqSvg +
            '<span class="dyo-pl-title">' + track.title + '</span>';
          item.addEventListener('click', function() {
            if (!ytPlayer) { curIdx = i; updateMeta(i); renderPlaylist(); autoPlayOnReady = true; loadYTAPI(); return; }
            if (i === curIdx) { isPlaying ? ytPlayer.pauseVideo() : ytPlayer.playVideo(); }
            else { playTrack(i); }
          });
          listEl.appendChild(item);
        });
      }

      window.dyoOpenMusic = openMusic;

      // 태스크바 뮤직 위젯 초기 표시 (항상 보임)
      showTbMusic();
    })();

    if (document.body.id === 'tt-body-index' && window.dyoMaybeStartTutorial) window.dyoMaybeStartTutorial();
