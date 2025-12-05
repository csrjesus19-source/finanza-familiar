import React from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  BarChart, Bar, Legend 
} from 'recharts';
import { Transaction } from '../types';

interface DashboardChartsProps {
  transactions: Transaction[];
}

export const DashboardCharts: React.FC<DashboardChartsProps> = ({ transactions }) => {
  
  // --- DATA PREPARATION ---

  // 1. Group by Date (For Bar & Area Charts)
  const groupedByDate = transactions.reduce((acc, t) => {
    // FIX: Use Local Date String for grouping to match the table and form input
    const dateObj = new Date(t.date);
    // Use the same locale format as the main view to ensure consistency
    const displayDate = dateObj.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
    // Key for sorting: simple local date string YYYY-MM-DD
    const dateKey = dateObj.getFullYear() + '-' + String(dateObj.getMonth() + 1).padStart(2, '0') + '-' + String(dateObj.getDate()).padStart(2, '0');

    if (!acc[dateKey]) {
        acc[dateKey] = { 
            date: dateKey, 
            displayDate, 
            income: 0, 
            expense: 0, 
            balance: 0,
            sortDate: dateObj.getTime() 
        };
    }
    
    if (t.type === 'income') {
        acc[dateKey].income += t.amount;
        acc[dateKey].balance += t.amount;
    } else {
        acc[dateKey].expense += t.amount;
        acc[dateKey].balance -= t.amount;
    }
    return acc;
  }, {} as Record<string, any>);

  // Sort chronologically and calculate cumulative balance for Area chart
  let cumulativeBalance = 0;
  const timeSeriesData = Object.values(groupedByDate)
    .sort((a: any, b: any) => a.sortDate - b.sortDate)
    .map((item: any) => {
        cumulativeBalance += (item.income - item.expense);
        return { ...item, cumulative: cumulativeBalance };
    });

  // 2. Group by Category (For Pie Chart) - Expenses Only
  const expenses = transactions.filter(t => t.type === 'expense');
  const expensesByCategory = expenses.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {} as Record<string, number>);

  const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);

  const pieData = Object.keys(expensesByCategory).map(key => ({
    name: key,
    value: expensesByCategory[key],
    percent: totalExpense > 0 ? (expensesByCategory[key] / totalExpense) * 100 : 0
  })).sort((a, b) => b.value - a.value);

  // --- CONFIGURATION ---

  const COLORS = [
    '#6366f1', // Indigo
    '#ec4899', // Pink
    '#f59e0b', // Amber
    '#10b981', // Emerald
    '#06b6d4', // Cyan
    '#8b5cf6', // Violet
    '#ef4444', // Red
    '#64748b'  // Slate
  ];

  const currencyFormatter = (value: number) => 
    new Intl.NumberFormat('es-CO', { 
      style: 'currency', 
      currency: 'COP', 
      maximumFractionDigits: 0,
      notation: value > 1000000 ? 'compact' : 'standard' 
    }).format(value);

  const tooltipFormatter = (value: number) => 
    new Intl.NumberFormat('es-CO', { 
      style: 'currency', 
      currency: 'COP', 
      maximumFractionDigits: 0 
    }).format(value);

  // Custom Glassmorphism Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-xl border border-white/50 ring-1 ring-black/5 z-50">
          <p className="text-slate-500 text-xs font-bold mb-2 uppercase tracking-wider">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-3 mb-1.5 last:mb-0">
              <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: entry.color }}></div>
              <div className="flex flex-col">
                 <span className="text-slate-600 text-xs font-semibold capitalize">{entry.name}</span>
                 <span className="text-slate-900 text-sm font-bold font-mono">
                    {tooltipFormatter(entry.value)}
                 </span>
              </div>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      
      {/* 1. CHART: Daily Cash Flow (Bars) */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 lg:col-span-2">
         <div className="flex justify-between items-end mb-6">
            <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-indigo-500">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                    </svg>
                    Flujo de Caja Diario
                </h3>
                <p className="text-xs text-slate-400 font-medium ml-7">Ingresos vs. Gastos por día</p>
            </div>
         </div>
         
         {/* FIX: Use fixed height h-72 instead of relying on flex to avoid width(-1) warning */}
         <div className="h-72 w-full">
            {timeSeriesData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={timeSeriesData} barGap={4}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                            dataKey="displayDate" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }}
                            dy={10}
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }}
                            tickFormatter={currencyFormatter}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                        <Bar 
                            dataKey="income" 
                            name="Ingresos" 
                            fill="#10b981" 
                            radius={[4, 4, 0, 0]} 
                            barSize={12}
                        />
                        <Bar 
                            dataKey="expense" 
                            name="Gastos" 
                            fill="#f43f5e" 
                            radius={[4, 4, 0, 0]} 
                            barSize={12}
                        />
                    </BarChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-300">
                    <p className="text-sm font-medium">Registra movimientos para visualizar</p>
                </div>
            )}
         </div>
      </div>

      {/* 2. CHART: Expense Structure (Donut) */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
         <div className="mb-2">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-pink-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" />
                </svg>
                Estructura de Gastos
            </h3>
         </div>
         
         {/* FIX: Fixed height instead of flex-1 to prevent initial render warnings */}
         <div className="h-72 w-full relative">
            {pieData.length > 0 ? (
                <>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                            cornerRadius={6}
                        >
                            {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                </ResponsiveContainer>
                {/* Center Text overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total</span>
                    <span className="text-xl font-extrabold text-slate-800">{currencyFormatter(totalExpense)}</span>
                </div>
                </>
            ) : (
                <div className="h-full flex items-center justify-center">
                    <p className="text-slate-300 text-sm font-medium">Sin gastos registrados</p>
                </div>
            )}
         </div>
         
         {/* Custom Legend Below */}
         <div className="mt-4 grid grid-cols-2 gap-2">
            {pieData.slice(0, 4).map((entry, index) => (
                <div key={entry.name} className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                        <span className="text-slate-600 font-medium truncate max-w-[80px]">{entry.name}</span>
                    </div>
                    <span className="font-bold text-slate-800">{Math.round(entry.percent)}%</span>
                </div>
            ))}
         </div>
      </div>

      {/* 3. CHART: Net Balance Trend (Area) */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
         <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-emerald-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.307a11.95 11.95 0 0 1 5.814-5.519l2.74-1.22m0 0-5.94-2.28m5.94 2.28-2.28 5.941" />
                </svg>
                Tendencia de Ahorro
            </h3>
            <p className="text-xs text-slate-400 font-medium ml-7">Acumulado Neto</p>
         </div>
         
         {/* FIX: Fixed height h-72 instead of flex-1 to prevent warning */}
         <div className="h-72 w-full">
            {timeSeriesData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={timeSeriesData} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                            dataKey="displayDate" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }}
                            dy={10}
                        />
                         <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }}
                            tickFormatter={currencyFormatter}
                            width={40}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area 
                            type="monotone" 
                            dataKey="cumulative" 
                            name="Balance Neto"
                            stroke="#6366f1" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorBalance)" 
                            dot={{ r: 4, fill: "#6366f1", strokeWidth: 2, stroke: "#fff" }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-full flex items-center justify-center text-slate-300">
                    <p className="text-sm font-medium">Registra movimientos para ver la tendencia</p>
                </div>
            )}
         </div>
      </div>

    </div>
  );
};