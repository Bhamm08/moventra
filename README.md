# Moventra

Website pemesanan tiket pesawat, kereta api, bus, dan kapal ferry, dibuat dengan HTML, CSS, dan JavaScript murni (tanpa framework dan tanpa server).

**Demo:** https://bhamm08.github.io/moventra/

> Pembayaran hanya simulasi. Tidak ada uang yang ditarik dan tidak ada data yang dikirim ke server.

## Fitur

- **Beranda** dengan pilihan jenis transportasi, rute favorit, dan inspirasi destinasi.
- **Pesan Tiket** dengan 26 kota asal dan tujuan, kalender pop-up untuk memilih tanggal, filter (jenis, harga, waktu berangkat, operator, kode atau nama operator), dan pengurutan.
- **Pembayaran** dengan data kontak dan penumpang, asuransi dan bagasi tambahan, kode promo (`MOVEFIRST`, `HEMAT50`), serta timer 15 menit.
- **Pesanan Saya** berisi e-tiket dengan kode QR dan pencarian pesanan berdasarkan kode booking.
- **Promo** dan **Bantuan**.

## Struktur file

| File | Isi |
|---|---|
| `index.html` | Beranda |
| `pesan.html` | Pencarian dan daftar tiket |
| `bayar.html` | Data penumpang dan pembayaran |
| `pesanan.html` | Pesanan saya dan e-tiket |
| `promo.html` | Kode promo |
| `bantuan.html` | Cara memesan dan pertanyaan umum |
| `style.css` | Seluruh tampilan |
| `script.js` | Seluruh logika dan struktur data |

## Cara menjalankan

1. Unduh semua file dan simpan dalam **satu folder**.
2. Buka `index.html` di browser.

Atau langsung buka link demo di atas.

## Materi struktur data (lihat di Console)

Materi ini tidak ditampilkan di halaman. Buka **DevTools → Console** dengan menekan **F12** untuk melihat lognya. Seluruh kodenya ada di `script.js`, dengan komentar pembagian bagian A sampai E di bagian atas file.

### A. Array, Struct, dan Pointer

| Konsep | Implementasi |
|---|---|
| **Struct** | `Ticket` dan `Booking`: kumpulan field tetap yang dibuat lewat fungsi pembuat lalu di-`Object.seal` agar tidak bisa ditambah atau dihapus fieldnya. |
| **Array** | `tickets` (jadwal hasil pencarian), `bookings` (pesanan), dan `CITIES` (daftar kota). |
| **Pointer** | Variabel referensi `selected` dan `current` yang menunjuk ke objek di dalam array. Juga linked list `RecentSearches` dengan `head` dan `next` untuk riwayat pencarian. |

JavaScript tidak punya pointer dan struct asli, jadi implementasinya memakai referensi objek.

### B. Sorting (2 metode, log langkah di Console)

| Urutan di halaman Pesan Tiket | Metode |
|---|---|
| Termurah | Bubble Sort (naik) |
| Termahal | Bubble Sort (turun) |
| Tercepat | Selection Sort (naik) |
| Berangkat awal | Selection Sort (naik) |
| Berangkat akhir | Selection Sort (turun) |

Selection Sort juga dipakai di belakang layar untuk mengurutkan kode booking sebelum Binary Search dijalankan.

**Alasan memilih:**

- **Bubble Sort untuk urutan harga.** Cara kerjanya paling mudah dibayangkan: dua data bersebelahan dibandingkan lalu ditukar kalau urutannya salah, diulang sampai tidak ada yang perlu ditukar. Untuk urutan harga, perubahan posisi harga yang naik ke atas terlihat jelas di log tiap *pass*, jadi mudah dijelaskan saat demo. Jumlah tiket per pencarian hanya belasan sampai puluhan, jadi kecepatannya tidak jadi masalah.
- **Selection Sort untuk urutan waktu dan durasi.** Tiap langkah mencari nilai terkecil (atau terbesar) dari sisa data lalu menaruhnya di posisi yang benar. Log-nya menampilkan satu keputusan per langkah ("pilih indeks ke-sekian"), sehingga alurnya mudah diikuti. Jumlah pertukarannya juga sedikit, karena tiap posisi paling banyak ditukar satu kali.

Kedua metode memiliki kompleksitas O(n²). Itu dapat diterima karena datanya kecil, dan keduanya dipilih karena paling mudah dijelaskan langkah demi langkah.

### C. Searching (2 metode, log langkah di Console)

| Metode | Dipakai untuk |
|---|---|
| **Linear Search** | Mencocokkan nama kota saat form pencarian dikirim, dan kolom "Cari kode atau operator" di filter. |
| **Binary Search** | Mencari pesanan berdasarkan kode booking di halaman Pesanan Saya. |

**Alasan memilih:**

- **Linear Search untuk kota dan operator.** Metode ini memeriksa data satu per satu dari awal. Cocok karena yang dicari bisa cocok sebagian (misalnya mengetik "pad" untuk Padang, atau "cit" untuk Citilink) dan hasilnya bisa lebih dari satu. Data tidak perlu diurutkan dulu, dan daftarnya kecil.
- **Binary Search untuk kode booking.** Kode booking unik, jadi hasilnya paling banyak satu. Metode ini membagi dua rentang data tiap langkah sehingga lebih cepat daripada memeriksa satu per satu, dan log-nya menampilkan `lo`, `hi`, dan `mid` yang mudah dijelaskan. Syaratnya data harus sudah terurut, jadi daftar pesanan diurutkan dulu dengan Selection Sort berdasarkan kode booking.

### Alur demo yang disarankan

1. Buka halaman **Pesan Tiket**, tekan **F12**, lalu buka tab **Console**.
2. Pilih kota asal, tujuan, dan tanggal, lalu klik **Cari tiket**. Log Linear Search (kota), Bubble Sort (urutan Termurah), dan riwayat pencarian (`[POINTER]`) muncul.
3. Klik tab Termahal untuk melihat Bubble Sort versi turun, lalu klik Tercepat atau Berangkat awal untuk melihat log Selection Sort.
4. Ketik nama operator di kolom "Cari kode atau operator" untuk melihat log Linear Search.
5. Pilih tiket, isi data, dan lakukan pembayaran simulasi sampai e-tiket muncul. Catat kode booking-nya.
6. Buka **Pesanan Saya**, masukkan kode booking, lalu klik **Cari pesanan** untuk melihat log Selection Sort (mengurutkan kode booking) lalu Binary Search.

## Penyimpanan data

- Pesanan disimpan di `localStorage` browser, jadi tetap ada setelah halaman dimuat ulang tetapi hanya di browser yang sama.
- Pilihan rute, tanggal, dan tiket antar halaman disimpan sementara di `sessionStorage`.

## Teknologi

HTML5, CSS3, dan JavaScript (ES6). Font Plus Jakarta Sans dari Google Fonts.

## Pembuat

Bhamana Artantyo (25050974082)
