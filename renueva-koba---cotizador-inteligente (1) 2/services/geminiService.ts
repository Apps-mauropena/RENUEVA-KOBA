
import { GoogleGenAI, Type } from "@google/genai";
import { ProjectConfig, AIUpdates } from "../types";

export const processNaturalLanguage = async (prompt: string, currentConfig: ProjectConfig): Promise<AIUpdates | null> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = `
    Eres un asistente experto de la empresa "Renueva Koba". 
    Tu tarea es extraer cambios de configuración de un mensaje del usuario.
    Regresa un objeto JSON con los campos actualizados.
    
    REGLA IMPORTANTE: Para impermeabilizante, el rendimiento estándar es de 34 m2 por cubeta.
    
    Campos posibles:
    - m2: número
    - selectedMaterial: "Impermeabilizante" | "Pintura" | "Sellador"
    - yield: número (rendimiento del material seleccionado)
    - price: número (precio del material seleccionado)
    - brand: string (marca del material seleccionado)
    - profitRate: número (utilidad por cada m2)
    - numWorkers: número
    - workerDailyRate: número
    - workDays: número
    - scaffoldCount: número (cantidad de andamios)
    - scaffoldDailyRate: número (costo por día por andamio)
    - scaffoldDays: número (días de renta)
    - masonryRepairEnabled: boolean (si requiere reparaciones de albañilería)
    - masonryRepairCost: número (costo total de las reparaciones)

    Contexto actual: ${JSON.stringify(currentConfig)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            m2: { type: Type.NUMBER },
            selectedMaterial: { type: Type.STRING },
            yield: { type: Type.NUMBER },
            price: { type: Type.NUMBER },
            brand: { type: Type.STRING },
            profitRate: { type: Type.NUMBER },
            numWorkers: { type: Type.NUMBER },
            workerDailyRate: { type: Type.NUMBER },
            workDays: { type: Type.NUMBER },
            scaffoldCount: { type: Type.NUMBER },
            scaffoldDailyRate: { type: Type.NUMBER },
            scaffoldDays: { type: Type.NUMBER },
            masonryRepairEnabled: { type: Type.BOOLEAN },
            masonryRepairCost: { type: Type.NUMBER }
          }
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    
    const result = JSON.parse(text.trim());
    return result;
  } catch (error) {
    console.error("Gemini Error:", error);
    return null;
  }
};
