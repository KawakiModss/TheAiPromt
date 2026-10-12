/* ==========================================================================
   MusikFarX!  —  core app (state, API, player, toast, router)
   ========================================================================== */
const gid = (id) => document.getElementById(id);
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const es = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const icons = () => { try { if (window.lucide && lucide.createIcons) lucide.createIcons(); } catch (e) {} };
const fmt = (t) => { t = Math.max(0, Math.floor(Number(t) || 0)); const m = Math.floor(t / 60); const s = String(t % 60).padStart(2, '0'); return m + ':' + s; };
const parseDur = (d) => { if (typeof d === 'number') return d; const m = String(d || '').match(/(\d+)[:.٫](\d+)/); return m ? (+m[1]) * 60 + (+m[2]) : 0; };
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);
const img = (u) => u || '/icon.png';

/* ============================ API ============================ */
const API = {
  async req(url, opts) {
    const r = await fetch(url, opts);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  },
  search(q, type) {
    return this.req('/api/search?query=' + encodeURIComponent(q) + '&type=' + (type || 'all'));
  },
  suggest(q) { return this.req('/api/suggest?query=' + encodeURIComponent(q)).catch(() => null); },
  track(videoId) {
    return this.req('/api/ytplay', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: videoId })
    });
  },
  lyrics(id, title, artist) {
    return this.req('/api/lyrics?id=' + encodeURIComponent(id) +
      '&title=' + encodeURIComponent(title || '') + '&artist=' + encodeURIComponent(artist || '')).catch(() => null);
  },
  download(q) {
    return this.req('/api/spotidown', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: q })
    });
  }
};

/* ============================ STORE ============================ */
const KEY = 'musikfarx.v1';
const Store = {
  d: { liked: [], playlists: [], recents: [] },
  load() {
    try { const raw = localStorage.getItem(KEY); if (raw) this.d = Object.assign(this.d, JSON.parse(raw)); } catch (e) {}
    if (!Array.isArray(this.d.liked)) this.d.liked = [];
    if (!Array.isArray(this.d.playlists)) this.d.playlists = [];
    if (!Array.isArray(this.d.recents)) this.d.recents = [];
  },
  save() { try { localStorage.setItem(KEY, JSON.stringify(this.d)); } catch (e) {} },
  isLiked(id) { return this.d.liked.some((t) => t.videoId === id); },
  like(t) {
    if (this.isLiked(t.videoId)) { this.d.liked = this.d.liked.filter((x) => x.videoId !== t.videoId); Toast.show('Dihapus dari Disukai', 'heart-off'); }
    else { this.d.liked.unshift(t); Toast.show('Ditambahkan ke Disukai', 'heart', t.thumbnail); }
    this.save(); return this.isLiked(t.videoId);
  },
  recent(t) {
    this.d.recents = [t].concat(this.d.recents.filter((x) => x.videoId !== t.videoId)).slice(0, 40);
    this.save();
  },
  playlists() { return this.d.playlists; },
  addToPlaylist(pid, t) {
    const p = this.d.playlists.find((x) => x.id === pid); if (!p) return;
    if (p.tracks.some((x) => x.videoId === t.videoId)) { Toast.show('Sudah ada di ' + p.name, 'info'); return; }
    p.tracks.push(t); this.save(); Toast.show('Ditambahkan ke ' + p.name, 'check', t.thumbnail);
  },
  newPlaylist(name) {
    const p = { id: uid(), name: name, tracks: [], at: Date.now() };
    this.d.playlists.unshift(p); this.save(); return p;
  },
  delPlaylist(id) {
    this.d.playlists = this.d.playlists.filter((p) => p.id !== id); this.save();
  },
  export_() { return JSON.stringify(this.d); }
};

/* ============================ TOAST ============================ */
const Toast = {
  show(msg, icon, cover) {
    const box = gid('toasts'); if (!box) return;
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML =
      (cover ? '<img src="' + es(img(cover)) + '" alt="" onerror="this.src=\'/icon.png\'">'
             : '<i class="ti" data-lucide="' + es(icon || 'bell') + '"></i>') +
      '<div style="min-width:0"><div class="tt">' + es(msg) + '</div>' +
      '<div class="ts">MusikFarX!</div></div>';
    box.appendChild(el); icons();
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 320); }, 2600);
    while (box.children.length > 3) box.firstChild.remove();
  }
};

