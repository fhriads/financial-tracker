'use client';

import { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { appendSheetData } from '@/lib/googleSheets';
import { Plus, Sparkles, MessageSquare, X, Send, Bot, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

// Logika cerdas untuk NLP (Natural Language Processing)
const categorizeInput = (text: string) => {
  const lower = text.toLowerCase();
  if (lower.match(/makan|nasi|kopi|minum|food|snack|resto|cafe|roti|susu/)) return { cat: 'Food', type: 'Expense' };
  if (lower.match(/gojek|grab|bensin|tol|parkir|transport|tiket|kereta|pesawat/)) return { cat: 'Transport', type: 'Expense' };
  if (lower.match(/listrik|air|wifi|internet|pulsa|tagihan|bpjs|cicilan|kos|sewa/)) return { cat: 'Bills', type: 'Expense' };
  if (lower.match(/nonton|game|bioskop|spotify|netflix|main|hobi|buku/)) return { cat: 'Entertainment', type: 'Expense' };
  if (lower.match(/gaji|bonus|thr|profit|jual|uang saku|refund/)) return { cat: 'Income', type: 'Income' };
  return null;
};

interface ParsedTransaction {
  date: string;
  description: string;
  category: string;
  amount: number;
  type: string;
}

export default function TransactionForm({ spreadsheetId, sheetRange }: { spreadsheetId: string; sheetRange: string }) {
  const [input, setInput] = useState('');
  const [isAIMode, setIsAIMode] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [aiTransactions, setAiTransactions] = useState<ParsedTransaction[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  
  // State untuk form internal
  const [category, setCategory] = useState('Food');
  const [type, setType] = useState('Expense');
  const [parsedAmount, setParsedAmount] = useState(0);
  const [parsedDesc, setParsedDesc] = useState('');
  
  const [errorMsg, setErrorMsg] = useState('');
  const queryClient = useQueryClient();
  const aiInputRef = useRef<HTMLTextAreaElement>(null);

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

  // AI Mode handlers
  const handleAISubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiMessage.trim()) return;
    
    setAiLoading(true);
    setAiError('');
    setShowPreview(true);

    try {
      const response = await fetch('/api/ai/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dailySummary: aiMessage }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Gagal memproses');
      }

      setAiTransactions(data.transactions || []);
    } catch (err: any) {
      setAiError(err.message || 'Terjadi kesalahan');
      setAiTransactions([]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAddAllAI = async () => {
    setAiLoading(true);
    
    try {
      for (const t of aiTransactions) {
        const transactionData = [t.date, t.description, t.category, t.amount.toString(), t.type];
        await mutation.mutateAsync(transactionData);
      }
      
      // Reset AI state setelah semua berhasil
      setAiMessage('');
      setAiTransactions([]);
      setShowPreview(false);
    } catch (err: any) {
      setAiError(err.message || 'Gagal menyimpan beberapa transaksi');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAddSingleAI = async (t: ParsedTransaction) => {
    try {
      const transactionData = [t.date, t.description, t.category, t.amount.toString(), t.type];
      await mutation.mutateAsync(transactionData);
      setAiTransactions(prev => prev.filter(item => item !== t));
    } catch (err: any) {
      setAiError(err.message || 'Gagal menyimpan transaksi');
    }
  };

  const toggleAIMode = () => {
    setIsAIMode(!isAIMode);
    setAiMessage('');
    setAiTransactions([]);
    setShowPreview(false);
    setAiError('');
  };

  return (
    <div className="bg-zinc-900/80 p-6 rounded-2xl border border-zinc-800/80 shadow-lg backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="text-blue-400" size={20} />
          <h3 className="font-bold text-lg text-zinc-100 tracking-tight">
            {isAIMode ? 'AI Assistant' : 'Smart Add'}
          </h3>
        </div>
        <button
          onClick={toggleAIMode}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            isAIMode 
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500/30' 
              : 'bg-zinc-800/50 text-zinc-400 border border-zinc-700/50 hover:bg-zinc-700/50'
          }`}
        >
          <Bot size={16} />
          {isAIMode ? 'Mode Teks' : 'AI Chat'}
        </button>
      </div>

      {!isAIMode ? (
        // Original Smart Add Mode
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
      ) : (
        // AI Chat Mode
        <form onSubmit={handleAISubmit} className="space-y-4">
          <div className="bg-zinc-950/50 border border-zinc-800/50 rounded-xl p-4">
            <label className="text-zinc-400 text-sm mb-2 block">
              Ceritakan pengeluaranmu hari ini:
            </label>
            <textarea
              ref={aiInputRef}
              value={aiMessage}
              onChange={(e) => setAiMessage(e.target.value)}
              placeholder="Contoh: Hari ini pagi makan nasi goreng 15000, siang naik gojek ke mall 25000, malam beliNetflix 50000, tadi dapat bonus gaji 500000..."
              className="w-full bg-transparent border-none focus:outline-none text-zinc-100 placeholder:text-zinc-600 resize-none"
              rows={3}
            />
          </div>

          <button
            type="submit"
            disabled={aiLoading || !aiMessage.trim()}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white disabled:opacity-50 disabled:hover:from-purple-600 disabled:hover:to-blue-600 font-bold px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            {aiLoading ? (
              <>
                <Loader2 size={20} className="animate-spin" /> Menganalisis...
              </>
            ) : (
              <>
                <Bot size={20} /> Analisis dengan AI
              </>
            )}
          </button>

          {aiError && (
            <div className="bg-rose-950/30 border border-rose-900/50 text-rose-400 p-3 rounded-xl text-sm">
              {aiError}
            </div>
          )}

          {/* AI Preview Section */}
          {showPreview && aiTransactions.length > 0 && (
            <div className="border border-zinc-700/50 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="w-full flex items-center justify-between p-4 bg-zinc-800/30 hover:bg-zinc-800/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Bot className="text-purple-400" size={18} />
                  <span className="text-zinc-200 font-medium">
                    {aiTransactions.length} transaksi terdeteksi
                  </span>
                </div>
                {showPreview ? <ChevronUp size={18} className="text-zinc-400" /> : <ChevronDown size={18} className="text-zinc-400" />}
              </button>
              
              {showPreview && (
                <div className="p-4 space-y-3 bg-zinc-950/30">
                  {aiTransactions.map((t, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50">
                      <div className="flex-1">
                        <p className="text-zinc-200 font-medium text-sm">{t.description}</p>
                        <div className="flex gap-2 mt-1">
                          <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">{t.category}</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${t.type === 'Income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                            {t.type}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold text-sm ${t.type === 'Income' ? 'text-emerald-400' : 'text-zinc-200'}`}>
                          {t.type === 'Income' ? '+' : '-'} Rp {t.amount.toLocaleString('id-ID')}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleAddSingleAI(t)}
                          disabled={mutation.isPending}
                          className="text-xs text-blue-400 hover:text-blue-300 mt-1 disabled:opacity-50"
                        >
                          {mutation.isPending ? '...' : '+ Tambah'}
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  <button
                    type="button"
                    onClick={handleAddAllAI}
                    disabled={aiLoading || mutation.isPending}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {aiLoading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />} 
                    {aiLoading ? 'Menyimpan...' : `Tambah Semua (${aiTransactions.length})`}
                  </button>
                </div>
              )}
            </div>
          )}

          {showPreview && aiTransactions.length === 0 && !aiLoading && !aiError && (
            <div className="bg-zinc-800/30 border border-zinc-700/50 text-zinc-400 p-4 rounded-xl text-sm text-center">
              Tidak ada transaksi yang terdeteksi. Coba jelaskan lebih detail!
            </div>
          )}
        </form>
      )}
    </div>
  );
}