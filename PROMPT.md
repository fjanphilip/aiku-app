# Prompt untuk Membangun Aplikasi (AI Coding Agent) — Expo + React Native

Gunakan prompt di bawah ini pada AI coding agent (Claude Code, Cursor, Copilot Chat, dsb.) yang bekerja **di dalam folder project Expo kamu**, setelah kamu taruh `PRD.md` dan `AGENTS.md` di root project.

---

## Prompt

```
Kamu adalah AI coding agent yang bekerja di project Expo + React Native ini.

Sebelum mulai:
1. Baca file PRD.md di root project untuk memahami requirement produk secara lengkap.
2. Baca file AGENTS.md di root project untuk memahami arsitektur, konvensi kode, struktur folder, dan aturan integrasi 9Router yang wajib diikuti.
3. Ikuti kedua file tersebut sebagai sumber kebenaran utama — jangan menyimpang dari struktur folder atau aturan keamanan (API key tidak boleh hardcode, gunakan expo-secure-store) yang sudah ditulis di sana.
4. Selalu install dependency baru dengan "npx expo install <package>", bukan npm/yarn langsung, kecuali package tidak ada di Expo registry.

Tugas: Bangun MVP aplikasi chat AI sesuai PRD.md, dengan urutan sebagai berikut. Kerjakan bertahap, satu langkah selesai dan bisa dijalankan di Expo Go sebelum lanjut ke langkah berikutnya:

Langkah 1 — Setup dasar
- Pastikan project sudah pakai TypeScript template dan expo-router terpasang.
- Install dependency: expo-secure-store, expo-sqlite, expo-clipboard, library markdown renderer untuk React Native.
- Buat struktur folder sesuai AGENTS.md (app/, components/, services/, hooks/, types/).

Langkah 2 — Settings (base URL + API key)
- Buat services/storage.ts sebagai wrapper expo-secure-store untuk simpan/ambil base URL, API key, model default.
- Buat app/(tabs)/settings.tsx: input Base URL, input API Key, pilih/isi model default, tombol "Test Connection" yang memanggil GET {baseUrl}/v1/models.
- Buat hooks/useSettings.ts untuk logic load/save settings dan state (idle/loading/success/error).

Langkah 3 — Network layer ke 9Router
- Buat services/nineRouterClient.ts untuk POST {baseUrl}/v1/chat/completions, format request mengikuti OpenAI Chat Completions API (model, messages, stream: true).
- Implementasikan streaming response (SSE) yang kompatibel dengan React Native/Expo: parse baris "data: {...}" per event, berhenti saat menerima "data: [DONE]". Riset pendekatan yang benar-benar jalan di Expo (jangan asumsikan ReadableStream browser langsung portable).
- Base URL dan API key diambil secara dinamis dari services/storage.ts, bukan hardcode.
- Tangani error (timeout, 401 unauthorized, 5xx) dengan pesan yang jelas, jangan sampai crash.

Langkah 4 — Chat Screen
- Buat hooks/useChat.ts + app/(tabs)/index.tsx: input teks, tombol kirim, list bubble chat (user vs AI) dengan auto-scroll (FlatList).
- Balasan AI ditampilkan secara streaming (update UI token demi token).
- Render markdown dasar (bold, list, code block) pada bubble AI via components/MarkdownRenderer.tsx.
- Tambahkan indikator loading/typing dan tombol stop/cancel (AbortController) saat streaming berlangsung.
- Tambahkan tombol copy pada tiap pesan (expo-clipboard).

Langkah 5 — Riwayat percakapan (expo-sqlite)
- Buat schema dan query dasar untuk menyimpan sesi chat dan pesan-pesannya.
- Judul sesi otomatis diambil dari prompt pertama user.
- Buat app/(tabs)/history.tsx (list sesi, bisa dibuka kembali atau dihapus).

Langkah 6 — Navigasi & Integrasi akhir
- Hubungkan Settings, Chat, dan History dalam satu navigasi expo-router yang rapi.
- Jika Base URL/API key belum diisi saat pertama kali buka app, arahkan otomatis ke Settings.

Setelah setiap langkah selesai, jalankan "npx tsc --noEmit" dan pastikan tidak ada type error sebelum lanjut ke langkah berikutnya. Beri saya ringkasan singkat perubahan yang dilakukan di setiap langkah, dan beri tahu kapan sebaiknya saya scan QR Expo Go lagi untuk test manual.
```

---

## Cara pakai
1. Kalau belum ada project, buat dulu dengan: `npx create-expo-app@latest namaapp --template blank-typescript` (lalu `cd namaapp`, install `expo-router` sesuai dokumentasi resmi Expo terbaru).
2. Simpan `PRD.md` dan `AGENTS.md` di root folder project Expo kamu.
3. Buka AI coding agent di folder project tersebut.
4. Paste prompt di atas sebagai pesan pertama.
5. Jalankan `npx expo start`, scan QR code dengan app **Expo Go** di HP kamu untuk lihat hasilnya real-time setiap langkah selesai.

> Catatan: kalau kamu tidak pakai AI coding agent dan mau ngoding manual, prompt di atas tetap bisa dipakai sebagai **checklist urutan pengerjaan** — kerjakan langkah 1 sampai 6 secara berurutan.
