// --- Authentic CRT Datamosh Glitch Engine (Matching User Reference) ---
var bgCanvas = document.getElementById('bg-canvas');
var bgCtx = bgCanvas ? bgCanvas.getContext('2d') : null;
var bgVideo = document.getElementById('bg-video');
var bgFallback = document.querySelector('.bg-glitch-fallback');
var bgIsPaused = false;
var bgTrackingGlitch = { active: false, intensity: 0, timer: 0, scanlines: [] };
var mouseGlitchSparks = [];
var currentTheme = localStorage.getItem('afterx_theme') || 'vhs';
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

  window.addEventListener(
    'mousemove',
    function (e) {
      marathonMouseX = e.clientX;
      marathonMouseY = e.clientY;
      marathonMouseActive = true;
      clearTimeout(mouseInactiveTimer);
      mouseInactiveTimer = setTimeout(function () {
        marathonMouseActive = false;
      }, 3500);

      if (bgIsPaused) return;
      if (Math.random() < 0.35 && mouseGlitchSparks.length < 16) {
        mouseGlitchSparks.push({
          x: e.clientX + (Math.random() * 80 - 40),
          y: e.clientY + (Math.random() * 24 - 12),
          w: 15 + Math.random() * 55,
          h: 1 + Math.random() * 2.5,
          color:
            currentTheme === 'marathon'
              ? (Math.random() > 0.5 ? '#dfff00' : '#ff3b00')
              : (Math.random() > 0.5 ? '#00e5ff' : '#ff0055'),
          life: 1.0,
        });
      }
    },
    { passive: true }
  );

  function resizeCanvas() {
    width = window.innerWidth;
    height = window.innerHeight;
    bgCanvas.width = Math.floor(width * dpr);
    bgCanvas.height = Math.floor(height * dpr);
    bgCtx.setTransform(1, 0, 0, 1, 0, 0);
    bgCtx.scale(dpr, dpr);
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
        bgCtx.fillText('VALENCIA // 39°N', rx, ry + 52);
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

// --- Theme Switcher (VHS Glitch vs Marathon Gaming) via TRACKING ---
var btnTracking = document.getElementById('btn-tracking');
var tab1 = document.getElementById('tab-1');
var tab2 = document.getElementById('tab-2');
var tab3 = document.getElementById('tab-3');

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

  if (isUserClick) {
    tear();
    triggerBackgroundGlitch(1.2);
    playGlitchSfx();
  }
}

// Initial theme setup on page load
applyTheme(currentTheme, false);

if (btnTracking) {
  btnTracking.addEventListener('click', function () {
    var nextTheme = currentTheme === 'marathon' ? 'vhs' : 'marathon';
    localStorage.setItem('afterx_theme', nextTheme);
    applyTheme(nextTheme, true);
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


