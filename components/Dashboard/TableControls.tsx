// filepath: components/Dashboard/TableControls.tsx
import { Search, Filter } from 'lucide-react';

interface TableControlsProps {
  searchTerm: string;
  filterCategory: string;
  onSearchChange: (value: string) => void;
  onFilterChange: (value: string) => void;
}

export default function TableControls({
  searchTerm,
  filterCategory,
  onSearchChange,
  onFilterChange,
}: TableControlsProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
      <h3 className="font-bold text-lg text-zinc-100 tracking-tight">Recent Transactions</h3>
      <div className="flex gap-3 w-full sm:w-auto">
        {/* Search Input */}
        <div className="relative flex-1 sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
          <input
            type="text"
            placeholder="Search desc..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-zinc-200"
          />
        </div>

        {/* Category Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
          <select
            value={filterCategory}
            onChange={(e) => onFilterChange(e.target.value)}
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
  );
}