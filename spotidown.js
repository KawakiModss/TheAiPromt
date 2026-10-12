/**
 * /api/spotidown — mp3 + cover resolver
 * Adapted from the "SpotiDown Scraper" by IzzXd (base: https://spotidown.app)
 * Rewritten dependency-free (no cheerio) and hardened for the MusikFarX! backend.
 *   POST { query }  ->  { status, type, title, artist, album, cover, download_mp3 }
 */
const BASE = 'https://spotidown.app';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

function decodeEntities(s) {
  return String(s || '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ');
}
const stripTags = (s) => decodeEntities(String(s || '').replace(/<[^>]*>/g, '')).trim();

function inputValue(html, name) {
  // matches:  name="data" ... value="..."  (attribute order may vary)
  const tag = new RegExp('<input[^>]*name=["\']' + name + '["\'][^>]*>', 'i').exec(html);
  if (!tag) {
    const alt = new RegExp('<input[^>]*value=["\']([^"\']*)["\'][^>]*name=["\']' + name + '["\'][^>]*>', 'i').exec(html);
    return alt ? decodeEntities(alt[1]) : null;
  }
  const v = /value=["']([^"']*)["']/i.exec(tag[0]);
  return v ? decodeEntities(v[1]) : null;
}

function findForms(html) {
  const out = [];
  const formRe = /<form[^>]*name=["']submitspurl["'][^>]*>([\s\S]*?)<\/form>/gi;
  let m;
  while ((m = formRe.exec(html))) {
    const body = m[1];
    const data = inputValue(body, 'data');
    if (!data) continue;
    out.push({ data, base: inputValue(body, 'base'), token: inputValue(body, 'token') });
  }
  return out;
}

function firstTitle(html) {
  const a = /<h3[^>]*itemprop=["']name["'][^>]*>[\s\S]*?title=["']([^"']+)["']/i.exec(html);
  if (a) return decodeEntities(a[1]).trim();
  const b = /<h3[^>]*itemprop=["']name["'][^>]*>([\s\S]*?)<\/h3>/i.exec(html);
  return b ? stripTags(b[1]) : '';
}

function parseForm(form, html) {
  const t = {};
  try { t.__raw = JSON.parse(Buffer.from(form.data, 'base64').toString('utf8')); } catch (e) { t.__raw = {}; }
  const r = t.__raw || {};
  return {
    name: r.name || firstTitle(html) || '',
    artist: r.artist || '',
    album: r.album || '',
    duration: r.duration || '',
    cover: r.cover || r.thumbnail || '',
    date: r.date || null
  };
}

async function resolveTrack(form, cookie) {
  const body = new FormData();
  body.append('data', form.data);
  body.append('base', form.base || '');
  body.append('token', form.token || '');
  const res = await fetch(BASE + '/action/track', {
    method: 'POST',
    headers: { 'User-Agent': UA, Referer: BASE + '/en7', Origin: BASE, Cookie: cookie || '' },
    body
  });
  if (!res.ok) throw new Error('HTTP ' + res.status + ' saat mengambil tautan unduhan');
  const json = await res.json();
  if (json && json.error) throw new Error(json.message || 'Tautan unduhan tidak tersedia');
  const html = String(json && json.data ? json.data : '');
  let mp3 = null, cover = null;
  const re = /<a[^>]*class=["'][^"']*abutton[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(html))) {
    const href = /href=["']([^"']+)["']/i.exec(m[0]);
    if (!href) continue;
    const url = href[1];
    if (!/^https?:/i.test(url)) continue;
    const label = stripTags(m[1]).toLowerCase();
    if (label.includes('mp3') && !mp3) mp3 = url;
    if (label.includes('cover') && !cover) cover = url;
  }
  if (!mp3) {
    const any = /href=["'](https?:\/\/[^"']+\.mp3[^"']*)["']/i.exec(html);
    if (any) mp3 = any[1];
  }
  return { mp3, cover };
}

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  let q = '';
  if (req.method === 'GET') q = (req.query.query || req.query.url || req.query.q || '').trim();
  else {
    let b = req.body;
    if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }
    b = b || {};
    q = String(b.query || b.url || b.q || '').trim();
  }
  if (!q) { res.status(400).json({ status: false, message: 'Parameter query wajib diisi' }); return; }

  try {
    const form = new FormData();
    form.append('url', q);
    form.append('g-recaptcha-response', '');
    const r = await fetch(BASE + '/action', {
      method: 'POST',
      headers: { 'User-Agent': UA, Referer: BASE + '/en7', Origin: BASE },
      body: form
    });
    if (!r.ok) throw new Error('HTTP ' + r.status + ' dari server SpotiDown');

    const cookies = [];
    const sc = r.headers.getSetCookie ? r.headers.getSetCookie() : [];
    sc.forEach((c) => cookies.push(String(c).split(';')[0]));
    const cookie = cookies.join('; ');

    const json = await r.json();
    if (json && json.error) throw new Error(json.message || 'Permintaan gagal diproses');

    const html = String(json && json.data ? json.data : '');
    const forms = findForms(html);
    if (!forms.length) throw new Error('Lagu atau album tidak ditemukan');

    const meta = forms.map((f) => parseForm(f, html));

    let dl = null;
    try { dl = await resolveTrack(forms[0], cookie); } catch (e) { dl = null; }

    if (forms.length === 1) {
      const m = meta[0];
      const single = {
        status: true,
        type: 'track',
        title: m.name || firstTitle(html),
        artist: m.artist,
        album: m.album,
        duration: m.duration,
        date: m.date,
        cover: m.cover || (dl && dl.cover) || '',
        download_mp3: (dl && dl.mp3) || null,
        download_cover: (dl && dl.cover) || null
      };
      if (!single.download_mp3) { res.status(404).json({ status: false, error: 'Tautan MP3 tidak ditemukan untuk lagu ini.', title: single.title }); return; }
      return res.status(200).json(single);
    }

    res.status(200).json({
      status: true,
      type: 'album_or_playlist',
      title: firstTitle(html) || meta[0].name,
      total_tracks: meta.length,
      first_track_download: (dl && dl.mp3) || null,
      cover: (dl && dl.cover) || meta[0].cover || '',
      tracks: meta
    });
  } catch (e) {
    res.status(502).json({ status: false, error: e.message });
  }
};
