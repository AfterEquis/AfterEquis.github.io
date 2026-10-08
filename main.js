import glitchGifUrl from './assets/glitch-bg.gif';

// Clickjacking / Framing Protection (permits same-origin & local dev)
try {
  if (window.self !== window.top && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    if (window.top.location.origin !== window.self.location.origin) {
      document.documentElement.style.display = 'none';
    }
  }
} catch (e) {
  document.documentElement.style.display = 'none';
}

// --- Authentic CRT Datamosh Glitch Engine (Matching User Reference) ---
var bgCanvas = document.getElementById('bg-canvas');
var bgCtx = bgCanvas ? bgCanvas.getContext('2d') : null;
var bgVideo = document.getElementById('bg-video');
var bgFallback = document.querySelector('.bg-glitch-fallback');
var bgIsPaused = false;
var bgTrackingGlitch = { active: false, intensity: 0, timer: 0, scanlines: [] };
var mouseGlitchSparks = [];
var safeStorage = {
  getItem: function (key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  },
  setItem: function (key, val) {
    try {
      localStorage.setItem(key, val);
    } catch (e) {}
  },
  removeItem: function (key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {}
  },
};
var urlParams = new URLSearchParams(window.location.search);
var queryTheme = urlParams.get('theme');
var currentTheme =
  queryTheme === 'marathon' || queryTheme === 'vhs'
    ? queryTheme
    : safeStorage.getItem('afterx_theme') || 'vhs';
var refreshGlitchPalette = null;

var GLITCH_COLORS_VHS = [
  '#ffffff',
  '#00e5ff',
  '#ff007f',
  '#00ff66',
  '#ffea00',
  '#2979ff',
];
var GLITCH_COLORS_MARATHON = [
  '#dfff00',
  '#ff3b00',
  '#00f0ff',
  '#ffffff',
  '#ffe600',
];

// Autoplay handling with fallback (only load the 2.3MB GIF if video fails to play)
function showFallbackGif() {
  if (bgFallback) {
    if (!bgFallback.src) {
      bgFallback.src = glitchGifUrl;
    }
    bgFallback.style.display = 'block';
  }
}
if (bgVideo) {
  var playPromise = bgVideo.play();
  if (playPromise !== undefined) {
    playPromise.catch(showFallbackGif);
  }
  bgVideo.addEventListener('error', showFallbackGif);
}