/* ============================ MODAL ============================ */
const Modal = {
  open(html) {
    const m = gid('modal');
    m.innerHTML = '<div class="box">' + html + '</div>';
    m.hidden = false; icons();
    m.addEventListener('click', (e) => { if (e.target === m) Modal.close(); });
  },
  close() { const m = gid('modal'); m.hidden = true; m.innerHTML = ''; },
  prompt(title, placeholder, value, cb) {
    Modal.open(
      '<h3 style="font-size:17px;font-weight:800;margin:0 0 14px">' + es(title) + '</h3>' +
      '<input id="m-inp" class="inp" placeholder="' + es(placeholder || '') + '" value="' + es(value || '') + '" />' +
      '<div style="display:flex;gap:10px;margin-top:18px;justify-content:flex-end">' +
      '<button class="btn" onclick="Modal.close()">Batal</button>' +
      '<button class="btn w" id="m-ok">Simpan</button></div>');
    const inp = gid('m-inp'); if (inp) { inp.focus(); inp.select(); }
    const go = () => { const v = (gid('m-inp').value || '').trim(); if (!v) return; Modal.close(); cb(v); };
    gid('m-ok').onclick = go;
    gid('m-inp').addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
  },
  confirm(title, msg, cb, danger) {
    Modal.open(
      '<h3 style="font-size:17px;font-weight:800;margin:0 0 8px">' + es(title) + '</h3>' +
      '<p class="muted" style="font-size:13.5px;margin:0 0 18px">' + es(msg) + '</p>' +
      '<div style="display:flex;gap:10px;justify-content:flex-end">' +
      '<button class="btn" onclick="Modal.close()">Batal</button>' +
      '<button class="btn w" id="m-ok">' + (danger ? 'Hapus' : 'Lanjut') + '</button></div>');
    gid('m-ok').onclick = () => { Modal.close(); cb(); };
  }
};

/* ============================ SHEET ============================ */
const Sheet = {
  open(html) {
    const w = gid('sheetWrap'), s = gid('sheet');
    s.innerHTML = '<div class="grab"></div>' + html;
    w.hidden = false; icons();
    w.addEventListener('click', (e) => { if (e.target === w) Sheet.close(); });
  },
  close() { const w = gid('sheetWrap'); w.hidden = true; gid('sheet').innerHTML = ''; }
};

