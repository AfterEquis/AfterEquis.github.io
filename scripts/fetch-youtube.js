import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const BLOCKED_ENV_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

// Cargar variables de entorno desde .env o .env.local de forma segura (sin prototype pollution)
function loadEnv() {
  const envFiles = [path.join(rootDir, '.env'), path.join(rootDir, '.env.local')];
  for (const envFile of envFiles) {
    if (fs.existsSync(envFile)) {
      try {
        const content = fs.readFileSync(envFile, 'utf-8');
        for (const line of content.split('\n')) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx !== -1) {
            const key = trimmed.slice(0, eqIdx).trim();
            if (BLOCKED_ENV_KEYS.has(key)) continue;

            let val = trimmed.slice(eqIdx + 1).trim();
            if (
              (val.startsWith('"') && val.endsWith('"')) ||
              (val.startsWith("'") && val.endsWith("'"))
            ) {
              val = val.slice(1, -1);
            }
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      } catch (e) {
        console.warn(`[YouTube] Error leyendo ${envFile}:`, e.message);
      }
    }
  }
}

loadEnv();

const CHANNEL_ID = 'UCWGBR2UWdc945hpmxTuPECg';
const UPLOADS_PLAYLIST_ID = 'UU' + CHANNEL_ID.slice(2);
const RSS_FEED_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

const publicDir = path.join(rootDir, 'public');
const publicVideosFile = path.join(publicDir, 'videos.json');
const rootVideosFile = path.join(rootDir, 'videos.json');

function isValidVideoId(id) {
  return typeof id === 'string' && /^[a-zA-Z0-9_-]{11}$/.test(id);
}

function sanitizeText(text, maxLen = 200) {
  if (typeof text !== 'string') return '';
  return text.replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim().slice(0, maxLen);
}

function escapeRegex(str) {
  return typeof str === 'string' ? str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '';
}

function saveVideos(videos) {
  if (!Array.isArray(videos) || videos.length === 0) {
    console.warn('[YouTube] Se intentó guardar una lista vacía de vídeos; omitiendo para proteger datos existentes.');
    return;
  }

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const outputData = JSON.stringify(videos, null, 2);
  fs.writeFileSync(publicVideosFile, outputData, 'utf-8');
  fs.writeFileSync(rootVideosFile, outputData, 'utf-8');
  console.log(`[YouTube] Guardados ${videos.length} vídeos válidos en videos.json.`);
}

function extractTag(entry, tag) {
  const safeTag = escapeRegex(tag);
  const match = entry.match(new RegExp(`<${safeTag}[^>]*>([\\s\\S]*?)<\\/${safeTag}>`, 'i'));
  return match ? match[1].trim() : '';
}

function extractAttr(entry, tag, attr) {
  const safeTag = escapeRegex(tag);
  const safeAttr = escapeRegex(attr);
  const match = entry.match(new RegExp(`<${safeTag}[^>]*\\s+${safeAttr}=["']([^"']+)["'][^>]*>`, 'i'));
  return match ? match[1].trim() : '';
}

async function fetchFromRss() {
  console.log(`[YouTube RSS] Obteniendo feed RSS para canal ID: ${CHANNEL_ID}...`);
  const response = await fetch(RSS_FEED_URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; AfterXPortfolioBot/1.0)',
    },
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const xml = await response.text();
  const entryMatches = xml.match(/<entry>[\s\S]*?<\/entry>/gi) || [];

  return entryMatches
    .map((entry) => {
      const id = extractTag(entry, 'yt:videoId');
      if (!isValidVideoId(id)) return null;

      const title = sanitizeText(extractTag(entry, 'title'));
      const published = extractTag(entry, 'published');
      const updated = extractTag(entry, 'updated');
      const link = `https://www.youtube.com/watch?v=${id}`;
      const thumbnail =
        extractAttr(entry, 'media:thumbnail', 'url') ||
        `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

      return {
        id,
        title,
        url: link,
        published,
        updated,
        thumbnail,
      };
    })
    .filter(Boolean);
}

async function fetchFromYouTubeApi(apiKey) {
  console.log(`[YouTube API v3] Consultando YouTube Data API v3 (PlaylistItems)...`);
  const apiUrl = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
  apiUrl.searchParams.set('part', 'snippet');
  apiUrl.searchParams.set('playlistId', UPLOADS_PLAYLIST_ID);
  apiUrl.searchParams.set('maxResults', '15');
  apiUrl.searchParams.set('key', apiKey);

  const response = await fetch(apiUrl.toString(), {
    headers: {
      'Accept': 'application/json',
    },
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`YouTube API HTTP ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  const items = Array.isArray(data.items) ? data.items : [];

  return items
    .filter((item) => {
      const title = item.snippet?.title || '';
      return title !== 'Private video' && title !== 'Deleted video';
    })
    .map((item) => {
      const snippet = item.snippet;
      const videoId = snippet.resourceId?.videoId;
      if (!isValidVideoId(videoId)) return null;

      const thumb =
        snippet.thumbnails?.maxres?.url ||
        snippet.thumbnails?.high?.url ||
        snippet.thumbnails?.medium?.url ||
        snippet.thumbnails?.default?.url ||
        `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

      return {
        id: videoId,
        title: sanitizeText(snippet.title),
        url: `https://www.youtube.com/watch?v=${videoId}`,
        published: snippet.publishedAt,
        updated: snippet.publishedAt,
        thumbnail: thumb,
      };
    })
    .filter(Boolean);
}

async function updateVideos() {
  let videos = [];

  if (YOUTUBE_API_KEY) {
    try {
      videos = await fetchFromYouTubeApi(YOUTUBE_API_KEY);
      console.log(`[YouTube API v3] Obtenidos ${videos.length} vídeos exitosamente desde Google Cloud YouTube Data API.`);
    } catch (apiError) {
      console.error(`[YouTube API v3] Error al consultar la API:`, apiError.message);
      console.log(`[YouTube API v3] Recurriendo a RSS como respaldo...`);
    }
  } else {
    console.log(`[YouTube] No se detectó YOUTUBE_API_KEY en variables de entorno / .env. Usando RSS feed.`);
  }

  if (!videos || videos.length === 0) {
    try {
      videos = await fetchFromRss();
      console.log(`[YouTube RSS] ${videos.length} vídeos obtenidos vía RSS.`);
    } catch (rssError) {
      console.error(`[YouTube RSS] Error al obtener RSS:`, rssError.message);
    }
  }

  if (videos && videos.length > 0) {
    saveVideos(videos);
  } else if (!fs.existsSync(publicVideosFile)) {
    console.log(`[YouTube] Escribiendo fallback inicial con el último vídeo conocido...`);
    const fallback = [
      {
        id: '4iT_sjNgHt8',
        title: 'Intente jugar WARZONE y ME PASO ESTO...',
        url: 'https://www.youtube.com/watch?v=4iT_sjNgHt8',
        published: '2024-10-27T19:16:58+00:00',
        updated: '2026-10-03T11:13:14+00:00',
        thumbnail: 'https://i.ytimg.com/vi/4iT_sjNgHt8/hqdefault.jpg',
      },
    ];
    saveVideos(fallback);
  } else {
    console.log(`[YouTube] Manteniendo videos.json existente.`);
  }
}

updateVideos();
