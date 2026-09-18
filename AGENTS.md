# AGENTS.md

Panduan ini ditujukan untuk AI coding agent (Claude Code, Cursor, Copilot, dsb.) yang bekerja di repo ini. Baca `PRD.md` dulu untuk konteks produk sebelum mengubah kode.

## Ringkasan Proyek
Aplikasi mobile cross-platform (Expo + React Native + TypeScript) berupa AI chat client. Backend AI adalah **9Router** (self-hosted, endpoint OpenAI-compatible) yang berjalan di VPS milik user. Aplikasi ini HANYA bertindak sebagai client — tidak ada logic routing/model provider di dalam app.

## Tech Stack
- Expo (managed workflow), React Native, TypeScript
- Navigasi: **expo-router** (file-based routing di folder `app/`)
- State: React hooks + Context (atau Zustand jika kompleksitas naik)
- Networking: `fetch`/`expo/fetch` untuk streaming SSE ke 9Router
- Local storage: `expo-sqlite` (riwayat chat), `expo-secure-store` (API key, base URL)
- Testing di device: **Expo Go** (scan QR), bukan emulator Android Studio kecuali user minta eksplisit
- Build production: **EAS Build** (cloud), bukan build lokal via Android Studio

## Struktur Folder (target, mengikuti konvensi expo-router)
```
app/
 ├─ (tabs)/                 # atau struktur route sesuai kebutuhan
 │   ├─ index.tsx            # Chat screen (default/home)
 │   ├─ history.tsx          # Riwayat percakapan
 │   └─ settings.tsx         # Settings screen
 ├─ _layout.tsx              # Root layout/navigation
components/
 ├─ ChatBubble.tsx
 ├─ ChatInput.tsx
 ├─ MarkdownRenderer.tsx
 └─ ...
services/
 ├─ nineRouterClient.ts      # Semua komunikasi ke 9Router (chat completions, list models)
 └─ storage.ts                # Wrapper expo-secure-store & expo-sqlite
hooks/
 ├─ useChat.ts                # Logic kirim pesan + handle streaming
 └─ useSettings.ts
types/
 └─ chat.ts                   # Type definitions (Message, Session, dll)
```

## Perintah Development
- Install dependency: `npx expo install <package-name>` (bukan `npm install` biasa, supaya versi kompatibel dengan Expo SDK)
- Jalankan dev server: `npx expo start`
- Testing di HP: scan QR code dari terminal/browser dengan app **Expo Go**
- Build APK (cloud, tidak butuh Android Studio): `eas build -p android --profile preview`
- Lint: `npx expo lint`
- Type check: `npx tsc --noEmit`

Jalankan `npx tsc --noEmit` dan `npx expo lint` setelah perubahan signifikan sebelum menganggap task selesai. Jangan sarankan build lewat Android Studio native kecuali user minta eksplisit — default workflow adalah Expo Go + EAS Build.

## Konvensi Kode
- TypeScript strict mode, hindari `any` kecuali benar-benar perlu.
- Komponen React function component + hooks, bukan class component.
- Semua panggilan network harus lewat `services/nineRouterClient.ts`, jangan panggil `fetch` langsung dari komponen/hook lain.
- State UI gunakan pattern jelas (loading/success/error), hindari state chaos di komponen besar — pecah ke custom hooks (`hooks/`).
- Style: gunakan `StyleSheet.create`, konsisten dengan satu pendekatan styling (jangan campur inline style dan StyleSheet tanpa alasan).

## Integrasi 9Router — Aturan Wajib
- Base URL dan API key **TIDAK BOLEH di-hardcode**. Selalu ambil dari `services/storage.ts` (dibungkus `expo-secure-store`), yang diisi user lewat Settings screen.
- Endpoint chat: `POST {baseUrl}/v1/chat/completions` (format request/response mengikuti OpenAI Chat Completions API, termasuk mode `stream: true`).
- Endpoint daftar model (jika dipakai): `GET {baseUrl}/v1/models`.
- Auth header: `Authorization: Bearer <apiKey>`.
- Saat implementasi streaming, parse response SSE per baris `data: {...}`, hentikan saat menerima `data: [DONE]`. React Native tidak selalu support `ReadableStream` bawaan seperti web — riset dan gunakan pendekatan yang terbukti jalan di Expo (mis. `expo/fetch` versi baru, atau library streaming-compatible), jangan asumsikan API web browser langsung portable.
- Selalu handle kegagalan koneksi (timeout, 401, 5xx) dengan pesan error yang informatif ke UI — jangan biarkan exception unhandled sampai crash app.
- Jangan pernah log/print API key ke console.

## Keamanan
- Simpan API key & base URL menggunakan `expo-secure-store` (bukan `AsyncStorage` biasa, karena tidak terenkripsi).
- Jangan commit API key/base URL asli ke repo (gunakan input runtime via Settings, bukan file `.env` yang di-commit — kalau pakai `.env` untuk dev, pastikan masuk `.gitignore`).

## Testing
- Testing manual/UI dilakukan via **Expo Go** di HP fisik (Android 8.0 Oreo, device testing utama user). Boleh juga pakai emulator Android Studio (sudah pernah di-setup user di drive E:\) jika Expo Go tidak cukup untuk kasus tertentu (misal butuh test native module custom).
- Unit test untuk logic di `services/` dan `hooks/` menggunakan Jest + React Native Testing Library.
- Untuk network layer, mock response `fetch` (termasuk simulasi streaming SSE) saat unit test — jangan panggil 9Router asli di test otomatis.

## Yang TIDAK boleh dilakukan agent
- Jangan tambahkan dependency baru tanpa alasan jelas yang dicatat di commit message, dan selalu install via `npx expo install` bukan `npm/yarn add` langsung (kecuali package tersebut tidak terdaftar di Expo registry).
- Jangan keluar dari managed workflow Expo (prebuild/eject ke bare workflow) tanpa diminta eksplisit — ini akan menghilangkan kemudahan Expo Go.
- Jangan hardcode data dummy sebagai pengganti pemanggilan API asli di kode final (boleh dipakai sementara untuk UI preview, tapi harus ditandai `// TODO: remove mock`).
- Jangan submit kode yang belum lolos `tsc --noEmit` dan lint.

## Referensi
- Lihat `PRD.md` untuk requirement produk lengkap (fitur MVP, roadmap, user flow).
