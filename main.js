var bg = document.getElementById('bg');
var cols = [
  'linear-gradient(90deg, transparent, rgba(47,75,255,.75), transparent)',
  'linear-gradient(90deg, transparent, rgba(255,59,47,.75), transparent)',
  'linear-gradient(90deg, rgba(255,59,47,.85) 0%, rgba(47,75,255,.85) 100%)',
  'linear-gradient(90deg, transparent, rgba(106,61,240,.7), transparent)',
  'linear-gradient(90deg, transparent, rgba(207,230,255,.85), transparent)',
];
for (var k = 0, n = innerWidth < 780 ? 22 : 44; k < n; k++) {
  var i = document.createElement('i');
  var isNeedle = k % 3 === 0;
  var height = isNeedle ? 1 + Math.random() * 3 : 4 + Math.random() * 22;
  var width = isNeedle ? 25 + Math.random() * 55 : 16 + Math.random() * 30;
  i.style.cssText =
    'top:' +
    Math.random() * 100 +
    '%;left:' +
    (k % 2 ? Math.random() * 25 - 10 : 58 + Math.random() * 36) +
    '%;width:' +
    width +
    '%;height:' +
    height +
    'px;background:' +
    cols[k % cols.length] +
    ';opacity:' +
    (0.3 + Math.random() * 0.55) +
    ';--x:' +
    ((Math.random() * 90 - 45) | 0) +
    'px;--d:' +
    (1.6 + Math.random() * 4.5).toFixed(1) +
    's';
  bg.appendChild(i);
}
function updateLens() {
  var card = document.querySelector('.card');
  if (!card) return;
  if (
    innerWidth > 780 &&
    window.CSS &&
    CSS.supports('backdrop-filter', 'url(#lens) blur(1px)')
  ) {
    card.classList.add('lens');
  } else {
    card.classList.remove('lens');
  }
}
updateLens();
window.addEventListener('resize', updateLens);

function tear() {
  if (matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  var d = document.getElementById('td'),
    t = document.getElementById('tt'),
    t0 = performance.now(),
    D = 380,
    b = document.body;
  b.classList.add('tearing', 'burst');
  setTimeout(function () {
    b.classList.remove('burst');
  }, 320);
  (function f(now) {
    var k = (now - t0) / D;
    if (k >= 1) {
      d.setAttribute('scale', 0);
      b.classList.remove('tearing');
      return;
    }
    d.setAttribute('scale', Math.sin(k * Math.PI) * 55);
    t.setAttribute('seed', Math.floor(Math.random() * 60));
    requestAnimationFrame(f);
  })(t0);
}

var tabs = document.querySelectorAll('.tab'),
  ps = document.querySelectorAll('.panel');

function switchTab(targetTab) {
  var isReduced = matchMedia('(prefers-reduced-motion:reduce)').matches;
  if (!isReduced) {
    tear();
    document.body.classList.add('zap');
    setTimeout(function () {
      document.body.classList.remove('zap');
    }, 280);
  }
  tabs.forEach(function (x) {
    var isSelected = x === targetTab;
    x.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    x.setAttribute('tabindex', isSelected ? '0' : '-1');
  });
  ps.forEach(function (p) {
    p.classList.toggle('on', p.id === 'p' + targetTab.dataset.ch);
  });
}

tabs.forEach(function (b) {
  b.addEventListener('click', function () {
    switchTab(b);
  });
});

var tabsContainer = document.querySelector('.tabs');
if (tabsContainer) {
  tabsContainer.addEventListener('keydown', function (e) {
    var i = [].indexOf.call(tabs, document.activeElement);
    if (i < 0) return;
    var nextIndex = -1;
    if (e.key === 'ArrowRight') {
      nextIndex = (i + 1) % tabs.length;
    } else if (e.key === 'ArrowLeft') {
      nextIndex = (i - 1 + tabs.length) % tabs.length;
    } else if (e.key === 'Home') {
      nextIndex = 0;
    } else if (e.key === 'End') {
      nextIndex = tabs.length - 1;
    }
    if (nextIndex >= 0) {
      e.preventDefault();
      var n = tabs[nextIndex];
      n.focus();
      switchTab(n);
    }
  });
}

document.getElementById('d').textContent =
  'SP  ' +
  new Date()
    .toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    })
    .toUpperCase()
    .replace(',', '');

