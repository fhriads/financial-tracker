import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function POST(req: NextRequest) {
  try {
    // Optional: Check session but don't block for testing
    const session = await getServerSession(authOptions).catch(() => null);
    
    const { dailySummary } = await req.json();

    if (!dailySummary || dailySummary.trim().length === 0) {
      return NextResponse.json({ error: 'Input tidak boleh kosong' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ error: 'Konfigurasi AI belum tersedia' }, { status: 500 });
    }

    const prompt = `Anda adalah asisten keuangan pribadi. Analisis teks berikut yang berisi ringkasan pengeluaran/pemasukan harian pengguna. Ekstrak semua transaksi dan kategorikan dengan format JSON array.

Format output WAJIB berupa array JSON dengan struktur:
[
  {
    "date": "YYYY-MM-DD",
    "description": "deskripsi transaksi",
    "category": "Food|Transport|Bills|Entertainment|Income|Other",
    "amount": angka,
    "type": "Income|Expense"
  }
]

Aturan:
1. Ekstrak SEMUA transaksi yang disebutkan dalam teks
2. Untuk amount: hilangkan semua titik/koma, gunakan angka murni (contoh: 25000 bukan 25.000)
3. Kategori: tebak berdasarkan konteks (makan→Food, transportasi→Transport, tagihan→Bills, hiburan→Entertainment, gaji/bonus→Income, lainnya→Other)
4. Tanggal: gunakan hari ini (${new Date().toISOString().split('T')[0]}) jika tidak disebutkan
5. Jika ada kata seperti "gaji", "bonus", " THR", "profit", "jual", "uang saku", "refund" → type: Income
6. Jika ada kata seperti "makan", "beli", "bayar", "lunas", "tiket" → type: Expense
7. Jika tidak ada nominal yang jelas, lewati transaksi tersebut
8. Hanya output JSON array, tanpa teks lain

Teks input: ${dailySummary}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Gemini API error:', errorData);
      return NextResponse.json({ error: errorData?.error?.message || 'Gagal memproses dengan AI' }, { status: 500 });
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      return NextResponse.json({ error: 'Respons AI tidak valid' }, { status: 500 });
    }

    // Parse JSON dari respons Gemini
    const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
    
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Tidak ada transaksi yang terdeteksi' }, { status: 400 });
    }

    const transactions = JSON.parse(jsonMatch[0]);

    // Validasi dan bersihkan data
    const validTransactions = transactions.filter((t: any) => 
      t.description && t.amount > 0 && t.category && t.type
    ).map((t: any) => ({
      date: t.date || new Date().toISOString().split('T')[0],
      description: t.description,
      category: t.category,
      amount: Number(t.amount),
      type: t.type,
    }));

    return NextResponse.json({ 
      success: true, 
      transactions: validTransactions,
      count: validTransactions.length
    });

  } catch (error) {
    console.error('AI processing error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan internal' }, { status: 500 });
  }
}