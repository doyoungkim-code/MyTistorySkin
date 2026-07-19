
    (function() {
      var w        = document.getElementById('dyoReadmeWin');
      var titlebar = document.getElementById('dyoReadmeTitlebar');
      var closeBtn = document.getElementById('dyoReadmeClose');
      var minBtn   = document.getElementById('dyoReadmeMin');
      var maxBtn   = document.getElementById('dyoReadmeMax');
      if (!w) return;

      var dragging = false, dragOX = 0, dragOY = 0;
      var resizing = false, resizeDir = '', resizeSX = 0, resizeSY = 0, resizeSRect = null;
      var MIN_W = 360, MIN_H = 180;
      var savedPos = null;

      function openReadme() {
        var wasOpen = w.classList.contains('open');
        if (!wasOpen) {
          var W = Math.min(700, window.innerWidth  - 40);
          var H = Math.min(480, window.innerHeight - 40);
          w.style.width  = W + 'px';
          w.style.height = H + 'px';
          var _m3 = document.getElementById('dyoMemoWidget');
          var _mT3 = _m3 ? _m3.getBoundingClientRect().top : 28;
          w.style.left   = Math.round((window.innerWidth  - W) / 2) + 'px';
          w.style.top    = _mT3 + 'px';
          w.style.right  = 'auto';
          w.style.bottom = 'auto';
        }
        w.classList.add('open');
        w.classList.remove('minimized');
        window._dyoZTop = (window._dyoZTop || 9000) + 1;
        w.style.zIndex = window._dyoZTop;
        if (!wasOpen && window.dyoAnimOpen) window.dyoAnimOpen(w);
      }
      function closeReadme() {
        if (window.dyoAnimDismiss) {
          window.dyoAnimDismiss(w, function() {
            w.classList.remove('open', 'minimized', 'maximized');
            savedPos = null;
          });
        } else {
          w.classList.remove('open', 'minimized', 'maximized');
          savedPos = null;
        }
      }
      function minimizeReadme() {
        if (w.classList.contains('minimized')) {
          var tb = document.querySelector('.dyo-taskbtn[data-win-id="dyoReadmeWin"]');
          window._dyoAnimSrc = tb || null;
          w.classList.remove('minimized');
          if (window.dyoAnimOpen) window.dyoAnimOpen(w);
        } else {
          if (w.classList.contains('maximized')) {
            w.classList.remove('maximized');
            if (savedPos) {
              w.style.left = savedPos.left; w.style.top = savedPos.top;
              w.style.right = savedPos.right; w.style.bottom = savedPos.bottom;
              w.style.width = savedPos.width; w.style.height = savedPos.height;
              savedPos = null;
            }
          }
          if (window.dyoAnimMinimize) {
            window.dyoAnimMinimize(w, function() { w.classList.add('minimized'); });
          } else {
            w.classList.add('minimized');
          }
        }
      }
      function maximizeReadme() {
        if (w.classList.contains('maximized')) {
          w.classList.remove('maximized');
          if (savedPos) {
            w.style.left   = savedPos.left;
            w.style.top    = savedPos.top;
            w.style.right  = savedPos.right;
            w.style.bottom = savedPos.bottom;
            w.style.width  = savedPos.width;
            w.style.height = savedPos.height;
            savedPos = null;
          }
          if (window.dyoAnimMaximizeOut) window.dyoAnimMaximizeOut(w);
        } else {
          w.classList.remove('minimized');
          savedPos = {
            left: w.style.left, top: w.style.top,
            right: w.style.right, bottom: w.style.bottom,
            width: w.style.width, height: w.style.height
          };
          w.classList.add('maximized');
          w.style.left = w.style.top = w.style.right =
          w.style.bottom = w.style.width = w.style.height = '';
          if (window.dyoAnimMaximizeIn) window.dyoAnimMaximizeIn(w);
        }
      }

      window.dyoOpenReadme = openReadme;

      w.addEventListener('mousedown', function() {
        window._dyoZTop = (window._dyoZTop || 9000) + 1;
        w.style.zIndex = window._dyoZTop;
      });
      if (closeBtn) closeBtn.addEventListener('click', closeReadme);
      if (minBtn)   minBtn.addEventListener('click',   minimizeReadme);
      if (maxBtn)   maxBtn.addEventListener('click',   maximizeReadme);

      // 타이틀바 더블클릭 → 최대화 토글
      if (titlebar) {
        titlebar.addEventListener('dblclick', function(e) {
          if (e.target === closeBtn || e.target === minBtn || e.target === maxBtn) return;
          maximizeReadme();
        });

        // 드래그
        titlebar.addEventListener('mousedown', function(e) {
          if (w.classList.contains('maximized')) return;
          if (e.target === closeBtn || e.target === minBtn || e.target === maxBtn) return;
          var rect = w.getBoundingClientRect();
          w.style.left = rect.left + 'px'; w.style.top = rect.top + 'px';
          w.style.right = 'auto'; w.style.bottom = 'auto';
          dragging = true;
          dragOX = e.clientX - rect.left;
          dragOY = e.clientY - rect.top;
          e.preventDefault();
        });

        // 터치 드래그
        titlebar.addEventListener('touchstart', function(e) {
          if (w.classList.contains('maximized')) return;
          var t = e.touches[0];
          var rect = w.getBoundingClientRect();
          w.style.left = rect.left + 'px'; w.style.top = rect.top + 'px';
          w.style.right = 'auto'; w.style.bottom = 'auto';
          dragging = true;
          dragOX = t.clientX - rect.left;
          dragOY = t.clientY - rect.top;
        }, { passive: true });
      }

      document.addEventListener('mousemove', function(e) {
        if (dragging) {
          var x = Math.max(0, Math.min(window.innerWidth  - w.offsetWidth,  e.clientX - dragOX));
          var y = Math.max(0, Math.min(window.innerHeight - 40, e.clientY - dragOY));
          w.style.left = x + 'px'; w.style.top = y + 'px';
        }
        if (resizing) {
          var dx = e.clientX - resizeSX;
          var dy = e.clientY - resizeSY;
          var r = resizeSRect;
          var nL = r.left, nT = r.top, nW = r.width, nH = r.height;
          if (resizeDir.indexOf('e') !== -1) nW = Math.max(MIN_W, r.width + dx);
          if (resizeDir.indexOf('s') !== -1) nH = Math.max(MIN_H, r.height + dy);
          if (resizeDir.indexOf('w') !== -1) { nW = Math.max(MIN_W, r.width - dx); nL = r.left + r.width - nW; }
          if (resizeDir.indexOf('n') !== -1) { nH = Math.max(MIN_H, r.height - dy); nT = r.top + r.height - nH; }
          w.style.left = nL + 'px'; w.style.top = nT + 'px';
          w.style.width = nW + 'px'; w.style.height = nH + 'px';
        }
      });
      document.addEventListener('touchmove', function(e) {
        if (!dragging) return;
        var t = e.touches[0];
        var x = Math.max(0, Math.min(window.innerWidth  - w.offsetWidth,  t.clientX - dragOX));
        var y = Math.max(0, Math.min(window.innerHeight - 40, t.clientY - dragOY));
        w.style.left = x + 'px'; w.style.top = y + 'px';
      }, { passive: true });
      document.addEventListener('mouseup',  function() { dragging = false; resizing = false; });
      document.addEventListener('touchend', function() { dragging = false; });

      // 리사이즈 핸들
      w.querySelectorAll('.dyo-brs-handle').forEach(function(handle) {
        handle.addEventListener('mousedown', function(e) {
          if (w.classList.contains('maximized') || w.classList.contains('minimized')) return;
          e.stopPropagation(); e.preventDefault();
          resizing = true;
          resizeDir = handle.getAttribute('data-dir');
          resizeSX = e.clientX; resizeSY = e.clientY;
          var rect = w.getBoundingClientRect();
          resizeSRect = { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
          w.style.left = rect.left + 'px'; w.style.top = rect.top + 'px';
          w.style.width = rect.width + 'px'; w.style.height = rect.height + 'px';
          w.style.right = 'auto'; w.style.bottom = 'auto';
        });
      });
    })();

    // ============================================================
    // Features 폴더 창 (File Explorer 스타일 — 드래그/리사이즈/최소화/최대화)
    // ============================================================
    (function() {
      var w        = document.getElementById('dyoFeaturesWin');
      var titlebar = document.getElementById('dyoFeaturesTitlebar');
      var closeBtn = document.getElementById('dyoFeaturesClose');
      var minBtn   = document.getElementById('dyoFeaturesMin');
      var maxBtn   = document.getElementById('dyoFeaturesMax');
      if (!w) return;

      var dragging = false, dragOX = 0, dragOY = 0;
      var resizing = false, resizeDir = '', resizeSX = 0, resizeSY = 0, resizeSRect = null;
      var MIN_W = 420, MIN_H = 280;
      var savedPos = null;

      // ── 폴더 내용 (File Explorer 스타일 렌더링) ──
      var treeEl     = document.getElementById('dyoFeatTree');
      var mainEl     = document.getElementById('dyoFeatMain');
      var addrBar    = document.getElementById('dyoFeatAddrBar');
      var viewGridBtn = document.getElementById('dyoFeatViewGrid');
      var viewListBtn = document.getElementById('dyoFeatViewList');
      var viewMode   = 'grid';
      var featBuilt  = false;

      var FEAT_ITEMS = [
        { id: 'fpBlogram', label: 'Blogram', type: 'App', ctxKey: 'desktopIconGallery',
          icon: '<div class="dyo-di-wrap" style="background:linear-gradient(135deg,#833ab4,#c13584 35%,#e1306c 60%,#f77737 85%,#fcaf45);border:1px solid rgba(225,48,108,.4);box-shadow:0 4px 12px rgba(193,53,132,.4),inset 0 1px 0 rgba(255,255,255,.15)"><svg viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="6" stroke="white" stroke-width="1.8"/><circle cx="12" cy="12" r="5" stroke="white" stroke-width="1.8"/><circle cx="17.5" cy="6.5" r="1.3" fill="white"/></svg></div>',
          open: function() { if (window.dyoOpenGallery) window.dyoOpenGallery(); } },
        { id: 'fpMusic', label: 'Music', type: 'App', ctxKey: 'desktopIconMusic',
          icon: '<div class="dyo-di-wrap" style="background:linear-gradient(145deg,#fc3c44,#ff2d55);border:1px solid rgba(255,45,85,.4);box-shadow:0 4px 12px rgba(255,45,85,.4),inset 0 1px 0 rgba(255,255,255,.15)"><svg viewBox="0 0 24 24" fill="none"><path d="M9 18V5l12-2v13" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="6" cy="18" r="3" stroke="white" stroke-width="1.8"/><circle cx="18" cy="16" r="3" stroke="white" stroke-width="1.8"/></svg></div>',
          open: function() { if (window.dyoOpenMusic) window.dyoOpenMusic(); } },
        { id: 'fpGithub', label: 'GitHub', type: 'Link', ctxKey: 'desktopIconGithub', external: true,
          icon: '<div class="dyo-di-wrap" style="background:linear-gradient(145deg,#24292e,#1a1e22);border:1px solid rgba(139,148,158,.3);box-shadow:0 4px 12px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.05)"><svg viewBox="0 0 24 24" fill="white"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.741 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/></svg></div>',
          open: function() { if (window.dyoOpenExternal) window.dyoOpenExternal('https://github.com/doyoungkim-code'); } },
        { id: 'fpLinks', label: 'Links', type: 'App', ctxKey: 'fpLinks',
          icon: '<div class="dyo-di-wrap" style="background:linear-gradient(145deg,#0c4a6e,#0284c7);border:1px solid rgba(56,189,248,.4);box-shadow:0 4px 12px rgba(2,132,199,.4),inset 0 1px 0 rgba(255,255,255,.1)"><svg viewBox="0 0 24 24" fill="none"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="white" stroke-width="1.8" stroke-linecap="round"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="white" stroke-width="1.8" stroke-linecap="round"/></svg></div>',
          open: function() { if (window.dyoOpenLinks) window.dyoOpenLinks(); } }
      ];

      function launchFeat(it, srcEl) {
        if (!it.external) window._dyoAnimSrc = srcEl || null;
        it.open();
      }
      function bindFeatItem(el, it) {
        el.addEventListener('click', function() { launchFeat(it, el); });
        el.addEventListener('contextmenu', function(e) {
          e.preventDefault(); e.stopPropagation();
          if (window.dyoShowIconCtxMenu) window.dyoShowIconCtxMenu(it.ctxKey, e.clientX, e.clientY);
        });
      }
      function renderFeatMain() {
        if (!mainEl) return;
        mainEl.innerHTML = '';
        if (viewMode === 'list') {
          var list = document.createElement('div');
          list.className = 'dyo-explorer-list';
          var hdr = document.createElement('div');
          hdr.className = 'dyo-exp-list-header';
          hdr.innerHTML = '<span></span><span>Name</span><span>Type</span><span style="text-align:right">Items</span>';
          list.appendChild(hdr);
          FEAT_ITEMS.forEach(function(it) {
            var row = document.createElement('div');
            row.className = 'dyo-exp-list-item';
            row.innerHTML =
              '<span class="dyo-exp-list-icon">' + it.icon + '</span>' +
              '<span class="dyo-exp-list-name">' + it.label + '</span>' +
              '<span class="dyo-exp-list-type">' + it.type + '</span>' +
              '<span class="dyo-exp-list-count">—</span>';
            bindFeatItem(row, it);
            list.appendChild(row);
          });
          mainEl.appendChild(list);
        } else {
          var grid = document.createElement('div');
          grid.className = 'dyo-explorer-grid';
          FEAT_ITEMS.forEach(function(it) {
            var item = document.createElement('div');
            item.className = 'dyo-exp-item';
            item.innerHTML =
              '<div class="dyo-exp-item-icon">' + it.icon + '</div>' +
              '<div class="dyo-exp-item-label">' + it.label + '</div>';
            bindFeatItem(item, it);
            grid.appendChild(item);
          });
          mainEl.appendChild(grid);
        }
      }
      // 현재 모드 라벨 — Windows: '📁 폴더', Linux: '📁 Features'
      function featLabel() {
        return document.documentElement.classList.contains('dyo-mode-windows') ? '📁 폴더' : '📁 Features';
      }
      function renderFeatAddr() {
        if (!addrBar) return;
        addrBar.innerHTML = '';
        var crumb = document.createElement('span');
        crumb.className = 'dyo-exp-crumb current';
        crumb.textContent = '📁 Features';
        crumb.setAttribute('data-label-win', '📁 폴더');
        crumb.setAttribute('data-label-linux', '📁 Features');
        crumb.textContent = featLabel();
        addrBar.appendChild(crumb);
      }
      function buildFeatTree() {
        if (!treeEl) return;
        treeEl.innerHTML = '';
        var rootItem = document.createElement('div');
        rootItem.className = 'dyo-tree-item active';
        rootItem.style.paddingLeft = '8px';
        rootItem.innerHTML = '<span class="dyo-tree-arrow"> </span><span>📁 Features</span>';
        var rootLbl = rootItem.querySelector('span:last-child');
        if (rootLbl) {
          rootLbl.setAttribute('data-label-win', '📁 폴더');
          rootLbl.setAttribute('data-label-linux', '📁 Features');
          rootLbl.textContent = featLabel();
        }
        treeEl.appendChild(rootItem);
      }
      function buildFeat() {
        if (featBuilt) return;
        featBuilt = true;
        buildFeatTree();
        renderFeatAddr();
        renderFeatMain();
      }
      if (viewGridBtn) viewGridBtn.addEventListener('click', function() {
        viewMode = 'grid';
        viewGridBtn.classList.add('active');
        if (viewListBtn) viewListBtn.classList.remove('active');
        renderFeatMain();
      });
      if (viewListBtn) viewListBtn.addEventListener('click', function() {
        viewMode = 'list';
        viewListBtn.classList.add('active');
        if (viewGridBtn) viewGridBtn.classList.remove('active');
        renderFeatMain();
      });

      function openFeatures() {
        buildFeat();
        var wasOpen = w.classList.contains('open');
        if (!wasOpen) {
          var W = Math.min(600, window.innerWidth  - 40);
          var H = Math.min(420, window.innerHeight - 40);
          w.style.width  = W + 'px';
          w.style.height = H + 'px';
          w.style.left   = Math.round((window.innerWidth  - W) / 2) + 'px';
          w.style.top    = Math.round((window.innerHeight - H) / 3) + 'px';
          w.style.right  = 'auto';
          w.style.bottom = 'auto';
        }
        w.classList.add('open');
        w.classList.remove('minimized');
        window._dyoZTop = (window._dyoZTop || 9000) + 1;
        w.style.zIndex = window._dyoZTop;
        if (!wasOpen && window.dyoAnimOpen) window.dyoAnimOpen(w);
      }
      function closeFeatures() {
        if (window.dyoAnimDismiss) {
          window.dyoAnimDismiss(w, function() {
            w.classList.remove('open', 'minimized', 'maximized');
            savedPos = null;
          });
        } else {
          w.classList.remove('open', 'minimized', 'maximized');
          savedPos = null;
        }
      }
      function minimizeFeatures() {
        if (w.classList.contains('minimized')) {
          var tb = document.querySelector('.dyo-taskbtn[data-win-id="dyoFeaturesWin"]');
          window._dyoAnimSrc = tb || null;
          w.classList.remove('minimized');
          if (window.dyoAnimOpen) window.dyoAnimOpen(w);
        } else {
          if (w.classList.contains('maximized')) {
            w.classList.remove('maximized');
            if (savedPos) {
              w.style.left = savedPos.left; w.style.top = savedPos.top;
              w.style.right = savedPos.right; w.style.bottom = savedPos.bottom;
              w.style.width = savedPos.width; w.style.height = savedPos.height;
              savedPos = null;
            }
          }
          if (window.dyoAnimMinimize) {
            window.dyoAnimMinimize(w, function() { w.classList.add('minimized'); });
          } else {
            w.classList.add('minimized');
          }
        }
      }
      function maximizeFeatures() {
        if (w.classList.contains('maximized')) {
          w.classList.remove('maximized');
          if (savedPos) {
            w.style.left   = savedPos.left;
            w.style.top    = savedPos.top;
            w.style.right  = savedPos.right;
            w.style.bottom = savedPos.bottom;
            w.style.width  = savedPos.width;
            w.style.height = savedPos.height;
            savedPos = null;
          }
          if (window.dyoAnimMaximizeOut) window.dyoAnimMaximizeOut(w);
        } else {
          w.classList.remove('minimized');
          savedPos = {
            left: w.style.left, top: w.style.top,
            right: w.style.right, bottom: w.style.bottom,
            width: w.style.width, height: w.style.height
          };
          w.classList.add('maximized');
          w.style.left = w.style.top = w.style.right =
          w.style.bottom = w.style.width = w.style.height = '';
          if (window.dyoAnimMaximizeIn) window.dyoAnimMaximizeIn(w);
        }
      }

      window.dyoOpenFeatures = openFeatures;

      w.addEventListener('mousedown', function() {
        window._dyoZTop = (window._dyoZTop || 9000) + 1;
        w.style.zIndex = window._dyoZTop;
      });
      if (closeBtn) closeBtn.addEventListener('click', closeFeatures);
      if (minBtn)   minBtn.addEventListener('click',   minimizeFeatures);
      if (maxBtn)   maxBtn.addEventListener('click',   maximizeFeatures);

      if (titlebar) {
        titlebar.addEventListener('dblclick', function(e) {
          if (e.target === closeBtn || e.target === minBtn || e.target === maxBtn) return;
          maximizeFeatures();
        });
        titlebar.addEventListener('mousedown', function(e) {
          if (w.classList.contains('maximized')) return;
          if (e.target === closeBtn || e.target === minBtn || e.target === maxBtn) return;
          var rect = w.getBoundingClientRect();
          w.style.left = rect.left + 'px'; w.style.top = rect.top + 'px';
          w.style.right = 'auto'; w.style.bottom = 'auto';
          dragging = true;
          dragOX = e.clientX - rect.left;
          dragOY = e.clientY - rect.top;
          e.preventDefault();
        });
        titlebar.addEventListener('touchstart', function(e) {
          if (w.classList.contains('maximized')) return;
          var t = e.touches[0];
          var rect = w.getBoundingClientRect();
          w.style.left = rect.left + 'px'; w.style.top = rect.top + 'px';
          w.style.right = 'auto'; w.style.bottom = 'auto';
          dragging = true;
          dragOX = t.clientX - rect.left;
          dragOY = t.clientY - rect.top;
        }, { passive: true });
      }

      document.addEventListener('mousemove', function(e) {
        if (dragging) {
          var x = Math.max(0, Math.min(window.innerWidth  - w.offsetWidth,  e.clientX - dragOX));
          var y = Math.max(0, Math.min(window.innerHeight - 40, e.clientY - dragOY));
          w.style.left = x + 'px'; w.style.top = y + 'px';
        }
        if (resizing) {
          var dx = e.clientX - resizeSX;
          var dy = e.clientY - resizeSY;
          var r = resizeSRect;
          var nL = r.left, nT = r.top, nW = r.width, nH = r.height;
          if (resizeDir.indexOf('e') !== -1) nW = Math.max(MIN_W, r.width + dx);
          if (resizeDir.indexOf('s') !== -1) nH = Math.max(MIN_H, r.height + dy);
          if (resizeDir.indexOf('w') !== -1) { nW = Math.max(MIN_W, r.width - dx); nL = r.left + r.width - nW; }
          if (resizeDir.indexOf('n') !== -1) { nH = Math.max(MIN_H, r.height - dy); nT = r.top + r.height - nH; }
          w.style.left = nL + 'px'; w.style.top = nT + 'px';
          w.style.width = nW + 'px'; w.style.height = nH + 'px';
        }
      });
      document.addEventListener('touchmove', function(e) {
        if (!dragging) return;
        var t = e.touches[0];
        var x = Math.max(0, Math.min(window.innerWidth  - w.offsetWidth,  t.clientX - dragOX));
        var y = Math.max(0, Math.min(window.innerHeight - 40, t.clientY - dragOY));
        w.style.left = x + 'px'; w.style.top = y + 'px';
      }, { passive: true });
      document.addEventListener('mouseup',  function() { dragging = false; resizing = false; });
      document.addEventListener('touchend', function() { dragging = false; });

      w.querySelectorAll('.dyo-brs-handle').forEach(function(handle) {
        handle.addEventListener('mousedown', function(e) {
          if (w.classList.contains('maximized') || w.classList.contains('minimized')) return;
          e.stopPropagation(); e.preventDefault();
          resizing = true;
          resizeDir = handle.getAttribute('data-dir');
          resizeSX = e.clientX; resizeSY = e.clientY;
          var rect = w.getBoundingClientRect();
          resizeSRect = { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
          w.style.left = rect.left + 'px'; w.style.top = rect.top + 'px';
          w.style.width = rect.width + 'px'; w.style.height = rect.height + 'px';
          w.style.right = 'auto'; w.style.bottom = 'auto';
        });
      });
    })();

    // ============================================================
    // 제어판 창 (관리자 전용 — Features 폴더 창과 동일 패턴 복제)
    //   관리 링크는 새 탭(window.open)으로 — iframe(dyoOpenBrowser)은 로그인
    //   만료 시 크로스오리진 리다이렉트로 차단되므로 사용하지 않음.
    // ============================================================
    (function() {
      var w        = document.getElementById('dyoAdminWin');
      var titlebar = document.getElementById('dyoAdminTitlebar');
      var closeBtn = document.getElementById('dyoAdminClose');
      var minBtn   = document.getElementById('dyoAdminMin');
      var maxBtn   = document.getElementById('dyoAdminMax');
      if (!w) return;

      var dragging = false, dragOX = 0, dragOY = 0;
      var resizing = false, resizeDir = '', resizeSX = 0, resizeSY = 0, resizeSRect = null;
      var MIN_W = 420, MIN_H = 280;
      var savedPos = null;

      // ── 폴더 내용 (File Explorer 스타일 렌더링) ──
      var treeEl     = document.getElementById('dyoAdmTree');
      var mainEl     = document.getElementById('dyoAdmMain');
      var addrBar    = document.getElementById('dyoAdmAddrBar');
      var viewGridBtn = document.getElementById('dyoAdmViewGrid');
      var viewListBtn = document.getElementById('dyoAdmViewList');
      var viewMode   = 'grid';
      var admBuilt   = false;

      var ADMIN_ITEMS = [
        { id: 'apWrite', label: '글쓰기', type: 'Link', ctxKey: 'apWrite', external: true,
          icon: '<div class="dyo-di-wrap" style="background:linear-gradient(145deg,#16a34a,#15803d);border:1px solid rgba(34,197,94,.4);box-shadow:0 4px 12px rgba(22,163,74,.4),inset 0 1px 0 rgba(255,255,255,.15)"><svg viewBox="0 0 24 24" fill="none"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="m15 5 4 4" stroke="white" stroke-width="1.8" stroke-linecap="round"/></svg></div>',
          open: function() { window.open('/manage/newpost/?type=post&returnURL=%2Fmanage%2Fposts%2F', '_blank'); } },
        { id: 'apManage', label: '관리자 홈', type: 'Link', ctxKey: 'apManage', external: true,
          icon: '<div class="dyo-di-wrap" style="background:linear-gradient(145deg,#475569,#334155);border:1px solid rgba(148,163,184,.35);box-shadow:0 4px 12px rgba(51,65,85,.5),inset 0 1px 0 rgba(255,255,255,.1)"><svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3.2" stroke="white" stroke-width="1.8"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1" stroke="white" stroke-width="1.8" stroke-linecap="round"/></svg></div>',
          open: function() { window.open('/manage', '_blank'); } },
        { id: 'apSkin', label: '스킨 편집', type: 'Link', ctxKey: 'apSkin', external: true,
          icon: '<div class="dyo-di-wrap" style="background:linear-gradient(145deg,#7c3aed,#5b21b6);border:1px solid rgba(167,139,250,.4);box-shadow:0 4px 12px rgba(124,58,237,.4),inset 0 1px 0 rgba(255,255,255,.12)"><svg viewBox="0 0 24 24" fill="none"><path d="M12 2a10 10 0 0 0 0 20c1.2 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1.1.9-2 2-2h2.4A4.6 4.6 0 0 0 22 10.8 8.9 8.9 0 0 0 12 2z" stroke="white" stroke-width="1.7" stroke-linejoin="round"/><circle cx="7.5" cy="10.5" r="1.2" fill="white"/><circle cx="12" cy="7.5" r="1.2" fill="white"/><circle cx="16.5" cy="10.5" r="1.2" fill="white"/></svg></div>',
          open: function() { window.open('/manage/design/skin/edit', '_blank'); } }
      ];

      function launchAdm(it, srcEl) {
        if (!it.external) window._dyoAnimSrc = srcEl || null;
        it.open();
      }
      function bindAdmItem(el, it) {
        el.addEventListener('click', function() { launchAdm(it, el); });
        el.addEventListener('contextmenu', function(e) {
          e.preventDefault(); e.stopPropagation();
          if (window.dyoShowIconCtxMenu) window.dyoShowIconCtxMenu(it.ctxKey, e.clientX, e.clientY);
        });
      }
      function renderAdmMain() {
        if (!mainEl) return;
        mainEl.innerHTML = '';
        if (viewMode === 'list') {
          var list = document.createElement('div');
          list.className = 'dyo-explorer-list';
          var hdr = document.createElement('div');
          hdr.className = 'dyo-exp-list-header';
          hdr.innerHTML = '<span></span><span>Name</span><span>Type</span><span style="text-align:right">Items</span>';
          list.appendChild(hdr);
          ADMIN_ITEMS.forEach(function(it) {
            var row = document.createElement('div');
            row.className = 'dyo-exp-list-item';
            row.innerHTML =
              '<span class="dyo-exp-list-icon">' + it.icon + '</span>' +
              '<span class="dyo-exp-list-name">' + it.label + '</span>' +
              '<span class="dyo-exp-list-type">' + it.type + '</span>' +
              '<span class="dyo-exp-list-count">—</span>';
            bindAdmItem(row, it);
            list.appendChild(row);
          });
          mainEl.appendChild(list);
        } else {
          var grid = document.createElement('div');
          grid.className = 'dyo-explorer-grid';
          ADMIN_ITEMS.forEach(function(it) {
            var item = document.createElement('div');
            item.className = 'dyo-exp-item';
            item.innerHTML =
              '<div class="dyo-exp-item-icon">' + it.icon + '</div>' +
              '<div class="dyo-exp-item-label">' + it.label + '</div>';
            bindAdmItem(item, it);
            grid.appendChild(item);
          });
          mainEl.appendChild(grid);
        }
      }
      // 현재 모드 라벨 — Windows: '⚙️ 제어판', Linux: '⚙️ Control Panel'
      function admLabel() {
        return document.documentElement.classList.contains('dyo-mode-windows') ? '⚙️ 제어판' : '⚙️ Control Panel';
      }
      function renderAdmAddr() {
        if (!addrBar) return;
        addrBar.innerHTML = '';
        var crumb = document.createElement('span');
        crumb.className = 'dyo-exp-crumb current';
        crumb.setAttribute('data-label-win', '⚙️ 제어판');
        crumb.setAttribute('data-label-linux', '⚙️ Control Panel');
        crumb.textContent = admLabel();
        addrBar.appendChild(crumb);
      }
      function buildAdmTree() {
        if (!treeEl) return;
        treeEl.innerHTML = '';
        var rootItem = document.createElement('div');
        rootItem.className = 'dyo-tree-item active';
        rootItem.style.paddingLeft = '8px';
        rootItem.innerHTML = '<span class="dyo-tree-arrow"> </span><span>⚙️ Control Panel</span>';
        var rootLbl = rootItem.querySelector('span:last-child');
        if (rootLbl) {
          rootLbl.setAttribute('data-label-win', '⚙️ 제어판');
          rootLbl.setAttribute('data-label-linux', '⚙️ Control Panel');
          rootLbl.textContent = admLabel();
        }
        treeEl.appendChild(rootItem);
      }
      function buildAdm() {
        if (admBuilt) return;
        admBuilt = true;
        buildAdmTree();
        renderAdmAddr();
        renderAdmMain();
      }
      if (viewGridBtn) viewGridBtn.addEventListener('click', function() {
        viewMode = 'grid';
        viewGridBtn.classList.add('active');
        if (viewListBtn) viewListBtn.classList.remove('active');
        renderAdmMain();
      });
      if (viewListBtn) viewListBtn.addEventListener('click', function() {
        viewMode = 'list';
        viewListBtn.classList.add('active');
        if (viewGridBtn) viewGridBtn.classList.remove('active');
        renderAdmMain();
      });

      function openAdminPanel() {
        buildAdm();
        var wasOpen = w.classList.contains('open');
        if (!wasOpen) {
          var W = Math.min(520, window.innerWidth  - 40);
          var H = Math.min(360, window.innerHeight - 40);
          w.style.width  = W + 'px';
          w.style.height = H + 'px';
          w.style.left   = Math.round((window.innerWidth  - W) / 2) + 'px';
          w.style.top    = Math.round((window.innerHeight - H) / 3) + 'px';
          w.style.right  = 'auto';
          w.style.bottom = 'auto';
        }
        w.classList.add('open');
        w.classList.remove('minimized');
        window._dyoZTop = (window._dyoZTop || 9000) + 1;
        w.style.zIndex = window._dyoZTop;
        if (!wasOpen && window.dyoAnimOpen) window.dyoAnimOpen(w);
      }
      function closeAdminPanel() {
        if (window.dyoAnimDismiss) {
          window.dyoAnimDismiss(w, function() {
            w.classList.remove('open', 'minimized', 'maximized');
            savedPos = null;
          });
        } else {
          w.classList.remove('open', 'minimized', 'maximized');
          savedPos = null;
        }
      }
      function minimizeAdminPanel() {
        if (w.classList.contains('minimized')) {
          var tb = document.querySelector('.dyo-taskbtn[data-win-id="dyoAdminWin"]');
          window._dyoAnimSrc = tb || null;
          w.classList.remove('minimized');
          if (window.dyoAnimOpen) window.dyoAnimOpen(w);
        } else {
          if (w.classList.contains('maximized')) {
            w.classList.remove('maximized');
            if (savedPos) {
              w.style.left = savedPos.left; w.style.top = savedPos.top;
              w.style.right = savedPos.right; w.style.bottom = savedPos.bottom;
              w.style.width = savedPos.width; w.style.height = savedPos.height;
              savedPos = null;
            }
          }
          if (window.dyoAnimMinimize) {
            window.dyoAnimMinimize(w, function() { w.classList.add('minimized'); });
          } else {
            w.classList.add('minimized');
          }
        }
      }
      function maximizeAdminPanel() {
        if (w.classList.contains('maximized')) {
          w.classList.remove('maximized');
          if (savedPos) {
            w.style.left   = savedPos.left;
            w.style.top    = savedPos.top;
            w.style.right  = savedPos.right;
            w.style.bottom = savedPos.bottom;
            w.style.width  = savedPos.width;
            w.style.height = savedPos.height;
            savedPos = null;
          }
          if (window.dyoAnimMaximizeOut) window.dyoAnimMaximizeOut(w);
        } else {
          w.classList.remove('minimized');
          savedPos = {
            left: w.style.left, top: w.style.top,
            right: w.style.right, bottom: w.style.bottom,
            width: w.style.width, height: w.style.height
          };
          w.classList.add('maximized');
          w.style.left = w.style.top = w.style.right =
          w.style.bottom = w.style.width = w.style.height = '';
          if (window.dyoAnimMaximizeIn) window.dyoAnimMaximizeIn(w);
        }
      }

      window.dyoOpenAdminPanel = openAdminPanel;

      w.addEventListener('mousedown', function() {
        window._dyoZTop = (window._dyoZTop || 9000) + 1;
        w.style.zIndex = window._dyoZTop;
      });
      if (closeBtn) closeBtn.addEventListener('click', closeAdminPanel);
      if (minBtn)   minBtn.addEventListener('click',   minimizeAdminPanel);
      if (maxBtn)   maxBtn.addEventListener('click',   maximizeAdminPanel);

      if (titlebar) {
        titlebar.addEventListener('dblclick', function(e) {
          if (e.target === closeBtn || e.target === minBtn || e.target === maxBtn) return;
          maximizeAdminPanel();
        });
        titlebar.addEventListener('mousedown', function(e) {
          if (w.classList.contains('maximized')) return;
          if (e.target === closeBtn || e.target === minBtn || e.target === maxBtn) return;
          var rect = w.getBoundingClientRect();
          w.style.left = rect.left + 'px'; w.style.top = rect.top + 'px';
          w.style.right = 'auto'; w.style.bottom = 'auto';
          dragging = true;
          dragOX = e.clientX - rect.left;
          dragOY = e.clientY - rect.top;
          e.preventDefault();
        });
        titlebar.addEventListener('touchstart', function(e) {
          if (w.classList.contains('maximized')) return;
          var t = e.touches[0];
          var rect = w.getBoundingClientRect();
          w.style.left = rect.left + 'px'; w.style.top = rect.top + 'px';
          w.style.right = 'auto'; w.style.bottom = 'auto';
          dragging = true;
          dragOX = t.clientX - rect.left;
          dragOY = t.clientY - rect.top;
        }, { passive: true });
      }

      document.addEventListener('mousemove', function(e) {
        if (dragging) {
          var x = Math.max(0, Math.min(window.innerWidth  - w.offsetWidth,  e.clientX - dragOX));
          var y = Math.max(0, Math.min(window.innerHeight - 40, e.clientY - dragOY));
          w.style.left = x + 'px'; w.style.top = y + 'px';
        }
        if (resizing) {
          var dx = e.clientX - resizeSX;
          var dy = e.clientY - resizeSY;
          var r = resizeSRect;
          var nL = r.left, nT = r.top, nW = r.width, nH = r.height;
          if (resizeDir.indexOf('e') !== -1) nW = Math.max(MIN_W, r.width + dx);
          if (resizeDir.indexOf('s') !== -1) nH = Math.max(MIN_H, r.height + dy);
          if (resizeDir.indexOf('w') !== -1) { nW = Math.max(MIN_W, r.width - dx); nL = r.left + r.width - nW; }
          if (resizeDir.indexOf('n') !== -1) { nH = Math.max(MIN_H, r.height - dy); nT = r.top + r.height - nH; }
          w.style.left = nL + 'px'; w.style.top = nT + 'px';
          w.style.width = nW + 'px'; w.style.height = nH + 'px';
        }
      });
      document.addEventListener('touchmove', function(e) {
        if (!dragging) return;
        var t = e.touches[0];
        var x = Math.max(0, Math.min(window.innerWidth  - w.offsetWidth,  t.clientX - dragOX));
        var y = Math.max(0, Math.min(window.innerHeight - 40, t.clientY - dragOY));
        w.style.left = x + 'px'; w.style.top = y + 'px';
      }, { passive: true });
      document.addEventListener('mouseup',  function() { dragging = false; resizing = false; });
      document.addEventListener('touchend', function() { dragging = false; });

      w.querySelectorAll('.dyo-brs-handle').forEach(function(handle) {
        handle.addEventListener('mousedown', function(e) {
          if (w.classList.contains('maximized') || w.classList.contains('minimized')) return;
          e.stopPropagation(); e.preventDefault();
          resizing = true;
          resizeDir = handle.getAttribute('data-dir');
          resizeSX = e.clientX; resizeSY = e.clientY;
          var rect = w.getBoundingClientRect();
          resizeSRect = { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
          w.style.left = rect.left + 'px'; w.style.top = rect.top + 'px';
          w.style.width = rect.width + 'px'; w.style.height = rect.height + 'px';
          w.style.right = 'auto'; w.style.bottom = 'auto';
        });
      });
    })();

    // ============================================================
    // Guestbook 채팅창
    // ============================================================
    (function() {
      var w        = document.getElementById('dyoGuestWin');
      var titlebar = document.getElementById('dyoGuestTitlebar');
      var closeBtn = document.getElementById('dyoGuestClose');
      var minBtn   = document.getElementById('dyoGuestMin');
      var maxBtn   = document.getElementById('dyoGuestMax');
      var reloadBtn  = document.getElementById('dyoGuestReload');
      var chat       = document.getElementById('dyoGuestChat');
      var loading    = document.getElementById('dyoGuestLoading');
      var metaRow    = document.getElementById('dyoGuestMeta');
      var nameInput  = document.getElementById('dyoGuestIName');
      var pwInput    = document.getElementById('dyoGuestIPw');
      var textarea   = document.getElementById('dyoGuestTextarea');
      var sendBtn    = document.getElementById('dyoGuestSend');
      if (!w) return;

      var ADMIN_NICK = 'doyoucode';
      var isOwner    = false;
      var isLoggedIn = false;
      var msgData    = {};   // id → { author, content }
      var dragging = false, dragOX = 0, dragOY = 0;
      var resizing = false, resizeDir = '', resizeSX = 0, resizeSY = 0, resizeSRect = null;
      var MIN_W = 300, MIN_H = 200;
      var savedPos = null;
      var loaded = false;

      // ── 유틸 ──
      function esc(t) {
        return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      }

      function sha256hex(str) {
        return crypto.subtle.digest('SHA-256', new TextEncoder().encode(str))
          .then(function(buf) {
            return Array.from(new Uint8Array(buf))
              .map(function(b){ return b.toString(16).padStart(2,'0'); }).join('');
          });
      }

      // Tistory 방명록 비밀번호: SHA-256( MD5( encodeURIComponent(pw) ) )
      function tistoryHashPw(passwd) {
        var encoded = encodeURIComponent(passwd);
        var md5hash = (typeof md5 === 'function') ? md5(encoded) : encoded;
        return sha256hex(md5hash);
      }

      function sendGuest() {
        var text = textarea ? textarea.value.trim() : '';
        if (!text) return;
        var name = nameInput ? nameInput.value.trim() : '';
        var pw   = pwInput   ? pwInput.value        : '';
        if (!name && metaRow && !metaRow.classList.contains('owner-mode')) return;

        sendBtn.disabled = true;
        var hashPromise = pw ? tistoryHashPw(pw) : Promise.resolve('');
        hashPromise.then(function(hashedPw) {
          return fetch('/m/api/guestbook', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({
              captcha:    '',
              comment:    text,
              homepage:   '',
              isSecret:   false,
              mentionId:  null,
              name:       name,
              parent:     null,
              password:   hashedPw
            })
          });
        }).then(function(r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.json();
        }).then(function() {
          if (textarea) textarea.value = '';
          loaded = false;
          loadGuest();
          if (window.dyoToast) window.dyoToast('메시지가 전송되었습니다!', 'success');
        }).catch(function() {
          if (window.dyoToast) window.dyoToast('전송에 실패했습니다. 다시 시도해주세요.', 'error');
        }).finally(function() {
          sendBtn.disabled = false;
        });
      }

      function editGuest(id, bwrap) {
        var d = msgData[id];
        if (!d) return;
        var bubbleEl = bwrap.querySelector('.dyo-chat-bubble');
        var editBtnEl = bwrap.querySelector('.dyo-chat-editbtn');
        bubbleEl.style.display = 'none';
        if (editBtnEl) editBtnEl.style.display = 'none';

        var form = document.createElement('div');
        form.className = 'dyo-cedit-wrap';
        form.innerHTML =
          '<textarea class="dyo-cedit-ta" rows="2">' + esc(d.content) + '</textarea>' +
          (isLoggedIn ? '' : '<input type="password" class="dyo-cedit-pw" placeholder="비밀번호">') +
          '<div class="dyo-cedit-btns">' +
          '<button class="dyo-cedit-cancel">취소</button>' +
          '<button class="dyo-cedit-save">수정</button>' +
          '</div>';
        bwrap.insertBefore(form, bubbleEl);

        var ta      = form.querySelector('.dyo-cedit-ta');
        var pwEl    = form.querySelector('.dyo-cedit-pw');
        var cancelB = form.querySelector('.dyo-cedit-cancel');
        var saveB   = form.querySelector('.dyo-cedit-save');

        ta.focus();
        ta.setSelectionRange(ta.value.length, ta.value.length);

        cancelB.addEventListener('click', function() {
          form.remove();
          bubbleEl.style.display = '';
          if (editBtnEl) editBtnEl.style.display = '';
        });

        function doSave() {
          var newText = ta.value.trim();
          if (!newText) return;
          var pwVal = pwEl ? pwEl.value : '';
          saveB.disabled = true;
          (pwVal ? tistoryHashPw(pwVal) : Promise.resolve(''))
            .then(function(hashed) {
              return fetch('/m/api/guestbook/' + id, {
                method: 'PUT',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ comment: newText, mentionId: null, name: d.author, password: hashed, secret: false })
              });
            })
            .then(function(r) { if (!r.ok) throw new Error(); return r.json(); })
            .then(function() {
              loaded = false;
              loadGuest();
              if (window.dyoToast) window.dyoToast('수정되었습니다.', 'success');
            })
            .catch(function() {
              if (window.dyoToast) window.dyoToast('수정에 실패했습니다.', 'error');
              saveB.disabled = false;
            });
        }

        saveB.addEventListener('click', doSave);
        ta.addEventListener('keydown', function(e) {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); doSave(); }
        });
      }

      function deleteGuest(id, bwrap) {
        var d = msgData[id];
        if (!d) return;

        var bubbleEl  = bwrap.querySelector('.dyo-chat-bubble');
        var editBtnEl = bwrap.querySelector('.dyo-chat-editbtn');
        var delBtnEl  = bwrap.querySelector('.dyo-chat-delbtn');

        function restore() {
          bubbleEl.style.display = '';
          if (editBtnEl) editBtnEl.style.display = '';
          if (delBtnEl)  delBtnEl.style.display  = '';
        }

        function doDelete(hashedPw, form) {
          fetch('/m/api/guestbook/' + id, {
            method: 'DELETE',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: hashedPw })
          })
          .then(function(r) { if (!r.ok) throw new Error(); return r.json(); })
          .then(function() {
            loaded = false;
            loadGuest();
            if (window.dyoToast) window.dyoToast('삭제되었습니다.', 'success');
          })
          .catch(function() {
            if (window.dyoToast) window.dyoToast('삭제에 실패했습니다. 비밀번호를 확인해주세요.', 'error');
            if (form) form.remove();
            restore();
          });
        }

        // 로그인 여부 관계없이 창 안에서 인라인 확인 폼 표시
        {
          bubbleEl.style.display = 'none';
          if (editBtnEl) editBtnEl.style.display = 'none';
          if (delBtnEl)  delBtnEl.style.display  = 'none';

          var form = document.createElement('div');
          form.className = 'dyo-cedit-wrap';
          form.innerHTML =
            '<div class="dyo-cdel-notice">정말 삭제하시겠습니까?</div>' +
            (isLoggedIn ? '' : '<input type="password" class="dyo-cedit-pw" placeholder="비밀번호">') +
            '<div class="dyo-cedit-btns">' +
            '<button class="dyo-cedit-cancel">취소</button>' +
            '<button class="dyo-cedit-save dyo-cedit-del">삭제</button>' +
            '</div>';
          bwrap.insertBefore(form, bubbleEl);

          var pwEl    = form.querySelector('.dyo-cedit-pw');
          var cancelB = form.querySelector('.dyo-cedit-cancel');
          var saveB   = form.querySelector('.dyo-cedit-save');

          if (pwEl) pwEl.focus(); else saveB.focus();

          cancelB.addEventListener('click', function() {
            form.remove();
            restore();
          });

          saveB.addEventListener('click', function() {
            if (isLoggedIn) {
              saveB.disabled = true;
              doDelete('', form);
            } else {
              var pwVal = pwEl.value;
              if (!pwVal) { pwEl.focus(); return; }
              saveB.disabled = true;
              tistoryHashPw(pwVal).then(function(hashed) {
                doDelete(hashed, form);
              });
            }
          });

          if (pwEl) pwEl.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') { e.preventDefault(); saveB.click(); }
          });
        }
      }

      function formatMsgDate(dateStr) {
        return dateStr || '';
      }

      function renderChat(msgs) {
        if (msgs.length === 0) {
          chat.innerHTML = '<div class="dyo-guest-empty">방명록이 비어있거나<br>불러올 수 없습니다.</div>';
        } else {
          chat.innerHTML = msgs.map(function(m) {
            var role    = m.isAdmin ? 'admin' : 'visitor';
            var editBtn = m.canEdit && m.id
              ? '<button class="dyo-chat-editbtn" data-id="' + m.id + '" title="수정">✏</button>'
              : '';
            var delBtn  = m.canDelete && m.id
              ? '<button class="dyo-chat-delbtn" data-id="' + m.id + '" title="삭제">🗑</button>'
              : '';
            var timeStr = formatMsgDate(m.date);
            var timeEl  = timeStr ? '<div class="dyo-chat-time">' + timeStr + '</div>' : '';
            return '<div class="dyo-chat-row ' + role + '">' +
                   '<div class="dyo-chat-wrap">' +
                   '<div class="dyo-chat-name">' + esc(m.author) + '</div>' +
                   '<div class="dyo-chat-bwrap">' +
                   '<div class="dyo-chat-bubble">' + esc(m.content) + '</div>' +
                   editBtn + delBtn +
                   '</div>' +
                   timeEl +
                   '</div></div>';
          }).join('');
          chat.scrollTop = chat.scrollHeight;
        }
        loading.style.display = 'none';
        chat.style.display = 'flex';
      }

      function loadGuest() {
        loaded = true;
        loading.style.display = 'flex';
        loading.querySelector('span').textContent = '방명록 불러오는 중...';
        loading.querySelector('.dyo-guest-spinner').style.display = '';
        chat.style.display = 'none';
        chat.innerHTML = '';

        fetch('/m/api/guestbook?reverse=true', { credentials: 'include', cache: 'no-store' })
          .then(function(r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.json();
          })
          .then(function(json) {
            var items = (json.data && json.data.items) || [];
            var msgs = [];
            // Pass 1: 로그인 상태 확정
            //   isOwner    = 관리자 로그인 (isRequestUser && role=owner)
            //   isLoggedIn = 일반 계정 로그인 (isRequestUser, 관리자 포함)
            isOwner    = false;
            isLoggedIn = false;
            msgData    = {};
            items.forEach(function(item) {
              if (item.writer && item.writer.isRequestUser) {
                isLoggedIn = true;
                if (item.writer.role === 'owner') isOwner = true;
              }
              (item.children || []).forEach(function(c) {
                if (c.writer && c.writer.isRequestUser) {
                  isLoggedIn = true;
                  if (c.writer.role === 'owner') isOwner = true;
                }
              });
            });
            // Pass 2: canEdit 결정
            //   관리자(isOwner)    : 본인(관리자) 메시지만
            //   로그인 일반 계정   : isRequestUser=true인 본인 메시지만
            //   비로그인 게스트    : 게스트 메시지 전체 (클릭 시 비밀번호 입력)
            function calcCanEdit(writer) {
              var isAdmin = !!(writer && writer.role === 'owner');
              var isMine  = !!(writer && writer.isRequestUser);
              if (isOwner)    return isAdmin;   // 관리자: 관리자 메시지만
              if (isLoggedIn) return isMine;    // 로그인: 본인 메시지만
              return !isAdmin;                  // 비로그인: 게스트 메시지 전체
            }
            function calcCanDelete(writer) {
              var isAdmin = !!(writer && writer.role === 'owner');
              var isMine  = !!(writer && writer.isRequestUser);
              if (isOwner)    return true;      // 관리자: 모든 메시지 삭제 가능
              if (isLoggedIn) return isMine;    // 로그인: 본인 메시지만
              return !isAdmin;                  // 비로그인: 게스트 메시지 전체 (비밀번호 필요)
            }
            items.forEach(function(item) {
              var isAdmin    = !!(item.writer && item.writer.role === 'owner');
              var canEdit    = calcCanEdit(item.writer);
              var canDelete  = calcCanDelete(item.writer);
              msgData[item.id] = { author: item.writer ? item.writer.name : '방문자', content: item.content };
              msgs.push({ id: item.id, author: item.writer ? item.writer.name : '방문자', content: item.content, isAdmin: isAdmin, canEdit: canEdit, canDelete: canDelete, date: item.written || '' });
              (item.children || []).forEach(function(child) {
                var childIsAdmin   = !!(child.writer && child.writer.role === 'owner');
                var childCanEdit   = calcCanEdit(child.writer);
                var childCanDelete = calcCanDelete(child.writer);
                msgData[child.id] = { author: child.writer ? child.writer.name : ADMIN_NICK, content: child.content };
                msgs.push({ id: child.id, author: child.writer ? child.writer.name : ADMIN_NICK, content: child.content, isAdmin: true, canEdit: childCanEdit, canDelete: childCanDelete, date: child.written || '' });
              });
            });
            // owner이면 이름/비밀번호 입력 숨기기
            if (metaRow) {
              if (isOwner) metaRow.classList.add('owner-mode');
              else         metaRow.classList.remove('owner-mode');
            }
            renderChat(msgs);
          })
          .catch(function() {
            loading.querySelector('span').textContent = '불러오기 실패. ↺ 버튼으로 재시도';
            loading.querySelector('.dyo-guest-spinner').style.display = 'none';
          });
      }

      // ── 창 열기/닫기/최소화/최대화 ──
      function openGuest() {
        var wasOpen = w.classList.contains('open');
        if (!wasOpen) {
          var W = Math.min(360, window.innerWidth  - 40);
          var H = Math.min(580, window.innerHeight - 40);
          w.style.width  = W + 'px';
          w.style.height = H + 'px';
          w.style.left   = Math.round(window.innerWidth - W - 24) + 'px';
          // 토스트 알림(bottom: 108px) 과 겹치지 않도록 하단 160px 여유 확보
          w.style.top    = Math.max(20, Math.min(
            Math.round((window.innerHeight - H) / 2),
            window.innerHeight - H - 160
          )) + 'px';
          w.style.right  = 'auto';
          w.style.bottom = 'auto';
        }
        w.classList.add('open');
        w.classList.remove('minimized');
        window._dyoZTop = (window._dyoZTop || 9000) + 1;
        w.style.zIndex = window._dyoZTop;
        if (!wasOpen && window.dyoAnimOpen) window.dyoAnimOpen(w);
        if (!loaded) loadGuest();
      }
      function closeGuest() {
        if (window.dyoAnimDismiss) {
          window.dyoAnimDismiss(w, function() {
            w.classList.remove('open','minimized','maximized');
            savedPos = null;
          });
        } else {
          w.classList.remove('open','minimized','maximized');
          savedPos = null;
        }
      }
      function minimizeGuest() {
        if (w.classList.contains('minimized')) {
          var tb = document.querySelector('.dyo-taskbtn[data-win-id="dyoGuestWin"]');
          window._dyoAnimSrc = tb || null;
          w.classList.remove('minimized');
          if (window.dyoAnimOpen) window.dyoAnimOpen(w);
        } else {
          if (w.classList.contains('maximized')) {
            w.classList.remove('maximized');
            if (savedPos) {
              w.style.left=savedPos.left; w.style.top=savedPos.top;
              w.style.right=savedPos.right; w.style.bottom=savedPos.bottom;
              w.style.width=savedPos.width; w.style.height=savedPos.height;
              savedPos=null;
            }
          }
          if (window.dyoAnimMinimize) {
            window.dyoAnimMinimize(w, function() { w.classList.add('minimized'); });
          } else {
            w.classList.add('minimized');
          }
        }
      }
      function maximizeGuest() {
        if (w.classList.contains('maximized')) {
          w.classList.remove('maximized');
          if (savedPos) {
            w.style.left=savedPos.left; w.style.top=savedPos.top;
            w.style.right=savedPos.right; w.style.bottom=savedPos.bottom;
            w.style.width=savedPos.width; w.style.height=savedPos.height;
            savedPos=null;
          }
          if (window.dyoAnimMaximizeOut) window.dyoAnimMaximizeOut(w);
        } else {
          w.classList.remove('minimized');
          savedPos = { left:w.style.left, top:w.style.top, right:w.style.right,
                       bottom:w.style.bottom, width:w.style.width, height:w.style.height };
          w.classList.add('maximized');
          w.style.left=w.style.top=w.style.right=w.style.bottom=w.style.width=w.style.height='';
          if (window.dyoAnimMaximizeIn) window.dyoAnimMaximizeIn(w);
        }
      }

      window.dyoOpenGuest = openGuest;

      w.addEventListener('mousedown', function() {
        window._dyoZTop = (window._dyoZTop || 9000) + 1;
        w.style.zIndex = window._dyoZTop;
      });
      if (closeBtn)  closeBtn.addEventListener('click',  closeGuest);
      if (minBtn)    minBtn.addEventListener('click',    minimizeGuest);
      if (maxBtn)    maxBtn.addEventListener('click',    maximizeGuest);
      if (reloadBtn) reloadBtn.addEventListener('click', function() { loaded=false; loadGuest(); });
      if (sendBtn)   sendBtn.addEventListener('click', sendGuest);
      chat.addEventListener('click', function(e) {
        var editBtn = e.target.closest('.dyo-chat-editbtn');
        if (editBtn) {
          var bwrap = editBtn.closest('.dyo-chat-bwrap');
          if (bwrap) editGuest(editBtn.dataset.id, bwrap);
          return;
        }
        var delBtn = e.target.closest('.dyo-chat-delbtn');
        if (delBtn) {
          var bwrap = delBtn.closest('.dyo-chat-bwrap');
          if (bwrap) deleteGuest(delBtn.dataset.id, bwrap);
        }
      });
      if (textarea) {
        textarea.addEventListener('keydown', function(e) {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); sendGuest(); }
        });
      }

      if (titlebar) {
        titlebar.addEventListener('dblclick', function(e) {
          if (e.target===closeBtn||e.target===minBtn||e.target===maxBtn) return;
          maximizeGuest();
        });
        titlebar.addEventListener('mousedown', function(e) {
          if (w.classList.contains('maximized')) return;
          if (e.target===closeBtn||e.target===minBtn||e.target===maxBtn) return;
          var r = w.getBoundingClientRect();
          w.style.left=r.left+'px'; w.style.top=r.top+'px';
          w.style.right='auto'; w.style.bottom='auto';
          dragging=true; dragOX=e.clientX-r.left; dragOY=e.clientY-r.top;
          e.preventDefault();
        });
        titlebar.addEventListener('touchstart', function(e) {
          if (w.classList.contains('maximized')) return;
          var t=e.touches[0], r=w.getBoundingClientRect();
          w.style.left=r.left+'px'; w.style.top=r.top+'px';
          w.style.right='auto'; w.style.bottom='auto';
          dragging=true; dragOX=t.clientX-r.left; dragOY=t.clientY-r.top;
        }, {passive:true});
      }

      document.addEventListener('mousemove', function(e) {
        if (dragging) {
          var x=Math.max(0,Math.min(window.innerWidth-w.offsetWidth, e.clientX-dragOX));
          var y=Math.max(0,Math.min(window.innerHeight-40, e.clientY-dragOY));
          w.style.left=x+'px'; w.style.top=y+'px';
        }
        if (resizing) {
          var dx=e.clientX-resizeSX, dy=e.clientY-resizeSY, r=resizeSRect;
          var nL=r.left,nT=r.top,nW=r.width,nH=r.height;
          if (resizeDir.indexOf('e')!==-1) nW=Math.max(MIN_W,r.width+dx);
          if (resizeDir.indexOf('s')!==-1) nH=Math.max(MIN_H,r.height+dy);
          if (resizeDir.indexOf('w')!==-1){nW=Math.max(MIN_W,r.width-dx);nL=r.left+r.width-nW;}
          if (resizeDir.indexOf('n')!==-1){nH=Math.max(MIN_H,r.height-dy);nT=r.top+r.height-nH;}
          w.style.left=nL+'px'; w.style.top=nT+'px';
          w.style.width=nW+'px'; w.style.height=nH+'px';
        }
      });
      document.addEventListener('touchmove', function(e) {
        if (!dragging) return;
        var t=e.touches[0];
        var x=Math.max(0,Math.min(window.innerWidth-w.offsetWidth, t.clientX-dragOX));
        var y=Math.max(0,Math.min(window.innerHeight-40, t.clientY-dragOY));
        w.style.left=x+'px'; w.style.top=y+'px';
      }, {passive:true});
      document.addEventListener('mouseup',  function(){dragging=false;resizing=false;});
      document.addEventListener('touchend', function(){dragging=false;});

      w.querySelectorAll('.dyo-brs-handle').forEach(function(handle) {
        handle.addEventListener('mousedown', function(e) {
          if (w.classList.contains('maximized')||w.classList.contains('minimized')) return;
          e.stopPropagation(); e.preventDefault();
          resizing=true; resizeDir=handle.getAttribute('data-dir');
          resizeSX=e.clientX; resizeSY=e.clientY;
          var r=w.getBoundingClientRect();
          resizeSRect={left:r.left,top:r.top,width:r.width,height:r.height};
          w.style.left=r.left+'px'; w.style.top=r.top+'px';
          w.style.width=r.width+'px'; w.style.height=r.height+'px';
          w.style.right='auto'; w.style.bottom='auto';
        });
      });
    })();
  