function burst() {
  if (matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  document.body.classList.add('burst');
  setTimeout(function () {
    document.body.classList.remove('burst');
  }, 320);
  setTimeout(burst, 6000 + Math.random() * 7000);
}
if (!matchMedia('(prefers-reduced-motion:reduce)').matches) {
  setTimeout(burst, 3500);
}
var s = 0,
  el = document.getElementById('t');
setInterval(function () {
  s++;
  var h = Math.floor(s / 3600),
    m = Math.floor((s % 3600) / 60),
    c = s % 60;
  el.textContent =
    'TIME ' + h + ':' + (m < 10 ? '0' : '') + m + ':' + (c < 10 ? '0' : '') + c;
}, 1000);

// --- GitHub Repositories (Canal Proyectos) ---
const GITHUB_USERNAME = 'AfterEquis';
const GITHUB_API_URL = `https://api.github.com/users/${GITHUB_USERNAME}/repos`;
const GITHUB_CACHE_KEY = 'afterx_github_repos';
const GITHUB_CACHE_TIME_KEY = 'afterx_github_repos_time';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hora

const LANG_COLORS = {
  Python: '#3572A5',
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Shell: '#89e051',
  C: '#555555',
  'C++': '#f34b7d',
  Rust: '#dea584',
  Go: '#00ADD8',
  Java: '#b07219',
  Kotlin: '#A97BFF',
  Lua: '#000080',
};

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, function (tag) {
    return (
      {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;',
      }[tag] || tag
    );
  });
}

function renderRepos(repos, container) {
  if (!repos || repos.length === 0) {
    container.innerHTML =
      '<div class="item"><p>No hay repositorios públicos disponibles.</p></div>';
    return;
  }
  container.innerHTML = repos
    .map(function (repo) {
      var lang = repo.language;
      var color = lang && LANG_COLORS[lang] ? LANG_COLORS[lang] : '#58a6ff';
      var langHtml = lang
        ? '<div class="row"><span class="lang" style="--c:' +
          color +
          '">' +
          escapeHTML(lang) +
          '</span></div>'
        : '';
      var desc = repo.description
        ? escapeHTML(repo.description)
        : 'Sin descripción disponible.';
      return (
        '<a class="item" href="' +
        escapeHTML(repo.html_url) +
        '" target="_blank" rel="noopener noreferrer">' +
        '<h3>' +
        escapeHTML(repo.name) +
        '</h3>' +
        '<p>' +
        desc +
        '</p>' +
        langHtml +
        '</a>'
      );
    })
    .join('');
}

function renderError(container, message) {
  container.innerHTML =
    '<div class="item"><p>' + escapeHTML(message) + '</p></div>';
}

async function loadGitHubRepos() {
  var container = document.getElementById('gh-repos');
  if (!container) return;

  var cachedData = localStorage.getItem(GITHUB_CACHE_KEY);
  var cachedTime = localStorage.getItem(GITHUB_CACHE_TIME_KEY);
  var now = Date.now();

  var hasValidCache = false;
  if (cachedData && cachedTime) {
    try {
      var parsed = JSON.parse(cachedData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        renderRepos(parsed, container);
        if (now - Number(cachedTime) < CACHE_TTL_MS) {
          hasValidCache = true;
          return;
        }
      }
    } catch (e) {
      localStorage.removeItem(GITHUB_CACHE_KEY);
      localStorage.removeItem(GITHUB_CACHE_TIME_KEY);
    }
  }

  try {
    var response = await fetch(GITHUB_API_URL, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      if (hasValidCache) return;
      if (response.status === 403 || response.status === 429) {
        renderError(
          container,
          'Límite de peticiones de GitHub alcanzado temporalmente. Puedes ver mis repositorios directamente en GitHub.',
        );
      } else {
        renderError(
          container,
          'No se pudieron cargar los repositorios de GitHub en este momento.',
        );
      }
      return;
    }

    var data = await response.json();
    if (!Array.isArray(data)) {
      if (!hasValidCache) {
        renderError(container, 'Respuesta inesperada al obtener los repositorios.');
      }
      return;
    }

    var filteredRepos = data
      .filter(function (repo) {
        return !repo.fork;
      })
      .sort(function (a, b) {
        var dateA = new Date(a.pushed_at || a.updated_at || 0).getTime();
        var dateB = new Date(b.pushed_at || b.updated_at || 0).getTime();
        return dateB - dateA;
      });

    try {
      localStorage.setItem(GITHUB_CACHE_KEY, JSON.stringify(filteredRepos));
      localStorage.setItem(GITHUB_CACHE_TIME_KEY, now.toString());
    } catch (storageErr) {}

    renderRepos(filteredRepos, container);
  } catch (err) {
    console.error('Error fetching GitHub repos:', err);
    if (!hasValidCache) {
      renderError(
        container,
        'No se pudo conectar con la API de GitHub en este momento.',
      );
    }
  }
}

