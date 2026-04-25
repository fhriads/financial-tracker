// filepath: components/Dashboard/StatCards.tsx
interface StatCardsProps {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  isOverBudget: boolean;
}

export default function StatCards({ totalBalance, totalIncome, totalExpense, isOverBudget }: StatCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Total Balance */}
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-900/80 p-6 rounded-2xl border border-zinc-800/80 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-[40px] -mr-10 -mt-10"></div>
        <p className="text-zinc-400 text-sm font-medium mb-2 relative z-10">Total Balance</p>
        <h2 className="text-3xl font-bold tracking-tight relative z-10">
          Rp {totalBalance.toLocaleString('id-ID')}
        </h2>
      </div>

      {/* Total Income */}
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-900/80 p-6 rounded-2xl border border-zinc-800/80 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-[40px] -mr-10 -mt-10"></div>
        <p className="text-zinc-400 text-sm font-medium mb-2 relative z-10">Total Income</p>
        <h2 className="text-3xl font-bold text-emerald-400 tracking-tight relative z-10">
          Rp {totalIncome.toLocaleString('id-ID')}
        </h2>
      </div>

      {/* Total Expense */}
      <div className={`bg-gradient-to-br from-zinc-900 to-zinc-900/80 p-6 rounded-2xl border ${
        isOverBudget ? 'border-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.15)]' : 'border-zinc-800/80 shadow-lg'
      } relative overflow-hidden transition-all duration-500`}>
        <div className={`absolute top-0 right-0 w-32 h-32 ${
          isOverBudget ? 'bg-rose-500/10' : 'bg-rose-500/5'
        } rounded-full blur-[40px] -mr-10 -mt-10`}></div>
        <div className="flex justify-between items-start relative z-10">
          <p className="text-zinc-400 text-sm font-medium mb-2">Total Expense</p>
          {isOverBudget && (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-400">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
              <line x1="12" x2="12" y1="9" y2="13"/>
              <line x1="12" x2="12.01" y1="17" y2="17"/>
            </svg>
          )}
        </div>
        <h2 className="text-3xl font-bold text-rose-400 tracking-tight relative z-10">
          Rp {totalExpense.toLocaleString('id-ID')}
        </h2>
        {isOverBudget && <p className="text-xs text-rose-400/80 mt-2 relative z-10">Budget exceeded!</p>}
      </div>
    </div>
  );
}