import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const CHANNEL_ID = 'UCWGBR2UWdc945hpmxTuPECg';
const FEED_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;

const publicDir = path.join(rootDir, 'public');
const publicVideosFile = path.join(publicDir, 'videos.json');
const rootVideosFile = path.join(rootDir, 'videos.json');

function extractTag(entry, tag) {
  const match = entry.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match ? match[1].trim() : '';
}

function extractAttr(entry, tag, attr) {
  const match = entry.match(new RegExp(`<${tag}[^>]*\\s+${attr}=["']([^"']+)["'][^>]*>`, 'i'));
  return match ? match[1].trim() : '';
}

async function fetchYouTubeVideos() {
  console.log(`[YouTube RSS] Obteniendo feed para canal ID: ${CHANNEL_ID}...`);

  try {
    const response = await fetch(FEED_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AfterXPortfolioBot/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const xml = await response.text();
    const entryMatches = xml.match(/<entry>[\s\S]*?<\/entry>/gi) || [];

    const videos = entryMatches.map((entry) => {
      const id = extractTag(entry, 'yt:videoId');
      const title = extractTag(entry, 'title');
      const published = extractTag(entry, 'published');
      const updated = extractTag(entry, 'updated');
      const link = extractAttr(entry, 'link', 'href') || (id ? `https://www.youtube.com/watch?v=${id}` : '');
      const thumbnail =
        extractAttr(entry, 'media:thumbnail', 'url') ||
        (id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : '');

      return {
        id,
        title,
        url: link,
        published,
        updated,
        thumbnail,
      };
    });

    console.log(`[YouTube RSS] ${videos.length} vídeos encontrados.`);

    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    const outputData = JSON.stringify(videos, null, 2);
    fs.writeFileSync(publicVideosFile, outputData, 'utf-8');
    fs.writeFileSync(rootVideosFile, outputData, 'utf-8');
    console.log(`[YouTube RSS] Archivos videos.json generados exitosamente.`);
  } catch (error) {
    console.error(`[YouTube RSS] Error al obtener el feed:`, error.message);
    if (!fs.existsSync(publicVideosFile)) {
      console.log(`[YouTube RSS] Escribiendo fallback inicial con el último vídeo conocido...`);
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
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }
      fs.writeFileSync(publicVideosFile, JSON.stringify(fallback, null, 2), 'utf-8');
      fs.writeFileSync(rootVideosFile, JSON.stringify(fallback, null, 2), 'utf-8');
    }
  }
}

fetchYouTubeVideos();
