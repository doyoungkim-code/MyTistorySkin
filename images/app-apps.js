
    // ============================================================
    // Blogram 창  (Instagram 스타일 — 직접 관리)
    // ============================================================
    (function() {
      var w             = document.getElementById('dyoGalleryWin');
      var titlebar      = document.getElementById('dyoGalleryTitlebar');
      var closeBtn      = document.getElementById('dyoGalleryClose');
      var minBtn        = document.getElementById('dyoGalleryMin');
      var maxBtn        = document.getElementById('dyoGalleryMax');
      var statusEl      = document.getElementById('dyoGalleryStatus');
      var gridEl        = document.getElementById('dyoGalleryGrid');
      var emptyEl       = document.getElementById('dyoGalleryEmpty');
      var galleryBodyEl = document.getElementById('dyoGalleryBody');
      if (!w) return;

      var GALLERY_PAGE_SIZE = 12;
      var _rendered         = 0;
      var _scrollObserver   = null;

      var prevRect = null;

      function bringToFront() {
        window._dyoZTop = (window._dyoZTop || 9000) + 1;
        w.style.zIndex = window._dyoZTop;
      }

      // ══════════════════════════════════════════════════════════════
      // GALLERY_CATEGORY: 자동으로 파싱할 카테고리 경로
      //   설정하면 해당 카테고리 페이지의 게시글(썸네일 있는 것)을 자동으로 가져옴.
      //   게시글 제목이 사진 이름으로 표시됨.
      //   빈 문자열('')로 설정하면 아래 GALLERY_POSTS 배열을 직접 사용.
      // ══════════════════════════════════════════════════════════════
      var GALLERY_CATEGORY = '/category/Pictures';

      // ══════════════════════════════════════════════════════════════
      // GALLERY_POSTS: GALLERY_CATEGORY가 비어있거나 파싱 실패 시 사용하는 수동 목록
      //   img  : 이미지 URL  (티스토리 업로드 후 복사한 CDN URL)
      //   url  : 포스트 URL  (해당 블로그 글 주소)
      //   title: 글 제목
      //   date : 날짜 (YYYY-MM-DD)
      // ══════════════════════════════════════════════════════════════
      var GALLERY_POSTS = [];

      // 카테고리 페이지 HTML을 파싱해 포스트 목록 추출
      function fetchCategoryPosts(path, cb) {
        fetch(path, { credentials: 'include' })
          .then(function(r) { if (!r.ok) throw new Error(); return r.text(); })
          .then(function(html) {
            var parser = new DOMParser();
            var doc    = parser.parseFromString(html, 'text/html');
            var posts  = [];
            doc.querySelectorAll('.list_content').forEach(function(item) {
              var thumbEl = item.querySelector('.thumbnail_post img');
              var linkEl  = item.querySelector('a.thumbnail_post, a.link_post');
              var titleEl = item.querySelector('.tit_post');
              var dateEl  = item.querySelector('.txt_date');
              if (!thumbEl || !linkEl) return; // 썸네일 없는 게시글 제외
              var imgUrl  = thumbEl.getAttribute('src') || '';
              // Tistory CDN URL 고화질(R1280x0)로 업그레이드
              imgUrl = imgUrl.replace(/\/thumb\/R\d+x\d+\//, '/thumb/R1280x0/');
              var postUrl = linkEl.getAttribute('href') || '#';
              // 절대 URL이면 pathname만 추출
              try { postUrl = new URL(postUrl).pathname; } catch(e) {}
              posts.push({
                img:   imgUrl,
                url:   postUrl,
                title: titleEl ? titleEl.textContent.trim() : '',
                date:  dateEl  ? dateEl.textContent.trim()  : ''
              });
            });
            cb(posts);
          })
          .catch(function() { cb(null); });
      }

      // ── 라이트박스 (Instagram Style) ──────────────────────────────
      var _photos     = [];
      var _currentIdx = 0;
      var lbEl         = document.getElementById('dyoLightbox');
      var lbBgEl       = document.getElementById('dyoLbBg');
      var lbCloseEl    = document.getElementById('dyoLbClose');
      var lbPrevEl     = document.getElementById('dyoLbPrev');
      var lbNextEl     = document.getElementById('dyoLbNext');
      var lbImgEl      = document.getElementById('dyoLbImg');
      var lbTitleEl    = document.getElementById('dyoLbTitle');
      var lbDateEl     = document.getElementById('dyoLbDate');
      var lbCntEl      = document.getElementById('dyoLbCounter');
      var lbPostLink   = document.getElementById('dyoLbPostLink');
      var lbCopyLink   = document.getElementById('dyoLbCopyLink');
      var lbMenuBtn    = document.getElementById('dyoLbMenuBtn');
      var lbDropdown   = document.getElementById('dyoLbDropdown');
      var lbLikeBtn    = document.getElementById('dyoLbLikeBtn');
      var lbLikesLine  = document.getElementById('dyoLbLikesLine');
      var lbCmtBtn     = document.getElementById('dyoLbCmtBtn');
      var lbShareBtn   = document.getElementById('dyoLbShareBtn');
      var lbCmtStub    = document.getElementById('dyoLbCmtStub');
      var lbCmtInput   = document.getElementById('dyoLbCmtInput');
      var lbCmtName    = document.getElementById('dyoLbCmtName');
      var lbCmtPw      = document.getElementById('dyoLbCmtPw');
      var lbCmtSubmit  = document.getElementById('dyoLbCmtSubmit');
      var lbComposeMeta = document.querySelector('.dyo-lb-ig-compose-meta');

      // ── 로그인 상태 감지 (게스트만 이름/비밀번호 입력 표시) ──────
      var _lbLoginState = null; // null=미확인, true=로그인됨, false=게스트
      var _likeCache = {};     // postId → { liked: bool, count: number }

      function detectLoginState(cb) {
        if (_lbLoginState !== null) { cb(_lbLoginState); return; }
        // ① /m/api/me 시도 (Tistory 내부 API)
        fetch('/m/api/me', { credentials: 'include', headers: { 'X-Requested-With': 'XMLHttpRequest' } })
          .then(function(r) { if (!r.ok) throw new Error(); return r.json(); })
          .then(function(d) {
            var loggedIn = !!(d && (d.data || d.id || d.userId || d.name || d.blogName));
            _lbLoginState = loggedIn;
            cb(loggedIn);
          })
          .catch(function() {
            // ② 방명록 API에서 isRequestUser 확인 (fallback)
            fetch('/m/api/guestbook?limit=3&reverse=true', { credentials: 'include' })
              .then(function(r) { return r.json(); })
              .then(function(d) {
                var items = (d.data && d.data.items) || [];
                var found = false;
                items.forEach(function(item) {
                  if (item.writer && item.writer.isRequestUser) found = true;
                  (item.children || []).forEach(function(c) {
                    if (c.writer && c.writer.isRequestUser) found = true;
                  });
                });
                _lbLoginState = found;
                cb(found);
              })
              .catch(function() { _lbLoginState = false; cb(false); });
          });
      }

      function updateComposeMeta(isLoggedIn) {
        if (lbComposeMeta) lbComposeMeta.style.display = isLoggedIn ? 'none' : '';
      }

      // ── 좋아요 (Tistory /reaction API) ───────────────────────────
      function getPostId(url) {
        return ((url || '').match(/\/(\d+)/) || [])[1] || null;
      }

      // JSON에서 카운트 추출 (여러 키 이름 대응)
      function extractCount(d) {
        if (d == null) return null;
        // Tistory /reaction API 응답: { reactionCounter: { like, sum, sad } }
        if (d.reactionCounter) {
          var rc = d.reactionCounter;
          var v = rc.like != null ? rc.like : rc.sum;
          if (v != null) return parseInt(v, 10);
        }
        var keys = ['count','likeCount','reactionCount','totalCount','sympathyCount','cnt'];
        for (var i = 0; i < keys.length; i++) {
          if (d[keys[i]] != null) return parseInt(d[keys[i]], 10);
        }
        return null;
      }

      // lbOpen 시: 캐시 우선, 없으면 모바일 API + /reaction GET 병렬로 liked 여부 + 카운트 조회
      function fetchLikeState(postId, postUrl, cb) {
        // 이미 캐시된 상태가 있으면 즉시 반환
        if (_likeCache[postId] !== undefined) {
          cb(_likeCache[postId]);
          return;
        }

        var result = { liked: false, count: null };
        var done   = 0;
        function finish() {
          if (++done === 2) {
            _likeCache[postId] = result;
            cb(result);
          }
        }

        // ① /m/api/{postId}/reaction — 카운트 + liked 여부
        fetch('/m/api/' + postId + '/reaction', {
          credentials: 'include',
          headers: { 'X-Requested-With': 'XMLHttpRequest' }
        })
          .then(function(r) { return r.json(); })
          .then(function(d) {
            var src = d.data || d;
            var c = extractCount(src);
            if (c !== null) result.count = c;
            var liked = !!(src.liked || src.isLiked || src.userLiked || src.myReaction || src.userReaction);
            if (liked) result.liked = true;
            finish();
          })
          .catch(function() { finish(); });

        // ② GET /reaction?entryId — isActive / reactionActivated 로 liked 여부 확인 + 카운트
        fetch('/reaction?entryId=' + postId, {
          credentials: 'include',
          headers: { 'X-Requested-With': 'XMLHttpRequest' }
        })
          .then(function(r) { return r.json(); })
          .then(function(d) {
            var src = d.data || d;
            // Tistory GET /reaction 응답: isActive(bool), reactionActivated("LIKE"|"")
            var liked = !!(src.isActive || src.reactionActivated === 'LIKE' ||
                           src.liked || src.isLiked || src.userReaction || src.myReaction);
            if (liked) result.liked = true;
            var c = extractCount(src);
            if (c !== null && result.count === null) result.count = c;
            finish();
          })
          .catch(function() { finish(); });
      }

      // 좋아요 추가/취소: POST or DELETE /reaction
      function callReactionAPI(postId, isLike, cb) {
        var body = isLike
          ? { entryId: parseInt(postId, 10), reactionType: 'LIKE' }
          : { entryId: parseInt(postId, 10) };
        fetch('/reaction', {
          method: isLike ? 'POST' : 'DELETE',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          },
          body: JSON.stringify(body)
        })
          .then(function(r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.json();
          })
          .then(function(d) {
            var src = d.data || d;
            var count = extractCount(src);
            _likeCache[postId] = { liked: isLike, count: count };
            cb({ success: true, liked: isLike, count: count });
          })
          .catch(function() { cb({ success: false }); });
      }

      function applyLikeUI(liked, count) {
        if (!lbLikeBtn || !lbLikesLine) return;
        lbLikeBtn.classList.toggle('liked', liked);
        lbLikesLine.textContent = count != null ? '좋아요 ' + count + '개' : '좋아요';
      }

      // lbOpen 시 현재 상태 로드
      function updateLikeUI(postUrl) {
        var postId = getPostId(postUrl);
        if (!postId) { applyLikeUI(false, 0); return; }
        applyLikeUI(false, null); // 초기화
        fetchLikeState(postId, postUrl, function(state) {
          applyLikeUI(state.liked, state.count);
        });
      }

      // ── HTML 이스케이프 ───────────────────────────────────────────
      function escHtml(s) {
        return String(s)
          .replace(/&/g,'&amp;').replace(/</g,'&lt;')
          .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
      }

      // ── 댓글 시간 포맷 ────────────────────────────────────────────
      function fmtTime(str) {
        if (!str) return '';
        // "YYYY-MM-DD HH:mm:ss" 또는 ISO 형식
        var d = new Date(str.replace(' ', 'T'));
        if (isNaN(d)) return str;
        var diff = Math.floor((Date.now() - d) / 1000);
        if (diff < 60)   return '방금 전';
        if (diff < 3600) return Math.floor(diff/60) + '분 전';
        if (diff < 86400) return Math.floor(diff/3600) + '시간 전';
        var y = d.getFullYear(), m = d.getMonth()+1, day = d.getDate();
        return y + '. ' + m + '. ' + day + '.';
      }

      // ── 비밀번호 해싱: SHA-256( MD5( encodeURIComponent(pw) ) ) ──
      //    방명록과 동일한 Tistory 표준 방식
      function sha256hex(str) {
        return crypto.subtle.digest('SHA-256', new TextEncoder().encode(str))
          .then(function(buf) {
            return Array.from(new Uint8Array(buf))
              .map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');
          });
      }
      function lbHashPw(passwd) {
        if (!passwd) return Promise.resolve('');
        var encoded = encodeURIComponent(passwd);
        var md5hash = (typeof md5 === 'function') ? md5(encoded) : encoded;
        return sha256hex(md5hash);
      }

      // ── Tistory 모바일 댓글 API ───────────────────────────────────
      //  GET /m/api/{postId}/comment?reverse=true
      //  응답: { data: { items: [...], totalItems: N } }
      function fetchTistoryComments(postUrl, cb) {
        var postId = (postUrl.match(/\/(\d+)/) || [])[1];
        if (!postId) { cb(null); return; }
        fetch('/m/api/' + postId + '/comment?reverse=true', { credentials: 'include' })
          .then(function(r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.json();
          })
          .then(function(res) {
            var d    = res.data || res;
            var list = d.items || d.comments || [];
            cb(Array.isArray(list) ? list : []);
          })
          .catch(function() { cb(null); });
      }

      // ── 댓글 단일 항목 HTML ───────────────────────────────────────
      function cmtItemHtml(c, isReply) {
        var author = escHtml((c.writer && c.writer.name) || c.name || '익명');
        var text   = escHtml(c.content || '');
        var time   = escHtml(c.written || fmtTime(c.regTime || c.date || ''));
        var avatar = (c.writer && c.writer.profileImage) || c.profileImage || '';
        var avHtml = avatar
          ? '<img class="dyo-lb-ig-cmt-avatar" src="' + escHtml(avatar) + '" alt="" loading="lazy">'
          : '<div class="dyo-lb-ig-cmt-avatar dyo-lb-ig-cmt-avatar-def"></div>';
        return (
          '<div class="dyo-lb-ig-cmt-item' + (isReply ? ' dyo-lb-ig-cmt-reply' : '') + '">' +
            avHtml +
            '<div class="dyo-lb-ig-cmt-body">' +
              '<span class="dyo-lb-ig-cmt-author">' + author + '</span> ' +
              '<span class="dyo-lb-ig-cmt-text">'   + text   + '</span>' +
              (time ? '<div class="dyo-lb-ig-cmt-time">' + time + '</div>' : '') +
            '</div>' +
          '</div>'
        );
      }

      // ── 댓글 렌더링 ───────────────────────────────────────────────
      function renderComments(comments) {
        if (!lbCmtStub) return;
        if (comments === null) {
          lbCmtStub.innerHTML = '<p class="dyo-lb-ig-cmt-empty">댓글을 불러오지 못했습니다.</p>';
          return;
        }
        if (comments.length === 0) {
          lbCmtStub.innerHTML = '<p class="dyo-lb-ig-cmt-empty">첫 번째 댓글을 남겨보세요.</p>';
          return;
        }
        var html = '';
        comments.forEach(function(c) {
          html += cmtItemHtml(c, false);
          // 답글(children)도 렌더링
          if (Array.isArray(c.children)) {
            c.children.forEach(function(child) {
              html += cmtItemHtml(child, true);
            });
          }
        });
        lbCmtStub.innerHTML = html;
      }

      function updateCmtUI(postUrl) {
        if (!lbCmtStub) return;
        lbCmtStub.innerHTML = '<p class="dyo-lb-ig-cmt-empty">댓글 불러오는 중…</p>';
        fetchTistoryComments(postUrl, function(comments) {
          // 댓글 응답에서 isRequestUser 확인 (아직 로그인 상태 미확인 시)
          if (_lbLoginState === null && Array.isArray(comments)) {
            comments.forEach(function(c) {
              if (c.writer && c.writer.isRequestUser) _lbLoginState = true;
              (c.children || []).forEach(function(child) {
                if (child.writer && child.writer.isRequestUser) _lbLoginState = true;
              });
            });
            if (_lbLoginState === true) updateComposeMeta(true);
          }
          renderComments(comments);
        });
      }

      // ── 댓글 작성 ─────────────────────────────────────────────────
      //  POST /m/api/{postId}/comment
      function postComment(postId, name, pw, text, cb) {
        lbHashPw(pw).then(function(hashedPw) {
          fetch('/m/api/' + postId + '/comment', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({
              captcha:    '',
              comment:    text,
              homepage:   location.origin,
              isSecret:   false,
              mentionId:  null,
              name:       name || '익명',
              parent:     null,
              password:   hashedPw
            })
          })
            .then(function(r) {
              if (!r.ok) throw new Error('HTTP ' + r.status);
              return r.json();
            })
            .then(function(d) { cb({ success: true, data: d }); })
            .catch(function() { cb({ success: false }); });
        }).catch(function() { cb({ success: false }); });
      }

      // ── 공유 ─────────────────────────────────────────────────────
      function sharePost(url) {
        var fullUrl = location.origin + url;
        if (navigator.share) {
          navigator.share({ url: fullUrl }).catch(function() {});
        } else {
          navigator.clipboard.writeText(fullUrl).then(function() {
            var btn = lbShareBtn;
            var orig = btn.innerHTML;
            btn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>';
            setTimeout(function() { btn.innerHTML = orig; }, 1500);
          }).catch(function() {});
        }
      }

      // ── 메인 open/close ───────────────────────────────────────────
      function lbOpen(idx) {
        if (!_photos.length) return;
        _currentIdx = ((idx % _photos.length) + _photos.length) % _photos.length;
        var p = _photos[_currentIdx];

        lbImgEl.src              = p.img;
        lbImgEl.alt              = p.title || '';
        if (lbTitleEl)  lbTitleEl.textContent  = p.title || '';
        if (lbDateEl)   lbDateEl.textContent   = p.date  || '';
        if (lbCntEl)    lbCntEl.textContent    = (_currentIdx + 1) + ' / ' + _photos.length;
        if (lbPostLink) lbPostLink.href = p.url;

        var show = _photos.length > 1;
        if (lbPrevEl) lbPrevEl.style.display = show ? '' : 'none';
        if (lbNextEl) lbNextEl.style.display = show ? '' : 'none';

        updateLikeUI(p.url);
        updateCmtUI(p.url);
        // 로그인 상태에 따라 이름/비밀번호 입력란 표시 여부 결정
        updateComposeMeta(_lbLoginState === true);

        if (lbEl) lbEl.classList.add('open');
        if (lbDropdown) lbDropdown.classList.remove('open');
      }

      function lbClose() {
        if (lbEl) lbEl.classList.remove('open');
        if (lbImgEl) lbImgEl.src = '';
        if (lbDropdown) lbDropdown.classList.remove('open');
      }

      // ── 이벤트 바인딩 ─────────────────────────────────────────────
      if (lbCloseEl) lbCloseEl.addEventListener('click', lbClose);
      if (lbBgEl)    lbBgEl.addEventListener('click',    lbClose);
      if (lbPrevEl)  lbPrevEl.addEventListener('click',  function() { lbOpen(_currentIdx - 1); });
      if (lbNextEl)  lbNextEl.addEventListener('click',  function() { lbOpen(_currentIdx + 1); });

      // 햄버거 메뉴
      if (lbMenuBtn) lbMenuBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        if (lbDropdown) lbDropdown.classList.toggle('open');
      });
      document.addEventListener('click', function() {
        if (lbDropdown) lbDropdown.classList.remove('open');
      });

      // 링크 복사
      if (lbCopyLink) lbCopyLink.addEventListener('click', function() {
        var p = _photos[_currentIdx];
        if (!p) return;
        navigator.clipboard.writeText(location.origin + p.url).then(function() {
          lbCopyLink.textContent = '복사됨 ✓';
          setTimeout(function() { lbCopyLink.textContent = '링크 복사'; }, 1500);
        }).catch(function() {});
        if (lbDropdown) lbDropdown.classList.remove('open');
      });

      // 좋아요
      if (lbLikeBtn) lbLikeBtn.addEventListener('click', function() {
        var p = _photos[_currentIdx];
        if (!p) return;
        var postId  = getPostId(p.url);
        if (!postId) return;
        var nowLiked = !lbLikeBtn.classList.contains('liked');
        // 낙관적 UI 업데이트 (즉시 반영)
        var curText  = lbLikesLine ? lbLikesLine.textContent : '';
        var curCount = parseInt((curText.match(/\d+/) || ['0'])[0], 10);
        applyLikeUI(nowLiked, nowLiked ? curCount + 1 : Math.max(0, curCount - 1));
        lbLikeBtn.classList.remove('pop');
        void lbLikeBtn.offsetWidth;
        lbLikeBtn.classList.add('pop');
        // API 호출 후 서버 카운트로 보정
        callReactionAPI(postId, nowLiked, function(res) {
          if (!res.success) {
            // 실패 시 원래 상태로 롤백 + 캐시도 복원
            _likeCache[postId] = { liked: !nowLiked, count: curCount };
            applyLikeUI(!nowLiked, curCount);
          } else if (res.count != null) {
            applyLikeUI(nowLiked, res.count);
          }
        });
      });

      // 공유
      if (lbShareBtn) lbShareBtn.addEventListener('click', function() {
        var p = _photos[_currentIdx];
        if (p) sharePost(p.url);
      });

      // 댓글 입력 — 내용 있어야 게시 버튼 활성화
      if (lbCmtInput) lbCmtInput.addEventListener('input', function() {
        if (lbCmtSubmit) lbCmtSubmit.disabled = !this.value.trim();
      });

      // 댓글 입력 — Enter 키로 제출
      if (lbCmtInput) lbCmtInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey && lbCmtSubmit && !lbCmtSubmit.disabled) {
          e.preventDefault();
          lbCmtSubmit.click();
        }
      });

      // 댓글 게시
      if (lbCmtSubmit) lbCmtSubmit.addEventListener('click', function() {
        var p = _photos[_currentIdx];
        if (!p) return;
        var postId  = getPostId(p.url);
        var name    = lbCmtName   ? lbCmtName.value.trim()   : '';
        var pw      = lbCmtPw     ? lbCmtPw.value             : '';
        var comment = lbCmtInput  ? lbCmtInput.value.trim()  : '';
        if (!comment || !postId) return;

        lbCmtSubmit.disabled = true;
        lbCmtSubmit.textContent = '…';

        postComment(postId, name, pw, comment, function(res) {
          lbCmtSubmit.textContent = '게시';
          if (res.success) {
            if (lbCmtInput) { lbCmtInput.value = ''; }
            // 댓글 목록 새로고침
            updateCmtUI(p.url);
          } else {
            // 실패 시 버튼 재활성화
            lbCmtSubmit.disabled = false;
          }
        });
      });

      // 키보드
      document.addEventListener('keydown', function(e) {
        if (!lbEl || !lbEl.classList.contains('open')) return;
        if (e.key === 'Escape')     lbClose();
        if (e.key === 'ArrowLeft')  lbOpen(_currentIdx - 1);
        if (e.key === 'ArrowRight') lbOpen(_currentIdx + 1);
      });

      var gpPostCountEl = document.getElementById('dyoGpPostCount');
      function setProfilePostCount(n) {
        if (gpPostCountEl) gpPostCountEl.textContent = n;
      }

      // ── 렌더링 (무한 스크롤) ──────────────────────────────────────
      function _makeCell(p, idx) {
        var cell = document.createElement('div');
        cell.className = 'dyo-gallery-item';
        var img = document.createElement('img');
        img.src     = p.img;
        img.alt     = p.title || '';
        img.loading = 'lazy';
        var overlay = document.createElement('div');
        overlay.className = 'dyo-gallery-overlay';
        overlay.innerHTML = '<span class="dyo-ig-center-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></span>';
        cell.appendChild(img);
        cell.appendChild(overlay);
        cell.addEventListener('click', function() { lbOpen(idx); });
        return cell;
      }

      function renderMore() {
        if (_rendered >= _photos.length) return;
        // 기존 sentinel 제거
        var oldSentinel = gridEl.querySelector('.dyo-gallery-sentinel');
        if (oldSentinel) { if (_scrollObserver) _scrollObserver.unobserve(oldSentinel); oldSentinel.remove(); }

        var batch = _photos.slice(_rendered, _rendered + GALLERY_PAGE_SIZE);
        batch.forEach(function(p, bi) {
          gridEl.appendChild(_makeCell(p, _rendered + bi));
        });
        _rendered += batch.length;

        // 아직 더 있으면 sentinel 추가
        if (_rendered < _photos.length) {
          var sentinel = document.createElement('div');
          sentinel.className = 'dyo-gallery-sentinel';
          gridEl.appendChild(sentinel);
          if (_scrollObserver) _scrollObserver.observe(sentinel);
        }
      }

      function render() {
        gridEl.innerHTML = '';
        _rendered = 0;
        _photos = GALLERY_POSTS;

        setProfilePostCount(_photos.length);

        if (!_photos.length) {
          gridEl.style.display  = 'none';
          emptyEl.style.display = 'flex';
          if (statusEl) statusEl.textContent = '0 posts';
          return;
        }

        gridEl.style.display  = 'grid';
        emptyEl.style.display = 'none';
        if (statusEl) statusEl.textContent = _photos.length + ' posts';
        renderMore();
      }

      // IntersectionObserver — 스크롤 끝 감지
      if (galleryBodyEl && 'IntersectionObserver' in window) {
        _scrollObserver = new IntersectionObserver(function(entries) {
          entries.forEach(function(entry) {
            if (entry.isIntersecting) {
              _scrollObserver.unobserve(entry.target);
              renderMore();
            }
          });
        }, { root: galleryBodyEl, rootMargin: '60px' });
      }

      // ── 창 열기/닫기/최소화/최대화 ─────────────────────────────
      function openGallery() {
        var wasOpen = w.classList.contains('open');
        if (!wasOpen) {
          var W = Math.min(400, window.innerWidth  - 40);
          var H = Math.min(580, window.innerHeight - 40);
          w.style.width  = W + 'px';
          w.style.height = H + 'px';
          w.style.left   = Math.round(window.innerWidth - W - 24) + 'px';
          w.style.top    = Math.max(20, Math.min(
            Math.round((window.innerHeight - H) / 2),
            window.innerHeight - H - 160
          )) + 'px';
          w.style.right  = 'auto';
          w.style.bottom = 'auto';
        }
        w.classList.remove('minimized', 'maximized');
        w.classList.add('open');
        bringToFront();
        if (!wasOpen && window.dyoAnimOpen) window.dyoAnimOpen(w);

        // 로그인 상태 감지 (처음 한 번만)
        if (_lbLoginState === null) {
          detectLoginState(function(isLoggedIn) { updateComposeMeta(isLoggedIn); });
        }

        if (GALLERY_CATEGORY) {
          // 카테고리 페이지에서 자동 파싱
          if (statusEl) statusEl.textContent = '불러오는 중…';
          if (gridEl)   gridEl.innerHTML = '';
          if (emptyEl)  emptyEl.style.display = 'none';
          fetchCategoryPosts(GALLERY_CATEGORY, function(posts) {
            if (posts && posts.length > 0) GALLERY_POSTS = posts;
            render();
          });
        } else {
          render();
        }
      }

      window.dyoOpenGallery = openGallery;

      if (closeBtn) closeBtn.addEventListener('click', function() {
        if (window.dyoAnimDismiss) {
          window.dyoAnimDismiss(w, function() { w.classList.remove('open', 'minimized', 'maximized'); });
        } else {
          w.classList.remove('open', 'minimized', 'maximized');
        }
      });

      if (minBtn) minBtn.addEventListener('click', function() {
        if (w.classList.contains('minimized')) {
          var tb = document.querySelector('.dyo-taskbtn[data-win-id="dyoGalleryWin"]');
          window._dyoAnimSrc = tb || null;
          w.classList.remove('minimized');
          bringToFront();
          if (window.dyoAnimOpen) window.dyoAnimOpen(w);
        } else {
          if (window.dyoAnimMinimize) {
            window.dyoAnimMinimize(w, function() { w.classList.add('minimized'); });
          } else {
            w.classList.add('minimized');
          }
        }
      });

      if (maxBtn) maxBtn.addEventListener('click', function() {
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
            if (dir.includes('e')) nw = Math.max(340, sw + dx);
            if (dir.includes('s')) nh = Math.max(260, sh + dy);
            if (dir.includes('w')) { nw = Math.max(340, sw - dx); nl = sl + sw - nw; }
            if (dir.includes('n')) { nh = Math.max(260, sh - dy); nt = st + sh - nh; }
            w.style.width = nw + 'px'; w.style.height = nh + 'px';
            w.style.left  = nl + 'px'; w.style.top    = nt + 'px';
          }
          function onUp2() { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp2); }
          document.addEventListener('mousemove', onMove);
          document.addEventListener('mouseup', onUp2);
        });
      });

      w.addEventListener('mousedown', bringToFront);
    })();

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

      // 첫 방문 시 튜토리얼 자동 시작, 이후 방문에서는 표시하지 않음
      window.dyoMaybeStartTutorial = function() {
        if (!localStorage.getItem(TUT_KEY) && document.body.id === 'tt-body-index') {
          window.dyoStartTutorial();
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
        { id: 'ibbxPim795M', title: '', artist: '' },
        { id: 'JZh9MCUAnEs', title: '', artist: '' },
        { id: 'f_8T6_B3F7Y', title: '', artist: '' },
        { id: 'M4AvZRDMPBU', title: '', artist: '' }
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
        // 음악바는 항상 표시 — show 클래스 제거하지 않음
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
        if (val) { showTbMusic(); } else { hideTbMusic(); }
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
            '<img class="dyo-pl-thumb" src="https://img.youtube.com/vi/' + track.id + '/mqdefault.jpg" alt="" draggable="false">' +
            '<div class="dyo-pl-info">' +
              '<div class="dyo-pl-title">'  + track.title  + '</div>' +
              '<div class="dyo-pl-artist">' + track.artist + '</div>' +
            '</div>';
          item.addEventListener('click', function() {
            if (!ytPlayer) { curIdx = i; updateMeta(i); renderPlaylist(); autoPlayOnReady = true; loadYTAPI(); return; }
            if (i === curIdx) { isPlaying ? ytPlayer.pauseVideo() : ytPlayer.playVideo(); }
            else { playTrack(i); }
          });
          listEl.appendChild(item);
        });
      }

      window.dyoOpenMusic = openMusic;
    })();

    // ======================================================
    // 태스크바 캘린더 팝업
    // ======================================================
    (function() {
      var popup   = document.getElementById('dyoCalPopup');
      var titleEl = document.getElementById('dyoCalTitle');
      var grid    = document.getElementById('dyoCalGrid');
      var prevBtn = document.getElementById('dyoCalPrev');
      var nextBtn = document.getElementById('dyoCalNext');
      var clockEl = document.getElementById('dyoBarClock');
      if (!popup || !clockEl) return;

      var now = new Date();
      var viewYear  = now.getFullYear();
      var viewMonth = now.getMonth();

      var DAYS = ['일', '월', '화', '수', '목', '금', '토'];
      function renderCal() {
        var y = viewYear, m = viewMonth;
        titleEl.textContent = y + '년 ' + (m + 1) + '월';
        grid.innerHTML = '';
        DAYS.forEach(function(d, i) {
          var el = document.createElement('span');
          el.className = 'dyo-cal-dow' + (i === 0 ? ' sun' : i === 6 ? ' sat' : '');
          el.textContent = d;
          grid.appendChild(el);
        });
        var firstDow    = new Date(y, m, 1).getDay();
        var daysInMonth = new Date(y, m + 1, 0).getDate();
        var todayNow = new Date();
        var todayY = todayNow.getFullYear(), todayM = todayNow.getMonth(), todayD = todayNow.getDate();
        for (var i = 0; i < firstDow; i++) {
          var emp = document.createElement('span');
          emp.className = 'dyo-cal-day empty';
          grid.appendChild(emp);
        }
        for (var d = 1; d <= daysInMonth; d++) {
          var dow = (firstDow + d - 1) % 7;
          var cls = 'dyo-cal-day';
          if (dow === 0) cls += ' sun';
          if (dow === 6) cls += ' sat';
          if (y === todayY && m === todayM && d === todayD) cls += ' today';
          var cell = document.createElement('span');
          cell.className = cls;
          cell.textContent = d;
          grid.appendChild(cell);
        }
      }

      prevBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        viewMonth--;
        if (viewMonth < 0) { viewMonth = 11; viewYear--; }
        renderCal();
      });
      nextBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        viewMonth++;
        if (viewMonth > 11) { viewMonth = 0; viewYear++; }
        renderCal();
      });

      // 시계 클릭 → 팝업 토글
      clockEl.addEventListener('click', function(e) {
        e.stopPropagation();
        var isOpen = popup.classList.contains('open');
        if (isOpen) {
          popup.classList.remove('open');
        } else {
          // 오늘 달로 리셋
          var t = new Date();
          viewYear = t.getFullYear();
          viewMonth = t.getMonth();
          renderCal();
          // 시계 위에 위치
          var cr = clockEl.getBoundingClientRect();
          var pw = popup.offsetWidth || 280;
          popup.style.left = Math.max(8, cr.right - pw) + 'px';
          popup.style.bottom = (window.innerHeight - cr.top + 8) + 'px';
          popup.classList.add('open');
        }
      });

      // 바깥 클릭 → 닫기
      document.addEventListener('click', function(e) {
        if (!popup.classList.contains('open')) return;
        if (popup.contains(e.target) || clockEl.contains(e.target)) return;
        popup.classList.remove('open');
      });

      renderCal();
    })();

    // 튜토리얼은 activateDesktop()에서 호출

    // ============================================================
    // Board
    // ============================================================
    (function () {
      var BOARD_URL = '/notice/130';
      var COLS = [
        { id: 'todo',       title: 'To Do',      color: '#3b82f6' },
        { id: 'inprogress', title: 'In Progress', color: '#f59e0b' },
        { id: 'done',       title: 'Done',        color: '#22c55e' }
      ];
      var COL_NUM = { todo: 1, inprogress: 2, done: 3 };
      var MIN_W = 728, MIN_H = 416;

      var win        = document.getElementById('dyoBoardWin');
      var titlebar   = document.getElementById('dyoBoardTitlebar');
      var colsEl     = document.getElementById('dyoBoardColumns');
      var closeBtn   = document.getElementById('dyoBoardClose');
      var minBtn     = document.getElementById('dyoBoardMin');
      var maxBtn     = document.getElementById('dyoBoardMax');
      var refreshBtn = document.getElementById('dyoBoardRefresh');
      if (!win) return;

      // 필터 / 진행률 / 클립보드 요소
      var searchInput     = document.getElementById('dyoBrdSearch');
      var filterLabel     = document.getElementById('dyoBrdFilterLabel');
      var filterPriority  = document.getElementById('dyoBrdFilterPriority');
      var progressFill    = document.getElementById('dyoBrdProgressFill');
      var progressText    = document.getElementById('dyoBrdProgressText');
      var clipboardBtn    = document.getElementById('dyoBrdClipboard');

      // ── 전체 카드 데이터 (드래그 오버라이드 포함) ───────────
      var _allCards = [];     // 원본 파싱 데이터
      var _dirty = false;     // 드래그로 변경 여부

      // ── 데이터 파싱 ──────────────────────────────────────
      // 게시글 각 줄: "colNum, title[, label[, priority[, desc[, dueDate]]]]"
      // colNum 1=Todo, 2=InProgress, 3=Done
      // desc 안에 [ ] / [x] 패턴이 있으면 서브태스크로 파싱
      function fetchBoardCards(cb) {
        fetch(BOARD_URL, { credentials: 'include' })
          .then(function(r) { return r.text(); })
          .then(function(html) {
            var doc = new DOMParser().parseFromString(html, 'text/html');
            var cards = [];
            // 본문 영역 찾기
            var contentEl = doc.querySelector('.tt_article_useless_p_margin, .contents_style');
            if (!contentEl) { cb([]); return; }
            // <br>, </p><p>, </li><li> 등을 줄바꿈으로 변환 후 태그 제거
            var rawHtml = contentEl.innerHTML;
            var text = rawHtml
              .replace(/<br\s*\/?>/gi, '\n')
              .replace(/<\/p>\s*<p[^>]*>/gi, '\n')
              .replace(/<\/li>\s*<li[^>]*>/gi, '\n')
              .replace(/<[^>]*>/g, '');
            // HTML 엔티티 디코딩
            var tmp = doc.createElement('textarea');
            tmp.innerHTML = text;
            text = tmp.value;
            // 줄 단위 파싱
            var lines = text.split('\n');
            lines.forEach(function(line) {
              line = line.trim();
              if (!line) return;
              var parts = line.split(',').map(function(s) { return s.trim(); });
              var colNum = parseInt(parts[0]);
              if (isNaN(colNum) || colNum < 1 || colNum > 3 || !parts[1]) return;
              var rawDesc = parts[4] || '';
              var dueDate = parts[5] || '';
              var subtasks = parseSubtasks(rawDesc);
              cards.push({
                colId:    COLS[colNum - 1].id,
                title:    parts[1] || '',
                label:    parts[2] ? parts[2].toLowerCase() : null,
                priority: parts[3] ? parts[3].toLowerCase() : null,
                desc:     subtasks.cleanDesc,
                dueDate:  dueDate,
                subtasks: subtasks.items
              });
            });
            cb(cards);
          })
          .catch(function() { cb([]); });
      }

      // desc에서 [ ] / [x] 패턴을 서브태스크로 추출
      function parseSubtasks(desc) {
        if (!desc) return { cleanDesc: '', items: [] };
        var items = [];
        var clean = desc.replace(/\[([xX ])\]\s*([^[\]]*)/g, function(_, mark, text) {
          text = text.trim();
          if (text) items.push({ done: mark.toLowerCase() === 'x', text: text });
          return '';
        }).trim();
        return { cleanDesc: clean, items: items };
      }

      // ── 필터 로직 ─────────────────────────────────────────
      function getFilteredCards() {
        var q = (searchInput.value || '').toLowerCase();
        var fl = filterLabel.value;
        var fp = filterPriority.value;
        return _allCards.filter(function(c) {
          if (q && c.title.toLowerCase().indexOf(q) === -1) return false;
          if (fl && c.label !== fl) return false;
          if (fp && c.priority !== fp) return false;
          return true;
        });
      }

      function onFilterChange() {
        renderAll(getFilteredCards());
      }

      if (searchInput)    searchInput.addEventListener('input', onFilterChange);
      if (filterLabel)    filterLabel.addEventListener('change', onFilterChange);
      if (filterPriority) filterPriority.addEventListener('change', onFilterChange);

      // ── 진행률 업데이트 ────────────────────────────────────
      function updateProgress() {
        var total = _allCards.length;
        var done  = _allCards.filter(function(c) { return c.colId === 'done'; }).length;
        var pct   = total ? Math.round(done / total * 100) : 0;
        if (progressFill) progressFill.style.width = pct + '%';
        if (progressText) progressText.textContent = done + '/' + total + ' Done (' + pct + '%)';
        // 태스크바 배지 업데이트 (Linux + Windows 양쪽)
        var remaining = total - done;
        ['dyoBarBoardBadge', 'dyoWinBoardBadge'].forEach(function(id) {
          var b = document.getElementById(id);
          if (!b) return;
          b.textContent = remaining > 0 ? remaining : '';
          b.style.display = remaining > 0 ? '' : 'none';
        });
      }

      // ── D-day 계산 ─────────────────────────────────────────
      function getDdayBadge(dateStr) {
        if (!dateStr) return '';
        var parts = dateStr.split(/[-/]/);
        var y = parseInt(parts[0]), m = parseInt(parts[1]) - 1, d = parseInt(parts[2]);
        if (isNaN(y) || isNaN(m) || isNaN(d)) return '';
        var due = new Date(y, m, d);
        var now = new Date(); now.setHours(0,0,0,0);
        var diff = Math.round((due - now) / 86400000);
        var cls = 'dyo-brd-duedate';
        if (diff < 0) cls += ' overdue';
        else if (diff <= 3) cls += ' soon';
        var label = diff === 0 ? 'Today' : diff > 0 ? 'D-' + diff : 'D+' + Math.abs(diff);
        return '<span class="' + cls + '" title="' + dateStr + '">' + label + '</span>';
      }

      // ── 렌더 ─────────────────────────────────────────────
      var _collapsedCols = {};
      function renderAll(cards) {
        colsEl.innerHTML = '';
        COLS.forEach(function(col) {
          var colCards = cards.filter(function(c) { return c.colId === col.id; });
          colsEl.appendChild(buildCol(col, colCards));
        });
        updateProgress();
      }

      function buildCol(col, cards) {
        var div = document.createElement('div');
        div.className = 'dyo-brd-col';
        div.dataset.colId = col.id;
        var isCollapsed = _collapsedCols[col.id];
        if (isCollapsed) div.classList.add('collapsed');

        var headerEl = document.createElement('div');
        headerEl.className = 'dyo-brd-col-header';
        headerEl.innerHTML =
          '<span class="dyo-brd-col-accent" style="background:' + col.color + '"></span>' +
          '<span class="dyo-brd-col-title">' + col.title + '</span>' +
          '<span class="dyo-brd-col-count">' + cards.length + '</span>' +
          '<button class="dyo-brd-col-toggle" title="접기/펼치기">' + (isCollapsed ? '+' : '−') + '</button>';
        div.appendChild(headerEl);

        // 컬럼 접기/펼치기
        var toggleBtn = headerEl.querySelector('.dyo-brd-col-toggle');
        toggleBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          _collapsedCols[col.id] = !_collapsedCols[col.id];
          div.classList.toggle('collapsed', _collapsedCols[col.id]);
          toggleBtn.textContent = _collapsedCols[col.id] ? '+' : '−';
        });

        var cardsEl = document.createElement('div');
        cardsEl.className = 'dyo-brd-col-cards';
        cardsEl.dataset.colId = col.id;
        cards.forEach(function(card) { cardsEl.appendChild(buildCard(card)); });
        div.appendChild(cardsEl);

        // ── 드래그 앤 드롭: 드롭 존 ─────────────────────────
        cardsEl.addEventListener('dragover', function(e) {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          cardsEl.classList.add('dyo-brd-dragover');
          // 삽입 위치 표시
          var afterEl = getDragAfterElement(cardsEl, e.clientY);
          var ghost = colsEl.querySelector('.dyo-brd-drop-indicator');
          if (!ghost) {
            ghost = document.createElement('div');
            ghost.className = 'dyo-brd-drop-indicator';
          }
          if (afterEl) cardsEl.insertBefore(ghost, afterEl);
          else cardsEl.appendChild(ghost);
        });
        cardsEl.addEventListener('dragleave', function(e) {
          if (!cardsEl.contains(e.relatedTarget)) {
            cardsEl.classList.remove('dyo-brd-dragover');
            var ghost = cardsEl.querySelector('.dyo-brd-drop-indicator');
            if (ghost) ghost.remove();
          }
        });
        cardsEl.addEventListener('drop', function(e) {
          e.preventDefault();
          cardsEl.classList.remove('dyo-brd-dragover');
          var ghost = colsEl.querySelector('.dyo-brd-drop-indicator');
          if (ghost) ghost.remove();
          var cardIdx = parseInt(e.dataTransfer.getData('text/plain'));
          if (isNaN(cardIdx) || !_allCards[cardIdx]) return;
          var card = _allCards[cardIdx];
          var oldCol = card.colId;
          card.colId = col.id;
          if (oldCol !== col.id) {
            _dirty = true;
            if (clipboardBtn) clipboardBtn.classList.add('dirty');
            if (window.dyoToast) window.dyoToast('"' + card.title + '" → ' + col.title, 'info', 2000);
          }
          renderAll(getFilteredCards());
        });

        return div;
      }

      // 드래그 중 마우스 위치 기준 삽입할 카드 element 찾기
      function getDragAfterElement(container, y) {
        var els = Array.from(container.querySelectorAll('.dyo-brd-card:not(.dragging)'));
        var closest = null, closestOffset = Number.NEGATIVE_INFINITY;
        els.forEach(function(el) {
          var box = el.getBoundingClientRect();
          var offset = y - box.top - box.height / 2;
          if (offset < 0 && offset > closestOffset) {
            closestOffset = offset;
            closest = el;
          }
        });
        return closest;
      }

      var PRIORITY_ICON = {
        veryhigh: '<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="2,9 5,5 8,9"/><polyline points="2,5 5,1 8,5"/></svg>',
        high:     '<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="2,7 5,3 8,7"/></svg>',
        medium:   '<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="2" y1="5" x2="8" y2="5"/></svg>',
        low:      '<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="2,3 5,7 8,3"/></svg>',
        verylow:  '<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="2,1 5,5 8,1"/><polyline points="2,5 5,9 8,5"/></svg>'
      };

      function buildCard(card) {
        var idx = _allCards.indexOf(card);
        var el = document.createElement('div');
        el.className = 'dyo-brd-card';
        el.draggable = true;
        el.dataset.cardIdx = idx;

        // ── 드래그 앤 드롭: 드래그 소스 ─────────────────────
        el.addEventListener('dragstart', function(e) {
          e.dataTransfer.setData('text/plain', String(idx));
          e.dataTransfer.effectAllowed = 'move';
          el.classList.add('dragging');
          setTimeout(function() { el.style.opacity = '0.4'; }, 0);
        });
        el.addEventListener('dragend', function() {
          el.classList.remove('dragging');
          el.style.opacity = '';
          colsEl.querySelectorAll('.dyo-brd-dragover').forEach(function(c) { c.classList.remove('dyo-brd-dragover'); });
          var ghost = colsEl.querySelector('.dyo-brd-drop-indicator');
          if (ghost) ghost.remove();
        });

        var badges = '';
        if (card.label)    badges += '<span class="dyo-brd-label ' + card.label + '">' + card.label + '</span>';
        if (card.priority) {
          var pIcon = PRIORITY_ICON[card.priority] || card.priority;
          badges += '<span class="dyo-brd-priority ' + card.priority + '" title="' + card.priority + '">' + pIcon + '</span>';
        }
        if (card.dueDate) badges += getDdayBadge(card.dueDate);

        // 서브태스크 진행률 배지
        var stBadge = '';
        if (card.subtasks && card.subtasks.length) {
          var stDone = card.subtasks.filter(function(s) { return s.done; }).length;
          stBadge = '<span class="dyo-brd-subtask-badge">' +
            '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' +
            stDone + '/' + card.subtasks.length + '</span>';
        }

        el.innerHTML =
          (badges || stBadge ? '<div class="dyo-brd-card-badges">' + badges + stBadge + '</div>' : '') +
          '<div class="dyo-brd-card-title' + (card.colId === 'done' ? ' done' : '') + '">' + escHtml(card.title) + '</div>';
        el.addEventListener('click', function(e) {
          if (el.classList.contains('dragging')) return;
          openCardDetail(card);
        });
        return el;
      }

      // ── 카드 상세 모달 ────────────────────────────────────
      var PRIORITY_LABEL = {
        veryhigh: 'Very High', high: 'High', medium: 'Medium', low: 'Low', verylow: 'Very Low'
      };
      var COL_LABEL = { todo: 'To Do', inprogress: 'In Progress', done: 'Done' };
      var COL_COLOR = { todo: '#3b82f6', inprogress: '#f59e0b', done: '#22c55e' };

      var detailPanel  = document.getElementById('dyoBrdDetailPanel');
      var detailClose  = document.getElementById('dyoBrdDetailClose');
      var detailDelete = document.getElementById('dyoBrdDetailDelete');
      var _detailCard  = null; // 현재 상세 패널에 열린 카드

      function openCardDetail(card) {
        _detailCard = card;
        document.getElementById('dyoBrdDetailColBadge').textContent       = COL_LABEL[card.colId] || card.colId;
        document.getElementById('dyoBrdDetailColBadge').style.background  = COL_COLOR[card.colId] || '#888';
        document.getElementById('dyoBrdDetailTitle').textContent          = card.title;
        var descEl = document.getElementById('dyoBrdDetailDesc');
        descEl.classList.toggle('dyo-brd-detail-desc-empty', !card.desc);
        descEl.textContent = card.desc || '설명 없음';

        // 우선순위
        var prioEl = document.getElementById('dyoBrdDetailPriority');
        if (card.priority && PRIORITY_ICON[card.priority]) {
          prioEl.innerHTML = '<span class="dyo-brd-priority ' + card.priority + '">' + PRIORITY_ICON[card.priority] + '</span>'
            + '<span class="dyo-brd-detail-prio-label">' + (PRIORITY_LABEL[card.priority] || card.priority) + '</span>';
        } else {
          prioEl.textContent = '—';
        }

        // 카테고리
        var lblEl = document.getElementById('dyoBrdDetailLabel');
        if (card.label) {
          lblEl.innerHTML = '<span class="dyo-brd-label ' + card.label + '">' + card.label + '</span>';
        } else {
          lblEl.textContent = '—';
        }

        // 마감일
        var dueDateRow = document.getElementById('dyoBrdDetailDueDateRow');
        var dueDateVal = document.getElementById('dyoBrdDetailDueDate');
        if (card.dueDate) {
          dueDateRow.style.display = '';
          dueDateVal.innerHTML = getDdayBadge(card.dueDate) + ' <span style="color:#6b7280;font-size:12px">' + escHtml(card.dueDate) + '</span>';
        } else {
          dueDateRow.style.display = 'none';
        }

        // 서브태스크/체크리스트
        var stSection = document.getElementById('dyoBrdDetailSubtaskSection');
        var stList    = document.getElementById('dyoBrdDetailSubtasks');
        var stCount   = document.getElementById('dyoBrdDetailSubtaskCount');
        if (card.subtasks && card.subtasks.length) {
          stSection.style.display = '';
          stList.innerHTML = '';
          var stDone = card.subtasks.filter(function(s) { return s.done; }).length;
          stCount.textContent = '(' + stDone + '/' + card.subtasks.length + ')';
          card.subtasks.forEach(function(st) {
            var item = document.createElement('label');
            item.className = 'dyo-brd-subtask-item' + (st.done ? ' done' : '');
            var cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.checked = st.done;
            cb.addEventListener('change', function() {
              st.done = cb.checked;
              item.classList.toggle('done', cb.checked);
              var d = card.subtasks.filter(function(s) { return s.done; }).length;
              stCount.textContent = '(' + d + '/' + card.subtasks.length + ')';
              _dirty = true;
              if (clipboardBtn) clipboardBtn.classList.add('dirty');
              renderAll(getFilteredCards());
            });
            var span = document.createElement('span');
            span.textContent = st.text;
            item.appendChild(cb);
            item.appendChild(span);
            stList.appendChild(item);
          });
        } else {
          stSection.style.display = 'none';
        }

        if (detailPanel && !detailPanel.classList.contains('open')) {
          var addW = 280;
          var curW = win.offsetWidth;
          var winLeft = parseFloat(win.style.left) || win.getBoundingClientRect().left;
          var maxW = window.innerWidth - winLeft - 8;
          win.style.width = Math.min(curW + addW, maxW) + 'px';
          detailPanel.classList.add('open');
        }
      }

      if (detailClose) detailClose.addEventListener('click', function() {
        if (detailPanel && detailPanel.classList.contains('open')) {
          detailPanel.classList.remove('open');
          win.style.width = (win.offsetWidth - 280) + 'px';
        }
      });

      // ── 이슈 삭제 ──────────────────────────────────────────
      if (detailDelete) detailDelete.addEventListener('click', function() {
        if (!_detailCard) return;
        var idx = _allCards.indexOf(_detailCard);
        if (idx === -1) return;
        var title = _detailCard.title;
        _allCards.splice(idx, 1);
        _dirty = true;
        if (clipboardBtn) clipboardBtn.classList.add('dirty');
        // 상세 패널 닫기
        if (detailPanel && detailPanel.classList.contains('open')) {
          detailPanel.classList.remove('open');
          win.style.width = (win.offsetWidth - 280) + 'px';
        }
        _detailCard = null;
        renderAll(getFilteredCards());
        if (window.dyoToast) window.dyoToast('"' + title + '" 삭제됨', 'info', 2000);
      });

      // ── 이슈 수정 ──────────────────────────────────────────
      var editPanel    = document.getElementById('dyoBrdDetailEdit');
      var editBtn      = document.getElementById('dyoBrdDetailEditBtn');
      var editSave     = document.getElementById('dyoBrdEditSave');
      var editCancel   = document.getElementById('dyoBrdEditCancel');
      var editTitle    = document.getElementById('dyoBrdEditTitle');
      var editCol      = document.getElementById('dyoBrdEditCol');
      var editLabel    = document.getElementById('dyoBrdEditLabel');
      var editPrio     = document.getElementById('dyoBrdEditPriority');
      var editDue      = document.getElementById('dyoBrdEditDue');
      var editDesc     = document.getElementById('dyoBrdEditDesc');
      var detailActions = document.getElementById('dyoBrdDetailActions');

      // 보기 영역 요소 (수정 모드에서 숨김)
      var viewEls = detailPanel ? detailPanel.querySelectorAll(
        '.dyo-brd-detail-title, .dyo-brd-detail-section'
      ) : [];

      function setEditMode(on) {
        if (editPanel) editPanel.style.display = on ? '' : 'none';
        if (detailActions) detailActions.style.display = on ? 'none' : '';
        viewEls.forEach(function(el) { el.style.display = on ? 'none' : ''; });
        // 서브태스크 섹션은 카드에 따라 다시 처리
        var stSection = document.getElementById('dyoBrdDetailSubtaskSection');
        if (!on && stSection && _detailCard && (!_detailCard.subtasks || !_detailCard.subtasks.length)) {
          stSection.style.display = 'none';
        }
      }

      if (editBtn) editBtn.addEventListener('click', function() {
        if (!_detailCard) return;
        // 현재 카드 값으로 폼 채우기
        editTitle.value = _detailCard.title;
        editCol.value   = _detailCard.colId;
        editLabel.value = _detailCard.label || '';
        editPrio.value  = _detailCard.priority || '';
        editDue.value   = _detailCard.dueDate || '';
        // 설명 + 서브태스크 원본 복원
        var descParts = [];
        if (_detailCard.desc) descParts.push(_detailCard.desc);
        if (_detailCard.subtasks && _detailCard.subtasks.length) {
          _detailCard.subtasks.forEach(function(st) {
            descParts.push('[' + (st.done ? 'x' : ' ') + '] ' + st.text);
          });
        }
        editDesc.value = descParts.join('\n');
        setEditMode(true);
        editTitle.focus();
      });

      if (editCancel) editCancel.addEventListener('click', function() {
        setEditMode(false);
      });

      if (editSave) editSave.addEventListener('click', function() {
        if (!_detailCard) return;
        var title = (editTitle.value || '').trim();
        if (!title) { editTitle.focus(); return; }
        var rawDesc = (editDesc.value || '').trim();
        var subtasks = parseSubtasks(rawDesc);
        _detailCard.title    = title;
        _detailCard.colId    = editCol.value;
        _detailCard.label    = editLabel.value || null;
        _detailCard.priority = editPrio.value  || null;
        _detailCard.dueDate  = editDue.value   || '';
        _detailCard.desc     = subtasks.cleanDesc;
        _detailCard.subtasks = subtasks.items;
        _dirty = true;
        if (clipboardBtn) clipboardBtn.classList.add('dirty');
        setEditMode(false);
        openCardDetail(_detailCard);
        renderAll(getFilteredCards());
        if (window.dyoToast) window.dyoToast('"' + title + '" 수정됨', 'success', 2000);
      });

      function escHtml(s) {
        return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      }

      // ── 클립보드 복사 (현재 카드 상태를 게시물 형식으로) ────
      if (clipboardBtn) clipboardBtn.addEventListener('click', function() {
        var lines = [];
        COLS.forEach(function(col, ci) {
          _allCards.forEach(function(card) {
            if (card.colId !== col.id) return;
            var parts = [ci + 1, card.title];
            parts.push(card.label || '');
            parts.push(card.priority || '');
            // desc + 서브태스크 합치기
            var descParts = [];
            if (card.desc) descParts.push(card.desc);
            if (card.subtasks && card.subtasks.length) {
              card.subtasks.forEach(function(st) {
                descParts.push('[' + (st.done ? 'x' : ' ') + '] ' + st.text);
              });
            }
            parts.push(descParts.join(' '));
            parts.push(card.dueDate || '');
            // 뒤에서 빈 값 제거
            while (parts.length > 2 && !parts[parts.length - 1]) parts.pop();
            lines.push(parts.join(', '));
          });
        });
        var text = lines.join('\n');
        var editWin = _dirty ? window.open('/manage/notice/130', '_blank') : null;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(function() {
            if (window.dyoToast) window.dyoToast('클립보드에 복사 후 저장 페이지로 이동합니다', 'success', 2500);
            _dirty = false;
            if (clipboardBtn) clipboardBtn.classList.remove('dirty');
          });
        }
      });

      // ── 새 이슈 추가 폼 ────────────────────────────────
      var addTrigger = document.getElementById('dyoBrdAddTrigger');
      var addForm    = document.getElementById('dyoBrdAddForm');
      var addTitle   = document.getElementById('dyoBrdAddTitle');
      var addCol     = document.getElementById('dyoBrdAddCol');
      var addLabel   = document.getElementById('dyoBrdAddLabel');
      var addPrio    = document.getElementById('dyoBrdAddPriority');
      var addDesc    = document.getElementById('dyoBrdAddDesc');
      var addDue     = document.getElementById('dyoBrdAddDue');
      var addSubmit  = document.getElementById('dyoBrdAddSubmit');
      var addCancel  = document.getElementById('dyoBrdAddCancel');

      function toggleAddForm(show) {
        if (!addForm) return;
        var visible = show !== undefined ? show : addForm.style.display === 'none';
        addForm.style.display = visible ? '' : 'none';
        if (visible && addTitle) addTitle.focus();
      }
      if (addTrigger) addTrigger.addEventListener('click', function() { toggleAddForm(); });
      if (addCancel)  addCancel.addEventListener('click',  function() { toggleAddForm(false); });

      function submitNewCard() {
        var title = (addTitle.value || '').trim();
        if (!title) { addTitle.focus(); return; }
        var colNum = parseInt(addCol.value) || 1;
        var rawDesc = (addDesc.value || '').trim();
        var subtasks = parseSubtasks(rawDesc);
        var card = {
          colId:    COLS[colNum - 1].id,
          title:    title,
          label:    addLabel.value ? addLabel.value.toLowerCase() : null,
          priority: addPrio.value  ? addPrio.value.toLowerCase()  : null,
          desc:     subtasks.cleanDesc,
          dueDate:  addDue.value || '',
          subtasks: subtasks.items
        };
        _allCards.push(card);
        _dirty = true;
        if (clipboardBtn) clipboardBtn.classList.add('dirty');
        renderAll(getFilteredCards());
        // 폼 초기화
        addTitle.value = ''; addDesc.value = ''; addDue.value = '';
        addCol.value = '1'; addLabel.value = ''; addPrio.value = '';
        toggleAddForm(false);
        if (window.dyoToast) window.dyoToast('"' + title + '" 추가됨', 'success', 2000);
      }
      if (addSubmit) addSubmit.addEventListener('click', submitNewCard);
      if (addTitle)  addTitle.addEventListener('keydown', function(e) { if (e.key === 'Enter') submitNewCard(); });

      // ── 태스크바 / 독 버튼 동기화 ────────────────────────
      function syncWinButtons(isOpen, isMin) {
        var tb = document.querySelector('.dyo-taskbtn[data-win-id="dyoBoardWin"]');
        if (tb) {
          tb.classList.toggle('open',      isOpen);
          tb.classList.toggle('active',    isOpen && !isMin);
          tb.classList.toggle('minimized', isOpen && isMin);
        }
        var dk = document.querySelector('.dyo-dock-item[data-win-id="dyoBoardWin"]');
        if (dk) {
          dk.classList.toggle('open',      isOpen);
          dk.classList.toggle('minimized', isOpen && isMin);
          var dock = document.getElementById('dyoDock');
          if (dock) dock.style.display = dock.querySelector('.dyo-dock-item.open') ? 'flex' : 'none';
        }
      }

      // ── 로딩 ─────────────────────────────────────────────
      var _loaded = false;
      function loadAndRender() {
        colsEl.innerHTML = '<div class="dyo-brd-loading">loading...</div>';
        _dirty = false;
        if (clipboardBtn) clipboardBtn.classList.remove('dirty');
        fetchBoardCards(function(cards) {
          _loaded = true;
          _allCards = cards;
          renderAll(cards);
        });
      }
      refreshBtn.addEventListener('click', loadAndRender);

      // ── 드래그 + 리사이즈 (Shell 창과 동일 패턴) ─────────
      var dragging = false, dragOX, dragOY;
      var resizing = false, resizeDir, resizeSX, resizeSY, resizeSRect;
      var savedPos = null;

      titlebar.addEventListener('mousedown', function(e) {
        // 닫기/최소화/최대화 버튼 클릭 시 드래그 무시
        if (e.target === closeBtn || e.target === minBtn || e.target === maxBtn) return;
        if (win.classList.contains('maximized')) return;
        var rect = win.getBoundingClientRect();
        win.style.left   = rect.left + 'px';
        win.style.top    = rect.top  + 'px';
        win.style.right  = 'auto';
        win.style.bottom = 'auto';
        dragging = true;
        dragOX = e.clientX - rect.left;
        dragOY = e.clientY - rect.top;
        e.preventDefault();
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

      document.addEventListener('touchmove', function(e) {
        if (!dragging) return;
        var t = e.touches[0];
        var x = Math.max(0, Math.min(window.innerWidth  - win.offsetWidth,  t.clientX - dragOX));
        var y = Math.max(0, Math.min(window.innerHeight - 40, t.clientY - dragOY));
        win.style.left = x + 'px';
        win.style.top  = y + 'px';
      }, { passive: true });

      document.addEventListener('mouseup',  function() { dragging = false; resizing = false; });
      document.addEventListener('touchend', function() { dragging = false; });

      // ── 닫기 ─────────────────────────────────────────────
      function closeWindow() {
        if (window.dyoAnimDismiss) {
          window.dyoAnimDismiss(win, function() {
            win.classList.remove('open', 'minimized', 'maximized');
            savedPos = null;
            syncWinButtons(false, false);
          });
        } else {
          win.classList.remove('open', 'minimized', 'maximized');
          savedPos = null;
          syncWinButtons(false, false);
        }
      }
      closeBtn.addEventListener('click', closeWindow);

      // ── 최소화 ───────────────────────────────────────────
      function minimizeWindow() {
        if (win.classList.contains('minimized')) {
          var tb = document.querySelector('.dyo-taskbtn[data-win-id="dyoBoardWin"]');
          window._dyoAnimSrc = tb || null;
          win.classList.remove('minimized');
          syncWinButtons(true, false);
          if (window.dyoAnimOpen) window.dyoAnimOpen(win);
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
            window.dyoAnimMinimize(win, function() {
              win.classList.add('minimized');
              syncWinButtons(true, true);
            });
          } else {
            win.classList.add('minimized');
            syncWinButtons(true, true);
          }
        }
      }
      minBtn.addEventListener('click', minimizeWindow);

      // ── 최대화 ───────────────────────────────────────────
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
      }
      maxBtn.addEventListener('click', maximizeWindow);
      titlebar.addEventListener('dblclick', function(e) {
        if (e.target === closeBtn || e.target === minBtn || e.target === maxBtn) return;
        maximizeWindow();
      });

      // ── z-index (창 클릭 시 최상위) ──────────────────────
      win.addEventListener('mousedown', function() {
        window._dyoZTop = (window._dyoZTop || 9000) + 1;
        win.style.zIndex = window._dyoZTop;
      });

      // ── 창 열기 ──────────────────────────────────────────
      function openWindow() {
        var wasOpen = win.classList.contains('open');
        if (!wasOpen) {
          var vw = window.innerWidth, vh = window.innerHeight;
          var iw = Math.min(884, vw - 40), ih = Math.min(624, vh - 80);
          win.style.width  = iw + 'px';
          win.style.height = ih + 'px';
          var memoEl = document.getElementById('dyoMemoWidget');
          var mTop = memoEl ? memoEl.getBoundingClientRect().top : 28;
          win.style.left   = Math.round((vw - iw) / 2) + 'px';
          win.style.top    = mTop + 'px';
          win.style.right  = 'auto';
          win.style.bottom = 'auto';
        }
        win.classList.add('open');
        win.classList.remove('minimized');
        window._dyoZTop = (window._dyoZTop || 9000) + 1;
        win.style.zIndex = window._dyoZTop;
        syncWinButtons(true, false);
        if (!wasOpen) {
          if (!_loaded) loadAndRender();
          if (window.dyoAnimOpen) window.dyoAnimOpen(win);
        }
      }

      window.dyoOpenBoard = openWindow;

    })();

    // ── 태스크바 칸반 배지 (독립 실행) ──────────────────────
    (function() {
      var badgeLinux = document.getElementById('dyoBarBoardBadge');
      var badgeWin   = document.getElementById('dyoWinBoardBadge');
      if (!badgeLinux && !badgeWin) return;
      var BOARD_URL = '/notice/130';
      var COLS_IDS = ['todo', 'inprogress', 'done'];
      fetch(BOARD_URL, { credentials: 'include' })
        .then(function(r) { return r.text(); })
        .then(function(html) {
          var doc = new DOMParser().parseFromString(html, 'text/html');
          var contentEl = doc.querySelector('.tt_article_useless_p_margin, .contents_style');
          if (!contentEl) return;
          var raw = contentEl.innerHTML
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<\/p>\s*<p[^>]*>/gi, '\n')
            .replace(/<\/li>\s*<li[^>]*>/gi, '\n')
            .replace(/<[^>]*>/g, '');
          var tmp = doc.createElement('textarea');
          tmp.innerHTML = raw;
          var total = 0, done = 0;
          tmp.value.split('\n').forEach(function(line) {
            line = line.trim();
            if (!line) return;
            var parts = line.split(',').map(function(s) { return s.trim(); });
            var colNum = parseInt(parts[0]);
            if (isNaN(colNum) || colNum < 1 || colNum > 3 || !parts[1]) return;
            total++;
            if (colNum === 3) done++;
          });
          var remaining = total - done;
          var txt = remaining > 0 ? remaining : '';
          if (badgeLinux) {
            badgeLinux.textContent = txt;
            badgeLinux.style.display = remaining > 0 ? 'inline-block' : 'none';
          }
          if (badgeWin) {
            badgeWin.textContent = txt;
            badgeWin.style.display = remaining > 0 ? '' : 'none';
          }
        })
        .catch(function() {});
    })();

    // '전체 글' → '전체글' 통일
    (function() {
      var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
      while (walker.nextNode()) {
        var node = walker.currentNode;
        if (node.textContent.indexOf('전체 글') !== -1) {
          node.textContent = node.textContent.replace(/전체 글/g, '전체글');
        }
      }
    })();

  