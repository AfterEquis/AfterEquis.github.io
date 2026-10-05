import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

const apiKey = process.env.STEAM_API_KEY;
const steamId = process.env.STEAM_ID;
const outputPath = new URL('../data/games.json', import.meta.url);
const maxGames = 6;

if (!apiKey || !steamId) {
  console.error('Missing STEAM_API_KEY or STEAM_ID.');
  process.exit(1);
}

const url = new URL('https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001/');
url.searchParams.set('key', apiKey);
url.searchParams.set('steamid', steamId);
url.searchParams.set('format', 'json');

let games;
try {
  const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`Steam API responded ${response.status}`);
  const payload = await response.json();
  const recent = payload?.response?.total_count > 0 ? payload.response.games : [];
  games = recent
    .map((game) => ({
      appid: game.appid,
      name: game.name,
      hours: Number((game.playtime_2weeks / 60).toFixed(1)),
      image: `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appid}/header.jpg`
    }))
    .sort((a, b) => b.hours - a.hours)
    .slice(0, maxGames);
} catch (error) {
  console.error(`Could not fetch Steam games: ${error.message}`);
  process.exit(0);
}

if (!Array.isArray(games) || games.length === 0) {
  console.log('No recently played games returned; keeping existing data/games.json.');
  process.exit(0);
}

await mkdir(dirname(outputPath.pathname), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(games, null, 2)}\n`, 'utf8');
console.log(`Wrote ${games.length} games to data/games.json.`);
