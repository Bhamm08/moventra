/* ==========================================================
   MOVENTRA – script.js
   Bagian A : Struct, Array, Pointer (struktur data)
   Bagian B : Sorting + log (console)
   Bagian C : Searching + log (console)
   Bagian D : Data & pembuat jadwal
   Bagian E : Tampilan / UI
   Buka DevTools > Console (F12) untuk melihat log sorting & searching.
   ========================================================== */
'use strict';

/* ---------- A. STRUCT, ARRAY, POINTER ---------- */
// STRUCT: kumpulan field tetap, dibuat lewat factory lalu di-seal (tidak bisa tambah/hapus field)
const Ticket = (id, mode, op, code, from, to, dep, dur, price, rating, seats, perks, kelas) =>
  Object.seal({ id, mode, op, code, from, to, dep, dur, price, rating, seats, perks, kelas });
const Booking = (pnr, ticket, date, pax, total, method, contact, passengers) =>
  Object.seal({ pnr, ticket, date, pax, total, method, contact, passengers });

// ARRAY: kumpulan Ticket / Booking
let tickets = [];          // hasil jadwal untuk pencarian aktif
let bookings = [];         // seluruh pesanan

// POINTER: variabel referensi ke objek yang sama di memori (bukan salinan)
let selected = null;       // menunjuk ke satu Ticket di dalam array `tickets`
let current = null;        // menunjuk ke Booking yang sedang dibuka

// POINTER (linked list): tiap node menunjuk ke node berikutnya lewat `next`
class ListNode { constructor(data) { this.data = data; this.next = null; } }
class RecentSearches {            // riwayat pencarian terakhir
  constructor() { this.head = null; this.size = 0; }
  push(data) {             // sisipkan di depan: node baru menunjuk ke head lama
    const n = new ListNode(data); n.next = this.head; this.head = n;
    if (++this.size > 5) { let p = this.head; while (p.next.next) p = p.next; p.next = null; this.size--; }
  }
  toArray() { const out = []; for (let p = this.head; p; p = p.next) out.push(p.data); return out; }
}
const searchHistory = new RecentSearches();

/* ---------- B. SORTING (log tampil di console) ---------- */
const val = (t, k) => (typeof t === 'object' ? t[k] : t);
const brief = (a, k) => a.map(x => val(x, k)).join(' | ');

function bubbleSort(src, key, asc = true) {            // O(n²)
  const a = src.slice(); let cmp = 0, swp = 0;
  console.group(`%c[SORT] Bubble Sort – ${key} ${asc ? 'naik' : 'turun'} (${a.length} data)`, 'color:#0F9D8A;font-weight:700');
  console.log('Awal  :', brief(a, key));
  for (let i = 0; i < a.length - 1; i++) {
    let tukar = false;
    for (let j = 0; j < a.length - 1 - i; j++) {
      cmp++;
      if (asc ? a[j][key] > a[j + 1][key] : a[j][key] < a[j + 1][key]) { [a[j], a[j + 1]] = [a[j + 1], a[j]]; swp++; tukar = true; }
    }
    console.log(`Pass ${i + 1}:`, brief(a, key));
    if (!tukar) break;
  }
  console.log(`Selesai → perbandingan: ${cmp}, pertukaran: ${swp}`); console.groupEnd(); return a;
}
function selectionSort(src, key, asc = true) {          // O(n²)
  const a = src.slice(); let cmp = 0, swp = 0;
  console.group(`%c[SORT] Selection Sort – ${key} ${asc ? 'naik' : 'turun'} (${a.length} data)`, 'color:#0F9D8A;font-weight:700');
  for (let i = 0; i < a.length - 1; i++) {
    let m = i;
    for (let j = i + 1; j < a.length; j++) { cmp++; if (asc ? a[j][key] < a[m][key] : a[j][key] > a[m][key]) m = j; }
    if (m !== i) { [a[i], a[m]] = [a[m], a[i]]; swp++; }
    console.log(`Langkah ${i + 1}: pilih indeks ${m} (nilai ${a[i][key]}) → posisi ${i}`);
  }
  console.log('Hasil :', brief(a, key)); console.log(`Selesai → perbandingan: ${cmp}, pertukaran: ${swp}`); console.groupEnd(); return a;
}
const SORTERS = {   // pilihan urutan di UI → algoritma yang dipakai
  price:     a => bubbleSort(a, 'price', true),      // Termurah
  priceDesc: a => bubbleSort(a, 'price', false),     // Termahal
  dur:       a => selectionSort(a, 'dur', true),     // Tercepat
  dep:       a => selectionSort(a, 'dep', true),     // Berangkat awal
  depDesc:   a => selectionSort(a, 'dep', false)     // Berangkat akhir
};

/* ---------- C. SEARCHING (log tampil di console) ---------- */
function linearSearch(arr, test, label) {               // O(n) – hasil bisa banyak
  const hit = [];
  console.group(`%c[SEARCH] Linear Search – ${label}`, 'color:#FF6B4A;font-weight:700');
  for (let i = 0; i < arr.length; i++) {
    const ok = test(arr[i]);
    console.log(`indeks ${i}: ${ok ? 'COCOK ✔' : 'tidak cocok'}`);
    if (ok) hit.push(arr[i]);
  }
  console.log(`Selesai → ${hit.length} ditemukan dari ${arr.length} data`); console.groupEnd(); return hit;
}
function binarySearch(arr, target, key, label) {        // O(log n) – array HARUS sudah terurut
  let lo = 0, hi = arr.length - 1, step = 0;
  console.group(`%c[SEARCH] Binary Search – ${label}`, 'color:#FF6B4A;font-weight:700');
  while (lo <= hi) {
    const mid = (lo + hi) >> 1; step++;
    console.log(`Langkah ${step}: lo=${lo}, hi=${hi}, mid=${mid} → ${arr[mid][key]} ${arr[mid][key] === target ? '== ' : arr[mid][key] < target ? '< ' : '> '}${target}`);
    if (arr[mid][key] === target) { console.log('Ditemukan di indeks', mid); console.groupEnd(); return arr[mid]; }
    arr[mid][key] < target ? lo = mid + 1 : hi = mid - 1;
  }
  console.log('Tidak ditemukan'); console.groupEnd(); return null;
}

