
    // ============================================================
    // 외부 링크 확인 다이얼로그
    // ============================================================
    (function() {
      var overlay   = document.getElementById('dyoConfirmOverlay');
      var urlEl     = document.getElementById('dyoConfirmUrl');
      var cancelBtn = document.getElementById('dyoConfirmCancel');
      var okBtn     = document.getElementById('dyoConfirmOk');
      if (!overlay) return;

      var pendingUrl = null;

      window.dyoOpenExternal = function(url) {
        pendingUrl = url;
        urlEl.textContent = url;
        overlay.classList.add('show');
      };

      okBtn.addEventListener('click', function() {
        if (pendingUrl) window.open(pendingUrl, '_blank');
        overlay.classList.remove('show');
        pendingUrl = null;
      });

      cancelBtn.addEventListener('click', function() {
        overlay.classList.remove('show');
        pendingUrl = null;
      });

      overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
          overlay.classList.remove('show');
          pendingUrl = null;
        }
      });

      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && overlay.classList.contains('show')) {
          overlay.classList.remove('show');
          pendingUrl = null;
        }
        if (e.key === 'Enter' && overlay.classList.contains('show')) {
          okBtn.click();
        }
      });
    })();

    // ============================================================
    // Toast 알림
    // ============================================================
    (function() {
      var container = document.createElement('div');
      container.className = 'dyo-toast-container';
      document.body.appendChild(container);

      var ICONS = { success: '✓', error: '✕', warn: '⚠', info: 'i' };

      window.dyoToast = function(msg, type, duration) {
        type     = type     || 'info';
        duration = duration || 3000;

        var toast = document.createElement('div');
        toast.className = 'dyo-toast ' + type;
        toast.innerHTML =
          '<em class="dyo-toast-icon">' + (ICONS[type] || 'i') + '</em>' +
          '<span>' + msg + '</span>' +
          '<div class="dyo-toast-bar" style="animation-duration:' + duration + 'ms"></div>';
        container.appendChild(toast);

        function dismiss() {
          if (toast.classList.contains('dyo-toast-out')) return;
          toast.classList.add('dyo-toast-out');
          setTimeout(function() { if (toast.parentNode) toast.remove(); }, 220);
        }

        var timer = setTimeout(dismiss, duration);
        toast.addEventListener('click', function() {
          clearTimeout(timer);
          dismiss();
        }, { once: true });
      };
    })();

    // ============================================================
    // 창 팝업 애니메이션 헬퍼
    // ============================================================
    (function() {
      // 아이콘 → 창이 튀어나오는 팝 애니메이션
      // 사용법: 각 open 함수에서 window.dyoAnimOpen(winEl) 호출
      //         아이콘 클릭 시 window._dyoAnimSrc = iconEl; 설정
      // 현재 모드에 맞는 태스크바 아이템 찾기.
      //   Windows 모드: .dyo-win-app 우선 (Linux dock은 display:none 부모 안이라 rect=0)
      //   Linux   모드: .dyo-dock-item 우선
      // → 최소화 애니메이션이 항상 보이는 태스크바 쪽으로 향함.
      function getModeAwareTaskbarItem(winId) {
        if (!winId) return null;
        var isWin = document.documentElement.classList.contains('dyo-mode-windows');
        var winApp   = document.querySelector('.dyo-win-app[data-win-id="'   + winId + '"]');
        var dockItem = document.querySelector('.dyo-dock-item[data-win-id="' + winId + '"]');
        var taskBtn  = document.querySelector('.dyo-taskbtn[data-win-id="'   + winId + '"]');
        return isWin ? (winApp   || dockItem || taskBtn)
                     : (dockItem || winApp   || taskBtn);
      }

      // 닫기/숨김: 페이드아웃 후 콜백
      window.dyoAnimDismiss = function(winEl, cb) {
        // 최소화 상태(display:none)면 animation이 실행 안 되므로 즉시 콜백
        if (winEl.classList.contains('minimized') || !winEl.offsetParent) {
          if (cb) cb();
          return;
        }
        winEl.classList.add('dyo-win-dismissing');
        winEl.addEventListener('animationend', function() {
          winEl.classList.remove('dyo-win-dismissing');
          if (cb) cb();
        }, { once: true });
      };

      // 최소화: 태스크바 버튼 위치로 날아가며 사라짐
      window.dyoAnimMinimize = function(winEl, cb) {
        // 이미 최소화 애니메이션 중이면 즉시 처리
        if (winEl.classList.contains('dyo-win-minimizing')) {
          winEl.classList.remove('dyo-win-minimizing');
          winEl.style.removeProperty('--min-tx');
          winEl.style.removeProperty('--min-ty');
          if (cb) cb();
          return;
        }
        // 모드별로 올바른 태스크바 아이템 (Win 모드면 .dyo-win-app)
        var taskBtn = getModeAwareTaskbarItem(winEl.id);
        var wr = winEl.getBoundingClientRect();
        var wx = wr.left + wr.width  / 2;
        var wy = wr.top  + wr.height / 2;
        // 기본값: 화면 하단 중앙 (독/태스크바 위치)
        var tx = window.innerWidth / 2 - wx;
        var ty = window.innerHeight - wy;
        if (taskBtn) {
          var tr = taskBtn.getBoundingClientRect();
          // 보이지 않는 요소(width=0)는 무시하고 기본값 유지
          if (tr.width > 0 && tr.height > 0) {
            tx = (tr.left + tr.width  / 2) - wx;
            ty = (tr.top  + tr.height / 2) - wy;
          }
        }
        winEl.style.setProperty('--min-tx', tx + 'px');
        winEl.style.setProperty('--min-ty', ty + 'px');
        winEl.classList.add('dyo-win-minimizing');
        winEl.addEventListener('animationend', function() {
          if (cb) cb();
          winEl.classList.remove('dyo-win-minimizing');
          winEl.style.removeProperty('--min-tx');
          winEl.style.removeProperty('--min-ty');
        }, { once: true });
      };

      // 최대화 진입 애니메이션
      window.dyoAnimMaximizeIn = function(winEl) {
        winEl.classList.remove('dyo-win-zoom-in');
        void winEl.offsetWidth;
        winEl.classList.add('dyo-win-zoom-in');
        winEl.addEventListener('animationend', function() {
          winEl.classList.remove('dyo-win-zoom-in');
        }, { once: true });
      };

      // 최대화 복원 애니메이션
      window.dyoAnimMaximizeOut = function(winEl) {
        winEl.classList.remove('dyo-win-zoom-out');
        void winEl.offsetWidth;
        winEl.classList.add('dyo-win-zoom-out');
        winEl.addEventListener('animationend', function() {
          winEl.classList.remove('dyo-win-zoom-out');
        }, { once: true });
      };

      window.dyoAnimOpen = function(winEl) {
        var src = window._dyoAnimSrc || null;
        window._dyoAnimSrc = null;

        // src가 winId를 가진 태스크바 아이템이면, 현재 모드에 맞는 요소로 재매핑.
        // (Linux dock-item 이 Win 모드에서 width=0 으로 잡혀 애니메이션이 좌상단으로 튀는 문제 방지)
        if (src && src.dataset && src.dataset.winId) {
          var preferred = getModeAwareTaskbarItem(src.dataset.winId);
          if (preferred) {
            var pr = preferred.getBoundingClientRect();
            if (pr.width > 0 && pr.height > 0) src = preferred;
          }
        }

        // 기준점(transform-origin) 계산: 아이콘 중심 → 창 기준 상대 좌표
        var wr = winEl.getBoundingClientRect();
        var ox, oy;
        var srcRect = src ? src.getBoundingClientRect() : null;
        if (src && srcRect && srcRect.width > 0 && srcRect.height > 0) {
          ox = srcRect.left + srcRect.width  / 2;
          oy = srcRect.top  + srcRect.height / 2;
        } else {
          ox = window.innerWidth  / 2;
          oy = window.innerHeight / 2;
        }
        var tx = ox - wr.left;
        var ty = oy - wr.top;

        winEl.style.transformOrigin = tx + 'px ' + ty + 'px';
        winEl.classList.remove('dyo-win-pop');
        void winEl.offsetWidth; // reflow
        winEl.classList.add('dyo-win-pop');

        winEl.addEventListener('animationend', function() {
          winEl.classList.remove('dyo-win-pop');
          winEl.style.transformOrigin = '';
        }, { once: true });
      };
    })();

    // ============================================================
    // 전체화면 토글 버튼
    // ============================================================
    (function() {
      var btn      = document.getElementById('btnFullscreen');
      var iconExp  = document.getElementById('fsIconExpand');
      var iconComp = document.getElementById('fsIconCompress');
      if (!btn || !iconExp || !iconComp) return;

      function updateIcons() {
        var isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
        iconExp.style.display  = isFs ? 'none'  : '';
        iconComp.style.display = isFs ? ''      : 'none';
        btn.title = isFs ? '전체화면 종료' : '전체화면';
      }

      btn.addEventListener('click', function() {
        if (document.fullscreenElement || document.webkitFullscreenElement) {
          (document.exitFullscreen || document.webkitExitFullscreen).call(document);
        } else {
          var el = document.documentElement;
          if (el.requestFullscreen) el.requestFullscreen();
          else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
        }
      });

      document.addEventListener('fullscreenchange', updateIcons);
      document.addEventListener('webkitfullscreenchange', updateIcons);
    })();

    // ============================================================
    // 메인화면(인트로 랜딩)으로 돌아가기 버튼
    // ============================================================
    (function() {
      var btn = document.getElementById('btnGoLanding');
      if (!btn) return;
      btn.addEventListener('click', function() {
        // 홈이면 새로고침(랜딩 재생), 다른 페이지면 홈으로 이동 → 랜딩 표시
        if (document.body.id === 'tt-body-index') location.reload();
        else location.href = '/';
      });
    })();

    // ============================================================
    // 태스크바 열린 창 버튼
    // ============================================================
    (function() {
      var container = document.getElementById('dyoBarCenter');
      if (!container) return;

      var winDefs = [
        {
          id: 'dyoShellWin', label: 'Terminal',
          icon: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>',
          open: function() { if (window.dyoOpenShell) window.dyoOpenShell(); }
        },
        {
          id: 'dyoBrowserWin', label: 'Browser',
          icon: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
          open: function() { if (window.dyoOpenBrowser) window.dyoOpenBrowser('/category'); }
        },
        {
          id: 'dyoReadmeWin', label: 'README',
          icon: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
          open: function() { if (window.dyoOpenReadme) window.dyoOpenReadme(); }
        },
        {
          id: 'dyoGuestWin', label: 'Guestbook',
          icon: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
          open: function() { if (window.dyoOpenGuest) window.dyoOpenGuest(); }
        },
        {
          id: 'dyoPropsWin', label: 'Properties',
          icon: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>',
          open: function() { if (window.dyoOpenProps && window._dyoLastPropsMeta) window.dyoOpenProps(window._dyoLastPropsMeta); }
        },
        {
          id: 'dyoExplorerWin', label: 'File Explorer',
          icon: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>',
          open: function() { if (window.dyoOpenExplorer) window.dyoOpenExplorer(); }
        },
        {
          id: 'dyoLinksWin', label: 'Links',
          icon: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
          open: function() { if (window.dyoOpenLinks) window.dyoOpenLinks(); }
        },
        {
          id: 'dyoGalleryWin', label: 'Blogram',
          icon: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="6"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.3" fill="currentColor" stroke="none"/></svg>',
          open: function() { if (window.dyoOpenGallery) window.dyoOpenGallery(); }
        },
        {
          id: 'dyoMusicWin', label: 'Music',
          icon: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
          open: function() { if (window.dyoOpenMusic) window.dyoOpenMusic(); }
        },
        {
          id: 'dyoBoardWin', label: 'Board',
          icon: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="5" height="18" rx="1.5"/><rect x="9.5" y="3" width="5" height="13" rx="1.5"/><rect x="16" y="3" width="5" height="9" rx="1.5"/></svg>',
          open: function() { if (window.dyoOpenBoard) window.dyoOpenBoard(); }
        },
      ];

      winDefs.forEach(function(def) {
        var winEl = document.getElementById(def.id);
        if (!winEl) return;

        var btn = document.createElement('button');
        btn.className = 'dyo-taskbtn';
        btn.dataset.winId = def.id;
        btn.innerHTML = def.icon + '<span class="dyo-taskbtn-label">' + def.label + '</span>';
        container.appendChild(btn);

        // 클릭: 닫힘→열기 / 나머지→항상 맨 앞으로 복원
        btn.addEventListener('click', function() {
          if (!winEl.classList.contains('open')) {
            window._dyoAnimSrc = btn;
            def.open();
          } else if (winEl.classList.contains('minimized')) {
            window._dyoAnimSrc = btn;
            winEl.classList.remove('minimized');
            window._dyoZTop = (window._dyoZTop || 9000) + 1;
            winEl.style.zIndex = window._dyoZTop;
            if (window.dyoAnimOpen) window.dyoAnimOpen(winEl);
          } else {
            // 이미 열려있고 최소화 아님 → 최소화
            if (window.dyoAnimMinimize) {
              window.dyoAnimMinimize(winEl, function() { winEl.classList.add('minimized'); });
            } else {
              winEl.classList.add('minimized');
            }
          }
        });

        // 창 클래스 변화 감지 → 버튼 상태 업데이트
        var observer = new MutationObserver(function() {
          var isOpen = winEl.classList.contains('open');
          var isMin  = winEl.classList.contains('minimized');
          btn.classList.toggle('open',      isOpen);
          btn.classList.toggle('active',    isOpen && !isMin);
          btn.classList.toggle('minimized', isOpen && isMin);
        });
        observer.observe(winEl, { attributes: true, attributeFilter: ['class'] });
      });
    })();

    // ============================================================
    // macOS Dock
    // ============================================================
    (function() {
      var dock = document.getElementById('dyoDock');
      if (!dock) return;

      var dockDefs = [
        {
          id: 'dyoReadmeWin', label: 'README',
          style: 'background:linear-gradient(145deg,#f0f6ff,#dce8fb);border:1px solid rgba(100,160,255,.35)',
          icon: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="#3b82f6" opacity=".15"/><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="none" stroke="#3b82f6" stroke-width="1.5" stroke-linejoin="round"/><polyline points="14 2 14 8 20 8" fill="none" stroke="#3b82f6" stroke-width="1.5" stroke-linejoin="round"/><line x1="8" y1="12" x2="16" y2="12" stroke="#3b82f6" stroke-width="1.4"/><line x1="8" y1="15" x2="16" y2="15" stroke="#3b82f6" stroke-width="1.4" opacity=".65"/><line x1="8" y1="18" x2="13" y2="18" stroke="#3b82f6" stroke-width="1.4" opacity=".4"/></svg>',
          open: function() { if (window.dyoOpenReadme) window.dyoOpenReadme(); }
        },
        {
          id: 'dyoShellWin', label: 'Terminal',
          style: 'background:#0c0c0c;border:1px solid #3a3a3a',
          icon: '<svg viewBox="0 0 24 24" fill="none" stroke="#cccccc" stroke-linecap="square" stroke-width="2.5"><polyline points="4 8 9 12 4 16"/><line x1="12" y1="16" x2="20" y2="16"/></svg>',
          open: function() { if (window.dyoOpenShell) window.dyoOpenShell(); }
        },
        {
          id: 'dyoBrowserWin', label: 'Dev Blog',
          style: 'background:linear-gradient(145deg,#ff6320,#e8501a);border:1px solid rgba(255,140,80,.4)',
          icon: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><rect x="3.5" y="6" width="17" height="3.2" rx="1.6" fill="white"/><rect x="10.4" y="8.8" width="3.2" height="10.2" rx="1.6" fill="white"/></svg>',
          open: function() { if (window.dyoOpenBrowser) window.dyoOpenBrowser('/category'); }
        },
        {
          id: 'dyoGuestWin', label: 'Guestbook',
          style: 'background:linear-gradient(145deg,#fffbe0,#fff3a0);border:1px solid rgba(200,168,0,.4)',
          icon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill="#FEE500" opacity=".25" stroke="#c8a800" stroke-width="1.5" stroke-linejoin="round"/><circle cx="8.5" cy="11" r="1.2" fill="#c8a800"/><circle cx="12" cy="11" r="1.2" fill="#c8a800"/><circle cx="15.5" cy="11" r="1.2" fill="#c8a800"/></svg>',
          open: function() { if (window.dyoOpenGuest) window.dyoOpenGuest(); }
        },
        {
          id: 'dyoExplorerWin', label: 'Files',
          style: 'background:linear-gradient(145deg,#ffe066,#f0a30a);border:1px solid rgba(240,163,10,.5)',
          icon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="rgba(255,255,255,.35)" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/><path d="M3 11h18" stroke="#fff" stroke-width="1.3"/></svg>',
          open: function() { if (window.dyoOpenExplorer) window.dyoOpenExplorer(); }
        },
        {
          id: 'dyoGalleryWin', label: 'Blogram',
          style: 'background:linear-gradient(135deg,#833ab4,#c13584 35%,#e1306c 60%,#f77737 85%,#fcaf45);border:1px solid rgba(225,48,108,.4)',
          icon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="20" height="20" rx="6" stroke="white" stroke-width="1.8"/><circle cx="12" cy="12" r="5" stroke="white" stroke-width="1.8"/><circle cx="17.5" cy="6.5" r="1.3" fill="white"/></svg>',
          open: function() { if (window.dyoOpenGallery) window.dyoOpenGallery(); }
        },
        {
          id: 'dyoMusicWin', label: 'Music',
          style: 'background:linear-gradient(145deg,#fc3c44,#ff2d55);border:1px solid rgba(255,45,85,.4)',
          icon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 18V5l12-2v13" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="6" cy="18" r="3" stroke="white" stroke-width="1.8"/><circle cx="18" cy="16" r="3" stroke="white" stroke-width="1.8"/></svg>',
          open: function() { if (window.dyoOpenMusic) window.dyoOpenMusic(); }
        },
        {
          id: 'dyoBoardWin', label: 'Board',
          style: 'background:linear-gradient(145deg,#e8f4fd,#d1e9fb);border:1px solid rgba(59,130,246,.35)',
          icon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="5" height="18" rx="1.5" stroke="#3b82f6" stroke-width="1.8"/><rect x="9.5" y="3" width="5" height="13" rx="1.5" stroke="#3b82f6" stroke-width="1.8"/><rect x="16" y="3" width="5" height="9" rx="1.5" stroke="#3b82f6" stroke-width="1.8"/></svg>',
          open: function() { if (window.dyoOpenBoard) window.dyoOpenBoard(); }
        },
        {
          id: 'dyoLinksWin', label: 'Links',
          style: 'background:linear-gradient(145deg,#e0f2fe,#bae6fd);border:1px solid rgba(56,189,248,.4)',
          icon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="#0284c7" stroke-width="2" stroke-linecap="round"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="#0284c7" stroke-width="2" stroke-linecap="round"/></svg>',
          open: function() { if (window.dyoOpenLinks) window.dyoOpenLinks(); }
        },
      ];

      function updateDockVisibility() {
        var hasOpen = !!dock.querySelector('.dyo-dock-item.open');
        dock.style.display = hasOpen ? 'flex' : 'none';
      }

      dockDefs.forEach(function(def) {
        var item = document.createElement('div');
        item.className = 'dyo-dock-item';
        if (def.id) item.dataset.winId = def.id;
        item.innerHTML =
          '<div class="dyo-dock-icon" style="' + def.style + '">' + def.icon + '</div>' +
          '<div class="dyo-dock-dot"></div>' +
          '<div class="dyo-dock-label">' + def.label + '</div>';

        item.addEventListener('click', function() {
          if (!def.id) { def.open(); return; }
          var winEl = document.getElementById(def.id);
          if (!winEl) return;
          if (!winEl.classList.contains('open')) {
            window._dyoAnimSrc = item;
            def.open();
          } else if (winEl.classList.contains('minimized')) {
            window._dyoAnimSrc = item;
            winEl.classList.remove('minimized');
            window._dyoZTop = (window._dyoZTop || 9000) + 1;
            winEl.style.zIndex = window._dyoZTop;
            if (window.dyoAnimOpen) window.dyoAnimOpen(winEl);
          } else {
            var isFront = parseInt(winEl.style.zIndex) >= (window._dyoZTop || 9000);
            if (isFront) {
              if (window.dyoAnimMinimize) {
                window.dyoAnimMinimize(winEl, function() { winEl.classList.add('minimized'); });
              } else {
                winEl.classList.add('minimized');
              }
            } else {
              window._dyoZTop = (window._dyoZTop || 9000) + 1;
              winEl.style.zIndex = window._dyoZTop;
            }
          }
        });

        item.addEventListener('contextmenu', function(e) {
          e.preventDefault();
          e.stopPropagation();
          var old = document.getElementById('dyoDockCtxMenu');
          if (old) old.remove();

          var winEl = def.id ? document.getElementById(def.id) : null;
          if (!winEl) return;
          var isOpen = winEl.classList.contains('open');
          var isMin  = winEl.classList.contains('minimized');

          var menu = document.createElement('div');
          menu.id = 'dyoDockCtxMenu';
          menu.className = 'dyo-ctx-menu show';
          menu.style.left = e.clientX + 'px';
          menu.style.top  = (e.clientY - 8) + 'px';

          // 모드별 라벨 헬퍼 (dock 컨텍스트 메뉴용)
          var __isWin = document.documentElement.classList.contains('dyo-mode-windows');
          function addItem(label, disabled, action) {
            var btn = document.createElement('button');
            btn.className = 'dyo-ctx-item' + (disabled ? ' disabled' : '');
            btn.textContent = label;
            if (disabled) btn.disabled = true;
            else btn.addEventListener('click', function() { menu.remove(); action(); });
            menu.appendChild(btn);
          }

          addItem(__isWin ? '최소화' : 'Minimize', !isOpen || isMin, function() {
            if (window.dyoAnimMinimize) {
              window.dyoAnimMinimize(winEl, function() { winEl.classList.add('minimized'); });
            } else {
              winEl.classList.add('minimized');
            }
          });

          addItem(__isWin ? '복원' : 'Restore', !isOpen || !isMin, function() {
            window._dyoAnimSrc = item;
            winEl.classList.remove('minimized');
            window._dyoZTop = (window._dyoZTop || 9000) + 1;
            winEl.style.zIndex = window._dyoZTop;
            if (window.dyoAnimOpen) window.dyoAnimOpen(winEl);
          });

          addItem(__isWin ? '창 닫기' : 'Close', !isOpen, function() {
            if (window.dyoAnimDismiss) {
              window.dyoAnimDismiss(winEl, function() {
                winEl.classList.remove('open','minimized','maximized');
              });
            } else {
              winEl.classList.remove('open','minimized','maximized');
            }
          });

          document.body.appendChild(menu);

          var rect = menu.getBoundingClientRect();
          if (rect.bottom > window.innerHeight) menu.style.top  = (e.clientY - rect.height - 8) + 'px';
          if (rect.right  > window.innerWidth)  menu.style.left = (e.clientX - rect.width) + 'px';

          function closeMenu(ev) {
            if (!menu.contains(ev.target)) {
              menu.remove();
              document.removeEventListener('mousedown', closeMenu);
            }
          }
          document.addEventListener('mousedown', closeMenu);
        });

        // ── Windows 태스크바 아이템 (병렬 생성) ───────────────
        var winApps = document.getElementById('dyoWinApps');
        var winItem = null;
        if (winApps && def.id) {
          winItem = document.createElement('button');
          winItem.className = 'dyo-win-app';
          winItem.dataset.winId = def.id;
          // Windows 모드는 데스크탑 아이콘과 같은 SVG를 재사용 (없으면 dock 아이콘 폴백)
          var winSvg = (window.WIN_TASKBAR_ICONS && window.WIN_TASKBAR_ICONS[def.id])
            ? window.WIN_TASKBAR_ICONS[def.id]
            : def.icon;
          winItem.innerHTML =
            '<span class="dyo-win-app-icon">' + winSvg + '</span>' +
            '<span class="dyo-win-app-indicator"></span>' +
            '<span class="dyo-win-app-tooltip">' + def.label + '</span>';
          winItem.addEventListener('click', function() {
            // Linux dock item과 동일 동작 — 동일 핸들러 트리거
            item.click();
          });
          winItem.addEventListener('contextmenu', function(e) {
            // 컨텍스트 메뉴는 Linux dock 핸들러 재사용
            var ev = new MouseEvent('contextmenu', {
              bubbles: true, cancelable: true,
              clientX: e.clientX, clientY: e.clientY
            });
            e.preventDefault();
            item.dispatchEvent(ev);
          });
          winApps.appendChild(winItem);
        }

        if (def.id) {
          var winEl = document.getElementById(def.id);
          if (winEl) {
            var obs = new MutationObserver(function() {
              var isOpen = winEl.classList.contains('open');
              var isMin  = winEl.classList.contains('minimized');
              item.classList.toggle('open',      isOpen);
              item.classList.toggle('minimized', isOpen && isMin);
              if (winItem) {
                winItem.classList.toggle('open',      isOpen);
                winItem.classList.toggle('active',    isOpen && !isMin);
                winItem.classList.toggle('minimized', isOpen && isMin);
              }
              updateDockVisibility();
            });
            obs.observe(winEl, { attributes: true, attributeFilter: ['class'] });
          }
        }

        dock.appendChild(item);
      });

      // 초기 상태 (모든 창 닫혀있으면 dock 숨김)
      updateDockVisibility();

      // ── hover 확대 (macOS Dock 효과) ─────────────────────────
      var MAX_SCALE = 1.6;
      var INFLUENCE = 90;

      dock.addEventListener('mousemove', function(e) {
        dock.querySelectorAll('.dyo-dock-item.open').forEach(function(item) {
          var rect   = item.getBoundingClientRect();
          var center = rect.left + rect.width / 2;
          var dist   = Math.abs(e.clientX - center);
          var t      = dist < INFLUENCE ? 1 - dist / INFLUENCE : 0;
          var scale  = 1 + (MAX_SCALE - 1) * Math.pow(t, 1.2);
          item.style.transform = 'scale(' + scale.toFixed(3) + ')';
          var lbl = item.querySelector('.dyo-dock-label');
          if (lbl) lbl.style.opacity = dist < 28 ? '1' : '0';
        });
      });

      dock.addEventListener('mouseleave', function() {
        dock.querySelectorAll('.dyo-dock-item.open').forEach(function(item) {
          item.style.transform = '';
          var lbl = item.querySelector('.dyo-dock-label');
          if (lbl) lbl.style.opacity = '0';
        });
      });
    })();

    // ============================================================
    // 바탕화면 우클릭 컨텍스트 메뉴
    // ============================================================
    (function() {
      var desktop = document.getElementById('dyoDesktop');
      var menu    = document.getElementById('dyoCtxMenu');
      if (!desktop || !menu) return;

      // 아이콘 메타데이터 (풍부한 속성 포함)
      var iconMeta = {
        desktopIconReadme: {
          name: 'README', ext: '.md', type: 'Document',
          desc: '블로그 소개 및 사용법 문서',
          location: '~/Desktop/README.md',
          size: '4.2 KB', disk: '8 KB',
          created: '2025-01-15', modified: '2026-02-27',
          owner: 'doyoucode', group: 'staff',
          permissions: 'Read-only', version: '1.0',
          iconBg: 'linear-gradient(145deg,#f0f6ff 0%,#dce8fb 100%)',
          iconBorder: 'rgba(100,160,255,0.35)', iconColor: '#3b82f6', iconChar: '📄',
          action: function() { if (window.dyoOpenReadme) window.dyoOpenReadme(); }
        },
        desktopIconShell: {
          name: 'Terminal', ext: '.app', type: 'Application',
          desc: '터미널 에뮬레이터 (Bash-like shell)',
          location: '/usr/bin/terminal',
          size: '—', disk: '—',
          created: '2025-01-15', modified: '2026-02-27',
          owner: 'root', group: 'wheel',
          permissions: 'Read / Execute', version: '2.1.0',
          iconBg: '#0c0c0c', iconBorder: '#3a3a3a', iconColor: '#cccccc', iconChar: '>_',
          action: function() { if (window.dyoOpenShell) window.dyoOpenShell(); }
        },
        desktopIconBlog: {
          name: 'Dev Blog', ext: '.url', type: 'Shortcut',
          desc: 'Tistory 개발 블로그 바로가기',
          location: 'https://doyoucode.tistory.com',
          url: 'https://doyoucode.tistory.com/category',
          size: '—', disk: '—',
          created: '2025-01-15', modified: '2026-02-27',
          owner: 'doyoucode', group: 'staff',
          permissions: 'Read-only', version: '—',
          iconBg: 'linear-gradient(145deg,#ff6320 0%,#e8501a 100%)',
          iconBorder: 'rgba(255,140,80,0.4)', iconColor: '#fff', iconChar: 'T',
          action: function() { if (window.dyoOpenBrowser) window.dyoOpenBrowser('/category'); }
        },
        desktopIconGithub: {
          name: 'GitHub', ext: '.url', type: 'Shortcut',
          desc: 'GitHub 프로필 페이지 (외부 링크)',
          location: 'https://github.com/doyoungkim-code',
          url: 'https://github.com/doyoungkim-code',
          size: '—', disk: '—',
          created: '2025-01-15', modified: '2026-02-27',
          owner: 'doyoucode', group: 'staff',
          permissions: 'Read-only', version: '—',
          iconBg: 'linear-gradient(145deg,#24292e 0%,#1a1e22 100%)',
          iconBorder: 'rgba(139,148,158,0.3)', iconColor: '#fff', iconChar: '⌥G',
          action: function() { if (window.dyoOpenExternal) window.dyoOpenExternal('https://github.com/doyoungkim-code'); }
        },
        desktopIconGuest: {
          name: 'Guestbook', ext: '.app', type: 'Application',
          desc: '방명록 채팅 애플리케이션',
          location: '/home/doyoucode/guestbook',
          size: '—', disk: '—',
          created: '2025-01-15', modified: '2026-02-27',
          owner: 'doyoucode', group: 'staff',
          permissions: 'Read / Write', version: '1.2.0',
          iconBg: 'linear-gradient(145deg,#fffbe0 0%,#fff3a0 100%)',
          iconBorder: 'rgba(200,168,0,0.4)', iconColor: '#c8a800', iconChar: '💬',
          action: function() { if (window.dyoOpenGuest) window.dyoOpenGuest(); }
        },
        desktopIconExplorer: {
          name: 'File Explorer', ext: '.app', type: 'Application',
          desc: '블로그 카테고리 탐색기',
          location: '/usr/bin/explorer',
          size: '—', disk: '—',
          created: '2025-01-15', modified: '2026-02-27',
          owner: 'root', group: 'wheel',
          permissions: 'Read / Execute', version: '1.0.0',
          iconBg: 'linear-gradient(145deg,#fffbe0 0%,#fde68a 100%)',
          iconBorder: 'rgba(240,163,10,0.4)', iconColor: '#f0a30a', iconChar: '📂',
          action: function() { if (window.dyoOpenExplorer) window.dyoOpenExplorer(); }
        },
        desktopIconGallery: {
          name: 'Blogram', ext: '.app', type: 'Application',
          desc: 'Instagram 스타일 사진 피드. 프로필 헤더(게시물·팔로워·팔로잉), 3열 그리드, 라이트박스(좋아요·댓글·공유) 지원.',
          location: '/home/doyoucode/blogram',
          size: '—', disk: '—',
          created: '2026-02-28', modified: '2026-03-01',
          owner: 'doyoucode', group: 'staff',
          permissions: 'Read-only', version: '2.0.0',
          iconBg: 'linear-gradient(145deg,#fff0f6 0%,#fcd6e8 100%)',
          iconBorder: 'rgba(255,120,180,0.4)', iconColor: '#ff78b4', iconChar: '📷',
          action: function() { if (window.dyoOpenGallery) window.dyoOpenGallery(); }
        },
        desktopIconMusic: {
          name: 'Music', ext: '.app', type: 'Application',
          desc: 'YouTube 스트리밍 뮤직 플레이어',
          location: '/Applications/Music',
          size: '4 tracks', disk: '— (streaming)',
          created: '2025-01-15', modified: '2026-03-03',
          owner: 'doyoucode', group: 'staff',
          permissions: 'Read / Execute', version: 'YouTube IFrame API v3',
          iconBg: 'linear-gradient(145deg,#fc3c44,#ff2d55)',
          iconBorder: 'rgba(255,45,85,0.4)', iconColor: '#fff', iconChar: '♪',
          action: function() { if (window.dyoOpenMusic) window.dyoOpenMusic(); }
        },
        desktopIconBoard: {
          name: 'Board', ext: '.app', type: 'Application',
          desc: 'Jira 스타일 보드. To Do / In Progress / Done 3열 구성, 게시글 기반 카드 관리.',
          location: '/home/doyoucode/board',
          size: '—', disk: '—',
          created: '2026-03-09', modified: '2026-03-09',
          owner: 'doyoucode', group: 'staff',
          permissions: 'Read / Execute', version: '1.0.0',
          iconBg: 'linear-gradient(145deg,#1e3a5f,#2563eb)',
          iconBorder: 'rgba(59,130,246,0.4)', iconColor: '#fff', iconChar: '📋',
          action: function() { if (window.dyoOpenBoard) window.dyoOpenBoard(); }
        },
        fpLinks: {
          name: 'Links', ext: '.app', type: 'Application',
          desc: '즐겨찾기 링크 모음. 폴더별 분류, 검색, 파비콘 표시 지원.',
          location: '/home/doyoucode/links',
          size: '—', disk: '—',
          created: '2026-03-15', modified: '2026-03-17',
          owner: 'doyoucode', group: 'staff',
          permissions: 'Read / Execute', version: '1.0.0',
          iconBg: 'linear-gradient(145deg,#0c4a6e,#0284c7)',
          iconBorder: 'rgba(56,189,248,0.4)', iconColor: '#fff', iconChar: '🔗',
          action: function() { if (window.dyoOpenLinks) window.dyoOpenLinks(); }
        },
        desktopIconFeatures: {
          name: 'Features', ext: '.folder', type: 'Folder',
          desc: 'Blogram, Music, GitHub, Algo Monitor 등 추가 앱이 모여있는 폴더',
          location: '~/Desktop/Features',
          size: '4 items', disk: '—',
          created: '2026-03-07', modified: '2026-03-07',
          owner: 'doyoucode', group: 'staff',
          permissions: 'Read / Write', version: '—',
          iconBg: 'linear-gradient(145deg,#667eea 0%,#764ba2 100%)',
          iconBorder: 'rgba(118,75,162,0.5)', iconColor: '#fff', iconChar: '📁',
          action: function() { if (window.dyoOpenFeatures) window.dyoOpenFeatures(); }
        },
        desktopIconAdmin: {
          name: 'Control Panel', ext: '.folder', type: 'Folder',
          desc: '관리자 전용 제어판 — 글쓰기 / 관리자 홈 / 스킨 편집 바로가기 (로그인 감지 시에만 표시)',
          location: '~/Desktop/Control Panel',
          size: '3 items', disk: '—',
          created: '2026-07-19', modified: '2026-07-19',
          owner: 'doyoucode', group: 'admin',
          permissions: 'Owner only', version: '—',
          iconBg: 'linear-gradient(145deg,#475569,#334155)',
          iconBorder: 'rgba(148,163,184,0.4)', iconColor: '#fff', iconChar: '⚙️',
          action: function() { if (window.dyoOpenAdminPanel) window.dyoOpenAdminPanel(); }
        },
        apWrite: {
          name: '글쓰기', ext: '.url', type: 'Shortcut',
          desc: '새 글 작성 — 티스토리 에디터 (새 탭)',
          location: '/manage/newpost',
          url: '/manage/newpost/?type=post&returnURL=%2Fmanage%2Fposts%2F',
          size: '—', disk: '—',
          created: '2026-07-19', modified: '2026-07-19',
          owner: 'doyoucode', group: 'admin',
          permissions: 'Owner only', version: '—',
          iconBg: 'linear-gradient(145deg,#16a34a,#15803d)',
          iconBorder: 'rgba(34,197,94,0.4)', iconColor: '#fff', iconChar: '✏️',
          action: function() { window.open('/manage/newpost/?type=post&returnURL=%2Fmanage%2Fposts%2F', '_blank'); }
        },
        apManage: {
          name: '관리자 홈', ext: '.url', type: 'Shortcut',
          desc: '티스토리 블로그 관리 페이지 (새 탭)',
          location: '/manage',
          url: '/manage',
          size: '—', disk: '—',
          created: '2026-07-19', modified: '2026-07-19',
          owner: 'doyoucode', group: 'admin',
          permissions: 'Owner only', version: '—',
          iconBg: 'linear-gradient(145deg,#475569,#334155)',
          iconBorder: 'rgba(148,163,184,0.4)', iconColor: '#fff', iconChar: '⚙️',
          action: function() { window.open('/manage', '_blank'); }
        },
        apSkin: {
          name: '스킨 편집', ext: '.url', type: 'Shortcut',
          desc: '스킨 편집기 — 이 스킨의 HTML/CSS 수정 (새 탭)',
          location: '/manage/design/skin/edit',
          url: '/manage/design/skin/edit',
          size: '—', disk: '—',
          created: '2026-07-19', modified: '2026-07-19',
          owner: 'doyoucode', group: 'admin',
          permissions: 'Owner only', version: '—',
          iconBg: 'linear-gradient(145deg,#7c3aed,#5b21b6)',
          iconBorder: 'rgba(167,139,250,0.4)', iconColor: '#fff', iconChar: '🎨',
          action: function() { window.open('/manage/design/skin/edit', '_blank'); }
        },
      };

      // 모드별 라벨 헬퍼 (Windows 모드일 때 한글)
      function isWinMode() {
        return document.documentElement.classList.contains('dyo-mode-windows');
      }
      function L(en, ko) { return isWinMode() ? ko : en; }

      // 팝업 아이템 우클릭용 글로벌 헬퍼
      window.dyoShowIconCtxMenu = function(metaKey, clientX, clientY) {
        var meta = iconMeta[metaKey];
        currentCtx = { type: 'icon', meta: meta };
        buildMenu([
          { label: L('Open', '열기'),       action: 'icon-open' },
          'sep',
          { label: L('Properties', '속성'), action: 'icon-props', disabled: !meta }
        ]);
        showMenu(clientX, clientY);
      };

      // 메뉴 아이템 동적 빌드
      function buildMenuItem(item, parent) {
        if (item === 'sep') {
          var sep = document.createElement('div');
          sep.className = 'dyo-ctx-sep';
          parent.appendChild(sep);
        } else if (item.sub) {
          // 서브메뉴
          var wrap = document.createElement('div');
          wrap.className = 'dyo-ctx-sub';
          var trigger = document.createElement('button');
          trigger.className = 'dyo-ctx-item';
          trigger.textContent = item.label;
          trigger.type = 'button';
          wrap.appendChild(trigger);
          var subMenu = document.createElement('div');
          subMenu.className = 'dyo-ctx-submenu';
          item.sub.forEach(function(si) { buildMenuItem(si, subMenu); });
          wrap.appendChild(subMenu);
          parent.appendChild(wrap);
          // 화면 오른쪽 넘침 방지
          wrap.addEventListener('mouseenter', function() {
            var r = subMenu.getBoundingClientRect();
            if (r.right > window.innerWidth - 8) subMenu.classList.add('flip-left');
            else subMenu.classList.remove('flip-left');
          });
        } else {
          var el = document.createElement('button');
          el.className = 'dyo-ctx-item' +
            (item.disabled ? ' disabled' : '') +
            (item.danger   ? ' danger'   : '');
          if (item.checked !== undefined) {
            var chk = document.createElement('span');
            chk.className = 'dyo-ctx-check';
            chk.textContent = item.checked ? '✓' : '';
            el.appendChild(chk);
            el.appendChild(document.createTextNode(item.label));
          } else {
            el.textContent = item.label;
          }
          el.dataset.action = item.action || '';
          if (item.disabled) el.setAttribute('disabled', '');
          parent.appendChild(el);
        }
      }

      function buildMenu(items) {
        menu.innerHTML = '';
        items.forEach(function(item) { buildMenuItem(item, menu); });
      }

      function showMenu(x, y) {
        menu.classList.add('show');
        var mw = menu.offsetWidth  || 180;
        var mh = menu.offsetHeight || 200;
        var px = Math.min(x, window.innerWidth  - mw - 8);
        var py = Math.min(y, window.innerHeight - mh - 8);
        menu.style.left = px + 'px';
        menu.style.top  = py + 'px';
      }

      function hideMenu() { menu.classList.remove('show'); }

      function showProps(meta) {
        if (window.dyoOpenProps) window.dyoOpenProps(meta);
      }

      var currentCtx = null;

      // 데스크탑 우클릭 — 3가지 케이스
      desktop.addEventListener('contextmenu', function(e) {
        if (e.target.closest('.dyo-shell-win, .dyo-browser-win')) return;
        e.preventDefault();

        var iconEl  = e.target.closest('.dyo-desktop-icon');
        var taskBtn = e.target.closest('.dyo-taskbtn');

        if (iconEl) {
          // ── 아이콘 우클릭
          var meta = iconMeta[iconEl.id];
          currentCtx = { type: 'icon', meta: meta };
          buildMenu([
            { label: L('Open', '열기'),             action: 'icon-open' },
            'sep',
            { label: L('Properties', '속성'),       action: 'icon-props', disabled: !meta }
          ]);

        } else if (taskBtn) {
          // ── 태스크바 버튼 우클릭
          var winId  = taskBtn.dataset.winId;
          var winEl  = winId ? document.getElementById(winId) : null;
          var isOpen = !!(winEl && winEl.classList.contains('open'));
          var isMini = !!(winEl && winEl.classList.contains('minimized'));
          currentCtx = { type: 'task', winEl: winEl };
          buildMenu([
            { label: L('Bring to Front', '맨 앞으로 가져오기'), action: 'task-front',    disabled: !isOpen },
            { label: L('Minimize', '최소화'),                    action: 'task-minimize', disabled: !isOpen || isMini },
            'sep',
            { label: L('Close', '창 닫기'),                      action: 'task-close', danger: true, disabled: !isOpen }
          ]);

        } else {
          // ── 배경 우클릭
          currentCtx = { type: 'bg' };
          var curTheme = localStorage.getItem('dyo_desktop_theme') || 'default';
          var curMode  = localStorage.getItem('dyo_desktop_mode') || 'windows';
          // Theme 서브메뉴는 Linux 모드일 때만 (장식 테마는 Linux 전용)
          var bgItems = [
            { label: L('New Terminal', 'bash 열기'),  action: 'terminal'  },
            { label: L('Dev Blog', '개발 블로그'),     action: 'blog'      },
            'sep'
          ];
          if (curMode === 'linux') {
            bgItems.push({ label: 'Theme', sub: [
              { label: 'Default',    action: 'theme-default',    checked: curTheme === 'default' },
              { label: 'Astronaut',  action: 'theme-astronaut',  checked: curTheme === 'astronaut' },
              { label: 'Sakura',     action: 'theme-sakura',     checked: curTheme === 'sakura' },
              'sep',
              { label: 'Coming Soon...', action: '', disabled: true },
            ]});
            bgItems.push('sep');
          }
          // 관리자 항목 — 메뉴는 우클릭마다 재빌드되므로 동기 조건이면 충분
          if (window.dyoIsAdmin) {
            bgItems.push({ label: L('New Post', '글쓰기'),       action: 'admin-write' });
            bgItems.push({ label: L('Control Panel', '제어판'),  action: 'admin-panel' });
            bgItems.push('sep');
          }
          bgItems.push({ label: L('Tutorial', '튜토리얼'),                action: 'tutorial' });
          bgItems.push({ label: L('Refresh Desktop', '바탕화면 새로 고침'), action: 'refresh'  });
          buildMenu(bgItems);
        }

        showMenu(e.clientX, e.clientY);
      });

      // 메뉴 외부 클릭 시 닫기
      document.addEventListener('mousedown', function(e) {
        if (!menu.contains(e.target)) hideMenu();
      });

      // ESC 닫기
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
          hideMenu();
        }
      });

      // 메뉴 아이템 실행
      menu.addEventListener('click', function(e) {
        var item = e.target.closest('.dyo-ctx-item');
        if (!item || item.hasAttribute('disabled')) return;
        hideMenu();
        var action = item.dataset.action;
        var ctx = currentCtx;
        switch (action) {
          // 아이콘
          case 'icon-open':
            if (ctx && ctx.meta && ctx.meta.action) ctx.meta.action();
            break;
          case 'icon-props':
            if (ctx && ctx.meta) showProps(ctx.meta);
            break;
          // 태스크바
          case 'task-front':
            if (ctx && ctx.winEl) {
              var tb2 = document.querySelector('.dyo-taskbtn[data-win-id="' + ctx.winEl.id + '"]');
              window._dyoAnimSrc = tb2 || null;
              ctx.winEl.classList.remove('minimized');
              window._dyoZTop = (window._dyoZTop || 9000) + 1;
              ctx.winEl.style.zIndex = window._dyoZTop;
              if (window.dyoAnimOpen) window.dyoAnimOpen(ctx.winEl);
            }
            break;
          case 'task-minimize':
            if (ctx && ctx.winEl) {
              if (window.dyoAnimMinimize) {
                window.dyoAnimMinimize(ctx.winEl, function() { ctx.winEl.classList.add('minimized'); });
              } else {
                ctx.winEl.classList.add('minimized');
              }
            }
            break;
          case 'task-close':
            if (ctx && ctx.winEl) {
              if (window.dyoAnimDismiss) {
                window.dyoAnimDismiss(ctx.winEl, function() { ctx.winEl.classList.remove('open', 'minimized', 'maximized'); });
              } else {
                ctx.winEl.classList.remove('open', 'minimized', 'maximized');
              }
            }
            break;
          // 배경
          case 'terminal':  if (window.dyoOpenShell)    window.dyoOpenShell();              break;
          case 'readme':    if (window.dyoOpenReadme)  window.dyoOpenReadme();             break;
          case 'guestbook': if (window.dyoOpenGuest)   window.dyoOpenGuest();              break;
          case 'blog':      if (window.dyoOpenBrowser) window.dyoOpenBrowser('/category'); break;
          case 'explorer':  if (window.dyoOpenExplorer) window.dyoOpenExplorer();          break;
          case 'gallery':    if (window.dyoOpenGallery)   window.dyoOpenGallery();           break;
          case 'tutorial':   if (window.dyoStartTutorial) window.dyoStartTutorial();         break;
          // 관리자 항목 — 새 탭 (iframe 은 크로스오리진 리다이렉트로 차단됨)
          case 'admin-write': window.open('/manage/newpost/?type=post&returnURL=%2Fmanage%2Fposts%2F', '_blank'); break;
          case 'admin-panel': if (window.dyoOpenAdminPanel) window.dyoOpenAdminPanel();      break;
          case 'theme-default':
          case 'theme-astronaut':
          case 'theme-sakura':
            // 드래그로 레이어 밖에 나간 오브젝트를 원래 레이어로 복귀
            (function resetThemeObjects() {
              var astroLayer = document.querySelector('.dyo-astronaut-layer');
              var catLayer = document.querySelector('.dyo-sakura-cat-layer');
              if (astroLayer) {
                desktop.querySelectorAll(':scope > .dyo-astronaut').forEach(function(el) {
                  el.style.cssText = '';
                  el.classList.remove('dyo-dragging', 'dyo-falling', 'dyo-walking');
                  if (el._astro) { if (el._astro.raf) cancelAnimationFrame(el._astro.raf); el._astro.phase = 'idle'; }
                  astroLayer.appendChild(el);
                });
              }
              if (catLayer) {
                desktop.querySelectorAll(':scope > .dyo-sakura-cat').forEach(function(el) {
                  el.style.cssText = '';
                  el.classList.remove('dyo-dragging', 'dyo-falling', 'dyo-walking');
                  if (el._scat) { if (el._scat.raf) cancelAnimationFrame(el._scat.raf); el._scat.phase = 'idle'; }
                  catLayer.appendChild(el);
                });
              }
            })();
            desktop.classList.remove('theme-astronaut', 'theme-sakura');
            if (action === 'theme-astronaut') desktop.classList.add('theme-astronaut');
            else if (action === 'theme-sakura') desktop.classList.add('theme-sakura');
            localStorage.setItem('dyo_desktop_theme', action.replace('theme-', ''));
            if (window.dyoToast) window.dyoToast(action.replace('theme-', '').charAt(0).toUpperCase() + action.replace('theme-', '').slice(1) + ' theme applied', 'success', 2000);
            break;
          case 'refresh':   location.reload();                                             break;
          // Explorer 아이템
          case 'exp-open':
            if (ctx && ctx.openFn) ctx.openFn();
            break;
          case 'exp-browser':
            if (ctx && ctx.child && ctx.child.url) {
              if (window.dyoOpenBrowser) window.dyoOpenBrowser(ctx.child.url);
            }
            break;
          case 'exp-props':
            if (ctx && ctx.child) {
              var ec = ctx.child;
              var isFolder = ctx.isFolder;
              showProps({
                name: ec.label,
                ext: isFolder ? '' : '.html',
                type: isFolder ? 'Folder' : 'Article',
                desc: ec.label + (isFolder ? ' 카테고리 폴더' : ' 블로그 포스트 카테고리'),
                location: ec.url || '/',
                size: '—', disk: '—',
                created: '—', modified: '—',
                owner: 'doyoucode', group: 'staff',
                permissions: 'Read-only', version: '—',
                iconBg: isFolder ? 'linear-gradient(145deg,#1c2128 0%,#161b22 100%)' : 'linear-gradient(145deg,#1c2128 0%,#161b22 100%)',
                iconBorder: '#30363d', iconColor: '#c9d1d9',
                iconChar: ec.icon || (isFolder ? '📂' : '📄')
              });
            }
            break;
        }
      });

      // Explorer 아이템 우클릭용 글로벌 함수
      window.dyoShowExpItemCtx = function(child, openFn, x, y) {
        var isFolder = !!(child.children && child.children.length);
        currentCtx = { type: 'exp-item', child: child, isFolder: isFolder, openFn: openFn };
        var items = [
          { label: isFolder
              ? L('📂 Open Folder',     '📂 폴더 열기')
              : L('🌐 Open in Browser', '🌐 브라우저로 열기'),
            action: 'exp-open' }
        ];
        if (isFolder && child.url) {
          items.push({ label: L('🌐 Open in Browser', '🌐 브라우저로 열기'), action: 'exp-browser' });
        }
        items.push('sep');
        items.push({ label: L('Properties', '속성'), action: 'exp-props' });
        buildMenu(items);
        showMenu(x, y);
      };
    })();

    // ============================================================
    // Properties Window
    // ============================================================
    (function() {
      var w        = document.getElementById('dyoPropsWin');
      var titlebar = document.getElementById('dyoPropsTitlebar');
      var closeBtn = document.getElementById('dyoPropsClose');
      var minBtn   = document.getElementById('dyoPropsMin');
      var maxBtn   = document.getElementById('dyoPropsMax');
      var titleEl  = document.getElementById('dyoPropsTitle');
      var bodyEl   = document.getElementById('dyoPropsBody');
      if (!w || !titlebar) return;

      var prevRect = null;

      // 풍부한 속성 내용 빌드
      function buildContent(meta) {
        var today = new Date().toISOString().slice(0, 10);
        var h = '';

        // 아이콘 헤더
        h += '<div class="dyo-props-icon-hdr">';
        h += '<div class="dyo-props-icon-box" style="background:' + meta.iconBg + ';border:1px solid ' + meta.iconBorder + ';">';
        h += '<span style="color:' + meta.iconColor + '">' + (meta.iconChar || '?') + '</span>';
        h += '</div>';
        h += '<div class="dyo-props-icon-name">' + meta.name + (meta.ext || '') + '</div>';
        h += '<div class="dyo-props-type-badge">' + meta.type + '</div>';
        h += '</div>';

        // General
        h += '<div class="dyo-props-section">';
        h += '<div class="dyo-props-section-title">General</div>';
        h += row('Name',        meta.name + (meta.ext || ''));
        h += row('Type',        meta.type);
        h += row('Description', meta.desc);
        h += row('Location',    meta.location, 'accent');
        if (meta.url) h += row('URL', meta.url, 'accent');
        h += '</div>';

        // Storage
        h += '<div class="dyo-props-section">';
        h += '<div class="dyo-props-section-title">Storage</div>';
        h += row('Size',    meta.size || '—');
        h += row('On disk', meta.disk || '—');
        h += '</div>';

        // Dates
        h += '<div class="dyo-props-section">';
        h += '<div class="dyo-props-section-title">Dates</div>';
        h += row('Created',  meta.created  || today);
        h += row('Modified', meta.modified || today);
        h += row('Accessed', today, 'green');
        h += '</div>';

        // Details
        h += '<div class="dyo-props-section">';
        h += '<div class="dyo-props-section-title">Details</div>';
        h += row('Owner',       meta.owner       || '—');
        h += row('Group',       meta.group       || '—');
        h += row('Permissions', meta.permissions || '—');
        if (meta.version && meta.version !== '—') h += row('Version', meta.version);
        h += row('Encoding',    'UTF-8');
        h += row('Platform',    'Web / Browser');
        h += '</div>';

        return h;
      }

      function row(key, val, cls) {
        return '<div class="dyo-props-row">' +
          '<span class="dyo-props-key">' + key + '</span>' +
          '<span class="dyo-props-val' + (cls ? ' ' + cls : '') + '">' + val + '</span>' +
          '</div>';
      }

      function openProps(meta) {
        var wasOpen = w.classList.contains('open');
        window._dyoLastPropsMeta = meta;
        titleEl.textContent = meta.name + ' — Properties';
        bodyEl.innerHTML = buildContent(meta);
        w.classList.remove('minimized', 'maximized');
        w.classList.add('open');
        bringToFront();
        if (!wasOpen && window.dyoAnimOpen) window.dyoAnimOpen(w);
      }

      function closeProps() {
        if (window.dyoAnimDismiss) {
          window.dyoAnimDismiss(w, function() { w.classList.remove('open', 'minimized', 'maximized'); });
        } else {
          w.classList.remove('open', 'minimized', 'maximized');
        }
      }
      function minimizeProps() {
        if (w.classList.contains('minimized')) {
          var tb = document.querySelector('.dyo-taskbtn[data-win-id="dyoPropsWin"]');
          window._dyoAnimSrc = tb || null;
          w.classList.remove('minimized');
          if (window.dyoAnimOpen) window.dyoAnimOpen(w);
        } else {
          if (window.dyoAnimMinimize) {
            window.dyoAnimMinimize(w, function() { w.classList.add('minimized'); });
          } else {
            w.classList.add('minimized');
          }
        }
      }
      function maximizeProps() {
        if (w.classList.contains('maximized')) {
          if (prevRect) {
            w.style.left = prevRect.l + 'px'; w.style.top    = prevRect.t + 'px';
            w.style.width = prevRect.w + 'px'; w.style.height = prevRect.h + 'px';
          }
          w.classList.remove('maximized');
          if (window.dyoAnimMaximizeOut) window.dyoAnimMaximizeOut(w);
        } else {
          w.classList.remove('minimized');
          var r = w.getBoundingClientRect();
          prevRect = { l: r.left, t: r.top, w: r.width, h: r.height };
          w.style.left = ''; w.style.top = ''; w.style.width = ''; w.style.height = '';
          w.classList.add('maximized');
          if (window.dyoAnimMaximizeIn) window.dyoAnimMaximizeIn(w);
        }
      }
      function bringToFront() {
        window._dyoZTop = (window._dyoZTop || 9000) + 1;
        w.style.zIndex = window._dyoZTop;
      }

      window.dyoOpenProps = openProps;

      w.addEventListener('mousedown', bringToFront);
      if (closeBtn) closeBtn.addEventListener('click', closeProps);
      if (minBtn)   minBtn.addEventListener('click',   minimizeProps);
      if (maxBtn)   maxBtn.addEventListener('click',   maximizeProps);

      titlebar.addEventListener('dblclick', function(e) {
        if (e.target === closeBtn || e.target === minBtn || e.target === maxBtn) return;
        maximizeProps();
      });

      // 드래그
      titlebar.addEventListener('mousedown', function(e) {
        if (w.classList.contains('maximized')) return;
        if (e.target === closeBtn || e.target === minBtn || e.target === maxBtn) return;
        var r = w.getBoundingClientRect();
        w.style.left = r.left + 'px'; w.style.top = r.top + 'px';
        var ox = e.clientX - r.left, oy = e.clientY - r.top;
        function onMove(ev) { w.style.left = (ev.clientX - ox) + 'px'; w.style.top = (ev.clientY - oy) + 'px'; }
        function onUp()    { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); }
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });

      // 리사이즈
      w.querySelectorAll('.dyo-brs-handle').forEach(function(handle) {
        handle.addEventListener('mousedown', function(e) {
          if (w.classList.contains('maximized')) return;
          e.preventDefault(); e.stopPropagation();
          var dir = handle.className.replace('dyo-brs-handle', '').trim();
          var r = w.getBoundingClientRect();
          var sx = e.clientX, sy = e.clientY;
          var sl = r.left, st = r.top, sw = r.width, sh = r.height;
          function onMove(ev) {
            var dx = ev.clientX - sx, dy = ev.clientY - sy;
            var nl = sl, nt = st, nw = sw, nh = sh;
            if (dir.includes('e')) nw = Math.max(260, sw + dx);
            if (dir.includes('s')) nh = Math.max(200, sh + dy);
            if (dir.includes('w')) { nw = Math.max(260, sw - dx); nl = sl + sw - nw; }
            if (dir.includes('n')) { nh = Math.max(200, sh - dy); nt = st + sh - nh; }
            w.style.width = nw + 'px'; w.style.height = nh + 'px';
            w.style.left  = nl + 'px'; w.style.top    = nt + 'px';
          }
          function onUp() { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); }
          document.addEventListener('mousemove', onMove);
          document.addEventListener('mouseup', onUp);
        });
      });
    })();

    // ============================================================
    // File Explorer Window
    // ============================================================
    (function() {
      var w        = document.getElementById('dyoExplorerWin');
      var titlebar = document.getElementById('dyoExplorerTitlebar');
      var closeBtn = document.getElementById('dyoExplorerClose');
      var minBtn   = document.getElementById('dyoExplorerMin');
      var maxBtn   = document.getElementById('dyoExplorerMax');
      var treeEl   = document.getElementById('dyoExplorerTree');
      var mainEl   = document.getElementById('dyoExplorerMain');
      if (!w || !titlebar) return;

      var prevRect  = null;
      var treeBuilt = false;
      var viewMode  = 'grid'; // 'grid' | 'list'

      // 뷰 전환 버튼
      var viewGridBtn = document.getElementById('dyoExpViewGrid');
      var viewListBtn = document.getElementById('dyoExpViewList');
      function setViewMode(mode) {
        viewMode = mode;
        if (viewGridBtn) viewGridBtn.classList.toggle('active', mode === 'grid');
        if (viewListBtn) viewListBtn.classList.toggle('active', mode === 'list');
        // 현재 위치 다시 렌더링
        if (navIdx >= 0 && navHistory[navIdx]) {
          var e = navHistory[navIdx];
          renderMain(e.node, e.ancestors);
        }
      }
      if (viewGridBtn) viewGridBtn.addEventListener('click', function() { setViewMode('grid'); });
      if (viewListBtn) viewListBtn.addEventListener('click', function() { setViewMode('list'); });

      // 탐색 히스토리
      var navHistory = [];
      var navIdx     = -1;
      var backBtn    = document.getElementById('dyoExpBack');
      var fwdBtn     = document.getElementById('dyoExpForward');
      var addrBar    = document.getElementById('dyoExpAddrBar');

      // 카테고리 트리 정의
      var tree = [
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
      ];

      // rootNode 정의 (트리 정의 이후에 위치해야 함)
      var rootNode = { label: 'Blog Root', icon: '📂', url: '/category', children: tree };

      function bringToFront() {
        window._dyoZTop = (window._dyoZTop || 9000) + 1;
        w.style.zIndex = window._dyoZTop;
      }

      // 노드 → 루트부터의 조상 배열 탐색
      function findAncestors(nodes, target, path) {
        for (var i = 0; i < nodes.length; i++) {
          var p = path.concat([nodes[i]]);
          if (nodes[i] === target) return p;
          if (nodes[i].children) {
            var r = findAncestors(nodes[i].children, target, p);
            if (r) return r;
          }
        }
        return null;
      }

      // 뒤로/앞으로 버튼 상태 갱신
      function updateNavBtns() {
        if (backBtn) backBtn.disabled = navIdx <= 0;
        if (fwdBtn)  fwdBtn.disabled  = navIdx >= navHistory.length - 1;
      }

      // 주소창 브레드크럼 갱신
      function updateAddrBar(ancestors) {
        if (!addrBar) return;
        addrBar.innerHTML = '';
        ancestors.forEach(function(node, i) {
          var isLast = i === ancestors.length - 1;
          var crumb = document.createElement('span');
          crumb.className = 'dyo-exp-crumb' + (isLast ? ' current' : '');
          crumb.textContent = node.icon + '\u00a0' + node.label;
          if (!isLast) {
            (function(n, idx) {
              crumb.addEventListener('click', function() {
                navigate(n, ancestors.slice(0, idx + 1));
              });
            })(node, i);
          }
          addrBar.appendChild(crumb);
          if (!isLast) {
            var sep = document.createElement('span');
            sep.className = 'dyo-exp-crumb-sep';
            sep.textContent = '›';
            addrBar.appendChild(sep);
          }
        });
      }

      // 탐색: 히스토리에 추가하고 렌더링
      function navigate(node, ancestors) {
        navHistory = navHistory.slice(0, navIdx + 1);
        navHistory.push({ node: node, ancestors: ancestors });
        navIdx = navHistory.length - 1;
        renderMain(node, ancestors);
        updateAddrBar(ancestors);
        updateNavBtns();
      }

      // 메인 패널 렌더링 (DOM 기반 — 클로저로 노드 참조 유지)
      function renderMain(node, ancestors) {
        mainEl.innerHTML = '';
        var curAncestors = ancestors || [rootNode];

        if (node.children && node.children.length > 0) {

          // ── 공통 이벤트 바인딩 헬퍼 ──
          function bindItem(el, c) {
            var openFn = c.children && c.children.length
              ? function() { navigate(c, curAncestors.concat([c])); }
              : function() { if (window.dyoOpenBrowser) window.dyoOpenBrowser(c.url); };
            el.addEventListener('click', openFn);
            el.addEventListener('contextmenu', function(e) {
              e.preventDefault(); e.stopPropagation();
              if (window.dyoShowExpItemCtx) window.dyoShowExpItemCtx(c, openFn, e.clientX, e.clientY);
            });
          }

          if (viewMode === 'list') {
            // ── List 뷰 ──
            var list = document.createElement('div');
            list.className = 'dyo-explorer-list';

            // 헤더
            var hdr = document.createElement('div');
            hdr.className = 'dyo-exp-list-header';
            hdr.innerHTML = '<span></span><span>Name</span><span>Type</span><span style="text-align:right">Items</span>';
            list.appendChild(hdr);

            node.children.forEach(function(child) {
              var isDir = child.children && child.children.length;
              var row = document.createElement('div');
              row.className = 'dyo-exp-list-item';
              row.innerHTML =
                '<span class="dyo-exp-list-icon">' + child.icon + '</span>' +
                '<span class="dyo-exp-list-name">' + child.label + '</span>' +
                '<span class="dyo-exp-list-type">' + (isDir ? 'Folder' : 'Category') + '</span>' +
                '<span class="dyo-exp-list-count">' + (isDir ? child.children.length : '—') + '</span>';
              (function(c) { bindItem(row, c); })(child);
              list.appendChild(row);
            });

            mainEl.appendChild(list);

          } else {
            // ── Grid 뷰 ──
            var grid = document.createElement('div');
            grid.className = 'dyo-explorer-grid';

            node.children.forEach(function(child) {
              var item = document.createElement('div');
              item.className = 'dyo-exp-item';
              item.innerHTML =
                '<div class="dyo-exp-item-icon">' + child.icon + '</div>' +
                '<div class="dyo-exp-item-label">' + child.label + '</div>';
              (function(c) { bindItem(item, c); })(child);
              grid.appendChild(item);
            });

            mainEl.appendChild(grid);
          }

        } else {
          // 리프 단독 표시
          var empty = document.createElement('div');
          empty.className = 'dyo-exp-empty';
          empty.innerHTML =
            '<div style="font-size:40px;margin-bottom:8px;">' + node.icon + '</div>' +
            '<div style="color:#8b949e;font-size:12px;margin-bottom:14px;">' + node.label + '</div>';
          var openBtn = document.createElement('button');
          openBtn.className = 'dyo-exp-open-btn';
          openBtn.textContent = 'Open in Browser \u2192';
          openBtn.addEventListener('click', function() {
            if (window.dyoOpenBrowser) window.dyoOpenBrowser(node.url);
          });
          empty.appendChild(openBtn);
          mainEl.appendChild(empty);
        }
      }

      // 트리 빌드
      function buildTreeNodes(nodes, depth, parentEl, setActive) {
        nodes.forEach(function(node) {
          var hasChildren = !!(node.children && node.children.length);
          var wrapper = document.createElement('div');

          var item = document.createElement('div');
          item.className = 'dyo-tree-item';
          item.style.paddingLeft = (8 + depth * 14) + 'px';

          var arrow = document.createElement('span');
          arrow.className = 'dyo-tree-arrow';
          arrow.textContent = hasChildren ? '▶' : '\u00a0';

          var label = document.createElement('span');
          label.textContent = node.icon + '\u00a0' + node.label;

          item.appendChild(arrow);
          item.appendChild(label);
          wrapper.appendChild(item);

          var childrenEl = null;
          if (hasChildren) {
            childrenEl = document.createElement('div');
            childrenEl.className = 'dyo-tree-children collapsed';
            buildTreeNodes(node.children, depth + 1, childrenEl, setActive);
            wrapper.appendChild(childrenEl);
          }

          item.addEventListener('click', function(e) {
            e.stopPropagation();
            // active 업데이트
            treeEl.querySelectorAll('.dyo-tree-item').forEach(function(el) { el.classList.remove('active'); });
            item.classList.add('active');
            var ancs = findAncestors([rootNode], node, []) || [rootNode, node];
            navigate(node, ancs);
            if (hasChildren && childrenEl) {
              var collapsed = childrenEl.classList.contains('collapsed');
              childrenEl.classList.toggle('collapsed');
              arrow.textContent = collapsed ? '▼' : '▶';
              arrow.classList.toggle('open', collapsed);
            }
          });

          parentEl.appendChild(wrapper);
        });
      }

      function buildTree() {
        if (treeBuilt) return;
        treeBuilt = true;

        // Root 항목
        var rootItem = document.createElement('div');
        rootItem.className = 'dyo-tree-item active';
        rootItem.style.paddingLeft = '8px';
        rootItem.innerHTML = '<span class="dyo-tree-arrow open">▼</span><span>📂\u00a0Blog Root</span>';

        var rootChildren = document.createElement('div');
        rootChildren.className = 'dyo-tree-children';
        buildTreeNodes(tree, 1, rootChildren, null);

        treeEl.appendChild(rootItem);
        treeEl.appendChild(rootChildren);

        rootItem.addEventListener('click', function() {
          treeEl.querySelectorAll('.dyo-tree-item').forEach(function(el) { el.classList.remove('active'); });
          rootItem.classList.add('active');
          navigate(rootNode, [rootNode]);
          var isCollapsed = rootChildren.classList.toggle('collapsed');
          var arrow = rootItem.querySelector('.dyo-tree-arrow');
          if (arrow) {
            arrow.textContent = isCollapsed ? '▶' : '▼';
            arrow.classList.toggle('open', !isCollapsed);
          }
        });

        navigate(rootNode, [rootNode]);
      }

      function openExplorer() {
        var wasOpen = w.classList.contains('open');
        if (!wasOpen) {
          var W = 680, H = 480;
          var _m4 = document.getElementById('dyoMemoWidget');
          var _mT4 = _m4 ? _m4.getBoundingClientRect().top : 28;
          var left = Math.max(10, Math.round((window.innerWidth  - W) / 2));
          var top  = _mT4;
          w.style.width  = W + 'px';
          w.style.height = H + 'px';
          w.style.left   = left + 'px';
          w.style.top    = top  + 'px';
          // 재오픈 시 히스토리 초기화
          navHistory = [];
          navIdx     = -1;
        }
        w.classList.remove('minimized', 'maximized');
        w.classList.add('open');
        bringToFront();
        if (!treeBuilt) {
          buildTree();         // 첫 오픈: 트리 빌드 + navigate(rootNode) 포함
        } else if (!wasOpen) {
          navigate(rootNode, [rootNode]); // 재오픈: root로 이동
        }
        if (!wasOpen && window.dyoAnimOpen) window.dyoAnimOpen(w);
      }

      // 뒤로가기
      if (backBtn) backBtn.addEventListener('click', function() {
        if (navIdx > 0) {
          navIdx--;
          var entry = navHistory[navIdx];
          renderMain(entry.node, entry.ancestors);
          updateAddrBar(entry.ancestors);
          updateNavBtns();
        }
      });

      // 앞으로가기
      if (fwdBtn) fwdBtn.addEventListener('click', function() {
        if (navIdx < navHistory.length - 1) {
          navIdx++;
          var entry = navHistory[navIdx];
          renderMain(entry.node, entry.ancestors);
          updateAddrBar(entry.ancestors);
          updateNavBtns();
        }
      });

      window.dyoOpenExplorer = openExplorer;

      w.addEventListener('mousedown', bringToFront);
      if (closeBtn) closeBtn.addEventListener('click', function() {
        if (window.dyoAnimDismiss) {
          window.dyoAnimDismiss(w, function() { w.classList.remove('open', 'minimized', 'maximized'); });
        } else {
          w.classList.remove('open', 'minimized', 'maximized');
        }
      });
      if (minBtn) minBtn.addEventListener('click', function() {
        if (w.classList.contains('minimized')) {
          var tb = document.querySelector('.dyo-taskbtn[data-win-id="dyoExplorerWin"]');
          window._dyoAnimSrc = tb || null;
          w.classList.remove('minimized');
          if (window.dyoAnimOpen) window.dyoAnimOpen(w);
        } else {
          if (window.dyoAnimMinimize) {
            window.dyoAnimMinimize(w, function() { w.classList.add('minimized'); });
          } else {
            w.classList.add('minimized');
          }
        }
      });
      if (maxBtn)   maxBtn.addEventListener('click', function() {
        if (w.classList.contains('maximized')) {
          if (prevRect) {
            w.style.left = prevRect.l + 'px'; w.style.top    = prevRect.t + 'px';
            w.style.width = prevRect.w + 'px'; w.style.height = prevRect.h + 'px';
          }
          w.classList.remove('maximized');
          if (window.dyoAnimMaximizeOut) window.dyoAnimMaximizeOut(w);
        } else {
          w.classList.remove('minimized');
          var r = w.getBoundingClientRect();
          prevRect = { l: r.left, t: r.top, w: r.width, h: r.height };
          w.style.left = ''; w.style.top = ''; w.style.width = ''; w.style.height = '';
          w.classList.add('maximized');
          if (window.dyoAnimMaximizeIn) window.dyoAnimMaximizeIn(w);
        }
      });

      titlebar.addEventListener('dblclick', function(e) {
        if (e.target === closeBtn || e.target === minBtn || e.target === maxBtn) return;
        maxBtn.click();
      });

      // 드래그
      titlebar.addEventListener('mousedown', function(e) {
        if (w.classList.contains('maximized')) return;
        if (e.target === closeBtn || e.target === minBtn || e.target === maxBtn) return;
        var r = w.getBoundingClientRect();
        w.style.left = r.left + 'px'; w.style.top = r.top + 'px';
        var ox = e.clientX - r.left, oy = e.clientY - r.top;
        function onMove(ev) { w.style.left = (ev.clientX - ox) + 'px'; w.style.top = (ev.clientY - oy) + 'px'; }
        function onUp() { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); }
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });

      // 리사이즈
      w.querySelectorAll('.dyo-brs-handle').forEach(function(handle) {
        handle.addEventListener('mousedown', function(e) {
          if (w.classList.contains('maximized')) return;
          e.preventDefault(); e.stopPropagation();
          var dir = handle.className.replace('dyo-brs-handle', '').trim();
          var r = w.getBoundingClientRect();
          var sx = e.clientX, sy = e.clientY;
          var sl = r.left, st = r.top, sw = r.width, sh = r.height;
          function onMove(ev) {
            var dx = ev.clientX - sx, dy = ev.clientY - sy;
            var nl = sl, nt = st, nw = sw, nh = sh;
            if (dir.includes('e')) nw = Math.max(380, sw + dx);
            if (dir.includes('s')) nh = Math.max(250, sh + dy);
            if (dir.includes('w')) { nw = Math.max(380, sw - dx); nl = sl + sw - nw; }
            if (dir.includes('n')) { nh = Math.max(250, sh - dy); nt = st + sh - nh; }
            w.style.width = nw + 'px'; w.style.height = nh + 'px';
            w.style.left  = nl + 'px'; w.style.top    = nt + 'px';
          }
          function onUp() { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); }
          document.addEventListener('mousemove', onMove);
          document.addEventListener('mouseup', onUp);
        });
      });
    })();

    // ============================================================
    // Links 창
    // ============================================================
    (function() {
      var LINKS_POST_URL = '/notice/133';

      var w         = document.getElementById('dyoLinksWin');
      var titlebar  = document.getElementById('dyoLinksTitlebar');
      var closeBtn  = document.getElementById('dyoLinksClose');
      var minBtn    = document.getElementById('dyoLinksMin');
      var maxBtn    = document.getElementById('dyoLinksMax');
      var main      = document.getElementById('dyoLinksMain');
      var searchInp = document.getElementById('dyoLinksSearch');
      var countEl   = document.getElementById('dyoLinksCount');
      if (!w) return;

      var prevRect = null;
      var _data = []; // [{ type:'folder', name, open, children:[{title,url}] }, { type:'link', title, url }]
      var _loaded = false;

      function bringToFront() {
        window._dyoZTop = (window._dyoZTop || 9000) + 1;
        w.style.zIndex = window._dyoZTop;
      }
function escHtml(s) {
        return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
      }
      function getFavicon(url) {
        try { return 'https://www.google.com/s2/favicons?domain=' + encodeURIComponent(new URL(url).origin) + '&sz=32'; }
        catch(e) { return ''; }
      }
      function getHost(url) {
        try { return new URL(url).hostname.replace(/^www\./, ''); } catch(e) { return ''; }
      }
      function countAll() {
        var n = 0;
        _data.forEach(function(d) { n += d.type === 'folder' ? d.children.length : 1; });
        return n;
      }

      // ── 파싱 ──
      // 양식: 폴더는 [폴더명] 으로 시작하는 줄, 링크는 "이름, URL" 형식
      // Tistory가 URL을 <a>로 변환하므로 북마크 위젯과 동일한 방식 사용
      function fetchData(url, cb) {
        fetch(url)
          .then(function(r) { return r.text(); })
          .then(function(html) {
            var doc = new DOMParser().parseFromString(html, 'text/html');
            var content = doc.querySelector('.article-view, #article-view, .tt_article_useless_p_margin, .entry-content');
            if (!content) { cb([]); return; }
            var result = [], currentFolder = null;

            // 줄 단위로 분리하여 처리 (Tistory는 <br>로 줄을 나눔)
            // innerHTML을 <br> 기준으로 쪼개고, 각 줄을 개별 처리
            function processLine(lineHtml) {
              var tmp = document.createElement('div');
              tmp.innerHTML = lineHtml;
              var txt = tmp.textContent.trim();
              if (!txt) return;

              // 폴더 판별: [폴더명] (줄 전체 또는 앞부분)
              var folderMatch = txt.match(/^\[([^\]]+)\]\s*$/);
              if (folderMatch) {
                currentFolder = { type:'folder', name:folderMatch[1].trim(), open:false, children:[] };
                result.push(currentFolder);
                return;
              }

              // <b> 또는 <strong>만 있는 줄 (URL 없음) → 폴더
              var boldEl = tmp.querySelector('b, strong');
              if (boldEl && !tmp.querySelector('a[href]') && !/https?:\/\//i.test(txt)) {
                currentFolder = { type:'folder', name:txt, open:false, children:[] };
                result.push(currentFolder);
                return;
              }

              // URL 추출: <a href> 우선, 없으면 텍스트 regex
              var anchors = tmp.querySelectorAll('a[href]');
              var href = '';
              for (var ai = 0; ai < anchors.length; ai++) {
                var h = anchors[ai].getAttribute('href').trim();
                if (/^https?:\/\//i.test(h)) { href = h; break; }
              }
              if (!href) {
                var m = txt.match(/https?:\/\/[^\s<>"']+/);
                if (!m) return;
                href = m[0].replace(/[.,)!?]+$/, '');
              }

              // 이름 추출: 쉼표 앞 텍스트, 없으면 <a> 앞 텍스트, 없으면 도메인
              var name = '';
              var commaIdx = txt.indexOf(',');
              if (commaIdx !== -1) {
                var before = txt.slice(0, commaIdx).trim();
                // URL이 아닌 경우만 이름으로 사용
                if (before && !/^https?:\/\//i.test(before)) name = before;
              }
              if (!name && anchors.length) {
                var anchorText = anchors[0].textContent.trim();
                var pos = txt.indexOf(anchorText);
                if (pos > 0) {
                  var beforeAnchor = txt.slice(0, pos).trim().replace(/[,\s]+$/, '');
                  if (beforeAnchor && !/^https?:\/\//i.test(beforeAnchor)) name = beforeAnchor;
                }
                if (!name && anchorText && !/^https?:\/\//i.test(anchorText)) name = anchorText;
              }
              if (!name) { try { name = new URL(href).hostname.replace(/^www\./, ''); } catch(e) { name = href; } }

              var item = { title: name, url: href };
              if (currentFolder) currentFolder.children.push(item);
              else result.push({ type:'link', title:name, url:href });
            }

            content.querySelectorAll('p, li, h2, h3, h4').forEach(function(el) {
              var tag = el.tagName.toLowerCase();

              // h2/h3/h4 → 폴더
              if (tag === 'h2' || tag === 'h3' || tag === 'h4') {
                var txt = el.textContent.trim();
                if (txt) {
                  currentFolder = { type:'folder', name:txt, open:false, children:[] };
                  result.push(currentFolder);
                }
                return;
              }

              // <br>이 있으면 줄 단위로 분리해서 처리
              var innerHtml = el.innerHTML;
              if (/<br\s*\/?>/i.test(innerHtml)) {
                var lines = innerHtml.split(/<br\s*\/?>/i);
                lines.forEach(function(line) { processLine(line); });
              } else {
                processLine(innerHtml);
              }
            });
            cb(result);
          })
          .catch(function() { cb([]); });
      }

      // ── 통합 렌더 (중복 방지) ──
      var _renderQueued = false;
      function renderAll() {
        if (_renderQueued) return;
        _renderQueued = true;
        requestAnimationFrame(function() {
          _renderQueued = false;
          _renderMain();
        });
      }

      // ── 메인 영역 렌더 (폴더 트리 스타일) ──
      function _renderMain() {
        main.innerHTML = '';
        var q = (searchInp ? searchInp.value : '').toLowerCase();
        var total = 0;

        function matchFilter(link) {
          if (!q) return true;
          return link.title.toLowerCase().indexOf(q) !== -1 || link.url.toLowerCase().indexOf(q) !== -1;
        }

        function createLinkEl(link) {
          var li = document.createElement('div');
          li.className = 'dyo-links-item';
          var fav = getFavicon(link.url);
          var host = getHost(link.url);
          li.innerHTML =
            (fav ? '<img class="dyo-links-fav" src="' + fav + '" alt="" draggable="false">' : '<span class="dyo-links-fav-fb"></span>') +
            '<span class="dyo-links-item-text">' +
              '<span class="dyo-links-item-title">' + escHtml(link.title) + '</span>' +
              (host ? '<span class="dyo-links-item-host">' + escHtml(host) + '</span>' : '') +
            '</span>';
          li.dataset.url = link.url;
          total++;
          return li;
        }

        _data.forEach(function(item, di) {
          if (item.type === 'folder') {
            var filtered = item.children.filter(matchFilter);
            if (!filtered.length && q) return;

            // 폴더 헤더
            var folderDiv = document.createElement('div');
            folderDiv.className = 'dyo-links-folder';

            var hdr = document.createElement('div');
            hdr.className = 'dyo-links-folder-header';
            hdr.dataset.folderIdx = di;
            var isOpen = item.open || (q && filtered.length > 0);
            hdr.innerHTML =
              '<span class="dyo-links-folder-arrow' + (isOpen ? ' open' : '') + '">▶</span>' +
              '<span class="dyo-links-folder-icon">📁</span>' +
              '<span class="dyo-links-folder-name">' + escHtml(item.name) + '</span>' +
              '<span class="dyo-links-folder-count">' + item.children.length + '</span>';
            folderDiv.appendChild(hdr);

            // 폴더 내용
            var body = document.createElement('div');
            body.className = 'dyo-links-folder-body';
            body.style.display = isOpen ? '' : 'none';
            filtered.forEach(function(link) {
              body.appendChild(createLinkEl(link));
            });
            folderDiv.appendChild(body);
            main.appendChild(folderDiv);
          } else {
            if (matchFilter(item)) main.appendChild(createLinkEl(item));
          }
        });

        if (!total && !_data.some(function(d) { return d.type === 'folder'; })) {
          main.innerHTML = '<div class="dyo-links-empty">' + (q ? '검색 결과 없음' : '링크가 없습니다') + '</div>';
        }
        if (countEl) countEl.textContent = countAll() + ' links';
      }

      // 메인 이벤트 위임 (한 번만 등록)
      main.addEventListener('click', function(e) {
        // 폴더 토글
        var hdr = e.target.closest('.dyo-links-folder-header');
        if (hdr) {
          var idx = parseInt(hdr.dataset.folderIdx, 10);
          _data[idx].open = !_data[idx].open;
          var arrow = hdr.querySelector('.dyo-links-folder-arrow');
          var body = hdr.nextElementSibling;
          if (_data[idx].open) {
            arrow.classList.add('open');
            body.style.display = '';
          } else {
            arrow.classList.remove('open');
            body.style.display = 'none';
          }
          return;
        }
        // 링크 클릭
        var item = e.target.closest('.dyo-links-item');
        if (item && item.dataset.url) {
          window.open(item.dataset.url, '_blank', 'noopener');
        }
      });

      // ── 이벤트 ──
      var _searchTimer = 0;
      if (searchInp) searchInp.addEventListener('input', function() {
        clearTimeout(_searchTimer);
        _searchTimer = setTimeout(function() { renderAll(); }, 150);
      });

      // ── 창 열기 ──
      function openLinks() {
        var wasOpen = w.classList.contains('open');
        if (!wasOpen) {
          var W = 600, H = 500;
          var left = Math.max(10, Math.round((window.innerWidth - W) / 2));
          var _m = document.getElementById('dyoMemoWidget');
          var top = _m ? _m.getBoundingClientRect().top : 28;
          w.style.width = W + 'px'; w.style.height = H + 'px';
          w.style.left = left + 'px'; w.style.top = top + 'px';
        }
        w.classList.remove('minimized', 'maximized');
        w.classList.add('open');
        bringToFront();
        if (!_loaded) {
          main.innerHTML = '<div class="dyo-links-empty">로딩 중…</div>';
          fetchData(LINKS_POST_URL, function(data) {
            _data = data;
            _loaded = true;
            _renderMain();
          });
        }
        if (!wasOpen && window.dyoAnimOpen) window.dyoAnimOpen(w);
      }
      window.dyoOpenLinks = openLinks;

      // ── 창 제어 ──
      w.addEventListener('mousedown', bringToFront);
      if (closeBtn) closeBtn.addEventListener('click', function() {
        if (window.dyoAnimDismiss) window.dyoAnimDismiss(w, function() { w.classList.remove('open', 'minimized', 'maximized'); });
        else w.classList.remove('open', 'minimized', 'maximized');
      });
      if (minBtn) minBtn.addEventListener('click', function() {
        if (w.classList.contains('minimized')) {
          var tb = document.querySelector('.dyo-dock-item[data-win-id="dyoLinksWin"]') || document.querySelector('.dyo-taskbtn[data-win-id="dyoLinksWin"]');
          window._dyoAnimSrc = tb || null;
          w.classList.remove('minimized');
          if (window.dyoAnimOpen) window.dyoAnimOpen(w);
        } else {
          if (window.dyoAnimMinimize) window.dyoAnimMinimize(w, function() { w.classList.add('minimized'); });
          else w.classList.add('minimized');
        }
      });
      if (maxBtn) maxBtn.addEventListener('click', function() {
        if (w.classList.contains('maximized')) {
          if (prevRect) { w.style.left = prevRect.l + 'px'; w.style.top = prevRect.t + 'px'; w.style.width = prevRect.w + 'px'; w.style.height = prevRect.h + 'px'; }
          w.classList.remove('maximized');
          if (window.dyoAnimMaximizeOut) window.dyoAnimMaximizeOut(w);
        } else {
          w.classList.remove('minimized');
          var r = w.getBoundingClientRect();
          prevRect = { l: r.left, t: r.top, w: r.width, h: r.height };
          w.style.left = ''; w.style.top = ''; w.style.width = ''; w.style.height = '';
          w.classList.add('maximized');
          if (window.dyoAnimMaximizeIn) window.dyoAnimMaximizeIn(w);
        }
      });

      // ── 타이틀바 더블클릭 최대화 ──
      titlebar.addEventListener('dblclick', function(e) {
        if (e.target === closeBtn || e.target === minBtn || e.target === maxBtn) return;
        maxBtn.click();
      });

      // ── 타이틀바 드래그 ──
      titlebar.addEventListener('mousedown', function(e) {
        if (w.classList.contains('maximized')) return;
        if (e.target === closeBtn || e.target === minBtn || e.target === maxBtn) return;
        var r = w.getBoundingClientRect();
        w.style.left = r.left + 'px'; w.style.top = r.top + 'px';
        var ox = e.clientX - r.left, oy = e.clientY - r.top;
        function onMove(ev) { w.style.left = (ev.clientX - ox) + 'px'; w.style.top = (ev.clientY - oy) + 'px'; }
        function onUp() { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); }
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });

      // ── 리사이즈 ──
      w.querySelectorAll('.dyo-brs-handle').forEach(function(handle) {
        handle.addEventListener('mousedown', function(e) {
          if (w.classList.contains('maximized')) return;
          e.preventDefault(); e.stopPropagation();
          var dir = handle.className.replace('dyo-brs-handle', '').trim();
          var r = w.getBoundingClientRect();
          var sx = e.clientX, sy = e.clientY, sl = r.left, st = r.top, sw = r.width, sh = r.height;
          function onMove(ev) {
            var dx = ev.clientX - sx, dy = ev.clientY - sy;
            var nl = sl, nt = st, nw = sw, nh = sh;
            if (dir.includes('e')) nw = Math.max(380, sw + dx);
            if (dir.includes('s')) nh = Math.max(300, sh + dy);
            if (dir.includes('w')) { nw = Math.max(380, sw - dx); nl = sl + sw - nw; }
            if (dir.includes('n')) { nh = Math.max(300, sh - dy); nt = st + sh - nh; }
            w.style.width = nw + 'px'; w.style.height = nh + 'px';
            w.style.left = nl + 'px'; w.style.top = nt + 'px';
          }
          function onUp() { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); }
          document.addEventListener('mousemove', onMove);
          document.addEventListener('mouseup', onUp);
        });
      });
    })();
  