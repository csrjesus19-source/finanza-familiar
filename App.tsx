
import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, Category, TransactionType, FamilyProfile } from './types';
import { SummaryCard } from './components/SummaryCard';
import { TransactionForm } from './components/TransactionForm';
import { DashboardCharts } from './components/DashboardCharts';
import { AIAdvisor } from './components/AIAdvisor';
import { AuthScreen } from './components/AuthScreen';

type TimeRange = 'all' | 'month' | 'week' | 'today';

function App() {
  // --- STATE ---
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    // Start false to force PIN entry on reload, unless purely for persistence checks
    return false; 
  });

  const [familyProfile, setFamilyProfile] = useState<FamilyProfile | null>(() => {
    const saved = localStorage.getItem('finanzaInteligente_family');
    return saved ? JSON.parse(saved) : null;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('finanzaInteligente_transactions');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            // AUTO-REPAIR: Ensure all loaded transactions have an ID
            const repaired = parsed.map((t: any) => ({
                ...t,
                id: t.id || Date.now().toString() + Math.random().toString(36).substring(2)
            }));
            return repaired;
        } catch (e) {
            console.error("Error parsing saved transactions", e);
        }
    }
    return [];
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);

  const [filterType, setFilterType] = useState<'all' | TransactionType>('all');
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  
  // Settings State
  const [settingsNewMember, setSettingsNewMember] = useState('');

  // --- EFFECTS ---
  useEffect(() => {
    localStorage.setItem('finanzaInteligente_transactions', JSON.stringify(transactions));
  }, [transactions]);

  // --- HANDLERS ---
  const addTransaction = (transaction: Transaction) => {
    setTransactions(prev => [transaction, ...prev]);
  };

  const requestDeleteTransaction = (id: string) => {
    setTransactionToDelete(id);
  };

  const confirmDeleteTransaction = () => {
    if (transactionToDelete) {
        setTransactions(prev => prev.filter(t => t.id !== transactionToDelete));
        setTransactionToDelete(null);
    }
  };

  const handleRegisterFamily = (profile: FamilyProfile) => {
    // CRITICAL FIX: Save immediately to localStorage to prevent data loss on fast reload
    try {
        localStorage.setItem('finanzaInteligente_family', JSON.stringify(profile));
        setFamilyProfile(profile);
    } catch (error) {
        console.error("Error saving profile", error);
        alert("Hubo un error guardando los datos en el dispositivo. Verifique que no esté en modo incógnito.");
    }
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };
  
  const handleAddMember = (e: React.FormEvent) => {
      e.preventDefault();
      if (familyProfile && settingsNewMember.trim()) {
          const updatedProfile = {
              ...familyProfile,
              members: [...familyProfile.members, settingsNewMember.trim()]
          };
          // Save immediately
          localStorage.setItem('finanzaInteligente_family', JSON.stringify(updatedProfile));
          setFamilyProfile(updatedProfile);
          setSettingsNewMember('');
      }
  };

  const handleRemoveMember = (memberToRemove: string) => {
      if (!familyProfile) return;
      if (confirm(`¿Estás seguro de que deseas eliminar a ${memberToRemove}?`)) {
          const updatedProfile = {
              ...familyProfile,
              members: familyProfile.members.filter(m => m !== memberToRemove)
          };
          // Save immediately
          localStorage.setItem('finanzaInteligente_family', JSON.stringify(updatedProfile));
          setFamilyProfile(updatedProfile);
      }
  };

  // --- BACKUP & RESTORE HANDLERS ---
  const handleExportData = () => {
      if (!familyProfile) return;
      
      const dataToExport = {
          family: familyProfile,
          transactions: transactions,
          exportDate: new Date().toISOString()
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataToExport));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      const dateStr = new Date().toISOString().split('T')[0];
      downloadAnchorNode.setAttribute("download", `Respaldo_Finanza_${familyProfile.familyName}_${dateStr}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const content = e.target?.result as string;
              const parsedData = JSON.parse(content);

              if (parsedData.family && Array.isArray(parsedData.transactions)) {
                  if (confirm("ADVERTENCIA: Al importar, se sobrescribirán los datos actuales de este dispositivo con los de la copia de seguridad. ¿Desea continuar?")) {
                      // Update LocalStorage
                      localStorage.setItem('finanzaInteligente_family', JSON.stringify(parsedData.family));
                      localStorage.setItem('finanzaInteligente_transactions', JSON.stringify(parsedData.transactions));
                      
                      // Update State
                      setFamilyProfile(parsedData.family);
                      setTransactions(parsedData.transactions);
                      
                      alert("¡Datos restaurados correctamente!");
                      setIsSettingsOpen(false);
                  }
              } else {
                  alert("El archivo seleccionado no es una copia de seguridad válida.");
              }
          } catch (error) {
              console.error("Error importing data", error);
              alert("Ocurrió un error al leer el archivo. Asegúrese de que sea un archivo .json válido.");
          }
      };
      reader.readAsText(file);
      // Reset input
      event.target.value = '';
  };

  // --- CALCULATIONS ---
  const timeFilteredTransactions = useMemo(() => {
    const now = new Date();
    const toLocalYMD = (d: Date) => {
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    };
    
    const todayStr = toLocalYMD(now);

    return transactions.filter(t => {
        if (timeRange === 'all') return true;
        
        const tDate = new Date(t.date);
        const tDateStr = toLocalYMD(tDate);

        if (timeRange === 'today') {
            return tDateStr === todayStr;
        }

        if (timeRange === 'week') {
            const oneWeekAgo = new Date(now);
            oneWeekAgo.setDate(now.getDate() - 7);
            oneWeekAgo.setHours(0,0,0,0);
            return tDate >= oneWeekAgo;
        }

        if (timeRange === 'month') {
            return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
        }

        return true;
    });
  }, [transactions, timeRange]);

  const summary = useMemo(() => {
    const totalIncome = timeFilteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = timeFilteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const netSavings = totalIncome - totalExpense;
    
    const fixedCategories = [
        Category.VIVIENDA, 
        Category.SERVICIOS, 
        Category.DIEZMOS, 
        Category.TRANSPORTE, 
        Category.TRANSFERENCIAS
    ];
    
    const fixedExpenses = timeFilteredTransactions
      .filter(t => t.type === 'expense' && fixedCategories.includes(t.category as Category))
      .reduce((sum, t) => sum + t.amount, 0);

    return { totalIncome, totalExpense, netSavings, fixedExpenses };
  }, [timeFilteredTransactions]);

  // Calculate Financial Health Status
  const budgetStatus = useMemo(() => {
      if (summary.totalIncome === 0) return { status: 'neutral', topCategory: '' };
      
      const isOverBudget = summary.totalExpense > summary.totalIncome;
      const isNearBudget = summary.totalExpense >= (summary.totalIncome * 0.90) && !isOverBudget;
      
      let topCategory = '';
      if (isOverBudget || isNearBudget) {
          const expenseMap: Record<string, number> = {};
          timeFilteredTransactions
            .filter(t => t.type === 'expense')
            .forEach(t => {
                expenseMap[t.category] = (expenseMap[t.category] || 0) + t.amount;
            });
          
          topCategory = Object.keys(expenseMap).reduce((a, b) => expenseMap[a] > expenseMap[b] ? a : b, '');
      }

      if (isOverBudget) return { status: 'danger', topCategory };
      if (isNearBudget) return { status: 'warning', topCategory };
      return { status: 'healthy', topCategory: '' };

  }, [summary, timeFilteredTransactions]);


  const filteredListTransactions = timeFilteredTransactions.filter(t => {
      if (filterType === 'all') return true;
      return t.type === filterType;
  });

  // --- RENDER ---

  if (!isAuthenticated) {
      return (
        <AuthScreen 
            onRegisterFamily={handleRegisterFamily}
            onLogin={handleLogin}
            existingFamily={familyProfile}
        />
      );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 font-sans">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm backdrop-blur-md bg-white/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo & User Info */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:block bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white p-2.5 rounded-xl shadow-indigo-200 shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <div className="flex items-baseline gap-2">
                    <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-slate-800 leading-none">Finanza</span>
                    <span className="text-[10px] sm:text-xs font-semibold text-indigo-600 tracking-wider uppercase hidden sm:inline">Inteligente</span>
                </div>
                <div className="text-xs text-slate-500 font-medium flex items-center gap-1">
                   {familyProfile?.familyName} 
                   <span className="text-slate-300">•</span> 
                   <span className="text-indigo-600 font-bold">Panel Principal</span>
                </div>
              </div>
            </div>

            {/* Right Side Controls */}
            <div className="flex items-center gap-3">
               
               {/* Time Range Selector */}
               <div className="relative group hidden md:block w-40">
                  <select 
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value as TimeRange)}
                    className="appearance-none bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-sm rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-3 pr-8 py-2.5 font-semibold cursor-pointer transition-colors outline-none"
                  >
                    <option value="today">Hoy</option>
                    <option value="week">Semana</option>
                    <option value="month">Mes</option>
                    <option value="all">Todo</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
               </div>

                {/* New Transaction Button */}
                <button
                onClick={() => setIsModalOpen(true)}
                className="group bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 sm:px-4 sm:py-2.5 rounded-full shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 transition-all flex items-center gap-2 active:scale-95 border border-indigo-500"
                >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5 group-hover:rotate-90 transition-transform">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span className="font-bold text-sm hidden sm:inline">Nueva</span>
                </button>
                
                {/* Settings */}
                <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="text-slate-400 hover:text-indigo-600 p-2 transition-colors rounded-lg hover:bg-indigo-50"
                    title="Gestión Familiar"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l-.527-.738a1.125 1.125 0 0 1 .12-1.45l.774.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                </button>

                {/* Logout */}
                <button 
                  onClick={handleLogout}
                  className="text-slate-400 hover:text-rose-500 p-2 transition-colors rounded-lg hover:bg-rose-50"
                  title="Bloquear / Salir"
                >
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                   </svg>
                </button>
            </div>
          </div>
          
          {/* Mobile Time Range */}
          <div className="md:hidden pb-4">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {(['today', 'week', 'month', 'all'] as const).map((range) => (
                      <button
                        key={range}
                        onClick={() => setTimeRange(range)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap border ${
                            timeRange === range 
                            ? 'bg-slate-800 text-white border-slate-800' 
                            : 'bg-white text-slate-500 border-slate-200'
                        }`}
                      >
                        {range === 'today' && 'Hoy'}
                        {range === 'week' && 'Semana'}
                        {range === 'month' && 'Mes'}
                        {range === 'all' && 'Todo'}
                      </button>
                  ))}
              </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Summary */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <SummaryCard 
            title="Ingresos" 
            amount={summary.totalIncome} 
            icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>}
            colorClass="bg-emerald-500"
          />
          <SummaryCard 
            title="Gastos" 
            amount={summary.totalExpense} 
            icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" /></svg>}
            colorClass="bg-rose-500"
          />
          <SummaryCard 
            title="Gastos Fijos" 
            amount={summary.fixedExpenses} 
            icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>}
            colorClass="bg-blue-500"
            subtext="Vivienda, Servicios, Diezmos..."
          />
          <SummaryCard 
            title="Ahorro Neto" 
            amount={summary.netSavings} 
            icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 0 1 9-9" /></svg>}
            colorClass="bg-indigo-500"
          />
        </section>

        {/* Warning System */}
        {(budgetStatus.status === 'danger' || budgetStatus.status === 'warning') && (
            <div className={`p-5 rounded-2xl border-l-8 shadow-sm flex items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-300 ${
                budgetStatus.status === 'danger' 
                    ? 'bg-red-50 border-red-500 text-red-900' 
                    : 'bg-amber-50 border-amber-400 text-amber-900'
            }`}>
               <div className={`p-3 rounded-full flex-shrink-0 ${
                   budgetStatus.status === 'danger' ? 'bg-red-200/50 text-red-600' : 'bg-amber-200/50 text-amber-600'
               }`}>
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                   </svg>
               </div>
               <div>
                  <h4 className="font-bold text-lg mb-1">
                      {budgetStatus.status === 'danger' 
                        ? '¡Alerta Crítica! Tus gastos han superado tus ingresos.' 
                        : '¡Advertencia! Estás muy cerca de superar tu presupuesto.'}
                  </h4>
                  <p className="text-sm opacity-90 leading-relaxed">
                      Recomendamos revisar urgentemente tus finanzas. 
                      {budgetStatus.topCategory && (
                          <span> Actualmente, la categoría donde más estás gastando dinero es <strong className="uppercase bg-white/50 px-1 rounded">{budgetStatus.topCategory}</strong>.</span>
                      )}
                  </p>
               </div>
            </div>
        )}

        {/* AI Section */}
        <section className="animate-fade-in-up">
          <AIAdvisor transactions={timeFilteredTransactions} />
        </section>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
          {/* Charts */}
          <div className="lg:col-span-3">
             <DashboardCharts transactions={timeFilteredTransactions} />
          </div>

          {/* List */}
          <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center bg-slate-50/50 gap-4">
              <div className="flex items-center gap-3">
                 <h3 className="font-bold text-slate-800 text-lg">
                    {timeRange === 'all' && 'Historial Completo'}
                    {timeRange === 'month' && 'Movimientos del Mes'}
                    {timeRange === 'week' && 'Movimientos de la Semana'}
                    {timeRange === 'today' && 'Movimientos de Hoy'}
                 </h3>
                 <span className="text-xs font-bold text-slate-500 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full">{filteredListTransactions.length}</span>
              </div>
              
              {/* Filter Tabs */}
              <div className="flex p-1 bg-slate-200/50 rounded-lg">
                  <button 
                    onClick={() => setFilterType('all')}
                    className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${filterType === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Todos
                  </button>
                  <button 
                    onClick={() => setFilterType('income')}
                    className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${filterType === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Ingresos
                  </button>
                  <button 
                    onClick={() => setFilterType('expense')}
                    className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${filterType === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Gastos
                  </button>
              </div>
            </div>

            <div className="max-h-[600px] overflow-y-auto">
              {filteredListTransactions.length === 0 ? (
                <div className="p-16 text-center text-slate-400 flex flex-col items-center">
                  <div className="bg-slate-50 p-4 rounded-full mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 opacity-50">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    </svg>
                  </div>
                  <p className="text-slate-500 font-medium">No se encontraron transacciones en este periodo.</p>
                  {transactions.length === 0 && (
                      <button onClick={() => setIsModalOpen(true)} className="mt-2 text-indigo-600 text-sm font-bold hover:underline">
                        ¡Crea tu primera transacción ahora!
                      </button>
                  )}
                </div>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-400 uppercase bg-slate-50/50 sticky top-0 backdrop-blur-sm z-10">
                    <tr>
                      <th className="px-6 py-4 font-semibold tracking-wider">Fecha</th>
                      <th className="px-6 py-4 font-semibold tracking-wider">Responsable</th>
                      <th className="px-6 py-4 font-semibold tracking-wider">Descripción / Empresa</th>
                      <th className="px-6 py-4 font-semibold tracking-wider">Categoría</th>
                      <th className="px-6 py-4 font-semibold tracking-wider text-right">Monto</th>
                      <th className="px-4 py-4 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredListTransactions.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-6 py-4 text-slate-500 whitespace-nowrap font-medium">
                          {/* Display Local Date */}
                          {new Date(t.date).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })}
                          <span className="block text-[10px] text-slate-300">
                             {new Date(t.date).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold">
                                    {t.createdBy ? t.createdBy.charAt(0).toUpperCase() : '?'}
                                </div>
                                <span className="text-slate-600 font-medium">{t.createdBy || 'Anon'}</span>
                            </div>
                        </td>
                        <td className="px-6 py-4 text-slate-700 transition-colors">
                          <div className="flex flex-col">
                            {t.company && (
                                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                                    {t.type === 'income' && (
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-emerald-500">
                                            <path fillRule="evenodd" d="M4 4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-5L9 4H4Zm7 5a1 1 0 1 0-2 0v1H8a1 1 0 1 0 0 2h1v1a1 1 0 1 0 2 0v-1h1a1 1 0 1 0 0-2h-1V9Z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                    {t.company}
                                </span>
                            )}
                            <span className={`${t.company ? 'text-xs text-slate-500 font-medium mt-0.5' : 'font-semibold'}`}>
                                {t.description}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-[11px] font-bold border uppercase tracking-wide ${
                            t.type === 'income' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {t.category}
                          </span>
                        </td>
                        <td className={`px-6 py-4 text-right font-bold whitespace-nowrap text-base ${
                          t.type === 'income' ? 'text-emerald-600' : 'text-slate-800'
                        }`}>
                          {t.type === 'income' ? '+' : '-'} {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(t.amount)}
                        </td>
                        <td className="px-4 py-4 text-right relative z-10">
                            <button 
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    requestDeleteTransaction(t.id);
                                }}
                                className="bg-rose-50 text-rose-500 hover:text-white hover:bg-rose-600 transition-all p-2.5 rounded-lg shadow-sm border border-rose-100 cursor-pointer active:scale-95"
                                title="Eliminar registro"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                </svg>
                            </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        </div>
      </main>

      {/* Modal for New Transaction */}
      {isModalOpen && familyProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 h-full max-h-[90vh] flex flex-col">
              <TransactionForm 
                onAddTransaction={addTransaction} 
                onClose={() => setIsModalOpen(false)}
                familyMembers={familyProfile.members}
              />
           </div>
        </div>
      )}

      {/* NEW: Custom Delete Confirmation Modal */}
      {transactionToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 p-6 text-center">
                <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-600">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">¿Eliminar registro?</h3>
                <p className="text-slate-500 mb-6 text-sm">Esta acción es irreversible y afectará a sus balances y gráficas.</p>
                <div className="flex gap-3">
                    <button 
                        onClick={() => setTransactionToDelete(null)}
                        className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={confirmDeleteTransaction}
                        className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-lg shadow-rose-200 transition-colors"
                    >
                        Sí, Eliminar
                    </button>
                </div>
            </div>
        </div>
      )}
      
      {/* Modal for Settings */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
              <div className="bg-white p-6 border-b border-slate-100 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Gestión Familiar</h3>
                    <p className="text-xs text-slate-500">Agrega miembros o sincroniza datos</p>
                  </div>
                  <button 
                    onClick={() => setIsSettingsOpen(false)}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
              </div>
              
              <div className="p-6 max-h-[70vh] overflow-y-auto">
                 {/* Backup & Restore Section */}
                 <div className="mb-8 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                        </svg>
                        Sincronización y Respaldo
                    </h4>
                    <p className="text-xs text-slate-500 mb-4">
                        Descarga una copia para llevar tus datos a otro dispositivo.
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            onClick={handleExportData}
                            className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-xl hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 transition-all gap-1"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                            </svg>
                            <span className="text-xs font-bold">Descargar Copia</span>
                        </button>
                        
                        <label className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-xl hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 transition-all gap-1 cursor-pointer">
                            <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v12m-9-3 9 3 9-3" className="hidden" /> {/* Swap icon logic visually if desired */}
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
                            </svg>
                            <span className="text-xs font-bold">Restaurar Copia</span>
                        </label>
                    </div>
                 </div>

                 {/* Members Section */}
                 <div className="mb-6">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Agregar Nuevo Miembro</label>
                    <form onSubmit={handleAddMember} className="flex gap-2">
                        <input 
                            type="text" 
                            value={settingsNewMember}
                            onChange={(e) => setSettingsNewMember(e.target.value)}
                            className="flex-1 px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-black placeholder-slate-400"
                            placeholder="Nombre"
                        />
                        <button 
                            type="submit"
                            disabled={!settingsNewMember.trim()}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-200"
                        >
                            Agregar
                        </button>
                    </form>
                 </div>
                 
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Miembros Actuales</label>
                    <div className="space-y-2">
                        {familyProfile?.members.map(member => (
                            <div key={member} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100 group hover:border-indigo-100 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-indigo-600">
                                        {member.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="font-medium text-slate-700">{member}</span>
                                </div>
                                <button 
                                    onClick={() => handleRemoveMember(member)}
                                    className="text-slate-300 hover:text-rose-500 transition-colors p-1"
                                    title="Eliminar miembro"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

export default App;
