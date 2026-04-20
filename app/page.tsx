'use client';

import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession, signIn, signOut, SessionProvider } from 'next-auth/react';
import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Trash2, LogIn, LogOut, TrendingUp, Wallet, Search, Filter, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { getSheetData, deleteSheetRow } from '@/lib/googleSheets';
import TransactionForm from '@/components/TransactionForm';

const queryClient = new QueryClient();
const SHEET_RANGE = 'Sheet1!A2:E';
const SPREADSHEET_ID = process.env.NEXT_PUBLIC_SPREADSHEET_ID as string;
const SHEET_ID = Number(process.env.NEXT_PUBLIC_SHEET_ID || 0);

export default function App() {
  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <Dashboard />
      </QueryClientProvider>
    </SessionProvider>
  );
}

function Dashboard() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  // UX States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;
  const BUDGET_LIMIT = 5000000; // Contoh limit budget bulanan

  const { data, isLoading, error } = useQuery({
    queryKey: ['sheetData'],
    queryFn: () => getSheetData(SPREADSHEET_ID, SHEET_RANGE),
    enabled: !!session,
  });

  const deleteMutation = useMutation({
    mutationFn: (rowIndex: number) => deleteSheetRow(SPREADSHEET_ID, SHEET_ID, rowIndex),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sheetData'] }),
  });

  const { totalIncome, totalExpense, totalBalance, chartData, lineData, barData, filteredData, isOverBudget } = useMemo(() => {
    if (!data) return { totalIncome: 0, totalExpense: 0, totalBalance: 0, chartData: [], lineData: [], barData: [], filteredData: [], isOverBudget: false };
    
    let inc = 0, exp = 0, runningBalance = 0;
    const categoryMap: Record<string, number> = {};
    const dateMap: Record<string, { date: string, Balance: number }> = {};
    const monthMap: Record<string, { name: string, Income: number, Expense: number }> = {};

    // Process & add original index for deletion
    const processedData = data.map((row: string[], index: number) => ({
      originalIndex: index + 1,
      date: row[0],
      desc: row[1],
      category: row[2],
      amount: Number(row[3]) || 0,
      type: row[4],
    }));

    // Data for charts (Chronological order)
    const sortedForCharts = [...processedData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    sortedForCharts.forEach((item) => {
      if (item.type === 'Income') {
        inc += item.amount;
        runningBalance += item.amount;
      } else {
        exp += item.amount;
        runningBalance -= item.amount;
        categoryMap[item.category] = (categoryMap[item.category] || 0) + item.amount;
      }

      // Line Chart: Balance over time
      dateMap[item.date] = { date: item.date.substring(5), Balance: runningBalance }; // Show MM-DD

      // Bar Chart: Monthly Income vs Expense
      const month = item.date.substring(0, 7);
      if (!monthMap[month]) monthMap[month] = { name: month, Income: 0, Expense: 0 };
      monthMap[month][item.type as 'Income' | 'Expense'] += item.amount;
    });

    // Filtering & Sorting for Table (Newest first)
    let tableData = [...processedData].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    if (searchTerm) {
      tableData = tableData.filter(item => item.desc.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (filterCategory !== 'All') {
      tableData = tableData.filter(item => item.category === filterCategory);
    }

    return {
      totalIncome: inc,
      totalExpense: exp,
      totalBalance: inc - exp,
      isOverBudget: exp > BUDGET_LIMIT,
      chartData: Object.entries(categoryMap).map(([name, value]) => ({ name, value })),
      lineData: Object.values(dateMap),
      barData: Object.values(monthMap).sort((a, b) => a.name.localeCompare(b.name)),
      filteredData: tableData
    };
  }, [data, searchTerm, filterCategory]);

  // Pagination Logic
  const totalPages = Math.max(1, Math.ceil(filteredData.length / ITEMS_PER_PAGE));
  const paginatedData = filteredData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Auto reset page when searching
  useMemo(() => setCurrentPage(1), [searchTerm, filterCategory]);

  if (!session) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-zinc-950 overflow-hidden font-sans">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="relative z-10 w-full max-w-md p-10 bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/50 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)] flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-zinc-800 to-zinc-950 border border-zinc-700/50 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
            <TrendingUp className="text-zinc-200" size={32} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-3 bg-gradient-to-r from-zinc-100 to-zinc-500 bg-clip-text text-transparent">
            Financial Tracker DISSZ
          </h1>
          <p className="text-zinc-400 mb-10 text-sm leading-relaxed">
            Personal wealth management synced securely with your Google Sheets.
          </p>
          <button onClick={() => signIn('google')} className="w-full flex items-center justify-center gap-3 bg-zinc-100 text-zinc-900 px-6 py-3.5 rounded-xl font-semibold hover:bg-white transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.15)] active:scale-[0.98]">
            <LogIn size={20} /> Continue with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 p-6 md:p-12 font-sans selection:bg-blue-500/30">
      <div className="max-w-[1400px] mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-zinc-900/40 p-4 rounded-2xl border border-zinc-800/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-zinc-800 rounded-lg border border-zinc-700">
              <Wallet className="text-zinc-300" size={24} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Financial Tracker DISSZ</h1>
          </div>
          <button onClick={() => signOut()} className="flex items-center gap-2 bg-rose-500/10 text-rose-400 border border-rose-500/20 px-5 py-2.5 rounded-xl hover:bg-rose-500/20 transition-all font-medium text-sm">
            <LogOut size={18} /> Logout
          </button>
        </div>

        {error && <div className="bg-rose-950/30 border border-rose-900/50 text-rose-400 p-4 rounded-xl text-sm">{(error as Error).message}</div>}

        {/* 3 Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-900/80 p-6 rounded-2xl border border-zinc-800/80 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-[40px] -mr-10 -mt-10"></div>
            <p className="text-zinc-400 text-sm font-medium mb-2 relative z-10">Total Balance</p>
            <h2 className="text-3xl font-bold tracking-tight relative z-10">Rp {totalBalance.toLocaleString('id-ID')}</h2>
          </div>
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-900/80 p-6 rounded-2xl border border-zinc-800/80 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-[40px] -mr-10 -mt-10"></div>
            <p className="text-zinc-400 text-sm font-medium mb-2 relative z-10">Total Income</p>
            <h2 className="text-3xl font-bold text-emerald-400 tracking-tight relative z-10">Rp {totalIncome.toLocaleString('id-ID')}</h2>
          </div>
          <div className={`bg-gradient-to-br from-zinc-900 to-zinc-900/80 p-6 rounded-2xl border ${isOverBudget ? 'border-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.15)]' : 'border-zinc-800/80 shadow-lg'} relative overflow-hidden transition-all duration-500`}>
            <div className={`absolute top-0 right-0 w-32 h-32 ${isOverBudget ? 'bg-rose-500/10' : 'bg-rose-500/5'} rounded-full blur-[40px] -mr-10 -mt-10`}></div>
            <div className="flex justify-between items-start relative z-10">
              <p className="text-zinc-400 text-sm font-medium mb-2">Total Expense</p>
              {isOverBudget && <AlertTriangle className="text-rose-400" size={18} />}
            </div>
            <h2 className="text-3xl font-bold text-rose-400 tracking-tight relative z-10">Rp {totalExpense.toLocaleString('id-ID')}</h2>
            {isOverBudget && <p className="text-xs text-rose-400/80 mt-2 relative z-10">Budget exceeded!</p>}
          </div>
        </div>

        {/* Main Grid: Left (Form + Table) | Right (Charts) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left Column: Form & Data Table */}
          <div className="lg:col-span-2 space-y-8">
            <TransactionForm spreadsheetId={SPREADSHEET_ID} sheetRange={SHEET_RANGE} />

            <div className="bg-zinc-900/80 p-6 rounded-2xl border border-zinc-800/80 shadow-lg backdrop-blur-sm space-y-6">
              
              {/* Table Controls */}
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                <h3 className="font-bold text-lg text-zinc-100 tracking-tight">Recent Transactions</h3>
                <div className="flex gap-3 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                    <input 
                      type="text" 
                      placeholder="Search desc..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-zinc-200"
                    />
                  </div>
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                    <select 
                      value={filterCategory} 
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="appearance-none bg-zinc-950/50 border border-zinc-800 rounded-xl pl-9 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-zinc-200"
                    >
                      <option value="All">All Categories</option>
                      <option value="Food">Food</option>
                      <option value="Transport">Transport</option>
                      <option value="Bills">Bills</option>
                      <option value="Entertainment">Entertainment</option>
                      <option value="Income">Income</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-xl border border-zinc-800/50">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-zinc-950/40 border-b border-zinc-800/80">
                    <tr>
                      <th className="p-4 text-zinc-400 font-medium tracking-wide text-xs uppercase">Date</th>
                      <th className="p-4 text-zinc-400 font-medium tracking-wide text-xs uppercase">Description</th>
                      <th className="p-4 text-zinc-400 font-medium tracking-wide text-xs uppercase">Category</th>
                      <th className="p-4 text-zinc-400 font-medium tracking-wide text-xs uppercase text-right">Amount</th>
                      <th className="p-4 text-zinc-400 font-medium tracking-wide text-xs uppercase text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {isLoading ? <tr><td colSpan={5} className="p-8 text-center text-zinc-500 animate-pulse">Loading secure data...</td></tr> : null}
                    {!isLoading && paginatedData.length === 0 ? <tr><td colSpan={5} className="p-8 text-center text-zinc-500">No transactions found.</td></tr> : null}
                    
                    {paginatedData.map((row) => (
                      <tr key={row.originalIndex} className="hover:bg-zinc-800/40 transition-colors group">
                        <td className="p-4 text-zinc-400">{row.date}</td>
                        <td className="p-4 font-medium text-zinc-200">{row.desc}</td>
                        <td className="p-4">
                          <span className="bg-zinc-800/80 border border-zinc-700/50 text-zinc-300 px-2.5 py-1 rounded-md text-xs font-medium">
                            {row.category}
                          </span>
                        </td>
                        <td className={`p-4 font-bold text-right ${row.type === 'Income' ? 'text-emerald-400' : 'text-zinc-100'}`}>
                          {row.type === 'Income' ? '+' : '-'} Rp {row.amount.toLocaleString('id-ID')}
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => deleteMutation.mutate(row.originalIndex)}
                            className="p-1.5 text-zinc-600 opacity-0 group-hover:opacity-100 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all disabled:opacity-50"
                            title="Delete transaction"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center pt-2">
                  <p className="text-xs text-zinc-500">Showing page {currentPage} of {totalPages}</p>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 bg-zinc-800/50 text-zinc-300 rounded-lg hover:bg-zinc-700 transition disabled:opacity-30"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 bg-zinc-800/50 text-zinc-300 rounded-lg hover:bg-zinc-700 transition disabled:opacity-30"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Analytics Charts */}
          <div className="space-y-6">
            
            {/* Balance Trend Line Chart */}
            <div className="bg-zinc-900/80 p-6 rounded-2xl border border-zinc-800/80 shadow-lg h-[260px] flex flex-col backdrop-blur-sm">
              <h3 className="font-bold text-sm mb-4 text-zinc-100 tracking-tight">Balance Trend</h3>
              <div className="flex-1 -ml-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineData}>
                    <XAxis dataKey="date" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }} 
                      formatter={(val) => [`Rp ${Number(val ?? 0).toLocaleString('id-ID')}`, 'Balance']}
                    />
                    <Line type="monotone" dataKey="Balance" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#3b82f6' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Income vs Expense Bar Chart */}
            <div className="bg-zinc-900/80 p-6 rounded-2xl border border-zinc-800/80 shadow-lg h-[260px] flex flex-col backdrop-blur-sm">
              <h3 className="font-bold text-sm mb-4 text-zinc-100 tracking-tight">Monthly Cashflow</h3>
              <div className="flex-1 -ml-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <XAxis dataKey="name" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                      formatter={(val) => [`Rp ${Number(val ?? 0).toLocaleString('id-ID')}`]}
                      cursor={{ fill: '#27272a', opacity: 0.4 }}
                    />
                    <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Expenses Pie Chart */}
            <div className="bg-zinc-900/80 p-6 rounded-2xl border border-zinc-800/80 shadow-lg h-[260px] flex flex-col backdrop-blur-sm">
              <h3 className="font-bold text-sm mb-2 text-zinc-100 tracking-tight">Expenses by Category</h3>
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={4} stroke="none">
                      {chartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={['#3b82f6', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'][index % 6]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }} 
                      formatter={(val) => [`Rp ${Number(val ?? 0).toLocaleString('id-ID')}`]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}