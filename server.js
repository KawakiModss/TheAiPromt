/**
 * MusikFarX! — local dev / self-host server (Express)
 * Routes: /api/search /api/lyrics /api/artist /api/album /api/suggest
 *         /api/ytplay (audio stream url) /api/spotidown (mp3) /api/proxy-audio
 */
const express = require('express');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

/* ---- CORS: same-origin only (blocks external sites from using the proxy) ---- */
function allowedOrigin(req) {
  const origin = req.headers.origin || req.headers.referer;
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  if (origin) { try { const u = new URL(origin); if (host && u.host === host) return u.origin; return null; } catch (e) { return null; } }
  if (host) return (req.headers['x-forwarded-proto'] || req.protocol || 'https') + '://' + host;
  return null;
}
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    const o = allowedOrigin(req); if (o) res.setHeader('Access-Control-Allow-Origin', o);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, HEAD');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    return res.sendStatus(200);
  }
  const o = allowedOrigin(req);
  if (o) { res.setHeader('Access-Control-Allow-Origin', o); res.setHeader('Vary', 'Origin'); }
  next();
});

/* ---- API ---- */
app.all('/api/search', require('./api/search.js'));
app.all('/api/ytplay', require('./api/ytplay.js'));
app.all('/api/lyrics', require('./api/lyrics.js'));
app.all('/api/suggest', require('./api/suggest.js'));
app.all('/api/artist', require('./api/artist.js'));
app.all('/api/album', require('./api/album.js'));
app.all('/api/spotidown', require('./api/spotidown.js'));

/* ---- Audio proxy (streams with Range support) ---- */
app.get('/api/proxy-audio', (req, res) => {
  const target = req.query.url;
  if (!target) return res.status(400).send('Missing url parameter');
  let parsed; try { parsed = new URL(target); } catch (e) { return res.status(400).send('Invalid url parameter'); }
  if (!/^https?:$/.test(parsed.protocol)) return res.status(400).send('Invalid protocol');

  const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36' };
  if (req.headers.range) headers['Range'] = req.headers.range;

  const client = parsed.protocol === 'https:' ? https : http;
  const pr = client.get(target, { headers, timeout: 25000 }, (up) => {
    if (up.statusCode >= 300 && up.statusCode < 400 && up.headers.location) {
      up.resume();
      return res.redirect(up.headers.location);
    }
    res.status(up.statusCode || 200);
    ['content-type', 'content-length', 'accept-ranges', 'content-range'].forEach((h) => {
      if (up.headers[h]) res.setHeader(h, up.headers[h]);
    });
    if (!res.getHeader('accept-ranges')) res.setHeader('Accept-Ranges', 'bytes');
    const o = allowedOrigin(req); if (o) res.setHeader('Access-Control-Allow-Origin', o);
    res.setHeader('Cache-Control', 'no-store');
    up.pipe(res);
  });
  pr.on('error', (e) => { if (!res.headersSent) res.status(502).send('Proxy error: ' + e.message); });
  pr.on('timeout', () => { pr.destroy(); if (!res.headersSent) res.status(504).send('Proxy timeout'); });
});

/* ---- Static + SPA ---- */
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1h' }));
app.use((req, res) => {
  const file = path.join(__dirname, 'public', 'index.html');
  if (req.path.startsWith('/play/')) {
    const vid = (req.path.split('/play/')[1] || '').split('?')[0].split('/')[0];
    const q = new URL(req.url, 'http://x').searchParams;
    const title = q.get('title') || 'MusikFarX!';
    const artist = q.get('artist') || '';
    const cover = q.get('cover') || (vid ? 'https://i.ytimg.com/vi/' + vid + '/hqdefault.jpg' : '/icon.png');
    return fs.readFile(file, 'utf8', (err, html) => {
      if (err) return res.sendFile(file);
      const t = title + (artist ? ' - ' + artist : '') + ' | MusikFarX!';
      res.setHeader('Content-Type', 'text/html');
      res.send(html
        .replace(/<title>.*?<\/title>/i, '<title>' + t + '</title>')
        .replace(/<meta property="og:title" content=".*?"\s*\/?>/i, '<meta property="og:title" content="' + t + '">')
        .replace(/<meta property="og:image" content=".*?"\s*\/?>/i, '<meta property="og:image" content="' + cover + '">')
        .replace(/<link rel="icon"[^>]*>/i, '<link rel="icon" href="' + cover + '">'));
    });
  }
  fs.readFile(file, 'utf8', (err, html) => {
    if (err) return res.sendFile(file);
    res.setHeader('Content-Type', 'text/html'); res.send(html);
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('MusikFarX! running on http://localhost:' + PORT));
