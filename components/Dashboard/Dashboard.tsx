// filepath: components/Dashboard/Dashboard.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react'; // <-- signIn diimpor di sini
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSheetData, deleteSheetRow } from '@/lib/googleSheets';
import TransactionForm from '@/components/TransactionForm';
import Header from './Header';
import StatCards from './StatCards';
import TableControls from './TableControls';
import TransactionTable from './TransactionTable';
import Pagination from './Pagination';
import { BalanceTrendChart, MonthlyCashflowChart, ExpensesByCategoryChart } from './Charts';

const SHEET_RANGE = 'Sheet1!A2:E';
const SPREADSHEET_ID = process.env.NEXT_PUBLIC_SPREADSHEET_ID as string;
const SHEET_ID = Number(process.env.NEXT_PUBLIC_SHEET_ID || 0);
const ITEMS_PER_PAGE = 8;
const BUDGET_LIMIT = 5000000;

interface ProcessedTransaction {
  originalIndex: number;
  date: string;
  desc: string;
  category: string;
  amount: number;
  type: string;
}

interface DashboardStats {
  totalIncome: number;
  totalExpense: number;
  totalBalance: number;
  chartData: { name: string; value: number }[];
  lineData: { date: string; Balance: number }[];
  barData: { name: string; Income: number; Expense: number }[];
  filteredData: ProcessedTransaction[];
  isOverBudget: boolean;
}

export default function Dashboard() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  // Fetch data from Google Sheets
  const { data, isLoading, error } = useQuery({
    queryKey: ['sheetData'],
    queryFn: () => getSheetData(SPREADSHEET_ID, SHEET_RANGE),
    enabled: !!session,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (rowIndex: number) => deleteSheetRow(SPREADSHEET_ID, SHEET_ID, rowIndex),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sheetData'] }),
  });

  // State for pagination and filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  // Process data for charts and table
  const stats = useMemo((): DashboardStats => {
    if (!data) {
      return {
        totalIncome: 0,
        totalExpense: 0,
        totalBalance: 0,
        chartData: [],
        lineData: [],
        barData: [],
        filteredData: [],
        isOverBudget: false,
      };
    }

    let inc = 0, exp = 0, runningBalance = 0;
    const categoryMap: Record<string, number> = {};
    const dateMap: Record<string, { date: string; Balance: number }> = {};
    const monthMap: Record<string, { name: string; Income: number; Expense: number }> = {};

    // Process raw data
    const processedData = data.map((row: string[], index: number) => ({
      originalIndex: index + 1,
      date: row[0],
      desc: row[1],
      category: row[2],
      amount: Number(row[3]) || 0,
      type: row[4],
    }));

    // Sort for charts (chronological)
    const sortedForCharts = [...processedData].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Calculate stats
    sortedForCharts.forEach((item) => {
      if (item.type === 'Income') {
        inc += item.amount;
        runningBalance += item.amount;
      } else {
        exp += item.amount;
        runningBalance -= item.amount;
        categoryMap[item.category] = (categoryMap[item.category] || 0) + item.amount;
      }

      // Line chart data
      dateMap[item.date] = { date: item.date.substring(5), Balance: runningBalance };

      // Bar chart data
      const month = item.date.substring(0, 7);
      if (!monthMap[month]) monthMap[month] = { name: month, Income: 0, Expense: 0 };
      monthMap[month][item.type as 'Income' | 'Expense'] += item.amount;
    });

    // Filter and sort for table (newest first)
    let tableData = [...processedData].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    if (searchTerm) {
      tableData = tableData.filter((item) =>
        item.desc.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filterCategory !== 'All') {
      tableData = tableData.filter((item) => item.category === filterCategory);
    }

    return {
      totalIncome: inc,
      totalExpense: exp,
      totalBalance: inc - exp,
      isOverBudget: exp > BUDGET_LIMIT,
      chartData: Object.entries(categoryMap).map(([name, value]) => ({ name, value })),
      lineData: Object.values(dateMap),
      barData: Object.values(monthMap).sort((a, b) => a.name.localeCompare(b.name)),
      filteredData: tableData,
    };
  }, [data, searchTerm, filterCategory]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(stats.filteredData.length / ITEMS_PER_PAGE));

  // Reset page when search/filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCategory]);

  // Handle delete
  const handleDelete = (index: number) => {
    deleteMutation.mutate(index);
  };

  // Render login screen if not authenticated
  if (!session) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 p-6 md:p-12 font-sans selection:bg-blue-500/30">
      <div className="max-w-[1400px] mx-auto space-y-8">
        <Header onLogout={() => signOut()} />

        {error && (
          <div className="bg-rose-950/30 border border-rose-900/50 text-rose-400 p-4 rounded-xl text-sm">
            {(error as Error).message}
          </div>
        )}

        <StatCards
          totalBalance={stats.totalBalance}
          totalIncome={stats.totalIncome}
          totalExpense={stats.totalExpense}
          isOverBudget={stats.isOverBudget}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-8">
            <TransactionForm spreadsheetId={SPREADSHEET_ID} sheetRange={SHEET_RANGE} />

            <div className="bg-zinc-900/80 p-6 rounded-2xl border border-zinc-800/80 shadow-lg backdrop-blur-sm space-y-6">
              <TableControls
                searchTerm={searchTerm}
                filterCategory={filterCategory}
                onSearchChange={setSearchTerm}
                onFilterChange={setFilterCategory}
              />

              <TransactionTable
                data={stats.filteredData}
                isLoading={isLoading}
                currentPage={currentPage}
                itemsPerPage={ITEMS_PER_PAGE}
                onDelete={handleDelete}
                deleteMutation={deleteMutation}
              />

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>

          <div className="space-y-6">
            <BalanceTrendChart data={stats.lineData} />
            <MonthlyCashflowChart data={stats.barData} />
            <ExpensesByCategoryChart data={stats.chartData} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Login Screen Component
function LoginScreen() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-zinc-950 overflow-hidden font-sans">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="relative z-10 w-full max-w-md p-10 bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/50 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)] flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-zinc-800 to-zinc-950 border border-zinc-700/50 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-200">
            <line x1="12" x2="12" y1="20" y2="10"/>
            <line x1="18" x2="18" y1="20" y2="4"/>
            <line x1="6" x2="6" y1="20" y2="14"/>
          </svg>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight mb-3 bg-gradient-to-r from-zinc-100 to-zinc-500 bg-clip-text text-transparent">
          Financial Tracker DISSZ
        </h1>
        <p className="text-zinc-400 mb-10 text-sm leading-relaxed">
          Personal wealth management synced securely with your Google Sheets.
        </p>
        <button
          onClick={() => signIn('google')}
          className="w-full flex items-center justify-center gap-3 bg-zinc-100 text-zinc-900 px-6 py-3.5 rounded-xl font-semibold hover:bg-white transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.15)] active:scale-[0.98]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
            <polyline points="10 17 15 12 10 7"/>
            <line x1="15" x2="3" y1="12" y2="12"/>
          </svg>
          Continue with Google
        </button>
      </div>
    </div>
  );
}