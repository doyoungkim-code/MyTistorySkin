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

    // 홈(인덱스) 페이지 - 데스크탑 홈화면 표시
    (function() {
      if (document.body.id !== 'tt-body-index') return;

      var desktop = document.getElementById('dyoDesktop');
      if (!desktop) return;

      // 데스크탑 표시 + 바디 스크롤 잠금
      desktop.classList.add('show');
      document.body.style.overflow = 'hidden';

      // 태스크바 표시 (dyo-desktop 외부에 위치)
      var desktopBar = document.getElementById('dyoDesktopBar');
      if (desktopBar) desktopBar.classList.add('show');

      // 시계 업데이트
      function updateClock() {
        var now = new Date();
        var hh = String(now.getHours()).padStart(2, '0');
        var mm = String(now.getMinutes()).padStart(2, '0');
        var yyyy = now.getFullYear();
        var mo = String(now.getMonth() + 1).padStart(2, '0');
        var dd = String(now.getDate()).padStart(2, '0');
        var clockEl = document.getElementById('desktopClock');
        var dateEl  = document.getElementById('desktopDate');
        if (clockEl) clockEl.textContent = hh + ':' + mm;
        if (dateEl)  dateEl.textContent  = yyyy + '/' + mo + '/' + dd;
      }
      updateClock();
      setInterval(updateClock, 1000);

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
      });

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
      if (!win || !btnShell) return;

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
          win.style.left   = Math.round((window.innerWidth  - W) / 2) + 'px';
          win.style.top    = Math.round((window.innerHeight - H) / 2) + 'px';
          win.style.right  = 'auto';
          win.style.bottom = 'auto';
        }
        win.classList.add('open');
        win.classList.remove('minimized');
        btnShell.classList.add('active');
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
            btnShell.classList.remove('active');
            savedPos = null;
          });
        } else {
          win.classList.remove('open', 'minimized', 'maximized');
          btnShell.classList.remove('active');
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

      btnShell.addEventListener('click', function() {
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
      var bFrame   = document.getElementById('dyoBrowserFrame');
      if (!bwin || !bFrame || !bUrlBar) return;
      window._dyoBWin = bwin;
      window._dyoBFrame = bFrame;
      window._dyoBUrlBar = bUrlBar;

      var dragging = false, dragOX = 0, dragOY = 0;
      var resizing = false, resizeDir = '', resizeSX = 0, resizeSY = 0, resizeSRect = null;
      var savedPos = null;
      var MIN_W = 360, MIN_H = 200;

      function openBrowser(url) {
        var fullUrl = url.startsWith('http') ? url : (window.location.origin + url);
        bFrame.src = fullUrl;
        bUrlBar.textContent = window.location.hostname + (url.startsWith('/') ? url : '/' + url);
        var wasOpen = bwin.classList.contains('open');
        if (!wasOpen) {
          var W = Math.min(1200, window.innerWidth  - 40);
          var H = Math.min(700,  window.innerHeight - 40);
          bwin.style.width  = W + 'px';
          bwin.style.height = H + 'px';
          bwin.style.left   = Math.round((window.innerWidth  - W) / 2) + 'px';
          bwin.style.top    = Math.round((window.innerHeight - H) / 2) + 'px';
          bwin.style.right  = 'auto';
          bwin.style.bottom = 'auto';
        }
        bwin.classList.add('open');
        bwin.classList.remove('minimized');
        window._dyoZTop = (window._dyoZTop || 9000) + 1;
        bwin.style.zIndex = window._dyoZTop;
        if (!wasOpen && window.dyoAnimOpen) window.dyoAnimOpen(bwin);
      }

      function closeBrowser() {
        if (window.dyoAnimDismiss) {
          window.dyoAnimDismiss(bwin, function() {
            bwin.classList.remove('open', 'minimized', 'maximized');
            bFrame.src = 'about:blank';
            bUrlBar.textContent = 'about:blank';
            savedPos = null;
          });
        } else {
          bwin.classList.remove('open', 'minimized', 'maximized');
          bFrame.src = 'about:blank';
          bUrlBar.textContent = 'about:blank';
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

      // URL 업데이트 (iframe 내 페이지 이동 감지)
      bFrame.addEventListener('load', function() {
        try {
          var loc = bFrame.contentWindow.location.href;
          if (loc && loc !== 'about:blank' && loc !== 'about:srcdoc') {
            bUrlBar.textContent = loc.replace(/^https?:\/\//, '');
          }
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
      if (bBack)   bBack.addEventListener('click',   function() { try { bFrame.contentWindow.history.back(); } catch(e){} });
      if (bFwd)    bFwd.addEventListener('click',    function() { try { bFrame.contentWindow.history.forward(); } catch(e){} });
      if (bReload) bReload.addEventListener('click', function() { try { bFrame.contentWindow.location.reload(); } catch(e){ bFrame.src = bFrame.src; } });

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