/* ============================ PLAYER ============================ */
const Player = {
  audio: null, queue: [], index: -1, current: null,
  shuffle: false, repeat: 'off', loading: false, token: 0,
  init() {
    this.audio = gid('audio');
    this.audio.volume = 1;
    const a = this.audio;
    a.addEventListener('timeupdate', () => Views.Full.progress());
    a.addEventListener('loadedmetadata', () => Views.Full.progress());
    a.addEventListener('play', () => this.syncState());
    a.addEventListener('pause', () => this.syncState());
    a.addEventListener('ended', () => { if (this.repeat === 'one') { a.currentTime = 0; a.play().catch(() => {}); } else this.next(true); });
    a.addEventListener('error', () => { if (this.current) Toast.show('Stream terputus, mencoba lagu berikutnya', 'alert-triangle'); });
    try { if ('mediaSession' in navigator) navigator.mediaSession.setActionHandler('previoustrack', () => Player.prev()); } catch (e) {}
  },
  listId: null, lists: {}, byId: {},
  register(id, arr) { this.lists[id] = arr; (arr || []).forEach((t) => { if (t && t.videoId) this.byId[t.videoId] = t; }); return id; },
  setQueue(arr, id) { this.queue = arr.slice(); if (id) this.listId = id; },
  async playFrom(id, i) {
    const arr = (this.lists[id] || []).slice();
    if (!arr.length) return;
    this.setQueue(arr, id);
    await this.playAt(i);
  },
  async playAt(i) {
    if (i < 0 || i >= this.queue.length) return;
    this.index = i;
    const tr = this.queue[i];
    this.lists[this.listId] = this.queue;
    await this.load(tr, true);
    Views.Full.updateQueueBtn();
  },
  async load(t, autoplay) {
    const my = ++this.token;
    this.current = t; this.loading = true;
    Store.recent(t);
    Views.Mini.render(); Views.Full.render(); Views.Lyrics.reset();
    this.session(t);
    Views.Full.updateQueueBtn();
    try {
      const r = await API.track(t.videoId);
      const url = r && r.result && r.result.download && r.result.download.audio;
      if (!url) throw new Error('Sumber audio tidak tersedia');
      if (my !== this.token) return;
      this.audio.src = '/api/proxy-audio?url=' + encodeURIComponent(url);
      if (autoplay) await this.audio.play().catch(() => { if (my === this.token) Toast.show('Tekan tombol putar untuk mulai', 'play'); });
      if (my !== this.token) return;
      Toast.show(t.title, 'music-4', t.thumbnail);
      this.notify(t);
    } catch (e) {
      if (my === this.token) Toast.show('Gagal memutar: ' + e.message, 'alert-triangle');
    } finally {
      if (my === this.token) { this.loading = false; Views.Mini.render(); Views.Full.render(); Views.Full.progress(); }
    }
  },
  toggle() {
    if (!this.current) { if (this.queue.length) this.playAt(0); return; }
    if (this.audio.paused) { if (!this.audio.src) this.load(this.current, true); else this.audio.play().catch(() => {}); }
    else this.audio.pause();
  },
  next(auto) { if (!this.queue.length) return; let i; if (this.shuffle) { i = Math.floor(Math.random() * this.queue.length); if (this.queue.length > 1 && i === this.index) i = (i + 1) % this.queue.length; } else { i = this.index + 1; if (i >= this.queue.length) { if (this.repeat === 'all' || !auto) i = 0; else { return; } } } this.playAt(i); },
  prev() { if (!this.queue.length) return; if (this.audio.currentTime > 4) { this.audio.currentTime = 0; return; } let i = this.index - 1; if (i < 0) i = this.queue.length - 1; this.playAt(i); },
  seek(p) { if (this.audio.duration) this.audio.currentTime = clamp(p, 0, this.audio.duration); },
  vol(v) { this.audio.volume = clamp(v, 0, 1); },
  cur() { return this.current || {}; },
  session(t) {
    if (!('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: t.title || 'Tidak diketahui', artist: t.artist || 'MusikFarX!', album: t.album || 'MusikFarX!',
        artwork: [{ src: img(t.thumbnail), sizes: '512x512', type: 'image/jpeg' }]
      });
      navigator.mediaSession.setActionHandler('play', () => Player.toggle());
      navigator.mediaSession.setActionHandler('pause', () => Player.toggle());
      navigator.mediaSession.setActionHandler('nexttrack', () => Player.next());
      navigator.mediaSession.setActionHandler('previoustrack', () => Player.prev());
      try { navigator.mediaSession.setActionHandler('seekto', (d) => { if (d.seekTime != null) Player.seek(d.seekTime); }); } catch (e) {}
    } catch (e) {}
  },
  notify(t) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    try {
      new Notification('MusikFarX! · Sedang diputar', {
        body: (t.title || '') + (t.artist ? ' — ' + t.artist : ''),
        icon: img(t.thumbnail), tag: 'musikfarx-now', silent: true
      });
    } catch (e) {}
  },
  askNotify() {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') Notification.requestPermission().catch(() => {});
  },
  syncState() { Views.Mini.render(); Views.Full.render(); }
};

/* ============================ DOWNLOAD ============================ */
async function downloadTrack(t) {
  Toast.show('Menyiapkan unduhan…', 'download');
  try {
    const q = (t.title || '') + (t.artist ? ' ' + t.artist : '');
    const r = await API.download(q);
    const url = r && (r.download_mp3 || (r.first_track_download)) ;
    if (!url) throw new Error((r && r.error) || 'Link MP3 tidak ditemukan');
    const a = document.createElement('a');
    a.href = url; a.target = '_blank'; a.rel = 'noopener';
    a.download = (t.title || 'track') + '.mp3';
    document.body.appendChild(a); a.click(); a.remove();
    Toast.show('Unduhan dimulai: ' + (t.title || ''), 'check-circle');
  } catch (e) {
    Toast.show('Unduhan gagal: ' + e.message, 'alert-triangle');
  }
}

