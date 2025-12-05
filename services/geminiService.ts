import { GoogleGenAI } from "@google/genai";
import { Transaction } from "../types";

const apiKey = process.env.API_KEY || '';

// Initialize the client
const ai = new GoogleGenAI({ apiKey });

export const analyzeFinances = async (transactions: Transaction[]): Promise<string> => {
  if (!apiKey) {
    return "Error: API Key no encontrada. Por favor configure su clave de API.";
  }

  if (transactions.length === 0) {
    return "No hay transacciones suficientes para realizar un análisis. Por favor registre algunos ingresos y gastos.";
  }

  const transactionData = JSON.stringify(transactions);

  const prompt = `
    Actúa como un experto asesor financiero personal. Analiza la siguiente lista de transacciones financieras (ingresos y gastos) en formato JSON.
    
    Datos: ${transactionData}
    
    Por favor, genera un reporte breve y directo en español que incluya:
    1. Un resumen del estado actual (Salud financiera).
    2. Identificación de patrones de gasto excesivo (si los hay).
    3. Recomendaciones específicas para mejorar el ahorro basado en las categorías 'Vivienda', 'Transporte', 'Servicios', 'Alimentos', 'Transferencias', 'Diezmos'.
    4. Un consejo motivacional corto.

    Usa formato Markdown para resaltar puntos clave.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    return response.text || "No se pudo generar el análisis en este momento.";
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "Ocurrió un error al conectar con la Inteligencia Artificial. Intente nuevamente más tarde.";
  }
};