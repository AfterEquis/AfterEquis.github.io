import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const apiKey = process.env.STEAM_API_KEY;
const steamId = process.env.STEAM_ID;
const outputPath = fileURLToPath(new URL('../public/data/games.json', import.meta.url));
const maxGames = 6;

if (!apiKey || !steamId) {
  console.error('Missing STEAM_API_KEY or STEAM_ID.');
  process.exit(1);
}

// Validar que steamId contiene únicamente dígitos numéricos
if (!/^\d{17,20}$/.test(steamId.trim())) {
  console.error('STEAM_ID no tiene un formato válido de 64 bits.');
  process.exit(1);
}

const url = new URL('https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001/');
url.searchParams.set('key', apiKey.trim());
url.searchParams.set('steamid', steamId.trim());
url.searchParams.set('format', 'json');

let games;
try {
  const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`Steam API responded ${response.status}`);
  const payload = await response.json();
  const recent = payload?.response?.total_count > 0 && Array.isArray(payload.response.games)
    ? payload.response.games
    : [];

  games = recent
    .map((game) => {
      const appId = Number(game.appid);
      if (!Number.isInteger(appId) || appId <= 0) return null;

      const name = typeof game.name === 'string'
        ? game.name.replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim().slice(0, 150)
        : 'Steam Game';

      const playtimeMinutes = Number(game.playtime_2weeks);
      const hours = Number.isFinite(playtimeMinutes) && playtimeMinutes >= 0
        ? Number((playtimeMinutes / 60).toFixed(1))
        : 0;

      return {
        appid: appId,
        name,
        hours,
        image: `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.hours - a.hours)
    .slice(0, maxGames);
} catch (error) {
  console.error(`Could not fetch Steam games: ${error.message}`);
  process.exit(0);
}

if (!Array.isArray(games) || games.length === 0) {
  console.log('No recently played games returned; keeping existing public/data/games.json.');
  process.exit(0);
}

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(games, null, 2)}\n`, 'utf8');
console.log(`Wrote ${games.length} validated games to public/data/games.json.`);
