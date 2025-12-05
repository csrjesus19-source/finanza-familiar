import React, { useState } from 'react';
import { Transaction } from '../types';
import { analyzeFinances } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

interface AIAdvisorProps {
  transactions: Transaction[];
}

export const AIAdvisor: React.FC<AIAdvisorProps> = ({ transactions }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    const result = await analyzeFinances(transactions);
    setAnalysis(result);
    setLoading(false);
  };

  return (
    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl shadow-lg p-8 text-white">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
            </svg>
            Asistente Financiero IA
          </h2>
          <p className="text-indigo-100 mb-6 max-w-xl">
            Utiliza nuestra inteligencia artificial para analizar tus patrones de gasto, identificar oportunidades de ahorro y recibir consejos personalizados sobre tus finanzas.
          </p>
        </div>
        
        {!analysis && (
            <button
            onClick={handleAnalyze}
            disabled={loading}
            className="bg-white text-indigo-600 px-6 py-3 rounded-full font-bold shadow-lg hover:bg-indigo-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                Analizando...
              </>
            ) : (
              'Ejecutar Análisis'
            )}
          </button>
        )}
      </div>

      {analysis && (
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mt-4 border border-white/20 animate-fade-in">
             <div className="prose prose-invert prose-p:text-indigo-50 prose-headings:text-white max-w-none">
                <ReactMarkdown>{analysis}</ReactMarkdown>
             </div>
             <div className="mt-6 flex justify-end">
                <button 
                    onClick={() => setAnalysis(null)}
                    className="text-sm text-indigo-200 hover:text-white underline"
                >
                    Cerrar análisis
                </button>
             </div>
        </div>
      )}
    </div>
  );
};