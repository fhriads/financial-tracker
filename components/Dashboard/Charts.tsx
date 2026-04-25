// filepath: components/Dashboard/Charts.tsx
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface ChartData {
  name: string;
  value: number;
}

interface LineChartData {
  date: string;
  Balance: number;
}

interface BarChartData {
  name: string;
  Income: number;
  Expense: number;
}

// Color palette for charts
const COLORS = ['#3b82f6', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];

export function BalanceTrendChart({ data }: { data: LineChartData[] }) {
  return (
    <div className="bg-zinc-900/80 p-6 rounded-2xl border border-zinc-800/80 shadow-lg h-[260px] flex flex-col backdrop-blur-sm">
      <h3 className="font-bold text-sm mb-4 text-zinc-100 tracking-tight">Balance Trend</h3>
      <div className="flex-1 -ml-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="date" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '8px',
              }}
              formatter={(val) => [`Rp ${Number(val ?? 0).toLocaleString('id-ID')}`, 'Balance']}
            />
            <Line
              type="monotone"
              dataKey="Balance"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6, fill: '#3b82f6' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function MonthlyCashflowChart({ data }: { data: BarChartData[] }) {
  return (
    <div className="bg-zinc-900/80 p-6 rounded-2xl border border-zinc-800/80 shadow-lg h-[260px] flex flex-col backdrop-blur-sm">
      <h3 className="font-bold text-sm mb-4 text-zinc-100 tracking-tight">Monthly Cashflow</h3>
      <div className="flex-1 -ml-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="name" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '8px',
              }}
              formatter={(val) => [`Rp ${Number(val ?? 0).toLocaleString('id-ID')}`]}
              cursor={{ fill: '#27272a', opacity: 0.4 }}
            />
            <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function ExpensesByCategoryChart({ data }: { data: ChartData[] }) {
  return (
    <div className="bg-zinc-900/80 p-6 rounded-2xl border border-zinc-800/80 shadow-lg h-[260px] flex flex-col backdrop-blur-sm">
      <h3 className="font-bold text-sm mb-2 text-zinc-100 tracking-tight">Expenses by Category</h3>
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={70}
              paddingAngle={4}
              stroke="none"
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '8px',
              }}
              formatter={(val) => [`Rp ${Number(val ?? 0).toLocaleString('id-ID')}`]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}