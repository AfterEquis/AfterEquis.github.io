// --- Authentic CRT Datamosh Glitch Engine (Matching User Reference) ---
var bgCanvas = document.getElementById('bg-canvas');
var bgCtx = bgCanvas ? bgCanvas.getContext('2d') : null;
var bgVideo = document.getElementById('bg-video');
var bgFallback = document.querySelector('.bg-glitch-fallback');
var bgIsPaused = false;
var bgTrackingGlitch = { active: false, intensity: 0, timer: 0, scanlines: [] };
var mouseGlitchSparks = [];

// Autoplay handling with fallback
if (bgVideo) {
  var playPromise = bgVideo.play();
  if (playPromise !== undefined) {
    playPromise.catch(function () {
      if (bgFallback) bgFallback.style.display = 'block';
    });
  }
}

function triggerBackgroundGlitch(intensity) {
  intensity = intensity || 0.8;
  var width = window.innerWidth;
  var height = window.innerHeight;
  var count = Math.floor(3 + intensity * 5);
  var scanlines = [];
  for (var i = 0; i < count; i++) {
    scanlines.push({
      y: Math.random() * height,
      height: 8 + Math.random() * 38 * intensity,
      shift: (Math.random() * 60 - 30) * intensity,
      speed: 1.2 + Math.random() * 3.2,
      color:
        Math.random() > 0.5
          ? 'rgba(255, 0, 85, 0.35)'
          : 'rgba(0, 229, 255, 0.35)',
    });
  }
  bgTrackingGlitch = {
    active: true,
    intensity: intensity,
    timer: 0.28 + intensity * 0.35,
    scanlines: scanlines,
  };
}

function setBackgroundPaused(paused) {
  bgIsPaused = paused;
  if (bgVideo) {
    if (paused) {
      bgVideo.pause();
    } else {
      bgVideo.play();
    }
  }
}

