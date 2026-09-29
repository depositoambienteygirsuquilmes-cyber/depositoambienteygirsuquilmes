import { GoogleGenAI } from "@google/genai";
import { Tool, Transaction } from "../types";

export const getInventoryAnalysis = async (
  tools: Tool[],
  transactions: Transaction[],
  query: string
): Promise<string | null> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.warn("API Key missing");
      return "La API Key no está configurada. Contacte al administrador.";
    }

    const ai = new GoogleGenAI({ apiKey });

    // Format context data for the LLM
    const toolsContext = tools.map(t => 
      `- ${t.name} (Cat: ${t.category}): Stock ${t.stock} en ${t.location}`
    ).join("\n");

    // Taking the last 20 transactions (assuming they are sorted new to old)
    const transactionsContext = transactions.slice(0, 20).map(t => 
      `- ${new Date(t.date).toLocaleDateString()}: ${t.type} ${t.quantity} de ${t.toolName}`
    ).join("\n");

    const prompt = `
Contexto del Inventario actual:
${toolsContext}

Últimos movimientos registrados:
${transactionsContext}

Consulta del usuario: "${query}"

Responde como un asistente de pañol útil y conciso. Utiliza la información provista para responder.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: "Eres un asistente experto en gestión de inventario para un parque ecológico.",
      }
    });

    return response.text || "No se pudo generar una respuesta.";
  } catch (error) {
    console.error("Error consultando Gemini:", error);
    return "Lo siento, ocurrió un error al procesar tu consulta.";
  }
};
