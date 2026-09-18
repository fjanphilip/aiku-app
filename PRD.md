# PRD — Aplikasi Mobile AI Chat (Expo + React Native, via 9Router)

## 1. Ringkasan
Aplikasi mobile cross-platform (dibangun dengan **Expo + React Native**) yang memungkinkan pengguna mengirim prompt teks dan menerima balasan dari model AI, mirip ChatGPT/Gemini/Claude App. Backend AI tidak memanggil provider LLM secara langsung, melainkan melalui **9Router** yang sudah di-deploy di VPS milik user. 9Router menyediakan endpoint yang kompatibel dengan format OpenAI (`/v1/chat/completions`), sehingga app cukup mengintegrasikan satu endpoint untuk mengakses banyak model/provider.

## 2. Latar Belakang & Masalah
- User ingin punya aplikasi chat AI pribadi, bukan ketergantungan pada app pihak ketiga.
- User sudah punya infrastruktur backend (9Router di VPS) yang menangani routing, API key provider, dan fallback model — sehingga app mobile hanya perlu jadi **client/front-end**.
- Development environment terbatas disk space → Expo dipilih karena testing bisa lewat **Expo Go** (app di HP, tanpa emulator/Android Studio penuh) dan build APK final lewat **EAS Build** (cloud), sehingga laptop tetap ringan.

## 3. Tujuan (Goals)
1. User dapat mengetik prompt dan menerima jawaban AI secara real-time (streaming).
2. Riwayat percakapan tersimpan secara lokal di perangkat.
3. User dapat mengganti model AI yang tersedia di 9Router tanpa update aplikasi (via daftar model dinamis).
4. Konfigurasi endpoint 9Router (base URL) dan API key dapat diubah dari dalam app (Settings), tidak di-hardcode.
5. UI/UX sederhana, familiar seperti ChatGPT (bubble chat, markdown & code block rendering).
6. Development & testing berjalan ringan (Expo Go di HP fisik, tanpa emulator berat).

### Non-Goals (di luar scope MVP)
- Login/akun multi-user & sinkronisasi cloud.
- Voice input/output.
- Upload gambar/file (bisa jadi fase 2).
- Publish ke Play Store (opsional, belakangan — pakai EAS Submit kalau sudah siap).

## 4. Target Pengguna
- Personal use: pemilik VPS/9Router sendiri (single-user app).
- Skill teknis: familiar dengan API, tidak butuh onboarding rumit.
- Device testing utama: HP Android 8.0 (Oreo) milik user.

## 5. Tech Stack
| Layer | Pilihan |
|---|---|
| Framework | **Expo (managed workflow) + React Native** |
| Bahasa | TypeScript |
| Navigasi | **expo-router** (file-based routing) |
| State management | React hooks (`useState`/`useReducer`) + Context, atau Zustand kalau butuh lebih terstruktur |
| Networking | `fetch` API native + parsing SSE manual (atau library `eventsource-parser`) untuk streaming |
| Local storage | `expo-sqlite` (riwayat chat) atau `AsyncStorage` untuk data ringan, **`expo-secure-store`** khusus untuk API key (data sensitif) |
| Markdown rendering | `react-native-markdown-display` atau sejenis |
| Styling | StyleSheet React Native biasa, atau NativeWind (Tailwind untuk RN) — opsional |
| Testing di device | **Expo Go** (scan QR code, langsung jalan di HP tanpa build native) |
| Build APK/production | **EAS Build** (cloud build dari Expo, tidak perlu Android Studio penuh di laptop) |
| Min Android version | Selaras dengan Expo SDK terbaru (umumnya Android 6.0+ didukung Expo; app ini tetap ditest utama di Android 8.0 Oreo) |

