<p align="center">
  <img src="assets/logo-rscustom.png" alt="RSCustom — Konveksi Kaos" width="280" />
</p>

<p align="center">
  Website konveksi &amp; sablon custom — <i>Desain sesukamu, kami cetak tanpa drama!</i>
</p>

---

## Tentang Proyek

**RSCustom** adalah website untuk usaha konveksi dan sablon custom. Pelanggan dapat
melihat produk, membaca panduan, lalu membuat pesanan lewat **Order Builder** lengkap
dengan _live preview_ desain. Pesanan tersimpan di **Supabase**, notifikasinya dikirim
otomatis ke **WhatsApp** (via Fonnte), dan statusnya bisa dipantau **realtime**.

- Frontend: **HTML, CSS, dan JavaScript murni** (tanpa framework, tanpa build) — di-hosting di Vercel
- Backend: **Supabase** (Postgres + RLS, Storage, Realtime, Edge Function) + **Fonnte** (WhatsApp gateway)

🔗 Demo: <https://custom-konveksi.vercel.app>  ·  Dashboard admin: <https://custom-konveksi.vercel.app/admin.html>

## Fitur

### Beranda (`index.html`)
- Navbar _single page_ (Beranda, Tentang, Produk, Cara Order, FAQ) dengan penanda section aktif
- Hero dengan kartu melayang, marquee produk, dan ornamen garis bertema alat desain
- Section Produk, Untuk Siapa, Fitur, Cara Order, Pilihan Bahan, Hasil Karya
- **Panduan Ukuran interaktif** — tab Kaos / Hoodie / Jersey, diagram ukuran ikut berubah
- **Testimoni slider otomatis** (geser, tombol, titik navigasi; jeda saat disorot)
- FAQ dua kolom dan CTA

### Custom Design (`customDesign.html`) — Order Builder 4 langkah
1. **Produk & Model** — kartu model bergambar (Kaos, Jaket, Topi, Jersey)
2. **Atur Desain**
   - 19+ warna (Netral / Cerah / Gelap) + pemilih warna bebas
   - **Detail produk**: jenis kerah bergambar, warna kerah, ujung lengan, resleting, tambahan
   - **Desain label leher**: Woven atau Sablon (tagless), nama brand, teks, warna, logo
   - Metode desain: **Full Order** (upload, geser, ubah ukuran, download), **Galeri**, **Jasa Desain**
3. **Detail & Jumlah** — jumlah per ukuran (S–XXXL), tanggal, catatan
4. **Checkout** — validasi data, ringkasan pesanan + **preview desain & label**
5. **Kirim Pesanan** — pesanan & file desain tersimpan di Supabase, WA terkirim ke admin dan
   pembeli, lalu halaman sukses menampilkan **kode pesanan + status realtime** (tanpa refresh)

### Dashboard Admin (`admin.html`)
- Login khusus admin (Supabase Auth); pengunjung tidak bisa membaca data pesanan (RLS)
- Daftar pesanan **realtime** via WebSocket: pesanan baru muncul otomatis + bunyi notifikasi,
  pesanan yang dihapus langsung hilang
- Filter per status, detail pesanan lengkap, preview & file desain asli
- **Ubah status → WA otomatis** ke pembeli + salinan ke admin (tanpa tombol chat manual)

### Halaman lain
- **Tentang Kami** (`tentang.html`) — cerita, visi & misi, nilai, proses produksi, tim
- **Panduan Order** (`panduan.html`) — panduan lengkap dengan daftar isi & progres baca

### Global
- Tombol **scroll to top** dengan lingkar progres
- **Chatbot RS Assistant** berbasis kata kunci (tanpa server)
- Responsif dari 360px hingga desktop, mendukung `prefers-reduced-motion`

## Struktur Folder

```
custom-konveksi/
├── index.html           # Beranda
├── customDesign.html    # Order Builder
├── tentang.html         # Tentang Kami
├── panduan.html         # Panduan Order
├── admin.html           # Dashboard admin pesanan
├── dokumentasi.html     # (lama, tidak ditautkan)
├── assets/              # Logo, ilustrasi, mockup kaos
├── css/
│   ├── custom.css       # Design system bersama: token, navbar, footer, CTA, ornamen, chatbot
│   ├── style.css        # Beranda
│   ├── designCustom.css # Custom Design / Order Builder
│   ├── admin.css        # Dashboard admin
│   ├── tentang.css      # Tentang Kami
│   ├── panduan.css      # Panduan Order
│   └── dokumentasi.css  # Dokumentasi (lama)
├── js/
│   ├── index.js           # Semua interaksi (navbar, wizard, checkout → Supabase, slider, chatbot, dll.)
│   ├── admin.js           # Dashboard admin (login, realtime, ubah status)
│   └── supabase-config.js # Project URL + publishable key Supabase
└── supabase/
    ├── config.toml                     # Konfigurasi CLI (verify_jwt = false untuk send-order)
    ├── migrations/                     # Tabel, RLS, storage, realtime, kolom notifikasi
    ├── functions/send-order/index.ts   # Edge Function: kirim WA via Fonnte
    └── .env                            # Secrets lokal (TIDAK di-commit)
```

## Menjalankan Secara Lokal

Website ini statis, tetapi **harus dibuka lewat web server** (`http://`), bukan dengan
membuka file langsung (`file://`) — fitur download & upload preview kanvas membutuhkannya.
Versi lokal tetap memakai database Supabase yang sama dengan versi online.