/* ============================ ACTIONS ============================ */
const Act = {
  playId(vid, listId) { const t = Player.byId[vid]; if (!t) { Toast.show('Lagu tidak ditemukan', 'alert-triangle'); return; } return this.play(t, listId); },
  menuById(vid, listId) { const t = Player.byId[vid]; if (!t) return; this.trackMenu(t, listId); },
  play(t, listId) {
    if (listId && Player.lists[listId]) {
      const i = Player.lists[listId].findIndex((x) => x.videoId === t.videoId);
      if (i >= 0) { Player.setQueue(Player.lists[listId], listId); return Player.playAt(i); }
    }
    Player.setQueue([t], null); return Player.playAt(0);
  },
  queue(list) {
    if (!list || !list.length) return;
    Player.setQueue(list, Player.listId);
    Toast.show(list.length + ' lagu masuk antrean', 'list-music');
  },
  like(t) { const on = Store.like(t); Views.syncLike(); if (App.view === 'liked') Views.Liked.render(); return on; },
  home() { App.switch('home'); },
  playAll(list) {
    if (!list || !list.length) return;
    const id = 'tmp-' + uid(); Player.register(id, list);
    Player.playFrom(id, 0);
  },
  shuffleList(list) {
    if (!list || !list.length) return;
    Player.shuffle = true;
    const id = 'tmp-' + uid(); Player.register(id, list);
    const i = Math.floor(Math.random() * list.length);
    Player.playFrom(id, i);
    Toast.show('Acak diaktifkan', 'shuffle');
  },
  trackMenu(t, listId) {
    const liked = Store.isLiked(t.videoId);
    window.CUR = () => t;
    Sheet.open(
      '<div style="display:flex;gap:13px;align-items:center;padding:4px 6px 14px">' +
        '<img src="' + es(img(t.thumbnail)) + '" style="width:56px;height:56px;border-radius:14px;object-fit:cover" onerror="this.src=\'/icon.png\'">' +
        '<div style="min-width:0"><div style="font-size:15px;font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + es(t.title) + '</div>' +
        '<div class="muted" style="font-size:12.5px;margin-top:3px">' + es(t.artist || '') + '</div></div>' +
      '</div>' +
      '<div class="sitem" onclick="Sheet.close();CUR()&&Act.play(CUR(),\'' + es(listId || '') + '\')"><i data-lucide="play"></i>Putar sekarang</div>' +
      '<div class="sitem" onclick="Sheet.close();CUR()&&Act.queue([CUR()])"><i data-lucide="list-plus"></i>Tambah ke antrean</div>' +
      '<div class="sitem" onclick="Sheet.close();Act.like(CUR())">' +
        '<i data-lucide="' + (liked ? 'heart-off' : 'heart') + '"></i>' + (liked ? 'Hapus dari Disukai' : 'Sukai lagu') + '</div>' +
      '<div class="sitem" onclick="Sheet.close();Act.addPl(CUR())"><i data-lucide="folder-plus"></i>Tambah ke playlist</div>' +
      '<div class="sitem" onclick="Sheet.close();downloadTrack(CUR())"><i data-lucide="download"></i>Unduh MP3</div>' +
      '<div class="sitem" onclick="Sheet.close();Act.copy(CUR())"><i data-lucide="link"></i>Salin link</div>');
  },
  addPl(t) {
    const pls = Store.playlists();
    Sheet.open('<h3 style="font-size:16px;font-weight:800;padding:0 6px 12px">Tambah ke playlist</h3>' +
      '<div class="sitem" onclick="Sheet.close();Modal.prompt(\'Playlist baru\',\'Nama playlist\',\'\',function(n){var p=Store.newPlaylist(n);Store.addToPlaylist(p.id,CURT);Act.addPl(CURT);});">' +
        '<i data-lucide="plus-circle"></i>Buat playlist baru</div>' +
      pls.map((p) => '<div class="sitem" onclick="Sheet.close();Store.addToPlaylist(\'' + p.id + '\',CURT);"><i data-lucide="list-music"></i>' + es(p.name) + ' <span class="muted" style="margin-left:auto;font-size:12px">' + p.tracks.length + '</span></div>').join(''));
    window.CURT = t;
  },
  copy(t) {
    const u = 'https://music.youtube.com/watch?v=' + t.videoId;
    try { navigator.clipboard.writeText(u); Toast.show('Link disalin', 'clipboard-check'); }
    catch (e) { Toast.show(u, 'link'); }
  },
  searchFor(q) { App.switch('search'); Views.Search.run(q); }
};