## 6. Integrasi 9Router
- 9Router expose endpoint OpenAI-compatible: `POST {BASE_URL}/v1/chat/completions`
- Body request (format OpenAI):
```json
{
  "model": "nama-model-yang-dipilih",
  "messages": [
    {"role": "system", "content": "..."},
    {"role": "user", "content": "..."}
  ],
  "stream": true
}
```
- Auth: header `Authorization: Bearer <API_KEY_9ROUTER>` (sesuai konfigurasi 9Router di VPS).
- Response streaming: format SSE (`data: {...}` per token/chunk), diakhiri `data: [DONE]`. Di React Native, `fetch` tidak native support ReadableStream di semua environment — gunakan `expo/fetch` (streaming fetch API Expo SDK 50+) atau library polyfill untuk baca stream response.
- Endpoint daftar model (jika 9Router menyediakan): `GET {BASE_URL}/v1/models` — dipakai untuk dropdown pemilihan model di Settings.
- Base URL & API key disimpan di `expo-secure-store`, **tidak boleh di-hardcode** di source code (lihat AGENTS.md).

## 7. Functional Requirements (MVP)
1. **Chat Screen**
   - Input teks + tombol kirim.
   - List bubble chat (user vs AI), auto-scroll ke bawah (`FlatList`/`FlashList`).
   - Balasan AI muncul secara streaming (token demi token).
   - Render markdown dasar (bold, list, code block dengan syntax highlight sederhana).
   - Indikator loading/typing saat AI sedang membalas.
   - Tombol stop/cancel saat streaming berlangsung (`AbortController`).
   - Tombol copy pesan (`expo-clipboard`).
2. **Riwayat Percakapan**
   - Simpan setiap sesi chat (judul otomatis dari prompt pertama).
   - List sesi sebelumnya, bisa dibuka lagi.
   - Hapus sesi.
3. **Settings**
   - Input Base URL 9Router.
   - Input API Key.
   - Pilih model default (dari daftar `/v1/models` atau manual input).
   - Test koneksi (tombol "Test Connection").
   - System prompt default (opsional, bisa diubah user).
4. **Error Handling**
   - Jika koneksi ke VPS gagal → tampilkan pesan error yang jelas (bukan crash).
   - Retry mechanism sederhana.

## 8. Non-Functional Requirements
- **Keamanan**: API key disimpan via `expo-secure-store` (memakai Keystore Android di balik layar).
- **Performa**: UI tidak boleh freeze saat streaming (gunakan state update yang efisien, hindari re-render berlebihan pada list panjang).
- **Reliability**: Jika VPS mati/timeout, app tetap bisa dibuka dan menampilkan riwayat lama.
- **Portabilitas**: Base URL configurable karena IP VPS/port bisa berubah.

## 9. User Flow Utama
1. Buka app → jika belum ada Base URL/API key → diarahkan ke Settings dulu.
2. User isi Base URL 9Router + API key → Test Connection → sukses.
3. Kembali ke Chat Screen → ketik prompt → kirim.
4. App kirim request ke 9Router → terima stream → tampilkan bubble AI secara real-time.
5. Percakapan otomatis tersimpan sebagai sesi di local DB.

## 10. Roadmap / Milestone
- **Fase 0 — Setup**: init project Expo, jalan di Expo Go, koneksi dasar ke 9Router (non-streaming dulu).
- **Fase 1 — MVP**: chat streaming + riwayat lokal + settings.
- **Fase 2**: multi-session UI lebih rapi, markdown/code block advanced, dark mode.
- **Fase 3 (opsional)**: upload gambar/file, voice input, export chat, EAS Build → APK/AAB, submit ke Play Store.

## 11. Metrik Keberhasilan (untuk personal project)
- Latency time-to-first-token dari 9Router < 2 detik di jaringan normal.
- App tidak crash saat streaming panjang / koneksi terputus.
- Semua fitur MVP di atas berfungsi end-to-end, tervalidasi lewat Expo Go di HP Oreo.

## 12. Risiko
- Format response 9Router bisa sedikit berbeda antar versi/provider → perlu parsing yang defensif.
- VPS downtime → perlu UX yang graceful (bukan crash).
- Streaming SSE di React Native butuh penanganan khusus (tidak semudah di web) → perlu riset/library yang tepat sejak awal.
- Penyimpanan API key di device → risiko jika device hilang (mitigasi: `expo-secure-store` terenkripsi).
