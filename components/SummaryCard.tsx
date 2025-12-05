import React from 'react';

interface SummaryCardProps {
  title: string;
  amount: number;
  icon: React.ReactNode;
  colorClass: string;
  subtext?: string;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ title, amount, icon, colorClass, subtext }) => {
  const formattedAmount = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP', // Using COP as generic or USD based on preference, easily changeable
    minimumFractionDigits: 0
  }).format(amount);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100 flex items-center space-x-4 hover:shadow-md transition-shadow">
      <div className={`p-3 rounded-full ${colorClass} bg-opacity-10 text-xl flex-shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h3 className={`text-2xl font-bold ${colorClass.replace('bg-', 'text-')}`}>
          {formattedAmount}
        </h3>
        {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
      </div>
    </div>
  );
};