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
          w.style.left   = Math.round((window.innerWidth  - W) / 2) + 'px';
          w.style.top    = Math.round((window.innerHeight - H) / 2) + 'px';
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

          pwEl.addEventListener('keydown', function(e) {
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