/* ---------- D. DATA & PEMBUAT JADWAL ---------- */
const ISL = { sumatra: 'Sumatra', jawa: 'Jawa', bali: 'Bali', ntb: 'Nusa Tenggara', ntt: 'Nusa Tenggara', kalimantan: 'Kalimantan', sulawesi: 'Sulawesi', maluku: 'Maluku', papua: 'Papua' };
const CITIES = [   // x = posisi kasar barat → timur, dipakai untuk memperkirakan jarak
  { code: 'BTJ', name: 'Banda Aceh', isl: 'sumatra', x: -14 }, { code: 'KNO', name: 'Medan', isl: 'sumatra', x: -9 },
  { code: 'PDG', name: 'Padang', isl: 'sumatra', x: -7.5 }, { code: 'PKU', name: 'Pekanbaru', isl: 'sumatra', x: -6.5 },
  { code: 'PLM', name: 'Palembang', isl: 'sumatra', x: -4 }, { code: 'TKG', name: 'Bandar Lampung', isl: 'sumatra', x: -1.5 },
  { code: 'CGK', name: 'Jakarta', isl: 'jawa', x: 0 }, { code: 'BDO', name: 'Bandung', isl: 'jawa', x: 1 },
  { code: 'CBN', name: 'Cirebon', isl: 'jawa', x: 2.4 }, { code: 'SRG', name: 'Semarang', isl: 'jawa', x: 4 },
  { code: 'SOC', name: 'Solo', isl: 'jawa', x: 4.8 }, { code: 'YIA', name: 'Yogyakarta', isl: 'jawa', x: 5 },
  { code: 'SUB', name: 'Surabaya', isl: 'jawa', x: 7 }, { code: 'MLG', name: 'Malang', isl: 'jawa', x: 7.6 },
  { code: 'BWX', name: 'Banyuwangi', isl: 'jawa', x: 8.6 }, { code: 'DPS', name: 'Bali', isl: 'bali', x: 9.6 },
  { code: 'LOP', name: 'Lombok', isl: 'ntb', x: 10.5 }, { code: 'LBJ', name: 'Labuan Bajo', isl: 'ntt', x: 11.6 },
  { code: 'KOE', name: 'Kupang', isl: 'ntt', x: 13.8 }, { code: 'PNK', name: 'Pontianak', isl: 'kalimantan', x: 3 },
  { code: 'BDJ', name: 'Banjarmasin', isl: 'kalimantan', x: 8.6 }, { code: 'BPN', name: 'Balikpapan', isl: 'kalimantan', x: 10.8 },
  { code: 'UPG', name: 'Makassar', isl: 'sulawesi', x: 12.5 }, { code: 'MDC', name: 'Manado', isl: 'sulawesi', x: 15.5 },
  { code: 'AMQ', name: 'Ambon', isl: 'maluku', x: 17 }, { code: 'DJJ', name: 'Jayapura', isl: 'papua', x: 22 }
];
const OPS = {
  flight: [['Citilink', 'QG', '#4CAF50'], ['Garuda Indonesia', 'GA', '#1F6FEB'], ['Batik Air', 'ID', '#C2185B'], ['Super Air Jet', 'IU', '#F9A825'], ['Lion Air', 'JT', '#D32F2F']],
  train:  [['Argo Bromo', 'KA', '#0F9D8A'], ['Taksaka', 'KA', '#7B1FA2'], ['Sancaka', 'KA', '#EF6C00'], ['Gajayana', 'KA', '#1565C0']],
  bus:    [['Sinar Jaya', 'SJ', '#D84315'], ['Rosalia Indah', 'RI', '#2E7D32'], ['Pahala Kencana', 'PK', '#6A1B9A'], ['Damri', 'DM', '#00838F']],
  ferry:  [['ASDP Indonesia', 'AS', '#0277BD'], ['Pelni', 'PL', '#283593'], ['Marina Express', 'MX', '#00897B']]
};
const MODE_NAME = { flight: 'Pesawat', train: 'Kereta Api', bus: 'Bus & Shuttle', ferry: 'Kapal Ferry' };
const PERKS = {
  flight: ['Bagasi 20 kg', 'Kabin 7 kg', 'Snack gratis', 'Colokan USB', 'Wi-Fi', 'Makanan hangat'],
  train:  ['Kursi reclining', 'Colokan listrik', 'Selimut', 'Makanan ringan', 'AC'],
  bus:    ['Toilet', 'Reclining seat', 'Selimut', 'Colokan USB', 'AC'],
  ferry:  ['Kabin kelas', 'Ruang lesehan', 'Kantin', 'Dek terbuka']
};
const KELAS = { flight: ['Ekonomi', 'Premium Ekonomi'], train: ['Eksekutif', 'Bisnis', 'Ekonomi'], bus: ['Executive 2-2', 'VIP AC 2-2', 'Sleeper 1-1'], ferry: ['Ekonomi', 'Kabin VIP'] };
const rupiah = n => 'Rp ' + Math.round(n).toLocaleString('id-ID');
const hhmm = m => { m = ((m % 1440) + 1440) % 1440; return String(m / 60 | 0).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
const dur = m => (m / 60 | 0) + 'j ' + (m % 60 ? m % 60 + 'm' : '');
const iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const fmtDate = (s, o) => new Date(s + 'T00:00').toLocaleDateString('id-ID', o || { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const hash = s => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
const rng = seed => () => (seed = Math.imul(seed ^ (seed >>> 15), 2246822507) + 1013904223 >>> 0) / 4294967296;

function supports(mode, a, b) {
  if (a.code === b.code) return false;
  if (mode === 'flight') return true;
  const jb = c => c.isl === 'jawa' || c.isl === 'bali';
  if (mode === 'train') return a.isl === 'jawa' && b.isl === 'jawa';
  if (mode === 'bus') return a.isl === b.isl || (jb(a) && jb(b));
  const sea = c => ['bali', 'ntb', 'ntt', 'jawa'].includes(c.isl);   // kapal ferry
  return sea(a) && sea(b) && !(a.isl === 'jawa' && b.isl === 'jawa');
}
function buildTickets(mode, a, b, date) {
  const r = rng(hash(mode + a.code + b.code + date)), dist = Math.abs(a.x - b.x) * 160 + 120, out = [];
  const speed = { flight: 700, train: 85, bus: 55, ferry: 30 }[mode], base = { flight: 0.5, train: 0.5, bus: 0.28, ferry: 0.45 }[mode];
  const ops = OPS[mode], n = 8 + (r() * 4 | 0), weekend = [0, 5, 6].includes(new Date(date + 'T00:00').getDay());
  for (let i = 0; i < n; i++) {
    const [name, pre, color] = ops[i % ops.length];
    const d = Math.round((dist / speed * 60 + (mode === 'flight' ? 35 : 0)) * (0.92 + r() * 0.2) / 5) * 5;
    const price = Math.round(((dist * base * 1000 + 60000) * (0.8 + r() * 0.55) * (weekend ? 1.12 : 1)) / 1000) * 1000;
    const perks = PERKS[mode].filter(() => r() > 0.45).slice(0, 3);
    out.push(Ticket(mode + i, mode, { name, color, pre }, pre + '-' + (100 + (r() * 900 | 0)), a, b,
      300 + Math.round(r() * 17 * 60 / 5) * 5, d, price, +(4 + r() * 0.9).toFixed(1), 2 + (r() * 30 | 0), perks.length ? perks : [PERKS[mode][0]], KELAS[mode][r() * KELAS[mode].length | 0]));
  }
  return out;
}

function buildAll(a, b, date) {   // gabungan jadwal semua moda yang tersedia untuk rute
  return Object.keys(MODE_NAME).filter(m => supports(m, a, b)).flatMap(m => buildTickets(m, a, b, date));
}
/* ---------- E. UI ---------- */
const state = { selId: null, cur: null, mode: 'all', from: null, to: null, date: '', pax: 1, sort: 'price', times: new Set(), ops: new Set(), max: 0, q: '', promo: '', pay: 'QRIS', ins: false, bag: false };
const toastEl = $('#toast'); let toastT;
const toast = m => { toastEl.textContent = m; toastEl.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('on'), 2400); };

/* ilustrasi SVG (tanpa gambar eksternal) */
function art(theme, seed) {
  const r = rng(hash(theme + seed)), pal = {
    gunung: ['#FFD59A', '#FF8F6B', '#1F6F6B', '#0B3B3A'], laut: ['#BDEBFF', '#4FC3F7', '#0277BD', '#014A75'],
    kota: ['#C9D6FF', '#7C8CF8', '#3B3F8C', '#1E1F4B'], candi: ['#FFE29A', '#FFA45B', '#8A4B2A', '#3E1F13'],
    pantai: ['#FFE7B8', '#FFB86B', '#12A4A0', '#075E63'], danau: ['#D7F5E3', '#62C9A6', '#177E6A', '#0B4A40']
  }[theme] || ['#ddd', '#aaa', '#555', '#222'];
  let s = `<svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="g${seed}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${pal[0]}"/><stop offset="1" stop-color="${pal[1]}"/></linearGradient></defs><rect width="400" height="200" fill="url(#g${seed})"/><circle cx="${90 + r() * 220 | 0}" cy="${46 + r() * 20 | 0}" r="22" fill="#fff" opacity=".85"/>`;
  if (theme === 'laut' || theme === 'pantai' || theme === 'danau') {
    s += `<path d="M0 120 Q60 ${100 + r() * 20} 120 118 T260 112 T400 120 V200 H0Z" fill="${pal[2]}" opacity=".55"/><path d="M0 150 Q80 ${135 + r() * 15} 160 150 T400 146 V200 H0Z" fill="${pal[2]}"/><path d="M0 176 Q100 160 200 176 T400 172 V200 H0Z" fill="${pal[3]}"/>`;
  } else if (theme === 'kota') {
    for (let i = 0; i < 14; i++) { const h = 40 + r() * 100; s += `<rect x="${i * 30}" y="${200 - h}" width="24" height="${h}" fill="${i % 2 ? pal[2] : pal[3]}"/>`; }
  } else {
    s += `<path d="M0 200 L0 140 L70 ${70 + r() * 20} L130 135 L210 ${50 + r() * 30} L290 140 L340 ${90 + r() * 20} L400 130 V200Z" fill="${pal[2]}"/><path d="M0 200 L0 170 L90 ${130 + r() * 15} L180 170 L260 ${120 + r() * 20} L400 170 V200Z" fill="${pal[3]}"/>`;
  }
  return s + '</svg>';
}
const POP = [
  { from: 'CGK', to: 'DPS', mode: 'flight', t: 'pantai', sub: 'Langsung, 1j 50m' },
  { from: 'CGK', to: 'YIA', mode: 'train', t: 'candi', sub: 'Kereta eksekutif' },
  { from: 'SUB', to: 'MLG', mode: 'bus', t: 'gunung', sub: 'Bus & shuttle' },
  { from: 'DPS', to: 'LOP', mode: 'ferry', t: 'laut', sub: 'Kapal cepat' }
];
const DEST = [['DPS', 'pantai', 'Pantai, pura, dan senja'], ['YIA', 'candi', 'Candi dan kuliner'], ['LOP', 'laut', 'Gili dan Mandalika'], ['MLG', 'gunung', 'Kota sejuk Bromo'], ['KNO', 'danau', 'Gerbang Danau Toba'], ['UPG', 'kota', 'Pintu timur Indonesia']];
const byCode = c => CITIES.find(x => x.code === c);
const minPrice = (m, a, b, d) => Math.min(...buildTickets(m, a, b, d).map(t => t.price));

function renderHome() {
  const cl = $('#cityList'); if (cl) cl.innerHTML = CITIES.map(c => `<option value="${c.name}">${c.code}</option>`).join('');
  const t3 = new Date(); t3.setDate(t3.getDate() + 3); const d = { value: iso(t3) };
  $$('.route-grid').forEach(g => g.innerHTML = POP.map((p, i) => {
    const a = byCode(p.from), b = byCode(p.to);
    return `<button class="route" data-i="${i}"><div class="art">${art(p.t, 'r' + i)}<span class="md">${MODE_NAME[p.mode]}</span></div><div class="bd"><h3>${a.name} <i>→</i> ${b.name}</h3><p>${p.sub}</p><span class="fr">Mulai dari<b class="num">${rupiah(minPrice(p.mode, a, b, d.value))}</b></span></div></button>`;
  }).join(''));
  const dg = $('#destGrid'); if (dg) dg.innerHTML = DEST.map((x, i) => `<a href="#home" data-c="${x[0]}">${art(x[1], 'd' + i)}<div><b>${byCode(x[0]).name}</b><small>${x[2]}</small></div></a>`).join('');
}

function setMode(m) {
  state.mode = m; saveState();
  $$('button[data-m]').forEach(b => { const on = b.dataset.m === m; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
}
function resolveCity(text) {          // pakai Linear Search untuk mencocokkan nama/kode kota
  const q = text.trim().toLowerCase(); if (!q) return null;
  return linearSearch(CITIES, c => c.name.toLowerCase() === q || c.code.toLowerCase() === q || c.name.toLowerCase().startsWith(q), `kota "${text}"`)[0] || null;
}
function showErr(msg) { const e = $('#formErr'); e.textContent = msg; e.hidden = !msg; }

function runSearch(e) {
  e && e.preventDefault();
  const a = resolveCity($('#fFrom').value), b = resolveCity($('#fTo').value);
  if (!a) return showErr('Kota asal belum dikenali. Pilih dari daftar, mis. Jakarta atau Surabaya.');
  if (!b) return showErr('Kota tujuan belum dikenali. Pilih dari daftar, mis. Bali atau Yogyakarta.');
  if (a.code === b.code) return showErr('Kota asal dan tujuan tidak boleh sama.');
  if (!$('#fDate').value) return showErr('Pilih tanggal keberangkatan.');
  showErr('');
  startSearch(a, b, $('#fDate').value, +$('#fPax').value);
}
function startSearch(a, b, date, pax) {
  Object.assign(state, { from: a, to: b, date, pax, times: new Set(), ops: new Set(), q: '', sort: 'price', selId: null });
  searchHistory.push({ from: a.code, to: b.code, mode: state.mode, date });
  console.log('%c[POINTER] Riwayat pencarian (linked list, head → next):', 'font-weight:700', searchHistory.toArray());
  go('pesan.html?cari=1');
}

function openResults() {
  if (!state.from) return go('pesan.html');
  const { from: a, to: b } = state;
  $('#resTitle').textContent = `${a.name} → ${b.name}`;
  $('#resMeta').textContent = `${fmtDate(state.date, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })} · ${state.pax} penumpang`;
  state.times.clear(); state.ops.clear(); state.q = '';
  tickets = filterMode(buildAll(a, b, state.date));
  const ops = [...new Set(tickets.map(t => t.op.name))];
  $('#fOps').innerHTML = ops.map(o => `<label><input type="checkbox" value="${o}"> ${o}<em>${tickets.filter(t => t.op.name === o).length}</em></label>`).join('');
  const mx = tickets.length ? Math.max(...tickets.map(t => t.price)) : 0, mn = tickets.length ? Math.min(...tickets.map(t => t.price)) : 0;
  const pr = $('#fPrice'); pr.min = mn; pr.max = mx; pr.step = 1000; pr.value = mx; state.max = mx;
  $('#priceOut').textContent = rupiah(mx);
  $('#qSearch').value = ''; $$('#fTime button').forEach(x => x.classList.remove('on'));
  $('#fFrom').value = a.name; $('#fTo').value = b.name; setDate(state.date); $('#fPax').value = state.pax || 1;
  setMode(state.mode); syncSort(); renderDates(); renderTickets();
}
const filterMode = l => l.filter(t => state.mode === 'all' || t.mode === state.mode);
const syncSort = () => $$('#sortPills button').forEach(b => b.classList.toggle('on', b.dataset.s === state.sort));
function renderDates() {
  const base = new Date(state.date + 'T00:00'); let h = '';
  for (let i = -2; i <= 4; i++) {
    const d = new Date(base); d.setDate(d.getDate() + i); const s = iso(d); if (s < iso(new Date())) continue;
    const l = filterMode(buildAll(state.from, state.to, s));
    h += `<button role="tab" class="${s === state.date ? 'on' : ''}" data-d="${s}"><small>${fmtDate(s, { weekday: 'short', day: 'numeric', month: 'short' })}</small><b class="num">${l.length ? rupiah(Math.min(...l.map(t => t.price))) : '–'}</b></button>`;
  }
  $('#dateStrip').innerHTML = h;
}
const slot = m => m < 600 ? 0 : m < 900 ? 1 : m < 1140 ? 2 : 3;

function renderTickets() {
  const box = $('#ticketList');
  if (!tickets.length) {
    box.innerHTML = `<div class="empty"><h3>Belum ada tiket ${state.mode === 'all' ? '' : MODE_NAME[state.mode].toLowerCase() + ' '}untuk rute ini</h3><p>Coba jenis lain atau ubah kota tujuan.</p><button class="btn" id="showAll">Tampilkan semua jenis</button></div>`;
    $('#resCount').textContent = 'Ditemukan 0 tiket'; return;
  }
  let list = tickets.filter(t => t.price <= state.max && (!state.times.size || state.times.has(slot(t.dep))) && (!state.ops.size || state.ops.has(t.op.name)));
  if (state.q.trim()) {      // pencarian operator / kode memakai Linear Search
    const q = state.q.trim().toLowerCase();
    list = linearSearch(list, t => t.op.name.toLowerCase().includes(q) || t.code.toLowerCase().includes(q), `"${state.q}"`);
  }
  list = SORTERS[state.sort](list);
  $('#resCount').textContent = `Ditemukan ${list.length} tiket`;
  if (!list.length) { box.innerHTML = `<div class="empty"><h3>Tidak ada tiket yang cocok</h3><p>Longgarkan filter untuk melihat lebih banyak pilihan.</p><button class="btn ghost" id="clearF">Hapus semua filter</button></div>`; return; }
  const cheapest = Math.min(...list.map(t => t.price));
  box.innerHTML = list.map(t => {
    const arr = t.dep + t.dur;
    return `<article class="tk"><div class="tk-h"><i style="background:${t.op.color}">${t.op.pre}</i><div><b>${t.op.name}</b><span class="badge">${MODE_NAME[t.mode]} · ${t.kelas}</span><small>${t.code}</small></div></div>
      <div class="tk-bar"><div><time>${hhmm(t.dep)}</time><small>${t.from.name}</small></div><div class="line">${dur(t.dur)}<div></div></div><div class="r"><time>${hhmm(arr)}${arr >= 1440 ? '<sup>+1</sup>' : ''}</time><small>${t.to.name}</small></div></div>
      <details><summary>Detail tiket & rute</summary><div class="det">${t.perks.map(p => `<span class="tag">${p}</span>`).join('')}<span>★ ${t.rating}</span>${t.seats <= 5 ? `<span class="tag warn">Sisa ${t.seats} kursi</span>` : `<span>${t.seats} kursi tersedia</span>`}<span>Langsung, tanpa transit</span></div></details>
      <div class="tk-f"><span>${fmtDate(state.date, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}${t.price === cheapest ? ' · Termurah' : ''}</span><div><span class="price">${rupiah(t.price)}<small> /orang</small></span><button class="btn" data-id="${t.id}">Pilih tiket</button></div></div></article>`;
  }).join('');
}

/* ----- checkout ----- */
function totals() {
  const t = selected, base = t.price * state.pax, ins = state.ins ? 29500 * state.pax : 0, bag = state.bag ? 120000 * state.pax : 0, fee = Math.round(base * 0.05);
  const disc = state.promo === 'MOVEFIRST' ? Math.min(350000, Math.round((base + fee) * 0.1)) : state.promo === 'HEMAT50' ? 50000 : 0;
  return { base, ins, bag, fee, disc, total: base + ins + bag + fee - disc };
}
let timerId, deadline;
function openCheckout() {
  if (!selected) return go('pesan.html');
  state.promo = ''; state.ins = state.bag = false; $('#optIns').checked = $('#optBag').checked = false; $('#coForm').reset();
  $('#paxCard').innerHTML = Array.from({ length: state.pax }, (_, i) => `<div class="pax-t"><h2>Penumpang ${i + 1}</h2></div><div class="row2"><label class="fld"><span>Nama sesuai identitas</span><input name="pn${i}" required placeholder="Nama lengkap"></label><label class="fld"><span>No. KTP / paspor</span><input name="pid${i}" required inputmode="numeric" minlength="8" placeholder="16 digit KTP"></label></div>`).join('');
  deadline = Date.now() + 15 * 60 * 1000; clearInterval(timerId); timerId = setInterval(tick, 1000); renderSummary();
}
function tick() {
  const s = Math.max(0, Math.round((deadline - Date.now()) / 1000)), el = $('#timer');
  if (el) el.textContent = String(s / 60 | 0).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  if (!s) { clearInterval(timerId); showModal('Waktu pemesanan habis', 'Jadwal dilepas kembali. Cari ulang untuk melanjutkan.', null, () => go('pesan.html?cari=1')); }
}
function renderSummary() {
  const t = selected, x = totals(), arr = t.dep + t.dur;
  $('#coSummary').innerHTML = `<div class="s-top"><small>${MODE_NAME[t.mode]} · ${fmtDate(state.date, { weekday: 'short', day: 'numeric', month: 'short' })}</small><div class="s-route"><b>${t.from.code}</b><span>→</span><b>${t.to.code}</b></div><small>${hhmm(t.dep)} – ${hhmm(arr)} · ${dur(t.dur)} · ${t.op.name} ${t.code}</small></div>
  <div class="s-bot"><dl><dt>Tiket ${t.price ? '(' + state.pax + 'x)' : ''}</dt><dd>${rupiah(x.base)}</dd><dt>Biaya layanan & pajak</dt><dd>${rupiah(x.fee)}</dd>${x.ins ? `<dt>Asuransi</dt><dd>${rupiah(x.ins)}</dd>` : ''}${x.bag ? `<dt>Bagasi tambahan</dt><dd>${rupiah(x.bag)}</dd>` : ''}${x.disc ? `<dt class="ok">Promo ${state.promo}</dt><dd class="ok">− ${rupiah(x.disc)}</dd>` : ''}</dl>
  <div class="promo-in"><input id="promoIn" placeholder="Kode promo" value="${state.promo}" aria-label="Kode promo"><button type="button" class="btn ghost sm" id="applyPromo">Pakai</button></div>
  <div class="total"><small>Total bayar</small><b class="num">${rupiah(x.total)}</b></div><button class="btn coral full lg" type="submit">Bayar sekarang</button><p class="timer">Selesaikan dalam <span id="timer" class="num">15:00</span></p></div>`;
}
function validate(f) {
  let ok = true;
  $$('.fld', f).forEach(w => {
    const i = $('input', w); let good = i.value.trim() !== '' && i.checkValidity();
    if (i.name === 'phone') good = /^(\+62|62|0)8\d{7,11}$/.test(i.value.replace(/[\s-]/g, ''));
    if (i.name.startsWith('pid')) good = /^\d{8,16}$/.test(i.value.trim());
    w.classList.toggle('bad', !good); if (!good) ok = false;
  });
  return ok;
}
function submitOrder(e) {
  e.preventDefault(); const f = e.target;
  if (!validate(f)) { toast('Lengkapi data yang ditandai merah.'); const b = $('.fld.bad input', f); b && b.focus(); return; }
  const x = totals(), fd = new FormData(f), pnr = 'MVT-' + (hash(Date.now() + fd.get('name')).toString(36).toUpperCase().slice(0, 6).padEnd(6, 'X'));
  const extra = state.pay === 'QRIS' ? `<div class="pay-box"><div class="qr" style="display:inline-block">${qrSVG(pnr)}</div></div>` : `<div class="pay-box"><small>${state.pay === 'Virtual Account' ? 'Nomor Virtual Account' : 'Referensi pembayaran'}</small><div class="pnr-code num">${'8808' + String(hash(pnr)).padStart(10, '0').slice(0, 10)}</div></div>`;
  showModal(`Bayar ${rupiah(x.total)}`, `Metode: ${state.pay}. Ini simulasi, tidak ada uang yang ditarik.`, extra, () => {
    const pas = Array.from({ length: state.pax }, (_, i) => ({ name: fd.get('pn' + i), id: fd.get('pid' + i) }));
    const bk = Booking(pnr, selected, state.date, state.pax, x.total, state.pay, { name: fd.get('name'), phone: fd.get('phone'), email: fd.get('email') }, pas);
    bookings.push(bk); save(); clearInterval(timerId); state.cur = bk.pnr; go('pesanan.html');
  }, 'Saya sudah bayar');
}

/* ----- pesanan & e-tiket ----- */
function qrSVG(text) {
  const n = 25, r = rng(hash(text)), cells = []; const fin = (x, y) => (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    if (fin(x, y)) { const ox = x > 8 ? n - 7 : 0, oy = y > 8 ? n - 7 : 0, dx = x - ox, dy = y - oy; if (dx >= 0 && dx < 7 && dy >= 0 && dy < 7 && (dx === 0 || dx === 6 || dy === 0 || dy === 6 || (dx > 1 && dx < 5 && dy > 1 && dy < 5))) cells.push(`<rect x="${x}" y="${y}" width="1" height="1"/>`); }
    else if (r() > 0.52) cells.push(`<rect x="${x}" y="${y}" width="1" height="1"/>`);
  }
  return `<svg viewBox="-1 -1 ${n + 2} ${n + 2}" shape-rendering="crispEdges" fill="#14232B" role="img" aria-label="Kode QR ${text}">${cells.join('')}</svg>`;
}
const save = () => { try { localStorage.setItem('moventra.bookings', JSON.stringify(bookings)); } catch (e) { } };
const load = () => { try { bookings = (JSON.parse(localStorage.getItem('moventra.bookings') || '[]')).map(b => { b.ticket.from = byCode(b.ticket.from.code); b.ticket.to = byCode(b.ticket.to.code); return Booking(b.pnr, Ticket(...['id', 'mode', 'op', 'code', 'from', 'to', 'dep', 'dur', 'price', 'rating', 'seats', 'perks', 'kelas'].map(k => b.ticket[k])), b.date, b.pax, b.total, b.method, b.contact, b.passengers); }); } catch (e) { bookings = []; } };

function openOrders() {
  $('#pnrErr').hidden = true; $('#ordList').innerHTML = '';
  if (current) { showTicket(current); toast('Pembayaran berhasil. E-tiket sudah terbit.'); $('#ordTitle').textContent = 'E-tiket kamu siap'; $('#ordSub').textContent = 'Tunjukkan kode QR saat check-in.'; $('#pnrIn').value = ''; return; }
  $('#ticketView').innerHTML = ''; $('#ordTitle').textContent = 'Pesanan saya'; $('#ordSub').textContent = 'Masukkan kode booking untuk melihat e-tiketmu.';
  $('#ordList').innerHTML = bookings.slice().reverse().map(b => `<button class="ord" data-pnr="${b.pnr}"><div><b>${b.ticket.from.name} → ${b.ticket.to.name}</b><small>${fmtDate(b.date, { day: 'numeric', month: 'short', year: 'numeric' })} · ${b.ticket.op.name} · ${b.pnr}</small></div><em>Lihat tiket</em></button>`).join('');
}
function showTicket(b) {
  const t = b.ticket, arr = t.dep + t.dur;
  $('#ticketView').innerHTML = `<div class="eticket"><div class="et-l"><div class="et-top"><div class="op"><i style="background:${t.op.color}">${t.op.pre}</i><div><b>${t.op.name}</b><small>${t.code} · ${MODE_NAME[t.mode]}</small></div></div><span class="tag ok">Terkonfirmasi</span></div>
  <div class="et-big"><div><b>${t.from.code}</b><small>${t.from.name} · ${hhmm(t.dep)}</small></div><div class="line">${dur(t.dur)}<div></div>Langsung</div><div class="r"><b>${t.to.code}</b><small>${t.to.name} · ${hhmm(arr)}</small></div></div>
  <div class="et-info"><div><small>Tanggal</small><b>${fmtDate(b.date, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</b></div><div><small>Penumpang</small><b>${b.passengers.map(p => p.name).join(', ')}</b></div><div><small>Pembayaran</small><b>${b.method}</b></div><div><small>Total</small><b>${rupiah(b.total)}</b></div></div></div>
  <div class="et-r"><div class="qr">${qrSVG(b.pnr)}</div><div><small class="muted">Kode booking</small><div class="pnr-code">${b.pnr}</div></div><div class="et-acts"><button class="btn sm" onclick="window.print()">Cetak</button><button class="btn ghost sm" id="shareT">Bagikan</button></div></div></div>
  <button class="btn ghost" id="backOrders">Lihat semua pesanan</button>`;
}
function lookupPNR(e) {
  e.preventDefault(); const q = $('#pnrIn').value.trim().toUpperCase(), err = $('#pnrErr'); current = null;
  if (!q) { err.textContent = 'Masukkan kode booking terlebih dahulu.'; err.hidden = false; return; }
  const sorted = selectionSort(bookings, 'pnr', true);            // Binary Search butuh data terurut
  const hit = binarySearch(sorted, q, 'pnr', `kode booking ${q}`);
  if (!hit) { err.textContent = `Kode ${q} tidak ditemukan. Periksa lagi kode di email konfirmasimu.`; err.hidden = false; $('#ticketView').innerHTML = ''; return; }
  err.hidden = true; current = hit; $('#ordList').innerHTML = ''; showTicket(hit);
}

/* ----- modal ----- */
let modalAct = null;
function showModal(title, body, extra, act, label) {
  $('#mTitle').textContent = title; $('#mBody').textContent = body; $('#mExtra').innerHTML = extra || ''; $('#mClose').textContent = label || 'Tutup';
  modalAct = act; $('#modal').hidden = false; $('#mClose').focus();
}
const closeModal = () => { $('#modal').hidden = true; const a = modalAct; modalAct = null; a && a(); };

/* ----- pilih kota (saran) & kalender ----- */
function setDate(v) {
  $('#fDate').value = v || ''; const b = $('#dateBtn');
  b.textContent = v ? fmtDate(v, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : 'Pilih tanggal'; b.classList.toggle('empty', !v);
}
function showSuggest(inp) {
  const sg = $('#sg' + inp.id.slice(1)), other = ($(inp.id === 'fFrom' ? '#fTo' : '#fFrom').value || '').trim().toLowerCase();
  let q = inp.value.trim().toLowerCase(); if (CITIES.some(c => c.name.toLowerCase() === q)) q = '';
  $$('.suggest').forEach(x => x.hidden = x !== sg); $('#calBox').hidden = true;
  const list = CITIES.filter(c => c.name.toLowerCase() !== other && (!q || c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)));
  sg.innerHTML = list.length ? list.map(c => `<button type="button" data-c="${c.code}"><b>${c.name}</b><small>${c.code} · ${ISL[c.isl]}</small></button>`).join('') : '<p>Kota tidak ditemukan. Coba nama lain.</p>';
  sg.hidden = false;
}
const cal = { y: 0, m: 0 };
function renderCal() {
  const sel = $('#fDate').value, today = iso(new Date()), now = new Date(), off = (new Date(cal.y, cal.m, 1).getDay() + 6) % 7, days = new Date(cal.y, cal.m + 1, 0).getDate();
  let g = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map(d => `<span class="wd">${d}</span>`).join('') + '<i></i>'.repeat(off);
  for (let d = 1; d <= days; d++) { const s = iso(new Date(cal.y, cal.m, d)); g += `<button type="button" data-day="${s}" class="${s === sel ? 'on' : ''} ${s === today ? 'today' : ''}" ${s < today ? 'disabled' : ''}>${d}</button>`; }
  $('#calBox').innerHTML = `<div class="cal-h"><button type="button" data-nav="-1" aria-label="Bulan sebelumnya" ${cal.y === now.getFullYear() && cal.m === now.getMonth() ? 'disabled' : ''}>‹</button><b>${new Date(cal.y, cal.m, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</b><button type="button" data-nav="1" aria-label="Bulan berikutnya">›</button></div><div class="cal-g">${g}</div>`;
}
function toggleCal() {
  const box = $('#calBox'); $$('.suggest').forEach(x => x.hidden = true);
  if (!box.hidden) return (box.hidden = true);
  const d = new Date(($('#fDate').value || iso(new Date())) + 'T00:00'); cal.y = d.getFullYear(); cal.m = d.getMonth(); renderCal(); box.hidden = false;
}
const closePops = () => { $$('.suggest').forEach(x => x.hidden = true); const b = $('#calBox'); if (b) b.hidden = true; };

/* ----- navigasi antar halaman & penyimpanan state ----- */
function saveState() {
  try { sessionStorage.setItem('moventra.state', JSON.stringify({ mode: state.mode, from: state.from && state.from.code, to: state.to && state.to.code, date: state.date, pax: state.pax, sort: state.sort, selId: state.selId, cur: state.cur })); } catch (e) { }
}
function loadState() {
  try { const o = JSON.parse(sessionStorage.getItem('moventra.state') || 'null'); if (o) Object.assign(state, o, { from: byCode(o.from) || null, to: byCode(o.to) || null }); } catch (e) { }
}
const go = url => { saveState(); location.href = url; };
function init() {
  const page = document.body.dataset.page;
  if (page === 'book') {
    const qs = new URLSearchParams(location.search), q = byCode(qs.get('to')), m = qs.get('mode');
    if (!qs.get('cari')) {   // dibuka dari menu / beranda: form kosong, hanya jenis & tujuan yang terisi dari klik di beranda
      Object.assign(state, { from: null, to: q || null, date: '', sort: 'price', mode: (m === 'all' || MODE_NAME[m]) ? m : 'all' }); saveState();
    }
    if (state.date && state.date < iso(new Date())) state.date = '';
    $('#fFrom').value = state.from ? state.from.name : ''; $('#fTo').value = state.to ? state.to.name : '';
    setDate(state.date); $('#fPax').value = state.pax || 1; setMode(state.mode);
    const ready = !!(state.from && state.to && state.date);
    document.body.classList.toggle('no-search', !ready); $('#searchPanel').hidden = ready;
    if (ready) openResults();
  }
  else if (page === 'checkout') {
    if (!state.from || !state.selId) return go('pesan.html');
    tickets = buildAll(state.from, state.to, state.date); selected = tickets.find(t => t.id === state.selId);
    openCheckout();
  } else if (page === 'orders') {
    if (state.cur) { current = bookings.find(b => b.pnr === state.cur) || null; state.cur = null; saveState(); }
    openOrders();
  }
}

/* ----- event ----- */
document.addEventListener('click', e => {
  const c = s => e.target.closest(s);
  let el;
  if (!c('.field')) closePops();
  if ((el = c('.suggest button'))) {
    const inp = el.closest('.field').querySelector('input'), city = byCode(el.dataset.c); inp.value = city.name; closePops();
    if (inp.id === 'fFrom' && !$('#fTo').value) $('#fTo').focus(); else if (inp.id === 'fTo' && !$('#fDate').value) toggleCal();
  }
  else if ((el = c('#fFrom, #fTo'))) { if ($('#sg' + el.id.slice(1)).hidden) showSuggest(el); }
  else if (c('#dateBtn')) toggleCal();
  else if ((el = c('[data-nav]'))) { const d = new Date(cal.y, cal.m + +el.dataset.nav, 1); cal.y = d.getFullYear(); cal.m = d.getMonth(); renderCal(); }
  else if ((el = c('[data-day]'))) { setDate(el.dataset.day); closePops(); showErr(''); }
  else if ((el = c('button[data-m]'))) { setMode(el.dataset.m); if (!document.body.classList.contains('no-search')) openResults(); }
  else if ((el = c('#sortPills button'))) { state.sort = el.dataset.s; saveState(); syncSort(); renderTickets(); }
  else if ((el = c('.tile'))) setMode(el.dataset.mode);
  else if ((el = c('.route'))) { const p = POP[el.dataset.i], d = new Date(); d.setDate(d.getDate() + 3); setMode(p.mode); startSearch(byCode(p.from), byCode(p.to), iso(d), 1); }
  else if ((el = c('#destGrid a'))) { e.preventDefault(); go('pesan.html?to=' + el.dataset.c); }
  else if (c('#swapBtn')) { const a = $('#fFrom'), b = $('#fTo'); [a.value, b.value] = [b.value, a.value]; }
  else if ((el = c('.code'))) { navigator.clipboard && navigator.clipboard.writeText(el.dataset.code).catch(() => { }); toast('Kode ' + el.dataset.code + ' disalin.'); }
  else if (c('#btnLogin') || c('#btnRegister')) showModal('Segera hadir', 'Akun Moventra sedang disiapkan. Untuk sekarang kamu bisa memesan sebagai tamu.');
  else if (c('#burger')) { const o = $('#menu').classList.toggle('open'); $('#burger').setAttribute('aria-expanded', o); }
  else if ((el = c('#editSearch'))) { const p = $('#searchPanel'); p.hidden = !p.hidden; el.setAttribute('aria-expanded', !p.hidden); }
  else if ((el = c('#dateStrip button'))) { state.date = el.dataset.d; state.selId = null; saveState(); openResults(); }
  else if ((el = c('#fTime button'))) { const t = +el.dataset.t; state.times.has(t) ? state.times.delete(t) : state.times.add(t); el.classList.toggle('on'); renderTickets(); }
  else if (c('#resetFilter') || c('#clearF')) { setMode('all'); openResults(); }
  else if (c('#openFilter')) $('#filters').classList.add('open');
  else if (c('#closeFilter')) $('#filters').classList.remove('open');
  else if (c('#showAll')) { setMode('all'); openResults(); }
  else if ((el = c('.tk .btn[data-id]'))) { state.selId = el.dataset.id; go('bayar.html'); }
  else if ((el = c('#pays button'))) { state.pay = el.dataset.p; $$('#pays button').forEach(b => { b.classList.toggle('on', b === el); b.setAttribute('aria-checked', b === el); }); }
  else if (c('#applyPromo')) { const v = $('#promoIn').value.trim().toUpperCase(); state.promo = ['MOVEFIRST', 'HEMAT50'].includes(v) ? v : ''; renderSummary(); toast(state.promo ? 'Promo terpasang.' : 'Kode promo tidak berlaku.'); }
  else if ((el = c('.ord'))) { current = bookings.find(b => b.pnr === el.dataset.pnr); $('#ordList').innerHTML = ''; showTicket(current); }
  else if (c('#backOrders')) { current = null; openOrders(); }
  else if (c('#shareT')) { navigator.clipboard && navigator.clipboard.writeText(current.pnr).catch(() => { }); toast('Kode booking disalin.'); }
  else if (c('#mClose')) closeModal();
  else if (e.target.id === 'modal') { modalAct = null; $('#modal').hidden = true; }
});
document.addEventListener('input', e => { if (e.target.matches('#fFrom, #fTo')) showSuggest(e.target); });
document.addEventListener('focusin', e => { if (e.target.matches('#fFrom, #fTo')) showSuggest(e.target); });
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.matches('#fFrom, #fTo')) { const f = $('#sg' + e.target.id.slice(1) + ' button'); if (f && !f.parentElement.hidden) { e.preventDefault(); f.click(); } }
  if (e.key === 'Escape') { closePops(); $('#modal').hidden = true; modalAct = null; $('#filters').classList.remove('open'); } });
$('#searchForm')?.addEventListener('submit', runSearch);
$('#coForm')?.addEventListener('submit', submitOrder);
$('#pnrForm')?.addEventListener('submit', lookupPNR);
$('#newsForm')?.addEventListener('submit', e => { e.preventDefault(); e.target.reset(); toast('Terima kasih! Kami kabari saat harga turun.'); });
$('#fPrice')?.addEventListener('input', e => { state.max = +e.target.value; $('#priceOut').textContent = rupiah(state.max); renderTickets(); });
$('#qSearch')?.addEventListener('input', e => { state.q = e.target.value; renderTickets(); });
$('#fOps')?.addEventListener('change', e => { e.target.checked ? state.ops.add(e.target.value) : state.ops.delete(e.target.value); renderTickets(); });
$('#optIns')?.addEventListener('change', e => { state.ins = e.target.checked; renderSummary(); });
$('#optBag')?.addEventListener('change', e => { state.bag = e.target.checked; renderSummary(); });
$('#coForm')?.addEventListener('input', e => e.target.closest('.fld')?.classList.remove('bad'));

load(); loadState(); renderHome(); init();