loadGitHubRepos();

// --- YouTube Latest Video Loader ---
async function loadYouTubeVideo() {
  var container = document.getElementById('yt-video');
  if (!container) return;

  try {
    var response = await fetch('./videos.json');
    if (!response.ok) return;

    var videos = await response.json();
    if (!Array.isArray(videos) || videos.length === 0) return;

    var latest = videos[0];
    if (!latest || !latest.title || !latest.url) return;

    var dateStr = '';
    if (latest.published) {
      var d = new Date(latest.published);
      if (!isNaN(d.getTime())) {
        dateStr =
          ' · ' +
          d.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          });
      }
    }

    container.href = escapeHTML(latest.url);
    var thumbHtml = latest.thumbnail
      ? '<img src="' +
        escapeHTML(latest.thumbnail) +
        '" alt="' +
        escapeHTML(latest.title) +
        '" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;"><span class="play">▶</span>'
      : '<span class="play">▶</span>';

    container.innerHTML =
      '<div class="thumb">' +
      thumbHtml +
      '</div>' +
      '<div>' +
      '<h3>' +
      escapeHTML(latest.title) +
      '</h3>' +
      '<p>Canal AfterXEsp_' +
      dateStr +
      '</p>' +
      '</div>';
  } catch (err) {
    console.warn('Could not load latest YouTube video from videos.json:', err);
  }
}

loadYouTubeVideo();

// --- Avatar Glitch Slideshow ---
var AVATAR_LIST = [
  { src: './assets/avatar.jpg', alt: 'Logo de AfterX: cara sonriente con glitch' },
  { src: './assets/avatar-1.jpg', alt: 'Foto de AfterX con casco Mandalorian' },
  { src: './assets/avatar-2.jpg', alt: 'Foto de AfterX con gafas y sudadera' },
  { src: './assets/avatar-3.jpg', alt: 'Foto de AfterX con pasamontañas Nothing' },
  { src: './assets/avatar-4.jpg', alt: 'Foto de AfterX selfie' },
  { src: './assets/avatar-5.jpg', alt: 'Foto de AfterX en el espejo' },
];

AVATAR_LIST.forEach(function (item) {
  var img = new Image();
  img.src = item.src;
});

var avatarBox = document.getElementById('avatar-box');
var avatarImg = document.getElementById('avatar-img');
var avatarIndex = 0;
var avatarGlitching = false;
var avatarTimer = null;
var AVATAR_CYCLE_MS = 5000;

function switchAvatar(targetIndex) {
  if (avatarGlitching || !avatarBox || !avatarImg) return;
  var isReduced = matchMedia('(prefers-reduced-motion:reduce)').matches;

  if (isReduced) {
    avatarIndex = targetIndex;
    avatarImg.src = AVATAR_LIST[targetIndex].src;
    avatarImg.alt = AVATAR_LIST[targetIndex].alt;
    avatarBox.setAttribute('data-photo', targetIndex.toString());
    return;
  }

  avatarGlitching = true;
  avatarBox.classList.add('glitching');

  setTimeout(function () {
    avatarIndex = targetIndex;
    avatarImg.src = AVATAR_LIST[targetIndex].src;
    avatarImg.alt = AVATAR_LIST[targetIndex].alt;
    avatarBox.setAttribute('data-photo', targetIndex.toString());
  }, 200);

  setTimeout(function () {
    avatarBox.classList.remove('glitching');
    avatarGlitching = false;
  }, 440);
}

function nextAvatar() {
  var nextIdx = (avatarIndex + 1) % AVATAR_LIST.length;
  switchAvatar(nextIdx);
}

function startAvatarTimer() {
  stopAvatarTimer();
  avatarTimer = setInterval(nextAvatar, AVATAR_CYCLE_MS);
}

function stopAvatarTimer() {
  if (avatarTimer) {
    clearInterval(avatarTimer);
    avatarTimer = null;
  }
}

if (avatarBox) {
  startAvatarTimer();

  avatarBox.addEventListener('click', function () {
    nextAvatar();
    startAvatarTimer();
  });

  avatarBox.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      nextAvatar();
      startAvatarTimer();
    }
  });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      stopAvatarTimer();
    } else {
      startAvatarTimer();
    }
  });
}