(function initGlitchCanvas() {
  if (!bgCanvas || !bgCtx) return;

  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var width = window.innerWidth;
  var height = window.innerHeight;

  function resizeCanvas() {
    width = window.innerWidth;
    height = window.innerHeight;
    bgCanvas.width = Math.floor(width * dpr);
    bgCanvas.height = Math.floor(height * dpr);
    bgCtx.setTransform(1, 0, 0, 1, 0, 0);
    bgCtx.scale(dpr, dpr);
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas, { passive: true });

  // Mouse interaction: spawn horizontal glitch needles near cursor
  window.addEventListener(
    'mousemove',
    function (e) {
      if (bgIsPaused) return;
      if (Math.random() < 0.35 && mouseGlitchSparks.length < 16) {
        mouseGlitchSparks.push({
          x: e.clientX + (Math.random() * 80 - 40),
          y: e.clientY + (Math.random() * 24 - 12),
          w: 15 + Math.random() * 55,
          h: 1 + Math.random() * 2.5,
          color: Math.random() > 0.5 ? '#00e5ff' : '#ff0055',
          life: 1.0,
        });
      }
    },
    { passive: true }
  );

  // Horizontal scanline needle streaks (persistent drifting lines)
  var NEEDLE_COUNT = width < 780 ? 25 : 45;
  var needles = [];
  var GLITCH_COLORS = [
    '#ffffff',
    '#00e5ff',
    '#ff007f',
    '#00ff66',
    '#ffea00',
    '#2979ff',
  ];
  for (var i = 0; i < NEEDLE_COUNT; i++) {
    needles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      len: 12 + Math.random() * 70,
      h: Math.random() > 0.85 ? 2.5 : 1,
      speed: (Math.random() * 350 + 150) * (Math.random() > 0.5 ? 1 : -1),
      color: GLITCH_COLORS[Math.floor(Math.random() * GLITCH_COLORS.length)],
      alpha: 0.25 + Math.random() * 0.65,
    });
  }

  // Datamosh pixel blocks (bursts of RGB corrupted clusters)
  var glitchBlocks = [];
  var nextBlockTimer = 0;

  var lastTime = performance.now();

  function drawGlitchFrame(now) {
    if (matchMedia('(prefers-reduced-motion:reduce)').matches) {
      bgCtx.clearRect(0, 0, width, height);
      return;
    }

    var dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    bgCtx.clearRect(0, 0, width, height);

    if (!bgIsPaused) {
      // 1. Update and draw horizontal needle streaks (RF analog noise)
      for (var n = 0; n < needles.length; n++) {
        var nd = needles[n];
        nd.x += nd.speed * dt;
        if (nd.x > width + 100) nd.x = -100;
        if (nd.x < -100) nd.x = width + 100;

        // Occasional vertical scanline jitter
        if (Math.random() < 0.04) {
          nd.y = (nd.y + Math.random() * 20 - 10 + height) % height;
        }

        bgCtx.fillStyle = nd.color;
        bgCtx.globalAlpha = nd.alpha * (0.6 + 0.4 * Math.sin(now * 0.01 + n));
        bgCtx.fillRect(nd.x, Math.floor(nd.y), nd.len, nd.h);
      }

      // 2. Datamosh macroblocks (RGB corruption clusters like the user GIF)
      nextBlockTimer -= dt;
      if (nextBlockTimer <= 0) {
        nextBlockTimer = 0.06 + Math.random() * 0.14;
        glitchBlocks = [];
        var clusterCount = Math.floor(1 + Math.random() * 3);
        for (var c = 0; c < clusterCount; c++) {
          var clusterY = Math.random() * height;
          var clusterX = Math.random() * width;
          var blockSize = Math.floor(2 + Math.random() * 4);
          for (var b = 0; b < blockSize; b++) {
            glitchBlocks.push({
              x: clusterX + (Math.random() * 120 - 60),
              y: clusterY + (Math.random() * 30 - 15),
              w: 8 + Math.random() * 45,
              h: 2 + Math.random() * 12,
              color:
                GLITCH_COLORS[
                  Math.floor(Math.random() * GLITCH_COLORS.length)
                ],
              alpha: 0.4 + Math.random() * 0.55,
            });
          }
        }
      }

      for (var gb = 0; gb < glitchBlocks.length; gb++) {
        var blk = glitchBlocks[gb];
        bgCtx.fillStyle = blk.color;
        bgCtx.globalAlpha = blk.alpha;
        bgCtx.fillRect(blk.x, Math.floor(blk.y), blk.w, blk.h);
      }

      // 3. Mouse static sparks
      for (var ms = mouseGlitchSparks.length - 1; ms >= 0; ms--) {
        var spark = mouseGlitchSparks[ms];
        spark.life -= dt * 2.8;
        if (spark.life <= 0) {
          mouseGlitchSparks.splice(ms, 1);
          continue;
        }
        bgCtx.fillStyle = spark.color;
        bgCtx.globalAlpha = spark.life * 0.75;
        bgCtx.fillRect(spark.x, spark.y, spark.w, spark.h);
      }
    }

    // 4. Tracking tear / Horizontal slice displacement
    if (bgTrackingGlitch.active) {
      bgTrackingGlitch.timer -= dt;
      if (bgTrackingGlitch.timer <= 0) {
        bgTrackingGlitch.active = false;
      } else {
        bgCtx.save();
        for (var g = 0; g < bgTrackingGlitch.scanlines.length; g++) {
          var sl = bgTrackingGlitch.scanlines[g];
          sl.y = (sl.y + sl.speed * dt * 450) % height;
          var sy = Math.floor(sl.y);

          bgCtx.fillStyle = sl.color;
          bgCtx.globalAlpha = 0.45;
          bgCtx.fillRect(0, sy, width, sl.height);

          bgCtx.fillStyle = '#ffffff';
          bgCtx.globalAlpha = 0.8;
          for (var dot = 0; dot < 24; dot++) {
            var dotX = Math.random() * width;
            var dotW = 6 + Math.random() * 35;
            bgCtx.fillRect(dotX, sy + Math.random() * sl.height, dotW, 1.5);
          }
        }
        bgCtx.restore();
      }
    }

    // Periodic random mini tracking slice (every 4-7s)
    if (!bgIsPaused && !bgTrackingGlitch.active && Math.random() < 0.004) {
      triggerBackgroundGlitch(0.5);
    }

    // 5. Paused VHS Tape State
    if (bgIsPaused) {
      bgCtx.save();
      var pauseY = height * 0.48 + Math.sin(now * 0.006) * 6;
      bgCtx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      bgCtx.fillRect(0, pauseY - 25, width, 50);

      bgCtx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      for (var p = 0; p < 45; p++) {
        bgCtx.fillRect(
          Math.random() * width,
          pauseY - 20 + Math.random() * 40,
          Math.random() * 55,
          2
        );
      }
      bgCtx.restore();
    }

    requestAnimationFrame(drawGlitchFrame);
  }

  requestAnimationFrame(drawGlitchFrame);
})();
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
  triggerBackgroundGlitch(0.7);
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

