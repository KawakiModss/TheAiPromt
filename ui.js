/* ==========================================================================
   MusikFarX!  ·  views  ·  design v2
   home · search · library · liked · playlists · detail · mini · full · lyrics
   ========================================================================== */
(function () {
  const V = {};
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const img = (u) => u || '/icon.png';
  const norm = (t) => ({
    videoId: t.videoId || t.id || '',
    title: t.title || 'Tidak diketahui',
    artist: t.artist || t.subtitle || '',
    album: t.album || '',
    thumbnail: t.thumbnail || t.cover || '',
    duration: t.duration || ''
  });
  const skRows = (n) => Array.from({ length: n || 5 }).map(() =>
    '<div class="row"><div class="skel" style="width:52px;height:52px"></div>' +
    '<div style="flex:1"><div class="skel" style="height:12px;width:62%"></div>' +
    '<div class="skel" style="height:10px;width:38%;margin-top:9px"></div></div></div>').join('');

  /* ---------------------------------------------------------------- row */
  V.row = function (t, listId) {
    const tk = norm(t);
    Player.byId[tk.videoId] = tk;
    const active = Player.current && Player.current.videoId === tk.videoId;
    const liked = Store.isLiked(tk.videoId);
    return '<div class="row' + (active ? ' active' : '') + '" onclick="Act.playId(\'' + esc(tk.videoId) + '\',\'' + esc(listId || '') + '\')">' +
      '<div class="row-art"><img src="' + esc(img(tk.thumbnail)) + '" loading="lazy" onerror="this.src=\'/icon.png\'">' +
      '<span class="row-ply"><i data-lucide="play"></i></span></div>' +
      '<div style="flex:1;min-width:0">' +
      '<div class="row-t">' + esc(tk.title) + '</div>' +
      '<div class="row-a">' + (esc(tk.artist) || 'Tidak diketahui') + (liked ? ' · <i data-lucide="heart" style="display:inline-block;width:11px;height:11px;vertical-align:-1px;color:var(--brand);fill:var(--brand)"></i>' : '') + '</div></div>' +
      (active ? '<div class="eqbars' + (Player.audio && Player.audio.paused ? ' paused' : '') + '"><i></i><i></i><i></i></div>' : '') +
      '<button class="row-menu" aria-label="Menu" onclick="event.stopPropagation();Act.menuById(\'' + esc(tk.videoId) + '\',\'' + esc(listId || '') + '\')">' +
      '<i data-lucide="ellipsis-vertical"></i></button></div>';
  };

  /* --------------------------------------------------------------- card */
  V.card = function (c, kind) {
    const id = c.id || c.artistId || c.videoId || '';
    const go = kind === 'artist' ? 'Views.Detail.artist' : kind === 'album' ? 'Views.Detail.album' : 'Views.Detail.playlist';
    return '<div class="gcard' + (kind === 'artist' ? ' gcircle' : '') + '" onclick="' + go + '(\'' + esc(id) + '\')">' +
      '<div class="gwrap"><img src="' + esc(img(c.cover || c.thumbnail)) + '" loading="lazy" onerror="this.src=\'/icon.png\'">' +
      '<span class="gplay"><i data-lucide="play"></i></span></div>' +
      '<div class="t">' + esc(c.title || c.name || '') + '</div>' +
      '<div class="s">' + esc(c.artist || c.albumType || c.subtitle || '') + '</div></div>';
  };

  const secHead = (title, moreLabel, moreAction) =>
    '<div class="sec-head"><div class="sec-title">' + esc(title) + '</div>' +
    (moreLabel ? '<button class="sec-more" onclick="' + moreAction + '">' + esc(moreLabel) + '</button>' : '') + '</div>';

  /* ===================================================================
     HOME
     =================================================================== */
  const MOODS = [
    { n: 'Santai', q: 'lofi chill beats', i: 'coffee' },
    { n: 'Fokus', q: 'focus study instrumental', i: 'brain' },
    { n: 'Pop Indonesia', q: 'pop indonesia terbaru', i: 'music' },
    { n: 'Semangat', q: 'workout motivation music', i: 'zap' },
    { n: 'Galau', q: 'lagu galau indonesia', i: 'cloud-rain' },
    { n: 'Dangdut', q: 'dangdut koplo terbaru', i: 'flame' },
    { n: 'Rock', q: 'rock classics', i: 'guitar' },
    { n: 'Tidur', q: 'sleep ambient rain', i: 'moon' },
    { n: 'Nostalgia', q: 'lagu nostalgia 2000an', i: 'disc' },
    { n: 'Barat', q: 'top hits english', i: 'globe' }
  ];
  let mood = null;

  V.Home = {
    render() {
      const h = new Date().getHours();
      const greet = h < 11 ? 'Selamat pagi' : h < 15 ? 'Selamat siang' : h < 19 ? 'Selamat sore' : 'Selamat malam';
      const chips = '<button class="chip' + (!mood ? ' on' : '') + '" onclick="Views.Home.pick(null)">' +
        '<i data-lucide="sparkles"></i>Untukmu</button>' +
        MOODS.map((m) => '<button class="chip' + (mood === m.q ? ' on' : '') + '" onclick="Views.Home.pick(\'' + m.q + '\')">' +
          '<i data-lucide="' + m.i + '"></i>' + esc(m.n) + '</button>').join('');

      gid('v-home').innerHTML =
        '<header class="topbar">' +
          '<div class="tb-row">' +
            '<div class="tb-brand"><img src="/icon.png" alt="" onerror="this.style.display=\'none\'">' +
              '<div><div class="tb-name">MusikFar<b>X!</b></div><div class="tb-sub">' + esc(greet) + '</div></div></div>' +
            '<div class="tb-actions">' +
              '<button class="iconbtn ib-40" title="Cari" onclick="App.switch(\'search\')"><i data-lucide="search"></i></button>' +
              '<button class="iconbtn ib-40" id="bellbtn" title="Notifikasi" onclick="Views.Home.bell()"><i data-lucide="bell"></i></button>' +
            '</div></div>' +
          '<div class="chiprow hide-scroll">' + chips + '</div>' +
        '</header>' +
        '<div class="page" id="home-body">' + skRows(5) + '</div>';
      icons();
      this.load();
    },
    bell() {
      Player.askNotify();
      Toast.show('Notifikasi & kontrol layar kunci diaktifkan', 'bell-ring');
    },
    pick(q) { mood = q; this.render(); },
    async load() {
      const body = gid('home-body'); if (!body) return;
      try {
        const r = await API.search(mood || 'top hits indonesia terbaru', 'all');
        const res = (r && r.result) || {};
        const songs = (res.songs || []).map(norm);
        const albums = (res.albums || []).slice(0, 8);
        const artists = (res.artists || []).slice(0, 8);
        if (!songs.length) { body.innerHTML = '<p class="muted" style="font-size:13.5px">Tidak ada hasil.</p>'; return; }

        const lid = 'home:' + (mood || 'main');
        Player.register(lid, songs);
        const hero = songs[0], quick = songs.slice(0, 6);

        body.innerHTML =
          '<div class="hero">' +
            '<div class="hero-txt">' +
              '<div class="hero-eyebrow">Dipilih untukmu</div>' +
              '<div class="hero-title">' + esc(mood ? MOODS.filter((m) => m.q === mood).map((m) => m.n)[0] || 'Untukmu' : 'Lagu yang sedang naik') + '</div>' +
              '<div class="hero-sub">' + esc(hero.title) + ' · ' + esc(hero.artist) + '</div>' +
              '<div class="hero-actions">' +
                '<button class="btn accent" onclick="Player.playFrom(\'' + lid + '\',0)"><i data-lucide="play"></i>Putar</button>' +
                '<button class="btn ghost" onclick="Act.shuffleList(Player.lists[\'' + lid + '\'])"><i data-lucide="shuffle"></i>Acak</button>' +
              '</div></div>' +
            '<div class="hero-art">' +
              songs.slice(1, 3).map((t) => '<img src="' + esc(img(t.thumbnail)) + '" alt="" onerror="this.src=\'/icon.png\'">').join('') +
            '</div>' +
          '</div>' +

          '<div class="quickgrid">' + quick.map((t, i) =>
            '<div class="qcard" onclick="Player.playFrom(\'' + lid + '\',' + i + ')">' +
              '<img src="' + esc(img(t.thumbnail)) + '" alt="" onerror="this.src=\'/icon.png\'">' +
              '<div style="min-width:0;flex:1"><div class="q-t">' + esc(t.title) + '</div>' +
              '<div class="row-a">' + esc(t.artist) + '</div></div>' +
              '<i data-lucide="play" class="q-p"></i>' +
            '</div>').join('') + '</div>' +

          secHead('Lagu pilihan', 'Acak semua', 'Act.shuffleList(Player.lists[\'' + lid + '\'])') +
          '<div class="rows">' + songs.slice(0, 10).map((t) => V.row(t, lid)).join('') + '</div>' +

          (artists.length ? secHead('Artis populer') +
            '<div class="hscroll hide-scroll">' + artists.map((a) => V.card(a, 'artist')).join('') + '</div>' : '') +

          (albums.length ? secHead('Album & single') +
            '<div class="grid-cards">' + albums.map((a) => V.card(a, 'album')).join('') + '</div>' : '');

        icons();
      } catch (e) {
        body.innerHTML = '<div class="card" style="padding:26px;text-align:center">' +
          '<i data-lucide="wifi-off" style="width:26px;height:26px"></i>' +
          '<p style="font-size:14.5px;font-weight:750;margin:12px 0 5px">Gagal memuat</p>' +
          '<p class="muted" style="font-size:12.5px;margin:0 0 16px">' + esc(e.message) + '</p>' +
          '<button class="btn w" onclick="Views.Home.load()">Coba lagi</button></div>';
        icons();
      }
    }
  };

  /* ===================================================================
     SEARCH
     =================================================================== */
  const TABS = [['songs', 'Lagu', 'music'], ['albums', 'Album', 'disc-3'], ['artists', 'Artis', 'user-round'], ['playlists', 'Playlist', 'list-music']];
  V.Search = {
    tab: 'songs', q: '',
    render() {
      gid('v-search').innerHTML =
        '<header class="topbar">' +
          '<h1 class="page-h">Cari</h1>' +
          '<p class="page-sub">Lagu, artis, album, atau playlist</p>' +
          '<div class="card" style="display:flex;align-items:center;gap:11px;padding:4px 12px;border-radius:15px;margin-top:14px;background:rgba(255,255,255,.05)">' +
            '<i data-lucide="search" style="width:18px;height:18px;color:var(--txt3);flex:0 0 auto"></i>' +
            '<input id="q" class="inp" style="background:transparent;border:0;padding:11px 0;font-size:15px;flex:1" placeholder="Mau dengar apa?" value="' + esc(this.q) + '" autocomplete="off">' +
            '<button id="qclr" class="iconbtn" style="width:28px;height:28px;border-radius:9px;background:rgba(255,255,255,.07)"' + (this.q ? '' : ' hidden') + ' onclick="Views.Search.clear()"><i data-lucide="x" style="width:14px;height:14px"></i></button>' +
          '</div>' +
          '<div class="chiprow hide-scroll" style="margin-top:12px">' +
            TABS.map(([k, l, ic]) => '<button class="chip' + (this.tab === k ? ' on' : '') + '" onclick="Views.Search.setTab(\'' + k + '\')">' +
              '<i data-lucide="' + ic + '"></i>' + l + '</button>').join('') +
          '</div>' +
        '</header>' +
        '<div class="page"><div id="sugg" style="padding-top:16px"></div><div id="sres">' +
          '<p class="muted" style="font-size:13.5px;text-align:center;padding:44px 20px">Ketik untuk mulai mencari.</p>' +
        '</div></div>';
      icons();
      const inp = gid('q');
      inp.addEventListener('input', (e) => { this.q = e.target.value; this.dot(); this.suggest(this.q); });
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { gid('sugg').innerHTML = ''; this.run(e.target.value); inp.blur(); } });
      if (this.q) this.run(this.q);
    },
    dot() { const b = gid('qclr'); if (b) b.hidden = !this.q; },
    clear() {
      this.q = ''; const i = gid('q'); if (i) i.value = '';
      this.dot(); const s = gid('sugg'); if (s) s.innerHTML = '';
      const r = gid('sres'); if (r) r.innerHTML = '<p class="muted" style="font-size:13.5px;text-align:center;padding:44px 20px">Ketik untuk mulai mencari.</p>';
      if (i) i.focus();
    },
    setTab(t) { this.tab = t; this.render(); if (this.q) this.run(this.q); },
    suggest(q) {
      const box = gid('sugg'); if (!box) return;
      if (!q || q.length < 2) { box.innerHTML = ''; return; }
      const my = q;
      setTimeout(async () => {
        if (this.q !== my || !gid('sugg')) return;
        const r = await API.suggest(q);
        if (this.q !== my || !gid('sugg')) return;
        const list = Array.isArray(r) ? r.slice(0, 5) : [];
        box.innerHTML = list.length ? '<div class="card" style="overflow:hidden;padding:5px;margin-bottom:6px">' +
          list.map((s) => '<div class="sitem" onclick="Views.Search.fill(' + JSON.stringify(s).replace(/"/g, '&quot;') + ')">' +
            '<i data-lucide="search"></i><span>' + esc(s) + '</span></div>').join('') + '</div>' : '';
        icons();
      }, 230);
    },
    fill(s) {
      this.q = s; const i = gid('q'); if (i) i.value = s;
      const g = gid('sugg'); if (g) g.innerHTML = '';
      this.dot(); this.run(s);
    },
    async run(q) {
      q = (q || this.q || '').trim(); if (!q) return;
      this.q = q;
      const box = gid('sres'); if (!box) return;
      box.innerHTML = secHead('Mencari “' + q + '”') + skRows(5);
      try {
        const r = await API.search(q, this.tab === 'songs' ? 'all' : this.tab);
        const res = (r && r.result) || {};
        const songs = (res.songs || []).map(norm);
        if (this.tab === 'songs') Player.register('search:' + q, songs);
        const id = 'search:' + q, box2 = gid('sres'); if (!box2) return;
        if (this.tab === 'songs') {
          box2.innerHTML = songs.length
            ? '<div class="sec-head"><div class="sec-title">' + songs.length + ' lagu</div>' +
              '<div style="display:flex;gap:8px">' +
              '<button class="btn ghost" style="padding:9px 12px" onclick="Act.shuffleList(Player.lists[\'' + id + '\'])"><i data-lucide="shuffle"></i></button>' +
              '<button class="btn accent" onclick="Act.playAll(Player.lists[\'' + id + '\'])"><i data-lucide="play"></i>Putar</button></div></div>' +
              '<div class="rows">' + songs.map((t) => V.row(t, id)).join('') + '</div>'
            : '<p class="muted" style="font-size:13.5px;padding:20px 0">Tidak ada lagu ditemukan.</p>';
        } else if (this.tab === 'albums') {
          const a = res.albums || [];
          box2.innerHTML = a.length ? '<div class="grid-cards">' + a.map((x) => V.card(x, 'album')).join('') + '</div>'
            : '<p class="muted" style="font-size:13.5px;padding:20px 0">Tidak ada album ditemukan.</p>';
        } else if (this.tab === 'artists') {
          const a = res.artists || [];
          box2.innerHTML = a.length ? '<div class="grid-cards">' + a.map((x) => V.card(x, 'artist')).join('') + '</div>'
            : '<p class="muted" style="font-size:13.5px;padding:20px 0">Tidak ada artis ditemukan.</p>';
        } else {
          const p = res.playlists || [];
          box2.innerHTML = p.length ? '<div class="grid-cards">' + p.map((x) => V.card(x, 'playlist')).join('') + '</div>'
            : '<p class="muted" style="font-size:13.5px;padding:20px 0">Tidak ada playlist ditemukan.</p>';
        }
        icons();
      } catch (e) {
        box.innerHTML = '<div class="card" style="padding:20px;font-size:13.5px">Gagal mencari: ' + esc(e.message) + '</div>';
      }
    }
  };

  /* ===================================================================
     LIBRARY
     =================================================================== */
  V.Library = {
    render() {
      const rec = Store.d.recents.slice(0, 12);
      const liked = Store.d.liked.slice(0, 8);
      gid('v-library').innerHTML =
        '<header class="topbar"><h1 class="page-h">Koleksi kamu</h1>' +
        '<p class="page-sub">Tanpa login — semua tersimpan di perangkat ini</p></header>' +
        '<div class="page" style="padding-top:18px">' +
          '<div class="quickgrid" style="grid-template-columns:repeat(auto-fill,minmax(230px,1fr));margin-bottom:28px">' +
            '<div class="card" style="padding:17px;cursor:pointer" onclick="App.switch(\'liked\')">' +
              '<i data-lucide="heart" style="width:22px;height:22px;color:var(--brand)"></i>' +
              '<div style="font-size:15.5px;font-weight:800;margin-top:14px">Lagu disukai</div>' +
              '<div class="muted" style="font-size:12.5px;margin-top:3px">' + Store.d.liked.length + ' lagu</div></div>' +
            '<div class="card" style="padding:17px;cursor:pointer" onclick="App.switch(\'playlists\')">' +
              '<i data-lucide="list-music" style="width:22px;height:22px;color:var(--brand)"></i>' +
              '<div style="font-size:15.5px;font-weight:800;margin-top:14px">Playlist</div>' +
              '<div class="muted" style="font-size:12.5px;margin-top:3px">' + Store.d.playlists.length + ' playlist</div></div>' +
          '</div>' +
          (liked.length ? secHead('Disukai terakhir', 'Semua', 'App.switch(\'liked\')') +
            '<div class="grid-cards">' + liked.map((t) => { Player.byId[t.videoId] = t; return (
              '<div class="gcard" onclick="Act.playId(\'' + esc(t.videoId) + '\')">' +
              '<div class="gwrap"><img src="' + esc(img(t.thumbnail)) + '" onerror="this.src=\'/icon.png\'">' +
              '<span class="gplay"><i data-lucide="play"></i></span></div>' +
              '<div class="t">' + esc(t.title) + '</div><div class="s">' + esc(t.artist || '') + '</div></div>'); }).join('') + '</div>' : '') +
          secHead('Baru diputar') +
          (rec.length ? '<div class="rows">' + rec.map((t) => V.row(t, 'recents')).join('') + '</div>'
            : '<p class="muted" style="font-size:13.5px">Belum ada riwayat. Putar satu lagu dulu.</p>') +
        '</div>';
      Player.register('recents', rec.map(norm));
      icons();
    }
  };

  /* ===================================================================
     LIKED
     =================================================================== */
  V.Liked = {
    render() {
      const list = Store.d.liked.map(norm);
      Player.register('liked', list);
      gid('v-liked').innerHTML =
        '<header class="topbar"><div class="tb-row">' +
          '<div><h1 class="page-h">Lagu disukai</h1><p class="page-sub">' + list.length + ' lagu</p></div>' +
          (list.length ? '<button class="btn accent" onclick="Act.playAll(Player.lists[\'liked\'])"><i data-lucide="play"></i>Putar</button>' : '') +
        '</div></header>' +
        '<div class="page" style="padding-top:16px">' +
        (list.length ? '<div class="rows">' + list.map((t) => V.row(t, 'liked')).join('') + '</div>'
          : '<div class="card" style="padding:38px 24px;text-align:center">' +
            '<i data-lucide="heart" style="width:27px;height:27px;color:var(--brand)"></i>' +
            '<p style="font-size:15px;font-weight:800;margin:14px 0 6px">Belum ada lagu disukai</p>' +
            '<p class="muted" style="font-size:12.5px;margin:0 0 16px">Tekan ikon hati saat memutar lagu untuk menyimpannya di sini.</p>' +
            '<button class="btn w" onclick="App.switch(\'home\')">Jelajahi musik</button></div>') +
        '</div>';
      icons();
    }
  };

  /* ===================================================================
     PLAYLISTS
     =================================================================== */
  V.Playlists = {
    render() {
      const pls = Store.playlists();
      gid('v-playlists').innerHTML =
        '<header class="topbar"><div class="tb-row">' +
          '<div><h1 class="page-h">Playlist kamu</h1><p class="page-sub">' + pls.length + ' playlist</p></div>' +
          '<button class="btn accent" onclick="Views.Playlists.create()"><i data-lucide="plus"></i>Buat</button>' +
        '</div></header>' +
        '<div class="page" style="padding-top:16px">' +
        (pls.length ? pls.map((p) =>
          '<div class="card" style="display:flex;align-items:center;gap:14px;padding:12px;margin-bottom:11px">' +
            '<div class="iconbtn ib-40" style="width:54px;height:54px;border-radius:15px;flex:0 0 auto;color:var(--brand)" onclick="Views.Detail.playlist(\'' + p.id + '\')">' +
              '<i data-lucide="list-music" style="width:22px;height:22px"></i></div>' +
            '<div style="flex:1;min-width:0;cursor:pointer" onclick="Views.Detail.playlist(\'' + p.id + '\')">' +
              '<div class="row-t" style="font-size:14.5px">' + esc(p.name) + '</div>' +
              '<div class="row-a">' + p.tracks.length + ' lagu</div></div>' +
            '<button class="row-menu" onclick="Views.Playlists.ask(' + JSON.stringify(p.id) + ')"><i data-lucide="ellipsis-vertical"></i></button>' +
          '</div>').join('')
          : '<div class="card" style="padding:38px 24px;text-align:center">' +
            '<i data-lucide="list-music" style="width:27px;height:27px;color:var(--brand)"></i>' +
            '<p style="font-size:15px;font-weight:800;margin:14px 0 6px">Belum ada playlist</p>' +
            '<p class="muted" style="font-size:12.5px;margin:0 0 16px">Susun lagu favoritmu ke dalam playlist sendiri.</p>' +
            '<button class="btn w" onclick="Views.Playlists.create()">Buat playlist</button></div>') +
        '</div>';
      icons();
    },
    create() { Modal.prompt('Playlist baru', 'Nama playlist', '', (n) => { Store.newPlaylist(n); Toast.show('Playlist dibuat: ' + n, 'check'); App.switch('playlists'); }); },
    ask(id) {
      const p = Store.playlists().find((x) => x.id === id); if (!p) return;
      Sheet.open('<div class="sitem" onclick="Sheet.close();Views.Playlists.rename(\'' + p.id + '\')"><i data-lucide="pencil"></i>Ganti nama</div>' +
        '<div class="sitem" style="color:#FF7A7A" onclick="Sheet.close();Views.Playlists.remove(\'' + p.id + '\')"><i data-lucide="trash-2" style="color:#FF7A7A"></i>Hapus playlist</div>');
    },
    rename(id) {
      const p = Store.playlists().find((x) => x.id === id); if (!p) return;
      Modal.prompt('Ganti nama playlist', 'Nama playlist', p.name, (n) => { p.name = n; Store.save(); Views.Playlists.render(); App.renderNav(); Toast.show('Nama diperbarui', 'check'); });
    },
    remove(id) {
      const p = Store.playlists().find((x) => x.id === id); if (!p) return;
      Modal.confirm('Hapus playlist?', 'Playlist “' + p.name + '” akan dihapus dari perangkat ini.', () => {
        Store.delPlaylist(id); Views.Playlists.render(); App.renderNav(); Toast.show('Playlist dihapus', 'trash-2');
      }, true);
    }
  };

  /* ===================================================================
     DETAIL  (album · artist · playlist)
     =================================================================== */
  V.Detail = {
    from: 'home',
    back() { App.switch(this.from || 'home'); },
    open(html) { App.view = 'detail'; App.markNav(); App.show('detail'); gid('v-detail').innerHTML = html; icons(); },
    head(cover, title, sub, lid, round) {
      return '<header class="topbar" style="padding-bottom:16px">' +
        '<button class="iconbtn ib-40" style="margin-bottom:18px" onclick="Views.Detail.back()"><i data-lucide="arrow-left"></i></button>' +
        '<div style="display:flex;gap:18px;align-items:flex-end">' +
          '<img src="' + esc(img(cover)) + '" style="width:120px;height:120px;object-fit:cover;flex:0 0 auto;' +
            (round ? 'border-radius:50%' : 'border-radius:20px') + ';box-shadow:var(--shadow)" onerror="this.src=\'/icon.png\'">' +
          '<div style="min-width:0"><div style="font-size:23px;font-weight:800;letter-spacing:-.035em;line-height:1.15">' + esc(title) + '</div>' +
            '<div class="muted" style="font-size:12.5px;margin-top:8px">' + esc(sub) + '</div></div></div>' +
        '<div style="display:flex;gap:9px;margin-top:20px">' +
          '<button class="btn accent" style="flex:1;justify-content:center" onclick="Act.playAll(Player.lists[\'' + lid + '\'])"><i data-lucide="play"></i>Putar semua</button>' +
          '<button class="btn ghost" style="padding:11px 15px" onclick="Act.shuffleList(Player.lists[\'' + lid + '\'])"><i data-lucide="shuffle"></i></button>' +
        '</div></header>';
    },
    album(id) {
      this.from = App.view;
      this.open('<div class="page">' + skRows(5) + '</div>');
      API.req('/api/album?id=' + encodeURIComponent(id)).then((r) => {
        const res = (r && (r.result || r)) || {};
        const tracks = (res.tracks || res.songs || []).map(norm);
        const lid = 'album:' + id; Player.register(lid, tracks);
        this.open(this.head(res.cover || res.thumbnail || (tracks[0] && tracks[0].thumbnail), res.title || res.name || 'Album',
          (res.artist || '') + (tracks.length ? ' · ' + tracks.length + ' lagu' : ''), lid) +
          '<div class="page" style="padding-top:14px">' + (tracks.length
            ? '<div class="rows">' + tracks.map((t) => V.row(t, lid)).join('') + '</div>'
            : '<p class="muted" style="font-size:13.5px">Tidak ada lagu.</p>') + '</div>');
      }).catch((e) => this.open('<div class="page" style="padding-top:20px"><div class="card" style="padding:20px;font-size:13.5px">Gagal memuat album: ' + esc(e.message) + '</div></div>'));
    },
    artist(id) {
      this.from = App.view;
      this.open('<div class="page">' + skRows(5) + '</div>');
      API.req('/api/artist?id=' + encodeURIComponent(id)).then((r) => {
        const res = (r && (r.result || r)) || {};
        const songs = (res.songs || []).map(norm);
        const albums = res.albums || [];
        const lid = 'artist:' + id; Player.register(lid, songs);
        this.open(this.head(res.thumbnail || res.cover || (songs[0] && songs[0].thumbnail), res.name || res.title || 'Artis',
          songs.length + ' lagu populer', lid, true) +
          '<div class="page" style="padding-top:14px">' + (songs.length
            ? '<div class="rows">' + songs.map((t) => V.row(t, lid)).join('') + '</div>'
            : '<p class="muted" style="font-size:13.5px">Tidak ada lagu.</p>') +
          (albums.length ? secHead('Album') + '<div class="grid-cards">' + albums.map((a) => V.card(a, 'album')).join('') + '</div>' : '') +
          '</div>');
      }).catch((e) => this.open('<div class="page" style="padding-top:20px"><div class="card" style="padding:20px;font-size:13.5px">Gagal memuat artis: ' + esc(e.message) + '</div></div>'));
    },
    playlist(id) {
      if (!id) return;
      this.from = App.view;
      const p = Store.playlists().find((x) => x.id === id); if (!p) return;
      const lid = 'pl:' + id; Player.register(lid, p.tracks.map(norm));
      this.open(this.head(p.tracks[0] && p.tracks[0].thumbnail, p.name, p.tracks.length + ' lagu · playlist kamu', lid) +
        '<div class="page" style="padding-top:14px">' + (p.tracks.length
          ? '<div class="rows">' + p.tracks.map((t, i) =>
              '<div style="display:flex;align-items:center;gap:2px">' +
              '<div style="flex:1;min-width:0">' + V.row(t, lid) + '</div>' +
              '<button class="row-menu" onclick="Views.Detail.premove(\'' + id + '\',' + i + ')"><i data-lucide="x"></i></button></div>').join('') + '</div>'
          : '<p class="muted" style="font-size:13.5px">Playlist masih kosong. Tambahkan lagu dari menu ⋮ pada tiap lagu.</p>') + '</div>');
    },
    premove(pid, i) {
      const p = Store.playlists().find((x) => x.id === pid); if (!p) return;
      p.tracks.splice(i, 1); Store.save(); Toast.show('Lagu dihapus dari playlist', 'x'); this.playlist(pid);
    }
  };

  /* ===================================================================
     MINI PLAYER (sticky bar)
     =================================================================== */
  V.Mini = {
    render() {
      const box = gid('mini'); if (!box) return;
      const t = Player.cur();
      if (!t || !t.videoId) { box.hidden = true; box.innerHTML = ''; return; }
      const on = Player.audio && !Player.audio.paused;
      const dur = (Player.audio && Player.audio.duration) || parseDur(t.duration) || 1;
      const pct = Player.audio && Player.audio.currentTime ? (Player.audio.currentTime / dur) * 100 : 0;
      box.hidden = false;
      box.innerHTML =
        '<div class="bar"><i style="width:' + clamp(pct, 0, 100) + '%"></i></div>' +
        '<img src="' + esc(img(t.thumbnail)) + '" class="' + (on ? 'spin' : '') + '" style="border-radius:' + (on ? '50%' : '12px') + '" onerror="this.src=\'/icon.png\'">' +
        '<div style="flex:1;min-width:0"><div class="row-t mt">' + esc(t.title) + '</div>' +
        '<div class="row-a">' + esc(t.artist || 'MusikFarX!') + '</div></div>' +
        '<button class="iconbtn" style="width:40px;height:40px;border-radius:50%;flex:0 0 auto" onclick="event.stopPropagation();Act.like(Player.cur());Views.Mini.render();Views.Full.render()">' +
        '<i data-lucide="heart" style="' + (Store.isLiked(t.videoId) ? 'fill:#fff;color:#fff' : 'color:var(--txt3)') + '"></i></button>' +
        '<button class="iconbtn" style="width:40px;height:40px;border-radius:50%;flex:0 0 auto" onclick="event.stopPropagation();Player.toggle()">' +
        (Player.loading ? '<span class="cspin" style="width:18px;height:18px"></span>'
        : '<i data-lucide="' + (on ? 'pause' : 'play') + '" style="fill:#fff"></i>') + '</button>' +
        '<button class="iconbtn" style="width:40px;height:40px;border-radius:50%;flex:0 0 auto" onclick="event.stopPropagation();Player.next()">' +
        '<i data-lucide="skip-forward" style="fill:#fff"></i></button>';
      box.onclick = () => V.Full.open();
      icons();
    }
  };

  /* ===================================================================
     FULL PLAYER
     =================================================================== */
  V.Full = {
    open() { if (!Player.cur().videoId) return; gid('full').hidden = false; this.render(); },
    close() { gid('full').hidden = true; this.hideLyrics(); },
    progress() {
      const t = Player.cur(); if (!t.videoId) return;
      const a = Player.audio, dur = a.duration || 0;
      const sk = gid('f-seek');
      if (sk && document.activeElement !== sk) sk.value = dur ? (a.currentTime / dur) * 1000 : 0;
      const c = gid('f-cur'), d = gid('f-dur');
      if (c) c.textContent = fmt(a.currentTime);
      if (d) d.textContent = dur ? fmt(dur) : (t.duration || '0:00');
      Views.Lyrics.sync(a.currentTime);
      const mini = gid('mini');
      if (mini && !mini.hidden) { const b = mini.querySelector('.bar i'); if (b && dur) b.style.width = (a.currentTime / dur) * 100 + '%'; }
    },
    updateQueueBtn() { const b = gid('f-qbtn'); if (b) b.onclick = () => V.Full.queueSheet(); },
    render() {
      const t = Player.cur(), box = gid('full'); if (!box) return;
      if (!t.videoId) { box.innerHTML = ''; return; }
      const liked = Store.isLiked(t.videoId);
      const on = Player.audio && !Player.audio.paused;
      box.innerHTML =
        '<div class="bg" style="background-image:url(' + JSON.stringify(img(t.thumbnail)) + ')"></div><div class="scrim"></div>' +
        '<div class="inner" style="max-width:560px;margin:0 auto;width:100%">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;padding:calc(16px + var(--safe-t)) 0 10px">' +
            '<button class="iconbtn ib-40" style="border-radius:50%;background:rgba(255,255,255,.1);border-color:transparent" onclick="Views.Full.close()"><i data-lucide="chevron-down"></i></button>' +
            '<div style="text-align:center;min-width:0"><div style="font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--txt3);font-weight:700">Sedang diputar</div>' +
            '<div style="font-size:12.5px;font-weight:700;margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(t.album || 'MusikFarX!') + '</div></div>' +
            '<button class="iconbtn ib-40" style="border-radius:50%;background:rgba(255,255,255,.1);border-color:transparent" onclick="Views.Full.menu()"><i data-lucide="ellipsis-vertical"></i></button>' +
          '</div>' +
          '<div style="flex:1;display:flex;align-items:center;justify-content:center;min-height:0;padding:10px 0">' +
            '<img class="art" src="' + esc(img(t.thumbnail)) + '" onerror="this.src=\'/icon.png\'">' +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:14px;margin-bottom:12px">' +
            '<div style="flex:1;min-width:0">' +
              '<div style="font-size:21px;font-weight:800;letter-spacing:-.035em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(t.title) + '</div>' +
              '<div class="muted" style="font-size:13.5px;margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(t.artist || '') + '</div></div>' +
            '<button class="iconbtn ib-40" style="border-radius:50%;border-color:transparent;background:transparent" onclick="Act.like(Player.cur());Views.Full.render();Views.Mini.render()">' +
              '<i data-lucide="heart" style="width:23px;height:23px;' + (liked ? 'fill:#fff;color:#fff' : 'color:var(--txt3)') + '"></i></button>' +
          '</div>' +
          '<input id="f-seek" class="seek" type="range" min="0" max="1000" value="0" oninput="Views.Full.scrub(this)">' +
          '<div style="display:flex;justify-content:space-between;margin-top:8px;font-size:11px" class="muted"><span id="f-cur">0:00</span><span id="f-dur">' + esc(t.duration || '0:00') + '</span></div>' +
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-top:18px">' +
            '<button class="iconbtn ib-40" style="border-radius:50%;border-color:transparent;background:transparent" onclick="Player.shuffle=!Player.shuffle;Toast.show(\'Acak \'+(Player.shuffle?\'aktif\':\'nonaktif\'),\'shuffle\');Views.Full.render()">' +
              '<i data-lucide="shuffle" style="width:19px;height:19px;' + (Player.shuffle ? 'color:var(--brand)' : 'color:var(--txt3)') + '"></i></button>' +
            '<button class="iconbtn" style="width:46px;height:46px;border-radius:50%;border-color:transparent;background:transparent" onclick="Player.prev()"><i data-lucide="skip-back" style="width:25px;height:25px;fill:#fff"></i></button>' +
            '<button class="play-lg" onclick="Player.toggle()">' + (Player.loading
              ? '<span class="cspin" style="width:24px;height:24px"></span>'
              : '<i data-lucide="' + (on ? 'pause' : 'play') + '"' + (on ? '' : ' style="margin-left:3px"') + '></i>') + '</button>' +
            '<button class="iconbtn" style="width:46px;height:46px;border-radius:50%;border-color:transparent;background:transparent" onclick="Player.next()"><i data-lucide="skip-forward" style="width:25px;height:25px;fill:#fff"></i></button>' +
            '<button class="iconbtn ib-40" style="border-radius:50%;border-color:transparent;background:transparent" onclick="Views.Full.cycleRepeat()">' +
              '<i data-lucide="' + (Player.repeat === 'one' ? 'repeat-1' : 'repeat') + '" style="width:19px;height:19px;' + (Player.repeat !== 'off' ? 'color:var(--brand)' : 'color:var(--txt3)') + '"></i></button>' +
          '</div>' +
          '<div style="display:flex;align-items:center;justify-content:center;gap:14px;margin-top:16px">' +
            '<button class="iconbtn" style="width:46px;height:46px;border-radius:50%;border-color:transparent;background:rgba(255,255,255,.05)" onclick="Views.Lyrics.toggle()"><i data-lucide="mic-vocal"></i></button>' +
            '<button class="iconbtn" id="f-qbtn" style="width:46px;height:46px;border-radius:50%;border-color:transparent;background:rgba(255,255,255,.05)" onclick="Views.Full.queueSheet()"><i data-lucide="list-music"></i></button>' +
            '<button class="iconbtn" style="width:46px;height:46px;border-radius:50%;border-color:transparent;background:rgba(255,255,255,.05)" onclick="downloadTrack(Player.cur())"><i data-lucide="download"></i></button>' +
            '<button class="iconbtn" style="width:46px;height:46px;border-radius:50%;border-color:transparent;background:rgba(255,255,255,.05)" onclick="Views.Full.volume()"><i data-lucide="volume-2"></i></button>' +
          '</div>' +
          '<div id="f-lyrics" style="margin-top:16px;max-height:32%;overflow-y:auto" class="hide-scroll"></div>' +
        '</div>';
      icons(); this.updateQueueBtn(); this.progress();
    },
    scrub(el) { const dur = Player.audio.duration; if (dur) Player.seek((el.value / 1000) * dur); },
    cycleRepeat() {
      Player.repeat = Player.repeat === 'off' ? 'all' : Player.repeat === 'all' ? 'one' : 'off';
      Toast.show('Ulang: ' + (Player.repeat === 'off' ? 'nonaktif' : Player.repeat === 'all' ? 'semua lagu' : 'satu lagu'), 'repeat');
      this.render();
    },
    volume() {
      Sheet.open('<h3 style="font-size:16px;font-weight:800;padding:0 6px 16px">Volume</h3>' +
        '<input class="seek" type="range" min="0" max="100" value="' + Math.round(Player.audio.volume * 100) + '" oninput="Player.vol(this.value/100)">' +
        '<div class="sitem" onclick="Sheet.close();Player.vol(0)"><i data-lucide="volume-x"></i>Bisu</div>' +
        '<div class="sitem" onclick="Sheet.close();Player.vol(1)"><i data-lucide="volume-2"></i>Maksimum</div>');
    },
    menu() {
      const t = Player.cur();
      Sheet.open('<div style="display:flex;gap:14px;align-items:center;padding:4px 6px 16px">' +
        '<img src="' + esc(img(t.thumbnail)) + '" style="width:56px;height:56px;border-radius:15px;object-fit:cover" onerror="this.src=\'/icon.png\'">' +
        '<div style="min-width:0"><div style="font-size:15px;font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(t.title) + '</div>' +
        '<div class="muted" style="font-size:12.5px;margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(t.artist || '') + '</div></div></div>' +
        '<div class="sitem" onclick="Sheet.close();Views.Full.queueSheet()"><i data-lucide="list-music"></i>Lihat antrean</div>' +
        '<div class="sitem" onclick="Sheet.close();Act.addPl(Player.cur())"><i data-lucide="folder-plus"></i>Tambah ke playlist</div>' +
        '<div class="sitem" onclick="Sheet.close();Act.like(Player.cur());Views.Full.render();Views.Mini.render()"><i data-lucide="heart"></i>' + (Store.isLiked(t.videoId) ? 'Hapus dari Disukai' : 'Sukai lagu') + '</div>' +
        '<div class="sitem" onclick="Sheet.close();downloadTrack(Player.cur())"><i data-lucide="download"></i>Unduh MP3</div>' +
        '<div class="sitem" onclick="Sheet.close();Act.copy(Player.cur())"><i data-lucide="link"></i>Salin tautan</div>' +
        '<div class="sitem" onclick="Sheet.close();Act.searchFor(Player.cur().title)"><i data-lucide="search"></i>Cari lagu serupa</div>');
    },
    queueSheet() {
      const q = Player.queue;
      Sheet.open('<h3 style="font-size:16px;font-weight:800;padding:0 6px 14px">Antrean · ' + q.length + ' lagu</h3>' +
        (q.length ? q.map((t, i) =>
          '<div class="sitem" style="' + (i === Player.index ? 'background:rgba(255,255,255,.07)' : '') + '" onclick="Sheet.close();Player.playAt(' + i + ')">' +
          '<img src="' + esc(img(t.thumbnail)) + '" style="width:40px;height:40px;border-radius:11px;object-fit:cover" onerror="this.src=\'/icon.png\'">' +
          '<div style="min-width:0"><div style="font-size:13.5px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(t.title) + '</div>' +
          '<div class="muted" style="font-size:11.5px">' + esc(t.artist || '') + '</div></div>' +
          (i === Player.index ? '<i data-lucide="play" style="margin-left:auto;color:var(--brand)"></i>' : '') + '</div>').join('')
          : '<p class="muted" style="font-size:13.5px">Antrean kosong.</p>'));
    },
    hideLyrics() { const l = gid('f-lyrics'); if (l) l.innerHTML = ''; }
  };

  /* ===================================================================
     LYRICS
     =================================================================== */
  V.Lyrics = {
    lines: [], open: false, loadedFor: '', syncedId: -1,
    reset() { this.lines = []; this.loadedFor = ''; this.syncedId = -1; this.hide(); },
    hide() { const l = gid('f-lyrics'); if (l) l.innerHTML = ''; },
    toggle() {
      const t = Player.cur(); if (!t.videoId) return;
      this.open = !this.open;
      if (this.open) this.load(t); else this.hide();
    },
    async load(t) {
      const box = gid('f-lyrics'); if (!box) return;
      if (this.loadedFor === t.videoId) return;
      this.loadedFor = t.videoId;
      box.innerHTML = '<p class="muted" style="font-size:12.5px;text-align:center;padding:16px">Memuat lirik…</p>';
      const my = t.videoId;
      const r = await API.lyrics(t.videoId, t.title, t.artist);
      if (this.loadedFor !== my || !gid('f-lyrics')) return;
      const L = r && r.result && r.result.lyrics;
      const raw = L && Array.isArray(L.lines) ? L.lines : [];
      if (!raw.length) {
        box.innerHTML = '<p class="muted" style="font-size:12.5px;text-align:center;padding:16px">Lirik tidak tersedia untuk lagu ini.</p>';
        return;
      }
      this.lines = raw.map((x) => ({ t: (x.time != null ? x.time : x.t != null ? x.t : null), s: x.text || x.line || '' })).filter((x) => x.s);
      this.syncedId = -1;
      box.innerHTML = '<div style="font-size:10.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--txt3);font-weight:700;margin-bottom:10px">Lirik</div>' +
        '<div id="lscroll">' + this.lines.map((x, i) =>
          '<div class="lyr" id="lyr-' + i + '" onclick="Views.Lyrics.jump(' + i + ')">' + esc(x.s) + '</div>').join('') + '</div>';
      this.sync(Player.audio.currentTime);
    },
    jump(i) { const x = this.lines[i]; if (x && x.t != null) Player.seek(x.t); },
    sync(cur) {
      if (!this.open || !this.lines.length) return;
      let idx = -1;
      for (let i = 0; i < this.lines.length; i++) { const t = this.lines[i].t; if (t == null) continue; if (t <= cur + 0.35) idx = i; else break; }
      if (idx < 0) idx = 0;
      if (idx === this.syncedId) return;
      this.syncedId = idx;
      this.lines.forEach((x, i) => { const el = gid('lyr-' + i); if (el) el.className = 'lyr' + (i === idx ? ' act' : i < idx ? ' past' : ''); });
      const act = gid('lyr-' + idx), sc = gid('lscroll');
      if (act && sc) { try { sc.scrollTo({ top: act.offsetTop - sc.clientHeight / 2 + act.clientHeight / 2, behavior: 'smooth' }); } catch (e) {} }
    }
  };

  V.syncLike = function () {
    if (App.view === 'liked') V.Liked.render();
    if (App.view === 'library') V.Library.render();
    const mini = gid('mini'); if (mini && !mini.hidden) V.Mini.render();
  };

  window.Views = V;
})();
