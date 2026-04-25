// filepath: components/Dashboard/Header.tsx
import { Wallet, LogOut } from 'lucide-react';

interface HeaderProps {
  onLogout: () => void;
}

export default function Header({ onLogout }: HeaderProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-zinc-900/40 p-4 rounded-2xl border border-zinc-800/50 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-zinc-800 rounded-lg border border-zinc-700">
          <Wallet className="text-zinc-300" size={24} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Financial Tracker DISSZ</h1>
      </div>
      <button
        onClick={onLogout}
        className="flex items-center gap-2 bg-rose-500/10 text-rose-400 border border-rose-500/20 px-5 py-2.5 rounded-xl hover:bg-rose-500/20 transition-all font-medium text-sm"
      >
        <LogOut size={18} /> Logout
      </button>
    </div>
  );
}