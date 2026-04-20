# 📈 Financial Tracker DISSZ

Aplikasi pelacak keuangan pribadi premium yang ringan, aman, dan tersinkronisasi langsung dengan **Google Sheets** Anda.

---

## ✨ Fitur Utama

* **Smart Add (NLP):** Ketik transaksi secara natural (contoh: "Kopi Kenangan 25000") dan aplikasi akan otomatis memisahkan nominal serta menebak kategorinya.
* **Google Sheets sebagai Database:** Data Anda tetap menjadi milik Anda. Aplikasi ini menggunakan spreadsheet pribadi Anda untuk menyimpan semua riwayat.
* **Visualisasi Data Mewah:** Dilengkapi dengan grafik tren saldo, cashflow bulanan, dan distribusi pengeluaran berbasis kategori (Pie, Bar, & Line Charts).
* **Dashboard Modern:** Antarmuka gelap (Dark Mode) yang bersih dan elegan dengan efek *glassmorphism*.
* **Pencarian & Filter:** Cari riwayat transaksi berdasarkan deskripsi atau kategori secara instan.
* **Aman:** Login menggunakan Google OAuth resmi (NextAuth.js).

---

## 🛠️ Teknologi yang Digunakan

* **Framework:** Next.js (App Router)
* **Language:** TypeScript
* **Styling:** Tailwind CSS
* **Icons:** Lucide React
* **Authentication:** NextAuth.js (Google Provider)
* **Database:** Google Sheets API v4
* **State Management:** TanStack Query (React Query)
* **Charts:** Recharts

---

## 🚀 Panduan Instalasi Lokal

### 1. Prasyarat
* Node.js versi 18.x atau yang terbaru.
* Akun Google Cloud untuk mendapatkan API Key.
* Satu file Google Sheets dengan nama tab (Sheet) `Sheet1` dan header: `Date | Description | Category | Amount | Type`

### 2. Clone & Install
```bash
git clone [https://github.com/username-anda/financial-tracker-dissz.git](https://github.com/username-anda/financial-tracker-dissz.git)
cd financial-tracker-dissz
npm install