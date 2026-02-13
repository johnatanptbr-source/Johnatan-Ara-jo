
import { GoogleGenAI } from "@google/genai";
import { Employee, Punch, EmployeeStatus } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const GeminiService = {
  generateDailySummary: async (employees: Employee[], punches: Punch[]) => {
    const today = new Date().toISOString().split('T')[0];
    const todayPunches = punches.filter(p => p.timestamp.startsWith(today));
    
    const statusSummary = employees.map(emp => {
      const empPunches = todayPunches.filter(p => p.employeeId === emp.id);
      const hasIn = empPunches.some(p => p.type === 'IN');
      const hasOut = empPunches.some(p => p.type === 'OUT');
      return `${emp.name} (${emp.role}): Status ${emp.status}, Ponto: ${hasIn ? 'Entrada OK' : 'Sem Entrada'}, ${hasOut ? 'Saída OK' : 'Sem Saída'}`;
    }).join('\n');

    const prompt = `Analise os dados de presença de hoje e crie um resumo profissional e motivacional em português (máximo 150 palavras) para o gerente de RH. Destaque quem faltou e quem está de férias.
    Dados de hoje (${today}):
    ${statusSummary}`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { temperature: 0.7 }
      });
      return response.text;
    } catch (error) {
      console.error("Gemini summary error:", error);
      return "Não foi possível gerar o resumo inteligente no momento.";
    }
  }
};
