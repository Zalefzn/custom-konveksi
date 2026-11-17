<p align="center">
  <img src="assets/logo-rscustom.png" alt="RSCustom — Konveksi Kaos" width="280" />
</p>

<p align="center">
  Website konveksi &amp; sablon custom — <i>Desain sesukamu, kami cetak tanpa drama!</i>
</p>

---

## Tentang Proyek

**RSCustom** adalah website statis untuk usaha konveksi dan sablon custom. Pelanggan dapat
melihat produk, membaca panduan, lalu membuat pesanan lewat **Order Builder** lengkap
dengan _live preview_ desain — tanpa perlu instalasi atau proses build.

Dibangun dengan **HTML, CSS, dan JavaScript murni** (tanpa framework).

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
├── dokumentasi.html     # (lama, tidak ditautkan)
├── assets/              # Logo, ilustrasi, mockup kaos
├── css/
│   ├── custom.css       # Design system bersama: token, navbar, footer, CTA, ornamen, chatbot
│   ├── style.css        # Beranda
│   ├── designCustom.css # Custom Design / Order Builder
│   ├── tentang.css      # Tentang Kami
│   ├── panduan.css      # Panduan Order
│   └── dokumentasi.css  # Dokumentasi (lama)
└── js/
    └── index.js         # Semua interaksi (navbar, wizard, slider, chatbot, dll.)
```

## Menjalankan Secara Lokal

Website ini statis, tetapi **harus dibuka lewat web server** (`http://`), bukan dengan
membuka file langsung (`file://`) — fitur download preview kanvas membutuhkannya.

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
| Link WhatsApp admin | `WA_LINK` di `js/index.js` |

## Backend Pesanan (Supabase + Fonnte)

Alur saat pembeli klik **Kirim Pesanan**:

1. Gambar preview, file desain, dan logo label di-upload ke Supabase Storage (bucket `order-designs`).
2. Data checkout disimpan ke tabel `orders`.
3. Edge Function `send-order` mengirim WA ke admin (ringkasan + link gambar) dan konfirmasi ke pembeli via Fonnte.
4. Halaman sukses menampilkan status pesanan **realtime** (Supabase Realtime / WebSocket).
5. `admin.html` = dashboard admin: pesanan baru muncul otomatis + ubah status (status ikut berubah di layar pembeli).

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
- Paket Fonnte Free tidak mendukung lampiran, jadi gambar dikirim sebagai link. Jika paket di-upgrade, set `FONNTE_ATTACHMENT=true`.

## Catatan

- Konten berikut masih **contoh/placeholder** dan perlu disesuaikan:
  kontak di footer, nomor WhatsApp, testimoni, angka panduan ukuran, data bahan,
  serta teks cerita/visi-misi di halaman Tentang.
- Chatbot menjawab berdasarkan kata kunci, bukan AI.

---

<p align="center">© RSCustom — Konveksi Kaos</p>
