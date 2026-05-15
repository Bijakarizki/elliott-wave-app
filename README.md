# Elliott Wave Analyzer v2 — IDX (Full Cloud)

Aplikasi analisis Elliott Wave untuk saham Indonesia (IDX).
**Full cloud** — semua data dari Yahoo Finance via Vercel Serverless, tanpa setup lokal apapun.

## Fitur

- 📊 Candlestick chart interaktif (Lightweight Charts by TradingView)
- 🏦 Browser emiten IDX — 80+ saham dikelompokkan per sektor
- 🔍 Pencarian emiten — cari by ticker atau nama perusahaan
- 📡 Data real dari Yahoo Finance via Vercel Serverless (no CORS, no API key)
- 🖱️ Semi-manual wave marking — klik titik di chart, validasi otomatis
- ✅ Validasi Hard Rules Elliott Wave (3 aturan mutlak)
- 📐 Fibonacci guidelines per wave + target price berikutnya
- 🔁 Mode Impulse (0-1-2-3-4-5) dan Corrective (A-B-C)
- 🎨 Pola Corrective: Zigzag, Flat Regular/Expanded/Running, Triangle, Double Three
- ↔️ Alternation check Wave 2 vs Wave 4
- ⌨️ Keyboard shortcut: Ctrl+Z untuk undo
- Timeframe: 1D, 1W, 1M
- Fallback ke data simulasi jika Yahoo Finance tidak tersedia

## Deploy ke Vercel (5 menit)

```bash
# 1. Install dependencies
npm install

# 2. Install Vercel CLI
npm i -g vercel

# 3. Deploy
vercel

# Ikuti prompt → defaults semua → dapat URL publik
```

Atau push ke GitHub lalu import di vercel.com.

**Catatan**: Di `npm run dev` (localhost), /api/stock belum aktif karena butuh
runtime Vercel. Data akan pakai simulasi. Setelah deploy, data real otomatis aktif.

## Struktur

```
api/stock.js          ← Vercel Serverless proxy Yahoo Finance
src/
  components/
    WaveChart.jsx     ← Chart interaktif + klik wave points
    ValidationPanel.jsx ← Validasi rules + Fibonacci
    Toolbar.jsx       ← Toolbar + emiten picker
    EmitenPicker.jsx  ← Modal browse/search 80+ emiten IDX
  utils/
    elliottWave.js    ← Engine validasi Elliott Wave rules
    fetchData.js      ← Fetch via /api/stock
    emiten.js         ← Database emiten IDX per sektor
```

## Cara Pakai

1. Klik nama emiten di toolbar → pilih dari daftar atau search
2. Pilih timeframe (1D, 1W, 1M)
3. Pilih mode: Impulse atau Corrective
4. Klik titik-titik di chart untuk mark setiap wave point
5. Lihat validasi real-time di panel kanan
6. Ctrl+Z = undo, tombol reset = mulai ulang
