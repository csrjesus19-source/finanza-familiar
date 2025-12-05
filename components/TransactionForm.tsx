import React, { useState, useEffect } from 'react';
import { Category, Transaction, TransactionType } from '../types';

interface TransactionFormProps {
  onAddTransaction: (transaction: Transaction) => void;
  onClose?: () => void;
  familyMembers: string[];
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ onAddTransaction, onClose, familyMembers }) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<string>(Category.ALIMENTOS);
  const [description, setDescription] = useState('');
  const [company, setCompany] = useState(''); 
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMember, setSelectedMember] = useState<string>('');

  // Auto-select first member if available
  useEffect(() => {
    if (familyMembers.length > 0 && !selectedMember) {
        setSelectedMember(familyMembers[0]);
    }
  }, [familyMembers]);

  const incomeCategories = [
    Category.SALARIO,
    Category.NEGOCIO,
    Category.OTROS_INGRESOS
  ];

  const expenseCategories = [
    Category.VIVIENDA,
    Category.TRANSPORTE,
    Category.SERVICIOS,
    Category.ALIMENTOS,
    Category.TRANSFERENCIAS,
    Category.DIEZMOS,
    Category.OTROS_GASTOS
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !selectedMember) return;

    // FIX: Date construction to respect Local Timezone
    const [year, month, day] = date.split('-').map(Number);
    const now = new Date();
    // Create date using local components. Note: month is 0-indexed in JS Date
    const transactionDate = new Date(year, month - 1, day, now.getHours(), now.getMinutes(), now.getSeconds());

    // FIX: Use a more compatible ID generation method (timestamp + random) 
    // to avoid issues with crypto.randomUUID() in non-secure contexts (http) or older browsers.
    const safeId = Date.now().toString() + Math.random().toString(36).substring(2);

    const newTransaction: Transaction = {
      id: safeId,
      date: transactionDate.toISOString(),
      amount: parseFloat(amount),
      category,
      description,
      type,
      createdBy: selectedMember,
      company: company 
    };

    onAddTransaction(newTransaction);
    
    // Reset fields
    setAmount('');
    setDescription('');
    setCompany('');
    // Close modal if prop provided
    if (onClose) onClose();
  };

  return (
    <div className="bg-white h-full flex flex-col">
      <div className="flex justify-between items-center p-6 border-b border-slate-100 flex-shrink-0">
        <div>
            <h3 className="text-xl font-bold text-slate-800">Nueva Transacción</h3>
            <p className="text-xs text-slate-400">Complete los detalles del movimiento</p>
        </div>
        
        {onClose && (
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-full hover:bg-slate-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 custom-scrollbar">
        <div className="space-y-4">
            {/* Type Switcher */}
            <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
                type="button"
                onClick={() => { setType('income'); setCategory(Category.SALARIO); }}
                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                type === 'income' 
                    ? 'bg-emerald-500 text-white shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                }`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                Ingreso
            </button>
            <button
                type="button"
                onClick={() => { setType('expense'); setCategory(Category.ALIMENTOS); }}
                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                type === 'expense' 
                    ? 'bg-rose-500 text-white shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                }`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Gasto
            </button>
            </div>

            {/* Amount */}
            <div>
            <label className="block text-xs uppercase tracking-wider font-bold text-slate-500 mb-2">Monto</label>
            <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-lg">$</span>
                <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-9 pr-4 py-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-2xl font-bold text-slate-800 placeholder-slate-300 bg-white"
                placeholder="0"
                required
                autoFocus
                />
            </div>
            </div>

            {/* Responsible Member Selection */}
            <div>
            <label className="block text-xs uppercase tracking-wider font-bold text-slate-500 mb-2">Responsable</label>
            <div className="relative">
                <select
                    value={selectedMember}
                    onChange={(e) => setSelectedMember(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white appearance-none font-medium text-slate-700 cursor-pointer"
                >
                    {familyMembers.map(member => (
                        <option key={member} value={member}>{member}</option>
                    ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </div>
            </div>
            {familyMembers.length === 1 && (
                <p className="text-[10px] text-slate-400 mt-1 pl-1">Registrando a nombre de {familyMembers[0]}</p>
            )}
            </div>

            {/* Company / Source Field */}
            <div>
                <label className="block text-xs uppercase tracking-wider font-bold text-slate-500 mb-2">
                    {type === 'income' ? 'Empresa / Fuente de Ingreso' : 'Lugar / Beneficiario (Opcional)'}
                </label>
                <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        {type === 'income' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                            </svg>
                        )}
                    </div>
                    <input
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-medium text-slate-700 bg-white placeholder-slate-400"
                        placeholder={type === 'income' ? "Ej: Google Inc, Tienda, Cliente Juan..." : "Ej: Supermercado, Netflix..."}
                        required={type === 'income'} 
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Category */}
                <div>
                <label className="block text-xs uppercase tracking-wider font-bold text-slate-500 mb-2">Categoría</label>
                <div className="relative">
                    <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white appearance-none font-medium text-slate-700 cursor-pointer"
                    >
                    {(type === 'income' ? incomeCategories : expenseCategories).map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </div>
                </div>
                </div>

                {/* Date */}
                <div>
                <label className="block text-xs uppercase tracking-wider font-bold text-slate-500 mb-2">Fecha</label>
                <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-medium text-slate-700 cursor-pointer bg-white"
                    required
                />
                </div>
            </div>

            {/* Description / Notes */}
            <div>
            <label className="block text-xs uppercase tracking-wider font-bold text-slate-500 mb-2">Nota / Detalle (Opcional)</label>
            <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-medium text-slate-700 bg-white"
                placeholder={type === 'income' ? "Detalle adicional (Opcional)" : "Ej: Compra mensual, Pago de luz..."}
                required={type === 'expense'} 
            />
            </div>

            {/* Submit Button */}
            <div className="pt-4 pb-2">
                <button
                    onClick={handleSubmit}
                    type="submit"
                    className={`w-full py-4 rounded-xl text-white font-bold shadow-lg transition-all active:scale-[0.99] flex justify-center items-center gap-2 ${
                    type === 'income' 
                        ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' 
                        : 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
                    }`}
                >
                    {type === 'income' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" /></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
                    )}
                    {type === 'income' ? 'Registrar Ingreso' : 'Registrar Gasto'}
                </button>
            </div>
        </div>
      </form>
    </div>
  );
};