'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { appendSheetData } from '@/lib/googleSheets';
import { Plus, Sparkles } from 'lucide-react';

// Logika cerdas untuk NLP (Natural Language Processing)
const categorizeInput = (text: string) => {
  const lower = text.toLowerCase();
  if (lower.match(/makan|nasi|kopi|minum|food|snack|resto|cafe|roti|susu/)) return { cat: 'Food', type: 'Expense' };
  if (lower.match(/gojek|grab|bensin|tol|parkir|transport|tiket|kereta|pesawat/)) return { cat: 'Transport', type: 'Expense' };
  if (lower.match(/listrik|air|wifi|internet|pulsa|tagihan|bpjs|cicilan|kos|sewa/)) return { cat: 'Bills', type: 'Expense' };
  if (lower.match(/nonton|game|bioskop|spotify|netflix|main|hobi|buku/)) return { cat: 'Entertainment', type: 'Expense' };
  if (lower.match(/gaji|bonus|thr|profit|jual|investasi|refund/)) return { cat: 'Income', type: 'Income' };
  return null;
};

export default function TransactionForm({ spreadsheetId, sheetRange }: { spreadsheetId: string; sheetRange: string }) {
  const [input, setInput] = useState('');
  
  // State untuk form internal
  const [category, setCategory] = useState('Food');
  const [type, setType] = useState('Expense');
  const [parsedAmount, setParsedAmount] = useState(0);
  const [parsedDesc, setParsedDesc] = useState('');
  
  const [errorMsg, setErrorMsg] = useState('');
  const queryClient = useQueryClient();

  // Live Parsing Logic saat user mengetik
  useEffect(() => {
    if (!input.trim()) {
      setParsedAmount(0);
      setParsedDesc('');
      return;
    }

    const parts = input.trim().split(' ');
    const lastPart = parts[parts.length - 1];
    
    // Hapus titik/koma jika user mengetik manual format ribuan (misal: 25.000)
    const cleanNumber = lastPart.replace(/[^0-9]/g, ''); 
    
    if (cleanNumber && !isNaN(Number(cleanNumber)) && parts.length > 1) {
      setParsedAmount(Number(cleanNumber));
      const textOnly = parts.slice(0, -1).join(' ');
      setParsedDesc(textOnly);
      
      // Coba tebak kategori
      const autoGuess = categorizeInput(textOnly);
      if (autoGuess) {
        setCategory(autoGuess.cat);
        setType(autoGuess.type);
      }
    } else {
      // Jika format belum benar
      setParsedAmount(0);
      setParsedDesc(input);
    }
  }, [input]);

  const mutation = useMutation({
    mutationFn: (transactionData: string[]) => appendSheetData(spreadsheetId, sheetRange, transactionData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sheetData'] });
      setInput('');
      setErrorMsg('');
    },
    onError: (err: any) => setErrorMsg(err.message || 'Gagal menyimpan'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return setErrorMsg('Input tidak boleh kosong');
    if (parsedAmount <= 0) return setErrorMsg('Mohon masukkan nominal yang valid di akhir kata (Cth: Nasi 25000)');

    const date = new Date().toISOString().split('T')[0];
    const transactionData = [date, parsedDesc || 'General', category, parsedAmount.toString(), type];

    mutation.mutate(transactionData);
  };

  return (
    <div className="bg-zinc-900/80 p-6 rounded-2xl border border-zinc-800/80 shadow-lg backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="text-blue-400" size={20} />
        <h3 className="font-bold text-lg text-zinc-100 tracking-tight">Smart Add</h3>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            placeholder="Ketik pengeluaran... (Contoh: Nasi Padang 25000)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-zinc-950/80 border border-zinc-700/80 rounded-xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-zinc-100 placeholder:text-zinc-600 shadow-inner"
            autoFocus
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-zinc-950/80 border border-zinc-700/80 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-zinc-200"
          >
            <option value="Food">Food</option>
            <option value="Transport">Transport</option>
            <option value="Bills">Bills</option>
            <option value="Entertainment">Entertainment</option>
            <option value="Income">Income</option>
            <option value="Other">Other</option>
          </select>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="bg-zinc-950/80 border border-zinc-700/80 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-zinc-200"
          >
            <option value="Expense">Expense</option>
            <option value="Income">Income</option>
          </select>
          <button
            type="submit"
            disabled={mutation.isPending || parsedAmount === 0}
            className="bg-zinc-100 hover:bg-white text-zinc-950 disabled:opacity-50 disabled:hover:bg-zinc-100 font-bold px-8 py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
          >
            <Plus size={20} /> {mutation.isPending ? '...' : 'Add'}
          </button>
        </div>

        {/* Live Preview Bar - Fitur Premium */}
        {input.trim() && (
          <div className="flex items-center gap-2 px-2 text-sm">
            <span className="text-zinc-500">Membaca:</span>
            {parsedAmount > 0 ? (
              <div className="flex flex-wrap gap-2 items-center text-zinc-300">
                <span className="bg-zinc-800 px-2 py-1 rounded-md border border-zinc-700">{parsedDesc}</span>
                <span className="text-zinc-500">&rarr;</span>
                <span className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded-md border border-blue-500/20">{category}</span>
                <span className={`px-2 py-1 rounded-md border font-semibold ${type === 'Income' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                  Rp {parsedAmount.toLocaleString('id-ID')}
                </span>
              </div>
            ) : (
              <span className="text-rose-400/80 animate-pulse">Menunggu angka nominal di akhir...</span>
            )}
          </div>
        )}

        {errorMsg && <p className="text-rose-400 px-2 text-sm">{errorMsg}</p>}
      </form>
    </div>
  );
}