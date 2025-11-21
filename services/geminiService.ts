import { GoogleGenAI, Type } from "@google/genai";
import { ActionType, IntentResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeUserIntent = async (userMessage: string): Promise<IntentResponse> => {
  try {
    const prompt = `
      You are an IT Support Assistant for Mondelez International.
      The user is asking for help. Classify their intent into one of the following categories:
      - GET_BITLOCKER: User needs recovery key, bitlocker key, locked out of laptop.
      - WIPE: User wants to wipe, factory reset, or format a device (lost/stolen).
      - RESET_PASSCODE: User forgot phone pin, passcode, needs to unlock mobile device.
      - RETIRE: Remove company data but keep personal data.
      - NONE: General greeting or unclear request.

      If the intent is clear, provide a short friendly confirmation message asking them to select the device.
      If unclear, ask for clarification.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `System: ${prompt}\nUser: ${userMessage}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            intent: {
              type: Type.STRING,
              enum: [
                ActionType.GET_BITLOCKER,
                ActionType.WIPE,
                ActionType.RESET_PASSCODE,
                ActionType.RETIRE,
                ActionType.NONE
              ]
            },
            reasoning: { type: Type.STRING },
            confirmationMessage: { type: Type.STRING }
          },
          required: ["intent", "confirmationMessage"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as IntentResponse;
    }
    
    return {
        intent: ActionType.NONE,
        reasoning: "Failed to parse",
        confirmationMessage: "I'm sorry, I didn't catch that. Could you try asking differently?"
    };

  } catch (error) {
    console.error("Gemini API Error", error);
    return {
      intent: ActionType.NONE,
      reasoning: "Error",
      confirmationMessage: "I'm having trouble connecting to the AI service. Please use the buttons below."
    };
  }
};