Pilih salah satu:

```bash
# Node.js
npx serve .

# Python 3
python -m http.server 8080
```

Lalu buka `http://localhost:8080` (atau port yang ditampilkan).
Bisa juga memakai ekstensi **Live Server** di VS Code.

## Library Eksternal (CDN)

| Library | Kegunaan |
|---|---|
| [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) | Font |
| [Font Awesome 6.5](https://fontawesome.com/) | Ikon |
| [AOS 2.3.1](https://michalsnik.github.io/aos/) | Animasi saat scroll |
| [supabase-js 2.45.4](https://supabase.com/docs/reference/javascript) | Database, storage, realtime |

## Kustomisasi

| Yang diubah | Lokasi |
|---|---|
| Warna brand & token desain | `:root` di `css/custom.css` |
| Daftar model produk & ilustrasinya | `MODELS` dan `ART` di `js/index.js` |
| Detail produk (kerah, lengan, tambahan) | `DETAILS` di `js/index.js` |
| Pilihan warna produk | `#colorOptions` di `customDesign.html` |
| Desain galeri | `GALLERY` di `js/index.js` |
| Tabel panduan ukuran | `#sizeChartData` di `index.html` |
| Jawaban chatbot | `RULES` di `js/index.js` |
| Link WhatsApp admin (chatbot) | `WA_LINK` di `js/index.js` |
| Nomor WA penerima pesanan | secret `ADMIN_WA` di Supabase |
| Isi pesan WA (pesanan & status) | `adminMessage`, `customerMessage`, `STATUS_BODY` di `supabase/functions/send-order/index.ts` |
| Teks status di halaman pembeli | `STATUS_TEXT` di `js/index.js` |

## Backend Pesanan (Supabase + Fonnte)

```
Pembeli: Kirim Pesanan
  ├─ upload preview/desain/logo  → Storage (bucket order-designs)
  ├─ simpan data checkout        → tabel orders
  └─ panggil Edge Function send-order
        ├─ WA ke ADMIN   : detail pesanan + link gambar
        └─ WA ke PEMBELI : konfirmasi pesanan diterima (nomor dari form checkout)

Admin: ubah status di admin.html
  ├─ tabel orders di-update      → halaman pembeli ikut berubah (Realtime broadcast)
  └─ send-order { type: "status" } (wajib login admin)
        ├─ WA ke PEMBELI : pemberitahuan status
        └─ WA ke ADMIN   : salinan / peringatan jika WA ke pembeli gagal
```

| Status | Pesan ke pembeli |
|---|---|
| Baru | — (konfirmasi awal sudah dikirim saat checkout) |
| Dikonfirmasi | Pesanan dikonfirmasi, detail harga & pembayaran menyusul |
| Diproses | Pesanan sedang diproduksi |
| Dikirim | Pesanan dalam perjalanan |
| Selesai | Terima kasih telah memesan |
| Dibatalkan | Pesanan dibatalkan, silakan balas untuk bertanya |

Keamanan:
- Pengunjung hanya bisa **membuat** pesanan & upload gambar; membaca/mengubah pesanan hanya untuk admin (RLS + tabel `admins`).
- Token Fonnte hanya disimpan sebagai **secret** Edge Function, tidak pernah ada di frontend.
- WA pesanan baru dikirim sekali per pesanan; WA status dikirim sekali per status (kolom `wa_status_notified`).

### Setup (sekali saja)

```bash
npx supabase login
npx supabase link --project-ref <PROJECT_REF>     # isi juga project_id di supabase/config.toml
npx supabase db push                              # tabel, RLS, storage, realtime
npx supabase secrets set --env-file supabase/.env # FONNTE_TOKEN, ADMIN_WA, dll
npx supabase functions deploy send-order
```

- `supabase/.env` (tidak di-commit) berisi `FONNTE_TOKEN`, `ADMIN_WA`, `SEND_CUSTOMER_CONFIRMATION`, `FONNTE_ATTACHMENT`.
- Isi `js/supabase-config.js` dengan Project URL + publishable/anon key.
- Buat akun admin: Dashboard → Authentication → Add user, lalu jalankan di SQL Editor:
  `insert into public.admins (user_id) select id from auth.users where email = 'admin@email.com';`
- Matikan pendaftaran publik: Authentication → Sign In / Providers → nonaktifkan *Allow new users to sign up*.
- Bila deploy function lewat Dashboard (bukan CLI), matikan **Verify JWT** di Edge Functions → send-order → Settings.
- Paket Fonnte Free tidak mendukung lampiran, jadi gambar dikirim sebagai link. Jika paket di-upgrade, set `FONNTE_ATTACHMENT=true`.

### Deploy frontend

Frontend di-deploy ke **Vercel** langsung dari branch `konveksi` (tanpa build step). Setiap `git push`
otomatis memperbarui <https://custom-konveksi.vercel.app>. Perubahan pada Supabase (SQL / Edge Function)
di-deploy terpisah lewat CLI atau Dashboard Supabase.

## Catatan

- Konten berikut masih **contoh/placeholder** dan perlu disesuaikan:
  kontak di footer, nomor WhatsApp, testimoni, angka panduan ukuran, data bahan,
  serta teks cerita/visi-misi di halaman Tentang.
- Chatbot menjawab berdasarkan kata kunci, bukan AI.

---

<p align="center">© RSCustom — Konveksi Kaos</p>
