import React, { useState, useEffect } from 'react';
import { FamilyProfile } from '../types';

interface AuthScreenProps {
  onLogin: () => void;
  onRegisterFamily: (profile: FamilyProfile) => void;
  existingFamily: FamilyProfile | null;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin, onRegisterFamily, existingFamily }) => {
  const [step, setStep] = useState<'login' | 'register'>(existingFamily ? 'login' : 'register');
  
  // Register State
  const [familyName, setFamilyName] = useState('');
  const [members, setMembers] = useState<string[]>([]);
  const [newMember, setNewMember] = useState('');
  const [createPin, setCreatePin] = useState('');

  // Login State
  const [enteredPin, setEnteredPin] = useState('');
  const [error, setError] = useState('');

  // EFFECT: Automatically switch to login screen when family is successfully created/loaded
  useEffect(() => {
    if (existingFamily) {
        setStep('login');
    }
  }, [existingFamily]);

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMember.trim()) {
      setMembers([...members, newMember.trim()]);
      setNewMember('');
    }
  };

  const handleRegisterSubmit = () => {
    // Capture any pending member name in the input field that wasn't added with "+" yet
    const finalMembers = [...members];
    if (newMember.trim()) {
        finalMembers.push(newMember.trim());
    }

    if (familyName && finalMembers.length > 0 && createPin.length === 4) {
      onRegisterFamily({ familyName, members: finalMembers, pin: createPin });
      // The useEffect above will handle the transition to 'login'
    }
  };

  const removeMember = (index: number) => {
    setMembers(members.filter((_, i) => i !== index));
  };

  const verifyPin = () => {
    if (existingFamily && enteredPin === existingFamily.pin) {
      onLogin();
    } else {
      setError('PIN Incorrecto');
      setEnteredPin('');
    }
  };

  const handlePinChange = (val: string) => {
    // Only allow numbers and max 4 digits
    if (/^\d{0,4}$/.test(val)) {
        setEnteredPin(val);
        setError('');
    }
  };
  
  const handleCreatePinChange = (val: string) => {
      if (/^\d{0,4}$/.test(val)) {
          setCreatePin(val);
      }
  };

  // --- RENDER: REGISTER ---
  if (step === 'register') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 font-sans">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100">
          <div className="bg-indigo-700 p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
            <h1 className="text-3xl font-extrabold text-white mb-2 relative z-10">Crear Espacio</h1>
            <p className="text-indigo-200 relative z-10 font-medium">Configuración inicial de seguridad</p>
          </div>
          
          <div className="p-8 space-y-6">
            {/* Family Name Input */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <label className="block text-sm font-bold text-slate-700 mb-2">
                1. Identificador Principal
              </label>
              <input
                type="text"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                placeholder="Ej: Pérez"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-black font-bold text-lg placeholder-slate-400"
              />
               <div className="mt-2 text-xs text-slate-500 bg-white p-3 rounded-lg border border-slate-100 leading-relaxed">
                  <strong className="text-indigo-600 block mb-1">¿Qué debo colocar aquí?</strong>
                  <ul className="list-disc pl-4 space-y-1">
                      <li>Si vive solo: Coloque su <b>Apellido</b>.</li>
                      <li>Si son casados/familia: Coloque el <b>Apellido de la Familia</b>.</li>
                  </ul>
               </div>
            </div>

            {/* Members Input */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <label className="block text-sm font-bold text-slate-700 mb-2">2. Integrantes (Responsables)</label>
              <p className="text-xs text-slate-500 mb-3">Agregue las personas que registrarán ingresos o gastos.</p>
              
              <form onSubmit={handleAddMember} className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newMember}
                  onChange={(e) => setNewMember(e.target.value)}
                  placeholder="Nombre"
                  className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-black placeholder-slate-400"
                />
                <button 
                  type="submit"
                  disabled={!newMember.trim()}
                  className="bg-indigo-600 text-white w-12 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center text-xl shadow-md transition-transform active:scale-95"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </button>
              </form>

              {members.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                    {members.map((member, idx) => (
                    <span key={idx} className="bg-white text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm">
                        {member}
                        <button onClick={() => removeMember(idx)} className="text-slate-400 hover:text-rose-500 font-bold p-0.5 rounded-md hover:bg-rose-50 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3 h-3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </span>
                    ))}
                </div>
              )}
            </div>
            
            {/* PIN Input */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">3. Crear PIN de Acceso (4 dígitos)</label>
              <input
                type="password"
                inputMode="numeric"
                value={createPin}
                onChange={(e) => handleCreatePinChange(e.target.value)}
                placeholder="****"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-black placeholder-slate-300 font-bold tracking-[0.5em] text-center text-xl"
              />
            </div>

            <button
              onClick={handleRegisterSubmit}
              disabled={!familyName || (members.length === 0 && !newMember.trim()) || createPin.length !== 4}
              className="w-full bg-indigo-700 hover:bg-indigo-800 text-white py-4 rounded-xl font-bold text-lg shadow-xl shadow-indigo-200 transition-all disabled:opacity-50 disabled:shadow-none mt-4 active:scale-[0.99]"
            >
              Crear y Acceder
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER: LOGIN (SINGLE FAMILY ACCESS) ---
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-indigo-700 p-8 text-center relative">
            <div className="inline-block bg-white/10 backdrop-blur-sm px-4 py-1 rounded-full text-indigo-100 text-xs font-bold uppercase tracking-widest mb-3 border border-white/20">
              Espacio Seguro
           </div>
           <h2 className="text-3xl font-extrabold text-white tracking-tight">{existingFamily?.familyName}</h2>
           
            {/* Reset Button */}
           <button 
             onClick={() => {
                if(confirm("ATENCIÓN: ¿Estás seguro de ELIMINAR todo el espacio familiar? Se borrarán todos los datos y el PIN.")) {
                    localStorage.removeItem('finanzaInteligente_family');
                    localStorage.removeItem('finanzaInteligente_transactions');
                    window.location.reload(); 
                }
             }}
             className="absolute top-4 right-4 text-white/40 hover:text-white p-2 transition-colors"
             title="Resetear App"
           >
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
             </svg>
           </button>
        </div>

        {/* PIN Entry */}
        <div className="p-8 text-center bg-white">
            <p className="text-slate-500 font-medium mb-6">Ingresa el PIN de seguridad</p>

            <div className="mb-8">
                <input
                    type="password"
                    inputMode="numeric"
                    autoFocus
                    value={enteredPin}
                    onChange={(e) => handlePinChange(e.target.value)}
                    className="w-full px-4 py-4 border-2 border-slate-200 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none bg-white text-black font-extrabold tracking-[0.8em] text-center text-3xl transition-all"
                    placeholder="****"
                />
                {error && <p className="text-rose-500 text-sm font-bold mt-3 animate-pulse bg-rose-50 py-1 px-3 rounded-lg inline-block">{error}</p>}
            </div>

            <button 
                onClick={verifyPin}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-indigo-200 transition-all active:scale-[0.98]"
            >
                Entrar
            </button>
        </div>
      </div>
    </div>
  );
};