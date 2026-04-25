// filepath: components/Dashboard/TransactionTable.tsx
import { Trash2 } from 'lucide-react';

interface Transaction {
  originalIndex: number;
  date: string;
  desc: string;
  category: string;
  amount: number;
  type: string;
}

interface TransactionTableProps {
  data: Transaction[];
  isLoading: boolean;
  currentPage: number;
  itemsPerPage: number;
  onDelete: (index: number) => void;
  deleteMutation: { isPending: boolean };
}

export default function TransactionTable({
  data,
  isLoading,
  currentPage,
  itemsPerPage,
  onDelete,
  deleteMutation,
}: TransactionTableProps) {
  const paginatedData = data.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
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
          {isLoading ? (
            <tr>
              <td colSpan={5} className="p-8 text-center text-zinc-500 animate-pulse">
                Loading secure data...
              </td>
            </tr>
          ) : paginatedData.length === 0 ? (
            <tr>
              <td colSpan={5} className="p-8 text-center text-zinc-500">
                No transactions found.
              </td>
            </tr>
          ) : (
            paginatedData.map((row) => (
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
                    onClick={() => onDelete(row.originalIndex)}
                    disabled={deleteMutation.isPending}
                    className="p-1.5 text-zinc-600 opacity-0 group-hover:opacity-100 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all disabled:opacity-50"
                    title="Delete transaction"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}