function triggerBackgroundGlitch(intensity) {
  intensity = intensity || 0.8;
  var width = window.innerWidth;
  var height = window.innerHeight;
  var count = Math.floor(3 + intensity * 5);
  var scanlines = [];
  var isMarathon = currentTheme === 'marathon';
  for (var i = 0; i < count; i++) {
    scanlines.push({
      y: Math.random() * height,
      height: 8 + Math.random() * 38 * intensity,
      shift: (Math.random() * 60 - 30) * intensity,
      speed: 1.2 + Math.random() * 3.2,
      color:
        Math.random() > 0.5
          ? (isMarathon ? 'rgba(223, 255, 0, 0.45)' : 'rgba(255, 0, 85, 0.35)')
          : (isMarathon ? 'rgba(255, 59, 0, 0.45)' : 'rgba(0, 229, 255, 0.35)'),
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
    } else if (currentTheme !== 'marathon') {
      bgVideo.play();
    }
  }
}

(function initGlitchCanvas() {
  if (!bgCanvas || !bgCtx) return;

  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var width = window.innerWidth;
  var height = window.innerHeight;

  // --- Offscreen Sprite Atlas for Tactical Glyphs (Hardware-Accelerated Blitting) ---
  var S = 32;
  function createGlyphAtlas() {
    var atlas = document.createElement('canvas');
    var glyphCount = 12;
    var colorCount = 4; // 0: Volt Yellow, 1: Black, 2: Safety Orange, 3: Electric Cyan
    atlas.width = S * glyphCount;
    atlas.height = S * colorCount;
    var aCtx = atlas.getContext('2d');
    var colors = ['#dfff00', '#05070a', '#ff3b00', '#00f0ff'];

    for (var c = 0; c < colors.length; c++) {
      var col = colors[c];
      var y0 = c * S;

      for (var g = 0; g < glyphCount; g++) {
        var x0 = g * S;
        var cx = x0 + S / 2;
        var cy = y0 + S / 2;

        aCtx.strokeStyle = col;
        aCtx.fillStyle = col;
        aCtx.lineWidth = 2;
        aCtx.lineCap = 'square';

        switch (g) {
          case 0: // Empty
            break;
          case 1: // Dot ·
            aCtx.beginPath();
            aCtx.arc(cx, cy, 2.5, 0, Math.PI * 2);
            aCtx.fill();
            break;
          case 2: // Cross ✕
            aCtx.beginPath();
            aCtx.moveTo(cx - 6, cy - 6); aCtx.lineTo(cx + 6, cy + 6);
            aCtx.moveTo(cx + 6, cy - 6); aCtx.lineTo(cx - 6, cy + 6);
            aCtx.stroke();
            break;
          case 3: // Circle ○
            aCtx.beginPath();
            aCtx.arc(cx, cy, 6, 0, Math.PI * 2);
            aCtx.stroke();
            break;
          case 4: // Bullseye ◎
            aCtx.beginPath();
            aCtx.arc(cx, cy, 7, 0, Math.PI * 2);
            aCtx.stroke();
            aCtx.beginPath();
            aCtx.arc(cx, cy, 2.5, 0, Math.PI * 2);
            aCtx.fill();
            break;
          case 5: // Square □
            aCtx.strokeRect(cx - 6, cy - 6, 12, 12);
            break;
          case 6: // Plus +
            aCtx.beginPath();
            aCtx.moveTo(cx - 6, cy); aCtx.lineTo(cx + 6, cy);
            aCtx.moveTo(cx, cy - 6); aCtx.lineTo(cx, cy + 6);
            aCtx.stroke();
            break;
          case 7: // Slash /
            aCtx.beginPath();
            aCtx.moveTo(cx - 5, cy + 6); aCtx.lineTo(cx + 5, cy - 6);
            aCtx.stroke();
            break;
          case 8: // Backslash \
            aCtx.beginPath();
            aCtx.moveTo(cx - 5, cy - 6); aCtx.lineTo(cx + 5, cy + 6);
            aCtx.stroke();
            break;
          case 9: // Quad dots ::
            aCtx.fillRect(cx - 5, cy - 5, 2.5, 2.5);
            aCtx.fillRect(cx + 2.5, cy - 5, 2.5, 2.5);
            aCtx.fillRect(cx - 5, cy + 2.5, 2.5, 2.5);
            aCtx.fillRect(cx + 2.5, cy + 2.5, 2.5, 2.5);
            break;
          case 10: // Target reticle ⌖
            aCtx.beginPath();
            aCtx.arc(cx, cy, 5, 0, Math.PI * 2);
            aCtx.stroke();
            aCtx.beginPath();
            aCtx.moveTo(cx - 8, cy); aCtx.lineTo(cx - 5, cy);
            aCtx.moveTo(cx + 5, cy); aCtx.lineTo(cx + 8, cy);
            aCtx.moveTo(cx, cy - 8); aCtx.lineTo(cx, cy - 5);
            aCtx.moveTo(cx, cy + 5); aCtx.lineTo(cx, cy + 8);
            aCtx.stroke();
            break;
          case 11: // Solid block ■
            aCtx.fillRect(cx - 5, cy - 5, 10, 10);
            break;
        }
      }
    }
    return atlas;
  }
  var marathonGlyphAtlas = createGlyphAtlas();

  // --- Marathon Procedural Geometry (Image 1 Monoliths & Cutouts) ---
  var MONOLITHS = [
    // Top-Right Stepped Monolith (Image 1)
    { x1: 0.68, y1: 0.0, x2: 1.0, y2: 0.44 },
    { x1: 0.78, y1: 0.44, x2: 1.0, y2: 0.58 },
    { x1: 0.88, y1: 0.58, x2: 1.0, y2: 0.72 },
    // Lower-Left Monolith (Image 1)
    { x1: 0.0, y1: 0.54, x2: 0.24, y2: 0.68 },
    { x1: 0.0, y1: 0.0, x2: 0.07, y2: 0.30 },
    // Bottom-Center-Right Monolith (Image 1)
    { x1: 0.46, y1: 0.88, x2: 0.64, y2: 1.0 },
    // Mid-Right Column Block
    { x1: 0.54, y1: 0.22, x2: 0.64, y2: 0.52 },
  ];

  var MONOLITH_CUTOUTS = [
    // Inverted Black Cutout in Top-Right
    { x1: 0.74, y1: 0.18, x2: 0.86, y2: 0.40 },
    // Inverted Notch in Lower-Left
    { x1: 0.05, y1: 0.58, x2: 0.14, y2: 0.65 },
  ];

  function isInsideBoxes(xn, yn, boxes) {
    for (var i = 0; i < boxes.length; i++) {
      var b = boxes[i];
      if (xn >= b.x1 && xn <= b.x2 && yn >= b.y1 && yn <= b.y2) return true;
    }
    return false;
  }

  // Barcode telemetry bars
  var barcodeBars = [];
  function initBarcodeBars() {
    barcodeBars = [];
    var bx = 0;
    var widths = [1.5, 2, 3.5, 1.5, 5, 2, 1.5, 3, 2, 4, 1.5, 2.5, 1.5, 3, 2, 1.5, 4.5, 2, 3, 1.5, 2, 4, 1.5];
    for (var b = 0; b < widths.length; b++) {
      var w = widths[b];
      barcodeBars.push({ x: bx, w: w });
      bx += w + (b % 3 === 0 ? 3.5 : 2);
    }
  }
  initBarcodeBars();

  // Marathon Matrix Grid
  var M_CELL = 24;
  var mCols = 0, mRows = 0;
  var mGrid = [];

  function initMarathonGrid() {
    mCols = Math.ceil(width / M_CELL);
    mRows = Math.ceil(height / M_CELL);
    mGrid = [];

    for (var r = 0; r < mRows; r++) {
      for (var c = 0; c < mCols; c++) {
        var xn = (c * M_CELL) / width;
        var yn = (r * M_CELL) / height;

        var inCutout = isInsideBoxes(xn, yn, MONOLITH_CUTOUTS);
        var inMonolith = !inCutout && isInsideBoxes(xn, yn, MONOLITHS);

        var glyph = 0;
        var colorRow = 0; // 0: Volt, 1: Black, 2: Orange, 3: Cyan
        var alpha = 0.75;

        if (inMonolith) {
          // Inside solid yellow monolith: black glyphs on yellow
          if (Math.random() < 0.38) {
            glyph = Math.floor(1 + Math.random() * 9);
            colorRow = 1; // Black
            alpha = 0.9;
          } else {
            glyph = 0;
          }
        } else {
          // In dark field: Image 1 cluster patterns & runner stripes
          if (c % 14 === 2) {
            glyph = r % 2 === 0 ? 4 : 2; // ◎ and ✕
            alpha = 0.85;
          } else if (c % 14 === 3) {
            glyph = r % 2 === 0 ? 5 : 3; // □ and ○
            alpha = 0.8;
          } else if (c % 14 === 8) {
            glyph = 6; // +
            alpha = 0.7;
          } else {
            var cluster =
              Math.sin(c * 0.28) * Math.cos(r * 0.22) +
              Math.sin((c + r) * 0.16);

            if (cluster > 0.55) {
              var gPool = [2, 3, 4, 5, 10];
              glyph = gPool[Math.floor(Math.random() * gPool.length)];
              alpha = 0.65 + Math.random() * 0.3;
            } else if (cluster > 0.0) {
              var gPool2 = [6, 7, 8, 9];
              glyph = gPool2[Math.floor(Math.random() * gPool2.length)];
              alpha = 0.5 + Math.random() * 0.3;
            } else if (cluster > -0.65) {
              glyph = 1; // Dot ·
              alpha = 0.22 + Math.random() * 0.28;
            } else {
              glyph = 0; // Negative space
            }
          }

          var colRand = Math.random();
          if (colRand < 0.82) {
            colorRow = 0; // Volt Yellow
          } else if (colRand < 0.92) {
            colorRow = 2; // Safety Orange
          } else {
            colorRow = 3; // Electric Cyan
          }
        }

        mGrid.push({
          c: c,
          r: r,
          isSolid: inMonolith,
          glyph: glyph,
          baseGlyph: glyph,
          colorRow: colorRow,
          baseAlpha: alpha,
          flickerTimer: Math.random() * 5,
        });
      }
    }
  }

  // Mouse interaction state
  var marathonMouseX = -999, marathonMouseY = -999;
  var marathonMouseActive = false;
  var mouseInactiveTimer = null;

  function handlePointer(clientX, clientY) {
    marathonMouseX = clientX;
    marathonMouseY = clientY;
    marathonMouseActive = true;
    clearTimeout(mouseInactiveTimer);
    mouseInactiveTimer = setTimeout(function () {
      marathonMouseActive = false;
    }, 3500);

    if (bgIsPaused) return;
    if (Math.random() < 0.35 && mouseGlitchSparks.length < 16) {
      mouseGlitchSparks.push({
        x: clientX + (Math.random() * 80 - 40),
        y: clientY + (Math.random() * 24 - 12),
        w: 15 + Math.random() * 55,
        h: 1 + Math.random() * 2.5,
        color:
          currentTheme === 'marathon'
            ? (Math.random() > 0.5 ? '#dfff00' : '#ff3b00')
            : (Math.random() > 0.5 ? '#00e5ff' : '#ff0055'),
        life: 1.0,
      });
    }
  }

  window.addEventListener(
    'mousemove',
    function (e) {
      handlePointer(e.clientX, e.clientY);
    },
    { passive: true }
  );

  window.addEventListener(
    'touchmove',
    function (e) {
      if (e.touches && e.touches[0]) {
        handlePointer(e.touches[0].clientX, e.touches[0].clientY);
      }
    },
    { passive: true }
  );

  function resizeCanvas() {
    width = window.innerWidth;
    height = window.innerHeight;
    dpr = width < 768 ? Math.min(window.devicePixelRatio || 1, 1.5) : Math.min(window.devicePixelRatio || 1, 2);
    bgCanvas.width = Math.floor(width * dpr);
    bgCanvas.height = Math.floor(height * dpr);
    bgCtx.setTransform(1, 0, 0, 1, 0, 0);
    bgCtx.scale(dpr, dpr);
    NEEDLE_COUNT = width < 780 ? 20 : 45;
    initNeedles();
    initMarathonGrid();
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas, { passive: true });

  function getGlitchPalette() {
    return currentTheme === 'marathon' ? GLITCH_COLORS_MARATHON : GLITCH_COLORS_VHS;
  }

  // --- VHS Needle Streaks & Datamosh ---
  var NEEDLE_COUNT = width < 780 ? 25 : 45;
  var needles = [];
  function initNeedles() {
    needles = [];
    var pal = getGlitchPalette();
    for (var i = 0; i < NEEDLE_COUNT; i++) {
      needles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        len: 12 + Math.random() * 70,
        h: Math.random() > 0.85 ? 2.5 : 1,
        speed: (Math.random() * 350 + 150) * (Math.random() > 0.5 ? 1 : -1),
        color: pal[Math.floor(Math.random() * pal.length)],
        alpha: 0.25 + Math.random() * 0.65,
      });
    }
  }
  initNeedles();
  refreshGlitchPalette = function () {
    initNeedles();
    initMarathonGrid();
  };

  var glitchBlocks = [];
  var nextBlockTimer = 0;
  var marathonScanY = 0;
  var marathonDatamoshTimer = 0;
  var marathonDatamosh = { active: false, y: 0, h: 0, shift: 0, timer: 0 };

  // --- Theme 1 Frame Renderer: Original VHS CRT Datamosh ---
  function drawVhsFrame(now, dt) {
    bgCtx.clearRect(0, 0, width, height);

    if (!bgIsPaused) {
      // 1. Horizontal needle streaks (RF analog noise)
      for (var n = 0; n < needles.length; n++) {
        var nd = needles[n];
        nd.x += nd.speed * dt;
        if (nd.x > width + 100) nd.x = -100;
        if (nd.x < -100) nd.x = width + 100;

        if (Math.random() < 0.04) {
          nd.y = (nd.y + Math.random() * 20 - 10 + height) % height;
        }

        bgCtx.fillStyle = nd.color;
        bgCtx.globalAlpha = nd.alpha * (0.6 + 0.4 * Math.sin(now * 0.01 + n));
        bgCtx.fillRect(nd.x, Math.floor(nd.y), nd.len, nd.h);
      }

      // 2. Datamosh macroblocks
      nextBlockTimer -= dt;
      if (nextBlockTimer <= 0) {
        nextBlockTimer = 0.06 + Math.random() * 0.14;
        glitchBlocks = [];
        var clusterCount = Math.floor(1 + Math.random() * 3);
        var pal = getGlitchPalette();
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
              color: pal[Math.floor(Math.random() * pal.length)],
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

    // 4. Paused VHS Tape State
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
  }

  // --- Theme 2 Frame Renderer: Marathon Tactical Glyphs & Telemetry Matrix ---
  function drawMarathonFrame(now, dt) {
    // 1. Clear to void black
    bgCtx.fillStyle = '#05070a';
    bgCtx.fillRect(0, 0, width, height);

    // 2. Solid Volt Monoliths (Image 1)
    bgCtx.fillStyle = '#dfff00';
    for (var m = 0; m < MONOLITHS.length; m++) {
      var mono = MONOLITHS[m];
      bgCtx.fillRect(
        mono.x1 * width,
        mono.y1 * height,
        (mono.x2 - mono.x1) * width,
        (mono.y2 - mono.y1) * height
      );
    }

    // 3. Inverted Black Cutout Windows (Image 1)
    bgCtx.fillStyle = '#05070a';
    for (var k = 0; k < MONOLITH_CUTOUTS.length; k++) {
      var cut = MONOLITH_CUTOUTS[k];
      bgCtx.fillRect(
        cut.x1 * width,
        cut.y1 * height,
        (cut.x2 - cut.x1) * width,
        (cut.y2 - cut.y1) * height
      );
    }

    // 4. Update and Draw Scanline Laser Sweep (Image 2)
    marathonScanY = (marathonScanY + dt * 115) % (height + 250);
    var currentLaserY = marathonScanY - 100;
    if (currentLaserY >= 0 && currentLaserY <= height) {
      bgCtx.save();
      bgCtx.fillStyle = 'rgba(223, 255, 0, 0.4)';
      bgCtx.fillRect(0, currentLaserY, width, 1.5);
      var grad = bgCtx.createLinearGradient(0, currentLaserY - 35, 0, currentLaserY);
      grad.addColorStop(0, 'rgba(223, 255, 0, 0)');
      grad.addColorStop(1, 'rgba(223, 255, 0, 0.1)');
      bgCtx.fillStyle = grad;
      bgCtx.fillRect(0, currentLaserY - 35, width, 35);
      bgCtx.restore();
    }

    // 5. Draw Tactical Glyphs via Cached Sprite Atlas
    for (var i = 0; i < mGrid.length; i++) {
      var cell = mGrid[i];
      if (cell.glyph === 0) continue;

      var cx = cell.c * M_CELL;
      var cy = cell.r * M_CELL;

      var laserDist = Math.abs(cy - currentLaserY);
      var isLaserNear = laserDist < 50;

      var isMouseNear = false;
      if (marathonMouseActive) {
        var mdx = cx + M_CELL / 2 - marathonMouseX;
        var mdy = cy + M_CELL / 2 - marathonMouseY;
        isMouseNear = (mdx * mdx + mdy * mdy) < (130 * 130);
      }

      var curAlpha = cell.baseAlpha;
      var curColor = cell.colorRow;

      if (isLaserNear && !cell.isSolid) {
        curAlpha = Math.min(1.0, curAlpha + (1 - laserDist / 50) * 0.45);
      }
      if (isMouseNear && !cell.isSolid) {
        curAlpha = 1.0;
        if (Math.random() < 0.25) curColor = 3; // Shift to electric cyan
      }

      cell.flickerTimer -= dt;
      if (cell.flickerTimer <= 0) {
        cell.flickerTimer = 2.5 + Math.random() * 5.0;
        if (!cell.isSolid && cell.baseGlyph > 1 && Math.random() < 0.4) {
          cell.glyph = Math.floor(2 + Math.random() * 9);
        } else {
          cell.glyph = cell.baseGlyph;
        }
      }

      bgCtx.globalAlpha = curAlpha;
      bgCtx.drawImage(
        marathonGlyphAtlas,
        cell.glyph * S,
        curColor * S,
        S,
        S,
        cx,
        cy,
        M_CELL,
        M_CELL
      );
    }
    bgCtx.globalAlpha = 1.0;

    // 6. Draw Telemetry HUD Badges (Image 2)
    drawMarathonTelemetry(now);

    // 7. Periodic Datamosh Horizontal Displacement Slices (Image 2)
    marathonDatamoshTimer -= dt;
    if (marathonDatamoshTimer <= 0) {
      marathonDatamoshTimer = 3.6 + Math.random() * 3.0;
      marathonDatamosh = {
        active: true,
        y: Math.random() * (height - 80),
        h: 25 + Math.random() * 45,
        shift: (Math.random() * 24 + 14) * (Math.random() > 0.5 ? 1 : -1),
        timer: 0.12,
      };
    }

    if (marathonDatamosh.active) {
      marathonDatamosh.timer -= dt;
      if (marathonDatamosh.timer <= 0) {
        marathonDatamosh.active = false;
      } else {
        bgCtx.save();
        var sy = marathonDatamosh.y;
        var sh = marathonDatamosh.h;
        var shift = marathonDatamosh.shift;

        bgCtx.drawImage(
          bgCanvas,
          0,
          Math.floor(sy * dpr),
          Math.floor(width * dpr),
          Math.floor(sh * dpr),
          shift,
          sy,
          width,
          sh
        );

        bgCtx.fillStyle = '#ff3b00';
        bgCtx.globalAlpha = 0.45;
        bgCtx.fillRect(0, sy, width, 2);
        bgCtx.fillStyle = '#00f0ff';
        bgCtx.fillRect(0, sy + sh - 2, width, 2);
        bgCtx.restore();
      }
    }

    // 8. Interactive Mouse Tactical Crosshair
    if (marathonMouseActive && marathonMouseX > 0 && marathonMouseY > 0) {
      drawMouseReticle();
    }
  }

  function drawMarathonTelemetry(now) {
    bgCtx.save();
    var bx = Math.max(20, Math.floor(width * 0.035));
    var by = Math.max(28, Math.floor(height * 0.08));

    if (width > 680) {
      // Vertical Barcode Panel
      bgCtx.fillStyle = 'rgba(5, 7, 10, 0.76)';
      bgCtx.strokeStyle = 'rgba(223, 255, 0, 0.45)';
      bgCtx.lineWidth = 1;
      bgCtx.fillRect(bx, by, 180, 116);
      bgCtx.strokeRect(bx, by, 180, 116);

      bgCtx.font = '13px VT323, monospace';
      bgCtx.fillStyle = '#dfff00';
      bgCtx.fillText('// RUNNER TELEMETRY', bx + 10, by + 18);

      for (var b = 0; b < barcodeBars.length; b++) {
        var bar = barcodeBars[b];
        if (bar.x + bar.w > 160) break;
        bgCtx.fillRect(bx + 10 + bar.x, by + 26, bar.w, 36);
      }

      bgCtx.fillStyle = '#f1f3fb';
      bgCtx.font = '11px VT323, monospace';
      bgCtx.fillText('2999.1/156  ·  A1.2 // SEC.VAL', bx + 10, by + 78);
      bgCtx.fillStyle = '#00f0ff';
      bgCtx.fillText('BUFFER: 180Hz  STATUS: ARSENAL', bx + 10, by + 94);
      bgCtx.fillStyle = '#ff3b00';
      bgCtx.fillText('EXTR: 99.4%   DESPLEGADO', bx + 10, by + 108);

      // Large 99 Badge from Image 2
      if (width > 980) {
        var rx = width - 140;
        var ry = by + 20;

        bgCtx.strokeStyle = '#dfff00';
        bgCtx.lineWidth = 1.5;
        bgCtx.strokeRect(rx, ry, 34, 34);
        bgCtx.beginPath();
        bgCtx.moveTo(rx + 6, ry + 28); bgCtx.lineTo(rx + 28, ry + 6);
        bgCtx.moveTo(rx + 12, ry + 28); bgCtx.lineTo(rx + 28, ry + 12);
        bgCtx.moveTo(rx + 18, ry + 28); bgCtx.lineTo(rx + 28, ry + 18);
        bgCtx.stroke();

        bgCtx.font = '38px VT323, monospace';
        bgCtx.fillStyle = '#dfff00';
        bgCtx.fillText('99', rx + 44, ry + 32);

        bgCtx.font = '11px VT323, monospace';
        bgCtx.fillStyle = '#00f0ff';
        bgCtx.fillText('TACTICAL // 180HZ', rx, ry + 52);
      }
    }
    bgCtx.restore();
  }

  function drawMouseReticle() {
    bgCtx.save();
    var r = 16;
    bgCtx.strokeStyle = 'rgba(223, 255, 0, 0.75)';
    bgCtx.lineWidth = 1.5;

    bgCtx.beginPath();
    bgCtx.moveTo(marathonMouseX - r, marathonMouseY - r + 6);
    bgCtx.lineTo(marathonMouseX - r, marathonMouseY - r);
    bgCtx.lineTo(marathonMouseX - r + 6, marathonMouseY - r);

    bgCtx.moveTo(marathonMouseX + r - 6, marathonMouseY - r);
    bgCtx.lineTo(marathonMouseX + r, marathonMouseY - r);
    bgCtx.lineTo(marathonMouseX + r, marathonMouseY - r + 6);

    bgCtx.moveTo(marathonMouseX - r, marathonMouseY + r - 6);
    bgCtx.lineTo(marathonMouseX - r, marathonMouseY + r);
    bgCtx.lineTo(marathonMouseX - r + 6, marathonMouseY + r);

    bgCtx.moveTo(marathonMouseX + r - 6, marathonMouseY + r);
    bgCtx.lineTo(marathonMouseX + r, marathonMouseY + r);
    bgCtx.lineTo(marathonMouseX + r, marathonMouseY + r - 6);
    bgCtx.stroke();

    bgCtx.font = '12px VT323, monospace';
    bgCtx.fillStyle = '#dfff00';
    bgCtx.fillText(
      'LOC [' + Math.floor(marathonMouseX) + ',' + Math.floor(marathonMouseY) + ']',
      marathonMouseX + r + 6,
      marathonMouseY - 4
    );
    bgCtx.restore();
  }

  var lastTime = performance.now();

  function drawGlitchFrame(now) {
    if (matchMedia('(prefers-reduced-motion:reduce)').matches) {
      bgCtx.clearRect(0, 0, width, height);
      return;
    }

    var dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    if (currentTheme === 'marathon') {
      drawMarathonFrame(now, dt);
    } else {
      drawVhsFrame(now, dt);
    }

    // Tracking tear / Horizontal slice displacement
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

    // Periodic random mini tracking slice in VHS mode (every 4-7s)
    if (currentTheme !== 'marathon' && !bgIsPaused && !bgTrackingGlitch.active && Math.random() < 0.004) {
      triggerBackgroundGlitch(0.5);
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

// --- Retro Web Audio Synthesizer & Procedural Music Engine ---
var sfxEnabled = safeStorage.getItem('afterx_sfx') === 'true';
var audioCtx = null;
var musicMasterGain = null;
var sfxMasterGain = null;
var vinylSource = null;
var vinylGain = null;
var musicSchedulerTimer = null;
var currentMusicTrack = null; // 'vhs' | 'marathon' | null
var musicStep = 0;
var nextStepTime = 0;
var distortionCurve808 = null;

function makeDistortionCurve(amount) {
  var k = typeof amount === 'number' ? amount : 22,
    n_samples = 44100,
    curve = new Float32Array(n_samples),
    deg = Math.PI / 180,
    i = 0,
    x;
  for (; i < n_samples; ++i) {
    x = (i * 2) / n_samples - 1;
    curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
  }
  return curve;
}

function getAudioContext() {
  if (!audioCtx && (window.AudioContext || window.webkitAudioContext)) {
    var AudioClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioClass();

    musicMasterGain = audioCtx.createGain();
    musicMasterGain.gain.setValueAtTime(sfxEnabled && !bgIsPaused ? 0.22 : 0.0001, audioCtx.currentTime);
    musicMasterGain.connect(audioCtx.destination);

    sfxMasterGain = audioCtx.createGain();
    sfxMasterGain.gain.setValueAtTime(0.28, audioCtx.currentTime);
    sfxMasterGain.connect(audioCtx.destination);
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

var lastBlipTime = 0;
function playBlip() {
  if (!sfxEnabled || bgIsPaused) return;
  var now = performance.now();
  if (now - lastBlipTime < 45) return;
  lastBlipTime = now;
  var ctx = getAudioContext();
  if (!ctx || !sfxMasterGain) return;
  var osc = ctx.createOscillator();
  var gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(840, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(420, ctx.currentTime + 0.045);
  gain.gain.setValueAtTime(0.06, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.045);
  osc.connect(gain);
  gain.connect(sfxMasterGain);
  osc.start();
  osc.stop(ctx.currentTime + 0.045);
}

var lastGlitchSfxTime = 0;
function playGlitchSfx() {
  if (!sfxEnabled || bgIsPaused) return;
  var now = performance.now();
  if (now - lastGlitchSfxTime < 120) return;
  lastGlitchSfxTime = now;
  var ctx = getAudioContext();
  if (!ctx || !sfxMasterGain) return;
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
  gain.connect(sfxMasterGain);
  noise.start();
}

function playToggleSfx() {
  if (!sfxEnabled || bgIsPaused) return;
  var ctx = getAudioContext();
  if (!ctx || !sfxMasterGain) return;
  var osc = ctx.createOscillator();
  var gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(480, ctx.currentTime);
  gain.gain.setValueAtTime(0.05, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);
  osc.connect(gain);
  gain.connect(sfxMasterGain);
  osc.start();
  osc.stop(ctx.currentTime + 0.035);
}

// --- Vinyl Texture for Lo-Fi ---
function startVinylCrackle() {
  if (vinylSource || !audioCtx || !musicMasterGain) return;
  var bufferSize = audioCtx.sampleRate * 3;
  var buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  var data = buffer.getChannelData(0);
  for (var i = 0; i < bufferSize; i++) {
    var v = (Math.random() * 2 - 1) * 0.04;
    if (Math.random() < 0.0006) v += (Math.random() * 2 - 1) * 0.35;
    data[i] = v;
  }
  vinylSource = audioCtx.createBufferSource();
  vinylSource.buffer = buffer;
  vinylSource.loop = true;

  var filter = audioCtx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(1600, audioCtx.currentTime);
  filter.Q.value = 0.9;

  vinylGain = audioCtx.createGain();
  vinylGain.gain.setValueAtTime(0.05, audioCtx.currentTime);

  vinylSource.connect(filter);
  filter.connect(vinylGain);
  vinylGain.connect(musicMasterGain);
  vinylSource.start();
}

function stopVinylCrackle() {
  if (vinylSource) {
    try {
      vinylSource.stop();
      vinylSource.disconnect();
    } catch (e) {}
    vinylSource = null;
  }
}

// --- Lo-Fi Sound Generators (Theme 1 - VHS) ---
var LOFI_CHORDS = [
  [146.83, 174.61, 220.00, 261.63, 329.63], // Dm9
  [98.00, 174.61, 246.94, 293.66, 329.63],  // G13
  [130.81, 164.81, 196.00, 246.94, 293.66], // Cmaj9
  [110.00, 174.61, 220.00, 277.18, 329.63]  // A7alt
];

function playLofiChord(chordFrequencies, time, duration) {
  if (!audioCtx || !musicMasterGain) return;
  var filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1400, time);
  filter.frequency.linearRampToValueAtTime(850, time + duration);

  var chordGain = audioCtx.createGain();
  chordGain.gain.setValueAtTime(0.001, time);
  chordGain.gain.linearRampToValueAtTime(0.07, time + 0.06);
  chordGain.gain.exponentialRampToValueAtTime(0.001, time + duration);

  chordFrequencies.forEach(function (freq) {
    var osc1 = audioCtx.createOscillator();
    var osc2 = audioCtx.createOscillator();
    osc1.type = 'triangle';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(freq, time);
    osc2.frequency.setValueAtTime(freq * 1.002, time);
    osc1.connect(filter);
    osc2.connect(filter);
    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + duration);
    osc2.stop(time + duration);
  });

  filter.connect(chordGain);
  chordGain.connect(musicMasterGain);
}

function playLofiKick(time) {
  if (!audioCtx || !musicMasterGain) return;
  var osc = audioCtx.createOscillator();
  var gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(125, time);
  osc.frequency.exponentialRampToValueAtTime(44, time + 0.12);
  gain.gain.setValueAtTime(0.36, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.16);
  osc.connect(gain);
  gain.connect(musicMasterGain);
  osc.start(time);
  osc.stop(time + 0.16);
}

function playLofiSnare(time) {
  if (!audioCtx || !musicMasterGain) return;
  var bufferSize = audioCtx.sampleRate * 0.12;
  var buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  var data = buffer.getChannelData(0);
  for (var i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  var noise = audioCtx.createBufferSource();
  noise.buffer = buffer;
  var filter = audioCtx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(1600, time);
  filter.Q.value = 1.3;
  var noiseGain = audioCtx.createGain();
  noiseGain.gain.setValueAtTime(0.18, time);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.11);
  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(musicMasterGain);
  noise.start(time);
  noise.stop(time + 0.12);

  var osc = audioCtx.createOscillator();
  var oscGain = audioCtx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(210, time);
  osc.frequency.exponentialRampToValueAtTime(95, time + 0.08);
  oscGain.gain.setValueAtTime(0.14, time);
  oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
  osc.connect(oscGain);
  oscGain.connect(musicMasterGain);
  osc.start(time);
  osc.stop(time + 0.08);
}

function playLofiHat(time, vol) {
  if (!audioCtx || !musicMasterGain) return;
  var bufferSize = audioCtx.sampleRate * 0.04;
  var buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  var data = buffer.getChannelData(0);
  for (var i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  var noise = audioCtx.createBufferSource();
  noise.buffer = buffer;
  var filter = audioCtx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.setValueAtTime(6800, time);
  var gain = audioCtx.createGain();
  gain.gain.setValueAtTime(vol || 0.07, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.038);
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(musicMasterGain);
  noise.start(time);
  noise.stop(time + 0.04);
}

function scheduleLofiStep(step, time) {
  var bar = Math.floor(step / 16);
  var stepInBar = step % 16;

  // Chords on beat 1 of each bar
  if (stepInBar === 0) {
    var chord = LOFI_CHORDS[bar % LOFI_CHORDS.length];
    playLofiChord(chord, time, 3.1);
  }

  // Soft kick pattern (step 0, step 6 with swing, step 10)
  if (stepInBar === 0 || stepInBar === 6 || stepInBar === 10) {
    var kickSwing = stepInBar === 6 ? 0.025 : 0;
    playLofiKick(time + kickSwing);
  }

  // Snare on beat 2 and 4 (step 4 and 12)
  if (stepInBar === 4 || stepInBar === 12) {
    playLofiSnare(time);
  }

  // Laid back hats
  if (stepInBar % 2 === 0) {
    var isAccent = stepInBar % 4 === 0;
    playLofiHat(time, isAccent ? 0.08 : 0.045);
  } else if (stepInBar === 7 || stepInBar === 15) {
    playLofiHat(time + 0.02, 0.03);
  }
}

// --- Trap Beat Sound Generators (Theme 2 - Marathon Gaming: Hard Tactical / Dark Phonk Drill) ---
var distortionCurveHard808 = null;

function playTrap808(freq, time, duration, slideToFreq) {
  if (!audioCtx || !musicMasterGain) return;
  if (!distortionCurveHard808) distortionCurveHard808 = makeDistortionCurve(72);

  var osc = audioCtx.createOscillator();
  var gain = audioCtx.createGain();
  osc.type = 'sine';

  // Hard punch transient drop
  osc.frequency.setValueAtTime(freq * 3.4, time);
  osc.frequency.exponentialRampToValueAtTime(freq, time + 0.04);

  // Optional 808 pitch glide / slide
  if (slideToFreq) {
    osc.frequency.setValueAtTime(freq, time + 0.18);
    osc.frequency.exponentialRampToValueAtTime(slideToFreq, time + 0.38);
  }

  // Heavy, sustained envelope with growl
  gain.gain.setValueAtTime(0.55, time);
  gain.gain.setValueAtTime(0.48, time + 0.06);
  gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

  var shaper = audioCtx.createWaveShaper();
  shaper.curve = distortionCurveHard808;
  shaper.oversample = '4x';

  var lowPass = audioCtx.createBiquadFilter();
  lowPass.type = 'lowpass';
  lowPass.frequency.setValueAtTime(1400, time);

  osc.connect(shaper);
  shaper.connect(lowPass);
  lowPass.connect(gain);
  gain.connect(musicMasterGain);
  osc.start(time);
  osc.stop(time + duration);
}

function playTrapKick(time) {
  if (!audioCtx || !musicMasterGain) return;
  var osc = audioCtx.createOscillator();
  var gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(260, time);
  osc.frequency.exponentialRampToValueAtTime(42, time + 0.055);
  gain.gain.setValueAtTime(0.58, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
  osc.connect(gain);
  gain.connect(musicMasterGain);
  osc.start(time);
  osc.stop(time + 0.18);
}

function playTrapSnare(time) {
  if (!audioCtx || !musicMasterGain) return;
  // Layer 1: Sharp whip clap noise
  var bufferSize = audioCtx.sampleRate * 0.18;
  var buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  var data = buffer.getChannelData(0);
  for (var i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  var noise = audioCtx.createBufferSource();
  noise.buffer = buffer;

  var filter = audioCtx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(1800, time);
  filter.Q.value = 1.8;

  var noiseGain = audioCtx.createGain();
  // Pre-transient micro clap flam
  noiseGain.gain.setValueAtTime(0.18, time);
  noiseGain.gain.setValueAtTime(0.44, time + 0.015);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(musicMasterGain);
  noise.start(time);
  noise.stop(time + 0.18);

  // Layer 2: Tight body thud
  var osc = audioCtx.createOscillator();
  var oscGain = audioCtx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(280, time);
  osc.frequency.exponentialRampToValueAtTime(125, time + 0.05);
  oscGain.gain.setValueAtTime(0.36, time);
  oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.07);
  osc.connect(oscGain);
  oscGain.connect(musicMasterGain);
  osc.start(time);
  osc.stop(time + 0.07);
}

function playTrapHat(time, vol, pitchMult) {
  if (!audioCtx || !musicMasterGain) return;
  var bufferSize = audioCtx.sampleRate * 0.038;
  var buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  var data = buffer.getChannelData(0);
  for (var i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  var noise = audioCtx.createBufferSource();
  noise.buffer = buffer;
  var filter = audioCtx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.setValueAtTime(9200 * (pitchMult || 1), time);
  var gain = audioCtx.createGain();
  gain.gain.setValueAtTime(vol || 0.13, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.036);
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(musicMasterGain);
  noise.start(time);
  noise.stop(time + 0.038);
}

// Dark Phonk / Reese Menacing Stab
function playTrapDarkHorn(freq, time, duration) {
  if (!audioCtx || !musicMasterGain) return;
  var osc1 = audioCtx.createOscillator();
  var osc2 = audioCtx.createOscillator();
  var gain = audioCtx.createGain();
  var filter = audioCtx.createBiquadFilter();

  osc1.type = 'sawtooth';
  osc2.type = 'sawtooth';
  osc1.frequency.setValueAtTime(freq, time);
  osc2.frequency.setValueAtTime(freq * 1.012, time); // Detuned for fat aggressive buzz

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(2200, time);
  filter.frequency.exponentialRampToValueAtTime(580, time + duration);
  filter.Q.value = 4.2;

  gain.gain.setValueAtTime(0.09, time);
  gain.gain.setValueAtTime(0.12, time + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(gain);
  gain.connect(musicMasterGain);

  osc1.start(time);
  osc2.start(time);
  osc1.stop(time + duration);
  osc2.stop(time + duration);
}

var TRAP_DARK_RIFF = [
  138.59, // C#3 (Dark tonic)
  130.81, // C3 (Dissonant Phrygian lead)
  164.81, // E3
  123.47, // B2
];

function scheduleTrapStep(step, time) {
  var bar = Math.floor(step / 16);
  var stepInBar = step % 16;

  // Heavy 808 Bass Line with Slides (C# Minor / Phonk Drive)
  var cSharp = 34.65; // C#1
  var e1 = 41.20;     // E1
  var d1 = 36.71;     // D1
  var b0 = 30.87;     // B0

  if (stepInBar === 0) {
    if (bar === 0) playTrap808(cSharp, time, 0.72);
    else if (bar === 1) playTrap808(e1, time, 0.72);
    else if (bar === 2) playTrap808(cSharp, time, 0.72);
    else if (bar === 3) playTrap808(d1, time, 0.65, cSharp); // Slide down
  } else if (stepInBar === 6 && (bar === 0 || bar === 2)) {
    playTrap808(cSharp, time, 0.42);
  } else if (stepInBar === 11 && bar === 1) {
    // Aggressive octave slide
    playTrap808(cSharp, time, 0.62, cSharp * 2);
  } else if (stepInBar === 10 && bar === 3) {
    playTrap808(b0, time, 0.55);
  }

  // Heavy Punch Kick Pattern (Syncopated drill/trap)
  if (stepInBar === 0 || stepInBar === 6 || (bar % 2 === 1 && stepInBar === 10) || stepInBar === 13) {
    playTrapKick(time);
  }

  // Crisp Hard Snare (Halftime: step 8 + roll ghost on step 15 bar 3)
  if (stepInBar === 8) {
    playTrapSnare(time);
  } else if (bar === 3 && (stepInBar === 14 || stepInBar === 15)) {
    playTrapSnare(time);
  }

  // Rapid Hi-Hat Sizzles & Triplets
  if (bar === 1 && stepInBar >= 12) {
    // 32nd triplet sizzle
    playTrapHat(time, 0.14, 1.2);
    playTrapHat(time + 0.034, 0.12, 1.4);
    playTrapHat(time + 0.068, 0.11, 1.6);
  } else if (bar === 3 && stepInBar >= 12) {
    // Ascending pitch roll
    playTrapHat(time, 0.13, 1.1);
    playTrapHat(time + 0.028, 0.13, 1.3);
    playTrapHat(time + 0.056, 0.12, 1.5);
    playTrapHat(time + 0.084, 0.11, 1.8);
  } else if (stepInBar % 2 === 0) {
    playTrapHat(time, stepInBar % 4 === 0 ? 0.15 : 0.09, 1.0);
  }

  // Menacing Dark Reese/Horn Stab (Heavy dark tactical theme)
  if (stepInBar === 0 || stepInBar === 4 || stepInBar === 9) {
    var riffIdx = (bar + (stepInBar === 9 ? 1 : 0)) % TRAP_DARK_RIFF.length;
    playTrapDarkHorn(TRAP_DARK_RIFF[riffIdx], time, 0.38);
  }
}

// --- Scheduler Loop ---
function scheduleMusic() {
  if (!sfxEnabled || bgIsPaused || !audioCtx || !musicMasterGain) return;

  var lookahead = 0.12;
  var stepDuration = currentMusicTrack === 'marathon' ? (60 / 138) / 4 : (60 / 74) / 4;

  while (nextStepTime < audioCtx.currentTime + lookahead) {
    if (currentMusicTrack === 'marathon') {
      scheduleTrapStep(musicStep, nextStepTime);
    } else {
      scheduleLofiStep(musicStep, nextStepTime);
    }
    nextStepTime += stepDuration;
    musicStep = (musicStep + 1) % 64;
  }
}

function startThemeMusic(theme) {
  currentMusicTrack = theme;
  if (!sfxEnabled || bgIsPaused) return;

  var ctx = getAudioContext();
  if (!ctx || !musicMasterGain) return;

  musicStep = 0;
  nextStepTime = ctx.currentTime + 0.05;

  if (theme === 'marathon') {
    stopVinylCrackle();
  } else {
    startVinylCrackle();
  }

  musicMasterGain.gain.setValueAtTime(0.001, ctx.currentTime);
  musicMasterGain.gain.linearRampToValueAtTime(0.24, ctx.currentTime + 0.35);

  if (!musicSchedulerTimer) {
    musicSchedulerTimer = setInterval(scheduleMusic, 35);
  }
}

function stopThemeMusic() {
  if (musicMasterGain && audioCtx) {
    musicMasterGain.gain.setValueAtTime(musicMasterGain.gain.value, audioCtx.currentTime);
    musicMasterGain.gain.linearRampToValueAtTime(0.0001, audioCtx.currentTime + 0.2);
  }
  stopVinylCrackle();
  if (musicSchedulerTimer) {
    clearInterval(musicSchedulerTimer);
    musicSchedulerTimer = null;
  }
}

function switchMusicTrack(theme) {
  currentMusicTrack = theme;
  if (!sfxEnabled || bgIsPaused) return;

  var ctx = getAudioContext();
  if (!ctx || !musicMasterGain) return;

  musicMasterGain.gain.setValueAtTime(musicMasterGain.gain.value, ctx.currentTime);
  musicMasterGain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.2);

  setTimeout(function () {
    if (!sfxEnabled || bgIsPaused) return;
    musicStep = 0;
    nextStepTime = ctx.currentTime + 0.05;
    if (theme === 'marathon') {
      stopVinylCrackle();
    } else {
      startVinylCrackle();
    }
    musicMasterGain.gain.setValueAtTime(0.001, ctx.currentTime);
    musicMasterGain.gain.linearRampToValueAtTime(0.24, ctx.currentTime + 0.25);
  }, 200);
}

function pauseMusic() {
  if (musicMasterGain && audioCtx) {
    musicMasterGain.gain.setValueAtTime(musicMasterGain.gain.value, audioCtx.currentTime);
    musicMasterGain.gain.linearRampToValueAtTime(0.0001, audioCtx.currentTime + 0.06);
  }
}

function resumeMusic() {
  if (!sfxEnabled) return;
  var ctx = getAudioContext();
  if (!ctx || !musicMasterGain) return;
  nextStepTime = ctx.currentTime + 0.05;
  if (currentTheme !== 'marathon') {
    startVinylCrackle();
  } else {
    stopVinylCrackle();
  }
  musicMasterGain.gain.setValueAtTime(0.0001, ctx.currentTime);
  musicMasterGain.gain.linearRampToValueAtTime(0.24, ctx.currentTime + 0.15);
  if (!musicSchedulerTimer) {
    musicSchedulerTimer = setInterval(scheduleMusic, 35);
  }
}

var tabs = document.querySelectorAll('.tab'),
  ps = document.querySelectorAll('.panel');

function switchTab(targetTab, isInteractive) {
  if (isInteractive) {
    playBlip();
    var isReduced = matchMedia('(prefers-reduced-motion:reduce)').matches;
    if (!isReduced) {
      tear();
      document.body.classList.add('zap');
      setTimeout(function () {
        document.body.classList.remove('zap');
      }, 280);
    }
  }
  tabs.forEach(function (x) {
    var isSelected = x === targetTab;
    x.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    x.setAttribute('tabindex', isSelected ? '0' : '-1');
  });
  ps.forEach(function (p) {
    p.classList.toggle('on', p.id === 'p' + targetTab.dataset.ch);
  });
  if (isInteractive && window.innerWidth <= 780) {
    var rightSection = document.querySelector('.right');
    if (rightSection) {
      rightSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }
}

tabs.forEach(function (b) {
  b.addEventListener('click', function () {
    switchTab(b, true);
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
      switchTab(n, true);
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
  if (bgIsPaused || matchMedia('(prefers-reduced-motion:reduce)').matches) {
    setTimeout(burst, 2500);
    return;
  }
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
  if (bgIsPaused) return;
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

function sanitizeUrl(url) {
  if (!url || typeof url !== 'string') return '#';
  var trimmed = url.trim();
  try {
    var parsed = new URL(trimmed, window.location.origin);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.href;
    }
  } catch (e) {}
  return '#';
}

var ALLOWED_IMAGE_HOSTS = [
  'i.ytimg.com',
  'i1.ytimg.com',
  'i2.ytimg.com',
  'i3.ytimg.com',
  'i4.ytimg.com',
  'cdn.cloudflare.steamstatic.com',
  'steamcdn-a.akamaihd.net',
  'avatars.githubusercontent.com',
];

function sanitizeImageUrl(url) {
  if (!url || typeof url !== 'string') return '';
  var trimmed = url.trim();
  try {
    var parsed = new URL(trimmed, window.location.origin);
    if (parsed.origin === window.location.origin) {
      return parsed.href;
    }
    if (parsed.protocol === 'https:') {
      var hostname = parsed.hostname.toLowerCase();
      var isAllowed = ALLOWED_IMAGE_HOSTS.some(function (allowed) {
        return hostname === allowed || hostname.endsWith('.' + allowed);
      });
      if (isAllowed) return parsed.href;
    }
  } catch (e) {}
  return '';
}

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
  container.textContent = '';
  if (!repos || repos.length === 0) {
    var emptyItem = document.createElement('div');
    emptyItem.className = 'item';
    var emptyP = document.createElement('p');
    emptyP.textContent = 'No hay repositorios públicos disponibles.';
    emptyItem.appendChild(emptyP);
    container.appendChild(emptyItem);
    return;
  }

  var fragment = document.createDocumentFragment();
  repos.forEach(function (repo) {
    if (!repo || typeof repo !== 'object') return;

    var a = document.createElement('a');
    a.className = 'item';
    var safeHref = sanitizeUrl(repo.html_url);
    a.href = safeHref === '#' ? 'https://github.com/AfterEquis' : safeHref;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';

    var h3 = document.createElement('h3');
    h3.textContent = repo.name || '';
    a.appendChild(h3);

    var p = document.createElement('p');
    p.textContent = repo.description || 'Sin descripción disponible.';
    a.appendChild(p);

    var row = document.createElement('div');
    row.className = 'row';

    var lang = repo.language;
    if (lang) {
      var color = LANG_COLORS[lang] || '#58a6ff';
      var langSpan = document.createElement('span');
      langSpan.className = 'lang';
      langSpan.style.setProperty('--c', color);
      langSpan.textContent = lang;
      row.appendChild(langSpan);
    } else {
      row.appendChild(document.createElement('span'));
    }

    var statsDiv = document.createElement('div');
    if (repo.stargazers_count > 0) {
      var starSpan = document.createElement('span');
      starSpan.className = 'stat-badge';
      starSpan.textContent = '⭐ ' + repo.stargazers_count;
      statsDiv.appendChild(starSpan);
    }
    row.appendChild(statsDiv);

    a.appendChild(row);
    fragment.appendChild(a);
  });
  container.appendChild(fragment);
}

function renderError(container, message) {
  container.textContent = '';
  var item = document.createElement('div');
  item.className = 'item';
  var p = document.createElement('p');
  p.textContent = message || '';
  item.appendChild(p);
  container.appendChild(item);
}

async function loadGitHubRepos() {
  var container = document.getElementById('gh-repos');
  if (!container) return;

  var cachedData = safeStorage.getItem(GITHUB_CACHE_KEY);
  var cachedTime = safeStorage.getItem(GITHUB_CACHE_TIME_KEY);
  var now = Date.now();

  var hasValidCache = false;
  if (cachedData && cachedTime) {
    try {
      var parsed = JSON.parse(cachedData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        var isValidSchema = parsed.every(function (item) {
          return item && typeof item === 'object' && typeof item.name === 'string';
        });
        if (isValidSchema) {
          renderRepos(parsed, container);
          if (now - Number(cachedTime) < CACHE_TTL_MS) {
            hasValidCache = true;
            return;
          }
        } else {
          console.warn('[Security] Caché corrupta o inválida en localStorage, descartando.');
          safeStorage.removeItem(GITHUB_CACHE_KEY);
          safeStorage.removeItem(GITHUB_CACHE_TIME_KEY);
        }
      }
    } catch (e) {
      console.warn('[Security] Error al procesar caché de GitHub:', e.message);
      safeStorage.removeItem(GITHUB_CACHE_KEY);
      safeStorage.removeItem(GITHUB_CACHE_TIME_KEY);
    }
  }

  var GITHUB_COOLDOWN_KEY = 'afterx_gh_cooldown';
  var cooldownUntil = Number(safeStorage.getItem(GITHUB_COOLDOWN_KEY) || 0);
  if (now < cooldownUntil) {
    if (!hasValidCache) {
      renderError(
        container,
        'Límite de peticiones de GitHub alcanzado temporalmente. Puedes ver mis repositorios directamente en GitHub.',
      );
    }
    return;
  }

  try {
    var response = await fetch(GITHUB_API_URL, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
      signal: AbortSignal.timeout(6000),
    });

    if (!response.ok) {
      if (hasValidCache) return;
      if (response.status === 403 || response.status === 429) {
        // Enfriamiento de 5 minutos para no saturar la IP del cliente
        safeStorage.setItem(GITHUB_COOLDOWN_KEY, (now + 5 * 60 * 1000).toString());
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

    safeStorage.setItem(GITHUB_CACHE_KEY, JSON.stringify(filteredRepos));
    safeStorage.setItem(GITHUB_CACHE_TIME_KEY, now.toString());

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
    var response = await fetch('./videos.json', { signal: AbortSignal.timeout(5000) });
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

    container.textContent = '';
    var frag = document.createDocumentFragment();

    var mainCard = document.createElement('a');
    mainCard.className = 'item vid';
    var safeLatestUrl = sanitizeUrl(latest.url);
    mainCard.href = safeLatestUrl === '#' ? 'https://youtube.com/@afterxesp' : safeLatestUrl;
    mainCard.target = '_blank';
    mainCard.rel = 'noopener noreferrer';

    var thumb = document.createElement('div');
    thumb.className = 'thumb';
    if (latest.thumbnail) {
      var safeLatestImg = sanitizeImageUrl(latest.thumbnail);
      if (safeLatestImg) {
        var img = document.createElement('img');
        img.src = safeLatestImg;
        img.alt = latest.title || 'Miniatura de vídeo';
        img.loading = 'lazy';
        img.style.position = 'absolute';
        img.style.inset = '0';
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        thumb.appendChild(img);
      }
    }
    var play = document.createElement('span');
    play.className = 'play';
    play.textContent = '▶';
    thumb.appendChild(play);
    mainCard.appendChild(thumb);

    var info = document.createElement('div');
    var h3 = document.createElement('h3');
    h3.textContent = latest.title || '';
    info.appendChild(h3);

    var p = document.createElement('p');
    p.textContent = 'Canal AfterXEsp_' + formatPubDate(latest.published);
    info.appendChild(p);

    mainCard.appendChild(info);
    frag.appendChild(mainCard);

    if (videos.length >= 3) {
      var grid = document.createElement('div');
      grid.className = 'yt-mini-grid';
      [videos[1], videos[2]].forEach(function (v) {
        var card = document.createElement('a');
        card.className = 'yt-mini-card';
        var safeMiniUrl = sanitizeUrl(v.url);
        card.href = safeMiniUrl === '#' ? 'https://youtube.com/@afterxesp' : safeMiniUrl;
        card.target = '_blank';
        card.rel = 'noopener noreferrer';

        var miniThumb = document.createElement('div');
        miniThumb.className = 'thumb';
        miniThumb.style.aspectRatio = '16/9';
        if (v.thumbnail) {
          var safeMiniImg = sanitizeImageUrl(v.thumbnail);
          if (safeMiniImg) {
            var miniImg = document.createElement('img');
            miniImg.src = safeMiniImg;
            miniImg.alt = v.title || 'Miniatura';
            miniImg.loading = 'lazy';
            miniImg.style.position = 'absolute';
            miniImg.style.inset = '0';
            miniImg.style.width = '100%';
            miniImg.style.height = '100%';
            miniImg.style.objectFit = 'cover';
            miniThumb.appendChild(miniImg);
          }
        }
        var miniPlay = document.createElement('span');
        miniPlay.className = 'play';
        miniPlay.style.fontSize = '18px';
        miniPlay.style.padding = '0 12px';
        miniPlay.textContent = '▶';
        miniThumb.appendChild(miniPlay);
        card.appendChild(miniThumb);

        var h4 = document.createElement('h4');
        h4.textContent = v.title || '';
        card.appendChild(h4);

        var cardP = document.createElement('p');
        cardP.textContent = 'AfterXEsp_' + formatPubDate(v.published);
        card.appendChild(cardP);

        grid.appendChild(card);
      });
      frag.appendChild(grid);
    }

    container.appendChild(frag);
  } catch (err) {
    console.warn('Could not load latest YouTube videos from videos.json:', err);
  }
}

loadYouTubeVideos();

// --- Steam Recent Games Loader (Marathon / Gaming Tab) ---
async function loadSteamGames() {
  var container = document.querySelector('#p3 .marathon-only');
  if (!container) return;

  try {
    var response = await fetch('./data/games.json', { signal: AbortSignal.timeout(5000) });
    if (!response.ok) return;

    var games = await response.json();
    if (!Array.isArray(games) || games.length === 0) return;

    var staticCards = container.querySelectorAll('.item.marathon-item');
    staticCards.forEach(function (card) {
      card.remove();
    });

    var fragment = document.createDocumentFragment();
    games.forEach(function (game, index) {
      var appIdNum = parseInt(game.appid, 10);
      var card = document.createElement(appIdNum > 0 ? 'a' : 'div');
      card.className = 'item marathon-item vid';
      if (appIdNum > 0) {
        card.href = 'https://store.steampowered.com/app/' + appIdNum;
        card.target = '_blank';
        card.rel = 'noopener noreferrer';
      }

      if (game.image) {
        var safeGameImg = sanitizeImageUrl(game.image);
        if (safeGameImg) {
          var thumb = document.createElement('div');
          thumb.className = 'thumb';
          thumb.style.aspectRatio = '460 / 215';

          var img = document.createElement('img');
          img.src = safeGameImg;
          img.alt = game.name || 'Juego Steam';
          img.loading = 'lazy';
          img.style.position = 'absolute';
          img.style.inset = '0';
          img.style.width = '100%';
          img.style.height = '100%';
          img.style.objectFit = 'cover';

          thumb.appendChild(img);
          card.appendChild(thumb);
        }
      }

      var info = document.createElement('div');
      info.style.minWidth = '0';
      info.style.flex = '1';

      var tag = document.createElement('div');
      tag.className = 'item-tag';
      if (index === 0) {
        tag.textContent = 'MAIN TACTICAL';
        info.appendChild(tag);
      } else if (index === 1 || index === 2) {
        tag.textContent = 'EN ROTACIÓN';
        tag.style.color = '#ff6b35';
        tag.style.background = 'rgba(255, 107, 53, 0.15)';
        info.appendChild(tag);
      } else {
        tag.textContent = 'ACTIVO';
        tag.style.color = '#00f0ff';
        tag.style.background = 'rgba(0, 240, 255, 0.12)';
        info.appendChild(tag);
      }

      var h3 = document.createElement('h3');
      h3.textContent = game.name || '';
      info.appendChild(h3);

      var p = document.createElement('p');
      var hoursVal = typeof game.hours === 'number' ? game.hours : parseFloat(game.hours) || 0;
      p.textContent = hoursVal + ' H // 2 SEM';
      info.appendChild(p);

      card.appendChild(info);
      fragment.appendChild(card);
    });

    container.appendChild(fragment);
  } catch (err) {
    console.warn('Could not load Steam games from ./data/games.json:', err);
  }
}

loadSteamGames();

// --- Interactive VHS Controls ---
var btnPlay = document.getElementById('btn-play');
if (btnPlay) {
  btnPlay.addEventListener('click', function () {
    var willPause = !bgIsPaused;
    setBackgroundPaused(willPause);
    document.body.classList.toggle('paused', willPause);
    btnPlay.textContent = willPause ? '⏸ PAUSE' : '▶ PLAY';
    btnPlay.classList.toggle('flashing', willPause);
    if (willPause) {
      pauseMusic();
    } else {
      resumeMusic();
      playToggleSfx();
    }
  });
}

// --- Theme Switcher (VHS Glitch vs Marathon Gaming) via TRACKING ---
var btnTracking = document.getElementById('btn-tracking');
var tab1 = document.getElementById('tab-1');
var tab2 = document.getElementById('tab-2');
var tab3 = document.getElementById('tab-3');

var sfxToggle = document.getElementById('sfx-toggle');
function updateSfxButton() {
  if (!sfxToggle) return;
  var themeLabel = currentTheme === 'marathon' ? 'TRAP' : 'LO-FI';
  sfxToggle.textContent = sfxEnabled ? 'SFX: ON [' + themeLabel + ']' : 'SFX: OFF';
  sfxToggle.classList.toggle('active', sfxEnabled);
  sfxToggle.title = sfxEnabled
    ? 'Audio activo (' + themeLabel + ' + SFX). Clic para silenciar.'
    : 'Audio silenciado. Clic para activar música (' + themeLabel + ') y efectos de sonido.';
}

function applyTheme(theme, isUserClick) {
  currentTheme = theme;
  document.body.setAttribute('data-theme', theme);

  if (tab1) tab1.textContent = theme === 'marathon' ? 'CH 01 RUNNER' : 'CH 01 SOBRE MÍ';
  if (tab2) tab2.textContent = theme === 'marathon' ? 'CH 02 TRANSMISIONES' : 'CH 02 PROYECTOS';
  if (tab3) tab3.textContent = theme === 'marathon' ? 'CH 03 JUEGOS' : 'CH 03 SETUP';

  if (btnTracking) {
    btnTracking.textContent = theme === 'marathon' ? 'TRACKING [GAMING]' : 'TRACKING [VHS]';
    btnTracking.classList.toggle('active-track', theme === 'marathon');
    btnTracking.title =
      theme === 'marathon'
        ? 'Ajuste de tracking: cambiar a VHS Glitch'
        : 'Ajuste de tracking: cambiar a Marathon Gaming';
  }

  if (typeof refreshGlitchPalette === 'function') {
    refreshGlitchPalette();
  }

  if (theme === 'marathon') {
    if (bgVideo) bgVideo.pause();
  } else {
    if (bgVideo && !bgIsPaused) bgVideo.play();
  }

  if (typeof switchMusicTrack === 'function' && sfxEnabled && !bgIsPaused) {
    switchMusicTrack(theme);
  }

  updateSfxButton();

  if (isUserClick) {
    tear();
    triggerBackgroundGlitch(1.2);
    playGlitchSfx();
  }
}

// Initial theme setup on page load
applyTheme(currentTheme, false);

var queryTab = urlParams.get('tab');
if (queryTab && (queryTab === '1' || queryTab === '2' || queryTab === '3')) {
  var tBtn = document.getElementById('tab-' + queryTab);
  if (tBtn) switchTab(tBtn);
}

var lastThemeToggleTime = 0;
if (btnTracking) {
  btnTracking.addEventListener('click', function () {
    var now = performance.now();
    if (now - lastThemeToggleTime < 250) return;
    lastThemeToggleTime = now;
    var nextTheme = currentTheme === 'marathon' ? 'vhs' : 'marathon';
    safeStorage.setItem('afterx_theme', nextTheme);
    applyTheme(nextTheme, true);
  });
}

if (sfxToggle) {
  updateSfxButton();
  sfxToggle.addEventListener('click', function () {
    sfxEnabled = !sfxEnabled;
    safeStorage.setItem('afterx_sfx', sfxEnabled.toString());
    updateSfxButton();
    if (sfxEnabled) {
      getAudioContext();
      playToggleSfx();
      if (!bgIsPaused) {
        startThemeMusic(currentTheme);
      }
    } else {
      stopThemeMusic();
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