/* ============================ NAV ============================ */
const NAV = [
  { id: 'home', label: 'Beranda', icon: 'house' },
  { id: 'search', label: 'Cari', icon: 'search' },
  { id: 'library', label: 'Koleksi', icon: 'library' },
  { id: 'playlists', label: 'Playlist', icon: 'list-music' },
  { id: 'liked', label: 'Disukai', icon: 'heart' }
];

/* ============================ APP ============================ */
const App = {
  view: 'home',
  boot() {
    Store.load();
    Player.init();
    this.renderNav();
    Views.Home.render();
    Views.Mini.render();
    App.markNav();
    setInterval(() => Views.Full.progress(), 500);
    setTimeout(() => { const s = gid('splash'); if (s) { s.classList.add('gone'); setTimeout(() => s.remove(), 650); } }, 1500);
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && !/INPUT|TEXTAREA/.test((e.target.tagName || ''))) { e.preventDefault(); Player.toggle(); }
    });
    window.addEventListener('error', (e) => { if (e && e.message) console.warn('MusikFarX error:', e.message); });
  },
  renderNav() {
    const nav = gid('nav');
    const pls = Store.playlists().slice(0, 9);
    nav.innerHTML =
      '<div class="side-brand"><img src="/icon.png" alt="" onerror="this.style.display=\'none\'">' +
      '<div><div class="sb-name">MusikFar<b>X!</b></div><div class="sb-sub">Pemutar musik</div></div></div>' +
      '<div class="side-label">Jelajahi</div>' +
      NAV.map((n) =>
        '<button class="nbtn" id="nav-' + n.id + '" onclick="App.switch(\'' + n.id + '\')" title="' + n.label + '">' +
        '<span class="nwrap"><i data-lucide="' + n.icon + '"></i></span><span class="nlabel">' + n.label + '</span></button>').join('') +
      '<div class="side-label">Playlist kamu</div>' +
      '<div class="side-pl">' + (pls.length
        ? pls.map((p) => '<button class="side-item" onclick="Views.Detail.playlist(\'' + p.id + '\')">' +
            '<i data-lucide="list-music"></i><span>' + es(p.name) + '</span></button>').join('')
        : '<div class="side-empty">Belum ada playlist. Buat dari halaman Playlist.</div>') + '</div>';
    icons();
    this.markNav();
  },
  markNav() {
    NAV.forEach((n) => { const el = gid('nav-' + n.id); if (el) el.classList.toggle('on', n.id === App.view); });
  },
  show(id) {
    ['home', 'search', 'library', 'liked', 'playlists', 'detail'].forEach((v) => {
      const el = gid('v-' + v); if (el) el.hidden = (v !== id);
    });
    gid('main').scrollTop = 0;
  },
  switch(v) {
    App.view = v; App.renderNav(); App.show(v);
    if (v === 'home') Views.Home.render();
    if (v === 'search') Views.Search.render();
    if (v === 'library') Views.Library.render();
    if (v === 'liked') Views.Liked.render();
    if (v === 'playlists') Views.Playlists.render();
    icons();
  }
};

window.App = App; window.Player = Player; window.Store = Store; window.Toast = Toast;
window.Modal = Modal; window.Sheet = Sheet; window.Act = Act; window.Views = {};
document.addEventListener('DOMContentLoaded', () => { try { App.boot(); } catch (e) { console.error(e); } });