// --- Retro Web Audio Synthesizer ---
var sfxEnabled = localStorage.getItem('afterx_sfx') === 'true';
var audioCtx = null;

function getAudioContext() {
  if (!audioCtx && (window.AudioContext || window.webkitAudioContext)) {
    var AudioClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioClass();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playBlip() {
  if (!sfxEnabled) return;
  var ctx = getAudioContext();
  if (!ctx) return;
  var osc = ctx.createOscillator();
  var gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(840, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(420, ctx.currentTime + 0.045);
  gain.gain.setValueAtTime(0.06, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.045);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.045);
}

function playGlitchSfx() {
  if (!sfxEnabled) return;
  var ctx = getAudioContext();
  if (!ctx) return;
  var bufferSize = ctx.sampleRate * 0.12;
  var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  var data = buffer.getChannelData(0);
  for (var i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  var noise = ctx.createBufferSource();
  noise.buffer = buffer;
  var filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 1400;
  var gain = ctx.createGain();
  gain.gain.setValueAtTime(0.09, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  noise.start();
}

function playToggleSfx() {
  if (!sfxEnabled) return;
  var ctx = getAudioContext();
  if (!ctx) return;
  var osc = ctx.createOscillator();
  var gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(480, ctx.currentTime);
  gain.gain.setValueAtTime(0.05, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.035);
}

var tabs = document.querySelectorAll('.tab'),
  ps = document.querySelectorAll('.panel');

function switchTab(targetTab) {
  playBlip();
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
      var starsHtml =
        repo.stargazers_count > 0
          ? '<span class="stat-badge">⭐ ' + repo.stargazers_count + '</span>'
          : '';
      var langPart = lang
        ? '<span class="lang" style="--c:' +
          color +
          '">' +
          escapeHTML(lang) +
          '</span>'
        : '<span></span>';
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
        '<div class="row">' +
        langPart +
        '<div>' +
        starsHtml +
        '</div>' +
        '</div>' +
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

// --- YouTube Multi-Video Loader ---
async function loadYouTubeVideos() {
  var container = document.getElementById('yt-list');
  if (!container) return;

  try {
    var response = await fetch('./videos.json');
    if (!response.ok) return;

    var videos = await response.json();
    if (!Array.isArray(videos) || videos.length === 0) return;

    var latest = videos[0];
    if (!latest || !latest.title || !latest.url) return;

    function formatPubDate(isoStr) {
      if (!isoStr) return '';
      var d = new Date(isoStr);
      return !isNaN(d.getTime())
        ? ' · ' +
            d.toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })
        : '';
    }

    var mainThumb = latest.thumbnail
      ? '<img src="' +
        escapeHTML(latest.thumbnail) +
        '" alt="' +
        escapeHTML(latest.title) +
        '" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;"><span class="play">▶</span>'
      : '<span class="play">▶</span>';

    var mainHtml =
      '<a class="item vid" href="' +
      escapeHTML(latest.url) +
      '" target="_blank" rel="noopener noreferrer">' +
      '<div class="thumb">' +
      mainThumb +
      '</div>' +
      '<div>' +
      '<h3>' +
      escapeHTML(latest.title) +
      '</h3>' +
      '<p>Canal AfterXEsp_' +
      formatPubDate(latest.published) +
      '</p>' +
      '</div></a>';

    var secondaryHtml = '';
    if (videos.length >= 3) {
      var extra = [videos[1], videos[2]];
      secondaryHtml =
        '<div class="yt-mini-grid">' +
        extra
          .map(function (v) {
            return (
              '<a class="yt-mini-card" href="' +
              escapeHTML(v.url) +
              '" target="_blank" rel="noopener noreferrer">' +
              '<div class="thumb" style="aspect-ratio:16/9">' +
              (v.thumbnail
                ? '<img src="' +
                  escapeHTML(v.thumbnail) +
                  '" alt="' +
                  escapeHTML(v.title) +
                  '" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;"><span class="play" style="font-size:18px;padding:0 12px">▶</span>'
                : '<span class="play">▶</span>') +
              '</div>' +
              '<h4>' +
              escapeHTML(v.title) +
              '</h4>' +
              '<p>AfterXEsp_' +
              formatPubDate(v.published) +
              '</p>' +
              '</a>'
            );
          })
          .join('') +
        '</div>';
    }

    container.innerHTML = mainHtml + secondaryHtml;
  } catch (err) {
    console.warn('Could not load latest YouTube videos from videos.json:', err);
  }
}

loadYouTubeVideos();

// --- Interactive VHS Controls ---
var btnPlay = document.getElementById('btn-play');
if (btnPlay) {
  var isPaused = false;
  btnPlay.addEventListener('click', function () {
    isPaused = !isPaused;
    setBackgroundPaused(isPaused);
    document.body.classList.toggle('paused', isPaused);
    btnPlay.textContent = isPaused ? '⏸ PAUSE' : '▶ PLAY';
    btnPlay.classList.toggle('flashing', isPaused);
    playToggleSfx();
  });
}

var btnTracking = document.getElementById('btn-tracking');
if (btnTracking) {
  btnTracking.addEventListener('click', function () {
    tear();
    triggerBackgroundGlitch(1.0);
    playGlitchSfx();
  });
}

var sfxToggle = document.getElementById('sfx-toggle');
if (sfxToggle) {
  function updateSfxButton() {
    sfxToggle.textContent = 'SFX: ' + (sfxEnabled ? 'ON' : 'OFF');
    sfxToggle.classList.toggle('active', sfxEnabled);
  }
  updateSfxButton();
  sfxToggle.addEventListener('click', function () {
    sfxEnabled = !sfxEnabled;
    localStorage.setItem('afterx_sfx', sfxEnabled.toString());
    updateSfxButton();
    if (sfxEnabled) {
      getAudioContext();
      playToggleSfx();
    }
  });
}

// --- Avatar Secret Glitch Cycle (Triple Clic Secreto para Activar) ---
var AVATAR_LIST = [
  { src: './assets/avatar.jpg', alt: 'Smiley AfterX con glitch' },
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
var easterEggUnlocked = false;
var clickStreak = 0;
var clickStreakTimer = null;
var autoRelockTimer = null;

function switchAvatar(targetIndex) {
  if (avatarGlitching || !avatarBox || !avatarImg) return;
  var isReduced = matchMedia('(prefers-reduced-motion:reduce)').matches;

  playGlitchSfx();

  if (isReduced) {
    avatarIndex = targetIndex;
    avatarImg.src = AVATAR_LIST[targetIndex].src;
    avatarImg.alt = AVATAR_LIST[targetIndex].alt;
    return;
  }

  avatarGlitching = true;
  avatarBox.classList.add('glitching');

  setTimeout(function () {
    avatarIndex = targetIndex;
    avatarImg.src = AVATAR_LIST[targetIndex].src;
    avatarImg.alt = AVATAR_LIST[targetIndex].alt;
  }, 200);

  setTimeout(function () {
    avatarBox.classList.remove('glitching');
    avatarGlitching = false;
  }, 440);
}

function handleAvatarActivation() {
  if (avatarGlitching) return;

  if (!easterEggUnlocked) {
    clickStreak++;
    clearTimeout(clickStreakTimer);
    clickStreakTimer = setTimeout(function () {
      clickStreak = 0;
    }, 700);

    // Reacción micro-jitter sutil en cada clic previo
    if (clickStreak < 3) {
      avatarBox.style.transform = 'scale(1.08) rotate(' + (clickStreak % 2 === 0 ? '-3deg' : '3deg') + ')';
      setTimeout(function () {
        avatarBox.style.transform = '';
      }, 140);
    } else {
      // ¡Triple clic alcanzado! Se desbloquea el easter egg y muestra la primera foto
      easterEggUnlocked = true;
      clickStreak = 0;
      switchAvatar(1);
      scheduleAutoRelock();
    }
  } else {
    // Si ya está desbloqueado, avanza a la siguiente foto
    scheduleAutoRelock();
    var nextIdx = (avatarIndex + 1) % AVATAR_LIST.length;
    if (nextIdx === 0) {
      // Al volver al smiley, se re-bloquea
      easterEggUnlocked = false;
      clearTimeout(autoRelockTimer);
    }
    switchAvatar(nextIdx);
  }
}

function scheduleAutoRelock() {
  clearTimeout(autoRelockTimer);
  // Re-bloquea automáticamente si está inactivo 25 segundos en foto personal
  autoRelockTimer = setTimeout(function () {
    if (avatarIndex !== 0) {
      easterEggUnlocked = false;
      switchAvatar(0);
    }
  }, 25000);
}

if (avatarBox) {
  avatarBox.addEventListener('click', handleAvatarActivation);
  avatarBox.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleAvatarActivation();
    }
  });
}


